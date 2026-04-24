// js/quiz.js - v5.7.7 Mood Image Support
const APP_VERSION = "v5.7.7";

function initQuiz() {
    const params = new URLSearchParams(window.location.search);
    const quizId = params.get('id');
    
    if (!quizId) {
        window.location.href = 'index.html';
        return;
    }

    // Gendan onValue-lytteren (v5.5.0 Fundament)
    if (window.onValue && window.ref && window.db) {
        const dbRef = window.ref(window.db, 'quiz_database/quizzes');
        window.onValue(dbRef, (snapshot) => {
            const quizzes = snapshot.val();
            if (!quizzes) {
                console.error("Ingen quizzer fundet i databasen.");
                return;
            }

            const quiz = Object.values(quizzes).find(q => q.id === quizId);
            if (quiz) {
                renderQuizPage(quiz);
            } else {
                document.getElementById('quiz-content').innerHTML = `
                    <div style="text-align: center; padding: 3rem;">
                        <h2>Quizzen blev ikke fundet!</h2>
                        <a href="index.html" class="btn btn-primary">Tilbage til oversigt</a>
                    </div>
                `;
            }
        });
    } else {
        console.error("Firebase er ikke initialiseret korrekt.");
    }
}

function renderQuizPage(quiz) {
    document.getElementById('quiz-title').textContent = quiz.title;
    
    // Set mood image and ghost title (v5.7.8)
    const moodImg = document.getElementById('quiz-mood-bg');
    if (moodImg) {
        const imageUrl = quiz.imageUrl || "";
        moodImg.innerHTML = `<h1>${quiz.title}</h1>`; // Ghost title
        
        if (imageUrl) {
            moodImg.style.backgroundImage = `url('${imageUrl}')`;
            moodImg.style.backgroundSize = 'cover';
            moodImg.style.backgroundPosition = 'center';
        } else {
            moodImg.style.backgroundImage = 'none';
            moodImg.style.background = '#1a1a1a';
        }
    }

    startQuizFlow(quiz);
}

let currentQIdx = 0;
let userScore = 0;

function startQuizFlow(quiz) {
    currentQIdx = 0;
    userScore = 0;
    showQuestion(quiz);
}

function showQuestion(quiz) {
    const question = quiz.questions[currentQIdx];
    const content = document.getElementById('quiz-content');
    const progress = Math.round((currentQIdx / quiz.questions.length) * 100);

    content.innerHTML = `
        <div class="quiz-progress-container" style="margin-bottom: 2rem;">
            <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 0.5rem; opacity: 0.7;">
                <span>Spørgsmål ${currentQIdx + 1} af ${quiz.questions.length}</span>
                <span>${progress}% gennemført</span>
            </div>
            <div class="progress-bar" style="height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">
                <div style="width: ${progress}%; height: 100%; background: var(--accent); transition: width 0.3s;"></div>
            </div>
        </div>

        <h2 style="font-size: 1.8rem; margin-bottom: 2rem; line-height: 1.3;">${question.question}</h2>
        
        <div class="options-grid" style="display: grid; gap: 1rem;">
            ${question.options.map((opt, i) => `
                <button class="option-btn" onclick="handleAnswer(${i}, ${quiz.questions.length}, '${quiz.id}')">
                    ${opt}
                </button>
            `).join('')}
        </div>
    `;

    window.handleAnswer = (selectedIdx, total, qId) => {
        const isCorrect = selectedIdx === question.correctIndex;
        if (isCorrect) userScore++;

        const btns = document.querySelectorAll('.option-btn');
        btns.forEach((btn, i) => {
            btn.disabled = true;
            if (i === question.correctIndex) {
                btn.style.background = 'rgba(38, 137, 12, 0.2)';
                btn.style.borderColor = '#26890c';
            } else if (i === selectedIdx) {
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
            <button class="btn btn-primary" style="margin-top: 1.5rem; width: 100%;" id="next-btn">
                ${currentQIdx < total - 1 ? 'Næste spørgsmål &rarr;' : 'Se resultat'}
            </button>
        `;
        content.appendChild(feedback);

        document.getElementById('next-btn').onclick = () => {
            if (currentQIdx < total - 1) {
                currentQIdx++;
                showQuestion(quiz);
            } else {
                showFinalScore(total, qId);
            }
        };
    };
}

function showFinalScore(total, quizId) {
    const content = document.getElementById('quiz-content');
    const percentage = Math.round((userScore / total) * 100);
    
    if (window.QuizMemory) {
        window.QuizMemory.saveScore(quizId, userScore, total);
    }

    content.innerHTML = `
        <div class="result-screen fade-in" style="text-align: center; padding: 2rem 0;">
            <div style="font-size: 5rem; margin-bottom: 1rem;">🏆</div>
            <h2 style="font-size: 2.5rem; margin-bottom: 0.5rem;">${userScore} / ${total} rigtige</h2>
            <p style="font-size: 1.2rem; opacity: 0.8; margin-bottom: 2rem;">Flot klaret! Du har gennemført quizzen.</p>
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
