/**
 * PAGE 4 VOICE ASSISTANT — page4.js
 * -------------------------------------------------------
 * HOW TO INCLUDE IN page4.html:
 *   1. Keep ALL existing JavaScript inside the page4.html <script> block
 *      (scroll, translation, chatbot logic — do NOT remove them).
 *   2. Add these TWO lines at the very END of <body>:
 *        <script src="{{ url_for('static', filename='js/voice.js') }}"></script>
 *        <script src="{{ url_for('static', filename='js/page4.js') }}"></script>
 *
 * DEPENDS ON: voice.js must be loaded first.
 * NOTE: This file REPLACES the speaker.onclick handler defined in page4.html.
 *       In page4.html, remove (or comment out) the block:
 *           speaker.onclick = async () => { ... }
 *       Everything else in the existing <script> stays.
 * -------------------------------------------------------
 */

/* ─────────────────────────────────────────────────────────
   SPEAKER STATE
───────────────────────────────────────────────────────── */
let p4_isPlaying = false;
let p4_audio     = null;

/* ─────────────────────────────────────────────────────────
   BUILD FULL TEXT TO READ
───────────────────────────────────────────────────────── */
function p4_buildText() {
    const get = id => {
        const el = document.getElementById(id);
        return el ? el.innerText.trim() : "";
    };
    const schemeName  = document.querySelector(".scheme-title")  ? document.querySelector(".scheme-title").innerText.trim()  : "";
    const summary     = get("summary");
    const benefits    = get("benefits");
    const eligibility = get("eligibility-text");
    const documents   = get("documents-text");

    return [
        schemeName ? "Scheme: " + schemeName + "." : "",
        summary    ? "Summary. " + summary + "."   : "",
        benefits   ? "Key benefits. " + benefits + "." : "",
        eligibility? "Eligibility criteria. " + eligibility + "." : "",
        documents  ? "Required documents. " + documents + "."    : "",
    ].filter(Boolean).join(" ");
}

/* ─────────────────────────────────────────────────────────
   GLOW CONTROL
───────────────────────────────────────────────────────── */
function p4_setGlow(active) {
    const speaker = document.getElementById("speakerBtn");
    if (!speaker) return;
    if (active) {
        speaker.classList.add("speaker-active");
    } else {
        speaker.classList.remove("speaker-active");
    }
}

/* ─────────────────────────────────────────────────────────
   PLAY / PAUSE TOGGLE
───────────────────────────────────────────────────────── */
async function p4_toggleSpeak() {
    const speaker = document.getElementById("speakerBtn");

    // If already playing → stop
    if (p4_isPlaying && p4_audio) {
        p4_audio.pause();
        p4_audio.currentTime = 0;
        p4_isPlaying = false;
        p4_setGlow(false);
        return;
    }

    // Also cancel any Web Speech in progress
    window.speechSynthesis && window.speechSynthesis.cancel();

    p4_isPlaying = true;
    p4_setGlow(true);

    const fullText = p4_buildText();
    const lang     = sessionStorage.getItem("language") || (document.documentElement.lang || "en");

    try {
        const res  = await fetch("/api/tts?text=" + encodeURIComponent(fullText) + "&lang=" + lang);
        if (!res.ok) throw new Error("TTS fetch failed");
        const blob = await res.blob();
        const url  = URL.createObjectURL(blob);

        p4_audio = new Audio(url);
        p4_audio.play();

        p4_audio.onended = () => {
            p4_isPlaying = false;
            p4_setGlow(false);
        };
        p4_audio.onerror = () => {
            p4_isPlaying = false;
            p4_setGlow(false);
        };

    } catch (err) {
        // Fallback to Web Speech API
        const utterance = new SpeechSynthesisUtterance(fullText);
        const LANG_MAP  = {
            en:"en-IN", hi:"hi-IN", mr:"mr-IN", te:"te-IN", ta:"ta-IN",
            kn:"kn-IN", bn:"bn-IN", gu:"gu-IN", ml:"ml-IN", pa:"pa-IN",
            or:"or-IN", ur:"ur-IN", as:"as-IN"
        };
        utterance.lang  = LANG_MAP[lang] || "en-IN";
        utterance.onend = () => { p4_isPlaying = false; p4_setGlow(false); };
        speechSynthesis.speak(utterance);
    }
}

/* ─────────────────────────────────────────────────────────
   OVERRIDE SPEAKER BUTTON CLICK
───────────────────────────────────────────────────────── */
window.addEventListener("load", () => {
    const speaker = document.getElementById("speakerBtn");
    if (speaker) {
        // Remove previous onclick (from inline page4.html) and replace
        speaker.onclick = null;
        speaker.addEventListener("click", p4_toggleSpeak);
    }

    /* ── Auto-read on page load if voiceMode is on ── */
    if (sessionStorage.getItem("voiceMode") === "on") {
        // Small delay to let the DOM settle
        setTimeout(() => {
            p4_toggleSpeak();
        }, 1200);
    }
});
