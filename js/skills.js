import { getDbFromCloud } from './firebase-service.js';

async function loadDatabase() {
    // 1. Tjek skyen (Vigtigst for synkronisering)
    try {
        const cloudDb = await getDbFromCloud();
        if (cloudDb) {
            console.log("Database indlæst fra Firebase!");
            return cloudDb;
        }
    } catch (e) {
        console.error("Fejl ved hentning fra skyen:", e);
    }

    // 2. Vi bruger IKKE længere localStorage til indhold (kun til elev-progress)

    // 3. Brug standard-databasen hvis alt andet svigter (offline backup)
    if (window.QUIZ_DATABASE) {
        console.warn("Bruger statisk database fallback.");
        return window.QUIZ_DATABASE;
    } else {
        console.error('Database ikke fundet!');
        return { quizzes: [], categories: [] };
    }
}

/**
 * DASHBOARD LOGIK
 */
let currentCategory = 'all';

async function initDashboard() {
    const data = await loadDatabase();
    renderCategorySelector(data.categories);
    renderDashboard();
}

function renderCategorySelector(categories) {
    const container = document.getElementById('category-selector');
    if (!container) return;

    const allBtn = `<button class="category-btn ${currentCategory === 'all' ? 'active' : ''}" onclick="filterCategory('all')">Alle</button>`;
    const categoryBtns = categories.map(cat => `
        <button class="category-btn ${currentCategory === cat.id ? 'active' : ''}" onclick="filterCategory('${cat.id}')">${cat.title}</button>
    `).join('');

    container.innerHTML = allBtn + categoryBtns;
}

window.filterCategory = function(id) {
    currentCategory = id;
    renderDashboard();
}

function renderStars(count) {
    let starsHtml = '';
    for (let i = 1; i <= 3; i++) {
        starsHtml += `<span class="star ${i > count ? 'empty' : ''}">★</span>`;
    }
    return `<div class="stars-container">${starsHtml}</div>`;
}

async function renderDashboard() {
    const data = await loadDatabase();
    const scores = window.QuizMemory.getScores();
    const progress = window.QuizMemory.getProgressSummary(data.quizzes.length);

    // Opdater progress bar
    const bar = document.getElementById('progress-bar');
    const label = document.getElementById('progress-label');
    if (bar && label) {
        bar.style.width = `${progress.percentage}%`;
        label.textContent = `Samlet fremgang: ${progress.completed} ud af ${progress.total} quizzer`;
    }

    const grid = document.getElementById('quiz-grid');
    if (grid) {
        // Filtrer først alle skjulte quizzer væk. Filtrer derefter på kategori.
        const visibleQuizzes = data.quizzes.filter(q => !q.isHidden);
        const filteredQuizzes = currentCategory === 'all' 
            ? visibleQuizzes 
            : visibleQuizzes.filter(q => q.categoryId === currentCategory);

        grid.innerHTML = filteredQuizzes.map(quiz => {
            const scoreData = scores[quiz.id];
            let footerContent = '<span class="badge badge-default">Ikke startet</span>';
            
            if (scoreData) {
                footerContent = `
                    ${renderStars(scoreData.stars)}
                    <span class="badge badge-success">${scoreData.points} point</span>
                `;
            }

            // Brug det faste billede fra databasen, ellers brug en diskret pladsholder
            const imageUrl = quiz.moodImageUrl || `https://placehold.co/800x600/2a2a2a/ffffff?text=Intet+billede+valgt`;

            return `
                <a href="quiz.html?id=${quiz.id}" class="quiz-card fade-in">
                    <div class="card-mood-bg" style="background-image: url('${imageUrl}')"></div>
                    <h3 style="position: relative; z-index: 2;">${quiz.title}</h3>
                    <p style="position: relative; z-index: 2;">${quiz.description}</p>
                    <div class="card-footer" style="position: relative; z-index: 2;">
                        ${footerContent}
                    </div>
                </a>
            `;
        }).join('');

        // Genindlæs kategori-knapper for at sikre aktiv tilstand er korrekt
        renderCategorySelector(data.categories);

        // Tilføj versionsmærkat i bunden (v4.0.0)
        let tag = document.getElementById('version-tag');
        if (!tag) {
            tag = document.createElement('div');
            tag.id = 'version-tag';
            tag.style = 'position: fixed; bottom: 10px; right: 10px; font-size: 0.7rem; color: var(--text-secondary); opacity: 0.5; z-index: 100; pointer-events: none;';
            document.body.appendChild(tag);
        }
        tag.textContent = 'v4.3.2';
    }
}

/**
 * QUIZ ENGINE LOGIK
 */
let currentQuiz = null;
let currentQuestionIndex = 0;
let totalPoints = 0;
let questionAttempts = 0;
let isAnswered = false;

async function initQuiz() {
    const urlParams = new URLSearchParams(window.location.search);
    const quizId = urlParams.get('id');
    
    if (!quizId) {
        window.location.href = 'index.html';
        return;
    }

    const data = await loadDatabase();
    currentQuiz = data.quizzes.find(q => q.id === quizId);

    if (!currentQuiz) {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('quiz-title').textContent = currentQuiz.title;
    renderQuestion();
}

function updatePointsDisplay() {
    const tracker = document.getElementById('points-tracker');
    if (tracker) {
        tracker.innerHTML = `
            <span class="points-label">Point</span>
            <span class="points-value">${totalPoints}</span>
        `;
    }
}

/**
 * Hjælpefunktion til at oversætte danske fagord til engelske søgeord.
 */
window.translateKeywords = function(input) {
    if (!input) return "";
    
    const dictionary = {
        // Konstruktion
        'tagspær': 'roof,trusses',
        'hanebåndsspær': 'roof,attic,truss',
        'lægter': 'battens,roofing',
        'bjælker': 'beams,timber',
        'rem': 'sill,plate,timber',
        'stolper': 'posts,timber',
        'skillerum': 'partition,wall',
        'gips': 'drywall,plasterboard',
        'isolering': 'insulation,mineral-wool',
        'dampspær': 'vapor-barrier',
        'undertag': 'roofing,underlayment',
        
        // Elementer
        'trapper': 'stairs,staircase',
        'vinduer': 'windows,glazing',
        'døre': 'doors,entryway',
        'kvist': 'dormer,roof',
        'tag': 'roof,construction',
        'skur': 'shed,wooden',
        'terrasse': 'deck,patio,wood',
        'gulv': 'flooring,timber',
        'lofter': 'ceiling,interior',
        
        // Generelt & Plads
        'byggeplads': 'construction,site',
        'værktøj': 'hand-tools,carpentry',
        'maskiner': 'power-tools,carpentry',
        'sikkerhed': 'safety,equipment',
        'faldsikring': 'harness,safety',
        'stillads': 'scaffolding',
        'kran': 'crane,construction',
        'lift': 'aerial-lift,cherry-picker',
        'hjelm': 'hard-hat,safety',
        'handsker': 'gloves,safety',
        
        // Materialer
        'træ': 'wood,timber',
        'beton': 'concrete',
        'stål': 'steel,beams',
        'mursten': 'bricks,masonry',
        'søm': 'nails,carpentry',
        'skruer': 'screws,carpentry',
        'beslag': 'brackets,metal',
        'vinkelbeslag': 'angle-bracket',
        'lim': 'wood-glue',
        
        // Fugt & Svamp
        'skimmel': 'mold,fungus',
        'svamp': 'fungi,decay',
        'hussvamp': 'dry-rot,fungi',
        'skimmelsvamp': 'mold',
        'fugt': 'moisture,wet',
        'råd': 'rot,decay',
        
        // Andre fagord
        'tømrer': 'carpenter,carpentry',
        'snedker': 'joiner,woodworking',
        'murer': 'masonry',
        'elektriker': 'electrician',
        'vvs': 'plumbing',
        'tegning': 'blueprint,architectural',
        'opmåling': 'measuring,surveying',
        'logistik': 'logistics,shipping'
    };

    let result = input.toLowerCase().trim();
    
    // Tjek for ord i input og oversæt dem
    let foundTerms = [];
    
    // Split input i ord for at tjekke hvert ord individuelt
    const inputWords = result.split(/[\s,]+/);
    
    inputWords.forEach(word => {
        if (dictionary[word]) {
            foundTerms.push(dictionary[word]);
        }
    });

    // Hvis ingen ord blev fundet i ordbogen, tjek om hele strengen er en nøgle
    if (foundTerms.length === 0 && dictionary[result]) {
        foundTerms.push(dictionary[result]);
    }

    return foundTerms.length > 0 ? foundTerms.join(',') : result;
};

window.cleanKeywords = function(input) {
    if (!input) return "tools,carpentry";
    
    // 1. Manuel oversættelse af danske bogstaver (bedre end at slette dem)
    let clean = input.toLowerCase()
        .replace(/æ/g, 'ae')
        .replace(/ø/g, 'oe')
        .replace(/å/g, 'aa');
        
    // 2. Erstat alt der ikke er a-z eller 0-9 med kommaer
    clean = clean.replace(/[^a-z0-9]/g, ',');
    
    // 3. Rens array for tomme og korte ord
    let tags = clean.split(',')
        .map(s => s.trim())
        .filter(s => s.length > 2);
        
    // 4. Billed-tjenester (LoremFlickr) bruger AND-logik ved kommaer.
    // Hvis vi sender for mange tags, finder den intet og viser en kat.
    // Vi begrænser os til de 2 vigtigste ord.
    let finalTags = tags.length > 0 ? tags.slice(0, 2) : ["carpentry"];
    
    // Hvis vi kun har ét tag, tilføjer vi 'construction' som et ekstra (stadig ret specifikt)
    if (finalTags.length === 1 && finalTags[0] !== 'carpentry') {
        finalTags.push('carpentry');
    }
    
    const result = finalTags.join(',');
    console.log("Image Search Tags (v4.3.2):", result);
    return result;
};

function renderQuestion() {
    const question = currentQuiz.questions[currentQuestionIndex];
    isAnswered = false;
    questionAttempts = 0;

    // Opdater stemningsbillede (hvis vi er på split-screen layoutet)
    const moodBg = document.getElementById('quiz-mood-bg');
    if (moodBg) {
        const imageUrl = currentQuiz.moodImageUrl || `https://placehold.co/1200x800/2a2a2a/ffffff?text=${encodeURIComponent(currentQuiz.title)}`;
        
        moodBg.style.backgroundImage = `url('${imageUrl}')`;
    }

    const container = document.getElementById('quiz-content');
    container.innerHTML = `
        <div id="points-tracker" class="points-tracker"></div>
        <div class="question-box fade-in">
            <div class="quiz-progress-text">Spørgsmål ${currentQuestionIndex + 1} af ${currentQuiz.questions.length}</div>
            <h2 class="question-text">${question.question}</h2>
            <div class="options-list" id="options-list">
                ${question.options.map((option, index) => `
                    <button class="option-btn" data-index="${index}" onclick="handleAnswer(${index})">${option}</button>
                `).join('')}
            </div>
            <div id="rationale" class="rationale-box"></div>
        </div>
    `;
    updatePointsDisplay();
}

window.handleAnswer = function(index) {
    if (isAnswered) return;

    const question = currentQuiz.questions[currentQuestionIndex];
    const isCorrect = (index === question.correctIndex);
    const rationaleBox = document.getElementById('rationale');
    const optionBtns = document.querySelectorAll('.option-btn');
    const selectedBtn = document.querySelector(`.option-btn[data-index="${index}"]`);

    questionAttempts++;

    if (isCorrect) {
        isAnswered = true;
        const awarded = questionAttempts === 1 ? 3 : 1;
        totalPoints += awarded;
        updatePointsDisplay();

        selectedBtn.classList.add('correct');
        optionBtns.forEach(btn => btn.disabled = true);

        showFeedback(true, awarded, question.rationale);
    } else {
        selectedBtn.classList.add('incorrect');
        selectedBtn.disabled = true;

        if (questionAttempts === 1) {
            // Første fejl - prøv igen
            showFeedback(false, 0, "Det var ikke korrekt. Prøv en gang til!", true);
        } else {
            // Anden fejl - slut
            isAnswered = true;
            optionBtns.forEach(btn => {
                btn.disabled = true;
                if (parseInt(btn.dataset.index) === question.correctIndex) {
                    btn.classList.add('correct');
                }
            });
            showFeedback(false, 0, question.rationale);
        }
    }
};

function showFeedback(isCorrect, points, text, tryAgain = false) {
    const rationaleBox = document.getElementById('rationale');
    let header = "";
    let boxClass = "";

    if (tryAgain) {
        header = "Prøv igen!";
        boxClass = "try-again";
    } else if (isCorrect) {
        header = points === 3 ? "Perfekt! +3 point" : "Godt svaret! +1 point";
        boxClass = "correct";
    } else {
        header = "Ikke helt rigtigt... 0 point";
        boxClass = "incorrect";
    }

    rationaleBox.innerHTML = `
        <div class="rationale-header">${header}</div>
        <div class="rationale-text">${text}</div>
        ${!tryAgain ? `
            <div class="rationale-action">
                <button class="btn btn-primary" onclick="nextStep()">
                    ${currentQuestionIndex === currentQuiz.questions.length - 1 ? 'Se Resultat' : 'Næste Spørgsmål'}
                </button>
            </div>
        ` : ''}
    `;
    rationaleBox.className = `rationale-box visible ${boxClass}`;
}

window.nextStep = function() {
    if (currentQuestionIndex < currentQuiz.questions.length - 1) {
        currentQuestionIndex++;
        renderQuestion();
    } else {
        showResults();
    }
};

function showResults() {
    const maxPossible = currentQuiz.questions.length * 3;
    window.QuizMemory.saveScore(currentQuiz.id, totalPoints, maxPossible);
    const scoreData = window.QuizMemory.getScores()[currentQuiz.id];

    const container = document.getElementById('quiz-content');
    container.innerHTML = `
        <div class="results-screen fade-in">
            <div class="score-circle">
                <div class="score-num">${totalPoints}</div>
                <div class="score-total">af ${maxPossible}</div>
            </div>
            <div style="margin-bottom: 2rem;">
                ${renderStars(scoreData.stars)}
            </div>
            <h2>${scoreData.stars === 3 ? 'Helt suverænt!' : 'Godt klaret!'}</h2>
            <p class="subtitle">Du har optjent ${totalPoints} point i quizzen om ${currentQuiz.title}.</p>
            <div class="controls" style="justify-content: center; margin-top: 3rem;">
                <a href="index.html" class="btn btn-primary">Tilbage til Dashboard</a>
            </div>
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('quiz-grid')) {
        initDashboard();
    } else if (document.getElementById('quiz-content')) {
        initQuiz();
    }
});
