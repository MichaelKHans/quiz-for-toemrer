/**
 * admin.js
 * Håndterer administration, redigering og sikkerhed (Undo/Backup).
 */

import { saveDbToCloud, getDbFromCloud } from './firebase-service.js';

const APP_VERSION = "v5.3.0";
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
    renderAdminContent();
}

window.closeAdmin = function() {
    document.getElementById('admin-modal').style.display = 'none';
};

function renderAdminContent() {
    const container = document.getElementById('admin-content-inner');
    if (!container) return;
    
    let html = `
        <div class="admin-tabs" style="display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 1rem;">
            <div>
                <button class="tab-btn active">Rediger Indhold</button>
                <button class="btn btn-accent btn-small" onclick="cleanupSessions()">🧹 Nulstil alle Live-sessioner</button>
            </div>
            <button class="btn btn-primary" onclick="saveAdminChanges()">☁️ Gem i skyen</button>
        </div>

        <div class="admin-section">
            <h3>Quizzer (${localDbCopy.quizzes.length})</h3>
            <div class="admin-items">
                ${localDbCopy.quizzes.map((quiz, idx) => `
                    <div class="admin-item" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: rgba(255,255,255,0.03); margin-bottom: 0.5rem; border-radius: 8px;">
                        <strong>${quiz.title}</strong>
                        <button class="btn btn-accent" onclick="initiateLiveSession(${idx})">🚀 Start Live</button>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    container.innerHTML = html;
}

window.saveAdminChanges = async () => {
    const success = await saveDbToCloud(localDbCopy);
    if (success) {
        alert("Gemt!");
        location.reload();
    }
};

// --- LIVE SESSION LOGIK ---
let activeSessionUnsubscribe = null;
let currentLivePin = null;

window.cleanupSessions = async () => {
    if (!confirm("Nulstil alle sessioner?")) return;
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
        <div class="live-lobby-container fade-in">
            <div class="lobby-header">
                <h1>${title}</h1>
                <div class="pin-display-compact">
                    <p>PIN: <span style="font-size: 2rem; color: var(--accent);">${pin}</span></p>
                </div>
                <div class="player-status">👥 <span id="player-count-val">0</span> spillere</div>
            </div>
            <div id="player-list" class="player-grid"></div>
            <div class="lobby-actions-fixed">
                <button class="btn btn-secondary" onclick="stopLiveSession()">Afbryd</button>
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
            <div class="player-bubble">
                <span>${p.icon || '👤'} ${p.name}</span>
            </div>
        `).join('');
    } else {
        if (startBtn) startBtn.disabled = true;
        list.innerHTML = `<p>Venter på spillere...</p>`;
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
    location.reload();
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
        <div class="teacher-game-dashboard fade-in">
            <h2>SPØRGSMÅL ${qIdx + 1}/${quiz.questions.length}</h2>
            <h1>${question.question}</h1>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 2rem 0;">
                ${question.options.map((opt, i) => `
                    <div style="background: ${['#e21b3c', '#1368ce', '#d89e00', '#26890c'][i]}; color: white; padding: 1.5rem; border-radius: 12px; font-weight: bold;">
                        ${opt}
                    </div>
                `).join('')}
            </div>
            <div style="text-align: center; font-size: 2rem; margin-bottom: 2rem;">SVAR: ${answerCount} / ${players.length}</div>
            <div class="lobby-actions-fixed">
                <button class="btn btn-accent btn-large" onclick="showQuestionResults('${session.pin}')">VIS RESULTATER 📊</button>
            </div>
        </div>
    `;
}

function renderLeaderboard(session, quiz, qIdx) {
    const container = document.getElementById('admin-content-inner');
    const players = Object.values(session.players || {}).sort((a,b) => b.points - a.points);
    const correctIdx = quiz.questions[qIdx].correctIndex;

    container.innerHTML = `
        <div class="teacher-game-dashboard fade-in">
            <h1>RESULTAT - SPØRGSMÅL ${qIdx + 1}</h1>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                <div>
                    <h3>Svarfordeling</h3>
                    ${quiz.questions[qIdx].options.map((opt, i) => `
                        <div style="margin-bottom: 0.5rem; display: flex; justify-content: space-between;">
                            <span>${i === correctIdx ? '✅' : '❌'} ${opt}</span>
                            <span>${Object.values(session.players || {}).filter(p => p.answer === i).length}</span>
                        </div>
                    `).join('')}
                </div>
                <div>
                    <h3>Leaderboard</h3>
                    ${players.slice(0, 5).map((p, i) => `
                        <div style="display: flex; justify-content: space-between;">
                            <span>${i+1}. ${p.name}</span>
                            <span>${p.points || 0} p</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="lobby-actions-fixed">
                ${qIdx < quiz.questions.length - 1 
                    ? `<button class="btn btn-primary" onclick="nextLiveQuestion('${session.pin}')">NÆSTE SPØRGSMÅL ➡️</button>`
                    : `<button class="btn btn-success" onclick="stopLiveSession()">AFSLUT QUIZ 🏁</button>`
                }
            </div>
        </div>
    `;
}

function renderPodium(session) {
    const container = document.getElementById('admin-content-inner');
    const players = Object.values(session.players || {}).sort((a,b) => b.points - a.points);
    container.innerHTML = `<h1>🏆 PODIET 🏆</h1><h2>1. ${players[0] ? players[0].name : '-'}</h2><button onclick="location.reload()">Færdig</button>`;
}

document.addEventListener('DOMContentLoaded', initAdmin);
