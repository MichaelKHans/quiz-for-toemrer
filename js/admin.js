/**
 * admin.js
 * Håndterer administration, redigering og sikkerhed (Undo/Backup).
 */

import { saveDbToCloud } from './firebase-service.js';

const APP_VERSION = "v3.3.1";
const ADMIN_PASSWORD = "tømrer123";

const UPDATE_LOG = [
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
    document.getElementById('admin-modal').style.display = 'flex';
    // Opdater overskrift med version
    const titleEl = document.querySelector('#admin-modal h2');
    if (titleEl) titleEl.textContent = `Tømrer Quiz - Panel (Underviser) - ${APP_VERSION}`;
    
    localDbCopy = window.QuizMemory.getCustomDatabase() || JSON.parse(JSON.stringify(window.QUIZ_DATABASE));
    
    // AUTO-MIGRATION: Opdater gamle quizzer med nye metadata fra master-databasen hvis de mangler
    if (window.QUIZ_DATABASE) {
        let migrated = false;
        localDbCopy.quizzes.forEach(quiz => {
            const masterQuiz = window.QUIZ_DATABASE.quizzes.find(mq => mq.id === quiz.id);
            if (masterQuiz) {
                if (!quiz.moodKeywords && masterQuiz.moodKeywords) {
                    quiz.moodKeywords = masterQuiz.moodKeywords;
                    migrated = true;
                }
                if (!quiz.moodImageLock && masterQuiz.moodImageLock) {
                    quiz.moodImageLock = masterQuiz.moodImageLock;
                    migrated = true;
                }
            }
        });
        if (migrated) {
            console.log("Migration: Gamle quizzer opdateret med nye billed-metadata.");
        }
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
    
    let html = `
        <div class="admin-tabs">
            <button class="tab-btn active" id="btn-tab-edit" onclick="switchTab('edit')">Rediger Indhold</button>
            <button class="tab-btn" id="btn-tab-ai" onclick="switchTab('ai')">✨ Skab med AI</button>
            <button class="tab-btn" id="btn-tab-log" onclick="switchTab('log')">📜 Logbog</button>
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
                        const translated = typeof translateKeywords !== 'undefined' ? translateKeywords(displayKeywords) : displayKeywords;
                        const finalKeywords = translated || "construction,carpentry";
                        const lockValue = quiz.moodImageLock || quiz.id;
                        const previewUrl = quiz.moodImageUrl || `https://loremflickr.com/320/240/${finalKeywords}?lock=${lockValue}`;
                        
                        return `
                        <div class="admin-item-expanded">
                            <div class="admin-item-header">
                                <div>
                                    <span class="admin-cat-tag">${getCategoryTitle(quiz.categoryId)}</span>
                                    <strong>${quiz.title}</strong>
                                </div>
                                <div>
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
                                        <div class="mood-preview-container" style="position:relative; margin-bottom: 0.5rem;">
                                            <img src="${previewUrl}" id="preview-img-${idx}" style="width: 100%; border-radius: 8px; border: 1px solid var(--accent); box-shadow: 0 0 10px var(--accent-glow);">
                                            <button class="btn btn-secondary btn-small" style="width: 100%; margin-top: 0.5rem;" onclick="refreshImage(${idx})">🔄 Prøv et andet billede</button>
                                        </div>
                                        <label>Søgeord (Engelsk)</label>
                                        <input type="text" value="${quiz.moodKeywords || ''}" placeholder="f.eks. roof, timber" onchange="updateQuiz(${idx}, 'moodKeywords', this.value)">
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
                    <div class="ai-input-group" style="align-items: center;">
                        <input type="text" id="ai-topic" placeholder="F.eks. Faldsikring, Tagspær eller Stillads" style="flex: 2;">
                        <select id="ai-category" style="flex: 1;">
                            ${localDbCopy.categories.map(c => `<option value="${c.id}">${c.title}</option>`).join('')}
                        </select>
                        <button class="btn btn-secondary btn-small" onclick="quickAddCategory()" title="Opret ny kategori her">+ Ny</button>
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
            <button class="btn btn-primary" onclick="saveAdminChanges()">Gem alle ændringer i skyen ☁️</button>
        </div>
    `;
    
    container.innerHTML = html;
}

window.refreshImage = (idx) => {
    pushToHistory();
    const newLock = Math.floor(Math.random() * 10000);
    localDbCopy.quizzes[idx].moodImageLock = newLock;
    renderAdminContent();
    toggleEditQuiz(idx, true);
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
    const catId = document.getElementById('ai-category').value;
    const catTitle = localDbCopy.categories.find(c => c.id === catId).title;

    if (!topic) { alert("Skriv et emne."); return; }

    const prompt = `Som tømrer-ekspert, lav en JSON quiz om "${topic}" til "${catTitle}". 
JSON format:
{
  "id": "${topic.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}",
  "categoryId": "${catId}",
  "title": "${topic}",
  "description": "Faglig quiz om ${topic}.",
  "moodKeywords": "${topic}",
  "moodImageLock": ${Math.floor(Math.random() * 5000)},
  "questions": [...]
}
VIGTIGT: moodKeywords skal KUN indeholde meget præcise tekniske engelske termer for emnet (f.eks. 'black-mold' eller 'timber-decay'). Ingen generelle ord som 'carpenter'. KUN JSON i svaret.`;

    document.getElementById('prompt-text').textContent = prompt;
    document.getElementById('ai-prompt-result').style.display = 'block';
};

window.importAiQuiz = () => {
    const raw = document.getElementById('ai-import-json').value;
    try {
        const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(cleaned);
        if (data.moodImageUrl && data.moodImageUrl.includes('loremflickr')) {
            delete data.moodImageUrl; 
        }
        if (!data.moodImageLock) data.moodImageLock = Math.floor(Math.random() * 5000);
        pushToHistory();
        localDbCopy.quizzes.push(data);
        alert("Quiz oprettet! Den bruger nu vores nye intelligente billed-finder.");
        window.switchTab('edit');
        renderAdminContent();
    } catch(e) { alert("Fejl i koden: " + e.message); }
};

window.toggleEditQuiz = (idx, forceOpen = false) => {
    const el = document.getElementById(`edit-quiz-${idx}`);
    if (forceOpen) el.style.display = 'block';
    else el.style.display = el.style.display === 'none' ? 'block' : 'none';
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
        window.QuizMemory.saveCustomDatabase(localDbCopy); 
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

document.addEventListener('keydown', (e) => {
    if (document.getElementById('admin-modal').style.display === 'flex') {
        if (e.ctrlKey && e.key === 'z') { e.preventDefault(); window.undo(); }
        if (e.ctrlKey && e.key === 'y') { e.preventDefault(); window.redo(); }
    }
});

document.addEventListener('DOMContentLoaded', initAdmin);
