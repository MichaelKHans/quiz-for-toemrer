/**
 * admin.js - v5.6.3 UI/UX Icon Fix & Text Visibility
 * Håndterer administration, redigering og sikkerhed (Undo/Backup).
 */

import { saveDbToCloud, getDbFromCloud } from './firebase-service.js';

const APP_VERSION = "v5.6.3";
const ADMIN_PASSWORD = "tømrer123";

// Live Audio System (Teacher side)
const liveAudio = {
    music: new Audio('https://michaelkhans.github.io/quiz-for-toemrer/audio/live_bg.mp3'),
    correct: new Audio('https://michaelkhans.github.io/quiz-for-toemrer/audio/correct.mp3'),
    incorrect: new Audio('https://michaelkhans.github.io/quiz-for-toemrer/audio/incorrect.mp3'),
    isMuted: false,
    volume: 0.5
};
liveAudio.music.loop = true;

window.toggleLiveMusic = () => {
    liveAudio.isMuted = !liveAudio.isMuted;
    if (liveAudio.isMuted) {
        liveAudio.music.pause();
    } else {
        liveAudio.music.play().catch(e => console.log("Audio play blocked"));
    }
    renderAdminContent();
};

window.setLiveVolume = (val) => {
    liveAudio.volume = val;
    liveAudio.music.volume = val;
    liveAudio.correct.volume = val;
    liveAudio.incorrect.volume = val;
};

const UPDATE_LOG = [
    {
        version: "v5.6.3",
        date: "2026-04-24",
        title: "👁️ FontAwesome Ikoner & Farve-fix",
        desc: "Implementeret rigtige FontAwesome ikoner (øje-ikoner) og fixet 'sort-på-sort' teksten i alle input-felter."
    },
    {
        version: "v5.6.2",
        date: "2026-04-24",
        title: "🎨 UX/UI Polering",
        desc: "Fixet scrolling og tilføjet tooltips."
    }
];

let localDbCopy = null;
let historyStack = [];
let redoStack = [];
let adminSearchTerm = ""; 
let currentLivePin = null;
let activeSessionUnsubscribe = null;

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
    container.innerHTML = `<div class="loader" style="margin: 2rem auto;">⌛</div>`;
    document.getElementById('admin-modal').style.display = 'flex';
    document.body.classList.add('admin-mode');
    
    try {
        const cloudDb = await getDbFromCloud();
        localDbCopy = cloudDb || { quizzes: [], categories: [] };
        renderAdminContent();
    } catch (e) { alert("Kunne ikke hente data."); }
}

window.closeAdmin = () => {
    document.getElementById('admin-modal').style.display = 'none';
    document.body.classList.remove('admin-mode');
};

function renderAdminContent() {
    const container = document.getElementById('admin-content-inner');
    if (!container) return;
    
    const term = adminSearchTerm.toLowerCase();
    const filteredQuizzes = localDbCopy.quizzes.filter(q => q.title.toLowerCase().includes(term));

    container.innerHTML = `
        <div class="admin-toolbar" style="padding: 1rem; display: flex; gap: 1rem; align-items: center; background: rgba(255,255,255,0.02); position: sticky; top: 0; z-index: 10; backdrop-filter: blur(10px);">
            <input type="text" placeholder="Søg i dine quizzer..." value="${adminSearchTerm}" oninput="window.setAdminSearch(this.value)" style="flex: 1;">
            <button class="btn btn-secondary" onclick="openAIModal()" title="Skab en quiz med AI flow"><i class="fa-solid fa-wand-magic-sparkles"></i> AI Flow</button>
            <button class="btn btn-secondary" onclick="openLogModal()" title="Se systemets opdaterings-historik"><i class="fa-solid fa-clock-rotate-left"></i> Log</button>
            <button class="btn btn-primary" onclick="saveAdminChanges()" title="Gem alle ændringer i skyen"><i class="fa-solid fa-cloud-arrow-up"></i> Gem i skyen</button>
        </div>

        <div style="padding: 1.5rem;">
            <h3 style="margin-bottom: 1rem; opacity: 0.7;">Kategorier (${localDbCopy.categories.length})</h3>
            <div class="admin-items">
                ${localDbCopy.categories.map((cat, idx) => `
                    <div class="admin-item" style="display: flex; gap: 0.8rem; margin-bottom: 0.8rem; background: rgba(255,255,255,0.03); padding: 0.5rem; border-radius: 8px;">
                        <input type="text" value="${cat.title}" onchange="updateCategory(${idx}, 'title', this.value)" style="flex: 1;">
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="btn-icon" onclick="updateCategory(${idx}, 'isHidden', ${!cat.isHidden})" title="${cat.isHidden ? 'Gør kategori synlig' : 'Skjul kategori'}">
                                <i class="fa-solid ${cat.isHidden ? 'fa-eye-slash' : 'fa-eye'}"></i>
                            </button>
                            <button class="btn-icon" onclick="removeCategory(${idx})" title="Slet kategori"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>
                `).join('')}
                <button class="btn btn-secondary btn-small" onclick="addCategory()">+ Tilføj Kategori</button>
            </div>

            <h3 style="margin-top: 3rem; margin-bottom: 1rem; opacity: 0.7;">Quizzer (${filteredQuizzes.length})</h3>
            <div class="admin-items">
                ${filteredQuizzes.map((quiz) => {
                    const idx = localDbCopy.quizzes.findIndex(q => q.id === quiz.id);
                    return `
                    <div class="admin-item-expanded" style="background: rgba(255,255,255,0.02); padding: 1.2rem; border-radius: 12px; margin-bottom: 1rem; border: 1px solid rgba(255,255,255,0.05);">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div style="display: flex; align-items: center; gap: 1rem;">
                                <span class="admin-cat-tag" style="background: var(--accent); color: white; font-size: 0.7rem; font-weight: bold; padding: 4px 10px; border-radius: 6px;">${getCategoryTitle(quiz.categoryId)}</span>
                                <strong style="font-size: 1.1rem;">${quiz.title}</strong>
                            </div>
                            <div style="display: flex; gap: 0.8rem;">
                                <button class="btn btn-accent btn-small" onclick="initiateLiveSession(${idx})" title="Start Live Quiz for klassen 🚀"><i class="fa-solid fa-rocket"></i> Live</button>
                                <button class="btn btn-secondary btn-small" onclick="toggleEditQuiz(${idx})" title="Rediger spørgsmål og detaljer ✏️"><i class="fa-solid fa-pen-to-square"></i> Rediger</button>
                                <button class="btn-icon" onclick="updateQuiz(${idx}, 'isHidden', ${!quiz.isHidden})" title="${quiz.isHidden ? 'Gør quiz synlig for alle' : 'Skjul quiz fra oversigten'}">
                                    <i class="fa-solid ${quiz.isHidden ? 'fa-eye-slash' : 'fa-eye'}"></i>
                                </button>
                                <button class="btn-icon" onclick="removeQuiz(${idx})" title="Slet denne quiz permanent 🗑️"><i class="fa-solid fa-trash"></i></button>
                            </div>
                        </div>
                        <div id="edit-quiz-${idx}" style="display: none; margin-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 1.5rem;">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                                <div>
                                    <label style="display: block; font-size: 0.8rem; opacity: 0.6; margin-bottom: 0.3rem;">Quiz Titel</label>
                                    <input type="text" value="${quiz.title}" onchange="updateQuiz(${idx}, 'title', this.value)" style="width: 100%;">
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.8rem; opacity: 0.6; margin-bottom: 0.3rem;">Kategori</label>
                                    <select onchange="updateQuiz(${idx}, 'categoryId', this.value)" style="width: 100%;">
                                        ${localDbCopy.categories.map(c => `<option value="${c.id}" ${c.id === quiz.categoryId ? 'selected' : ''}>${c.title}</option>`).join('')}
                                    </select>
                                </div>
                            </div>
                            <label style="display: block; font-size: 0.8rem; opacity: 0.6; margin-bottom: 0.3rem;">Kort beskrivelse</label>
                            <textarea onchange="updateQuiz(${idx}, 'description', this.value)" style="width: 100%; height: 60px; margin-bottom: 1.5rem;">${quiz.description}</textarea>
                            
                            <h4 style="margin-bottom: 1rem;">Spørgsmål (${quiz.questions.length})</h4>
                            <div class="admin-questions">
                                ${quiz.questions.map((q, qIdx) => `
                                    <div style="background: rgba(0,0,0,0.2); padding: 1.2rem; border-radius: 10px; margin-bottom: 1rem; border: 1px solid rgba(255,255,255,0.03);">
                                        <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
                                            <span style="opacity: 0.3; font-weight: bold;">#${qIdx+1}</span>
                                            <input type="text" value="${q.question}" onchange="updateQuestion(${idx}, ${qIdx}, 'question', this.value)" style="flex: 1;" placeholder="Indtast spørgsmål...">
                                            <button class="btn-icon" onclick="removeQuestion(${idx}, ${qIdx})" title="Fjern dette spørgsmål"><i class="fa-solid fa-trash-can"></i></button>
                                        </div>
                                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                                            ${q.options.map((opt, oIdx) => `
                                                <div style="display: flex; gap: 0.8rem; align-items: center; background: rgba(255,255,255,0.02); padding: 0.5rem; border-radius: 6px;">
                                                    <input type="radio" name="correct-${idx}-${qIdx}" ${q.correctIndex === oIdx ? 'checked' : ''} onchange="updateQuestion(${idx}, ${qIdx}, 'correctIndex', ${oIdx})" title="Marker som korrekt svar">
                                                    <input type="text" value="${opt}" onchange="updateOption(${idx}, ${qIdx}, ${oIdx}, this.value)" style="flex:1; font-size: 0.9rem; background: transparent; border: none; color: white;" placeholder="Svarmulighed ${oIdx+1}">
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                `).join('')}
                                <button class="btn btn-secondary btn-small" onclick="addQuestion(${idx})" style="width: 100%; padding: 1rem; border: 2px dashed rgba(255,255,255,0.1); background: transparent;">+ Tilføj endnu et spørgsmål</button>
                            </div>
                        </div>
                    </div>
                `;}).join('')}
                <button class="btn btn-primary" onclick="addQuiz()" style="width: 100%; padding: 2rem; font-size: 1.2rem; border: 2px dashed var(--accent); background: rgba(99, 102, 241, 0.05);">+ Opret en helt ny Quiz 📚</button>
            </div>
        </div>
    `;
}

function getCategoryTitle(id) {
    const cat = localDbCopy.categories.find(c => c.id === id);
    return cat ? cat.title : "Ingen";
}

// AI WORKFLOW (v5.6.0)
window.openAIModal = () => document.getElementById('ai-modal').style.display = 'flex';
window.closeAIModal = () => document.getElementById('ai-modal').style.display = 'none';

window.copyAIPrompt = () => {
    const topic = document.getElementById('ai-topic-input').value.trim() || "[EMNE]";
    const scenario = document.getElementById('ai-scenario-input').value.trim() || "Ingen specielle krav.";
    const prompt = `Du er en ekspert i tømrerfaget. Lav en quiz om ${topic}. Tag højde for disse krav: ${scenario}. Du SKAL returnere svaret udelukkende som rå JSON uden markdown-formatering. Formatet skal være præcis sådan her:
{ 
  "title": "${topic}", 
  "category": "Tømrerfag", 
  "questions": [ 
    { 
      "question": "[Spørgsmål]", 
      "options": ["[Svar A]", "[Svar B]", "[Svar C]", "[Svar D]"], 
      "correctIndex": 0,
      "rationale": "[Kort forklaring på hvorfor svaret er korrekt]"
    } 
  ] 
}`;
    navigator.clipboard.writeText(prompt).then(() => {
        const status = document.getElementById('copy-status');
        status.style.display = 'block';
        setTimeout(() => status.style.display = 'none', 2000);
    });
};

window.createQuizFromAIJSON = async () => {
    const codeInput = document.getElementById('ai-code-input').value.trim();
    if (!codeInput) return alert("Indsæt venligst koden fra AI'en.");
    try {
        const aiData = JSON.parse(codeInput);
        if (!aiData.title || !aiData.questions) throw new Error("Ugyldigt format");
        const uniktId = 'q-ai-' + Date.now();
        const newQuiz = {
            id: uniktId, categoryId: localDbCopy.categories[0].id, title: aiData.title,
            description: `AI-genereret quiz om ${aiData.title}.`,
            questions: aiData.questions.map(q => ({
                question: q.question, options: q.options,
                correctIndex: q.correctIndex !== undefined ? q.correctIndex : (q.correctAnswer || 0),
                rationale: q.rationale || ""
            })), isHidden: false
        };
        localDbCopy.quizzes.unshift(newQuiz);
        await window.update(window.ref(window.db, `quiz_database/quizzes`), { [localDbCopy.quizzes.length]: newQuiz });
        alert("Quiz oprettet!"); closeAIModal(); renderAdminContent();
    } catch (e) { alert("Fejl: " + e.message); }
};

// LOG MODAL
window.openLogModal = () => {
    const logContent = document.getElementById('log-content');
    logContent.innerHTML = UPDATE_LOG.map(log => `
        <div style="margin-bottom: 1.5rem; padding: 1.5rem; background: rgba(255,255,255,0.03); border-radius: 12px; border-left: 4px solid var(--accent);">
            <div style="display: flex; justify-content: space-between; opacity: 0.6; font-size: 0.8rem; margin-bottom: 0.5rem;">
                <span style="font-weight: bold; color: var(--accent);">${log.version}</span>
                <span>${log.date}</span>
            </div>
            <h4 style="margin: 0; font-size: 1.2rem;">${log.title}</h4>
            <p style="opacity: 0.8; font-size: 0.95rem; line-height: 1.5; margin-top: 0.5rem;">${log.desc}</p>
        </div>
    `).join('');
    document.getElementById('log-modal').style.display = 'flex';
};
window.closeLogModal = () => document.getElementById('log-modal').style.display = 'none';

// DATA OPS
window.setAdminSearch = (val) => { adminSearchTerm = val; renderAdminContent(); };
window.updateCategory = (idx, key, val) => { localDbCopy.categories[idx][key] = val; renderAdminContent(); };
window.removeCategory = (idx) => { if(confirm("Slet kategori?")) { localDbCopy.categories.splice(idx, 1); renderAdminContent(); } };
window.addCategory = () => { localDbCopy.categories.push({ id: 'cat-'+Date.now(), title: 'Ny Kategori', isHidden: false }); renderAdminContent(); };
window.updateQuiz = (idx, key, val) => { localDbCopy.quizzes[idx][key] = val; renderAdminContent(); };
window.removeQuiz = (idx) => { if(confirm("Slet denne quiz permanent?")) { localDbCopy.quizzes.splice(idx, 1); renderAdminContent(); } };
window.addQuiz = () => { localDbCopy.quizzes.push({ id: 'q-'+Date.now(), title: 'Ny Quiz', description: '', categoryId: localDbCopy.categories[0].id, questions: [], isHidden: false }); renderAdminContent(); };
window.updateQuestion = (idx, qIdx, key, val) => { localDbCopy.quizzes[idx].questions[qIdx][key] = val; renderAdminContent(); };
window.updateOption = (idx, qIdx, oIdx, val) => { localDbCopy.quizzes[idx].questions[qIdx].options[oIdx] = val; renderAdminContent(); };
window.addQuestion = (idx) => { localDbCopy.quizzes[idx].questions.push({ question: '', options: ['','','',''], correctIndex: 0, rationale: '' }); renderAdminContent(); };
window.removeQuestion = (idx, qIdx) => { localDbCopy.quizzes[idx].questions.splice(qIdx, 1); renderAdminContent(); };

window.toggleEditQuiz = (idx) => {
    const el = document.getElementById(`edit-quiz-${idx}`);
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
};
window.saveAdminChanges = async () => {
    const success = await saveDbToCloud(localDbCopy);
    if (success) { alert("Alle ændringer er nu gemt i skyen!"); location.reload(); }
};

// --- LIVE LOGIK (v5.6.1) ---
window.initiateLiveSession = async (quizIdx) => {
    sessionStorage.setItem('quizRole', 'teacher');
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    currentLivePin = pin;
    const quiz = localDbCopy.quizzes[quizIdx];
    const sessionData = { pin, quizId: quiz.id, quizTitle: quiz.title, status: 'lobby', currentQuestionIndex: 0, createdAt: Date.now(), players: {} };

    try {
        await window.set(window.ref(window.db, `live_sessions/${pin}`), sessionData);
        renderLobbyUI(pin, quiz.title);
        if (activeSessionUnsubscribe) activeSessionUnsubscribe();
        activeSessionUnsubscribe = window.onValue(window.ref(window.db, `live_sessions/${pin}`), (snap) => {
            const data = snap.val();
            if (!data) return;
            if (data.status === 'lobby') updateLobbyPlayerList(data);
            else if (data.status === 'playing') renderTeacherGameView(data);
            else if (data.status === 'showing_results') renderLeaderboard(data);
            else if (data.status === 'finished') renderPodium(data);
        });
    } catch (e) { console.error(e); }
};

function renderLobbyUI(pin, title) {
    const container = document.getElementById('admin-content-inner');
    container.innerHTML = `
        <div class="live-lobby-container admin-live-dashboard fade-in">
            <span class="live-badge">TØMRER-LIVE LOBBY</span>
            <h1 style="font-size: 2.5rem; margin: 1rem 0;">${title}</h1>
            <div class="pin-display-compact" style="background: rgba(255,255,255,0.05); padding: 2rem; border-radius: 20px; display: inline-block; margin-bottom: 2rem; border: 2px solid var(--accent);">
                <p style="opacity: 0.7; margin: 0;">PIN KODE:</p>
                <div style="font-size: 4rem; font-weight: 900; color: var(--accent); letter-spacing: 10px;">${pin}</div>
            </div>
            <div style="margin-bottom: 2rem; font-size: 1.5rem;">👥 <span id="player-count-val">0</span> spillere klar</div>
            <div id="player-list" class="player-grid"></div>
            <div class="lobby-actions-fixed">
                <button class="btn btn-secondary" onclick="stopLiveSession()">Afbryd Session</button>
                <button class="btn btn-success btn-large" id="start-btn" onclick="startLiveGame('${pin}')" disabled>START QUIZ 🚀</button>
            </div>
        </div>
    `;
}

function updateLobbyPlayerList(session) {
    const list = document.getElementById('player-list');
    const countVal = document.getElementById('player-count-val');
    const startBtn = document.getElementById('start-btn');
    if (!list) return;
    const players = session.players ? Object.values(session.players) : [];
    if (countVal) countVal.textContent = players.length;
    if (players.length > 0) {
        if (startBtn) startBtn.disabled = false;
        list.innerHTML = players.map(p => `<div class="player-bubble fade-in"><span>${p.icon || '👤'} ${p.name}</span></div>`).join('');
    } else {
        if (startBtn) startBtn.disabled = true;
        list.innerHTML = `<p style="opacity: 0.5;">Venter på at eleverne taster PIN-koden...</p>`;
    }
}

window.startLiveGame = async (pin) => {
    await window.update(window.ref(window.db, `live_sessions/${pin}`), { status: 'playing', currentQuestionIndex: 0, questionStartTime: Date.now() });
};

function renderTeacherGameView(session) {
    const container = document.getElementById('admin-content-inner');
    const quiz = localDbCopy.quizzes.find(q => q.id === session.quizId);
    const qIdx = session.currentQuestionIndex || 0;
    const question = quiz.questions[qIdx];
    const players = session.players ? Object.values(session.players) : [];
    const answerCount = players.filter(p => p && p.answer !== undefined).length;

    container.innerHTML = `
        <div class="teacher-game-dashboard admin-live-dashboard fade-in">
            <div class="game-info-bar">
                <div style="display: flex; gap: 2rem; align-items: center;">
                    <span class="live-badge" style="margin:0;">SPØRGSMÅL ${qIdx + 1}/${quiz.questions.length}</span>
                    <h2 style="margin:0; opacity: 0.7; font-size: 1rem;">${quiz.title}</h2>
                </div>
                <div style="font-size: 1.2rem;">PIN: <span style="color: var(--accent); font-weight: bold;">${session.pin}</span> | 👥 ${players.length}</div>
            </div>
            <div class="current-question-display"><h1>${question.question}</h1></div>
            <div class="teacher-options-preview">
                ${question.options.map((opt, i) => `<div style="background: ${['#e21b3c', '#1368ce', '#d89e00', '#26890c'][i]}; color: white;">${opt}</div>`).join('')}
            </div>
            <div class="answer-stats-panel">
                <span style="font-size: 2.5rem; font-weight: 900; color: var(--accent);">${answerCount} / ${players.length} SVAR MODTAGET</span>
            </div>
            <div class="lobby-actions-fixed">
                <button class="btn btn-secondary" onclick="stopLiveSession()">Afbryd</button>
                <button class="btn btn-accent btn-large" onclick="showQuestionResults('${session.pin}')">VIS RESULTATER 📊</button>
            </div>
        </div>
    `;
}

window.showQuestionResults = async (pin) => {
    await window.update(window.ref(window.db, `live_sessions/${pin}`), { status: 'showing_results', showResults: true });
};

function renderLeaderboard(session) {
    const container = document.getElementById('admin-content-inner');
    const quiz = localDbCopy.quizzes.find(q => q.id === session.quizId);
    const qIdx = session.currentQuestionIndex || 0;
    const players = Object.values(session.players || {}).sort((a,b) => b.points - a.points);

    container.innerHTML = `
        <div class="teacher-game-dashboard admin-live-dashboard fade-in">
            <h1>LEADERBOARD - SPØRGSMÅL ${qIdx + 1}</h1>
            <div style="max-width: 600px; margin: 2rem auto; background: rgba(255,255,255,0.03); padding: 2rem; border-radius: 15px;">
                ${players.slice(0, 5).map((p, i) => `
                    <div style="display: flex; justify-content: space-between; padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <span>${i+1}. ${p.icon || '👤'} ${p.name}</span>
                        <span style="font-weight: bold; color: var(--accent);">${p.points || 0} p</span>
                    </div>
                `).join('')}
            </div>
            <div class="lobby-actions-fixed">
                <button class="btn btn-secondary" onclick="stopLiveSession()">Stop</button>
                ${qIdx < quiz.questions.length - 1 
                    ? `<button class="btn btn-primary btn-large" onclick="nextLiveQuestion('${session.pin}')">NÆSTE SPØRGSMÅL ➡️</button>`
                    : `<button class="btn btn-success btn-large" onclick="stopLiveSession()">AFSLUT QUIZ 🏁</button>`
                }
            </div>
        </div>
    `;
}

window.nextLiveQuestion = async (pin) => {
    const snap = await window.get(window.ref(window.db, `live_sessions/${pin}`));
    const session = snap.val();
    await window.update(window.ref(window.db, `live_sessions/${pin}`), {
        status: 'playing', currentQuestionIndex: (session.currentQuestionIndex || 0) + 1,
        questionStartTime: Date.now(), showResults: false
    });
};

window.stopLiveSession = async () => {
    if (currentLivePin) await window.set(window.ref(window.db, `live_sessions/${currentLivePin}/status`), 'finished');
    renderAdminContent();
};

function renderPodium(session) {
    const container = document.getElementById('admin-content-inner');
    const players = Object.values(session.players || {}).sort((a,b) => b.points - a.points);
    container.innerHTML = `
        <div class="podium-screen fade-in" style="text-align:center; padding: 4rem 2rem;">
            <h1>🏆 VINDEREN ER... 🏆</h1>
            <div style="font-size: 3rem; margin: 2rem 0;">👑 ${players[0] ? players[0].name : 'INGEN'}</div>
            <button class="btn btn-primary" onclick="renderAdminContent()">Tilbage til Dashboard</button>
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', () => { /* Admin logic */ });
