/**
 * skills.js - v5.7.0 Classroom Edition (Etape 3)
 * Håndterer elevens side af Live Quizzen (Deltagelse og svar).
 */
import { getDbFromCloud } from './firebase-service.js';

const APP_VERSION = "v5.7.0";
let myPlayerId = localStorage.getItem('kahoot_player_id') || 'p' + Math.random().toString(36).substr(2, 9);
localStorage.setItem('kahoot_player_id', myPlayerId);

// Global Rolle-check (v5.7.0)
window.isUserAdmin = () => {
    return sessionStorage.getItem('quizRole') === 'teacher';
};

async function loadDatabase() {
    try {
        const cloudDb = await getDbFromCloud();
        if (cloudDb) return cloudDb;
        const resp = await fetch('js/database.js');
        const text = await resp.text();
        return JSON.parse(text.replace('const quiz_database = ', '').replace(';', ''));
    } catch (e) { return null; }
}

window.showLiveJoinModal = () => {
    const pin = prompt("Indtast PIN-kode fra læreren:");
    if (pin) joinLiveSession(pin);
};

async function joinLiveSession(pin) {
    const sessionRef = window.ref(window.db, `live_sessions/${pin}`);
    const snap = await window.get(sessionRef);
    
    if (!snap.exists()) {
        alert("Ugyldig PIN-kode!");
        return;
    }

    const name = prompt("Hvad er dit navn?") || "Elev " + Math.floor(Math.random()*100);
    const icons = ['👷', '🔨', '📏', '📐', '🪵', '🪚', '🪜'];
    const icon = icons[Math.floor(Math.random() * icons.length)];

    const playerObj = { id: myPlayerId, name, icon, points: 0, joinedAt: Date.now() };
    await window.set(window.ref(window.db, `live_sessions/${pin}/players/${myPlayerId}`), playerObj);

    // Gem lokalt for at huske sessionen
    localStorage.setItem('active_live_pin', pin);
    initStudentLiveListener(pin);
}

function initStudentLiveListener(pin) {
    const sessionRef = window.ref(window.db, `live_sessions/${pin}`);
    window.onValue(sessionRef, (snap) => {
        const data = snap.val();
        if (!data) return;

        if (data.status === 'lobby') renderStudentLobbyView(data);
        else if (data.status === 'playing') renderStudentGameView(data);
        else if (data.status === 'showing_results') renderStudentResultView(data);
        else if (data.status === 'finished') renderStudentFinishedView(data);
    });
}

function renderStudentLobbyView(session) {
    const main = document.querySelector('main');
    main.innerHTML = `
        <div class="student-live-container fade-in">
            <div class="lobby-card">
                <div class="loader">⌛</div>
                <h2>Du er med!</h2>
                <p>Venter på at læreren starter quizzen...</p>
                <div class="pin-badge">PIN: ${session.pin}</div>
                <div style="margin-top: 1rem; opacity: 0.7;">${session.quizTitle}</div>
            </div>
        </div>
    `;
}

function renderStudentGameView(session) {
    const main = document.querySelector('main');
    const db = window.currentDb; // Antager db er indlæst
    
    // Find quiz data
    const quiz = window.fullQuizData || { questions: [] }; 
    // I en rigtig app ville vi hente quizzen baseret på session.quizId
    // For nu bruger vi session data eller global data
    
    const qIdx = session.currentQuestionIndex || 0;
    const player = session.players[myPlayerId];
    
    // Hvis spilleren allerede har svaret
    if (player && player.answer !== undefined && player.answer !== null) {
        main.innerHTML = `
            <div class="student-live-container">
                <div class="lobby-card">
                    <div class="loader">✅</div>
                    <h2>Svar modtaget!</h2>
                    <p>Venter på de andre...</p>
                </div>
            </div>
        `;
        return;
    }

    // Dynamiske knapper (v5.7.0 Etape 3)
    // Da vi ikke har de præcise options i session-objektet (for at spare data), 
    // antager vi at læreren har sendt spørgsmålet eller vi ved hvor mange der er.
    // I denne arkitektur bruger vi 4 knapper som standard, men vi kan optimere:
    const labels = ['A', 'B', 'C', 'D'];
    const colors = ['#e21b3c', '#1368ce', '#d89e00', '#26890c'];

    main.innerHTML = `
        <div class="student-game-container fade-in">
            <div class="game-header-compact">
                <span>Spørgsmål ${qIdx + 1}</span>
                <div class="student-points-badge">${player.points || 0} p</div>
            </div>
            <div class="student-answer-grid">
                ${colors.map((color, i) => `
                    <button class="answer-btn-mobile" onclick="submitAnswer(${i})" style="background: ${color};">
                        <span class="btn-label">${labels[i]}</span>
                    </button>
                `).join('')}
            </div>
        </div>
    `;
}

window.submitAnswer = async (answerIdx) => {
    const pin = localStorage.getItem('active_live_pin');
    const playerRef = window.ref(window.db, `live_sessions/${pin}/players/${myPlayerId}`);
    
    // Hent session for at beregne point
    const snap = await window.get(window.ref(window.db, `live_sessions/${pin}`));
    const session = snap.val();
    
    // Vi henter quizzen fra vores lokale database-kopi i skills.js eller quiz.js
    // For at gøre det simpelt i denne demo, antager vi at vi har adgang til quizId
    const cloudDb = await getDbFromCloud();
    const quiz = cloudDb.quizzes.find(q => q.id === session.quizId);
    const question = quiz.questions[session.currentQuestionIndex];
    
    let pointsToAdd = 0;
    if (answerIdx === question.correctIndex) {
        // Kahoot-agtig pointberegning: Max 1000, falder med tid
        const timeSpent = (Date.now() - session.questionStartTime) / 1000;
        pointsToAdd = Math.max(500, Math.floor(1000 - (timeSpent * 50)));
    }

    const currentPoints = (session.players[myPlayerId].points || 0);
    await window.update(playerRef, { 
        answer: answerIdx, 
        points: currentPoints + pointsToAdd,
        lastResult: answerIdx === question.correctIndex ? 'correct' : 'wrong'
    });
};

function renderStudentResultView(session) {
    const main = document.querySelector('main');
    const player = session.players[myPlayerId];
    const isCorrect = player.lastResult === 'correct';
    
    main.innerHTML = `
        <div class="student-result-screen fade-in ${isCorrect ? 'result-success' : 'result-error'}">
            <div class="result-icon">${isCorrect ? '✅' : '❌'}</div>
            <h1>${isCorrect ? 'RIGTIGT!' : 'FORKERT!'}</h1>
            <div class="result-points-card">
                <p>Din score:</p>
                <div class="total-points">${player.points || 0}</div>
            </div>
            <p style="margin-top: 2rem; opacity: 0.8;">Kig op på tavlen!</p>
        </div>
    `;
}

function renderStudentFinishedView(session) {
    const main = document.querySelector('main');
    const player = session.players[myPlayerId];
    const players = Object.values(session.players).sort((a,b) => b.points - a.points);
    const rank = players.findIndex(p => p.id === myPlayerId) + 1;

    main.innerHTML = `
        <div class="student-live-container fade-in">
            <div class="lobby-card">
                <div style="font-size: 3rem;">🏆</div>
                <h2>Quizzen er slut!</h2>
                <div class="rank-display">Du blev nr. ${rank}</div>
                <div class="total-points" style="font-size: 2rem; color: var(--accent);">${player.points || 0} p</div>
                <button class="btn btn-primary" style="margin-top: 2rem;" onclick="location.reload()">Tilbage til oversigten</button>
            </div>
        </div>
    `;
}

// Auto-join hvis man genindlæser siden
document.addEventListener('DOMContentLoaded', () => {
    const savedPin = localStorage.getItem('active_live_pin');
    if (savedPin) {
        // Tjek om sessionen stadig findes/er aktiv
        const sessionRef = window.ref(window.db, `live_sessions/${savedPin}`);
        window.get(sessionRef).then(snap => {
            if (snap.exists() && snap.val().status !== 'finished') {
                initStudentLiveListener(savedPin);
            } else {
                localStorage.removeItem('active_live_pin');
            }
        });
    }
    
    // Skjul live-knappen hvis man er admin (v5.7.0 Sikkerheds-check)
    const btn = document.getElementById('live-join-btn');
    if (btn) {
        if (window.isUserAdmin()) {
            btn.style.setProperty('display', 'none', 'important');
        } else {
            // Vis kun knappen hvis der er en aktiv session (kunne implementeres med en lytter på alle sessioner)
            btn.style.display = 'block'; 
        }
    }
});
