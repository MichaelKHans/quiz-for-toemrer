import { getDbFromCloud } from './firebase-service.js';

const APP_VERSION = "v5.1.5";
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

// --- HARD-LINK LIVE SYSTEM v5.1.5 ---
let activeLivePin = null;

window.startJoinProcess = async () => {
    const pin = prompt("Indtast 6-cifret PIN:");
    if (!pin) return;
    
    activeLivePin = pin.trim();
    console.log("Deltager i session:", activeLivePin);
    
    // Tjek databasen for denne session
    try {
        const snap = await window.get(window.ref(window.db, `live_sessions/${activeLivePin}`));
        const session = snap.val();
        if (!session) {
            alert("Ugyldig PIN!");
            return;
        }
        
        // Registrer spilleren
        await window.set(window.ref(window.db, `live_sessions/${activeLivePin}/players/${myPlayerId}/name`), "Elev");
        
        // Skift UI
        renderStudentGameView(session);
    } catch (e) {
        console.error("Join error:", e);
    }
};

function initHardLink() {
    if (!window.ref || !window.onValue) return;

    console.log("Hard-Link Live System Active (v5.1.5)");
    
    window.onValue(window.ref(window.db, 'live_sessions'), (snap) => {
        const sessions = snap.val();
        
        // 1. Styr synlighed af "Deltag" knappen
        const hasActiveSession = sessions && Object.values(sessions).some(s => s && (s.status === 'lobby' || s.status === 'playing'));
        const joinBtn = document.getElementById('live-join-btn');
        if (joinBtn) joinBtn.style.display = hasActiveSession ? 'block' : 'none';

        if (!sessions) {
            if (document.body.classList.contains('kahoot-mode')) location.reload();
            return;
        }

        // 2. EMERGENCY ADMIN CHECK
        const isAdmin = document.getElementById('admin-modal') || 
                        document.querySelector('.admin-trigger') ||
                        window.location.href.includes('admin');
        
        if (isAdmin) return;

        // 3. Automatisk UI-skift for elever
        const activeSession = Object.values(sessions).find(s => s && s.status === 'playing');
        
        if (activeSession) {
            if (activeLivePin !== activeSession.pin) {
                activeLivePin = activeSession.pin;
                renderStudentGameView(activeSession);
            }
        } else {
            if (document.body.classList.contains('kahoot-mode')) location.reload();
        }
    });
}

function renderStudentGameView(session) {
    document.body.className = 'kahoot-mode';
    document.body.innerHTML = `
        <div class="kahoot-grid">
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
        await window.set(window.ref(window.db, `live_sessions/${activeLivePin}/players/${myPlayerId}/answer`), index);
        document.body.innerHTML = `
            <div class="kahoot-waiting">
                <div style="font-size: 5rem;">🚀</div>
                <h1>SVAR MODTAGET!</h1>
                <p>Vent på næste spørgsmål...</p>
            </div>
        `;
    } catch (e) { console.error("Submit error:", e); }
};

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
        // Aktiver Deltag-knap
        const joinBtn = document.getElementById('live-join-btn');
        if (joinBtn) {
            joinBtn.onclick = () => {
                console.log("Deltag trykket - starter join proces");
                window.startJoinProcess();
            };
        }
    }
});
