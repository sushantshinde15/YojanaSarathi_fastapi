/**
 * PAGE 1 VOICE ASSISTANT — page1.js
 * -------------------------------------------------------
 * HOW TO INCLUDE IN page1.html:
 *   Add this line at the very END of <body>, after voice.js:
 *     <script src="{{ url_for('static', filename='js/page1.js') }}"></script>
 *
 * DEPENDS ON: voice.js must be loaded first.
 * -------------------------------------------------------
 *
 * FLOW:
 *  1. Request geolocation → reverse-geocode to state
 *  2. Greet in STATE language first, then English
 *  3. Ask to select language in STATE language, then English
 *  4. Listen for language choice
 *  5. Confirm & navigate to page2
 */

/* ── State → language code mapping ──────────────────── */
const STATE_LANG = {
    "maharashtra":        "mr",
    "gujarat":            "gu",
    "rajasthan":          "hi",
    "uttar pradesh":      "hi",
    "madhya pradesh":     "hi",
    "bihar":              "hi",
    "jharkhand":          "hi",
    "himachal pradesh":   "hi",
    "uttarakhand":        "hi",
    "delhi":              "hi",
    "haryana":            "hi",
    "chhattisgarh":       "hi",
    "west bengal":        "bn",
    "tamil nadu":         "ta",
    "andhra pradesh":     "te",
    "telangana":          "te",
    "karnataka":          "kn",
    "kerala":             "ml",
    "punjab":             "pa",
    "odisha":             "or",
    "assam":              "as",
    "jammu and kashmir":  "ur",
    "goa":                "mr",
    "manipur":            "en",
    "meghalaya":          "en",
    "mizoram":            "en",
    "nagaland":           "en",
    "sikkim":             "en",
    "tripura":            "bn",
    "arunachal pradesh":  "en",
};

/* ── Language detection table ─────────────────────────── */
const P1_LANG_DETECT = [
    { code: "hi", keywords: ["hindi",    "hinde",    "hindee",   "हिंदी", "हिन्दी"] },
    { code: "mr", keywords: ["marathi",  "marathee", "maratha",  "मराठी"] },
    { code: "te", keywords: ["telugu",   "telgu",    "తెలుగు"] },
    { code: "ta", keywords: ["tamil",    "tamizh",   "தமிழ்"] },
    { code: "kn", keywords: ["kannada",  "kannad",   "ಕನ್ನಡ"] },
    { code: "bn", keywords: ["bengali",  "bangla",   "bengalee", "বাংলা"] },
    { code: "gu", keywords: ["gujarati", "gujrati",  "ગુજરાતી"] },
    { code: "ml", keywords: ["malayalam","malayaalam","മലയാളം"] },
    { code: "pa", keywords: ["punjabi",  "panjabi",  "ਪੰਜਾਬੀ"] },
    { code: "or", keywords: ["odia",     "oriya",    "ଓଡ଼ିଆ"] },
    { code: "ur", keywords: ["urdu",     "اردو"] },
    { code: "as", keywords: ["assamese", "axomiya",  "অসমীয়া"] },
    { code: "en", keywords: ["english",  "eng",      "अंग्रेजी"] },
];

/* ── Bilingual greeting messages (STATE LANG + English) ─ */
/*   Format: { native: "...", english: "..." }             */
const P1_GREET = {
    mr: {
        native:  "योजना सारथीमध्ये आपले स्वागत आहे. कृपया आपली भाषा निवडा. मराठी किंवा इंग्रजी म्हणा.",
        english: "Welcome to Yojana Sarathi. Please say your preferred language. For example: Marathi or English."
    },
    gu: {
        native:  "યોજના સારથીમાં આપનું સ્વાગત છે. કૃપા કરીને તમારી ભાષા પસંદ કરો. ગુજરાતી અથવા અંગ્રેજી કહો.",
        english: "Welcome to Yojana Sarathi. Please say your preferred language. For example: Gujarati or English."
    },
    hi: {
        native:  "योजना सारथी में आपका स्वागत है. कृपया अपनी भाषा बोलें. हिंदी या अंग्रेजी कहें.",
        english: "Welcome to Yojana Sarathi. Please say your preferred language. For example: Hindi or English."
    },
    bn: {
        native:  "যোজনা সারথিতে আপনাকে স্বাগতম। আপনার পছন্দের ভাষা বলুন। বাংলা বা ইংরেজি বলুন।",
        english: "Welcome to Yojana Sarathi. Please say your preferred language. For example: Bengali or English."
    },
    ta: {
        native:  "யோஜனா சாரதியில் உங்களை வரவேற்கிறோம். உங்கள் மொழியைச் சொல்லுங்கள். தமிழ் அல்லது ஆங்கிலம் என்று சொல்லுங்கள்.",
        english: "Welcome to Yojana Sarathi. Please say your preferred language. For example: Tamil or English."
    },
    te: {
        native:  "యోజన సారథికి స్వాగతం. మీ భాషను చెప్పండి. తెలుగు లేదా ఇంగ్లీష్ అని చెప్పండి.",
        english: "Welcome to Yojana Sarathi. Please say your preferred language. For example: Telugu or English."
    },
    kn: {
        native:  "ಯೋಜನಾ ಸಾರಥಿಗೆ ಸ್ವಾಗತ. ನಿಮ್ಮ ಭಾಷೆ ಹೇಳಿ. ಕನ್ನಡ ಅಥವಾ ಇಂಗ್ಲಿಷ್ ಎಂದು ಹೇಳಿ.",
        english: "Welcome to Yojana Sarathi. Please say your preferred language. For example: Kannada or English."
    },
    ml: {
        native:  "യോജനാ സാരഥിയിലേക്ക് സ്വാഗതം. നിങ്ങളുടെ ഭാഷ പറയൂ. മലയാളം അല്ലെങ്കിൽ ഇംഗ്ലീഷ് എന്ന് പറയൂ.",
        english: "Welcome to Yojana Sarathi. Please say your preferred language. For example: Malayalam or English."
    },
    pa: {
        native:  "ਯੋਜਨਾ ਸਾਰਥੀ ਵਿੱਚ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ। ਆਪਣੀ ਭਾਸ਼ਾ ਦੱਸੋ। ਪੰਜਾਬੀ ਜਾਂ ਅੰਗਰੇਜ਼ੀ ਕਹੋ।",
        english: "Welcome to Yojana Sarathi. Please say your preferred language. For example: Punjabi or English."
    },
    or: {
        native:  "ଯୋଜନା ସାରଥୀରେ ଆପଣଙ୍କୁ ସ୍ୱାଗତ। ଆପଣଙ୍କ ଭାଷା କୁହନ୍ତୁ। ଓଡ଼ିଆ ବା ଇଂରାଜୀ କୁହନ୍ତୁ।",
        english: "Welcome to Yojana Sarathi. Please say your preferred language. For example: Odia or English."
    },
    as: {
        native:  "যোজনা সাৰথীলৈ স্বাগতম। আপোনাৰ ভাষা কওক। অসমীয়া বা ইংৰাজী কওক।",
        english: "Welcome to Yojana Sarathi. Please say your preferred language. For example: Assamese or English."
    },
    ur: {
        native:  "یوجنا سارتھی میں خوش آمدید۔ اپنی زبان بتائیں۔ اردو یا انگریزی کہیں۔",
        english: "Welcome to Yojana Sarathi. Please say your preferred language. For example: Urdu or English."
    },
    en: {
        native:  "",
        english: "Welcome to Yojana Sarathi. I will guide you through the entire process. Please say your preferred language. For example: Hindi, Marathi, English, Telugu, Tamil."
    },
};

/* ── Retry prompts in both languages ─────────────────── */
const P1_RETRY = {
    mr: "मला समजले नाही. कृपया पुन्हा सांगा. मराठी किंवा इंग्रजी म्हणा. | Sorry, I didn't catch that. Please say your language clearly.",
    gu: "મને સમજ ન પડ્યું. ફરીથી કહો. ગુજરાતી અથવા અંગ્રેજી. | Sorry, I didn't catch that. Please say your language clearly.",
    hi: "मैं समझ नहीं पाया. फिर से बोलें. हिंदी या अंग्रेजी. | Sorry, I didn't catch that. Please say your language clearly.",
    bn: "বুঝতে পারিনি। আবার বলুন। বাংলা বা ইংরেজি। | Sorry, I didn't catch that. Please say your language clearly.",
    ta: "புரியவில்லை. மீண்டும் சொல்லுங்கள். | Sorry, I didn't catch that. Please say your language clearly.",
    te: "అర్థం కాలేదు. మళ్లీ చెప్పండి. | Sorry, I didn't catch that. Please say your language clearly.",
    kn: "ಅರ್ಥವಾಗಲಿಲ್ಲ. ಮತ್ತೆ ಹೇಳಿ. | Sorry, I didn't catch that. Please say your language clearly.",
    ml: "മനസ്സിലായില്ല. വീണ്ടും പറയൂ. | Sorry, I didn't catch that. Please say your language clearly.",
    pa: "ਸਮਝ ਨਹੀਂ ਆਇਆ। ਦੁਬਾਰਾ ਕਹੋ। | Sorry, I didn't catch that. Please say your language clearly.",
    or: "ବୁଝୁ ନ ପାରିଲି। ପୁଣି କୁହନ୍ତୁ। | Sorry, I didn't catch that. Please say your language clearly.",
    as: "বুজা নাই। আকৌ কওক। | Sorry, I didn't catch that. Please say your language clearly.",
    ur: "سمجھ نہیں آیا۔ دوبارہ کہیں۔ | Sorry, I didn't catch that. Please say your language clearly.",
    en: "Sorry, I didn't catch that. Please say your language name clearly. For example: Hindi, English, Marathi.",
};

/* ── Confirmation messages (in the CHOSEN language) ─── */
const P1_LANG_CONFIRM = {
    en: "English selected. Taking you to the form now.",
    hi: "हिंदी चुनी गई। अब फॉर्म पर ले जा रहे हैं।",
    mr: "मराठी निवडली. आता फॉर्मवर घेऊन जात आहोत.",
    te: "తెలుగు ఎంచుకోబడింది. ఇప్పుడు ఫారమ్‌కు వెళ్తున్నాం.",
    ta: "தமிழ் தேர்ந்தெடுக்கப்பட்டது. இப்போது படிவத்திற்கு செல்கிறோம்.",
    kn: "ಕನ್ನಡ ಆಯ್ಕೆ ಆಗಿದೆ. ಈಗ ಫಾರ್ಮ್‌ಗೆ ಹೋಗುತ್ತಿದ್ದೇವೆ.",
    bn: "বাংলা নির্বাচিত হয়েছে। এখন ফর্মে নিয়ে যাচ্ছি।",
    gu: "ગુજરાતી પસંદ થઈ. હવે ફોર્મ પર લઈ જઈ રહ્યા છીએ.",
    ml: "മലയാളം തിരഞ്ഞെടുത്തു. ഇപ്പോൾ ഫോമിലേക്ക് പോകുന്നു.",
    pa: "ਪੰਜਾਬੀ ਚੁਣੀ ਗਈ। ਹੁਣ ਫਾਰਮ 'ਤੇ ਲੈ ਜਾ ਰਹੇ ਹਾਂ।",
    or: "ଓଡ଼ିଆ ଚୟନ ହୋଇଛି। ଏବେ ଫର୍ମ ଦେଖାଇବୁ।",
    ur: "اردو منتخب ہوئی۔ اب فارم پر لے جا رہے ہیں۔",
    as: "অসমীয়া বাছনি হৈছে। এতিয়া ফৰ্মলৈ নিয়া হৈছে।",
};

/* ── Detect language code from spoken text ───────────── */
function p1_detectLang(speech) {
    if (!speech) return null;
    const lower = speech.toLowerCase();
    for (const entry of P1_LANG_DETECT) {
        if (entry.keywords.some(kw => lower.includes(kw))) return entry.code;
    }
    return null;
}

/* ── Visually highlight selected language button ────── */
function p1_highlightButton(code) {
    document.querySelectorAll(".lang-btn").forEach(btn => {
        if (btn.dataset && btn.dataset.lang === code) {
            btn.style.background  = "#1f3b73";
            btn.style.color       = "white";
            btn.style.borderColor = "#1f3b73";
            btn.style.transform   = "translateY(-3px)";
        }
    });
}

/* ── Speak with a temporary language override ─────── */
/*   We need to speak native greetings before the user
     has set sessionStorage("language").                */
function p1_speakLang(text, langCode, next) {
    if (!text) { if (next) next(); return; }

    // Temporarily set language for the speak() call in voice.js
    const prev = sessionStorage.getItem("language");
    sessionStorage.setItem("language", langCode);

    // Use the existing speak() from voice.js
    speak(text, () => {
        // Restore (or remove) previous language
        if (prev === null) sessionStorage.removeItem("language");
        else sessionStorage.setItem("language", prev);
        if (next) next();
    });
}

/* ── Get state language from geolocation ─────────── */
function p1_getStateLang(callback) {
    if (!navigator.geolocation) { callback("en"); return; }

    navigator.geolocation.getCurrentPosition(
        async (pos) => {
            try {
                const { latitude, longitude } = pos.coords;
                const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
                const res  = await fetch(url, { headers: { "Accept-Language": "en" } });
                const data = await res.json();

                const rawState = (
                    data.address.state ||
                    data.address.region ||
                    ""
                ).toLowerCase().trim();

                // Match against known states
                let detected = "en";
                for (const [stateName, langCode] of Object.entries(STATE_LANG)) {
                    if (rawState.includes(stateName) || stateName.includes(rawState)) {
                        detected = langCode;
                        break;
                    }
                }
                callback(detected);
            } catch (e) {
                callback("en");
            }
        },
        () => callback("en"),   // permission denied or error → default English
        { timeout: 6000 }
    );
}

/* ── Ask for language, retry up to 3 times ───────────── */
function p1_askLanguage(stateLang, attempts) {
    if (attempts === undefined) attempts = 0;

    if (attempts >= 4) {
        // Default to state language after too many retries
        const fallback = stateLang || "en";
        p1_speakLang(P1_LANG_CONFIRM[fallback] || P1_LANG_CONFIRM["en"], fallback, () => {
            sessionStorage.setItem("language", fallback);
            sessionStorage.setItem("voiceMode", "on");
            window.location.href = "/page2?lang=" + fallback;
        });
        return;
    }

    let promptText;
    if (attempts === 0) {
        // First attempt: speak native greeting first (if not English), then English
        const greet = P1_GREET[stateLang] || P1_GREET["en"];
        if (stateLang !== "en" && greet.native) {
            // Native language first
            p1_speakLang(greet.native, stateLang, () => {
                // Then English
                p1_speakLang(greet.english, "en", () => {
                    p1_listenForLang(stateLang, attempts);
                });
            });
        } else {
            // English-only state
            p1_speakLang(greet.english, "en", () => {
                p1_listenForLang(stateLang, attempts);
            });
        }
        return;
    } else {
        // Retry: bilingual retry message
        const retryMsg = P1_RETRY[stateLang] || P1_RETRY["en"];
        if (stateLang !== "en") {
            // Split on " | " to get native vs English parts
            const parts = retryMsg.split(" | ");
            const nativePart  = parts[0] || retryMsg;
            const englishPart = parts[1] || "";
            p1_speakLang(nativePart, stateLang, () => {
                if (englishPart) {
                    p1_speakLang(englishPart, "en", () => {
                        p1_listenForLang(stateLang, attempts);
                    });
                } else {
                    p1_listenForLang(stateLang, attempts);
                }
            });
        } else {
            p1_speakLang(retryMsg, "en", () => {
                p1_listenForLang(stateLang, attempts);
            });
        }
    }
}

/* ── Listen and match language choice ────────────── */
function p1_listenForLang(stateLang, attempts) {
    // Listen in English so speech recognition works broadly
    const prevLang = sessionStorage.getItem("language");
    sessionStorage.setItem("language", "en");

    listen(speech => {
        // Restore
        if (prevLang === null) sessionStorage.removeItem("language");
        else sessionStorage.setItem("language", prevLang);

        const code = p1_detectLang(speech);
        if (code) {
            p1_highlightButton(code);
            sessionStorage.setItem("language", code);
            sessionStorage.setItem("voiceMode", "on");
            const confirmMsg = P1_LANG_CONFIRM[code] || P1_LANG_CONFIRM["en"];
            // Confirm in chosen language
            p1_speakLang(confirmMsg, code, () => {
                window.location.href = "/page2?lang=" + code;
            });
        } else {
            p1_askLanguage(stateLang, attempts + 1);
        }
    });
}

/* ── Public entry point (replaces old startVoiceLanguage) */
function startVoiceLanguage() {
    if (typeof speak !== "function" || typeof listen !== "function") {
        alert("Voice Assistant is still loading. Please try again in a moment.");
        return;
    }

    // Step 1: detect location → state language
    p1_getStateLang((stateLang) => {
        // Step 2: greet bilingually and ask for language
        p1_askLanguage(stateLang, 0);
    });
}
