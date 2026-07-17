/**
 * PAGE 2 VOICE ASSISTANT — page2.js
 * -------------------------------------------------------
 * HOW TO INCLUDE IN page2.html:
 *   1. DELETE everything inside the inline <script> block in page2.html
 *      from window.addEventListener("load"...) and the startVoiceForm call.
 *      Keep all helpers (vp, matchSelect, etc.) as they are used by this file.
 *      OR simply delete the whole inline <script> block — this file
 *      re-implements all helpers.
 *   2. Add at the very END of <body>:
 *        <script src="{{ url_for('static', filename='js/voice.js') }}"></script>
 *        <script src="{{ url_for('static', filename='js/page2.js') }}"></script>
 *
 * DEPENDS ON: voice.js must be loaded first.
 *
 * BEHAVIOUR:
 *  - All speech output is in the language selected on page1
 *    (read from sessionStorage("language")).
 *  - The assistant reads ALL available options for every form field
 *    so the user knows what to say.
 *  - Voice recognition listens broadly (English + regional) by using
 *    both native keywords and English fallback matching.
 *  - State names are ALWAYS matched in English (they are stored in English).
 * -------------------------------------------------------
 */

/* ─────────────────────────────────────────────────────────
   LANGUAGE-AWARE PROMPTS
   These override the server-rendered vp_* spans so the
   assistant speaks entirely in the selected language.
───────────────────────────────────────────────────────── */
const P2_PROMPTS = {
    en: {
        greet:      "I will help you fill this form with your voice. Let us begin with your state.",
        state:      "Which state are you from? Please say the name of your state.",
        gender:     "What is your gender?",
        age:        "How old are you? Please say your age as a number.",
        marital:    "What is your marital status?",
        caste:      "What is your caste category?",
        minority:   "Do you belong to a minority group? Say Yes or No.",
        disabled:   "Do you have any disability? Say Yes or No.",
        salary:     "What is your annual income? Please say an amount, for example 50 thousand, 2 lakh, or no income.",
        occupation: "What is your occupation? I will read the options.",
        residence:  "Do you live in an Urban area or a Rural area?",
        finish:     "Thank you! Submitting your details now. Please wait.",
        repeat:     "Sorry, I didn't catch that. Please say it again.",
        skip:       "Moving to the next question.",
        readOpts:   "The options are: ",
        sayOneOf:   "Please say one of these options.",
        orSayYesNo: "Please say Yes or No.",
    },
    hi: {
        greet:      "मैं आपको आवाज़ से यह फॉर्म भरने में मदद करूंगा। अपने राज्य से शुरू करते हैं।",
        state:      "आप किस राज्य से हैं? अपने राज्य का नाम बोलें।",
        gender:     "आपका लिंग क्या है?",
        age:        "आपकी उम्र क्या है? कृपया संख्या में बोलें।",
        marital:    "आपकी वैवाहिक स्थिति क्या है?",
        caste:      "आपकी जाति श्रेणी क्या है?",
        minority:   "क्या आप अल्पसंख्यक समूह से हैं? हाँ या नहीं कहें।",
        disabled:   "क्या आपको कोई विकलांगता है? हाँ या नहीं कहें।",
        salary:     "आपकी वार्षिक आय क्या है? मैं विकल्प पढूंगा।",
        occupation: "आपका व्यवसाय क्या है? मैं विकल्प पढूंगा।",
        residence:  "क्या आप शहरी क्षेत्र में रहते हैं या ग्रामीण क्षेत्र में?",
        finish:     "धन्यवाद! अब आपका विवरण जमा किया जा रहा है। कृपया प्रतीक्षा करें।",
        repeat:     "माफ करें, मैं समझ नहीं पाया। कृपया फिर से बोलें।",
        skip:       "अगले प्रश्न पर जा रहे हैं।",
        readOpts:   "विकल्प हैं: ",
        sayOneOf:   "कृपया इनमें से एक विकल्प बोलें।",
        orSayYesNo: "कृपया हाँ या नहीं बोलें।",
    },
    mr: {
        greet:      "मी तुम्हाला आवाजाने हा फॉर्म भरण्यास मदत करेन. तुमच्या राज्यापासून सुरुवात करूया.",
        state:      "तुम्ही कोणत्या राज्यातून आहात? तुमच्या राज्याचे नाव सांगा.",
        gender:     "तुमचे लिंग काय आहे?",
        age:        "तुमचे वय किती आहे? कृपया संख्येत सांगा.",
        marital:    "तुमची वैवाहिक स्थिती काय आहे?",
        caste:      "तुमची जात श्रेणी काय आहे?",
        minority:   "तुम्ही अल्पसंख्याक गटातील आहात का? हो किंवा नाही सांगा.",
        disabled:   "तुम्हाला काही अपंगत्व आहे का? हो किंवा नाही सांगा.",
        salary:     "तुमचे वार्षिक उत्पन्न किती आहे? उदा. 50 हजार, 2 लाख, किंवा उत्पन्न नाही.",
        occupation: "तुमचा व्यवसाय काय आहे? मी पर्याय वाचेन.",
        residence:  "तुम्ही शहरी भागात राहता का ग्रामीण भागात?",
        finish:     "धन्यवाद! तुमचे तपशील आता सादर केले जात आहेत. कृपया प्रतीक्षा करा.",
        repeat:     "माफ करा, मला समजले नाही. कृपया पुन्हा सांगा.",
        skip:       "पुढील प्रश्नाकडे जात आहोत.",
        readOpts:   "पर्याय आहेत: ",
        sayOneOf:   "कृपया यापैकी एक पर्याय सांगा.",
        orSayYesNo: "कृपया हो किंवा नाही सांगा.",
    },
    te: {
        greet:      "నేను మీకు వాయిస్ ద్వారా ఈ ఫారమ్ నింపడంలో సహాయం చేస్తాను. మీ రాష్ట్రంతో ప్రారంభిద్దాం.",
        state:      "మీరు ఏ రాష్ట్రం నుండి వచ్చారు? మీ రాష్ట్రం పేరు చెప్పండి.",
        gender:     "మీ లింగం ఏమిటి?",
        age:        "మీ వయసు ఎంత? దయచేసి సంఖ్యలో చెప్పండి.",
        marital:    "మీ వైవాహిక స్థితి ఏమిటి?",
        caste:      "మీ కులం వర్గం ఏమిటి?",
        minority:   "మీరు మైనారిటీ వర్గానికి చెందినవారా? అవును లేదా కాదు చెప్పండి.",
        disabled:   "మీకు వికలాంగత ఉందా? అవును లేదా కాదు చెప్పండి.",
        salary:     "మీ వార్షిక ఆదాయం ఎంత? ఉదాహరణకు 50 వేలు, 2 లక్షలు, లేదా ఆదాయం లేదు అని చెప్పండి.",
        occupation: "మీ వృత్తి ఏమిటి? నేను అన్ని ఎంపికలు చదువుతాను.",
        residence:  "మీరు పట్టణ ప్రాంతంలో నివసిస్తున్నారా లేదా గ్రామీణ ప్రాంతంలో?",
        finish:     "ధన్యవాదాలు! ఇప్పుడు మీ వివరాలు సమర్పిస్తున్నాం. దయచేసి వేచి ఉండండి.",
        repeat:     "క్షమించండి, అర్థం కాలేదు. దయచేసి మళ్లీ చెప్పండి.",
        skip:       "తదుపరి ప్రశ్నకు వెళ్తున్నాం.",
        readOpts:   "ఎంపికలు: ",
        sayOneOf:   "దయచేసి ఈ ఎంపికల్లో ఒకటి చెప్పండి.",
        orSayYesNo: "దయచేసి అవును లేదా కాదు చెప్పండి.",
    },
    ta: {
        greet:      "குரல் மூலம் இந்த படிவத்தை நிரப்ப உதவுகிறேன். உங்கள் மாநிலத்தில் இருந்து தொடங்குவோம்.",
        state:      "நீங்கள் எந்த மாநிலத்தைச் சேர்ந்தவர்? நான் விருப்பங்களை படிக்கிறேன்.",
        gender:     "உங்கள் பாலினம் என்ன?",
        age:        "உங்கள் வயது என்ன? எண்ணில் சொல்லுங்கள்.",
        marital:    "உங்கள் திருமண நிலை என்ன?",
        caste:      "உங்கள் சாதி வகை என்ன?",
        minority:   "நீங்கள் சிறுபான்மை குழுவைச் சேர்ந்தவரா? ஆம் அல்லது இல்லை சொல்லுங்கள்.",
        disabled:   "உங்களுக்கு ஏதாவது மாற்றுத்திறன் உள்ளதா? ஆம் அல்லது இல்லை சொல்லுங்கள்.",
        salary:     "உங்கள் ஆண்டு வருமானம் என்ன? நான் விருப்பங்களை படிக்கிறேன்.",
        occupation: "உங்கள் தொழில் என்ன? நான் விருப்பங்களை படிக்கிறேன்.",
        residence:  "நீங்கள் நகர்ப்புற பகுதியில் வசிக்கிறீர்களா அல்லது கிராமப்புற பகுதியில்?",
        finish:     "நன்றி! இப்போது உங்கள் விவரங்கள் சமர்ப்பிக்கப்படுகின்றன. தயவுசெய்து காத்திருங்கள்.",
        repeat:     "மன்னிக்கவும், புரியவில்லை. மீண்டும் சொல்லுங்கள்.",
        skip:       "அடுத்த கேள்விக்கு செல்கிறோம்.",
        readOpts:   "விருப்பங்கள்: ",
        sayOneOf:   "தயவுசெய்து இந்த விருப்பங்களில் ஒன்றை சொல்லுங்கள்.",
        orSayYesNo: "தயவுசெய்து ஆம் அல்லது இல்லை சொல்லுங்கள்.",
    },
    kn: {
        greet:      "ಧ್ವನಿ ಮೂಲಕ ಈ ಫಾರ್ಮ್ ತುಂಬಲು ನಾನು ಸಹಾಯ ಮಾಡುತ್ತೇನೆ. ನಿಮ್ಮ ರಾಜ್ಯದಿಂದ ಪ್ರಾರಂಭಿಸೋಣ.",
        state:      "ನೀವು ಯಾವ ರಾಜ್ಯದಿಂದ ಬಂದಿದ್ದೀರಿ? ನಿಮ್ಮ ರಾಜ್ಯದ ಹೆಸರು ಹೇಳಿ.",
        gender:     "ನಿಮ್ಮ ಲಿಂಗ ಏನು?",
        age:        "ನಿಮ್ಮ ವಯಸ್ಸು ಎಷ್ಟು? ದಯವಿಟ್ಟು ಸಂಖ್ಯೆಯಲ್ಲಿ ಹೇಳಿ.",
        marital:    "ನಿಮ್ಮ ವೈವಾಹಿಕ ಸ್ಥಿತಿ ಏನು?",
        caste:      "ನಿಮ್ಮ ಜಾತಿ ವರ್ಗ ಏನು?",
        minority:   "ನೀವು ಅಲ್ಪಸಂಖ್ಯಾತ ಗುಂಪಿಗೆ ಸೇರಿದ್ದೀರಾ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ಹೇಳಿ.",
        disabled:   "ನಿಮಗೆ ಯಾವುದಾದರೂ ಅಂಗವೈಕಲ್ಯ ಇದೆಯೇ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ಹೇಳಿ.",
        salary:     "ನಿಮ್ಮ ವಾರ್ಷಿಕ ಆದಾಯ ಎಷ್ಟು? ಉದಾ. 50 ಸಾವಿರ, 2 ಲಕ್ಷ, ಅಥವಾ ಆದಾಯ ಇಲ್ಲ ಎಂದು ಹೇಳಿ.",
        occupation: "ನಿಮ್ಮ ವೃತ್ತಿ ಏನು? ನಾನು ಆಯ್ಕೆಗಳನ್ನು ಓದುತ್ತೇನೆ.",
        residence:  "ನೀವು ನಗರ ಪ್ರದೇಶದಲ್ಲಿ ವಾಸಿಸುತ್ತೀರಾ ಅಥವಾ ಗ್ರಾಮೀಣ ಪ್ರದೇಶದಲ್ಲಿ?",
        finish:     "ಧನ್ಯವಾದ! ನಿಮ್ಮ ವಿವರಗಳನ್ನು ಈಗ ಸಲ್ಲಿಸಲಾಗುತ್ತಿದೆ. ದಯವಿಟ್ಟು ನಿರೀಕ್ಷಿಸಿ.",
        repeat:     "ಕ್ಷಮಿಸಿ, ಅರ್ಥವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಹೇಳಿ.",
        skip:       "ಮುಂದಿನ ಪ್ರಶ್ನೆಗೆ ಹೋಗುತ್ತಿದ್ದೇವೆ.",
        readOpts:   "ಆಯ್ಕೆಗಳು: ",
        sayOneOf:   "ದಯವಿಟ್ಟು ಈ ಆಯ್ಕೆಗಳಲ್ಲಿ ಒಂದನ್ನು ಹೇಳಿ.",
        orSayYesNo: "ದಯವಿಟ್ಟು ಹೌದು ಅಥವಾ ಇಲ್ಲ ಹೇಳಿ.",
    },
    bn: {
        greet:      "আমি আপনাকে ভয়েস দিয়ে এই ফর্ম পূরণ করতে সাহায্য করব। আপনার রাজ্য দিয়ে শুরু করি।",
        state:      "আপনি কোন রাজ্য থেকে এসেছেন? আপনার রাজ্যের নাম বলুন।",
        gender:     "আপনার লিঙ্গ কি?",
        age:        "আপনার বয়স কত? দয়া করে সংখ্যায় বলুন।",
        marital:    "আপনার বৈবাহিক অবস্থা কি?",
        caste:      "আপনার জাতি বিভাগ কি?",
        minority:   "আপনি কি সংখ্যালঘু গোষ্ঠীর? হ্যাঁ বা না বলুন।",
        disabled:   "আপনার কি কোনো প্রতিবন্ধিতা আছে? হ্যাঁ বা না বলুন।",
        salary:     "আপনার বার্ষিক আয় কত? যেমন 50 হাজার, 2 লক্ষ, অথবা কোনো আয় নেই বলুন।",
        occupation: "আপনার পেশা কি? আমি বিকল্পগুলো পড়ব।",
        residence:  "আপনি কি শহরে থাকেন নাকি গ্রামে?",
        finish:     "ধন্যবাদ! আপনার তথ্য এখন জমা দেওয়া হচ্ছে। দয়া করে অপেক্ষা করুন।",
        repeat:     "দুঃখিত, বুঝতে পারিনি। দয়া করে আবার বলুন।",
        skip:       "পরের প্রশ্নে যাচ্ছি।",
        readOpts:   "বিকল্পগুলো হল: ",
        sayOneOf:   "দয়া করে এই বিকল্পগুলির একটি বলুন।",
        orSayYesNo: "দয়া করে হ্যাঁ বা না বলুন।",
    },
    gu: {
        greet:      "હું તમને અવાજ દ્વારા આ ફોર્મ ભરવામાં મદદ કરીશ. ચાલો તમારા રાજ્યથી શરૂ કરીએ.",
        state:      "તમે ક્યા રાજ્યથી છો? હું બધા વિકલ્પો વાંચીશ.",
        gender:     "તમારું લિંગ શું છે?",
        age:        "તમારી ઉંમર કેટલી છે? કૃપા કરીને નંબરમાં કહો.",
        marital:    "તમારી વૈવાહિક સ્થિતિ શું છે?",
        caste:      "તમારી જ્ઞાતિ શ્રેણી શું છે?",
        minority:   "શું તમે લઘુમતી જૂથના છો? હા અથવા ના કહો.",
        disabled:   "શું તમને કોઈ અપંગતા છે? હા અથવા ના કહો.",
        salary:     "તમારી વાર્ષિક આવક શું છે? હું વિકલ્પો વાંચીશ.",
        occupation: "તમારો વ્યવસાય શું છે? હું વિકલ્પો વાંચીશ.",
        residence:  "તમે શહેરી વિસ્તારમાં રહો છો કે ગ્રામીણ વિસ્તારમાં?",
        finish:     "આભાર! તમારી વિગતો હવે સબમિટ થઈ રહી છે. કૃપા કરીને રાહ જુઓ.",
        repeat:     "માફ કરો, સમજ ન પડ્યું. કૃપા કરીને ફરી કહો.",
        skip:       "આગળના સવાલ પર જઈ રહ્યા છીએ.",
        readOpts:   "વિકલ્પો છે: ",
        sayOneOf:   "કૃપા કરીને આ વિકલ્પોમાંથી એક કહો.",
        orSayYesNo: "કૃપા કરીને હા અથવા ના કહો.",
    },
    ml: {
        greet:      "ശബ്ദം ഉപയോഗിച്ച് ഈ ഫോം പൂരിപ്പിക്കാൻ ഞാൻ സഹായിക്കും. നിങ്ങളുടെ സംസ്ഥാനത്ത് നിന്ന് ആരംഭിക്കാം.",
        state:      "നിങ്ങൾ ഏത് സംസ്ഥാനത്ത് നിന്നാണ്? നിങ്ങളുടെ സംസ്ഥാനത്തിന്റെ പേര് പറയൂ.",
        gender:     "നിങ്ങളുടെ ലിംഗം എന്താണ്?",
        age:        "നിങ്ങളുടെ പ്രായം എത്രയാണ്? ദയവായി നമ്പറിൽ പറയൂ.",
        marital:    "നിങ്ങളുടെ വൈവാഹിക നില എന്താണ്?",
        caste:      "നിങ്ങളുടെ ജാതി വിഭാഗം ഏതാണ്?",
        minority:   "നിങ്ങൾ ന്യൂനപക്ഷ വിഭാഗത്തിൽ ഉൾപ്പെടുന്നോ? അതെ അല്ലെങ്കിൽ ഇല്ല പറയൂ.",
        disabled:   "നിങ്ങൾക്ക് എന്തെങ്കിലും വൈകല്യം ഉണ്ടോ? അതെ അല്ലെങ്കിൽ ഇല്ല പറയൂ.",
        salary:     "നിങ്ങളുടെ വാർഷിക വരുമാനം എത്രയാണ്? ഉദാ. 50 ആയിരം, 2 ലക്ഷം, അല്ലെങ്കിൽ വരുമാനം ഇല്ല.",
        occupation: "നിങ്ങളുടെ തൊഴിൽ എന്താണ്? ഞാൻ ഓപ്ഷനുകൾ വായിക്കും.",
        residence:  "നിങ്ങൾ നഗര പ്രദേശത്ത് താമസിക്കുന്നോ അതോ ഗ്രാമീണ പ്രദേശത്ത്?",
        finish:     "നന്ദി! നിങ്ങളുടെ വിവരങ്ങൾ ഇപ്പോൾ സമർപ്പിക്കുന്നു. ദയവായി കാത്തിരിക്കൂ.",
        repeat:     "ക്ഷമിക്കണം, മനസ്സിലായില്ല. ദയവായി വീണ്ടും പറയൂ.",
        skip:       "അടുത്ത ചോദ്യത്തിലേക്ക് പോകുന്നു.",
        readOpts:   "ഓപ്ഷനുകൾ: ",
        sayOneOf:   "ദയവായി ഈ ഓപ്ഷനുകളിൽ ഒന്ന് പറയൂ.",
        orSayYesNo: "ദയവായി അതെ അല്ലെങ്കിൽ ഇല്ല പറയൂ.",
    },
    pa: {
        greet:      "ਮੈਂ ਤੁਹਾਨੂੰ ਆਵਾਜ਼ ਨਾਲ ਇਹ ਫਾਰਮ ਭਰਨ ਵਿੱਚ ਮਦਦ ਕਰਾਂਗਾ। ਤੁਹਾਡੇ ਰਾਜ ਤੋਂ ਸ਼ੁਰੂ ਕਰਦੇ ਹਾਂ।",
        state:      "ਤੁਸੀਂ ਕਿਸ ਰਾਜ ਤੋਂ ਹੋ? ਆਪਣੇ ਰਾਜ ਦਾ ਨਾਮ ਬੋਲੋ।",
        gender:     "ਤੁਹਾਡਾ ਲਿੰਗ ਕੀ ਹੈ?",
        age:        "ਤੁਹਾਡੀ ਉਮਰ ਕਿੰਨੀ ਹੈ? ਕਿਰਪਾ ਕਰਕੇ ਨੰਬਰ ਵਿੱਚ ਦੱਸੋ।",
        marital:    "ਤੁਹਾਡੀ ਵਿਆਹੁਤਾ ਸਥਿਤੀ ਕੀ ਹੈ?",
        caste:      "ਤੁਹਾਡੀ ਜਾਤ ਸ਼੍ਰੇਣੀ ਕੀ ਹੈ?",
        minority:   "ਕੀ ਤੁਸੀਂ ਘੱਟ ਗਿਣਤੀ ਸਮੂਹ ਤੋਂ ਹੋ? ਹਾਂ ਜਾਂ ਨਹੀਂ ਕਹੋ।",
        disabled:   "ਕੀ ਤੁਹਾਨੂੰ ਕੋਈ ਅਪਾਹਜਤਾ ਹੈ? ਹਾਂ ਜਾਂ ਨਹੀਂ ਕਹੋ।",
        salary:     "ਤੁਹਾਡੀ ਸਾਲਾਨਾ ਆਮਦਨ ਕਿੰਨੀ ਹੈ? ਮੈਂ ਵਿਕਲਪ ਪੜ੍ਹਾਂਗਾ।",
        occupation: "ਤੁਹਾਡਾ ਕਿੱਤਾ ਕੀ ਹੈ? ਮੈਂ ਵਿਕਲਪ ਪੜ੍ਹਾਂਗਾ।",
        residence:  "ਕੀ ਤੁਸੀਂ ਸ਼ਹਿਰੀ ਖੇਤਰ ਵਿੱਚ ਰਹਿੰਦੇ ਹੋ ਜਾਂ ਪੇਂਡੂ ਖੇਤਰ ਵਿੱਚ?",
        finish:     "ਧੰਨਵਾਦ! ਤੁਹਾਡੀ ਜਾਣਕਾਰੀ ਹੁਣ ਜਮਾਂ ਕੀਤੀ ਜਾ ਰਹੀ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਉਡੀਕ ਕਰੋ।",
        repeat:     "ਮਾਫ਼ ਕਰੋ, ਸਮਝ ਨਹੀਂ ਆਇਆ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਕਹੋ।",
        skip:       "ਅਗਲੇ ਸਵਾਲ 'ਤੇ ਜਾ ਰਹੇ ਹਾਂ।",
        readOpts:   "ਵਿਕਲਪ ਹਨ: ",
        sayOneOf:   "ਕਿਰਪਾ ਕਰਕੇ ਇਹਨਾਂ ਵਿਕਲਪਾਂ ਵਿੱਚੋਂ ਇੱਕ ਕਹੋ।",
        orSayYesNo: "ਕਿਰਪਾ ਕਰਕੇ ਹਾਂ ਜਾਂ ਨਹੀਂ ਕਹੋ।",
    },
    or: {
        greet:      "ମୁଁ ଆପଣଙ୍କୁ ଭଏସ ଦ୍ବାରା ଏହି ଫର୍ମ ପୂରଣ କରିବାରେ ସାହାଯ୍ୟ କରିବି। ଆପଣଙ୍କ ରାଜ୍ୟରୁ ଆରମ୍ଭ କରୁ।",
        state:      "ଆପଣ କେଉଁ ରାଜ୍ୟରୁ? ଆପଣଙ୍କ ରାଜ୍ୟର ନାମ କୁହନ୍ତୁ।",
        gender:     "ଆପଣଙ୍କ ଲିଙ୍ଗ କ'ଣ?",
        age:        "ଆପଣଙ୍କ ବୟସ କେତେ? ଦୟାକରି ସଂଖ୍ୟାରେ କୁହନ୍ତୁ।",
        marital:    "ଆପଣଙ୍କ ବୈବାହିକ ସ୍ଥିତି କ'ଣ?",
        caste:      "ଆପଣଙ୍କ ଜାତି ବର୍ଗ କ'ଣ?",
        minority:   "ଆପଣ ଅଳ୍ପସଂଖ୍ୟକ ଗୋଷ୍ଠୀରୁ? ହଁ ବା ନା କୁହନ୍ତୁ।",
        disabled:   "ଆପଣଙ୍କ କୌଣସି ଅଶକ୍ତତା ଅଛି କି? ହଁ ବା ନା କୁହନ୍ତୁ।",
        salary:     "ଆପଣଙ୍କ ବାର୍ଷିକ ଆୟ କେତେ? ମୁଁ ବିକଳ୍ପ ପଢ଼ିବି।",
        occupation: "ଆପଣଙ୍କ ବୃତ୍ତି କ'ଣ? ମୁଁ ବିକଳ୍ପ ପଢ଼ିବି।",
        residence:  "ଆପଣ ସହର ଅଞ୍ଚଳରେ ବାସ କରନ୍ତି ନା ଗ୍ରାମୀଣ ଅଞ୍ଚଳରେ?",
        finish:     "ଧନ୍ୟବାଦ! ଆପଣଙ୍କ ତଥ୍ୟ ଏବେ ଦାଖଲ ହେଉଛି। ଦୟାକରି ଅପେକ୍ଷା କରନ୍ତୁ।",
        repeat:     "ଦୟାକରି ଆଉ ଥରେ କୁହନ୍ତୁ।",
        skip:       "ପରବର୍ତ୍ତୀ ପ୍ରଶ୍ନକୁ ଯାଉଛୁ।",
        readOpts:   "ବିକଳ୍ପ ଗୁଡ଼ିକ ହେଉଛି: ",
        sayOneOf:   "ଦୟାକରି ଏହି ବିକଳ୍ପ ଗୁଡ଼ିକ ମଧ୍ୟରୁ ଗୋଟିଏ କୁହନ୍ତୁ।",
        orSayYesNo: "ଦୟାକରି ହଁ ବା ନା କୁହନ୍ତୁ।",
    },
    ur: {
        greet:      "میں آپ کو آواز سے یہ فارم بھرنے میں مدد کروں گا۔ آپ کی ریاست سے شروع کرتے ہیں۔",
        state:      "آپ کس ریاست سے ہیں؟ اپنی ریاست کا نام بولیں۔",
        gender:     "آپ کی جنس کیا ہے؟",
        age:        "آپ کی عمر کیا ہے؟ براہ کرم نمبر میں بتائیں۔",
        marital:    "آپ کی ازدواجی حیثیت کیا ہے؟",
        caste:      "آپ کی ذات کا زمرہ کیا ہے؟",
        minority:   "کیا آپ اقلیتی گروہ سے تعلق رکھتے ہیں؟ ہاں یا نہیں کہیں۔",
        disabled:   "کیا آپ کو کوئی معذوری ہے؟ ہاں یا نہیں کہیں۔",
        salary:     "آپ کی سالانہ آمدنی کیا ہے؟ مثلاً 50 ہزار، 2 لاکھ، یا کوئی آمدنی نہیں۔",
        occupation: "آپ کا پیشہ کیا ہے؟ میں اختیارات پڑھوں گا۔",
        residence:  "کیا آپ شہری علاقے میں رہتے ہیں یا دیہی علاقے میں؟",
        finish:     "شکریہ! آپ کی معلومات اب جمع کی جا رہی ہیں۔ براہ کرم انتظار کریں۔",
        repeat:     "معاف کریں، سمجھ نہیں آیا۔ براہ کرم دوبارہ کہیں۔",
        skip:       "اگلے سوال پر جا رہے ہیں۔",
        readOpts:   "اختیارات ہیں: ",
        sayOneOf:   "براہ کرم ان اختیارات میں سے ایک کہیں۔",
        orSayYesNo: "براہ کرم ہاں یا نہیں کہیں۔",
    },
    as: {
        greet:      "মই আপোনাক ভয়েছেৰে এই ফৰ্ম পূৰণ কৰিবলৈ সহায় কৰিম। আপোনাৰ ৰাজ্যৰ পৰা আৰম্ভ কৰোঁ।",
        state:      "আপুনি কোন ৰাজ্যৰ পৰা? আপোনাৰ ৰাজ্যৰ নাম কওক।",
        gender:     "আপোনাৰ লিংগ কি?",
        age:        "আপোনাৰ বয়স কিমান? অনুগ্ৰহ কৰি সংখ্যাত কওক।",
        marital:    "আপোনাৰ বৈবাহিক অৱস্থা কি?",
        caste:      "আপোনাৰ জাতি বিভাগ কি?",
        minority:   "আপুনি সংখ্যালঘু গোটৰ নেকি? হয় বা নহয় কওক।",
        disabled:   "আপোনাৰ কোনো অক্ষমতা আছে নেকি? হয় বা নহয় কওক।",
        salary:     "আপোনাৰ বাৰ্ষিক আয় কিমান? মই বিকল্পসমূহ পঢ়িম।",
        occupation: "আপোনাৰ পেশা কি? মই বিকল্পসমূহ পঢ়িম।",
        residence:  "আপুনি নগৰীয়া অঞ্চলত বাস কৰে নে গ্ৰাম্য অঞ্চলত?",
        finish:     "ধন্যবাদ! আপোনাৰ তথ্য এতিয়া দাখিল কৰা হৈছে। অনুগ্ৰহ কৰি অপেক্ষা কৰক।",
        repeat:     "দুঃখিত, বুজা নগ'ল। অনুগ্ৰহ কৰি আকৌ কওক।",
        skip:       "পৰৱৰ্তী প্ৰশ্নলৈ যাওঁ।",
        readOpts:   "বিকল্পসমূহ হ'ল: ",
        sayOneOf:   "অনুগ্ৰহ কৰি এই বিকল্পসমূহৰ এটা কওক।",
        orSayYesNo: "অনুগ্ৰহ কৰি হয় বা নহয় কওক।",
    },
};

/* ─────────────────────────────────────────────────────────
   GET PROMPT IN SELECTED LANGUAGE
───────────────────────────────────────────────────────── */
function p2_t(key) {
    const lang = sessionStorage.getItem("language") || "en";
    const table = P2_PROMPTS[lang] || P2_PROMPTS["en"];
    return table[key] || P2_PROMPTS["en"][key] || key;
}

/* ─────────────────────────────────────────────────────────
   READ ALL OPTIONS FROM A <select> ELEMENT
   Returns the text to speak, formatted as a list.
───────────────────────────────────────────────────────── */
function p2_readSelectOptions(selectId) {
    const sel = document.getElementById(selectId);
    if (!sel) return "";
    const opts = Array.from(sel.options)
        .filter(o => o.value)          // skip placeholder
        .map(o => o.text.trim());
    return opts.join(", ");
}

/* ─────────────────────────────────────────────────────────
   READ ALL OPTIONS FROM RADIO BUTTONS
───────────────────────────────────────────────────────── */
function p2_readRadioOptions(name) {
    const radios = document.getElementsByName(name);
    return Array.from(radios).map(r => r.value.trim()).join(", ");
}

/* ─────────────────────────────────────────────────────────
   FUZZY MATCH SPOKEN TEXT AGAINST A <select>
   Always does English-only matching since option values
   are stored in English.
───────────────────────────────────────────────────────── */
function p2_matchSelect(speech, selectId) {
    if (!speech) return null;
    const clean = speech.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
    const sel   = document.getElementById(selectId);
    if (!sel) return null;
    for (const opt of sel.options) {
        if (!opt.value) continue;
        const t = opt.text.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
        const v = opt.value.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
        if (clean === v || clean === t || t.includes(clean) || clean.includes(v)) return opt.value;
    }
    return null;
}

/* ─────────────────────────────────────────────────────────
   YES / NO — covers native words for all languages
───────────────────────────────────────────────────────── */
function p2_yesNo(speech) {
    if (!speech) return null;
    const s = speech.toLowerCase();
    const yes = [
        "yes","yeah","yep","yup","ok","okay","sure","correct",
        // Hindi/Marathi/Urdu
        "haan","ha","ho","ji","bilkul","sahi","avunu","hou","aam",
        // Marathi
        "hoy",
        // Bengali
        "hya","hyan",
        // Gujarati
        "ha ji",
        // Tamil
        "aam","aama",
        // Telugu
        "avunu","avunandi",
        // Kannada
        "haudu","haan",
        // Malayalam
        "athe","aathe",
        // Punjabi
        "haan ji","aho",
        // Odia
        "ha","hun",
    ];
    const no = [
        "no","nah","nope","not",
        "nahi","nahi hai","nako","nain","nei","nee","ledu",
        "vadu","vendam","illa","illai",
        "nalla","bas","mat","chup","ruk",
        "naahi","nai",
    ];
    if (yes.some(w => s.includes(w))) return "Yes";
    if (no.some(w => s.includes(w)))  return "No";
    return null;
}

/* ─────────────────────────────────────────────────────────
   GENDER — covers native words for major languages
───────────────────────────────────────────────────────── */
function p2_gender(speech) {
    const s = speech.toLowerCase();
    const female = [
        "female","woman","women","girl","lady",
        "महिला","ladki","aurat","स्त्री","స్త్రీ",
        "பெண்","ಮಹಿಳೆ","സ്ത്രീ","ਔਰਤ","মহিলা",
    ];
    const male = [
        "male","man","men","boy","gentleman",
        "पुरुष","ladka","aadmi","mard","पुरुष","పురుషుడు",
        "ஆண்","ಪುರುಷ","പുരുഷൻ","ਮਰਦ","পুরুষ",
    ];
    const other = ["other","others","third","transgender","other gender"];

    if (female.some(w => s.includes(w))) return "Female";
    if (male.some(w => s.includes(w)))   return "Male";
    if (other.some(w => s.includes(w)))  return "Other";
    return null;
}

/* ─────────────────────────────────────────────────────────
   MARITAL STATUS
───────────────────────────────────────────────────────── */
function p2_marital(speech) {
    const s = speech.toLowerCase();
    if (s.includes("widow") || s.includes("vidhwa") || s.includes("vidhwaa"))
        return "Widow";
    if (s.includes("divorc") || s.includes("talak") || s.includes("ghatasphot"))
        return "Divorced";
    if (
        s.includes("unmarried") || s.includes("single") ||
        s.includes("not married") || s.includes("bachelor") ||
        s.includes("kumari") || s.includes("अविवाहित") || s.includes("अविवाहित")
    ) return "Unmarried";
    if (
        s.includes("married") || s.includes("vivahit") ||
        s.includes("shadi") || s.includes("विवाहित") || s.includes("विवाहित")
    ) return "Married";
    return null;
}

/* ─────────────────────────────────────────────────────────
   RESIDENCE
───────────────────────────────────────────────────────── */
function p2_residence(speech) {
    const s = speech.toLowerCase();
    const urban = [
        "urban","city","town","shehar","nagar","شہر",
        "நகர்","ನಗರ","നഗരം","ਸ਼ਹਿਰ","শহর","શહેર",
    ];
    const rural = [
        "rural","village","gaon","gram","gramin",
        "गाव","गाँव","கிராமம்","ಗ್ರಾಮ","ഗ്രാമം","ਪਿੰਡ","গ্রাম","ગ્રામ",
    ];
    if (urban.some(w => s.includes(w))) return "Urban";
    if (rural.some(w => s.includes(w))) return "Rural";
    return null;
}

/* ─────────────────────────────────────────────────────────
   SALARY INDEX (1-based, matches select options)
───────────────────────────────────────────────────────── */
function p2_salary(speech) {
    if (!speech) return null;
    const s = speech.toLowerCase().trim();

    /* ── 1. No income keywords (all languages) ── */
    const noIncomeWords = [
        "no income","zero income","nil","nothing","no earning","not earning",
        "koi aay nahi","koi income nahi","koi amdani nahi","income nahi",
        "शून्य","आय नहीं","उत्पन्न नाही","वेतन नहीं","आमदनी नहीं",
        "வருமானம் இல்லை","ఆదాయం లేదు","ಆದಾಯ ಇಲ್ಲ","വരുമാനം ഇല്ല",
        "कोई आय नहीं", "zero",
    ];
    if (noIncomeWords.some(w => s.includes(w))) return 1;
    if ((s.includes("no") || s.includes("nahi") || s.includes("nill")) && s.includes("income")) return 1;

    /* ── 2. Word-to-number table (English + Hindi/Marathi spoken numbers) ── */
    const wordNums = {
        // English
        "one":1,"two":2,"three":3,"four":4,"five":5,"six":6,"seven":7,"eight":8,"nine":9,"ten":10,
        "eleven":11,"twelve":12,"thirteen":13,"fourteen":14,"fifteen":15,"sixteen":16,
        "seventeen":17,"eighteen":18,"nineteen":19,"twenty":20,"thirty":30,"forty":40,
        "fifty":50,"sixty":60,"seventy":70,"eighty":80,"ninety":90,"hundred":100,
        // Hindi/Marathi spoken
        "ek":1,"do":2,"teen":3,"char":4,"paanch":5,"chhe":6,"saat":7,"aath":8,"nau":9,"das":10,
        "gyarah":11,"barah":12,"terah":13,"chaudah":14,"pandrah":15,"solah":16,
        "satrah":17,"atharah":18,"unnis":19,"bees":20,"tees":30,"chalis":40,
        "pachas":50,"saath":60,"sattar":70,"assi":80,"nabbe":90,
    };

    /* Replace word-numbers in string so "five lakh" → "5 lakh" */
    let normalized = s;
    for (const [word, num] of Object.entries(wordNums)) {
        normalized = normalized.replace(new RegExp("\b" + word + "\b", "g"), String(num));
    }

    /* ── 3. Parse lakh/crore expressions → absolute rupee amount ── */
    let amount = null;

    // "X lakh" / "X.Y lakh"
    const lakhMatch = normalized.match(/([\d.]+)\s*(?:lakh|lac|लाख|ਲੱਖ|லக்ஷ|లక్ష|ಲಕ್ಷ|ലക്ഷം)/);
    if (lakhMatch) {
        amount = parseFloat(lakhMatch[1]) * 100000;
    }

    // "X crore"
    const croreMatch = normalized.match(/([\d.]+)\s*(?:crore|cr|करोड़|कोटी)/);
    if (croreMatch) {
        amount = parseFloat(croreMatch[1]) * 10000000;
    }

    // "X thousand" / "X हजार"
    const thousandMatch = normalized.match(/([\d.]+)\s*(?:thousand|k|हजार|ਹਜ਼ਾਰ|ஆயிரம்|వేల|ಸಾವಿರ|ആയിരം)/);
    if (!amount && thousandMatch) {
        amount = parseFloat(thousandMatch[1]) * 1000;
    }

    // Bare number (digits only) — treat as rupees directly
    if (!amount) {
        const bareNum = normalized.match(/(\d{4,})/); // 4+ digit = likely rupees
        if (bareNum) amount = parseInt(bareNum[1], 10);
    }

    /* ── 4. Map rupee amount → select index ── */
    // Salary select options (index 0 = placeholder):
    // 1 = No Income (0)
    // 2 = Below ₹1,00,000
    // 3 = ₹1,00,000 – ₹2,50,000
    // 4 = ₹2,50,001 – ₹5,00,000
    // 5 = Above ₹10,00,000 (also covers 5L–10L gap)
    if (amount !== null) {
        if (amount === 0)           return 1;
        if (amount < 100000)        return 2;
        if (amount <= 250000)       return 3;
        if (amount <= 1000000)      return 4;
        return 5;
    }

    /* ── 5. Phrase-based fallback (spoken ranges without numbers) ── */
    if (s.includes("below 1") || s.includes("less than 1") || s.includes("ek lakh se kam")
        || s.includes("under 1")) return 2;

    if (s.includes("above 10") || s.includes("more than 10") || s.includes("das lakh se zyada")
        || s.includes("crore") || s.includes("high income") || s.includes("bahut zyada")) return 5;

    return null;
}

/* ─────────────────────────────────────────────────────────
   CHECK RADIO
───────────────────────────────────────────────────────── */
function p2_checkRadio(name, value) {
    const radios = document.getElementsByName(name);
    for (const r of radios) {
        if (r.value.toLowerCase() === value.toLowerCase()) {
            r.checked = true;
            return true;
        }
    }
    return false;
}

/* ─────────────────────────────────────────────────────────
   RETRY WRAPPER
───────────────────────────────────────────────────────── */
function p2_ask(fn, next, maxRetries) {
    if (maxRetries === undefined) maxRetries = 3;
    let attempt = 0;

    function run() {
        fn(
            (v) => next(v),
            () => {
                attempt++;
                if (attempt >= maxRetries) {
                    speak(p2_t("skip"), () => next(null));
                } else {
                    speak(p2_t("repeat"), () => setTimeout(run, 400));
                }
            }
        );
    }
    run();
}

/* ─────────────────────────────────────────────────────────
   INDIVIDUAL QUESTION FUNCTIONS
   Each reads prompt + available options, then listens.
───────────────────────────────────────────────────────── */

/* STATE — just ask; user speaks their state name. No list read-out. */
function p2_doState(onSuccess, onRetry) {
    speak(p2_t("state"), () => {
        listen(speech => {
            const val = p2_matchSelect(speech, "state");
            if (val) {
                document.getElementById("state").value = val;
                onSuccess(val);
            } else {
                onRetry();
            }
        });
    });
}

/* GENDER — gender is a <select> not radio buttons; match against option values directly */
function p2_doGender(onSuccess, onRetry) {
    speak(p2_t("gender"), () => {
        listen(speech => {
            // First try keyword-based match (works for all languages)
            let val = p2_gender(speech);
            // Fallback: scan the select options whose .value is plain English (Male/Female/Other)
            if (!val) {
                const s = speech.toLowerCase();
                const sel = document.getElementById("gender");
                if (sel) {
                    for (const opt of sel.options) {
                        if (!opt.value) continue;
                        const v = opt.value.toLowerCase();
                        if (s.includes(v) || v.includes(s)) { val = opt.value; break; }
                    }
                }
            }
            if (val) {
                const el = document.getElementById("gender");
                if (el) el.value = val;
                onSuccess(val);
            } else {
                onRetry();
            }
        });
    });
}

/* AGE */
function p2_doAge(onSuccess, onRetry) {
    speak(p2_t("age"), () => {
        listen(speech => {
            let s = (speech || "").toLowerCase().trim();
            const wordMap = {
                "one":1,"two":2,"three":3,"four":4,"five":5,"six":6,"seven":7,"eight":8,
                "nine":9,"ten":10,"eleven":11,"twelve":12,"thirteen":13,"fourteen":14,
                "fifteen":15,"sixteen":16,"seventeen":17,"eighteen":18,"nineteen":19,
                "twenty":20,"thirty":30,"forty":40,"fifty":50,"sixty":60,
                "seventy":70,"eighty":80,"ninety":90,
                // Hindi number words
                "ek":1,"do":2,"teen":3,"char":4,"paanch":5,"chhe":6,"saat":7,
                "aath":8,"nau":9,"das":10,"bees":20,"tees":30,"chalis":40,
                "pachas":50,"saath":60,"sattar":70,"assi":80,"nabbe":90,
            };
            for (const [word, num] of Object.entries(wordMap)) {
                s = s.replace(new RegExp("\\b" + word + "\\b", "g"), String(num));
            }
            const nums = s.match(/\d+/);
            const age  = nums ? parseInt(nums[0], 10) : NaN;
            if (!isNaN(age) && age >= 1 && age <= 100) {
                document.getElementById("age").value = age;
                onSuccess(age);
            } else {
                onRetry();
            }
        });
    });
}

/* MARITAL STATUS */
function p2_doMarital(onSuccess, onRetry) {
    const opts   = p2_readSelectOptions("marital_status") || "Married, Unmarried, Widow, Divorced";
    const prompt = p2_t("marital") + " " + p2_t("readOpts") + opts + ".";

    speak(prompt, () => {
        listen(speech => {
            const val = p2_marital(speech) || p2_matchSelect(speech, "marital_status");
            if (val) {
                document.getElementById("marital_status").value = val;
                onSuccess(val);
            } else {
                onRetry();
            }
        });
    });
}

/* CASTE */
function p2_doCaste(onSuccess, onRetry) {
    const opts   = p2_readRadioOptions("caste") || "General, OBC, Scheduled Caste SC, Scheduled Tribe ST";
    const prompt = p2_t("caste") + " " + p2_t("readOpts") + opts + ".";

    speak(prompt, () => {
        listen(speech => {
            const s = speech.toLowerCase();
            let found = null;

            if      (s.includes("general") || s.includes("open"))
                found = "General";
            else if (s.includes("obc") || s.includes("other backward"))
                found = "OBC";
            else if (s.includes("sc") || s.includes("scheduled caste") || s.includes("dalit") || speech.trim().toLowerCase() === "sc")
                found = "Scheduled Caste (SC)";
            else if (s.includes("st") || s.includes("scheduled tribe") || s.includes("adivasi") || speech.trim().toLowerCase() === "st")
                found = "Scheduled Tribe (ST)";
            else if (s.includes("pvtg") || s.includes("particularly vulnerable"))
                found = "PVTG";

            // Fallback: fuzzy match radio values
            if (!found) {
                for (const r of document.getElementsByName("caste")) {
                    if (s.includes(r.value.toLowerCase())) { found = r.value; break; }
                }
            }

            if (found && p2_checkRadio("caste", found)) onSuccess(found);
            else onRetry();
        });
    });
}

/* MINORITY */
function p2_doMinority(onSuccess, onRetry) {
    speak(p2_t("minority"), () => {
        listen(speech => {
            const val = p2_yesNo(speech);
            if (val && p2_checkRadio("minority", val)) onSuccess(val);
            else onRetry();
        });
    });
}

/* DISABILITY */
function p2_doDisability(onSuccess, onRetry) {
    speak(p2_t("disabled"), () => {
        listen(speech => {
            const val = p2_yesNo(speech);
            if (val && p2_checkRadio("disabled", val)) onSuccess(val);
            else onRetry();
        });
    });
}

/* SALARY — just ask; user says an amount and we map it to the right bracket */
function p2_doSalary(onSuccess, onRetry) {
    speak(p2_t("salary"), () => {
        listen(speech => {
            const idx = p2_salary(speech);
            const sel = document.getElementById("salary");
            if (idx !== null && sel && idx < sel.options.length) {
                sel.selectedIndex = idx;
                onSuccess(idx);
            } else {
                onRetry();
            }
        });
    });
}

/* OCCUPATION — reads all options */
function p2_doOccupation(onSuccess, onRetry) {
    const opts   = p2_readSelectOptions("occupation");
    const prompt = p2_t("occupation") + " " + p2_t("readOpts") + opts + ".";

    speak(prompt, () => {
        listen(speech => {
            const val = p2_matchSelect(speech, "occupation");
            if (val) {
                document.getElementById("occupation").value = val;
                onSuccess(val);
            } else {
                onRetry();
            }
        });
    });
}

/* RESIDENCE */
function p2_doResidence(onSuccess, onRetry) {
    const opts   = p2_readRadioOptions("residence") || "Urban, Rural";
    const prompt = p2_t("residence") + " " + p2_t("readOpts") + opts + ".";

    speak(prompt, () => {
        listen(speech => {
            const val = p2_residence(speech);
            if (val && p2_checkRadio("residence", val)) onSuccess(val);
            else onRetry();
        });
    });
}

/* ─────────────────────────────────────────────────────────
   SEQUENTIAL FLOW
───────────────────────────────────────────────────────── */
function p2_startFlow() {
    p2_ask(p2_doState, () =>
        p2_ask(p2_doGender, () =>
            p2_ask(p2_doAge, () =>
                p2_ask(p2_doMarital, () =>
                    p2_ask(p2_doCaste, () =>
                        p2_ask(p2_doMinority, () =>
                            p2_ask(p2_doDisability, () =>
                                p2_ask(p2_doSalary, () =>
                                    p2_ask(p2_doOccupation, () =>
                                        p2_ask(p2_doResidence, () => {
                                            speak(p2_t("finish"), () => {
                                                document.getElementById("schemeForm").submit();
                                            });
                                        })
                                    )
                                )
                            )
                        )
                    )
                )
            )
        )
    );
}

/* ─────────────────────────────────────────────────────────
   BOOT — auto-start if voiceMode was set on page1
───────────────────────────────────────────────────────── */
window.addEventListener("load", () => {
    if (sessionStorage.getItem("voiceMode") === "on") {
        setTimeout(() => {
            speak(p2_t("greet"), () => {
                setTimeout(p2_startFlow, 600);
            });
        }, 800);
    }
});
