import { getDbFromCloud } from './firebase-service.js';

const APP_VERSION = "v5.1.2";
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

// --- HARD-LINK LIVE SYSTEM v5.1.0 ---
let activeLivePin = null;

function initHardLink() {
    if (!window.ref || !window.onValue) return;

    console.log("Hard-Link Live System Active (v5.1.0)");
    
    window.onValue(window.ref(window.db, 'live_sessions'), (snap) => {
        // --- EMERGENCY ADMIN CHECK v5.1.2 ---
        const isAdmin = document.getElementById('admin-modal') || 
                        document.querySelector('.admin-trigger') ||
                        window.location.href.includes('admin');
        
        if (isAdmin) {
            console.log("Admin detected - blocking student UI overwrite.");
            return;
        }

        const sessions = snap.val();
        if (!sessions) {
            if (document.body.classList.contains('kahoot-mode')) location.reload();
            return;
        }

        // Find den første aktive session (playing)
        const activeSession = Object.values(sessions).find(s => s && s.status === 'playing');
        
        if (activeSession) {
            if (activeLivePin !== activeSession.pin) {
                activeLivePin = activeSession.pin;
                renderKahootUI(activeSession);
            }
        } else {
            // Hvis vi var i kahoot mode men ingen session er aktiv mere
            if (document.body.classList.contains('kahoot-mode')) {
                location.reload();
            }
        }
    });
}

function renderKahootUI(session) {
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
    
    // Deaktiver knapper
    const btns = document.querySelectorAll('.kahoot-grid button');
    btns.forEach(b => {
        b.disabled = true;
        b.style.opacity = "0.2";
    });

    console.log(`Sender svar ${char} til session ${activeLivePin}`);
    
    try {
        const playerRef = window.ref(window.db, `live_sessions/${activeLivePin}/players/${myPlayerId}`);
        await window.set(window.ref(window.db, `live_sessions/${activeLivePin}/players/${myPlayerId}/answer`), index);
        await window.set(window.ref(window.db, `live_sessions/${activeLivePin}/players/${myPlayerId}/name`), "Elev");
        
        document.body.innerHTML = `
            <div class="kahoot-waiting">
                <div style="font-size: 5rem;">🚀</div>
                <h1>SVAR MODTAGET!</h1>
                <p>Vent på næste spørgsmål...</p>
            </div>
        `;
    } catch (e) {
        console.error("Fejl ved afsendelse af svar:", e);
    }
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
    if (document.getElementById('quiz-grid')) initDashboard();
});
