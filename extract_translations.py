"""
extract_translations.py

Run this ONCE locally (not on Render) whenever you add new UI text.
It finds every string that goes through t()/t_clean() - both hardcoded
calls in main.py and dropdown/CSV values - translates each one into
every language in LANG_MAP, and saves the result to translations.json.

Commit translations.json to your repo. main.py loads it at startup and
uses it instead of calling GoogleTranslator live, so translation is
instant in production (including on Render).

Safe to re-run: it skips any (text, lang) pair already present in the
file, so adding one new label later won't re-translate everything.

Usage:
    python extract_translations.py
"""

import json
import os
import re
import socket
import time

from deep_translator import GoogleTranslator

# deep_translator/requests does NOT set a timeout by default, so a stalled
# or throttled connection to Google just hangs forever instead of erroring.
# This forces every underlying socket to give up after 10s so the script can
# retry/skip instead of freezing.
socket.setdefaulttimeout(10)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_PATH = os.path.join(BASE_DIR, "translations.json")

# Same language list as LANG_MAP in main.py (keep these in sync).
TARGET_LANGS = ["hi", "mr", "kn", "gu", "ta", "te", "bn", "ml", "pa", "or", "as", "ur"]

# Files/folders to scan for t("...", lang) / t_clean("...", lang) calls.
PY_FILES_TO_SCAN = ["main.py"]
TEMPLATES_DIR = os.path.join(BASE_DIR, "templates")

# CSV of schemes - scheme_name is passed through t() on the scheme detail page.
CSV_PATH = os.path.join(BASE_DIR, "test.csv")
CSV_COLUMNS_TO_TRANSLATE = ["scheme_name"]  # add "category" here too if you translate it

# Dropdown option lists that are translated via [t(x, lang) for x in ...] in
# main.py rather than as literal t("...") calls - regex can't see these, so
# they're listed explicitly. Keep in sync with main.py if you change them.
EXTRA_STRINGS = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa",
    "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
    "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
    "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
    "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu & Kashmir", "Ladakh",
    "Scheduled Tribe (ST)", "Scheduled Caste (SC)", "General", "OBC", "PVTG",
    "Male", "Female", "Other",
    "Yes", "No",
    "Urban", "Rural",
    "Student", "Farmer", "Self Employed", "Private Employee",
    "Government Employee", "Unemployed", "Daily Wage Worker",
    "Married", "Unmarried", "Widow",
    "No Income", "Below ₹1,00,000", "₹1,00,000 – ₹2,50,000",
    "₹2,50,001 – ₹5,00,000", "₹5,00,001 – ₹10,00,000", "Above ₹10,00,000",
]

# Matches t("literal text", lang) and t_clean("literal text", lang) - single
# or double quoted, non-f-string literals only.
CALL_PATTERN = re.compile(r"""t(?:_clean)?\(\s*(['"])((?:(?!\1).)*)\1""")


def find_literal_calls_in_file(path):
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    return [m.group(2) for m in CALL_PATTERN.finditer(content)]


def collect_source_strings():
    strings = set(EXTRA_STRINGS)

    for py_file in PY_FILES_TO_SCAN:
        full_path = os.path.join(BASE_DIR, py_file)
        if os.path.exists(full_path):
            strings.update(find_literal_calls_in_file(full_path))
        else:
            print(f"  (skipping {py_file} - not found)")

    if os.path.isdir(TEMPLATES_DIR):
        for fname in os.listdir(TEMPLATES_DIR):
            if fname.endswith(".html"):
                strings.update(find_literal_calls_in_file(os.path.join(TEMPLATES_DIR, fname)))
    else:
        print("  (skipping templates/ - not found)")

    if os.path.exists(CSV_PATH):
        import pandas as pd
        df = pd.read_csv(CSV_PATH)
        for col in CSV_COLUMNS_TO_TRANSLATE:
            if col in df.columns:
                strings.update(df[col].dropna().astype(str).tolist())
    else:
        print("  (skipping test.csv - not found)")

    # Drop empty strings / pure whitespace / anything that looks like an
    # f-string placeholder slipped through.
    return sorted(s for s in strings if s and s.strip() and "{" not in s)


def main():
    print("Scanning for translatable strings...")
    source_strings = collect_source_strings()
    print(f"Found {len(source_strings)} unique strings to translate into {len(TARGET_LANGS)} languages.")

    if os.path.exists(OUTPUT_PATH):
        with open(OUTPUT_PATH, "r", encoding="utf-8") as f:
            translations = json.load(f)
        print(f"Loaded existing translations.json with {len(translations)} entries (will resume/fill gaps).")
    else:
        translations = {}

    total_calls = 0
    for i, text in enumerate(source_strings, 1):
        translations.setdefault(text, {})
        for lang in TARGET_LANGS:
            if translations[text].get(lang):
                continue  # already translated, skip (safe to re-run)

            translated = None
            for attempt in range(3):
                try:
                    translated = GoogleTranslator(source="en", target=lang).translate(text)
                    break
                except Exception as e:
                    wait = 2 * (attempt + 1)
                    print(f"  retry {attempt + 1}/3 for '{text[:40]}' -> {lang} "
                          f"({e.__class__.__name__}), waiting {wait}s...")
                    time.sleep(wait)

            if translated:
                translations[text][lang] = translated
                total_calls += 1
            else:
                print(f"  GAVE UP: '{text[:40]}...' -> {lang} (will retry next run)")

            time.sleep(0.2)  # be polite to the free API, avoid rate-limit blocks

        print(f"  [{i}/{len(source_strings)}] done: '{text[:50]}'")
        # Save after every string, not just every 20 - a stall or crash
        # partway through should never lose more than one string's work.
        with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
            json.dump(translations, f, ensure_ascii=False, indent=2)

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(translations, f, ensure_ascii=False, indent=2)

    print(f"\nDone. Made {total_calls} live translation calls this run.")
    print(f"Saved {len(translations)} strings x {len(TARGET_LANGS)} languages to {OUTPUT_PATH}")
    print("Commit translations.json to your repo, then deploy to Render.")


if __name__ == "__main__":
    main()