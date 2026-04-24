import { getDbFromCloud } from './firebase-service.js';

const APP_VERSION = "v5.5.0";

async function loadDatabase() {
    try {
        const cloudDb = await getDbFromCloud();
        if (cloudDb) return cloudDb;
    } catch (e) {
        console.error("Firebase load error:", e);
    }
    return window.QUIZ_DATABASE || { quizzes: [], categories: [] };
}

async function initQuiz() {
    const params = new URLSearchParams(window.location.search);
    const quizId = params.get('id');
    if (!quizId) {
        window.location.href = 'index.html';
        return;
    }

    const data = await loadDatabase();
    const quiz = data.quizzes.find(q => q.id === quizId);
    
    if (!quiz) {
        document.getElementById('quiz-content').innerHTML = `
            <div style="text-align: center; padding: 3rem;">
                <h2>Quizzen blev ikke fundet!</h2>
                <a href="index.html" class="btn btn-primary">Tilbage til oversigt</a>
            </div>
        `;
        return;
    }

    document.getElementById('quiz-title').textContent = quiz.title;
    
    // Set mood image if available
    const moodImg = document.getElementById('quiz-mood-bg');
    if (moodImg) {
        const imageUrl = quiz.moodImageUrl || `https://placehold.co/1200x800/1a1a1a/ffffff?text=${encodeURIComponent(quiz.title)}`;
        moodImg.style.backgroundImage = `url('${imageUrl}')`;
    }

    renderQuestion(quiz, 0, 0);
}

function renderQuestion(quiz, qIdx, score) {
    const question = quiz.questions[qIdx];
    const content = document.getElementById('quiz-content');
    
    const progress = Math.round(((qIdx) / quiz.questions.length) * 100);

    content.innerHTML = `
        <div class="quiz-progress-container" style="margin-bottom: 2rem;">
            <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 0.5rem; opacity: 0.7;">
                <span>Spørgsmål ${qIdx + 1} af ${quiz.questions.length}</span>
                <span>${progress}% gennemført</span>
            </div>
            <div class="progress-bar" style="height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">
                <div style="width: ${progress}%; height: 100%; background: var(--accent); transition: width 0.3s;"></div>
            </div>
        </div>

        <h2 style="font-size: 1.8rem; margin-bottom: 2rem; line-height: 1.3;">${question.question}</h2>
        
        <div class="options-grid" style="display: grid; gap: 1rem;">
            ${question.options.map((opt, i) => `
                <button class="option-btn" onclick="checkAnswer('${quiz.id}', ${qIdx}, ${i}, ${score})" style="text-align: left; padding: 1.2rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; color: white; cursor: pointer; transition: all 0.2s; font-size: 1.1rem;">
                    ${opt}
                </button>
            `).join('')}
        </div>
    `;
}

window.checkAnswer = async (quizId, qIdx, selectedIdx, currentScore) => {
    const data = await loadDatabase();
    const quiz = data.quizzes.find(q => q.id === quizId);
    const question = quiz.questions[qIdx];
    const isCorrect = selectedIdx === question.correctIndex;
    const newScore = isCorrect ? currentScore + 1 : currentScore;

    const content = document.getElementById('quiz-content');
    const btns = content.querySelectorAll('.option-btn');
    btns.forEach((btn, i) => {
        btn.disabled = true;
        if (i === question.correctIndex) {
            btn.style.background = 'rgba(38, 137, 12, 0.2)';
            btn.style.borderColor = '#26890c';
        } else if (i === selectedIdx && !isCorrect) {
            btn.style.background = 'rgba(226, 27, 60, 0.2)';
            btn.style.borderColor = '#e21b3c';
        }
    });

    const feedback = document.createElement('div');
    feedback.className = 'feedback-area fade-in';
    feedback.style = 'margin-top: 2rem; padding: 1.5rem; border-radius: 12px; background: rgba(255,255,255,0.03);';
    feedback.innerHTML = `
        <h3 style="color: ${isCorrect ? '#26890c' : '#e21b3c'}; margin-bottom: 0.5rem;">${isCorrect ? 'Korrekt! ✅' : 'Forkert! ❌'}</h3>
        <p style="opacity: 0.8; font-size: 0.95rem; line-height: 1.5;">${question.rationale || ''}</p>
        <button class="btn btn-primary" style="margin-top: 1.5rem; width: 100%;" onclick="nextQuestion('${quizId}', ${qIdx}, ${newScore})">
            ${qIdx < quiz.questions.length - 1 ? 'Næste spørgsmål &rarr;' : 'Se resultat'}
        </button>
    `;
    content.appendChild(feedback);
};

window.nextQuestion = async (quizId, qIdx, score) => {
    const data = await loadDatabase();
    const quiz = data.quizzes.find(q => q.id === quizId);
    if (qIdx < quiz.questions.length - 1) {
        renderQuestion(quiz, qIdx + 1, score);
    } else {
        showFinalResult(quiz, score);
    }
};

function showFinalResult(quiz, score) {
    const content = document.getElementById('quiz-content');
    const percentage = Math.round((score / quiz.questions.length) * 100);
    
    // Save to memory
    if (window.QuizMemory) {
        window.QuizMemory.saveScore(quiz.id, score, quiz.questions.length);
    }

    let message = "Godt kæmpet!";
    let icon = "🏆";
    if (percentage === 100) { message = "Perfekt! Du er en sand mester."; icon = "👑"; }
    else if (percentage >= 70) { message = "Flot resultat! Du har styr på det."; icon = "🌟"; }
    else if (percentage >= 50) { message = "Bestået! Men der er plads til forbedring."; icon = "👍"; }
    else { message = "Du må hellere læse lidt mere op på det."; icon = "📚"; }

    content.innerHTML = `
        <div class="result-screen fade-in" style="text-align: center; padding: 2rem 0;">
            <div style="font-size: 5rem; margin-bottom: 1rem;">${icon}</div>
            <h2 style="font-size: 2.5rem; margin-bottom: 0.5rem;">${score} / ${quiz.questions.length} rigtige</h2>
            <p style="font-size: 1.2rem; opacity: 0.8; margin-bottom: 2rem;">${message}</p>
            
            <div class="stars-display" style="font-size: 2.5rem; margin-bottom: 2rem;">
                ${percentage === 100 ? '⭐⭐⭐' : (percentage >= 70 ? '⭐⭐' : (percentage >= 10 ? '⭐' : ''))}
            </div>

            <div style="display: flex; gap: 1rem; justify-content: center;">
                <a href="index.html" class="btn btn-secondary">Afslut</a>
                <button class="btn btn-primary" onclick="location.reload()">Prøv igen</button>
            </div>
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', initQuiz);
