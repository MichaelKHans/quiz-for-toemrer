/**
 * memory.js
 * Håndterer alle localStorage operationer for Quiz Hub.
 */

const STORAGE_KEY = 'quiz_hub_scores_v2'; // Ny version pga. pointsystem

/**
 * Henter alle gemte scores fra localStorage.
 * @returns {Object}
 */
function getScores() {
    const scores = localStorage.getItem(STORAGE_KEY);
    return scores ? JSON.parse(scores) : {};
}

/**
 * Gemmer en score for en specifik quiz.
 */
function saveScore(quizId, points, maxPoints) {
    const scores = getScores();
    const percentage = (points / maxPoints) * 100;
    
    let stars = 0;
    if (percentage === 100) stars = 3;
    else if (percentage >= 70) stars = 2;
    else if (percentage > 0) stars = 1;

    scores[quizId] = {
        points: points,
        maxPoints: maxPoints,
        stars: stars,
        timestamp: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
}

/**
 * Beregner den overordnede fremgang.
 * @param {number} totalQuizzes 
 */
function getProgressSummary(totalQuizzes) {
    const scores = getScores();
    const completed = Object.keys(scores).length;
    
    return {
        completed: completed,
        total: totalQuizzes,
        percentage: totalQuizzes > 0 ? Math.round((completed / totalQuizzes) * 100) : 0
    };
}

const ADMIN_DATA_KEY = 'quiz_hub_admin_data';

/**
 * Henter den brugerdefinerede database fra læreren (hvis den findes).
 */
function getCustomDatabase() {
    const data = localStorage.getItem(ADMIN_DATA_KEY);
    return data ? JSON.parse(data) : null;
}

/**
 * Gemmer lærerens rettelser lokalt.
 */
function saveCustomDatabase(data) {
    localStorage.setItem(ADMIN_DATA_KEY, JSON.stringify(data));
}

window.QuizMemory = {
    getScores,
    saveScore,
    getProgressSummary,
    getCustomDatabase,
    saveCustomDatabase
};

