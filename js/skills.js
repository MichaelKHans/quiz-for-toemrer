/**
 * skills.js - v5.7.1 Dashbaord Restore & Live Quiz
 * Håndterer forsiden (Dashboard) og elevens side af Live Quizzen.
 */
import { getDbFromCloud } from './firebase-service.js';

const APP_VERSION = "v5.7.1";
let myPlayerId = localStorage.getItem('kahoot_player_id') || 'p' + Math.random().toString(36).substr(2, 9);
localStorage.setItem('kahoot_player_id', myPlayerId);

let currentQuizzes = [];
let currentCategories = [];
let activeCategory = 'all';

// Global Rolle-check (v5.7.1)
window.isUserAdmin = () => {
    return sessionStorage.getItem('quizRole') === 'teacher' || sessionStorage.getItem('quiz_admin_authed') === 'true';
};

async function init() {
    console.log("Initializing Tømrer Quiz Dashboard...");
    const db = await loadDatabase();
    if (db) {
        currentQuizzes = db.quizzes;
        currentCategories = db.categories;
        window.currentDb = db; // Tilgængelig for andre scripts
        renderCategorySelector();
        renderQuizGrid();
        loadProgress();
    }
}

async function loadDatabase() {
    try {
        const cloudDb = await getDbFromCloud();
        if (cloudDb) return cloudDb;
        // Fallback til lokal database.js
        return window.QUIZ_DATABASE;
    } catch (e) { 
        console.error("Database load error:", e);
        return window.QUIZ_DATABASE; 
    }
}

function renderCategorySelector() {
    const selector = document.getElementById('category-selector');
    if (!selector) return;
    
    const categories = [
        { id: 'all', title: 'Alle Quizzer' },
        ...currentCategories.filter(c => !c.isHidden)
    ];

    selector.innerHTML = categories.map(cat => `
        <button class="category-btn ${activeCategory === cat.id ? 'active' : ''}" 
                onclick="window.filterByCategory('${cat.id}')">
            ${cat.title}
        </button>
    `).join('');
}

window.filterByCategory = (catId) => {
    activeCategory = catId;
    renderCategorySelector();
    renderQuizGrid();
};

function renderQuizGrid() {
    const grid = document.getElementById('quiz-grid');
    if (!grid) return;

    const filtered = currentQuizzes.filter(q => {
        if (q.isHidden) return false;
        if (activeCategory === 'all') return true;
        return q.categoryId === activeCategory;
    });

    grid.innerHTML = filtered.map(quiz => {
        const stats = getQuizStats(quiz.id);
        const isCompleted = stats.correct === quiz.questions.length && quiz.questions.length > 0;
        
        return `
            <div class="quiz-card fade-in ${isCompleted ? 'completed' : ''}" onclick="window.startQuiz('${quiz.id}')">
                ${quiz.imageUrl ? `
                    <div class="quiz-card-image">
                        <img src="${quiz.imageUrl}" alt="${quiz.title}" loading="lazy">
                    </div>
                ` : ''}
                <div class="quiz-card-header">
                    <span class="category-tag">${getCategoryTitle(quiz.categoryId)}</span>
                    ${isCompleted ? '<span class="status-tag">Gennemført ✅</span>' : ''}
                </div>
                <h3>${quiz.title}</h3>
                <p>${quiz.description || 'Ingen beskrivelse'}</p>
                <div class="quiz-card-footer">
                    <span class="q-count">${quiz.questions.length} Spørgsmål</span>
                    <div class="mini-progress">
                        <div class="mini-bar" style="width: ${(stats.correct / quiz.questions.length) * 100}%"></div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function getCategoryTitle(id) {
    const cat = currentCategories.find(c => c.id === id);
    return cat ? cat.title : "Diverse";
}

function getQuizStats(quizId) {
    const results = JSON.parse(localStorage.getItem('quiz_results') || '{}');
    return results[quizId] || { correct: 0, total: 0 };
}

function loadProgress() {
    const label = document.getElementById('progress-label');
    const bar = document.getElementById('progress-bar');
    if (!label || !bar) return;

    const results = JSON.parse(localStorage.getItem('quiz_results') || '{}');
    let totalCorrect = 0;
    let totalQuestions = 0;

    currentQuizzes.forEach(q => {
        if (!q.isHidden) {
            totalQuestions += q.questions.length;
            if (results[q.id]) {
                totalCorrect += results[q.id].correct;
            }
        }
    });

    const percent = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    label.textContent = `Din samlede fremgang: ${percent}% (${totalCorrect}/${totalQuestions})`;
    bar.style.width = percent + '%';
}

window.startQuiz = (quizId) => {
    window.location.href = `quiz.html?id=${quizId}`;
};

// --- LIVE QUIZ LOGIK (Elevens side) ---

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

async function renderStudentGameView(session) {
    const main = document.querySelector('main');
    const player = session.players[myPlayerId];
    
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

    // Trin 1: Dynamiske knapper og A-D Labels
    const labels = ['A', 'B', 'C', 'D'];
    const colors = ['#e21b3c', '#1368ce', '#d89e00', '#26890c'];
    
    // Hent quizzen for at vide antal svarmuligheder
    const cloudDb = await getDbFromCloud();
    const quiz = cloudDb.quizzes.find(q => q.id === session.quizId);
    const question = quiz.questions[session.currentQuestionIndex];
    const optionCount = question.options.length;

    main.innerHTML = `
        <div class="student-game-container fade-in">
            <div class="game-header-compact">
                <span>Spørgsmål ${session.currentQuestionIndex + 1}</span>
                <div class="student-points-badge">${player.points || 0} p</div>
            </div>
            <div class="student-answer-grid" style="grid-template-rows: repeat(${Math.ceil(optionCount/2)}, 1fr);">
                ${colors.slice(0, optionCount).map((color, i) => `
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
    
    const snap = await window.get(window.ref(window.db, `live_sessions/${pin}`));
    const session = snap.val();
    
    const cloudDb = await getDbFromCloud();
    const quiz = cloudDb.quizzes.find(q => q.id === session.quizId);
    const question = quiz.questions[session.currentQuestionIndex];
    
    let pointsToAdd = 0;
    if (answerIdx === question.correctIndex) {
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

// Auto-join og Dashboard Init
document.addEventListener('DOMContentLoaded', () => {
    init(); // Start Dashboard
    
    const savedPin = localStorage.getItem('active_live_pin');
    if (savedPin) {
        const sessionRef = window.ref(window.db, `live_sessions/${savedPin}`);
        window.get(sessionRef).then(snap => {
            if (snap.exists() && snap.val().status !== 'finished') {
                initStudentLiveListener(savedPin);
            } else {
                localStorage.removeItem('active_live_pin');
            }
        });
    }
    
    // Trin 1: Skjul live-knappen hvis man er lærer
    const btn = document.getElementById('live-join-btn');
    if (btn) {
        if (window.isUserAdmin()) {
            btn.style.setProperty('display', 'none', 'important');
        } else {
            btn.style.display = 'block'; 
        }
    }
});
