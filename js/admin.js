/**
 * admin.js
 * Håndterer administration, redigering og sikkerhed (Undo/Backup).
 */

import { saveDbToCloud, getDbFromCloud } from './firebase-service.js';

const APP_VERSION = "v5.3.1";
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
    renderAdminContent(); // Update UI
};

window.setLiveVolume = (val) => {
    liveAudio.volume = val;
    liveAudio.music.volume = val;
    liveAudio.correct.volume = val;
    liveAudio.incorrect.volume = val;
};

const UPDATE_LOG = [
    {
        version: "v5.3.1",
        date: "2026-04-24",
        title: "🛡️ Dashboard Gendannelse & Live-Integration",
        desc: "Genskabt alle redigerings- og administrationsværktøjer, der ved en fejl blev fjernet. Nu er Live-quiz og Dashboard fuldt integreret."
    },
    {
        version: "v5.3.0",
        date: "2026-04-24",
        title: "🚀 Fuld Live Synkronisering",
        desc: "Implementeret Kahoot-style scoring, realtids-leaderboard og automatisk spørgsmålsskift for elever."
    },
    {
        version: "v5.2.0",
        date: "2026-04-23",
        title: "👤 Profil & Ikon-vælger",
        desc: "Elever kan nu vælge navn og tømrer-ikon før de deltager i Live Quiz."
    }
];

let localDbCopy = null;
let historyStack = [];
let redoStack = [];
let activeQuizIdx = null; 
let activeQuestionsIdx = null; 
let adminSearchTerm = ""; 

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
            <p>Henter nyeste data fra skyen...</p>
        </div>
    `;
    document.getElementById('admin-modal').style.display = 'flex';
    
    const titleEl = document.querySelector('#admin-modal h2');
    if (titleEl) titleEl.textContent = `Tømrer Quiz - Panel (Underviser) - ${APP_VERSION}`;
    
    try {
        const cloudDb = await getDbFromCloud();
        if (cloudDb) {
            localDbCopy = cloudDb;
        } else {
            alert("KRITISK FEJL: Kunne ikke hente data fra skyen.");
            return; 
        }
    } catch (error) {
        alert("KRITISK FEJL: Forbindelsen til skyen fejlede.");
        return; 
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
    const scrollPos = container.scrollTop;
    
    const term = adminSearchTerm.toLowerCase();
    const filteredQuizzes = localDbCopy.quizzes.filter(q => {
        const cat = localDbCopy.categories.find(c => c.id === q.categoryId);
        const catTitle = cat ? cat.title.toLowerCase() : "";
        return q.title.toLowerCase().includes(term) || catTitle.includes(term);
    });
    
    let html = `
        <div class="admin-tabs" style="display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 1rem;">
            <div>
                <button class="tab-btn active" id="btn-tab-edit" onclick="switchTab('edit')">Rediger Indhold</button>
                <button class="tab-btn" id="btn-tab-ai" onclick="switchTab('ai')">✨ Skab med AI</button>
                <button class="tab-btn" id="btn-tab-log" onclick="switchTab('log')">📜 Logbog</button>
            </div>
            <button class="btn btn-primary" onclick="saveAdminChanges()">☁️ Gem i skyen</button>
        </div>

        <div id="tab-edit" class="tab-content active">
            <div class="admin-toolbar" style="gap: 1rem; padding: 1rem; background: rgba(255,255,255,0.02); margin-bottom: 1rem; border-radius: 8px;">
                <input type="text" placeholder="🔍 Søg i quizzer..." value="${adminSearchTerm}" oninput="window.setAdminSearch(this.value)" style="flex: 1; min-width: 200px;">
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-secondary btn-small" onclick="undo()" ${historyStack.length === 0 ? 'disabled' : ''}>↩️ Fortryd</button>
                    <button class="btn btn-secondary btn-small" onclick="redo()" ${redoStack.length === 0 ? 'disabled' : ''}>↪️ Gendan</button>
                    <button class="btn btn-secondary btn-small" onclick="downloadBackup()">💾 Backup</button>
                    <button class="btn btn-accent btn-small" onclick="cleanupSessions()">🧹 Nulstil Live</button>
                </div>
            </div>
            
            <div class="admin-section">
                <h3>Kategorier (${localDbCopy.categories.length})</h3>
                <div class="admin-items">
                    ${localDbCopy.categories.map((cat, idx) => `
                        <div class="admin-item" style="display: flex; align-items: center; gap: 0.5rem; background: rgba(255,255,255,0.03); padding: 0.5rem; border-radius: 6px;">
                            <span class="status-badge ${cat.isHidden ? 'status-hidden' : 'status-visible'}">${cat.isHidden ? '🚫' : '👁️'}</span>
                            <input type="text" value="${cat.title}" onchange="updateCategory(${idx}, 'title', this.value)" style="flex: 1;">
                            <button class="btn-icon" onclick="updateCategory(${idx}, 'isHidden', ${!cat.isHidden})">${cat.isHidden ? '👁️' : '🚫'}</button>
                            <button class="btn-icon" onclick="removeCategory(${idx})">🗑️</button>
                        </div>
                    `).join('')}
                    <button class="btn btn-secondary btn-small" style="margin-top: 0.5rem;" onclick="addCategory()">+ Tilføj Kategori</button>
                </div>
            </div>

            <div class="admin-section">
                <h3>Quizzer (${filteredQuizzes.length})</h3>
                <div class="admin-items">
                    ${filteredQuizzes.map((quiz) => {
                        const idx = localDbCopy.quizzes.findIndex(q => q.id === quiz.id);
                        return `
                        <div class="admin-item-expanded" style="margin-bottom: 0.5rem; background: rgba(255,255,255,0.02); border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
                            <div class="admin-item-header" style="display: flex; justify-content: space-between; padding: 1rem; align-items: center;">
                                <div>
                                    <span class="admin-cat-tag">${getCategoryTitle(quiz.categoryId)}</span>
                                    <strong style="margin-left: 0.5rem;">${quiz.title}</strong>
                                </div>
                                <div style="display: flex; gap: 0.5rem;">
                                    <button class="btn btn-accent btn-small" onclick="initiateLiveSession(${idx})">🚀 Start Live</button>
                                    <button class="btn btn-secondary btn-small" onclick="toggleEditQuiz(${idx})">Rediger</button>
                                    <button class="btn-icon" onclick="updateQuiz(${idx}, 'isHidden', ${!quiz.isHidden})">${quiz.isHidden ? '👁️' : '🚫'}</button>
                                    <button class="btn-icon" onclick="removeQuiz(${idx})">🗑️</button>
                                </div>
                            </div>
                            <div id="edit-quiz-${idx}" style="display: none; padding: 1rem; border-top: 1px solid rgba(255,255,255,0.05);">
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                                    <input type="text" value="${quiz.title}" onchange="updateQuiz(${idx}, 'title', this.value)" placeholder="Quiz Titel">
                                    <select onchange="updateQuiz(${idx}, 'categoryId', this.value)">
                                        ${localDbCopy.categories.map(c => `<option value="${c.id}" ${c.id === quiz.categoryId ? 'selected' : ''}>${c.title}</option>`).join('')}
                                    </select>
                                </div>
                                <textarea onchange="updateQuiz(${idx}, 'description', this.value)" placeholder="Beskrivelse">${quiz.description}</textarea>
                                
                                <div style="margin-top: 1rem;">
                                    <h4>Spørgsmål (${quiz.questions.length})</h4>
                                    <div class="admin-questions" style="margin-top: 0.5rem;">
                                        ${quiz.questions.map((q, qIdx) => `
                                            <div class="admin-question-edit" style="background: rgba(255,255,255,0.03); padding: 1rem; border-radius: 8px; margin-bottom: 0.5rem;">
                                                <input type="text" value="${q.question}" onchange="updateQuestion(${idx}, ${qIdx}, 'question', this.value)" placeholder="Spørgsmål">
                                                <div class="admin-options-edit" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-top: 0.5rem;">
                                                    ${q.options.map((opt, oIdx) => `
                                                        <div style="display: flex; gap: 0.5rem; align-items: center;">
                                                            <input type="radio" name="q-${idx}-${qIdx}" ${q.correctIndex === oIdx ? 'checked' : ''} onchange="updateQuestion(${idx}, ${qIdx}, 'correctIndex', ${oIdx})">
                                                            <input type="text" value="${opt}" onchange="updateOption(${idx}, ${qIdx}, ${oIdx}, this.value)">
                                                        </div>
                                                    `).join('')}
                                                </div>
                                            </div>
                                        `).join('')}
                                        <button class="btn btn-secondary btn-small" onclick="addQuestion(${idx})">+ Tilføj Spørgsmål</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;}).join('')}
                    <button class="btn btn-primary" onclick="addQuiz()" style="margin-top: 1rem;">+ Opret Ny Quiz</button>
                </div>
            </div>
        </div>

        <div id="tab-log" class="tab-content">
            <div class="logbog-container" style="padding: 1rem;">
                ${UPDATE_LOG.map(log => `
                    <div class="log-entry" style="margin-bottom: 1.5rem; padding: 1rem; background: rgba(255,255,255,0.03); border-radius: 8px;">
                        <div style="display: flex; justify-content: space-between; opacity: 0.6; font-size: 0.8rem;">
                            <span>${log.version}</span>
                            <span>${log.date}</span>
                        </div>
                        <h4 style="margin: 0.5rem 0;">${log.title}</h4>
                        <p style="opacity: 0.8; font-size: 0.9rem;">${log.desc}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    container.innerHTML = html;
    container.scrollTop = scrollPos;
}

window.setAdminSearch = (val) => { adminSearchTerm = val; renderAdminContent(); };
window.switchTab = (tabId) => {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(`tab-${tabId}`).classList.add('active');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    renderAdminContent();
};

function getCategoryTitle(id) {
    const cat = localDbCopy.categories.find(c => c.id === id);
    return cat ? cat.title : id;
}

window.updateCategory = (idx, key, val) => { pushToHistory(); localDbCopy.categories[idx][key] = val; renderAdminContent(); };
window.removeCategory = (idx) => { pushToHistory(); localDbCopy.categories.splice(idx, 1); renderAdminContent(); };
window.addCategory = () => { pushToHistory(); localDbCopy.categories.push({ id: 'cat-'+Date.now(), title: 'Ny Kategori', isHidden: false }); renderAdminContent(); };
window.updateQuiz = (idx, key, val) => { pushToHistory(); localDbCopy.quizzes[idx][key] = val; renderAdminContent(); };
window.removeQuiz = (idx) => { pushToHistory(); localDbCopy.quizzes.splice(idx, 1); renderAdminContent(); };
window.addQuiz = () => { pushToHistory(); localDbCopy.quizzes.push({ id: 'q-'+Date.now(), title: 'Ny Quiz', description: '', categoryId: localDbCopy.categories[0].id, questions: [], isHidden: false }); renderAdminContent(); };
window.updateQuestion = (idx, qIdx, key, val) => { pushToHistory(); localDbCopy.quizzes[idx].questions[qIdx][key] = val; renderAdminContent(); };
window.updateOption = (idx, qIdx, oIdx, val) => { pushToHistory(); localDbCopy.quizzes[idx].questions[qIdx].options[oIdx] = val; renderAdminContent(); };
window.addQuestion = (idx) => { pushToHistory(); localDbCopy.quizzes[idx].questions.push({ question: '?', options: ['Svar 1', 'Svar 2', 'Svar 3', 'Svar 4'], correctIndex: 0, rationale: '' }); renderAdminContent(); };
window.toggleEditQuiz = (idx) => {
    const el = document.getElementById(`edit-quiz-${idx}`);
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
};

window.saveAdminChanges = async () => {
    const success = await saveDbToCloud(localDbCopy);
    if (success) {
        alert("Gemt i skyen!");
        location.reload();
    }
};

window.downloadBackup = () => {
    const blob = new Blob([JSON.stringify(localDbCopy, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `quiz_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
};

// --- LIVE SESSION LOGIK (v5.3.1 INTEGRERET) ---
let activeSessionUnsubscribe = null;
let currentLivePin = null;

window.cleanupSessions = async () => {
    if (!confirm("Slet alle aktive live-sessioner?")) return;
    try {
        await window.set(window.ref(window.db, 'live_sessions'), null);
        alert("Nulstillet!");
    } catch (e) { console.error(e); }
};

window.initiateLiveSession = async (quizIdx) => {
    try {
        const pin = Math.floor(100000 + Math.random() * 900000).toString();
        currentLivePin = pin;
        const quiz = localDbCopy.quizzes[quizIdx];

        const sessionData = {
            pin: pin,
            quizId: quiz.id,
            quizTitle: quiz.title,
            status: 'lobby',
            currentQuestionIndex: 0,
            showResults: false,
            createdAt: Date.now(),
            players: {}
        };

        await window.set(window.ref(window.db, `live_sessions/${pin}`), sessionData);
        renderLobbyUI(pin, quiz.title);

        if (activeSessionUnsubscribe) activeSessionUnsubscribe();
        activeSessionUnsubscribe = window.onValue(window.ref(window.db, `live_sessions/${pin}`), (snap) => {
            const data = snap.val();
            if (!data) return;
            if (data.status === 'lobby') updateLobbyPlayerList(data);
            else if (data.status === 'playing') renderTeacherGameView(data);
            else if (data.status === 'finished') renderPodium(data);
        });
    } catch (e) { console.error(e); }
};

function renderLobbyUI(pin, title) {
    const container = document.getElementById('admin-content-inner');
    container.innerHTML = `
        <div class="live-lobby-container fade-in" style="padding: 2rem; text-align: center;">
            <span class="live-badge">TØMRER-LIVE LOBBY</span>
            <h1 style="font-size: 2.5rem; margin: 1rem 0;">${title}</h1>
            <div class="pin-display-compact" style="background: rgba(255,255,255,0.05); padding: 2rem; border-radius: 20px; display: inline-block; margin-bottom: 2rem; border: 2px solid var(--accent);">
                <p style="opacity: 0.7; margin: 0;">PIN KODE:</p>
                <div style="font-size: 4rem; font-weight: 900; color: var(--accent); letter-spacing: 10px;">${pin}</div>
            </div>
            <div style="margin-bottom: 2rem; font-size: 1.5rem;">👥 <span id="player-count-val">0</span> spillere klar</div>
            <div id="player-list" class="player-grid" style="display: flex; flex-wrap: wrap; gap: 1rem; justify-content: center; min-height: 100px; margin-bottom: 3rem;"></div>
            <div class="lobby-actions-fixed" style="position: sticky; bottom: 0; background: #2a2a2a; padding: 1.5rem; border-top: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: center; gap: 1rem;">
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
        list.innerHTML = players.map(p => `
            <div class="player-bubble fade-in">
                <span>${p.icon || '👤'} ${p.name}</span>
            </div>
        `).join('');
    } else {
        if (startBtn) startBtn.disabled = true;
        list.innerHTML = `<p style="opacity: 0.5;">Venter på at eleverne taster PIN-koden...</p>`;
    }
}

window.startLiveGame = async (pin) => {
    try {
        await window.update(window.ref(window.db, `live_sessions/${pin}`), {
            status: 'playing',
            currentQuestionIndex: 0,
            questionStartTime: Date.now()
        });
    } catch (e) { console.error(e); }
};

window.nextLiveQuestion = async (pin) => {
    try {
        const snap = await window.get(window.ref(window.db, `live_sessions/${pin}`));
        const session = snap.val();
        await window.update(window.ref(window.db, `live_sessions/${pin}`), {
            currentQuestionIndex: (session.currentQuestionIndex || 0) + 1,
            questionStartTime: Date.now(),
            showResults: false
        });
    } catch (e) { console.error(e); }
};

window.showQuestionResults = async (pin) => {
    try {
        await window.set(window.ref(window.db, `live_sessions/${pin}/showResults`), true);
    } catch (e) { console.error(e); }
};

window.stopLiveSession = async () => {
    if (currentLivePin) {
        await window.set(window.ref(window.db, `live_sessions/${currentLivePin}/status`), 'finished');
    }
    renderAdminContent();
};

function renderTeacherGameView(session) {
    const container = document.getElementById('admin-content-inner');
    const quiz = localDbCopy.quizzes.find(q => q.id === session.quizId);
    const qIdx = session.currentQuestionIndex || 0;
    const question = quiz.questions[qIdx];
    const players = session.players ? Object.values(session.players) : [];
    const answerCount = players.filter(p => p && p.answer !== undefined).length;

    if (session.showResults) {
        renderLeaderboard(session, quiz, qIdx);
        return;
    }

    container.innerHTML = `
        <div class="teacher-game-dashboard fade-in" style="padding: 2rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                <span class="live-badge">SPØRGSMÅL ${qIdx + 1}/${quiz.questions.length}</span>
                <h2 style="margin: 0; opacity: 0.7;">${quiz.title}</h2>
            </div>
            <h1 style="font-size: 2.5rem; text-align: center; margin-bottom: 3rem;">${question.question}</h1>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 3rem;">
                ${question.options.map((opt, i) => `
                    <div style="background: ${['#e21b3c', '#1368ce', '#d89e00', '#26890c'][i]}; color: white; padding: 2rem; border-radius: 15px; font-size: 1.5rem; font-weight: bold; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
                        ${opt}
                    </div>
                `).join('')}
            </div>

            <div style="background: rgba(255,255,255,0.05); padding: 2rem; border-radius: 15px; text-align: center; margin-bottom: 3rem;">
                <div style="font-size: 4rem; font-weight: 900; color: var(--accent);">${answerCount}</div>
                <p style="opacity: 0.7; margin: 0; font-weight: bold;">SVAR MODTAGET</p>
            </div>

            <div class="lobby-actions-fixed" style="display: flex; justify-content: center; gap: 1rem;">
                <button class="btn btn-secondary" onclick="stopLiveSession()">Afbryd Session</button>
                <button class="btn btn-accent btn-large" onclick="showQuestionResults('${session.pin}')">VIS RESULTATER 📊</button>
            </div>
        </div>
    `;
}

function renderLeaderboard(session, quiz, qIdx) {
    const container = document.getElementById('admin-content-inner');
    const players = Object.values(session.players || {}).sort((a,b) => b.points - a.points);
    const correctIdx = quiz.questions[qIdx].correctIndex;
    const colors = ['#e21b3c', '#1368ce', '#d89e00', '#26890c'];

    container.innerHTML = `
        <div class="teacher-game-dashboard fade-in" style="padding: 2rem;">
            <h1>RESULTAT - SPØRGSMÅL ${qIdx + 1}</h1>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; margin: 3rem 0;">
                <div style="background: rgba(255,255,255,0.03); padding: 2rem; border-radius: 15px;">
                    <h3 style="margin-top: 0;">Svarfordeling</h3>
                    ${quiz.questions[qIdx].options.map((opt, i) => {
                        const count = Object.values(session.players || {}).filter(p => p.answer === i).length;
                        return `
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding: 1rem; background: rgba(255,255,255,0.05); border-radius: 10px; border-left: 10px solid ${colors[i]}">
                                <span style="font-weight: bold;">${i === correctIdx ? '✅' : '❌'} ${opt}</span>
                                <span style="font-size: 1.5rem; font-weight: 900;">${count}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div style="background: rgba(255,255,255,0.03); padding: 2rem; border-radius: 15px;">
                    <h3 style="margin-top: 0;">Leaderboard Top 5</h3>
                    ${players.slice(0, 5).map((p, i) => `
                        <div style="display: flex; justify-content: space-between; padding: 0.8rem; border-bottom: 1px solid rgba(255,255,255,0.1);">
                            <span>${i+1}. ${p.icon || '👤'} ${p.name}</span>
                            <span style="font-weight: bold; color: var(--accent);">${p.points || 0} p</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="lobby-actions-fixed" style="display: flex; justify-content: center; gap: 1rem;">
                <button class="btn btn-secondary" onclick="stopLiveSession()">Afbryd Session</button>
                ${qIdx < quiz.questions.length - 1 
                    ? `<button class="btn btn-primary btn-large" onclick="nextLiveQuestion('${session.pin}')">NÆSTE SPØRGSMÅL ➡️</button>`
                    : `<button class="btn btn-success btn-large" onclick="stopLiveSession()">AFSLUT QUIZ 🏁</button>`
                }
            </div>
        </div>
    `;
}

function renderPodium(session) {
    const container = document.getElementById('admin-content-inner');
    const players = Object.values(session.players || {}).sort((a,b) => b.points - a.points);
    
    container.innerHTML = `
        <div class="podium-screen fade-in" style="text-align:center; padding: 4rem 2rem;">
            <h1 style="font-size: 4rem; margin-bottom: 2rem;">🏆 PODIET 🏆</h1>
            <div style="font-size: 2rem; margin-bottom: 4rem; background: rgba(255,215,0,0.1); padding: 2rem; border-radius: 20px; border: 2px solid #ffd700; display: inline-block;">
                <div style="font-size: 5rem; margin-bottom: 1rem;">👑</div>
                <div style="font-weight: 900; font-size: 3rem;">${players[0] ? players[0].name : 'INGEN VINDER'}</div>
                <div style="color: #ffd700;">${players[0] ? (players[0].points || 0) : 0} POINT</div>
            </div>
            <div style="margin-top: 2rem;">
                <button class="btn btn-primary btn-large" onclick="renderAdminContent()">Gå til Dashboard</button>
            </div>
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', initAdmin);
