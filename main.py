import csv
import io
import sqlite3
import psycopg2
from urllib.parse import quote, urlsplit, urlunsplit, parse_qs, urlencode
from gtts import gTTS
from fastapi import FastAPI, Request
from fastapi.responses import RedirectResponse, JSONResponse, PlainTextResponse, Response
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.middleware.sessions import SessionMiddleware
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, AIMessage
from deep_translator import GoogleTranslator
import os
import joblib
import json
import pandas as pd
from difflib import get_close_matches
from dotenv import load_dotenv
load_dotenv()

# NOTE: Summary (page 4 AI briefing) and Chatbot now use SEPARATE Groq API keys.
# If the dedicated keys aren't set in .env, both fall back to GROQ_API_KEY so
# nothing breaks for existing setups.
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_API_KEY_SUMMARY = os.getenv("GROQ_API_KEY_SUMMARY", GROQ_API_KEY)
GROQ_API_KEY_CHAT = os.getenv("GROQ_API_KEY_CHAT", GROQ_API_KEY)
SECRET_KEY = os.getenv("SECRET_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")

app = FastAPI()
if not SECRET_KEY:
    print("WARNING: SECRET_KEY is not set in .env - using a temporary secret key. "
          "Sessions will be invalidated every time the server restarts. "
          "Set SECRET_KEY in your .env for production use.")
    import secrets as _secrets
    SECRET_KEY = _secrets.token_hex(32)
app.add_middleware(SessionMiddleware, secret_key=SECRET_KEY)
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")
templates.env.cache = None  # Workaround for Jinja2/Python 3.14 cache bug (TypeError: unhashable type: 'dict')


llm_summary = ChatGroq(model="llama-3.3-70b-versatile", api_key=GROQ_API_KEY_SUMMARY, max_tokens=8192)
llm_chat = ChatGroq(model="llama-3.3-70b-versatile", api_key=GROQ_API_KEY_CHAT, max_tokens=2048)

def ask_ai(prompt):
    """Call Groq for the Page 4 scheme summary/briefing."""
    try:
        response = llm_summary.invoke([HumanMessage(content=prompt)])
        content = response.content
        print("Groq (summary) response:", content)
        return content

    except Exception as e:
        return f"AI Exception: {str(e)}"


def ask_chatbot(user_message, history=None):
    """Function to call Groq (chatbot key) for the site-wide chatbot widget.

    history: optional list of {"role": "user"|"assistant", "content": "..."} dicts
    representing prior turns in the conversation, oldest first.
    """
    try:
        messages = []
        if history:
            for turn in history:
                role = turn.get("role")
                content = turn.get("content", "")
                if not content:
                    continue
                if role == "assistant":
                    messages.append(AIMessage(content=content))
                else:
                    messages.append(HumanMessage(content=content))

        messages.append(HumanMessage(content=user_message))

        response = llm_chat.invoke(messages)
        content = response.content
        print("Groq (chat) response:", content)
        return content

    except Exception as e:
        return f"AI Exception: {str(e)}"


TRANSLATIONS_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "translations.json")
try:
    with open(TRANSLATIONS_PATH, "r", encoding="utf-8") as _f:
        STATIC_TRANSLATIONS = json.load(_f)
    print(f"Loaded {len(STATIC_TRANSLATIONS)} pre-translated strings from translations.json")
except FileNotFoundError:
    STATIC_TRANSLATIONS = {}
    print("WARNING: translations.json not found - all translations will hit the live "
          "API + SQLite cache. Run extract_translations.py to generate it.")


# ---------------- SQLITE DATABASE (feedback + translation cache) ----------------
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "translation_cache.db")

def init_translation_cache_db():
    """Create the translation cache table if it doesn't already exist.

    Stores the RAW translated string only (never the "(English)" suffixed
    version t() adds on top) so t() and t_clean() can both read from the
    same cached row instead of doubling up on entries.
    """
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS translations (
            source_text TEXT NOT NULL,
            lang TEXT NOT NULL,
            translated_text TEXT NOT NULL,
            PRIMARY KEY (source_text, lang)
        )
    """)
    conn.commit()
    conn.close()

init_translation_cache_db()


def get_or_translate(text, lang):
    """Return the translation of `text` into `lang`.

    Lookup order:
    1. STATIC_TRANSLATIONS (translations.json, pre-built and shipped with the
       code) - instant, no I/O, works identically on Render since it's part
       of the deployed repo.
    2. SQLite cache (feedback.db) - fine locally, but ephemeral on Render's
       free tier (wiped on restart/redeploy), so only a fallback.
    3. Live GoogleTranslator call - only reached for text that's genuinely
       new (e.g. freshly generated AI content) or wasn't pre-built yet.
    """
    static = STATIC_TRANSLATIONS.get(text, {}).get(lang)
    if static:
        return static

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute(
        "SELECT translated_text FROM translations WHERE source_text = ? AND lang = ?",
        (text, lang)
    )
    row = cur.fetchone()
    if row:
        conn.close()
        return row[0]

    try:
        translated = GoogleTranslator(source="en", target=lang).translate(text)
    except Exception:
        conn.close()
       
        return text

    cur.execute(
        "INSERT OR REPLACE INTO translations (source_text, lang, translated_text) VALUES (?, ?, ?)",
        (text, lang, translated)
    )
    conn.commit()
    conn.close()
    return translated


# ---------------- TRANSLATION FUNCTION ----------------
def t(text, lang):
    if not text or lang == "en":
        return text
    translated = get_or_translate(text, lang)
    return f"{translated} ({text})"

# Expose t() to Jinja templates so shared layout text (base.html navbar,
# disclaimer, chat widget) can be translated too, not just page-specific labels.
templates.env.globals["t"] = t

# ---------------- CSV SCHEMES ----------------
schemes_df = pd.read_csv("test.csv")
numeric_columns = ["min_age", "max_age", "min_income", "max_income"]
for col in numeric_columns:
    schemes_df[col] = pd.to_numeric(schemes_df[col], errors="coerce").fillna(0)

model = joblib.load("scheme_model.pkl")

# ---------------- FEEDBACK DATABASE (Postgres - persists across redeploys) ----------------
def get_feedback_db_connection():
    """Open a new connection to the Postgres feedback database."""
    return psycopg2.connect(DATABASE_URL)

def init_feedback_db():
    """Create the feedback table in Postgres if it doesn't already exist.

    Columns match the actual fields submitted by feedback.html's form
    (name, email, category, message). SERIAL is Postgres's equivalent of
    SQLite's INTEGER PRIMARY KEY AUTOINCREMENT.
    """
    conn = get_feedback_db_connection()
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS feedback (
            id SERIAL PRIMARY KEY,
            name TEXT,
            email TEXT,
            category TEXT,
            message TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    cur.close()
    conn.close()

init_feedback_db()

# ---------------- SALARY / INCOME BRACKETS (single source of truth) ----------------

SALARY_RANGES = [
    {"label": "No Income", "min": 0, "max": 0},
    {"label": "Below ₹1,00,000", "min": 0, "max": 100000},
    {"label": "₹1,00,000 – ₹2,50,000", "min": 100000, "max": 250000},
    {"label": "₹2,50,001 – ₹5,00,000", "min": 250001, "max": 500000},
    {"label": "₹5,00,001 – ₹10,00,000", "min": 500001, "max": 1000000},
    {"label": "Above ₹10,00,000", "min": 1000000, "max": 10000000},
]

WEIGHTS = {
    "state": 4,
    "income": 4,
    "occupation": 8,
    "age": 3,
    "gender": 2,
    "caste": 2,
    "minority": 2,
    "disability": 2,
    "marital_status": 1,
    "residence": 1
}
MAX_SCORE = sum(WEIGHTS.values())


# ---------------- ELIGIBILITY CHECK ----------------

def normalize(value):
    if value is None:
        return ""

    value = str(value).lower().strip()
    value = value.replace("-", " ")
    value = " ".join(value.split())

    return value


SALARY_MAP_NORMALIZED = {normalize(r["label"]): (r["min"], r["max"]) for r in SALARY_RANGES}
SALARY_MAP_EXACT = {r["label"]: (r["min"], r["max"]) for r in SALARY_RANGES}

def is_eligible(user, scheme):
    # -------- USER VALUES --------
    user_state = normalize(user.get("state"))
    user_gender = normalize(user.get("gender"))
    user_caste = normalize(user.get("caste"))
    user_minority = normalize(user.get("minority"))
    user_disability = normalize(user.get("disabled", "no"))
    user_marital = normalize(user.get("marital_status"))
    user_occupation = normalize(user.get("occupation"))
    user_residence = normalize(user.get("residence"))
    user_age = int(user.get("age", 0))

    # -------- SCHEME VALUES --------
    scheme_state = normalize(scheme.get("state", "all"))
    scheme_gender = normalize(scheme.get("gender", "all"))
    scheme_caste = normalize(scheme.get("caste", "all"))
    scheme_minority = normalize(scheme.get("minority", "all"))
    scheme_disability = normalize(scheme.get("disability", "all"))
    scheme_marital = normalize(scheme.get("marital_status", "all"))
    scheme_residence = normalize(scheme.get("residence", "both"))
    scheme_occupation = normalize(scheme.get("occupation", "all"))

    min_age = int(scheme.get("min_age", 0))
    max_age = int(scheme.get("max_age", 120))

    if not (min_age <= user_age <= max_age):
        return False

    if scheme_state not in ["all", "state", user_state]:
        return False

    if scheme_gender not in ["all", user_gender]:
        return False

    if scheme_caste not in ["all", user_caste]:
        return False

    if scheme_minority not in ["all", user_minority]:
        return False

    if scheme_disability not in ["all", user_disability]:
        return False

    if scheme_marital not in ["all", user_marital]:
        return False

    if scheme_residence not in ["both", user_residence]:
        return False

    if scheme_occupation != "all":

        occ_list = [normalize(o) for o in scheme_occupation.split(",")]

        occupation_map = {
            "entrepreneur": ["entrepreneur", "self employed"],
            "self employed": ["self employed", "entrepreneur"],
            "private employee": ["private employee", "employed"],
            "government employee": ["government employee", "employed"],
            "daily wage worker": ["daily wage worker"]
        }

        allowed_user_types = occupation_map.get(user_occupation, [user_occupation])

        if not any(o in occ_list for o in allowed_user_types):
            return False

    user_salary_range = SALARY_MAP_NORMALIZED.get(normalize(user.get("salary", "No Income")), (0, 0))
    user_salary_mid = (user_salary_range[0] + user_salary_range[1]) / 2

    income_flag = normalize(scheme.get("income_limit_flag", "none"))

    if income_flag == "specific":

        min_income = float(scheme.get("min_income", 0))
        max_income = float(scheme.get("max_income", 999999999))

        if not (min_income <= user_salary_mid <= max_income):
            return False

    return True
# Weighted score used to rank eligible schemes (higher = better match for this user)
def calculate_priority(user, scheme):
    score = 0

    user_salary_range = SALARY_MAP_EXACT.get(user.get('salary', 'No Income'), (0, 0))
    user_salary_mid = (user_salary_range[0] + user_salary_range[1]) / 2

    if scheme['state'].lower() == user['state'].lower():
        score += WEIGHTS["state"]
    elif scheme['state'].lower() == "all":
        score += WEIGHTS["state"] * 0.5

    if scheme.get('income_limit_flag', 'NONE').upper() == "SPECIFIC":
        if scheme['min_income'] <= user_salary_mid <= scheme['max_income']:
            score += WEIGHTS["income"]
    else:
        score += WEIGHTS["income"] * 0.5

    if scheme['occupation'].lower() == user['occupation'].lower():
        score += WEIGHTS["occupation"]
    elif scheme['occupation'].lower() == "all":
        score += WEIGHTS["occupation"] * 0.5

    if scheme['min_age'] <= int(user['age']) <= scheme['max_age']:
        score += WEIGHTS["age"]

    if scheme['gender'].lower() in [user['gender'].lower(), "all"]:
        score += WEIGHTS["gender"]

    if scheme['caste'].lower() in [user['caste'].lower(), "all"]:
        score += WEIGHTS["caste"]

    if scheme.get('minority', 'all').lower() in [user['minority'].lower(), "all"]:
        score += WEIGHTS["minority"]

    if scheme.get('disabled', 'all').lower() in [user['disabled'].lower(), "all"]:
        score += WEIGHTS["disability"]

    if scheme.get('marital_status', 'all').lower() in [user.get('marital_status', '').lower(), "all"]:
        score += WEIGHTS["marital_status"]

    if scheme.get('residence', 'both').lower() in [user['residence'].lower(), "both"]:
        score += WEIGHTS["residence"]

    return round(score / MAX_SCORE, 3)

# ---------------- LANGUAGE SWITCHER ----------------
SUPPORTED_LANGS = {"en", "hi", "mr", "kn", "gu", "ta", "te", "bn", "ml", "pa", "or", "as", "ur"}

@app.get("/set-language/{lang_code}")
async def set_language(request: Request, lang_code: str):
    """Sets the site-wide language in the session and sends the user back
    to whichever page they picked the language from (used by the navbar
    language dropdown in base.html)."""
    if lang_code not in SUPPORTED_LANGS:
        lang_code = "en"
    request.session["lang"] = lang_code

    referer = request.headers.get("referer")
    if referer:
        
        parsed = urlsplit(referer)
        query = parse_qs(parsed.query)
        query.pop("lang", None)
        clean_referer = urlunsplit(parsed._replace(query=urlencode(query, doseq=True)))
        return RedirectResponse(url=clean_referer, status_code=302)
    return RedirectResponse(url=request.url_for("home"), status_code=302)


# ---------------- PAGE 1 ----------------
@app.api_route("/", methods=["GET", "POST"])
async def home(request: Request):
    lang = request.session.get("lang") or request.query_params.get("lang", "en")
    if request.method == "POST":
        form = await request.form()
        
        lang = form.get("language") or request.session.get("lang", "en")
        request.session["lang"] = lang
        return RedirectResponse(url=request.url_for("page2"), status_code=302)
    labels = {"title": t("Yojana Sarathi - Home", lang)}
    return templates.TemplateResponse("page1.html", {"request": request, "labels": labels, "lang": lang})

# ---------------- ABOUT US ----------------
@app.get("/about")
async def about(request: Request):
    lang = request.session.get("lang") or request.query_params.get("lang", "en")
    return templates.TemplateResponse("about.html", {"request": request, "lang": lang})

# ---------------- FEEDBACK ----------------
@app.api_route("/feedback", methods=["GET", "POST"])
async def feedback(request: Request):
    lang = request.session.get("lang") or request.query_params.get("lang", "en")

    if request.method == "POST":
        form = await request.form()
        name = form.get("name")
        email = form.get("email")
        category = form.get("category")
        message = form.get("message")

        conn = get_feedback_db_connection()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO feedback (name, email, category, message) VALUES (%s, %s, %s, %s)",
            (name, email, category, message)
        )
        conn.commit()
        cur.close()
        conn.close()

        return RedirectResponse(url=request.url_for("home"), status_code=302)

    return templates.TemplateResponse("feedback.html", {"request": request, "lang": lang})


# ---------------- PAGE 2 ----------------
@app.api_route("/page2", methods=["GET", "POST"])
async def page2(request: Request):
    lang = request.session.get("lang") or request.query_params.get("lang", "en")

    labels = {
        # --- UI Text Labels ---
        "title": t("Basic Information", lang),
        "subtitle": t("Please fill in your details to find eligible government schemes.", lang),
        "personal_info": t("Personal Info", lang),
        "social_category": t("Social Category", lang),
        "economic_info": t("Economic Info", lang),
        "state": t("State", lang),
        "gender": t("Gender", lang),
        "age": t("Age", lang),
        "caste": t("Caste", lang),
        "residence": t("Residence", lang),
        "occupation": t("Occupation", lang),
        "salary": t("Annual Salary", lang),
        "minority": t("Minority", lang),
        "disabled": t("Differently Abled", lang),
        "marital_status": t("Marital Status", lang),
        "select": t("Select", lang),
        "submit": t("Find Your Schemes", lang),

        # --- Voice Prompt Labels (Used by speak() in page2.html) ---
        "prompt_greet": t_clean("I will help you fill this form. Please tell me your state.", lang),
        "prompt_gender": t_clean("Please tell your gender.", lang),
        "prompt_age": t_clean("Please tell your age.", lang),
        "prompt_marital": t_clean("What is your marital status?", lang),
        "prompt_caste": t_clean("What is your caste category?", lang),
        "prompt_minority": t_clean("Do you belong to a minority? Say yes or no.", lang),
        "prompt_disabled": t_clean("Are you disabled? Say yes or no.", lang),
        "prompt_salary": t_clean("What is your annual salary?", lang),
        "prompt_occupation": t_clean("What is your occupation?", lang),
        "prompt_residence": t_clean("Do you live in rural or urban area?", lang),
        "prompt_finish": t_clean("Thank you. Submitting your form now.", lang),
        "repeat_phrase": t_clean("Sorry, I didn't catch that. Could you please repeat?", lang)
    }

    # Dropdown options
    states = [
        "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa",
        "Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala",
        "Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland",
        "Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura",
        "Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu & Kashmir","Ladakh"
    ]
    castes = ["Scheduled Tribe (ST)","Scheduled Caste (SC)","General","OBC","PVTG"]
    genders = ["Male","Female","Other"]
    yes_no = ["Yes","No"]
    residence_types = ["Urban","Rural"]
    occupations = [
        "Student","Farmer","Self Employed","Private Employee",
        "Government Employee","Unemployed","Daily Wage Worker","Other"
    ]
    salary_ranges = SALARY_RANGES
    marital_status = ["Married","Unmarried","Widow"]

    # Translate dropdowns
    states_display = [t(s, lang) for s in states]
    castes_display = [t(c, lang) for c in castes]
    genders_display = [t(g, lang) for g in genders]
    yes_no_display = [t(y, lang) for y in yes_no]
    residence_display = [t(r, lang) for r in residence_types]
    occupations_display = [t(o, lang) for o in occupations]
    salary_display = [t(s["label"], lang) for s in salary_ranges]
    marital_status_display = [t(m, lang) for m in marital_status]

    data = {
        "states": states_display,
        "castes": castes_display,
        "genders": genders_display,
        "yes_no": yes_no_display,
        "residence_types": residence_display,
        "occupations": occupations_display,
        "marital_status": marital_status_display,
        "salary_ranges": salary_display,
    }

    if request.method == "POST":
        form = await request.form()
        selected_salary_label = form.get("salary")
        selected_salary = next((s for s in salary_ranges if t(s["label"], lang) == selected_salary_label), {"min":0, "max":0})

        raw_data = {
            "state": states[states_display.index(form.get("state"))],
            "caste": castes[castes_display.index(form.get("caste"))],
            "gender": genders[genders_display.index(form.get("gender"))],
            "residence": residence_types[residence_display.index(form.get("residence"))],
            "occupation": occupations[occupations_display.index(form.get("occupation"))],
            "marital_status": marital_status[marital_status_display.index(form.get("marital_status"))],
            "salary": selected_salary["label"],
            "salary_min": selected_salary["min"],
            "salary_max": selected_salary["max"],
            "minority": yes_no[yes_no_display.index(form.get("minority"))],
            "disabled": yes_no[yes_no_display.index(form.get("disabled"))],
            "age": form.get("age")
        }
        request.session["user_data"] = raw_data
        request.session["lang"] = lang
        return RedirectResponse(url=request.url_for("page3"), status_code=302)

    return templates.TemplateResponse("page2.html", {"request": request, "labels": labels, **data, "lang": lang})

# ---------------- PAGE 3 ----------------

@app.get("/page3")
async def page3(request: Request):
    lang = request.session.get("lang", "en")
    user_data = request.session.get("user_data", {})

    # ---- Translation helper ----
    def t_scheme(text):
        if lang == "en" or not text:
            return text
        translated = get_or_translate(text, lang)
        return f"{translated} ({text})"

    schemes = schemes_df.to_dict(orient="records")
    eligible_schemes = []


    # ---- Salary mapping (shared source of truth - see SALARY_MAP_EXACT) ----
    user_salary_range = SALARY_MAP_EXACT.get(user_data.get("salary", "No Income"), (0, 0))
    salary_mid = sum(user_salary_range) / 2

    # ---- Process schemes ----
    for scheme in schemes:

        if not is_eligible(user_data, scheme):
            continue

        # Rule score
        rule_score = calculate_priority(user_data, scheme)

        # ML feature row
        feature_row = {
            "state": user_data.get("state", ""),
            "age": int(user_data.get("age", 0)),
            "gender": user_data.get("gender", ""),
            "caste": user_data.get("caste", ""),
            "residential": user_data.get("residence", ""),
            "annual_salary": salary_mid,
            "occupation": user_data.get("occupation", ""),
            "minority": user_data.get("minority", ""),
            "marital_status": user_data.get("marital_status", ""),
            "disability": user_data.get("disabled", ""),
            "scheme_category": scheme.get("category", "")
        }

        feature_df = pd.DataFrame([feature_row])

        try:
            ml_score = model.predict_proba(feature_df)[0][1]
        except:
            ml_score = 0.5  # fallback

        final_score = 0.5 * ml_score + 0.5 * rule_score

        # Scheme type
        scheme_type = "central" if scheme.get("state", "").lower() == "all" else "state"

        scheme_name = scheme.get("scheme_name", "Unnamed Scheme")

        eligible_schemes.append({
            "raw_name": scheme_name,
            "name": t_scheme(scheme_name),
            "description": t_scheme(scheme.get("description", "")),
            "website": scheme.get("official_url", ""),
            "type_clean": scheme_type,
            "rule_score": round(rule_score, 3),
            "ml_score": round(ml_score, 3),
            "final_score": round(final_score, 3)
        })

    # ---- Sort by final score ----
    eligible_schemes.sort(key=lambda x: x["final_score"], reverse=True)

    # ---- Separate schemes ----
    central_schemes = [s for s in eligible_schemes if s["type_clean"] == "central"]
    state_schemes = [s for s in eligible_schemes if s["type_clean"] == "state"]

    hero_labels = {
        "hi": t_clean("Hi", lang),
        "instruction": t_clean("Based on your profile, here are your eligible schemes:", lang)
    }

    column_titles = {
        "all": t("All Schemes", lang),
        "central": t("Central Schemes", lang),
        "state": t("State Schemes", lang),
        "highly_rec": t("Highly Recommended Schemes", lang),
        "mod_rec": t("Moderately Recommended Schemes", lang)
    }

    none_text = t("None", lang)

    # ---- Disclaimer (same pattern as page4) ----
    labels = {
        "disclaimer_bold": t_clean("DISCLAIMER:", lang),
        "disclaimer_body": t_clean(
            "Yojana Sarathi is an AI-powered academic project created for informational purposes only. "
            "Always verify scheme details on official government portals before applying.",
            lang
        )
    }

    return templates.TemplateResponse(
        "page3.html",
        {
            "request": request,
            "hero_labels": hero_labels,
            "labels": labels,
            "user_name": user_data.get("name", ""),
            "most_recommended": eligible_schemes[:3],
            # Computed here (not sliced in the template) so it's always the
            # next batch after "most_recommended", however many schemes exist.
            "moderately_recommended": eligible_schemes[3:6],
            "all_schemes": eligible_schemes,
            "central_schemes": central_schemes,
            "state_schemes": state_schemes,
            "column_titles": column_titles,
            "none_text": none_text,
            "lang": lang
        }
    )
# ---------------- CLEAN TRANSLATION (No brackets) ----------------
def t_clean(text, lang):
    if not text or lang == "en":
        return text

    # Custom override for Marathi "Hi" as requested
    if text.lower() == "hi" and lang == "mr":
        return "नमस्कार"

    return get_or_translate(text, lang)

templates.env.globals["t_clean"] = t_clean

# Mapping language codes to full names for the AI prompt
LANG_MAP = {
    "en": "English",
    "hi": "Hindi",
    "mr": "Marathi",
    "kn": "Kannada",
    "gu": "Gujarati",
    "ta": "Tamil",
    "te": "Telugu",
    "bn": "Bengali",
    "ml": "Malayalam",
    "pa": "Punjabi",
    "or": "Odia",
    "as": "Assamese",
    "ur": "Urdu"
}
def _parse_briefing_json(briefing_content):
    """Parse the AI's JSON briefing response, repairing common truncation issues.

    Indic-language responses (Kannada, Marathi, Tamil, etc.) can hit the
    model's max_tokens limit before the JSON closes properly, since those
    scripts use far more tokens per character than English. Rather than
    dumping the raw/truncated JSON text into `overview`, try to salvage a
    partial-but-usable result by auto-closing unterminated strings/braces.
    """
    # 1. Try parsing as-is first.
    try:
        return json.loads(briefing_content)
    except Exception:
        pass

    # 2. Isolate the JSON object (in case of stray leading/trailing text).
    start = briefing_content.find("{")
    if start == -1:
        return {"overview": briefing_content, "benefits": [], "eligibility": [], "documents": []}
    candidate = briefing_content[start:]

    try:
        return json.loads(candidate)
    except Exception:
        pass

    # 3. Attempt to repair a truncated response: if it cuts off mid-string,
    # close the string, then close any open arrays/objects.
    repaired = candidate.rstrip()
    # Drop a trailing comma before we patch things up.
    repaired = repaired.rstrip(",")

    # If the number of unescaped double-quotes is odd, we're mid-string -> close it.
    quote_count = len(re_findall_unescaped_quotes(repaired))
    if quote_count % 2 == 1:
        repaired += '"'

    open_braces = repaired.count("{") - repaired.count("}")
    open_brackets = repaired.count("[") - repaired.count("]")
    repaired += "]" * max(open_brackets, 0)
    repaired += "}" * max(open_braces, 0)

    try:
        return json.loads(repaired)
    except Exception:
        # 4. Give up gracefully: at least don't show raw JSON syntax to the user.
        return {
            "overview": briefing_content.replace("{", "").replace("}", "").replace('"', ""),
            "benefits": [],
            "eligibility": [],
            "documents": []
        }


def re_findall_unescaped_quotes(text):
    """Return list of unescaped double-quote positions (used to detect an open string)."""
    import re
    return re.findall(r'(?<!\\)"', text)


# ---------------- PAGE 4 (AI BRIEFING) ----------------

@app.get("/scheme/{scheme_name:path}")
async def page4(request: Request, scheme_name: str):
    lang = request.session.get("lang", "en")
    target_lang_name = LANG_MAP.get(lang, "English")

    bilingual_title = t(scheme_name, lang)

    labels = {
        "summary": t_clean("Summary", lang),
        "eligibility_tab": t_clean("Eligibility Criteria", lang),
        "documents_tab": t_clean("Required Documents", lang),
        "benefits_head": t_clean("Key Benefits", lang),
        "apply_btn": t_clean("Apply Now", lang),
        "chat_title": t_clean("Yojana Sarathi Chat", lang),
        "chat_welcome": t_clean("Hi there! 👋 Do you need help?", lang),
        "chat_placeholder": t_clean("Ask your question here...", lang),
        "chat_send": t_clean("Send", lang),
        "disclaimer_bold": t_clean("DISCLAIMER:", lang),
        "disclaimer_body": t_clean("Yojana Sarathi is an AI-powered academic project created for informational purposes only. Always verify scheme details on official government portals before applying.", lang)
    }

    schemes = schemes_df.to_dict(orient="records")
    selected_scheme = next((s for s in schemes if s['scheme_name'] == scheme_name), None)
    if not selected_scheme: return PlainTextResponse("Scheme not found", status_code=404)

    prompt = f"""
    You are an expert on Indian government welfare schemes.
    Provide a DETAILED, in-depth briefing on the scheme: "{scheme_name}".

    IMPORTANT: Provide all text descriptions and list items in {target_lang_name} language.

    Return response ONLY in JSON format:
    {{
    "overview": "a detailed overview, 5-7 full sentences, in {target_lang_name}. Cover what the scheme is, which government body launched/runs it, its main objective, and who it is meant to help.",
    "benefits": ["a specific benefit of the scheme, explained in 1-2 full sentences (not just a short phrase), in {target_lang_name}", "... at least 5-6 such detailed benefit entries"],
    "eligibility": ["a specific eligibility condition, explained clearly in 1 full sentence, in {target_lang_name}", "... at least 5-6 such detailed eligibility entries"],
    "documents": ["a specific required document, with a short note on why it's needed or where to obtain it, in 1 full sentence, in {target_lang_name}", "... at least 5-6 such detailed document entries"]
    }}

Rules:
- overview = a thorough explanation of the scheme, not a one-line summary.
- benefits = detailed advantages of the scheme, each entry fully explained rather than a short keyword/phrase.
- eligibility = detailed conditions to apply, each entry fully explained.
- documents = detailed list of required documents, each entry explained (why it's needed / what it proves), not just a bare document name.
- Do NOT include ```json or markdown.
- Only valid JSON.
"""

    briefing_content = ask_ai(prompt)

    # Clean JSON output from AI
    briefing_content = briefing_content.strip()
    if briefing_content.startswith("```"):
        briefing_content = briefing_content.split("```json")[-1].split("```")[0].strip()

    briefing_data = _parse_briefing_json(briefing_content)

    def make_list(items):
        return "<ul>" + "".join([f"<li>{i}</li>" for i in items]) + "</ul>"

    return templates.TemplateResponse(
        "page4.html",
        {
            "request": request,
            "scheme_name": bilingual_title,
            "labels": labels,
            "overview": briefing_data.get("overview", ""),
            "benefits": make_list(briefing_data.get("benefits", [])),
            "eligibility": make_list(briefing_data.get("eligibility", [])),
            "documents": make_list(briefing_data.get("documents", [])),
            "website": selected_scheme.get("official_url", "https://india.gov.in"),
            "category": selected_scheme.get("category", "Welfare"),
            "lang": lang
        }
    )
# ---------------- CHATBOT: DATABASE GROUNDING HELPERS ----------------
# These helpers make sure the chatbot only ever talks about schemes that
# actually exist in schemes_df (the CSV), instead of letting the LLM
# invent or hallucinate scheme names / details that aren't in our data.

def _get_all_scheme_names():
    return schemes_df['scheme_name'].dropna().astype(str).tolist()


def find_matching_scheme(user_message):
    """Detect which scheme (if any) already in our database the user is asking about."""
    if not user_message:
        return None
    msg = user_message.lower()
    all_names = _get_all_scheme_names()

    # 1. Direct substring match (most reliable for proper-noun scheme names)
    for name in all_names:
        if name and name.lower() in msg:
            return name

    # 2. Fuzzy fallback (handles typos / imperfect voice-to-text spelling)
    close = get_close_matches(msg, all_names, n=1, cutoff=0.5)
    if close:
        return close[0]

    return None


def build_scheme_grounding_context(max_schemes=200, desc_chars=160):
    """Compact, factual list of the schemes actually present in the database
    so the LLM is grounded and cannot invent schemes that don't exist here.
    """
    rows = schemes_df.head(max_schemes).to_dict(orient="records")
    lines = []
    for r in rows:
        name = str(r.get("scheme_name", "")).strip()
        if not name:
            continue
        category = str(r.get("category", "")).strip()
        desc = str(r.get("description", "")).strip()
        if len(desc) > desc_chars:
            desc = desc[:desc_chars].rstrip() + "..."
        lines.append(f"- {name} | Category: {category or 'N/A'} | {desc}")
    return "\n".join(lines)


# ---------------- CHATBOT (used on every page) ----------------
@app.post("/api/chat")
async def chat_api(request: Request):
    """
    Site-wide chatbot endpoint. Uses the CHATBOT api key (GROQ_API_KEY_CHAT),
    kept separate from the Page 4 summary key (GROQ_API_KEY_SUMMARY).

    Expected JSON body:
    {
        "message": "user's question",
        "scheme_name": "optional - current scheme, if chatting from page 4",
        "history": [{"role": "user"|"assistant", "content": "..."}]  # optional
    }
    """
    data = await request.json()
    user_message = (data.get("message") or "").strip()
    scheme_context = data.get("scheme_name", "")
    history = data.get("history", [])

    lang = request.session.get("lang", "en")
    target_lang_name = LANG_MAP.get(lang, "English")

    if not user_message:
        return JSONResponse({"reply": ""})

    context_line = f' The user is currently viewing the scheme "{scheme_context}".' if scheme_context else ""

    # ---- Ground the chatbot strictly in the schemes that exist in our database ----
    matched_scheme = find_matching_scheme(user_message) or (scheme_context if scheme_context else None)

    scheme_instruction = ""
    scheme_page_url = None
    official_url = None

    if matched_scheme:
        matched_rows = schemes_df[schemes_df['scheme_name'] == matched_scheme]
        if not matched_rows.empty:
            official_url = str(matched_rows.iloc[0].get("official_url", "") or "")
            scheme_page_url = f"/scheme/{quote(matched_scheme)}"

            
            row = matched_rows.iloc[0].to_dict()
            scheme_data_context = "\n".join(
                f"{k}: {v}" for k, v in row.items() if str(v).strip() and str(v).lower() != "nan"
            )

            scheme_instruction = f"""
The user is asking specifically about the scheme "{matched_scheme}", which IS present in our database.
Answer using ONLY the information for this one scheme in the SCHEME DATABASE below - do not bring in or
mention any other scheme. After answering, end your reply with a short, friendly question (in {target_lang_name})
asking whether they'd like to be taken to this scheme's detail page on this website for more information."""
        else:
            scheme_data_context = build_scheme_grounding_context()
    else:
        
        scheme_data_context = build_scheme_grounding_context()

    prompt = f"""You are "Yojana Sarathi", a friendly assistant that helps Indian citizens
understand government welfare schemes and how to apply for them.{context_line}

STRICT RULES:
1. You may ONLY discuss, describe, or recommend schemes that appear in the SCHEME DATABASE below. Never invent, assume, or mention any scheme, benefit, or detail that isn't present in it.
2. If the user asks about a scheme that is NOT listed in the SCHEME DATABASE, politely say it isn't currently available in our database and suggest they search/browse the schemes that are.
3. Structure your answer clearly and briefly using short sentences and "- " bullet points where relevant, instead of one long paragraph.
4. Answer ONLY in {target_lang_name}, regardless of the language the question was asked in.
5. Keep the answer concise (under 150 words) unless the user explicitly asks for more detail.
6. Do NOT mention or write out URLs yourself in the reply text - the website will show a clickable link/button for the scheme page separately.
{scheme_instruction}

SCHEME DATABASE:
{scheme_data_context}

User question: {user_message}"""

    reply = ask_chatbot(prompt, history=history)
    return JSONResponse({
        "reply": reply,
        "matched_scheme": matched_scheme,
        "scheme_page_url": scheme_page_url,
        "official_url": official_url
    })


# ---------------- TTS AUDIO ROUTE ----------------
@app.get("/api/tts")
async def tts(request: Request):
    text = request.query_params.get("text", "")
    lang = request.query_params.get("lang", "hi")  # Default Hindi
    if not text:
        return PlainTextResponse("No text provided", status_code=400)

    tts_audio = gTTS(text=text, lang=lang)
    mp3_fp = io.BytesIO()
    tts_audio.write_to_fp(mp3_fp)
    mp3_fp.seek(0)

    return Response(content=mp3_fp.getvalue(), media_type="audio/mpeg")

@app.post("/api/translate")
async def translate_api(request: Request):
    data = await request.json()
    text = data.get("text", "")
    target_lang = data.get("target_lang", "en")

    if not text:
        return JSONResponse({"translated_text": ""})

    try:
        translated = GoogleTranslator(source='auto', target=target_lang).translate(text)
        return JSONResponse({"translated_text": translated})
    except Exception as e:
        return JSONResponse({"translated_text": text, "error": str(e)})

# ---------------- SEARCH BAR ----------------
@app.get("/api/suggestions")
async def get_suggestions(request: Request):
    query = request.query_params.get("q", "").lower()
    if not query:
        return JSONResponse([])

    matches = schemes_df[
        schemes_df['scheme_name'].str.contains(query, case=False, na=False) |
        schemes_df['category'].str.contains(query, case=False, na=False)
    ]['scheme_name'].unique().tolist()

    return JSONResponse(matches[:8])


@app.get("/api/voice-match")
async def voice_match(request: Request):
    query = request.query_params.get("q", "").lower()
    all_names = schemes_df['scheme_name'].tolist()

    # cutoff 0.3 allows for a fair bit of speech-to-text error
    close_matches = get_close_matches(query, all_names, n=1, cutoff=0.3)

    if close_matches:
        return JSONResponse({"best_match": close_matches[0]})
    return JSONResponse({"best_match": None})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 5000)), reload=True)