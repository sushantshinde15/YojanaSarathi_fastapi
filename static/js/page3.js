/**
 * PAGE 3 VOICE ASSISTANT — page3.js
 * -------------------------------------------------------
 * HOW TO INCLUDE IN page3.html:
 *   1. DELETE the entire <script> block at the bottom of page3.html
 *      (everything from <script> to </script> including all JS).
 *   2. Add these TWO lines at the very END of <body>:
 *        <script src="{{ url_for('static', filename='js/voice.js') }}"></script>
 *        <script src="{{ url_for('static', filename='js/page3.js') }}"></script>
 *
 * DEPENDS ON: voice.js must be loaded first.
 * Data arrays (highSchemes, moderateSchemes, allSchemes) are injected
 * via hidden <script> blocks rendered by Jinja — keep those in page3.html.
 * -------------------------------------------------------
 *
 * DATA CONTRACT (already in page3.html inline script, keep them):
 *   const highSchemes     = [ { name, desc, score, raw_name } ... ]
 *   const moderateSchemes = [ { name, desc, score, raw_name } ... ]
 *   const allSchemes      = [ { name, desc, raw_name } ... ]
 *
 * ADD raw_name to each object in the Jinja template like:
 *   { name: "{{s.name}}", desc: "{{s.description}}", score: "{{...}}", raw_name: "{{s.raw_name}}" }
 */

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */

function p3_isYes(text) {
    if (!text) return false;
    const yes = ["yes","yeah","haan","ha","ho","ji","ok","okay","next","avunu","aam","sahi","bilkul","sure","correct"];
    return yes.some(w => text.toLowerCase().includes(w));
}

function p3_isNo(text) {
    if (!text) return false;
    const no = ["no","nah","stop","nahi","nako","vadu","vendam","illa","bas","mat","skip","next"];
    return no.some(w => text.toLowerCase().includes(w));
}

/** Visually highlight a scheme card that matches a name */
function p3_highlightScheme(name) {
    document.querySelectorAll(".scheme-item").forEach(el => {
        const title = el.querySelector(".scheme-title");
        if (title && title.textContent.toLowerCase().includes(name.toLowerCase().slice(0, 10))) {
            el.style.boxShadow = "0 0 0 3px #1f3b73, 0 10px 30px rgba(31,59,115,0.4)";
            el.style.transform = "translateY(-6px)";
            el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    });
}

/** Navigate to page4 for a given raw scheme name */
function p3_goToScheme(rawName) {
    window.location.href = "/scheme/" + encodeURIComponent(rawName);
}

/** Use /api/voice-match to fuzzy-find closest scheme name */
async function p3_voiceMatch(spokenText) {
    try {
        const res  = await fetch("/api/voice-match?q=" + encodeURIComponent(spokenText));
        const data = await res.json();
        return data.best_match || null;
    } catch (e) {
        return null;
    }
}

/* ─────────────────────────────────────────────────────────
   READ A LIST OF SCHEMES ALOUD
   Reads each scheme's name + description, then calls done()
───────────────────────────────────────────────────────── */
function p3_readList(schemes, index, done) {
    if (!schemes || index >= schemes.length) { done(); return; }
    const s    = schemes[index];
    const score = s.score ? ". Eligibility match " + s.score + " percent." : ".";
    const text  = s.name + ". " + s.desc + score;
    speak(text, () => p3_readList(schemes, index + 1, done));
}

/* ─────────────────────────────────────────────────────────
   ASK USER TO PICK A SCHEME BY NAME OR SAY NEXT
   After reading a category list, ask if they want details.
───────────────────────────────────────────────────────── */
function p3_askPickOrNext(schemes, onPick, onNext, attempt) {
    if (attempt === undefined) attempt = 0;
    if (attempt >= 3) { onNext(); return; }

    speak("Would you like details on any of these schemes? Say the scheme name, or say Next to continue.", () => {
        listen(async speech => {
            if (!speech) { p3_askPickOrNext(schemes, onPick, onNext, attempt + 1); return; }

            if (p3_isNo(speech) || speech.toLowerCase().includes("next")) {
                onNext();
                return;
            }

            // Try voice matching against backend
            const match = await p3_voiceMatch(speech);
            if (match) {
                p3_highlightScheme(match);
                speak("Opening details for " + match, () => p3_goToScheme(match));
            } else {
                speak(getRepeatMessage(), () => {
                    p3_askPickOrNext(schemes, onPick, onNext, attempt + 1);
                });
            }
        });
    });
}

/* ─────────────────────────────────────────────────────────
   ASK YES / NO WITH RETRY
───────────────────────────────────────────────────────── */
function p3_askYesNo(prompt, onYes, onNo, attempt) {
    if (attempt === undefined) attempt = 0;
    if (attempt >= 3) { onNo(); return; }

    speak(prompt, () => {
        listen(speech => {
            if (!speech) { p3_askYesNo(prompt, onYes, onNo, attempt + 1); return; }
            if (p3_isYes(speech)) { onYes(); return; }
            if (p3_isNo(speech))  { onNo();  return; }
            speak(getRepeatMessage(), () => p3_askYesNo(prompt, onYes, onNo, attempt + 1));
        });
    });
}

/* ─────────────────────────────────────────────────────────
   MAIN FLOW
───────────────────────────────────────────────────────── */
function p3_mainFlow() {
    // Safety: if data arrays not defined, bail silently
    if (typeof highSchemes === "undefined") return;

    /* ── STEP 1: Read Highly Recommended ── */
    speak("Here are your highly recommended schemes.", () => {
        p3_readList(highSchemes, 0, () => {

            /* ── STEP 2: Ask if user wants to pick from High ── */
            p3_askPickOrNext(
                highSchemes,
                /* onPick */ () => {},   // handled inside p3_askPickOrNext
                /* onNext */ () => {

                    /* ── STEP 3: Ask if user wants to hear Moderate ── */
                    p3_askYesNo(
                        "Would you like me to read the moderately recommended schemes?",
                        /* onYes */ () => {
                            speak("Reading moderately recommended schemes.", () => {
                                p3_readList(moderateSchemes, 0, () => {

                                    /* ── STEP 4: Ask pick from Moderate ── */
                                    p3_askPickOrNext(
                                        moderateSchemes,
                                        () => {},
                                        () => {

                                            /* ── STEP 5: Ask if user wants all schemes ── */
                                            p3_askYesNo(
                                                "Should I read the remaining schemes for you?",
                                                /* onYes */ () => {
                                                    speak("Reading all schemes.", () => {
                                                        p3_readList(allSchemes.slice(0, 6), 0, () => {
                                                            p3_askPickOrNext(
                                                                allSchemes,
                                                                () => {},
                                                                () => {
                                                                    speak("You can browse more schemes on the screen. Just click any card.");
                                                                }
                                                            );
                                                        });
                                                    });
                                                },
                                                /* onNo */ () => {
                                                    speak("Okay. You can click any scheme on the screen to see full details.");
                                                }
                                            );

                                        }
                                    );
                                });
                            });
                        },
                        /* onNo from moderate prompt */ () => {
                            speak("Okay. You can click any scheme card to see full details.");
                        }
                    );
                }
            );
        });
    });
}

/* ─────────────────────────────────────────────────────────
   BOOT
───────────────────────────────────────────────────────── */
window.addEventListener("load", () => {
    if (sessionStorage.getItem("voiceMode") === "on") {
        const userName = (typeof user_name !== "undefined" ? user_name : "");
        const greeting = userName
            ? "Hello " + userName + "! Based on your profile, I found eligible government schemes for you."
            : "Based on your profile, I found eligible government schemes for you.";

        setTimeout(() => {
            speak(greeting, () => setTimeout(p3_mainFlow, 500));
        }, 800);
    }
});
