/**
 * admin.js
 * Håndterer administration, redigering og sikkerhed (Undo/Backup).
 */

import { saveDbToCloud } from './firebase-service.js';

const APP_VERSION = "v4.3.2";
const ADMIN_PASSWORD = "tømrer123";

const UPDATE_LOG = [
    {
        version: "v4.3.2",
        date: "2026-04-22",
        title: "📸 Katte-FIX & URL Optimering (v4.3.2)",
        desc: "Løst problem med for mange søgeord (AND-logik), der tvang katte frem. Nu bruges færre, men mere præcise ord samt korrekt URL-kodning."
    },
    {
        version: "v4.3.1",
        date: "2026-04-22",
        title: "🤖 AI-Scenarier & Billed-synergi (v4.3.1)",
        desc: "Tilføjet felt til specifikke krav/scenarier i AI-generatoren. AI'en vælger nu både danske og engelske søgeord, der matcher emnet perfekt."
    },
    {
        version: "v4.3.0",
        date: "2026-04-22",
        title: "📸 Katte-sikring & Robust Billedsøgning (v4.3.0)",
        desc: "Implementeret automatiske sikkerheds-tags og fallbacks for at undgå 'katte-billeder' ved svære søgeord."
    },
    {
        version: "v4.2.0",
        date: "2026-04-22",
        title: "📸 Dansk Billed-søgning (v4.2.0)",
        desc: "Tilføjet et nyt værktøj i editoren: 'Søgeord (Dansk)'. Skriv på dansk, og systemet oversætter automatisk til engelsk via en indbygget fagordbog over tømrer-begreber."
    },
    {
        version: "v4.1.0",
        date: "2026-04-22",
        title: "☁️ Universal Cloud-synkronisering (v4.1.0)",
        desc: "Løst problemet med synkronisering mellem computere. Alt indhold (spørgsmål og billeder) hentes nu direkte fra skyen hver gang, hvilket eliminerer fejl pga. lokal hukommelse."
    },
    {
        version: "v4.0.0",
        date: "2026-04-21",
        title: "💎 UX Stabilisering & Kontrast-fix (v4.0.0)",
        desc: "Endelig løsning på 'hoppende' sider i admin-panelet. Panelet husker nu din scroll-position, og slette-knapperne er gjort tydelige."
    },
    {
        version: "v3.9.5",
        date: "2026-04-21",
        title: "💾 Image Lock Funktion (v3.9.5)",
        desc: "Du kan nu gemme et bestemt billede permanent ved hjælp af den nye 'Gem dette billede' knap i editoren."
    },
    {
        version: "v3.9.0",
        date: "2026-04-21",
        title: "🛡️ Netværks-sikret Billedvisning (v3.9.0)",
        desc: "Implementeret en Proxy-tjeneste (Weserv), der henter billeder udenom dit lokale netværks blokering. Dette skulle endelig løse de sorte bokse."
    },
    {
        version: "v3.8.0",
        date: "2026-04-21",
        title: "🌍 Globalt Billed-skift (v3.8.0)",
        desc: "Migreret fra LoremFlickr til Unsplash Source. Dette løser problemet hvor visse netværk blokerede for billeder."
    },
    {
        version: "v3.7.0",
        date: "2026-04-21",
        title: "🛡️ Stabiliseret Billed-motor (v3.7.0)",
        desc: "Genskabt billedvisning ved at rette URL-formatering og tilføje support for danske tegn. Fixet preview-vindue i admin-panelet."
    },
    {
        version: "v3.6.0",
        date: "2026-04-21",
        title: "🚀 Ultimativ Billed-fix (v3.6.0)",
        desc: "Løst en kritisk fejl i kodningen af søgeord. Billeder burde nu være tilbage på alle sider og i admin-panelet."
    },
    {
        version: "v3.5.0",
        date: "2026-04-21",
        title: "🌟 Endelig Stabilisering",
        desc: "Genskabt den oprindelige stabile billedvisning med moderne forbedringer. Understøtter nu alle danske tegn i søgninger."
    },
    {
        version: "v3.4.5",
        date: "2026-04-21",
        title: "💎 Diamant-sikring af Billeder",
        desc: "Billed-motoren er nu gjort ekstremt robust. Den rydder automatisk op i søgeord og bruger kun de mest stabile tags for at sikre, at der altid er billeder."
    },
    {
        version: "v3.4.2",
        date: "2026-04-21",
        title: "🛡️ Stabilisering af Billed-motor",
        desc: "Endelig fix af billeder! Jeg har fjernet de filtre der blokerede for visning og forbedret rensningen af søgeord."
    },
    {
        version: "v3.4.1",
        date: "2026-04-21",
        title: "📸 Stabilisering af Billeder",
        desc: "Rettet en fejl hvor nogle billeder ikke blev vist, og optimeret AI'en til at finde mere relevante billeder."
    },
    {
        version: "v3.4.0",
        date: "2026-04-21",
        title: "🧠 Avanceret AI & Fejlrettelse",
        desc: "AI'en er nu opgraderet til at lave spørgsmål på svendeprøve-niveau med realistiske svarmuligheder. Desuden er import-funktionen gjort robust, så den automatisk fixer fejl i AI-koden."
    },
    {
        version: "v3.3.1",
        date: "2026-04-21",
        title: "Tvungen Versions-opdatering",
        desc: "Denne opdatering sikrer, at alle brugere ser de nyeste funktioner og den korrekte logbog med det samme uden cache-problemer."
    },
    {
        version: "v3.3.0",
        date: "2026-04-21",
        title: "Cloud-synk & Dashboard Design",
        desc: "Systemet kører nu 100% i skyen (Firebase). Desuden har alle quiz-kort på forsiden fået flotte baggrundsbilleder i hjørnerne."
    },
    {
        version: "v3.2.5",
        date: "2024-04-21",
        title: "🧠 Intelligent Billed-søgning",
        desc: "Systemet har fået en 'hjerne', der forstår danske fagord. Den oversætter nu automatisk ord som 'Skimmel' og 'Tagspær' til engelsk, så du altid får relevante billeder uden at skulle tænke over det."
    },
    {
        version: "v3.2.0",
        date: "2024-04-20",
        title: "📸 Billed-lås & Preview",
        desc: "Du kan nu se billedet direkte i editoren og bruge 'Refresh'-knappen til at finde det perfekte match. Når du gemmer, bliver billedet låst fast til quizzen."
    },
    {
        version: "v3.1.5",
        date: "2024-04-19",
        title: "✨ AI-genveje & Hurtig-start",
        desc: "Vi har tilføjet genveje til AI-assistenten overalt, så du lynhurtigt kan skabe nyt indhold uden at skulle klikke rundt i menuerne."
    },
    {
        version: "v3.1.0",
        date: "2024-04-18",
        title: "💅 Premium Glow Design",
        desc: "Hele systemet har fået en visuel overhaling med 'glassmorphism' og grønne glow-effekter, der gør det mere behageligt at arbejde i."
    }
];

let localDbCopy = null;
let historyStack = [];
let redoStack = [];
let activeQuizIdx = null; // HUSKER hvilken quiz der er åben

function initAdmin() {
    // Vi behøver ikke åbne panelet automatisk ved load
}

window.tryLogin = function() {
    if (sessionStorage.getItem('quiz_admin_authed')) {
        showAdminPanel();
        return;
    }
    
    const pass = prompt("Indtast adgangskode for lærer-adgang:");
    if (pass === ADMIN_PASSWORD) {
        sessionStorage.setItem('quiz_admin_authed', 'true');
        showAdminPanel();
    } else if (pass !== null) {
        alert("Forkert adgangskode!");
    }
};

async function showAdminPanel() {
    const container = document.getElementById('admin-content-inner');
    container.innerHTML = `
        <div style="padding: 2rem; text-align: center;">
            <div class="loader" style="margin-bottom: 1rem;">⌛</div>
            <p>Henter nyeste date fra skyen...</p>
        </div>
    `;
    document.getElementById('admin-modal').style.display = 'flex';
    
    // Opdater overskrift med version
    const titleEl = document.querySelector('#admin-modal h2');
    if (titleEl) titleEl.textContent = `Tømrer Quiz - Panel (Underviser) - ${APP_VERSION}`;
    
    try {
        const cloudDb = await getDbFromCloud();
        if (cloudDb) {
            localDbCopy = cloudDb;
            console.log("Admin: Data hentet fra Firebase.");
        } else {
            console.warn("Admin: Ingen data i skyen, bruger standard.");
            localDbCopy = JSON.parse(JSON.stringify(window.QUIZ_DATABASE));
        }
    } catch (error) {
        console.error("Admin: Fejl ved hentning fra skyen:", error);
        localDbCopy = JSON.parse(JSON.stringify(window.QUIZ_DATABASE));
    }
    
    // AUTO-MIGRATION logic (hvis der er nye felter i den statiske DB)
    if (window.QUIZ_DATABASE) {
        localDbCopy.quizzes.forEach(quiz => {
            const masterQuiz = window.QUIZ_DATABASE.quizzes.find(mq => mq.id === quiz.id);
            if (masterQuiz) {
                if (!quiz.moodKeywords && masterQuiz.moodKeywords) quiz.moodKeywords = masterQuiz.moodKeywords;
                if (!quiz.moodImageLock && masterQuiz.moodImageLock) quiz.moodImageLock = masterQuiz.moodImageLock;
            }
        });
    }

    historyStack = [];
    redoStack = [];
    renderAdminContent();
}

window.closeAdmin = function() {
    document.getElementById('admin-modal').style.display = 'none';
};

function pushToHistory() {
    historyStack.push(JSON.stringify(localDbCopy));
    redoStack = [];
    if (historyStack.length > 50) historyStack.shift();
}

window.undo = function() {
    if (historyStack.length === 0) return;
    redoStack.push(JSON.stringify(localDbCopy));
    localDbCopy = JSON.parse(historyStack.pop());
    renderAdminContent();
};

window.redo = function() {
    if (redoStack.length === 0) return;
    historyStack.push(JSON.stringify(localDbCopy));
    localDbCopy = JSON.parse(redoStack.pop());
    renderAdminContent();
};

function renderAdminContent() {
    const container = document.getElementById('admin-content-inner');
    if (!container) return;

    // Gem scroll position og quiz-status FØR innerHTML
    const scrollPos = container.scrollTop;
    
    let html = `
        <div class="admin-tabs" style="display: flex; justify-content: space-between; align-items: center; width: 100%; padding-right: 1rem;">
            <div>
                <button class="tab-btn active" id="btn-tab-edit" onclick="switchTab('edit')">Rediger Indhold</button>
                <button class="tab-btn" id="btn-tab-ai" onclick="switchTab('ai')">✨ Skab med AI</button>
                <button class="tab-btn" id="btn-tab-log" onclick="switchTab('log')">📜 Logbog</button>
            </div>
            <button class="btn btn-primary btn-small" style="background: var(--accent); color: #fff; box-shadow: 0 0 15px var(--accent-glow);" onmousedown="setTimeout(() => saveAdminChanges(), 150)">☁️ Gem alle ændringer</button>
        </div>

        <div id="tab-edit" class="tab-content active">
            <div class="admin-toolbar">
                <div class="admin-history-btns">
                    <button class="btn btn-secondary btn-small" onclick="undo()" ${historyStack.length === 0 ? 'disabled' : ''} title="Fortryd (Ctrl+Z)">↩️ Fortryd</button>
                    <button class="btn btn-secondary btn-small" onclick="redo()" ${redoStack.length === 0 ? 'disabled' : ''} title="Gendan (Ctrl+Y)">↪️ Gendan</button>
                </div>
                <div class="admin-backup-btns">
                    <button class="btn btn-secondary btn-small" onclick="downloadBackup()" title="Gem fysisk backup på PC">💾 Gem Backup</button>
                    <button class="btn btn-secondary btn-small" onclick="document.getElementById('backup-upload').click()" title="Indlæs backup fra PC">📂 Indlæs Backup</button>
                    <input type="file" id="backup-upload" style="display:none;" onchange="handleBackupUpload(event)">
                </div>
                <div class="admin-export-btns">
                    <button class="btn btn-primary btn-small" onclick="exportDatabase()">Eksportér database.js</button>
                </div>
            </div>
            
            <div class="admin-actions-secondary">
                <button class="btn btn-secondary btn-small" onclick="resetToStandard()">Nulstil til Standard-indhold</button>
            </div>
            
            <div class="admin-section">
                <h3>Kategorier</h3>
                <div class="admin-items">
                    ${localDbCopy.categories.map((cat, idx) => `
                        <div class="admin-item">
                            <input type="text" value="${cat.title}" onchange="updateCategory(${idx}, 'title', this.value)">
                            <button class="btn-icon" onclick="removeCategory(${idx})">🗑️</button>
                        </div>
                    `).join('')}
                    <button class="btn btn-secondary btn-small" onclick="addCategory()">+ Tilføj Kategori</button>
                </div>
            </div>

            <div class="admin-section">
                <h3>Quizzer</h3>
                <div class="admin-items">
                    ${localDbCopy.quizzes.map((quiz, idx) => {
                        const rawKeywords = quiz.moodKeywords || "";
                        let displayKeywords = rawKeywords;
                        if (!displayKeywords) {
                            const titleMatch = quiz.title.match(/\(([^)]+)\)/);
                            displayKeywords = titleMatch ? titleMatch[1] : quiz.title;
                        }
                        const translateFn = window.translateKeywords || ((s) => s);
                        const translated = translateFn(displayKeywords);
                        // Brug det faste billede, eller vis en pladsholder indtil læreren trykker "Nyt Billede"
                        const previewUrl = quiz.moodImageUrl || `https://placehold.co/800x600/2a2a2a/ffffff?text=Klik+paa+Nyt+Billede`;
                        
                        return `
                        <div class="admin-item-expanded">
                            <div class="admin-item-header">
                                <div>
                                    <span class="admin-cat-tag">${getCategoryTitle(quiz.categoryId)}</span>
                                    <span class="status-badge ${quiz.isHidden ? 'status-hidden' : 'status-visible'}">
                                        ${quiz.isHidden ? '🚫 Skjult' : '👁️ Synlig'}
                                    </span>
                                    <strong>${quiz.title}</strong>
                                </div>
                                <div style="display: flex; gap: 0.5rem; align-items: center;">
                                    <button class="btn ${quiz.isHidden ? 'btn-success' : 'btn-secondary'} btn-small" 
                                            onclick="updateQuiz(${idx}, 'isHidden', ${!quiz.isHidden})">
                                        ${quiz.isHidden ? 'Gør Synlig' : 'Skjul'}
                                    </button>
                                    <button class="btn btn-secondary btn-small" onclick="toggleEditQuiz(${idx})">Rediger</button>
                                    <button class="btn-icon" onclick="removeQuiz(${idx})">🗑️</button>
                                </div>
                            </div>
                            <div id="edit-quiz-${idx}" class="edit-form" style="display:none;">
                                <div style="display: flex; gap: 2rem; flex-wrap: wrap;">
                                    <div style="flex: 1; min-width: 300px;">
                                        <label>Titel</label>
                                        <input type="text" value="${quiz.title}" onchange="updateQuiz(${idx}, 'title', this.value)">
                                        <label>Beskrivelse</label>
                                        <textarea onchange="updateQuiz(${idx}, 'description', this.value)">${quiz.description}</textarea>
                                        <label>Kategori</label>
                                        <select onchange="updateQuiz(${idx}, 'categoryId', this.value)">
                                            ${localDbCopy.categories.map(c => `<option value="${c.id}" ${c.id === quiz.categoryId ? 'selected' : ''}>${c.title}</option>`).join('')}
                                        </select>
                                    </div>
                                    
                                    <div style="flex: 0 0 250px;">
                                        <label>Stemningsbillede Preview</label>
                                        <div class="mood-preview-container" style="position:relative; margin-bottom: 0.5rem; min-height: 150px; background: #000; border: 1px solid var(--accent); border-radius: 8px;">
                                            <img src="${previewUrl}" id="preview-img-${idx}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 4px;">
                                            <div style="display: flex; gap: 0.2rem; margin-top: 0.5rem;">
                                                <button class="btn btn-secondary btn-small" style="flex: 1;" onclick="refreshImage(${idx})">🔄 Nyt Billede</button>
                                                <button class="btn btn-success btn-small" style="flex: 1.2;" onclick="lockImage(${idx})">💾 Gem dette</button>
                                            </div>
                                        </div>
                                        <label>Søgeord (Engelsk)</label>
                                        <input type="text" value="${quiz.moodKeywords || ''}" placeholder="f.eks. roof, timber" onchange="updateQuiz(${idx}, 'moodKeywords', this.value)">
                                        
                                        <label>Søgeord (Dansk - Automatisk oversætter)</label>
                                        <input type="text" value="${quiz.moodKeywordsDanish || ''}" placeholder="f.eks. tagspær, trapper" onchange="translateAndSetKeywords(${idx}, this.value)">
                                        
                                        <input type="hidden" value="${quiz.moodImageLock || ''}" id="mood-lock-${idx}">
                                    </div>
                                </div>
                                
                                <label style="margin-top: 1.5rem; display: block;">Eller indsæt direkte URL (overstyrer preview foroven)</label>
                                <input type="text" placeholder="https://..." value="${quiz.moodImageUrl || ''}" onchange="updateQuiz(${idx}, 'moodImageUrl', this.value)">
                                
                                <h4 style="margin-top: 2rem; border-top: 1px solid var(--card-border); padding-top: 1.5rem;">Spørgsmål (${quiz.questions.length})</h4>
                                <button class="btn btn-secondary btn-small" style="margin-bottom: 1rem;" onclick="addQuestion(${idx})">+ Tilføj Spørgsmål</button>
                                <div class="admin-questions">
                                    ${quiz.questions.map((q, qIdx) => `
                                        <div class="admin-question-edit">
                                            <div style="display:flex; justify-content:space-between; margin-bottom:1rem;">
                                                <strong>Spørgsmål ${qIdx + 1}</strong>
                                                <button class="btn-icon" onclick="removeQuestion(${idx}, ${qIdx})">Fjern 🗑️</button>
                                            </div>
                                            <input type="text" placeholder="Spørgsmål" value="${q.question}" onchange="updateQuestion(${idx}, ${qIdx}, 'question', this.value)">
                                            <div class="admin-options-edit">
                                                ${q.options.map((opt, oIdx) => `
                                                    <div style="display:flex; gap:0.5rem; align-items:center;">
                                                        <input type="radio" name="correct-${idx}-${qIdx}" ${q.correctIndex === oIdx ? 'checked' : ''} onchange="updateQuestion(${idx}, ${qIdx}, 'correctIndex', ${oIdx})">
                                                        <input type="text" placeholder="Svarmulighed ${oIdx+1}" value="${opt}" onchange="updateOption(${idx}, ${qIdx}, ${oIdx}, this.value)">
                                                    </div>
                                                `).join('')}
                                            </div>
                                            <label>Rationale (forklaring der vises efter svar)</label>
                                            <textarea onchange="updateQuestion(${idx}, ${qIdx}, 'rationale', this.value)">${q.rationale}</textarea>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    `;}).join('')}
                    <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                        <button class="btn btn-primary" onclick="addQuiz()">+ Opret Ny Quiz Manuelt</button>
                        <button class="btn btn-secondary" onclick="switchTab('ai')">✨ Skab med AI (Genvej)</button>
                    </div>
                </div>
            </div>
        </div>

        <div id="tab-ai" class="tab-content">
            <div class="ai-assistant-container">
                <div class="ai-step">
                    <h3>Trin 1: Fortæl AI hvad du vil have</h3>
                    <p class="step-guide">Skriv emnet for din nye quiz nedenfor. AI'en vil foreslå både spørgsmål og passende tekniske søgeord til billeder.</p>
                    <div class="ai-input-group" style="flex-direction: column; align-items: stretch; gap: 0.5rem;">
                        <div style="display: flex; gap: 0.5rem;">
                            <input type="text" id="ai-topic" placeholder="Hovedemne (f.eks. Faldsikring)" style="flex: 2;">
                            <select id="ai-category" style="flex: 1;">
                                ${localDbCopy.categories.map(c => `<option value="${c.id}">${c.title}</option>`).join('')}
                            </select>
                            <button class="btn btn-secondary btn-small" onclick="quickAddCategory()" title="Opret ny kategori her">+ Ny kat.</button>
                        </div>
                        <textarea id="ai-requirements" placeholder="Specifikke ønsker eller scenarier... (f.eks. 'Fokusér på regler for stillads over 2 meter' eller 'Lav et scenarie om en byggeplads i regnvejr')" style="min-height: 80px;"></textarea>
                    </div>
                    <button class="btn btn-primary" onclick="generateAiPrompt()">✨ Opret AI-Kommando</button>
                </div>

                <div id="ai-prompt-result" class="ai-step" style="display:none;">
                    <h3>Trin 2: Kopier og kør i ChatGPT</h3>
                    <p class="step-guide">Kopier teksten, kør den hos AI'en, og kopier koden tilbage herover.</p>
                    <div class="prompt-box">
                        <pre id="prompt-text"></pre>
                        <button class="btn btn-secondary btn-small" onclick="copyPrompt()">📋 Kopier Tekst</button>
                    </div>
                </div>

                <div class="ai-step">
                    <h3>Trin 3: Indsæt svaret fra AI her</h3>
                    <textarea id="ai-import-json" placeholder="Indsæt koden fra AI her..." style="min-height: 200px;"></textarea>
                    <button class="btn btn-primary" onclick="importAiQuiz()">🚀 Opret Quiz Nu</button>
                </div>
            </div>
        </div>

        <div id="tab-log" class="tab-content">
            <div class="logbog-container">
                <h3>Opdaterings-historik</h3>
                <p class="step-guide">Her kan du følge med i de nyeste funktioner og forbedringer i Tømrer Quiz.</p>
                <div class="log-entries">
                    ${UPDATE_LOG.map(log => `
                        <div class="log-entry">
                            <div class="log-header">
                                <span class="log-version">${log.version}</span>
                                <span class="log-date">${log.date}</span>
                            </div>
                            <h4>${log.title}</h4>
                            <p>${log.desc}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
        
        <div class="admin-footer">
            <button class="btn btn-secondary" onclick="closeAdmin()">Gå tilbage (Annuller)</button>
            <button class="btn btn-primary" onmousedown="setTimeout(() => saveAdminChanges(), 150)">Gem alle ændringer i skyen ☁️</button>
        </div>
    `;
    
    container.innerHTML = html;
    
    // Genskab åben quiz hvis muligt
    if (activeQuizIdx !== null) {
        const el = document.getElementById(`edit-quiz-${activeQuizIdx}`);
        if (el) el.style.display = 'block';
    }

    // Genskab scroll position ROBUST (vent til browseren er klar)
    requestAnimationFrame(() => {
        container.scrollTop = scrollPos;
    });
}

// --- NY PIXABAY BILLEDSØGNING ---
const PIXABAY_API_KEY = "33031971-903622639880d24a7febb7bc5";

async function fetchPixabayImage(keywords) {
    if (!keywords) return null;
    
    // Rens keywords for at gøre søgningen bedre
    const cleanKeywords = keywords.replace(/,/g, ' ').trim();
    const url = `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(cleanKeywords)}&image_type=photo&orientation=horizontal&safesearch=true&per_page=20`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.hits && data.hits.length > 0) {
            // Vælg et tilfældigt billede blandt de bedste resultater for at give variation
            const randomHit = data.hits[Math.floor(Math.random() * data.hits.length)];
            return randomHit.webformatURL; // Dette er det permanente, låste link!
        }
        return null; // Ingen billeder fundet
    } catch (error) {
        console.error("Fejl ved hentning fra Pixabay:", error);
        return null;
    }
}

window.refreshImage = async (idx) => {
    const quiz = localDbCopy.quizzes[idx];
    
    // Find søgeord (brug engelske tags, da Pixabay er bedst til det)
    const keywords = quiz.moodKeywords || quiz.title;
    
    // Vis brugeren at vi arbejder
    const btn = event.target;
    const oldText = btn.innerHTML;
    btn.innerHTML = "⏳ Søger...";
    btn.disabled = true;

    // Hent permanent billede fra Pixabay
    const newImageUrl = await fetchPixabayImage(keywords);
    
    pushToHistory();
    
    if (newImageUrl) {
        quiz.moodImageUrl = newImageUrl; // Gem den ægte URL direkte i databasen!
    } else {
        alert("Pixabay kunne ikke finde nogle billeder for: " + keywords + ".\nPrøv at ændre søgeordene.");
    }

    btn.innerHTML = oldText;
    btn.disabled = false;
    renderAdminContent();
};
// --------------------------------

window.translateAndSetKeywords = (idx, danishVal) => {
    pushToHistory();
    localDbCopy.quizzes[idx].moodKeywordsDanish = danishVal;
    
    // Brug den globale translateKeywords funktion fra skills.js
    const englishVal = window.translateKeywords(danishVal);
    localDbCopy.quizzes[idx].moodKeywords = englishVal;
    
    // VI SLETTER IKKE LÆNGERE BILLEDET AUTOMATISK HER.
    // Læreren bestemmer selv, hvornår der skal hentes et nyt billede ved at trykke "Nyt Billede".
    
    renderAdminContent();
};

window.quickAddCategory = () => {
    const title = prompt("Hvad skal den nye kategori hedde?");
    if (title && title.trim()) {
        const id = title.toLowerCase().trim().replace(/\s+/g, '-');
        if (localDbCopy.categories.find(c => c.id === id)) {
            alert("Denne kategori findes allerede.");
            return;
        }
        pushToHistory();
        localDbCopy.categories.push({ id, title: title.trim() });
        renderAdminContent();
        window.switchTab('ai');
        document.getElementById('ai-category').value = id;
    }
};

window.switchTab = (tabId) => {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    const btn = document.getElementById(`btn-tab-${tabId}`);
    const content = document.getElementById(`tab-${tabId}`);
    if (btn) btn.classList.add('active');
    if (content) content.classList.add('active');
};

window.generateAiPrompt = () => {
    const topic = document.getElementById('ai-topic').value;
    const requirements = document.getElementById('ai-requirements').value;
    const catId = document.getElementById('ai-category').value;
    const catTitle = localDbCopy.categories.find(c => c.id === catId).title;

    if (!topic) { alert("Skriv et emne."); return; }

    const prompt = `Som tømrer-ekspert og faglærer, lav en seriøs JSON quiz om "${topic}" til kategorien "${catTitle}". 

${requirements ? `SPECIFIKKE KRAV/SCENARIE:\n${requirements}\n` : ''}

KRAV TIL KVALITET:
- Sværhedsgrad: Svendeprøve-niveau (teknisk funderet).
- Spørgsmål: Skal teste forståelse, regler (f.eks. fra Træ-fakta, BR18, Arbejdstilsynet) eller praktisk udførelse.
- Svarmuligheder: Lav 3-4 muligheder pr. spørgsmål.
- Distraktorer (forkerte svar): Skal være yderst realistiske og teknisk plausible, ikke banale. De skal kræve faglig viden at gennemskue.
- Rationale: Hvert spørgsmål SKAL have en 'rationale' (en kort faglig forklaring på max 2 sætninger, der bekræfter hvorfor det rigtige svar er korrekt).

JSON STRUKTUR (VIGTIG):
{
  "id": "${topic.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}",
  "categoryId": "${catId}",
  "title": "${topic}",
  "description": "Faglig quiz om ${topic}.",
  "moodKeywords": "skriv-engelske-tags-here (f.eks. stairs,carpentry)",
  "moodKeywordsDanish": "skriv-danske-tags-her (f.eks. trapper)",
  "questions": [
    {
      "question": "Spørgsmålstekst her?",
      "options": ["Svar 1", "Svar 2", "Svar 3"],
      "correctIndex": 0,
      "rationale": "Faglig forklaring her."
    }
  ]
}

REGLER FOR BILLED-SØGEORD:
- find ord der matcher emnet perfekt.
- moodKeywords: KUN engelsk. 
- moodKeywordsDanish: KUN dansk.
- Brug komma imellem ordene. Max 2-3 ord.

SVAR KUN MED RÅ JSON.`;

    document.getElementById('prompt-text').textContent = prompt;
    document.getElementById('ai-prompt-result').style.display = 'block';
};

window.importAiQuiz = () => {
    const raw = document.getElementById('ai-import-json').value;
    try {
        const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
        let data = JSON.parse(cleaned);

        // Robusthed: Håndter hvis AI bruger forkerte feltnavne
        if (data.questions && Array.isArray(data.questions)) {
            data.questions = data.questions.map(q => {
                // Flyt 'answers' til 'options' hvis nødvendigt
                if (!q.options && q.answers) q.options = q.answers;
                // Flyt 'correctAnswer' til 'correctIndex' hvis nødvendigt
                if (q.correctIndex === undefined && q.correctAnswer !== undefined) q.correctIndex = q.correctAnswer;
                // Sørg for at 'options' eksisterer som et array for at undgå .map fejl senere
                if (!q.options) q.options = ["Fejl: Ingen svarmuligheder fundet"];
                if (q.correctIndex === undefined) q.correctIndex = 0;
                if (!q.rationale) q.rationale = "";
                return q;
            });
        } else {
            throw new Error("JSON indeholder ikke et gyldigt 'questions' array.");
        }

        if (data.moodImageUrl && data.moodImageUrl.includes('loremflickr')) {
            delete data.moodImageUrl; 
        }
        if (!data.moodImageLock) data.moodImageLock = Math.floor(Math.random() * 5000);
        
        if (!data.moodKeywordsDanish) data.moodKeywordsDanish = "";
        
        pushToHistory();
        localDbCopy.quizzes.push(data);
        alert("Quiz oprettet med succes!");
        window.switchTab('edit');
        renderAdminContent();
    } catch(e) { 
        alert("Fejl i koden: " + e.message + "\n\nTjek at du har kopieret hele koden korrekt fra ChatGPT."); 
        console.error("AI Import Fejl:", e);
    }
};

window.toggleEditQuiz = (idx, forceOpen = false) => {
    const el = document.getElementById(`edit-quiz-${idx}`);
    if (forceOpen) {
        el.style.display = 'block';
        activeQuizIdx = idx;
    } else {
        const isOpening = el.style.display === 'none';
        el.style.display = isOpening ? 'block' : 'none';
        activeQuizIdx = isOpening ? idx : null;
    }
};

function getCategoryTitle(id) {
    const cat = localDbCopy.categories.find(c => c.id === id);
    return cat ? cat.title : id;
}

window.updateCategory = (idx, key, val) => { pushToHistory(); localDbCopy.categories[idx][key] = val; renderAdminContent(); };
window.removeCategory = (idx) => { pushToHistory(); localDbCopy.categories.splice(idx, 1); renderAdminContent(); };
window.addCategory = () => { pushToHistory(); localDbCopy.categories.push({ id: 'cat-'+Date.now(), title: 'Ny Kategori' }); renderAdminContent(); };
window.updateQuiz = (idx, key, val) => { pushToHistory(); localDbCopy.quizzes[idx][key] = val; renderAdminContent(); };
window.removeQuiz = (idx) => { pushToHistory(); localDbCopy.quizzes.splice(idx, 1); renderAdminContent(); };
window.addQuiz = () => { pushToHistory(); localDbCopy.quizzes.push({ id: 'q-'+Date.now(), title: 'Ny Quiz', questions: [], categoryId: localDbCopy.categories[0].id }); renderAdminContent(); };
window.updateQuestion = (idx, qIdx, key, val) => { pushToHistory(); localDbCopy.quizzes[idx].questions[qIdx][key] = val; renderAdminContent(); };
window.updateOption = (idx, qIdx, oIdx, val) => { pushToHistory(); localDbCopy.quizzes[idx].questions[qIdx].options[oIdx] = val; renderAdminContent(); };
window.removeQuestion = (idx, qIdx) => { pushToHistory(); localDbCopy.quizzes[idx].questions.splice(qIdx, 1); renderAdminContent(); };
window.addQuestion = (idx) => { pushToHistory(); localDbCopy.quizzes[idx].questions.push({ question: '?', options: ['A','B','C'], correctIndex: 0, rationale: '' }); renderAdminContent(); };

window.saveAdminChanges = async () => {
    const success = await saveDbToCloud(localDbCopy);
    if (success) {
        alert("Gemt i skyen! Alle lærere og elever kan nu se ændringerne.");
        location.reload();
    } else {
        alert("Fejl: Kunne ikke gemme i skyen. Tjek din internetforbindelse.");
    }
};

window.resetToStandard = async () => {
    if (confirm("Vil du nulstille til standard-indholdet fra skyen?")) {
        localStorage.removeItem('quiz_hub_admin_data');
        location.reload();
    }
};

window.copyPrompt = () => { navigator.clipboard.writeText(document.getElementById('prompt-text').textContent); alert("Kopieret!"); };

window.downloadBackup = () => {
    const blob = new Blob([JSON.stringify(localDbCopy, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `quiz_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
};

window.handleBackupUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (ev) => {
        localDbCopy = JSON.parse(ev.target.result);
        renderAdminContent();
        alert("Backup indlæst!");
    };
    reader.readAsText(file);
};

window.exportDatabase = () => {
    const code = `window.QUIZ_DATABASE = ${JSON.stringify(localDbCopy, null, 2)};`;
    const blob = new Blob([code], { type: 'text/javascript' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'database.js';
    a.click();
};

// FJERN DUPLIKERET REFRESHIMAGE OG BRUG DEN KONSOLIDEREDE FOROVEN

window.lockImage = function(idx) {
    const imgEl = document.getElementById(`preview-img-${idx}`);
    if (!imgEl) return;
    
    pushToHistory();
    const quiz = localDbCopy.quizzes[idx];
    quiz.moodImageUrl = imgEl.src;
    
    // Vis feedback
    const btn = event.target;
    const oldText = btn.innerHTML;
    btn.innerHTML = "✅ Gemt!";
    btn.style.backgroundColor = "var(--success)";
    
    saveDbToCloud(localDbCopy);
    
    setTimeout(() => {
        btn.innerHTML = oldText;
        btn.style.backgroundColor = "";
        renderAdminContent();
    }, 1500);
};

document.addEventListener('keydown', (e) => {
    if (document.getElementById('admin-modal').style.display === 'flex') {
        if (e.ctrlKey && e.key === 'z') { e.preventDefault(); window.undo(); }
        if (e.ctrlKey && e.key === 'y') { e.preventDefault(); window.redo(); }
    }
});

document.addEventListener('DOMContentLoaded', initAdmin);
