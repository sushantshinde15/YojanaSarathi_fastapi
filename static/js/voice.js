/**
 * YOJANA SARATHI — COMPLETE VOICE ASSISTANT ENGINE
 * Multilingual, continuous, scheme-aware voice flow
 */

/* ─────────────── LANGUAGE MAP ─────────────── */
const LANG_MAP = {
    'en': 'en-IN', 'hi': 'hi-IN', 'mr': 'mr-IN', 'te': 'te-IN',
    'ta': 'ta-IN', 'kn': 'kn-IN', 'bn': 'bn-IN', 'gu': 'gu-IN',
    'ml': 'ml-IN', 'pa': 'pa-IN', 'or': 'or-IN', 'ur': 'ur-IN', 'as': 'as-IN'
};

/* ─────────────── MULTILINGUAL STRINGS ─────────────── */
const STRINGS = {
    en: {
        welcome: "Welcome to Yojana Sarathi. Your personal government scheme assistant.",
        selectLang: "Please select your preferred language.",
        askName: "What is your name?",
        askAge: "How old are you?",
        askGender: "What is your gender? Say male, female, or other.",
        askState: "Which state do you live in?",
        askResidence: "Do you live in an urban or rural area?",
        askIncome: "What is your annual income in rupees?",
        askCaste: "What is your caste category? Say General, OBC, SC, or ST.",
        askOccupation: "What is your occupation?",
        askDisability: "Do you have any disability? Say yes or no.",
        askMinority: "Do you belong to a minority community? Say yes or no.",
        confirmDetails: "Let me confirm your details.",
        submitting: "Finding the best schemes for you. Please wait.",
        highlyRec: "Here are the highly recommended schemes for you.",
        askModerate: "Would you like me to read the moderately recommended schemes?",
        askCentral: "Should I read the central government schemes?",
        askState2: "Should I read the state government schemes?",
        schemeSelected: "Opening scheme details.",
        askSchemeName: "Say the name of a scheme to know more about it.",
        readingPage4: "Let me read the scheme details for you.",
        repeat: "Sorry, I didn't catch that. Please say it again.",
        yesWords: ["yes","yeah","haan","ha","ho","ji","ok","next","avunu","aam","sahi","sure","okay"],
        noWords: ["no","nah","stop","exit","nahi","nako","vadu","vendam","illa","bas","nope","mat"],
        done: "I have finished reading. You can explore more on the screen.",
        hello: "Hello",
        nameConfirm: "Nice to meet you",
        detailsConfirm: "Your details have been filled. Proceeding to find schemes.",
    },
    hi: {
        welcome: "योजना सारथी में आपका स्वागत है। आपका व्यक्तिगत सरकारी योजना सहायक।",
        selectLang: "कृपया अपनी भाषा चुनें।",
        askName: "आपका नाम क्या है?",
        askAge: "आपकी उम्र क्या है?",
        askGender: "आपका लिंग क्या है? पुरुष, महिला, या अन्य कहें।",
        askState: "आप किस राज्य में रहते हैं?",
        askResidence: "आप शहरी या ग्रामीण क्षेत्र में रहते हैं?",
        askIncome: "आपकी वार्षिक आय कितनी है?",
        askCaste: "आपकी जाति श्रेणी क्या है? सामान्य, ओबीसी, एससी, या एसटी कहें।",
        askOccupation: "आपका व्यवसाय क्या है?",
        askDisability: "क्या आपको कोई विकलांगता है? हाँ या नहीं कहें।",
        askMinority: "क्या आप अल्पसंख्यक समुदाय से हैं? हाँ या नहीं कहें।",
        confirmDetails: "आपके विवरण की पुष्टि करें।",
        submitting: "आपके लिए सर्वोत्तम योजनाएं खोजी जा रही हैं।",
        highlyRec: "यहाँ आपके लिए अत्यधिक अनुशंसित योजनाएं हैं।",
        askModerate: "क्या मैं मध्यम अनुशंसित योजनाएं पढ़ूं?",
        askCentral: "क्या मैं केंद्र सरकार की योजनाएं पढ़ूं?",
        askState2: "क्या मैं राज्य सरकार की योजनाएं पढ़ूं?",
        schemeSelected: "योजना विवरण खोला जा रहा है।",
        askSchemeName: "किसी योजना के बारे में जानने के लिए उसका नाम बोलें।",
        readingPage4: "मैं आपके लिए योजना का विवरण पढ़ता हूँ।",
        repeat: "माफ करें, मैं समझ नहीं पाया। कृपया फिर से बोलें।",
        yesWords: ["हाँ","हा","हो","जी","ठीक है","okay","yes","हान"],
        noWords: ["नहीं","नही","ना","नहीं","no","बस","रुको"],
        done: "मैंने पढ़ना समाप्त किया। आप स्क्रीन पर और देख सकते हैं।",
        hello: "नमस्ते",
        nameConfirm: "आपसे मिलकर खुशी हुई",
        detailsConfirm: "आपका विवरण भर दिया गया है। योजनाएं खोजी जा रही हैं।",
    },
    mr: {
        welcome: "योजना सारथीमध्ये आपले स्वागत आहे.",
        selectLang: "कृपया आपली भाषा निवडा.",
        askName: "आपले नाव काय आहे?",
        askAge: "आपले वय किती आहे?",
        askGender: "आपले लिंग काय आहे? पुरुष, महिला किंवा इतर सांगा.",
        askState: "आपण कोणत्या राज्यात राहता?",
        askResidence: "आपण शहरी किंवा ग्रामीण भागात राहता?",
        askIncome: "आपले वार्षिक उत्पन्न किती आहे?",
        askCaste: "आपली जात श्रेणी काय आहे?",
        askOccupation: "आपचा व्यवसाय काय आहे?",
        askDisability: "आपल्याला काही अपंगत्व आहे का? हो किंवा नाही सांगा.",
        askMinority: "आपण अल्पसंख्याक समुदायातून आहात का?",
        confirmDetails: "आपले तपशील तपासूया.",
        submitting: "तुमच्यासाठी सर्वोत्तम योजना शोधल्या जात आहेत.",
        highlyRec: "येथे तुमच्यासाठी अत्यंत शिफारस केलेल्या योजना आहेत.",
        askModerate: "मी मध्यम शिफारस केलेल्या योजना वाचू का?",
        askCentral: "मी केंद्र सरकारच्या योजना वाचू का?",
        askState2: "मी राज्य सरकारच्या योजना वाचू का?",
        schemeSelected: "योजनेचे तपशील उघडत आहे.",
        askSchemeName: "कोणत्याही योजनेबद्दल जाणून घेण्यासाठी तिचे नाव सांगा.",
        readingPage4: "मी तुमच्यासाठी योजनेचे तपशील वाचतो.",
        repeat: "माफ करा, मला समजले नाही. कृपया पुन्हा सांगा.",
        yesWords: ["हो","हाँ","yes","ठीक आहे","बरं"],
        noWords: ["नाही","नको","no","थांबा"],
        done: "मी वाचणे संपवले. तुम्ही स्क्रीनवर आणखी पाहू शकता.",
        hello: "नमस्कार",
        nameConfirm: "तुम्हाला भेटून आनंद झाला",
        detailsConfirm: "तुमचे तपशील भरले गेले आहेत.",
    },
    ta: {
        welcome: "யோஜனா சாரதியில் உங்களை வரவேற்கிறோம்.",
        selectLang: "உங்கள் மொழியை தேர்ந்தெடுக்கவும்.",
        askName: "உங்கள் பெயர் என்ன?",
        askAge: "உங்கள் வயது என்ன?",
        askGender: "உங்கள் பாலினம் என்ன?",
        askState: "நீங்கள் எந்த மாநிலத்தில் வசிக்கிறீர்கள்?",
        askResidence: "நீங்கள் நகர்ப்புற அல்லது கிராமப்புற பகுதியில் வசிக்கிறீர்களா?",
        askIncome: "உங்கள் வருடாந்திர வருமானம் என்ன?",
        askCaste: "உங்கள் சாதி வகை என்ன?",
        askOccupation: "உங்கள் தொழில் என்ன?",
        askDisability: "உங்களுக்கு ஏதாவது மாற்றுத்திறன் உள்ளதா?",
        askMinority: "நீங்கள் சிறுபான்மை சமுதாயத்தைச் சேர்ந்தவரா?",
        confirmDetails: "உங்கள் விவரங்களை உறுதிப்படுத்துகிறேன்.",
        submitting: "உங்களுக்கு சிறந்த திட்டங்களை கண்டுபிடிக்கிறேன்.",
        highlyRec: "உங்களுக்கு மிகவும் பரிந்துரைக்கப்பட்ட திட்டங்கள் இங்கே.",
        askModerate: "மிதமாக பரிந்துரைக்கப்பட்ட திட்டங்களை படிக்கவா?",
        askCentral: "மத்திய அரசு திட்டங்களை படிக்கவா?",
        askState2: "மாநில அரசு திட்டங்களை படிக்கவா?",
        schemeSelected: "திட்ட விவரங்கள் திறக்கப்படுகின்றன.",
        askSchemeName: "எந்த திட்டம் பற்றி அறிய விரும்புகிறீர்கள்?",
        readingPage4: "திட்டத்தின் விவரங்களை படிக்கிறேன்.",
        repeat: "மன்னிக்கவும், புரியவில்லை. மீண்டும் சொல்லுங்கள்.",
        yesWords: ["ஆம்","yes","சரி","ஓகே"],
        noWords: ["இல்லை","no","வேண்டாம்"],
        done: "படிப்பை முடித்தேன். திரையில் மேலும் காணலாம்.",
        hello: "வணக்கம்",
        nameConfirm: "உங்களை சந்தித்ததில் மகிழ்ச்சி",
        detailsConfirm: "விவரங்கள் நிரப்பப்பட்டன.",
    },
    te: {
        welcome: "యోజన సారథికి స్వాగతం.",
        selectLang: "దయచేసి మీ భాషను ఎంచుకోండి.",
        askName: "మీ పేరు ఏమిటి?",
        askAge: "మీ వయసు ఎంత?",
        askGender: "మీ లింగం ఏమిటి?",
        askState: "మీరు ఏ రాష్ట్రంలో నివసిస్తున్నారు?",
        askResidence: "మీరు పట్టణ లేదా గ్రామీణ ప్రాంతంలో నివసిస్తున్నారా?",
        askIncome: "మీ వార్షిక ఆదాయం ఎంత?",
        askCaste: "మీ కులం వర్గం ఏమిటి?",
        askOccupation: "మీ వృత్తి ఏమిటి?",
        askDisability: "మీకు వికలాంగత ఉందా?",
        askMinority: "మీరు మైనారిటీ వర్గానికి చెందినవారా?",
        confirmDetails: "మీ వివరాలను నిర్ధారిస్తున్నాను.",
        submitting: "మీకు అత్యుత్తమ పథకాలను కనుగొంటున్నాను.",
        highlyRec: "మీకు అత్యంత సిఫారసు చేయబడిన పథకాలు ఇవి.",
        askModerate: "మధ్యమంగా సిఫారసు చేయబడిన పథకాలు చదవమంటారా?",
        askCentral: "కేంద్ర ప్రభుత్వ పథకాలు చదవమంటారా?",
        askState2: "రాష్ట్ర ప్రభుత్వ పథకాలు చదవమంటారా?",
        schemeSelected: "పథకం వివరాలు తెరవబడుతున్నాయి.",
        askSchemeName: "పథకం పేరు చెప్పండి.",
        readingPage4: "పథకం వివరాలు చదువుతున్నాను.",
        repeat: "క్షమించండి, అర్థం కాలేదు. మళ్లీ చెప్పండి.",
        yesWords: ["అవును","yes","సరే","okay"],
        noWords: ["లేదు","no","వద్దు"],
        done: "చదవడం పూర్తయింది.",
        hello: "నమస్కారం",
        nameConfirm: "మిమ్మల్ని కలిసినందుకు సంతోషం",
        detailsConfirm: "వివరాలు నిండాయి.",
    },
    kn: {
        welcome: "ಯೋಜನಾ ಸಾರಥಿಗೆ ಸ್ವಾಗತ.",
        selectLang: "ದಯವಿಟ್ಟು ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆ ಮಾಡಿ.",
        askName: "ನಿಮ್ಮ ಹೆಸರು ಏನು?",
        askAge: "ನಿಮ್ಮ ವಯಸ್ಸು ಎಷ್ಟು?",
        askGender: "ನಿಮ್ಮ ಲಿಂಗ ಏನು?",
        askState: "ನೀವು ಯಾವ ರಾಜ್ಯದಲ್ಲಿ ವಾಸಿಸುತ್ತೀರಿ?",
        askResidence: "ನೀವು ನಗರ ಅಥವಾ ಗ್ರಾಮೀಣ ಪ್ರದೇಶದಲ್ಲಿ ವಾಸಿಸುತ್ತೀರಾ?",
        askIncome: "ನಿಮ್ಮ ವಾರ್ಷಿಕ ಆದಾಯ ಎಷ್ಟು?",
        askCaste: "ನಿಮ್ಮ ಜಾತಿ ವರ್ಗ ಏನು?",
        askOccupation: "ನಿಮ್ಮ ವೃತ್ತಿ ಏನು?",
        askDisability: "ನಿಮಗೆ ಯಾವುದಾದರೂ ಅಂಗವೈಕಲ್ಯ ಇದೆಯೇ?",
        askMinority: "ನೀವು ಅಲ್ಪಸಂಖ್ಯಾತ ಸಮುದಾಯಕ್ಕೆ ಸೇರಿದ್ದೀರಾ?",
        confirmDetails: "ನಿಮ್ಮ ವಿವರಗಳನ್ನು ದೃಢೀಕರಿಸುತ್ತಿದ್ದೇನೆ.",
        submitting: "ನಿಮಗೆ ಉತ್ತಮ ಯೋಜನೆಗಳನ್ನು ಹುಡುಕುತ್ತಿದ್ದೇನೆ.",
        highlyRec: "ನಿಮಗೆ ಹೆಚ್ಚು ಶಿಫಾರಸು ಮಾಡಲಾದ ಯೋಜನೆಗಳು ಇಲ್ಲಿವೆ.",
        askModerate: "ಮಧ್ಯಮ ಶಿಫಾರಸು ಮಾಡಲಾದ ಯೋಜನೆಗಳನ್ನು ಓದಲೇ?",
        askCentral: "ಕೇಂದ್ರ ಸರ್ಕಾರದ ಯೋಜನೆಗಳನ್ನು ಓದಲೇ?",
        askState2: "ರಾಜ್ಯ ಸರ್ಕಾರದ ಯೋಜನೆಗಳನ್ನು ಓದಲೇ?",
        schemeSelected: "ಯೋಜನೆ ವಿವರಗಳು ತೆರೆಯುತ್ತಿವೆ.",
        askSchemeName: "ಯೋಜನೆಯ ಹೆಸರು ಹೇಳಿ.",
        readingPage4: "ಯೋಜನೆ ವಿವರಗಳನ್ನು ಓದುತ್ತಿದ್ದೇನೆ.",
        repeat: "ಕ್ಷಮಿಸಿ, ಅರ್ಥವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಹೇಳಿ.",
        yesWords: ["ಹೌದು","yes","ಸರಿ","okay"],
        noWords: ["ಇಲ್ಲ","no","ಬೇಡ"],
        done: "ಓದುವಿಕೆ ಮುಗಿದಿದೆ.",
        hello: "ನಮಸ್ಕಾರ",
        nameConfirm: "ನಿಮ್ಮನ್ನು ಭೇಟಿಯಾಗಿ ಸಂತೋಷವಾಯಿತು",
        detailsConfirm: "ವಿವರಗಳನ್ನು ತುಂಬಲಾಗಿದೆ.",
    }
};

/* ─────────────── STATE ─────────────── */
let isSpeaking = false;
let currentAudio = null;
let voiceActive = false;

/* ─────────────── GET STRING ─────────────── */
function S(key) {
    const lang = sessionStorage.getItem("language") || "en";
    const strings = STRINGS[lang] || STRINGS["en"];
    return strings[key] || STRINGS["en"][key] || key;
}

/* ─────────────── YES / NO CHECK ─────────────── */
function isYes(text) {
    if (!text) return false;
    const lang = sessionStorage.getItem("language") || "en";
    const strings = STRINGS[lang] || STRINGS["en"];
    const yesWords = strings.yesWords || STRINGS["en"].yesWords;
    const t = text.toLowerCase();
    return yesWords.some(w => t.includes(w.toLowerCase()));
}

function isNo(text) {
    if (!text) return false;
    const lang = sessionStorage.getItem("language") || "en";
    const strings = STRINGS[lang] || STRINGS["en"];
    const noWords = strings.noWords || STRINGS["en"].noWords;
    const t = text.toLowerCase();
    return noWords.some(w => t.includes(w.toLowerCase()));
}

/* ─────────────── NORMALIZATION ─────────────── */
function normalizeSpeech(speech) {
    if (!speech) return "";
    let s = speech.toLowerCase().trim();

    const maleWords = ["male","mail","man","aadmi","पुरुष","मर्द","pur","purusha"];
    const femaleWords = ["female","woman","lady","महिला","औरत","mahila"];
    const otherWords = ["other","others","prefer not"];
    const urbanWords = ["urban","city","shehar","शहर","shahar","nagara"];
    const ruralWords = ["rural","village","gaon","गाव","gram","gramin"];
    const yesWords = ["yes","haan","ha","हाँ","हो","avunu","aam","sahi","ji"];
    const noWords = ["no","nahi","ना","नहीं","illa","vendam"];

    const numberWords = {
        "one":1,"two":2,"three":3,"four":4,"five":5,"six":6,"seven":7,"eight":8,"nine":9,"ten":10,
        "eleven":11,"twelve":12,"thirteen":13,"fourteen":14,"fifteen":15,"sixteen":16,"seventeen":17,
        "eighteen":18,"nineteen":19,"twenty":20,"twenty one":21,"twenty two":22,"twenty three":23,
        "twenty four":24,"twenty five":25,"thirty":30,"forty":40,"fifty":50,"sixty":60,"seventy":70,
        "eighty":80,"ninety":90,"hundred":100
    };

    if (maleWords.some(w => s.includes(w))) return "male";
    if (femaleWords.some(w => s.includes(w))) return "female";
    if (otherWords.some(w => s.includes(w))) return "other";
    if (urbanWords.some(w => s.includes(w))) return "urban";
    if (ruralWords.some(w => s.includes(w))) return "rural";
    if (yesWords.some(w => s === w)) return "yes";
    if (noWords.some(w => s === w)) return "no";

    for (let [word, num] of Object.entries(numberWords)) {
        if (s.includes(word)) return String(num);
    }

    // Extract numbers
    const numMatch = s.match(/\d+/);
    if (numMatch) return numMatch[0];

    return s;
}

/* ─────────────── SPEAK ─────────────── */
function speak(text, next = null) {
    if (!text) { if (next) next(); return; }

    window.speechSynthesis.cancel();
    isSpeaking = true;

    const lang = sessionStorage.getItem("language") || "en";

    let clean = text
        .replace(/\b(\w+)\s+\1\b/gi, "$1")
        .replace(/state\s*state/gi, "state")
        .trim();

    const url = `/api/tts?text=${encodeURIComponent(clean)}&lang=${lang}`;

    if (currentAudio) { currentAudio.pause(); currentAudio = null; }

    let audio = new Audio(url);
    currentAudio = audio;

    const onEnd = () => {
        isSpeaking = false;
        currentAudio = null;
        if (next) next();
    };

    audio.onended = onEnd;
    audio.onerror = () => {
        // Fallback to browser TTS
        const utter = new SpeechSynthesisUtterance(clean);
        utter.lang = LANG_MAP[lang] || 'en-IN';
        utter.rate = 0.95;
        utter.onend = () => {
            isSpeaking = false;
            if (next) next();
        };
        speechSynthesis.speak(utter);
    };

    audio.play().catch(() => {
        const utter = new SpeechSynthesisUtterance(clean);
        utter.lang = LANG_MAP[lang] || 'en-IN';
        utter.rate = 0.95;
        utter.onend = () => {
            isSpeaking = false;
            if (next) next();
        };
        speechSynthesis.speak(utter);
    });
}

/* ─────────────── LISTEN ─────────────── */
function listen(callback, timeoutMs = 8000) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Speech recognition not supported. Please use Chrome."); return; }

    const lang = sessionStorage.getItem("language") || "en";
    const recog = new SR();
    recog.lang = LANG_MAP[lang] || "en-IN";
    recog.maxAlternatives = 5;
    recog.continuous = false;
    recog.interimResults = false;

    let done = false;

    const timer = setTimeout(() => {
        if (!done) {
            done = true;
            recog.stop();
            callback(null);
        }
    }, timeoutMs);

    recog.onresult = (e) => {
        if (done) return;
        done = true;
        clearTimeout(timer);

        let texts = [];
        for (let i = 0; i < e.results[0].length; i++) {
            texts.push(e.results[0][i].transcript.trim());
        }
        const best = texts.join(" ").toLowerCase();
        console.log("🎤 Heard:", best, "| alternatives:", texts);
        callback(best);
    };

    recog.onerror = (e) => {
        console.warn("Speech error:", e.error);
        if (!done) {
            done = true;
            clearTimeout(timer);
            callback(null);
        }
    };

    setTimeout(() => {
        if (!done) recog.start();
    }, 200);
}

/* ─────────────── REPEAT PHRASE ─────────────── */
function getRepeatPhrase() {
    return S("repeat");
}

/* Alias — page2.html, page3.html and page3.js all call getRepeatMessage()  */
function getRepeatMessage() {
    return getRepeatPhrase();
}

/* ─────────────── AUTO FILL HELPERS ─────────────── */
function autoFillInput(id, value) {
    const el = document.getElementById(id);
    if (!el) return false;
    el.value = value;
    el.dispatchEvent(new Event('input'));
    el.dispatchEvent(new Event('change'));
    return true;
}

function autoSelect(id, speech, next, retry) {
    if (!speech) { handleError(retry); return; }
    const val = normalizeSpeech(speech);
    const select = document.getElementById(id);
    if (!select) { next(); return; }

    let found = false;
    for (let opt of select.options) {
        const text = opt.text.toLowerCase().trim();
        const value = opt.value.toLowerCase().trim();
        if (val === value || val === text || text.includes(val) || val.includes(value) || value.includes(val)) {
            select.value = opt.value;
            found = true;
            break;
        }
    }

    if (found) { setTimeout(next, 400); }
    else { handleError(retry); }
}

function autoRadio(name, speech, next, retry) {
    if (!speech) { handleError(retry); return; }
    const val = normalizeSpeech(speech);
    const radios = document.getElementsByName(name);
    let found = false;

    for (let r of radios) {
        const value = r.value.toLowerCase();
        const label = r.labels && r.labels[0] ? r.labels[0].innerText.toLowerCase() : "";
        if (val === value || val.includes(value) || value.includes(val) || label.includes(val)) {
            r.checked = true;
            found = true;
        }
    }

    if (found) { setTimeout(next, 400); }
    else { handleError(retry); }
}

/* ─────────────── ERROR HANDLER ─────────────── */
function handleError(retry) {
    speak(getRepeatPhrase(), () => {
        setTimeout(retry, 600);
    });
}

/* ─────────────── SCHEME NAME MATCHER ─────────────── */
function findSchemeByVoice(spoken, schemes) {
    if (!spoken || !schemes) return null;
    const s = spoken.toLowerCase();

    // Exact match
    for (let scheme of schemes) {
        const name = scheme.toLowerCase();
        if (s === name || s.includes(name) || name.includes(s)) {
            return scheme;
        }
    }

    // Partial keyword match — match any word of 4+ chars
    const words = s.split(/\s+/).filter(w => w.length >= 4);
    for (let scheme of schemes) {
        const name = scheme.toLowerCase();
        if (words.some(w => name.includes(w))) {
            return scheme;
        }
    }

    return null;
}

/* ─────────────── STOP VOICE ─────────────── */
function stopVoice() {
    voiceActive = false;
    window.speechSynthesis.cancel();
    if (currentAudio) { currentAudio.pause(); currentAudio = null; }
    isSpeaking = false;
}

/* ─────────────── EXPORT ─────────────── */
window.YS = {
    speak, listen, isYes, isNo, normalizeSpeech,
    autoFillInput, autoSelect, autoRadio,
    handleError, getRepeatPhrase, getRepeatMessage, findSchemeByVoice,
    stopVoice, S, STRINGS, LANG_MAP
};
