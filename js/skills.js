import { getDbFromCloud } from './firebase-service.js';

const APP_VERSION = "v5.4.0";
let myPlayerId = localStorage.getItem('kahoot_player_id') || 'p' + Math.random().toString(36).substr(2, 9);
localStorage.setItem('kahoot_player_id', myPlayerId);

async function loadDatabase() {
    try {
        const cloudDb = await getDbFromCloud();
        if (cloudDb) return cloudDb;
    } catch (e) {
        console.error("Firebase load error:", e);
    }
    return window.QUIZ_DATABASE || { quizzes: [], categories: [] };
}

// --- HARD-LINK LIVE SYSTEM v5.4.0 ---
let activeLivePin = null;
let lastQuestionIndex = -1;
let currentStatus = 'lobby';

window.startJoinProcess = () => {
    const old = document.querySelector('.pin-modal-overlay');
    if (old) old.remove();

    const overlay = document.createElement('div');
    overlay.className = 'pin-modal-overlay fade-in';
    overlay.innerHTML = `
        <div class="pin-modal-card">
            <h2 style="color: white; margin: 0;">INDTAST PIN</h2>
            <p style="color: #aaa; font-size: 0.8rem; margin-top: 0.5rem;">Få koden fra læreren</p>
            <input type="number" id="pin-input-field" class="pin-input-large" placeholder="000000" pattern="[0-9]*" inputmode="numeric">
            <div style="display: flex; gap: 10px;">
                <button class="btn btn-secondary" style="flex: 1;" onclick="this.closest('.pin-modal-overlay').remove()">Annuller</button>
                <button class="btn btn-accent" style="flex: 2;" onclick="validatePinJoin()">DELTAG 🚀</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    setTimeout(() => document.getElementById('pin-input-field').focus(), 100);
};

window.validatePinJoin = async () => {
    const input = document.getElementById('pin-input-field');
    const pin = input.value.trim();
    if (!pin) return;

    activeLivePin = pin;
    try {
        const snap = await window.get(window.ref(window.db, `live_sessions/${activeLivePin}`));
        const session = snap.val();
        if (!session) {
            alert("Ugyldig PIN! Prøv igen.");
            input.value = "";
            input.focus();
            return;
        }
        document.querySelector('.pin-modal-overlay').remove();
        showProfileModal(activeLivePin);
    } catch (e) { console.error("Join error:", e); }
};

window.showProfileModal = (pin) => {
    const overlay = document.createElement('div');
    overlay.className = 'pin-modal-overlay fade-in';
    const icons = ['🔨', '🪚', '📏', '🏠', '👷', '🪵'];
    let selectedIcon = icons[0];

    overlay.innerHTML = `
        <div class="pin-modal-card">
            <h2 style="color: white; margin-bottom: 1rem;">DIN PROFIL</h2>
            <input type="text" id="player-name-field" class="name-input-field" placeholder="Indtast dit navn" maxlength="15">
            <div class="icon-selector">
                ${icons.map((icon, i) => `
                    <div class="icon-item ${i===0?'selected':''}" onclick="selectProfileIcon(this, '${icon}')">${icon}</div>
                `).join('')}
            </div>
            <button class="btn btn-accent" style="width: 100%; margin-top: 1rem;" onclick="finalizeProfile('${pin}')">KLAR! 🚀</button>
        </div>
    `;
    document.body.appendChild(overlay);
    
    window.selectProfileIcon = (el, icon) => {
        document.querySelectorAll('.icon-item').forEach(item => item.classList.remove('selected'));
        el.classList.add('selected');
        selectedIcon = icon;
    };

    window.finalizeProfile = async (pin) => {
        const nameInput = document.getElementById('player-name-field');
        const name = nameInput.value.trim() || "Anonym Elev";
        try {
            await window.set(window.ref(window.db, `live_sessions/${pin}/players/${myPlayerId}`), {
                name: name,
                icon: selectedIcon,
                points: 0,
                joinedAt: Date.now()
            });
            overlay.remove();
            renderWaitingScreen(name, selectedIcon);
        } catch (e) { console.error("Profile save error:", e); }
    };
};

function renderWaitingScreen(name, icon) {
    document.body.className = 'kahoot-mode';
    document.body.innerHTML = `
        <div class="kahoot-waiting">
            <div style="font-size: 5rem;">${icon}</div>
            <h1>DU ER MED, ${name.toUpperCase()}!</h1>
            <p>Kig op på storskærmen...</p>
        </div>
    `;
}

function initHardLink() {
    if (!window.ref || !window.onValue) return;

    window.onValue(window.ref(window.db, 'live_sessions'), (snap) => {
        const sessions = snap.val();
        
        const hasActiveSession = sessions && Object.values(sessions).some(s => s && (s.status === 'lobby' || s.status === 'playing'));
        const joinBtn = document.getElementById('live-join-btn');
        if (joinBtn) joinBtn.style.display = hasActiveSession ? 'block' : 'none';

        if (!sessions) {
            if (document.body.classList.contains('kahoot-mode')) location.reload();
            return;
        }

        const isAdmin = document.getElementById('admin-modal') || 
                        document.querySelector('.admin-trigger') ||
                        window.location.href.includes('admin');
        if (isAdmin) return;

        if (activeLivePin) {
            const session = sessions[activeLivePin];
            if (session) {
                if (session.status === 'playing') {
                    if (lastQuestionIndex !== session.currentQuestionIndex) {
                        lastQuestionIndex = session.currentQuestionIndex;
                        renderStudentGameView(session);
                    }
                } else if (session.status === 'showing_results') {
                    if (currentStatus !== 'showing_results') {
                        renderStudentResultView(session);
                    }
                } else if (session.status === 'finished') {
                    location.reload();
                }
                currentStatus = session.status;
            }
        }
    });
}

function renderStudentGameView(session) {
    document.body.className = 'kahoot-mode';
    document.body.innerHTML = `
        <div class="kahoot-grid fade-in">
            <button class="kahoot-btn-a" onclick="submitLiveAnswer('A', 0)">A</button>
            <button class="kahoot-btn-b" onclick="submitLiveAnswer('B', 1)">B</button>
            <button class="kahoot-btn-c" onclick="submitLiveAnswer('C', 2)">C</button>
            <button class="kahoot-btn-d" onclick="submitLiveAnswer('D', 3)">D</button>
        </div>
    `;
}

window.submitLiveAnswer = async (char, index) => {
    if (!activeLivePin) return;
    
    const btns = document.querySelectorAll('.kahoot-grid button');
    btns.forEach(b => { b.disabled = true; b.style.opacity = "0.2"; });

    try {
        const snap = await window.get(window.ref(window.db, `live_sessions/${activeLivePin}`));
        const session = snap.val();
        const data = await loadDatabase();
        const quiz = data.quizzes.find(q => q.id === session.quizId);
        const qIdx = session.currentQuestionIndex;
        const isCorrect = index === quiz.questions[qIdx].correctIndex;
        
        const timeLimit = 20;
        const now = Date.now();
        const startTime = session.questionStartTime || now;
        const elapsed = (now - startTime) / 1000;
        const speedBonus = Math.max(0, Math.floor(500 * (1 - (elapsed / timeLimit))));
        const pointsAwarded = isCorrect ? (500 + speedBonus) : 0;

        const updates = {};
        updates[`players/${myPlayerId}/answer`] = index;
        updates[`players/${myPlayerId}/lastAnswerCorrect`] = isCorrect;
        updates[`players/${myPlayerId}/points`] = (session.players[myPlayerId].points || 0) + pointsAwarded;
        
        await window.update(window.ref(window.db, `live_sessions/${activeLivePin}`), updates);

        document.body.innerHTML = `
            <div class="kahoot-waiting">
                <div style="font-size: 5rem;">🚀</div>
                <h1>SVAR MODTAGET!</h1>
                <p>Vent på resultatet...</p>
            </div>
        `;
    } catch (e) { console.error("Submit error:", e); }
};

function renderStudentResultView(session) {
    const player = session.players[myPlayerId];
    if (!player) return;

    const isCorrect = player.lastAnswerCorrect === true;
    const bg = isCorrect ? '#26890c' : '#e21b3c';
    const icon = isCorrect ? '✅' : '❌';
    const text = isCorrect ? 'RIGTIGT!' : 'FORKERT!';

    document.body.style.backgroundColor = bg;
    document.body.innerHTML = `
        <div class="kahoot-result-screen fade-in" style="background: ${bg}; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; color: white; text-align: center; padding: 2rem;">
            <div style="font-size: 8rem; margin-bottom: 1rem;">${icon}</div>
            <h1 style="font-size: 3rem; font-weight: 900; margin-bottom: 2rem;">${text}</h1>
            <div style="background: rgba(0,0,0,0.2); padding: 2rem; border-radius: 20px; width: 100%; max-width: 300px;">
                <p style="opacity: 0.8; margin-bottom: 0.5rem; font-weight: bold;">DIN SCORE</p>
                <div style="font-size: 3.5rem; font-weight: 900;">${player.points || 0}</div>
            </div>
            <p style="margin-top: 3rem; opacity: 0.7;">Kig op på storskærmen!</p>
        </div>
    `;
}

// --- STANDARD DASHBOARD LOGIK ---
let currentCategory = 'all';

async function initDashboard() {
    const data = await loadDatabase();
    renderCategorySelector(data.categories);
    renderDashboard();
    initHardLink();
}

function renderCategorySelector(categories) {
    const container = document.getElementById('category-selector');
    if (!container) return;
    const visibleCategories = categories.filter(c => !c.isHidden);
    const allBtn = `<button class="category-btn ${currentCategory === 'all' ? 'active' : ''}" onclick="filterCategory('all')">Alle</button>`;
    const categoryBtns = visibleCategories.map(cat => `
        <button class="category-btn ${currentCategory === cat.id ? 'active' : ''}" onclick="filterCategory('${cat.id}')">${cat.title}</button>
    `).join('');
    container.innerHTML = allBtn + categoryBtns;
}

window.filterCategory = function(id) {
    currentCategory = id;
    renderDashboard();
}

async function renderDashboard() {
    const data = await loadDatabase();
    const grid = document.getElementById('quiz-grid');
    if (!grid) return;
    const visibleCategoryIds = data.categories.filter(c => !c.isHidden).map(c => c.id);
    const visibleQuizzes = data.quizzes.filter(q => !q.isHidden && visibleCategoryIds.includes(q.categoryId));
    const filteredQuizzes = currentCategory === 'all' ? visibleQuizzes : visibleQuizzes.filter(q => q.categoryId === currentCategory);

    grid.innerHTML = filteredQuizzes.map(quiz => {
        const imageUrl = quiz.moodImageUrl || `https://placehold.co/800x600/2a2a2a/ffffff?text=Quiz`;
        return `
            <a href="quiz.html?id=${quiz.id}" class="quiz-card fade-in">
                <div class="card-image-container"><img src="${imageUrl}"></div>
                <div class="card-content">
                    <h3>${quiz.title}</h3>
                    <p>${quiz.description}</p>
                </div>
            </a>
        `;
    }).join('');

    let tag = document.getElementById('version-tag') || document.createElement('div');
    tag.id = 'version-tag';
    tag.style = 'position: fixed; bottom: 10px; right: 10px; font-size: 0.7rem; color: #666;';
    tag.textContent = APP_VERSION;
    if (!document.getElementById('version-tag')) document.body.appendChild(tag);
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('quiz-grid')) {
        initDashboard();
        const joinBtn = document.getElementById('live-join-btn');
        if (joinBtn) {
            const handleJoin = (e) => {
                e.preventDefault();
                window.startJoinProcess();
            };
            joinBtn.addEventListener('click', handleJoin);
            joinBtn.addEventListener('touchstart', handleJoin, {passive: false});
        }
    }
});
