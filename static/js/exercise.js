// Exercise page - mashqni bajarish va tekshirish

document.addEventListener('DOMContentLoaded', function() {
    loadExercise();
});

function loadExercise() {
    const container = document.querySelector('.exercise-container');
    const exerciseType = container.dataset.exerciseType;
    const content = exerciseData;
    const contentArea = document.getElementById('exercise-content');

    if (exerciseType === 'matching') {
        loadMatchingExercise(content, contentArea);
        // Matching uchun Tekshirish tugmasini yashirish (avto-tekshirish bor)
        const checkBtn = document.querySelector('.exercise-actions .btn-success');
        if (checkBtn) {
            checkBtn.style.display = 'none';
        }
    } else if (exerciseType === 'fill_gaps') {
        loadFillGapsExercise(content, contentArea);
    } else if (exerciseType === 'multiple_choice') {
        loadMultipleChoiceExercise(content, contentArea);
    } else if (exerciseType === 'word_search') {
        loadWordSearchExercise(content, contentArea);
        // Word Search uchun Tekshirish tugmasini yashirish
        const checkBtn = document.querySelector('.exercise-actions .btn-success');
        if (checkBtn) {
            checkBtn.style.display = 'none';
        }
    } else if (exerciseType === 'crossword') {
        contentArea.innerHTML = '<div style="text-align:center;padding:60px 20px;"><div style="font-size:60px;margin-bottom:15px;">\u23f3</div><h2 style="color:#e74c3c;">Crossword mashqi tez kunda tayyor bo\'ladi!</h2><p style="color:#666;margin-top:10px;">Hozirda ishlab chiqilmoqda.</p></div>';
    }
}
function loadMatchingExercise(content, contentArea) {
    const items = content.items;
    
    // Global o'zgaruvchilarga saqlash
    mtItems = items;
    mtTotalWords = items.length;
    
    // Chap tomon so'zlarni ham aralashtirish
    const shuffledItems = [...items].sort(() => Math.random() - 0.5);
    
    // O'ng tomon javoblarni aralashtirish
    const matches = items.map(item => item.match).sort(() => Math.random() - 0.5);
    
    let html = '<div class="matching-exercise-dragdrop">';
    
    // Vaqt tanlash paneli
    html += '<div class="mt-timer-setup" id="mt-timer-setup">';
    html += '<h3>⏱️ Vaqt limitini tanlang:</h3>';
    html += '<div class="mt-time-options">';
    html += '<div class="mt-time-group">';
    html += '<label>Har bir juftlik uchun:</label>';
    html += '<select id="mt-time-per-word">';
    html += '<option value="0">Limitsiz</option>';
    html += '<option value="15">15 soniya</option>';
    html += '<option value="20">20 soniya</option>';
    html += '<option value="30" selected>30 soniya</option>';
    html += '<option value="45">45 soniya</option>';
    html += '<option value="60">1 daqiqa</option>';
    html += '</select>';
    html += '<small class="mt-hint">⚡ To\'g\'ri javob: +1 ball | Xato javob: -1 ball | Vaqt tugadi: -1 ball</small>';
    html += '</div>';
    html += '</div>';
    html += `<button onclick="startMatchingGame()" class="btn btn-success mt-start-btn">🚀 Boshlash</button>`;
    html += '</div>';
    
    // Score va Timer ko'rsatish
    html += '<div class="mt-game-header" id="mt-game-header" style="display: none;">';
    html += '<div class="mt-score-box" id="mt-score-box">';
    html += '<span class="mt-score-label">Ball:</span>';
    html += '<span class="mt-score-value" id="mt-score-value">0</span>';
    html += '</div>';
    html += '<div class="mt-progress-box">';
    html += '<span class="mt-progress-label">Topildi:</span>';
    html += '<span class="mt-progress-value" id="mt-progress-value">0/' + items.length + '</span>';
    html += '</div>';
    html += '<div class="mt-timer-box" id="mt-timer-box" style="display: none;">';
    html += '<span class="mt-timer-icon">⏱️</span>';
    html += '<span class="mt-timer-text" id="mt-timer-text">00</span>';
    html += '</div>';
    html += '</div>';
    
    html += '<h3 id="mt-instruction" style="display: none;">So\'zlarni sudrab, to\'g\'ri joyga qo\'ying:</h3>';
    html += '<div class="matching-container" id="mt-container" style="display: none;">';
    
    // Chap tomon - so'zlar (aralashtirilgan)
    html += '<div class="left-column">';
    shuffledItems.forEach(item => {
        html += `
            <div class="word-item" data-id="${item.id}">
                <div class="word-box">${item.word}</div>
                <div class="drop-zone" data-id="${item.id}" data-correct="${item.match}">
                    <span class="drop-hint">Bu yerga sudrang</span>
                </div>
            </div>
        `;
    });
    html += '</div>';
    
    // O'ng tomon - javoblar (drag qilinadigan)
    html += '<div class="right-column">';
    html += '<div class="draggable-items">';
    matches.forEach((match, index) => {
        html += `
            <div class="draggable-match" draggable="true" data-value="${match}" id="drag-${index}">
                ${match}
            </div>
        `;
    });
    html += '</div>';
    html += '</div>';
    
    html += '</div>';
    html += '</div>';
    contentArea.innerHTML = html;
}

// Matching o'yinini boshlash
function startMatchingGame() {
    const timePerWord = parseInt(document.getElementById('mt-time-per-word').value);
    
    // O'zgaruvchilarni boshlash
    mtScore = 0;
    mtCorrectCount = 0;
    mtTimePerWord = timePerWord;
    mtGameStarted = true;
    
    // Vaqt tanlash panelini yashirish
    document.getElementById('mt-timer-setup').style.display = 'none';
    
    // O'yin elementlarini ko'rsatish
    document.getElementById('mt-game-header').style.display = 'flex';
    document.getElementById('mt-instruction').style.display = 'block';
    document.getElementById('mt-container').style.display = 'grid';
    
    // Score va progress ni yangilash
    updateMatchingScoreDisplay();
    updateMatchingProgressDisplay();
    
    // Timer ni ko'rsatish va boshlash
    if (timePerWord > 0) {
        document.getElementById('mt-timer-box').style.display = 'flex';
        mtWordTimeLeft = timePerWord;
        updateMatchingTimerDisplay();
        startMatchingTimer();
    }
    
    // Drag and drop event listeners
    initDragAndDrop();
}

// Timer funksiyalari
function startMatchingTimer() {
    if (mtWordTimerInterval) {
        clearInterval(mtWordTimerInterval);
    }
    
    mtWordTimerInterval = setInterval(() => {
        mtWordTimeLeft--;
        updateMatchingTimerDisplay();
        
        if (mtWordTimeLeft <= 0) {
            // Vaqt tugadi - ball ayirish
            mtScore--;
            updateMatchingScoreDisplay();
            showMatchingScoreChange(-1);
            
            // Timerni qayta boshlash (agar hali juftliklar qolgan bo'lsa)
            if (mtCorrectCount < mtTotalWords) {
                mtWordTimeLeft = mtTimePerWord;
                updateMatchingTimerDisplay();
            } else {
                stopMatchingTimer();
            }
        }
    }, 1000);
}

function stopMatchingTimer() {
    if (mtWordTimerInterval) {
        clearInterval(mtWordTimerInterval);
        mtWordTimerInterval = null;
    }
}

function resetMatchingTimer() {
    if (mtTimePerWord > 0) {
        mtWordTimeLeft = mtTimePerWord;
        updateMatchingTimerDisplay();
    }
}

function updateMatchingTimerDisplay() {
    const timerEl = document.getElementById('mt-timer-text');
    if (timerEl) {
        timerEl.textContent = mtWordTimeLeft.toString().padStart(2, '0');
        
        timerEl.className = 'mt-timer-text';
        if (mtWordTimeLeft <= 5) {
            timerEl.classList.add('mt-timer-critical');
        } else if (mtWordTimeLeft <= 10) {
            timerEl.classList.add('mt-timer-warning');
        }
    }
}

function updateMatchingScoreDisplay() {
    const scoreEl = document.getElementById('mt-score-value');
    if (scoreEl) {
        scoreEl.textContent = mtScore;
        scoreEl.className = 'mt-score-value';
        if (mtScore > 0) {
            scoreEl.classList.add('mt-score-positive');
        } else if (mtScore < 0) {
            scoreEl.classList.add('mt-score-negative');
        }
    }
}

function updateMatchingProgressDisplay() {
    const progressEl = document.getElementById('mt-progress-value');
    if (progressEl) {
        progressEl.textContent = mtCorrectCount + '/' + mtTotalWords;
    }
}

function showMatchingScoreChange(change) {
    const scoreBox = document.getElementById('mt-score-box');
    if (!scoreBox) return;
    
    const popup = document.createElement('div');
    popup.className = `mt-score-popup ${change > 0 ? 'positive' : 'negative'}`;
    popup.textContent = change > 0 ? `+${change}` : change;
    scoreBox.appendChild(popup);
    
    setTimeout(() => popup.remove(), 1000);
}

// To'g'ri javobni tekshirish va natija ko'rsatish
function checkMatchingAnswer(dropZone, droppedValue) {
    if (!mtGameStarted) return false;
    
    const correctValue = dropZone.dataset.correct;
    const isCorrect = droppedValue === correctValue;
    
    if (isCorrect) {
        // To'g'ri javob
        mtScore++;
        mtCorrectCount++;
        showMatchingScoreChange(+1);
        
        // Yashil rang berish
        dropZone.classList.add('mt-correct');
        dropZone.querySelector('.draggable-match').classList.add('mt-answer-correct');
        
        // Progress va score yangilash
        updateMatchingScoreDisplay();
        updateMatchingProgressDisplay();
        
        // Timer qayta boshlash
        resetMatchingTimer();
        
        // Barcha juftliklar topildimi?
        if (mtCorrectCount === mtTotalWords) {
            stopMatchingTimer();
            showMatchingComplete();
        }
    } else {
        // Xato javob
        mtScore--;
        showMatchingScoreChange(-1);
        updateMatchingScoreDisplay();
        
        // Qizil rang berish (vaqtincha)
        dropZone.classList.add('mt-wrong');
        setTimeout(() => {
            dropZone.classList.remove('mt-wrong');
        }, 500);
    }
    
    return isCorrect;
}

function showMatchingComplete() {
    mtGameStarted = false;
    
    // Natija xabarini ko'rsatish
    const resultContainer = document.getElementById('result-container');
    const percentage = Math.round((mtCorrectCount / mtTotalWords) * 100);
    
    let message = '';
    let emoji = '';
    if (percentage === 100 && mtScore >= mtTotalWords) {
        emoji = '🏆';
        message = 'Ajoyib! Barcha juftliklarni to\'g\'ri topdingiz!';
    } else if (percentage === 100) {
        emoji = '🎉';
        message = 'Tabriklaymiz! Barcha juftliklarni topdingiz!';
    } else {
        emoji = '📊';
        message = 'O\'yin tugadi!';
    }
    
    resultContainer.innerHTML = `
        <div class="result-card ${percentage === 100 ? 'success' : 'partial'}">
            <h2>${emoji} ${message}</h2>
            <div class="mt-final-stats">
                <div class="mt-stat">
                    <span class="mt-stat-label">To\'g\'ri javoblar:</span>
                    <span class="mt-stat-value">${mtCorrectCount}/${mtTotalWords}</span>
                </div>
                <div class="mt-stat">
                    <span class="mt-stat-label">Yakuniy ball:</span>
                    <span class="mt-stat-value ${mtScore >= 0 ? 'positive' : 'negative'}">${mtScore}</span>
                </div>
            </div>
        </div>
    `;
    resultContainer.style.display = 'block';
    resultContainer.scrollIntoView({ behavior: 'smooth' });
}

function initDragAndDrop() {
    let draggedElement = null;
    
    // Drag elementlarni o'rnatish
    function setupDraggables() {
        const draggables = document.querySelectorAll('.draggable-match');
        
        draggables.forEach(draggable => {
            // Eski event listenerlarni olib tashlash uchun yangi element yaratish
            draggable.draggable = true;
            
            draggable.ondragstart = (e) => {
                draggedElement = draggable;
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', draggable.innerHTML);
                draggable.classList.add('dragging');
            };
            
            draggable.ondragend = (e) => {
                draggable.classList.remove('dragging');
            };
            
            // Drop zonedagi elementlarni qayta sudralishi uchun
            draggable.onclick = (e) => {
                if (draggable.parentElement.classList.contains('drop-zone')) {
                    // Agar to'g'ri javob bo'lsa, qaytarish mumkin emas
                    if (draggable.parentElement.classList.contains('mt-correct')) {
                        return;
                    }
                    // Elementni qaytarish
                    const originalContainer = document.querySelector('.draggable-items');
                    draggable.parentElement.innerHTML = '<span class="drop-hint">Bu yerga sudrang</span>';
                    originalContainer.appendChild(draggable);
                    draggable.style.display = 'block';
                }
            };
        });
    }
    
    const dropZones = document.querySelectorAll('.drop-zone');
    
    dropZones.forEach(zone => {
        zone.ondragover = (e) => {
            // Agar to'g'ri javob bo'lsa, qabul qilmaslik
            if (zone.classList.contains('mt-correct')) {
                e.dataTransfer.dropEffect = 'none';
                return false;
            }
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            zone.classList.add('drag-over');
            return false;
        };
        
        zone.ondragleave = (e) => {
            zone.classList.remove('drag-over');
        };
        
        zone.ondrop = (e) => {
            e.preventDefault();
            e.stopPropagation();
            zone.classList.remove('drag-over');
            
            // Agar to'g'ri javob bo'lsa, o'zgartirish mumkin emas
            if (zone.classList.contains('mt-correct')) {
                return false;
            }
            
            if (!draggedElement) return false;
            
            // Agar drop zone'da element bo'lsa, uni qaytarish
            const existingItem = zone.querySelector('.draggable-match');
            if (existingItem) {
                const originalContainer = document.querySelector('.draggable-items');
                originalContainer.appendChild(existingItem);
                existingItem.style.display = 'block';
            }
            
            // Yangi elementni joylashtirish
            zone.innerHTML = '';
            const newElement = draggedElement.cloneNode(true);
            newElement.dataset.value = draggedElement.dataset.value;
            zone.appendChild(newElement);
            
            // Original elementni yashirish
            draggedElement.style.display = 'none';
            
            // Javobni tekshirish (agar o'yin boshlangan bo'lsa)
            if (mtGameStarted) {
                checkMatchingAnswer(zone, newElement.dataset.value);
            }
            
            // Yangi elementga draggable qobiliyatini qo'shish
            setupDraggables();
            
            draggedElement = null;
            return false;
        };
    });
    
    // Boshlang'ich draggable elementlarni o'rnatish
    setupDraggables();
}

function loadFillGapsExercise(content, contentArea) {
    const words = content.words;
    
    // So'zlarni aralashtirish
    const shuffledWords = [...words].sort(() => Math.random() - 0.5);
    
    let html = '<div class="fillgaps-exercise">';
    html += '<h3>Tushirilgan harflarni to\'ldiring:</h3>';
    html += '<div class="words-grid">';
    
    shuffledWords.forEach((item) => {
        // So'zdagi har bir belgi uchun
        let wordHtml = '<span class="word-with-inputs">';
        let gapIndex = 0;
        
        for (let i = 0; i < item.word.length; i++) {
            const char = item.word[i];
            if (char === '_') {
                // Bo'sh joy - input qo'shamiz (bitta harf uchun)
                wordHtml += `<input type="text" class="char-input" data-id="${item.id}" data-gap="${gapIndex}" maxlength="1" />`;
                gapIndex++;
            } else {
                // Oddiy harf
                wordHtml += `<span class="char-display">${char}</span>`;
            }
        }
        wordHtml += '</span>';
        
        html += `
            <div class="word-gap-box" data-id="${item.id}" data-gaps="${gapIndex}">
                ${wordHtml}
            </div>
        `;
    });
    
    html += '</div>';
    html += '</div>';
    contentArea.innerHTML = html;
    
    // Input'lar orasida avtomatik o'tish
    setupCharInputs();
}

function setupCharInputs() {
    const inputs = document.querySelectorAll('.char-input');
    inputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            if (e.target.value.length === 1 && index < inputs.length - 1) {
                // Keyingi inputga o'tish
                const nextInput = inputs[index + 1];
                if (nextInput && nextInput.closest('.word-gap-box') === input.closest('.word-gap-box')) {
                    nextInput.focus();
                }
            }
        });
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
                // Oldingi inputga qaytish
                const prevInput = inputs[index - 1];
                if (prevInput && prevInput.closest('.word-gap-box') === input.closest('.word-gap-box')) {
                    prevInput.focus();
                }
            }
        });
    });
}

function loadMultipleChoiceExercise(content, contentArea) {
    const questions = content.questions;
    
    let html = '<div class="multiplechoice-exercise">';
    html += '<h3>To\'g\'ri javobni tanlang:</h3>';
    
    questions.forEach((question, qIndex) => {
        html += `
            <div class="mc-question" data-index="${qIndex}">
                <div class="question-text">${qIndex + 1}. ${question.question}</div>
                <div class="mc-options">
        `;
        
        question.options.forEach((option, oIndex) => {
            html += `
                <div class="mc-option">
                    <input type="radio" name="question-${qIndex}" value="${oIndex}" id="q${qIndex}-o${oIndex}">
                    <label for="q${qIndex}-o${oIndex}">${option}</label>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    contentArea.innerHTML = html;
}

async function checkAnswers() {
    const container = document.querySelector('.exercise-container');
    const exerciseId = container.dataset.exerciseId;
    const exerciseType = container.dataset.exerciseType;
    
    const answers = {};

    if (exerciseType === 'matching') {
        // Drag-and-drop natijalarini yig'ish
        const dropZones = document.querySelectorAll('.drop-zone');
        dropZones.forEach(zone => {
            const id = zone.dataset.id;
            const droppedItem = zone.querySelector('.draggable-match');
            answers[id] = droppedItem ? droppedItem.dataset.value : '';
        });
    } else if (exerciseType === 'fill_gaps') {
        // Har bir so'z uchun javoblarni yig'ish
        const wordBoxes = document.querySelectorAll('.word-gap-box');
        wordBoxes.forEach(box => {
            const id = box.dataset.id;
            const charInputs = box.querySelectorAll('.char-input');
            let userAnswer = '';
            charInputs.forEach(input => {
                userAnswer += input.value || '';
            });
            answers[id] = userAnswer;
        });
    } else if (exerciseType === 'multiple_choice') {
        const questions = document.querySelectorAll('.mc-question');
        questions.forEach((question, index) => {
            const selected = question.querySelector('input[type="radio"]:checked');
            if (selected) {
                answers[index] = parseInt(selected.value);
            }
        });
    } else if (exerciseType === 'word_search') {
        // Word Search o'zi avtomatik tekshiradi
        // Topilgan so'zlar sonini ko'rsatish
        const foundWords = document.querySelectorAll('.ws-word-found').length;
        const totalWords = document.querySelectorAll('.ws-word').length;
        
        const resultContainer = document.getElementById('result-container');
        const score = Math.round((foundWords / totalWords) * 100);
        
        resultContainer.innerHTML = `
            <div class="result-card ${score === 100 ? 'success' : 'partial'}">
                <h2>${score === 100 ? '🎉 Tabriklaymiz!' : '📊 Natija'}</h2>
                <p>${foundWords} / ${totalWords} so'z topildi</p>
                <div class="score-display">
                    <span class="score">${score}%</span>
                </div>
            </div>
        `;
        resultContainer.style.display = 'block';
        resultContainer.scrollIntoView({ behavior: 'smooth' });
        return; // Serverga yubormaslik
    } else if (exerciseType === 'crossword') {
        // Crossword tekshirish
        const result = checkCrosswordAnswers();
        
        const resultContainer = document.getElementById('result-container');
        resultContainer.innerHTML = `
            <div class="result-card ${result.score === 100 ? 'success' : result.score >= 50 ? 'partial' : 'poor'}">
                <h2>${result.score === 100 ? '🎉 Tabriklaymiz!' : '📊 Natija'}</h2>
                <p>${result.correct} / ${result.total} so'z to'g'ri</p>
                <div class="score-display">
                    <span class="score">${result.score}%</span>
                </div>
            </div>
        `;
        resultContainer.style.display = 'block';
        resultContainer.scrollIntoView({ behavior: 'smooth' });
        return; // Serverga yubormaslik
    }

    try {
        const response = await fetch('/api/check_answer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                exercise_id: exerciseId,
                answers: answers
            })
        });

        const result = await response.json();
        displayResults(result);
    } catch (error) {
        console.error('Error:', error);
        alert('Xatolik yuz berdi!');
    }
}

function displayResults(result) {
    const resultContainer = document.getElementById('result-container');
    const scoreDisplay = document.getElementById('score-display');
    const detailedResults = document.getElementById('detailed-results');
    
    // Score ko'rsatish
    const score = result.score;
    let scoreClass = 'score-poor';
    if (score >= 80) scoreClass = 'score-excellent';
    else if (score >= 60) scoreClass = 'score-good';
    
    scoreDisplay.innerHTML = `
        <div class="${scoreClass}">
            ${score}%
        </div>
    `;
    
    // Batafsil natijalar
    const container = document.querySelector('.exercise-container');
    const exerciseType = container.dataset.exerciseType;
    const content = exerciseData;
    
    let html = '';
    
    result.results.forEach((item, index) => {
        const correctClass = item.correct ? 'correct' : 'incorrect';
        const statusText = item.correct ? '✓ To\'g\'ri' : '❌ Noto\'g\'ri';
        
        html += `<div class="result-item ${correctClass}">`;
        html += `<div class="status">${statusText}</div>`;
        
        if (exerciseType === 'matching') {
            const originalItem = content.items.find(i => i.id === item.id);
            html += `<div><strong>${originalItem.word}</strong> → <strong>${item.correct_answer}</strong></div>`;
        } else if (exerciseType === 'fill_gaps') {
            html += `<div>Bo'sh joy ${index + 1}: <strong>${item.correct_answer}</strong></div>`;
        } else if (exerciseType === 'multiple_choice') {
            const question = content.questions[index];
            html += `<div><strong>${question.question}</strong></div>`;
            html += `<div>To'g'ri javob: <strong>${question.options[item.correct_answer]}</strong></div>`;
        }
        
        html += '</div>';
    });
    
    detailedResults.innerHTML = html;
    resultContainer.style.display = 'block';
    
    // Natijaga scroll qilish
    resultContainer.scrollIntoView({ behavior: 'smooth' });
}

function resetExercise() {
    const container = document.querySelector('.exercise-container');
    const exerciseType = container.dataset.exerciseType;
    
    if (exerciseType === 'matching') {
        // Timerni to'xtatish
        stopMatchingTimer();
        mtGameStarted = false;
        mtScore = 0;
        mtCorrectCount = 0;
        mtWordTimeLeft = 0;
        
        // Matching ni qayta yuklash
        const contentArea = document.getElementById('exercise-content');
        loadMatchingExercise(exerciseData, contentArea);
    } else if (exerciseType === 'fill_gaps') {
        document.querySelectorAll('.char-input').forEach(input => {
            input.value = '';
        });
    } else if (exerciseType === 'multiple_choice') {
        document.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.checked = false;
        });
    } else if (exerciseType === 'word_search') {
        // Timerni to'xtatish
        stopWordSearchTimer();
        wsGameStarted = false;
        wsTimeLeft = 0;
        wsScore = 0;
        wsFoundCount = 0;
        
        // Word Search ni yangi variant bilan qayta yuklash
        const contentArea = document.getElementById('exercise-content');
        loadWordSearchExercise(exerciseData, contentArea, true); // true = yangi variant
    } else if (exerciseType === 'crossword') {
        // Crossword ni qayta yuklash - yangi variant bilan
        stopCrosswordTimer();
        cwGameStarted = false;
        cwTimeLeft = 0;
        cwScore = 0;
        cwCorrectCount = 0;
        cwSelectedCell = null;
        cwSelectedDirection = null;
        cwPlacedWords = new Set();
        // Yangi variantlar yaratish - har safar turli tartib
        cwVariants = [];
        const contentArea = document.getElementById('exercise-content');
        loadCrosswordExercise(exerciseData, contentArea);
    }
    
    // Natijalarni yashirish
    document.getElementById('result-container').style.display = 'none';
    
    // Yuqoriga scroll qilish
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Matching Exercise Timer va Ball tizimi
let mtTimerInterval = null;
let mtWordTimerInterval = null;
let mtTimeLeft = 0;
let mtWordTimeLeft = 0;
let mtGameStarted = false;
let mtScore = 0;
let mtTimePerWord = 0;
let mtTotalWords = 0;
let mtCorrectCount = 0;
let mtItems = []; // So'zlar ro'yxati

// Word Search mashqi
let wsTimerInterval = null;
let wsWordTimerInterval = null;
let wsTimeLeft = 0;
let wsWordTimeLeft = 0;
let wsGameStarted = false;
let wsScore = 0;
let wsTimePerWord = 0;
let wsTotalWords = 0;
let wsFoundCount = 0;
let wsGridVariants = []; // 5 xil grid varianti
let wsCurrentVariant = 0; // Joriy variant indeksi
let wsWordPositions = []; // So'zlarning grid dagi joylashuvi
let wsFoundWords = new Set(); // Topilgan so'zlar

// Ikki kishilik musobaqa o'zgaruvchilari
let wsBattleMode = false;
let wsBattlePlayers = ['O\'yinchi 1', 'O\'yinchi 2'];
let wsBattleScores = [0, 0];
let wsBattleCurrentPlayer = 0; // 0 yoki 1
let wsBattleTimePerWord = 30;
let wsBattleWordsFound = [[], []]; // Har bir o'yinchi topgan so'zlar
let wsTranslations = {}; // So'zlarning tarjimalari
let wsTranslationBonus = [0, 0]; // Tarjima uchun qo'shimcha ball

// Word Search grid generator funksiyasi - so'z joylashuvlarini ham qaytaradi
function generateWordSearchGrid(words, gridSize) {
    // Bo'sh grid yaratish
    const grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(''));
    const wordPositions = []; // So'zlarning joylashuvi
    
    // Yo'nalishlar: horizontal, vertical, diagonal (8 ta yo'nalish)
    const directions = [
        { dx: 1, dy: 0 },   // o'ngga
        { dx: -1, dy: 0 },  // chapga
        { dx: 0, dy: 1 },   // pastga
        { dx: 0, dy: -1 },  // yuqoriga
        { dx: 1, dy: 1 },   // o'ng-past diagonal
        { dx: -1, dy: -1 }, // chap-yuqori diagonal
        { dx: 1, dy: -1 },  // o'ng-yuqori diagonal
        { dx: -1, dy: 1 }   // chap-past diagonal
    ];
    
    // So'zlarni joylashtirish
    words.forEach(word => {
        let placed = false;
        let attempts = 0;
        const maxAttempts = 100;
        
        while (!placed && attempts < maxAttempts) {
            attempts++;
            const dir = directions[Math.floor(Math.random() * directions.length)];
            const startX = Math.floor(Math.random() * gridSize);
            const startY = Math.floor(Math.random() * gridSize);
            
            // So'z sig'ishini tekshirish
            const endX = startX + dir.dx * (word.length - 1);
            const endY = startY + dir.dy * (word.length - 1);
            
            if (endX < 0 || endX >= gridSize || endY < 0 || endY >= gridSize) {
                continue;
            }
            
            // To'qnashuvni tekshirish
            let canPlace = true;
            for (let i = 0; i < word.length; i++) {
                const x = startX + dir.dx * i;
                const y = startY + dir.dy * i;
                const currentChar = grid[y][x];
                if (currentChar !== '' && currentChar !== word[i]) {
                    canPlace = false;
                    break;
                }
            }
            
            if (canPlace) {
                // So'zni joylashtirish va joylashuvni saqlash
                const positions = [];
                for (let i = 0; i < word.length; i++) {
                    const x = startX + dir.dx * i;
                    const y = startY + dir.dy * i;
                    grid[y][x] = word[i];
                    positions.push({ x, y, char: word[i] });
                }
                wordPositions.push({ word, positions });
                placed = true;
            }
        }
    });
    
    // Bo'sh joylarni random harflar bilan to'ldirish
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            if (grid[y][x] === '') {
                grid[y][x] = alphabet[Math.floor(Math.random() * alphabet.length)];
            }
        }
    }
    
    return { grid, wordPositions };
}

// 5 xil variant yaratish
function generateGridVariants(words, gridSize, count = 5) {
    const variants = [];
    for (let i = 0; i < count; i++) {
        variants.push(generateWordSearchGrid(words, gridSize));
    }
    return variants;
}

// Mavjud gridda so'zlarning joylashuvini topish
function findWordPositionsInGrid(grid, words) {
    const wordPositions = [];
    const gridSize = grid.length;
    const directions = [
        { dx: 1, dy: 0 },   // o'ngga
        { dx: -1, dy: 0 },  // chapga
        { dx: 0, dy: 1 },   // pastga
        { dx: 0, dy: -1 },  // yuqoriga
        { dx: 1, dy: 1 },   // o'ng-past diagonal
        { dx: -1, dy: -1 }, // chap-yuqori diagonal
        { dx: 1, dy: -1 },  // o'ng-yuqori diagonal
        { dx: -1, dy: 1 }   // chap-past diagonal
    ];
    
    words.forEach(word => {
        let found = false;
        for (let y = 0; y < gridSize && !found; y++) {
            for (let x = 0; x < gridSize && !found; x++) {
                if (grid[y][x] === word[0]) {
                    for (const dir of directions) {
                        const positions = [];
                        let match = true;
                        for (let i = 0; i < word.length; i++) {
                            const nx = x + dir.dx * i;
                            const ny = y + dir.dy * i;
                            if (nx < 0 || nx >= gridSize || ny < 0 || ny >= gridSize || grid[ny][nx] !== word[i]) {
                                match = false;
                                break;
                            }
                            positions.push({ x: nx, y: ny, char: word[i] });
                        }
                        if (match) {
                            wordPositions.push({ word, positions });
                            found = true;
                            break;
                        }
                    }
                }
            }
        }
    });
    
    return wordPositions;
}

// Yordam ko'rsatish funksiyasi
function showHint() {
    if (!wsGameStarted) return;
    
    // Topilmagan so'zlarni topish
    const unfoundWords = wsWordPositions.filter(wp => !wsFoundWords.has(wp.word));
    
    if (unfoundWords.length === 0) {
        return; // Barcha so'zlar topilgan
    }
    
    // Random topilmagan so'zni tanlash
    const randomWordData = unfoundWords[Math.floor(Math.random() * unfoundWords.length)];
    
    // Shu so'zning random harfini tanlash
    const randomPos = randomWordData.positions[Math.floor(Math.random() * randomWordData.positions.length)];
    
    // Harfni yoritish
    const cell = document.querySelector(`.ws-cell[data-x="${randomPos.x}"][data-y="${randomPos.y}"]`);
    if (cell) {
        cell.classList.add('ws-hint-highlight');
        // 2 soniyadan keyin yoritishni olib tashlash
        setTimeout(() => {
            cell.classList.remove('ws-hint-highlight');
        }, 2000);
    }
    
    // Har bir yordam uchun -0.5 ball
    if (wsTimePerWord > 0) {
        wsScore -= 0.5;
        updateScoreDisplay();
        showScoreChange(-0.5);
    }
}

function loadWordSearchExercise(content, contentArea, useNewVariant = false) {
    // Ma'lumotlarni tekshirish
    if (!content || !content.grid || !content.words || !content.gridSize) {
        contentArea.innerHTML = '<div class="error-message"><h3>❌ Xatolik!</h3><p>Word Search ma\'lumotlari topilmadi. Mashqni qaytadan yarating.</p></div>';
        console.error('Word Search content error:', content);
        return;
    }
    
    const words = content.words;
    const gridSize = content.gridSize;
    
    // Birinchi marta yuklanganda 5 ta variant yaratish
    if (wsGridVariants.length === 0) {
        // Dastlabki grid uchun so'z joylashuvlarini hisoblash
        const originalPositions = findWordPositionsInGrid(content.grid, words);
        wsGridVariants.push({ grid: content.grid, wordPositions: originalPositions });
        // Qo'shimcha 4 ta variant yaratish
        for (let i = 0; i < 4; i++) {
            wsGridVariants.push(generateWordSearchGrid(words, gridSize));
        }
        // Birinchi marta ham random variant tanlash
        wsCurrentVariant = Math.floor(Math.random() * wsGridVariants.length);
    }
    
    // Yangi variant kerak bo'lsa - random tanlash
    if (useNewVariant) {
        // Joriy variantdan boshqa random variant tanlash
        let newVariant;
        do {
            newVariant = Math.floor(Math.random() * wsGridVariants.length);
        } while (newVariant === wsCurrentVariant && wsGridVariants.length > 1);
        wsCurrentVariant = newVariant;
    }
    
    const currentVariant = wsGridVariants[wsCurrentVariant];
    const grid = currentVariant.grid;
    wsWordPositions = currentVariant.wordPositions;
    wsFoundWords = new Set(); // Topilgan so'zlarni tozalash

    let html = '<div class="wordsearch-exercise">';
    
    // Rejim tanlash paneli
    html += '<div class="ws-mode-select" id="ws-mode-select">';
    html += '<h3>🎮 O\'yin rejimini tanlang:</h3>';
    html += '<div class="ws-mode-buttons">';
    html += '<button onclick="showSinglePlayerSetup()" class="btn btn-primary ws-mode-btn">';
    html += '<span class="mode-icon">👤</span>';
    html += '<span class="mode-title">Yakka o\'yin</span>';
    html += '<span class="mode-desc">Yolg\'iz o\'ynash</span>';
    html += '</button>';
    html += '<button onclick="showBattleSetup()" class="btn btn-danger ws-mode-btn">';
    html += '<span class="mode-icon">⚔️</span>';
    html += '<span class="mode-title">Musobaqa</span>';
    html += '<span class="mode-desc">Ikki kishilik</span>';
    html += '</button>';
    html += '</div>';
    html += '</div>';
    
    // Yakka o'yin - Vaqt tanlash paneli
    html += '<div class="ws-timer-setup" id="ws-timer-setup" style="display: none;">';
    html += '<h3>⏱️ Vaqt limitini tanlang:</h3>';
    html += '<div class="ws-time-options">';
    html += '<div class="ws-time-group">';
    html += '<label>Har bir so\'z uchun:</label>';
    html += '<select id="ws-time-per-word">';
    html += '<option value="0">Limitsiz</option>';
    html += '<option value="20">20 soniya</option>';
    html += '<option value="30">30 soniya</option>';
    html += '<option value="45">45 soniya</option>';
    html += '<option value="60">1 daqiqa</option>';
    html += '<option value="90">1.5 daqiqa</option>';
    html += '<option value="120">2 daqiqa</option>';
    html += '<option value="180">3 daqiqa</option>';
    html += '</select>';
    html += '<small class="ws-hint">⚡ Vaqtida topilsa +1 ball, topilmasa -1 ball</small>';
    html += '</div>';
    html += '<div class="ws-time-group">';
    html += '<label>Umumiy vaqt:</label>';
    html += '<select id="ws-time-total">';
    html += '<option value="0">Limitsiz</option>';
    for (let i = 1; i <= 10; i++) {
        html += `<option value="${i}">${i} daqiqa</option>`;
    }
    html += '</select>';
    html += '</div>';
    html += '</div>';
    html += '<div class="ws-setup-buttons">';
    html += '<button onclick="showModeSelect()" class="btn btn-secondary">⬅️ Orqaga</button>';
    html += '<button onclick="startWordSearch()" class="btn btn-success ws-start-btn">🚀 Boshlash</button>';
    html += '</div>';
    html += '</div>';
    
    // Musobaqa rejimi sozlamalari
    html += '<div class="ws-battle-setup" id="ws-battle-setup" style="display: none;">';
    html += '<h3>⚔️ Musobaqa sozlamalari:</h3>';
    html += '<div class="ws-battle-players">';
    html += '<div class="ws-player-input">';
    html += '<label>🔵 1-O\'yinchi ismi:</label>';
    html += '<input type="text" id="ws-player1-name" value="O\'yinchi 1" maxlength="15">';
    html += '</div>';
    html += '<div class="ws-player-input">';
    html += '<label>🔴 2-O\'yinchi ismi:</label>';
    html += '<input type="text" id="ws-player2-name" value="O\'yinchi 2" maxlength="15">';
    html += '</div>';
    html += '</div>';
    html += '<div class="ws-battle-time">';
    html += '<label>⏱️ Har bir so\'z uchun vaqt:</label>';
    html += '<select id="ws-battle-time">';
    html += '<option value="15">15 soniya</option>';
    html += '<option value="20">20 soniya</option>';
    html += '<option value="30" selected>30 soniya</option>';
    html += '<option value="45">45 soniya</option>';
    html += '<option value="60">1 daqiqa</option>';
    html += '</select>';
    html += '</div>';
    html += '<p class="ws-battle-rules">📋 Qoidalar: Har bir o\'yinchi navbatma-navbat so\'z topadi. Topilgan so\'zga +1 ball, vaqt tugasa -1 ball. Kim birinchi boshlashi tasodifiy tanlanadi.</p>';
    html += '<div class="ws-setup-buttons">';
    html += '<button onclick="showModeSelect()" class="btn btn-secondary">⬅️ Orqaga</button>';
    html += '<button onclick="startBattleMode()" class="btn btn-danger ws-start-btn">⚔️ Musobaqani boshlash</button>';
    html += '</div>';
    html += '</div>';

    // Yakka o'yin - Score va Timer ko'rsatish
    html += '<div class="ws-game-header" id="ws-game-header" style="display: none;">';
    html += '<div class="ws-score-box" id="ws-score-box">';
    html += '<span class="ws-score-label">Ball:</span>';
    html += '<span class="ws-score-value" id="ws-score-value">0</span>';
    html += '</div>';
    html += '<button onclick="showHint()" class="btn ws-hint-btn" id="ws-hint-btn">💡 Yordam</button>';
    html += '<div class="ws-timer-box">';
    html += '<span class="ws-timer-icon">⏱️</span>';
    html += '<span class="ws-timer-text" id="ws-timer-text">00:00</span>';
    html += '</div>';
    html += '<div class="ws-word-timer-box" id="ws-word-timer-box" style="display: none;">';
    html += '<span class="ws-word-timer-label">So\'z vaqti:</span>';
    html += '<span class="ws-word-timer-text" id="ws-word-timer-text">00</span>';
    html += '</div>';
    html += '</div>';
    
    // Musobaqa rejimi - Game Header
    html += '<div class="ws-battle-header" id="ws-battle-header" style="display: none;">';
    html += '<div class="ws-battle-player ws-player1" id="ws-battle-player1">';
    html += '<span class="ws-player-icon">🔵</span>';
    html += '<span class="ws-player-name" id="ws-player1-display">O\'yinchi 1</span>';
    html += '<span class="ws-player-score" id="ws-player1-score">0</span>';
    html += '</div>';
    html += '<div class="ws-battle-vs">VS</div>';
    html += '<div class="ws-battle-player ws-player2" id="ws-battle-player2">';
    html += '<span class="ws-player-icon">🔴</span>';
    html += '<span class="ws-player-name" id="ws-player2-display">O\'yinchi 2</span>';
    html += '<span class="ws-player-score" id="ws-player2-score">0</span>';
    html += '</div>';
    html += '</div>';
    
    // Musobaqa - joriy o'yinchi va timer
    html += '<div class="ws-battle-turn" id="ws-battle-turn" style="display: none;">';
    html += '<div class="ws-current-player" id="ws-current-player">';
    html += '<span class="ws-turn-icon" id="ws-turn-icon">🔵</span>';
    html += '<span class="ws-turn-name" id="ws-turn-name">O\'yinchi 1</span>';
    html += '<span class="ws-turn-label">navbati</span>';
    html += '</div>';
    html += '<button onclick="showBattleHint()" class="btn ws-battle-hint-btn" id="ws-battle-hint-btn">💡 Yordam (-1)</button>';
    html += '<div class="ws-battle-timer">';
    html += '<span class="ws-battle-timer-icon">⏱️</span>';
    html += '<span class="ws-battle-timer-text" id="ws-battle-timer-text">30</span>';
    html += '</div>';
    html += '</div>';
    
    // Tarjimalar mavjudligini tekshirish
    const hasTranslations = content.translations && Object.keys(content.translations).length > 0;
    wsTranslations = content.translations || {};
    
    // So'zlar ro'yxati (tarjimalar bilan)
    html += '<div class="ws-words-to-find" id="ws-words-section" style="display: none;">';
    html += '<h3>Quyidagi so\'zlarni toping:</h3>';
    html += '<div class="ws-word-list">';
    words.forEach(word => {
        html += `<span class="ws-word" data-word="${word}">${word}</span>`;
    });
    html += '</div>';
    
    // Tarjimalar ro'yxati (aralashtirilgan holda)
    if (hasTranslations) {
        html += '<div class="ws-translations-section" id="ws-translations-section">';
        html += '<h4>📝 Tarjimalarni tanlang:</h4>';
        html += '<div class="ws-translation-list" id="ws-translation-list">';
        // Tarjimalarni aralashtirib ko'rsatish
        const shuffledTranslations = Object.entries(wsTranslations)
            .map(([word, translation]) => ({ word, translation }))
            .sort(() => Math.random() - 0.5);
        shuffledTranslations.forEach(item => {
            html += `<span class="ws-translation-item" data-word="${item.word}" data-translation="${item.translation}">${item.translation}</span>`;
        });
        html += '</div>';
        html += '</div>';
    }
    html += '</div>';
    
    // Grid (yashirin)
    html += `<div class="ws-grid" id="ws-grid" data-size="${gridSize}" style="display: none;">`;
    for (let y = 0; y < gridSize; y++) {
        html += '<div class="ws-row">';
        for (let x = 0; x < gridSize; x++) {
            html += `<div class="ws-cell" data-x="${x}" data-y="${y}">${grid[y][x]}</div>`;
        }
        html += '</div>';
    }
    html += '</div>';
    
    html += '<p class="ws-instruction" id="ws-instruction" style="display: none;">💡 So\'zni topish uchun birinchi harfdan oxirgi harfgacha sichqonchani bosib suring</p>';
    html += '</div>';
    
    contentArea.innerHTML = html;
    
    // Global o'zgaruvchilarni saqlash
    window.wsWords = words;
    window.wsGridSize = gridSize;
    window.wsTranslations = content.translations || {};
}

// Musobaqa rejimi uchun yordam
function showBattleHint() {
    if (!wsGameStarted) return;
    
    // Topilmagan so'zlarni topish
    const unfoundWords = wsWordPositions.filter(wp => !wsFoundWords.has(wp.word));
    
    if (unfoundWords.length === 0) {
        return;
    }
    
    // Random topilmagan so'zni tanlash
    const randomWordData = unfoundWords[Math.floor(Math.random() * unfoundWords.length)];
    
    // Shu so'zning random 2 ta harfini tanlash
    const positions = [...randomWordData.positions].sort(() => Math.random() - 0.5).slice(0, 2);
    
    positions.forEach(pos => {
        const cell = document.querySelector(`.ws-cell[data-x="${pos.x}"][data-y="${pos.y}"]`);
        if (cell) {
            cell.classList.add('ws-hint-highlight');
            setTimeout(() => {
                cell.classList.remove('ws-hint-highlight');
            }, 2000);
        }
    });
    
    // Yordam uchun -1 ball
    wsBattleScores[wsBattleCurrentPlayer]--;
    updateBattleScores();
    showBattleScoreChange(wsBattleCurrentPlayer, -1);
}

// Tarjima tanlash modali
let wsCurrentWordForTranslation = null;
let wsTranslationCallback = null;

function showTranslationModal(word, callback) {
    wsCurrentWordForTranslation = word;
    wsTranslationCallback = callback;
    
    // Modal yaratish
    let modal = document.getElementById('ws-translation-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'ws-translation-modal';
        modal.className = 'ws-translation-modal';
        document.body.appendChild(modal);
    }
    
    // Barcha tarjimalarni aralashtirib ko'rsatish
    const allTranslations = Object.entries(window.wsTranslations || {});
    const shuffled = allTranslations.sort(() => Math.random() - 0.5);
    
    let optionsHtml = '';
    shuffled.forEach(([w, t]) => {
        optionsHtml += `<button class="ws-trans-option" data-word="${w}" onclick="selectTranslation('${w}')">${t}</button>`;
    });
    
    modal.innerHTML = `
        <div class="ws-translation-modal-content">
            <h3>🎯 "${word}" so'zining tarjimasini toping!</h3>
            <p>To'g'ri tarjimani tanlang (+2 ball)</p>
            <div class="ws-trans-options">
                ${optionsHtml}
            </div>
            <button class="btn btn-secondary ws-skip-trans" onclick="skipTranslation()">⏭️ O'tkazib yuborish</button>
        </div>
    `;
    
    modal.style.display = 'flex';
    
    // Timer ni pauza qilish
    if (wsWordTimerInterval) {
        clearInterval(wsWordTimerInterval);
    }
}

function selectTranslation(selectedWord) {
    const modal = document.getElementById('ws-translation-modal');
    const isCorrect = selectedWord === wsCurrentWordForTranslation;
    
    if (isCorrect) {
        // To'g'ri! +2 ball
        if (wsBattleMode) {
            wsBattleScores[wsBattleCurrentPlayer] += 2;
            wsBattleTranslationBonus[wsBattleCurrentPlayer] += 2;
            updateBattleScores();
            showBattleScoreChange(wsBattleCurrentPlayer, +2);
        } else {
            wsScore += 2;
            updateScoreDisplay();
            showScoreChange(+2);
        }
        
        // Yashil animatsiya
        modal.querySelector('.ws-translation-modal-content').classList.add('correct-answer');
    } else {
        // Noto'g'ri
        modal.querySelector('.ws-translation-modal-content').classList.add('wrong-answer');
    }
    
    // Modalni yopish
    setTimeout(() => {
        modal.style.display = 'none';
        if (wsTranslationCallback) {
            wsTranslationCallback();
        }
    }, 800);
}

function skipTranslation() {
    const modal = document.getElementById('ws-translation-modal');
    modal.style.display = 'none';
    
    if (wsTranslationCallback) {
        wsTranslationCallback();
    }
}

// Rejim tanlash funksiyalari
function showModeSelect() {
    document.getElementById('ws-mode-select').style.display = 'block';
    document.getElementById('ws-timer-setup').style.display = 'none';
    document.getElementById('ws-battle-setup').style.display = 'none';
}

function showSinglePlayerSetup() {
    document.getElementById('ws-mode-select').style.display = 'none';
    document.getElementById('ws-timer-setup').style.display = 'block';
    document.getElementById('ws-battle-setup').style.display = 'none';
    wsBattleMode = false;
}

function showBattleSetup() {
    document.getElementById('ws-mode-select').style.display = 'none';
    document.getElementById('ws-timer-setup').style.display = 'none';
    document.getElementById('ws-battle-setup').style.display = 'block';
    wsBattleMode = true;
}

// Musobaqa rejimini boshlash
function startBattleMode() {
    const player1Name = document.getElementById('ws-player1-name').value.trim() || 'O\'yinchi 1';
    const player2Name = document.getElementById('ws-player2-name').value.trim() || 'O\'yinchi 2';
    const timePerWord = parseInt(document.getElementById('ws-battle-time').value);
    
    // O'zgaruvchilarni boshlash
    wsBattleMode = true;
    wsBattlePlayers = [player1Name, player2Name];
    wsBattleScores = [0, 0];
    wsBattleTranslationBonus = [0, 0]; // Tarjima bonuslari
    wsBattleTimePerWord = timePerWord;
    wsBattleWordsFound = [[], []];
    wsFoundWords = new Set();
    wsFoundCount = 0;
    wsTotalWords = window.wsWords.length;
    
    // Tasodifiy ravishda kim birinchi boshlashini aniqlash
    wsBattleCurrentPlayer = Math.random() < 0.5 ? 0 : 1;
    
    // Setup panellarini yashirish
    document.getElementById('ws-mode-select').style.display = 'none';
    document.getElementById('ws-battle-setup').style.display = 'none';
    
    // Musobaqa elementlarini ko'rsatish
    document.getElementById('ws-battle-header').style.display = 'flex';
    document.getElementById('ws-battle-turn').style.display = 'flex';
    document.getElementById('ws-words-section').style.display = 'block';
    document.getElementById('ws-grid').style.display = 'inline-block';
    document.getElementById('ws-instruction').style.display = 'block';
    
    // O'yinchi ismlarini ko'rsatish
    document.getElementById('ws-player1-display').textContent = player1Name;
    document.getElementById('ws-player2-display').textContent = player2Name;
    
    // Joriy o'yinchini ko'rsatish
    updateBattleTurn();
    
    // Balllarni yangilash
    updateBattleScores();
    
    // Timerni boshlash
    wsWordTimeLeft = timePerWord;
    updateBattleTimerDisplay();
    startBattleTimer();
    
    wsGameStarted = true;
    
    // Selection funksionalligi
    initWordSearchSelection(window.wsWords);
}

// Musobaqa timer
function startBattleTimer() {
    if (wsWordTimerInterval) {
        clearInterval(wsWordTimerInterval);
    }
    
    wsWordTimerInterval = setInterval(() => {
        wsWordTimeLeft--;
        updateBattleTimerDisplay();
        
        if (wsWordTimeLeft <= 0) {
            // Vaqt tugadi - joriy o'yinchidan ball ayirish
            wsBattleScores[wsBattleCurrentPlayer]--;
            updateBattleScores();
            showBattleScoreChange(wsBattleCurrentPlayer, -1);
            
            // Navbatni o'zgartirish
            switchBattleTurn();
        }
    }, 1000);
}

function updateBattleTimerDisplay() {
    const timerEl = document.getElementById('ws-battle-timer-text');
    if (timerEl) {
        timerEl.textContent = wsWordTimeLeft.toString().padStart(2, '0');
        
        timerEl.className = 'ws-battle-timer-text';
        if (wsWordTimeLeft <= 5) {
            timerEl.classList.add('ws-battle-timer-critical');
        } else if (wsWordTimeLeft <= 10) {
            timerEl.classList.add('ws-battle-timer-warning');
        }
    }
}

function updateBattleTurn() {
    const turnIcon = document.getElementById('ws-turn-icon');
    const turnName = document.getElementById('ws-turn-name');
    const turnBox = document.getElementById('ws-current-player');
    
    if (wsBattleCurrentPlayer === 0) {
        turnIcon.textContent = '🔵';
        turnBox.className = 'ws-current-player player1-turn';
    } else {
        turnIcon.textContent = '🔴';
        turnBox.className = 'ws-current-player player2-turn';
    }
    turnName.textContent = wsBattlePlayers[wsBattleCurrentPlayer];
    
    // O'yinchi kartalarini yoritish
    document.getElementById('ws-battle-player1').classList.toggle('active-player', wsBattleCurrentPlayer === 0);
    document.getElementById('ws-battle-player2').classList.toggle('active-player', wsBattleCurrentPlayer === 1);
}

function updateBattleScores() {
    document.getElementById('ws-player1-score').textContent = wsBattleScores[0];
    document.getElementById('ws-player2-score').textContent = wsBattleScores[1];
    
    // Rang berish
    const score1El = document.getElementById('ws-player1-score');
    const score2El = document.getElementById('ws-player2-score');
    
    score1El.className = 'ws-player-score';
    score2El.className = 'ws-player-score';
    
    if (wsBattleScores[0] > 0) score1El.classList.add('positive');
    else if (wsBattleScores[0] < 0) score1El.classList.add('negative');
    
    if (wsBattleScores[1] > 0) score2El.classList.add('positive');
    else if (wsBattleScores[1] < 0) score2El.classList.add('negative');
}

function showBattleScoreChange(playerIndex, change) {
    const scoreEl = document.getElementById(`ws-player${playerIndex + 1}-score`);
    if (!scoreEl) return;
    
    const popup = document.createElement('div');
    popup.className = `ws-battle-score-popup ${change > 0 ? 'positive' : 'negative'}`;
    popup.textContent = change > 0 ? `+${change}` : change;
    scoreEl.parentElement.appendChild(popup);
    
    setTimeout(() => popup.remove(), 1000);
}

function switchBattleTurn() {
    // Navbatni o'zgartirish
    wsBattleCurrentPlayer = wsBattleCurrentPlayer === 0 ? 1 : 0;
    updateBattleTurn();
    
    // Timerni qayta boshlash
    wsWordTimeLeft = wsBattleTimePerWord;
    startBattleTimer(); // Timer intervalini qayta ishga tushirish
}

// Musobaqa tugashi
function showBattleComplete() {
    stopWordSearchTimer();
    wsGameStarted = false;
    wsBattleMode = false;
    
    const winner = wsBattleScores[0] > wsBattleScores[1] ? 0 : 
                   wsBattleScores[1] > wsBattleScores[0] ? 1 : -1;
    
    let resultMessage = '';
    let resultEmoji = '';
    
    if (winner === -1) {
        resultEmoji = '🤝';
        resultMessage = 'Durrang!';
    } else {
        resultEmoji = '🏆';
        resultMessage = `${wsBattlePlayers[winner]} g'olib!`;
    }
    
    const resultContainer = document.getElementById('result-container');
    
    // Tarjima bonuslarini hisoblash
    const bonus1 = wsBattleTranslationBonus[0] || 0;
    const bonus2 = wsBattleTranslationBonus[1] || 0;
    
    resultContainer.innerHTML = `
        <div class="result-card battle-result ${winner === -1 ? 'draw' : 'winner'}">
            <h2>${resultEmoji} ${resultMessage}</h2>
            <div class="battle-final-scores">
                <div class="battle-final-player ${winner === 0 ? 'winner' : ''}">
                    <span class="player-icon">🔵</span>
                    <span class="player-name">${wsBattlePlayers[0]}</span>
                    <span class="player-final-score">${wsBattleScores[0]} ball</span>
                    <span class="player-words">${wsBattleWordsFound[0].length} so'z</span>
                    ${bonus1 > 0 ? `<span class="player-bonus">+${bonus1} tarjima bonus</span>` : ''}
                </div>
                <div class="battle-vs-final">VS</div>
                <div class="battle-final-player ${winner === 1 ? 'winner' : ''}">
                    <span class="player-icon">🔴</span>
                    <span class="player-name">${wsBattlePlayers[1]}</span>
                    <span class="player-final-score">${wsBattleScores[1]} ball</span>
                    <span class="player-words">${wsBattleWordsFound[1].length} so'z</span>
                    ${bonus2 > 0 ? `<span class="player-bonus">+${bonus2} tarjima bonus</span>` : ''}
                </div>
            </div>
        </div>
    `;
    resultContainer.style.display = 'block';
    resultContainer.scrollIntoView({ behavior: 'smooth' });
}

function startWordSearch() {
    const timePerWord = parseInt(document.getElementById('ws-time-per-word').value);
    const timeTotal = parseInt(document.getElementById('ws-time-total').value);
    const words = window.wsWords;
    
    // O'zgaruvchilarni boshlash
    wsBattleMode = false;
    wsScore = 0;
    wsFoundCount = 0;
    wsTotalWords = words.length;
    wsTimePerWord = timePerWord; // soniyada
    
    // Vaqtni hisoblash
    let totalSeconds = 0;
    if (timeTotal > 0) {
        totalSeconds = timeTotal * 60;
    } else if (timePerWord > 0) {
        totalSeconds = timePerWord * words.length;
    }
    
    // Setup panelini yashirish
    document.getElementById('ws-timer-setup').style.display = 'none';
    
    // Grid va so'zlarni ko'rsatish
    document.getElementById('ws-words-section').style.display = 'block';
    document.getElementById('ws-grid').style.display = 'inline-block';
    document.getElementById('ws-instruction').style.display = 'block';
    document.getElementById('ws-game-header').style.display = 'flex';
    
    // Score ni ko'rsatish
    updateScoreDisplay();
    
    // Timer ko'rsatish
    if (totalSeconds > 0 || timePerWord > 0) {
        wsTimeLeft = totalSeconds > 0 ? totalSeconds : 9999;
        updateTimerDisplay();
        startTimer();
    }
    
    // Har bir so'z uchun timer
    if (timePerWord > 0) {
        document.getElementById('ws-word-timer-box').style.display = 'flex';
        wsWordTimeLeft = timePerWord;
        updateWordTimerDisplay();
        startWordTimer();
    }
    
    wsGameStarted = true;
    
    // Selection funksionalligi
    initWordSearchSelection(words);
}

function updateScoreDisplay() {
    const scoreEl = document.getElementById('ws-score-value');
    if (scoreEl) {
        scoreEl.textContent = wsScore;
        scoreEl.className = 'ws-score-value';
        if (wsScore > 0) {
            scoreEl.classList.add('ws-score-positive');
        } else if (wsScore < 0) {
            scoreEl.classList.add('ws-score-negative');
        }
    }
}

function startWordTimer() {
    if (wsWordTimerInterval) {
        clearInterval(wsWordTimerInterval);
    }
    
    wsWordTimerInterval = setInterval(() => {
        wsWordTimeLeft--;
        updateWordTimerDisplay();
        
        if (wsWordTimeLeft <= 0) {
            // Vaqt tugadi - ball ayirish
            wsScore--;
            updateScoreDisplay();
            showScoreChange(-1);
            
            // Timerni qayta boshlash (agar hali so'zlar qolgan bo'lsa)
            if (wsFoundCount < wsTotalWords) {
                wsWordTimeLeft = wsTimePerWord;
                updateWordTimerDisplay();
            }
        }
    }, 1000);
}

function updateWordTimerDisplay() {
    const timerEl = document.getElementById('ws-word-timer-text');
    if (timerEl) {
        timerEl.textContent = wsWordTimeLeft.toString().padStart(2, '0');
        
        timerEl.className = 'ws-word-timer-text';
        if (wsWordTimeLeft <= 5) {
            timerEl.classList.add('ws-word-timer-critical');
        } else if (wsWordTimeLeft <= 10) {
            timerEl.classList.add('ws-word-timer-warning');
        }
    }
}

function showScoreChange(change) {
    const scoreBox = document.getElementById('ws-score-box');
    if (!scoreBox) return;
    
    const popup = document.createElement('div');
    popup.className = `ws-score-popup ${change > 0 ? 'positive' : 'negative'}`;
    popup.textContent = change > 0 ? `+${change}` : change;
    scoreBox.appendChild(popup);
    
    setTimeout(() => popup.remove(), 1000);
}

function resetWordTimer() {
    if (wsTimePerWord > 0) {
        wsWordTimeLeft = wsTimePerWord;
        updateWordTimerDisplay();
    }
}

function startTimer() {
    if (wsTimerInterval) {
        clearInterval(wsTimerInterval);
    }
    
    wsTimerInterval = setInterval(() => {
        wsTimeLeft--;
        updateTimerDisplay();
        
        if (wsTimeLeft <= 0) {
            clearInterval(wsTimerInterval);
            endGameTimeout();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(wsTimeLeft / 60);
    const seconds = wsTimeLeft % 60;
    const timerText = document.getElementById('ws-timer-text');
    
    timerText.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Vaqt kam qolganda qizil qilish
    if (wsTimeLeft <= 30) {
        timerText.classList.add('ws-timer-warning');
    } else if (wsTimeLeft <= 60) {
        timerText.classList.add('ws-timer-low');
    }
}

function endGameTimeout() {
    wsGameStarted = false;
    stopWordSearchTimer();
    
    const foundWords = document.querySelectorAll('.ws-word-found').length;
    const totalWords = document.querySelectorAll('.ws-word').length;
    const percent = Math.round((foundWords / totalWords) * 100);
    
    let scoreMessage = '';
    if (wsTimePerWord > 0) {
        scoreMessage = `<p class="ws-final-score">Yakuniy ball: <strong>${wsScore}</strong></p>`;
    }
    
    const resultContainer = document.getElementById('result-container');
    resultContainer.innerHTML = `
        <div class="result-card timeout">
            <h2>⏰ Vaqt tugadi!</h2>
            <p>${foundWords} / ${totalWords} so'z topildi</p>
            ${scoreMessage}
            <div class="score-display">
                <span class="score">${percent}%</span>
            </div>
        </div>
    `;
    resultContainer.style.display = 'block';
    resultContainer.scrollIntoView({ behavior: 'smooth' });
    
    // Gridni o'chirib qo'yish
    document.querySelectorAll('.ws-cell').forEach(cell => {
        cell.style.pointerEvents = 'none';
        cell.style.opacity = '0.6';
    });
}

function stopWordSearchTimer() {
    if (wsTimerInterval) {
        clearInterval(wsTimerInterval);
        wsTimerInterval = null;
    }
    if (wsWordTimerInterval) {
        clearInterval(wsWordTimerInterval);
        wsWordTimerInterval = null;
    }
}

function initWordSearchSelection(words) {
    const grid = document.querySelector('.ws-grid');
    const cells = document.querySelectorAll('.ws-cell');
    
    let isSelecting = false;
    let startCell = null;
    let selectedCells = [];

    // Touch va mouse eventlar
    cells.forEach(cell => {
        // Mouse events
        cell.addEventListener('mousedown', (e) => {
            e.preventDefault();
            startSelection(cell);
        });
        
        cell.addEventListener('mouseenter', (e) => {
            if (isSelecting) {
                updateSelection(cell);
            }
        });
        
        // Touch events
        cell.addEventListener('touchstart', (e) => {
            e.preventDefault();
            startSelection(cell);
        });
        
        cell.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const element = document.elementFromPoint(touch.clientX, touch.clientY);
            if (element && element.classList.contains('ws-cell') && isSelecting) {
                updateSelection(element);
            }
        });
    });

    document.addEventListener('mouseup', endSelection);
    document.addEventListener('touchend', endSelection);

    function startSelection(cell) {
        isSelecting = true;
        startCell = cell;
        selectedCells = [cell];
        clearSelection();
        cell.classList.add('ws-selecting');
    }

    function updateSelection(cell) {
        if (!startCell || cell === startCell) return;
        
        const startX = parseInt(startCell.dataset.x);
        const startY = parseInt(startCell.dataset.y);
        const endX = parseInt(cell.dataset.x);
        const endY = parseInt(cell.dataset.y);
        
        // Yo'nalishni aniqlash
        const dx = endX - startX;
        const dy = endY - startY;
        
        // Faqat to'g'ri chiziqda tanlash mumkin
        const isHorizontal = dy === 0;
        const isVertical = dx === 0;
        const isDiagonal = Math.abs(dx) === Math.abs(dy);
        
        if (!isHorizontal && !isVertical && !isDiagonal) {
            return;
        }
        
        // Yo'nalish birliklari
        const stepX = dx === 0 ? 0 : dx / Math.abs(dx);
        const stepY = dy === 0 ? 0 : dy / Math.abs(dy);
        
        clearSelection();
        selectedCells = [];
        
        let x = startX;
        let y = startY;
        
        while (true) {
            const currentCell = document.querySelector(`.ws-cell[data-x="${x}"][data-y="${y}"]`);
            if (currentCell) {
                currentCell.classList.add('ws-selecting');
                selectedCells.push(currentCell);
            }
            
            if (x === endX && y === endY) break;
            
            x += stepX;
            y += stepY;
        }
    }

    function endSelection() {
        if (!isSelecting) return;
        isSelecting = false;
        
        // Tanlangan so'zni tekshirish
        const selectedWord = selectedCells.map(cell => cell.textContent).join('');
        const reversedWord = selectedWord.split('').reverse().join('');
        
        let matchedWord = null;
        if (words.includes(selectedWord)) {
            matchedWord = selectedWord;
        } else if (words.includes(reversedWord)) {
            matchedWord = reversedWord;
        }
        
        if (matchedWord && !wsFoundWords.has(matchedWord)) {
            wsFoundWords.add(matchedWord);
            wsFoundCount++;
            
            // Katakchalarni saqlash (keyinroq rang berish uchun)
            const foundCells = [...selectedCells];
            
            // Musobaqa rejimi
            if (wsBattleMode) {
                // Joriy o'yinchiga ball qo'shish
                wsBattleScores[wsBattleCurrentPlayer]++;
                wsBattleWordsFound[wsBattleCurrentPlayer].push(matchedWord);
                updateBattleScores();
                showBattleScoreChange(wsBattleCurrentPlayer, +1);
                
                // Katakchalarni o'yinchi rangida qilish
                const playerClass = wsBattleCurrentPlayer === 0 ? 'ws-found-player1' : 'ws-found-player2';
                foundCells.forEach(cell => {
                    cell.classList.remove('ws-selecting');
                    cell.classList.add('ws-found', playerClass);
                });
                
                // So'zlar ro'yxatida chizib qo'yish
                const wordSpan = document.querySelector(`.ws-word[data-word="${matchedWord}"]`);
                if (wordSpan) {
                    wordSpan.classList.add('ws-word-found', playerClass);
                }
                
                // Tarjima mavjud bo'lsa, tarjima so'rash
                if (window.wsTranslations && window.wsTranslations[matchedWord]) {
                    showTranslationModal(matchedWord, () => {
                        // Tarjimadan keyin davom etish
                        if (wsFoundWords.size === words.length) {
                            setTimeout(() => {
                                showBattleComplete();
                            }, 500);
                        } else {
                            switchBattleTurn();
                        }
                    });
                } else {
                    // Tarjima yo'q bo'lsa, oddiy davom etish
                    if (wsFoundWords.size === words.length) {
                        setTimeout(() => {
                            showBattleComplete();
                        }, 500);
                    } else {
                        switchBattleTurn();
                    }
                }
            } else {
                // Yakka o'yin rejimi
                // Ball qo'shish
                if (wsTimePerWord > 0) {
                    wsScore++;
                    updateScoreDisplay();
                    showScoreChange(+1);
                    resetWordTimer();
                }
                
                // Katakchalarni yashil qilish
                selectedCells.forEach(cell => {
                    cell.classList.remove('ws-selecting');
                    cell.classList.add('ws-found');
                });
                
                // So'zlar ro'yxatida chizib qo'yish
                const wordSpan = document.querySelector(`.ws-word[data-word="${matchedWord}"]`);
                if (wordSpan) {
                    wordSpan.classList.add('ws-word-found');
                }
                
                // Barcha so'zlar topildimi tekshirish
                if (wsFoundWords.size === words.length) {
                    setTimeout(() => {
                        showWordSearchComplete();
                    }, 500);
                }
            }
        } else {
            clearSelection();
        }
        
        startCell = null;
        selectedCells = [];
    }

    function clearSelection() {
        cells.forEach(cell => {
            if (!cell.classList.contains('ws-found')) {
                cell.classList.remove('ws-selecting');
            }
        });
    }
}

function showWordSearchComplete() {
    // Timerni to'xtatish
    stopWordSearchTimer();
    wsGameStarted = false;
    
    // Qolgan vaqtni ko'rsatish
    let timeMessage = '';
    if (wsTimeLeft > 0 && wsTimeLeft < 9999) {
        const minutes = Math.floor(wsTimeLeft / 60);
        const seconds = wsTimeLeft % 60;
        timeMessage = `<p style="color: #27ae60;">⏱️ Qolgan vaqt: ${minutes}:${seconds.toString().padStart(2, '0')}</p>`;
    }
    
    // Ball xabari
    let scoreMessage = '';
    if (wsTimePerWord > 0) {
        scoreMessage = `<p class="ws-final-score-success">🏆 Yakuniy ball: <strong>${wsScore}</strong> / ${wsTotalWords}</p>`;
    }
    
    const resultContainer = document.getElementById('result-container');
    resultContainer.innerHTML = `
        <div class="result-card success">
            <h2>🎉 Tabriklaymiz!</h2>
            <p>Barcha so'zlarni topdingiz!</p>
            ${scoreMessage}
            ${timeMessage}
            <div class="score-display">
                <span class="score">100%</span>
            </div>
        </div>
    `;
    resultContainer.style.display = 'block';
    resultContainer.scrollIntoView({ behavior: 'smooth' });
}

// ==================== CROSSWORD ====================
let cwSelectedCell = null;
let cwSelectedDirection = null;
let cwWords = [];
let cwGrid = [];
let cwPlacedWords = new Set();
let cwVariants = []; // 5 ta variant
let cwCurrentVariant = 0;

// Crossword timer va ball tizimi
let cwTimerInterval = null;
let cwWordTimerInterval = null;
let cwTimeLeft = 0;
let cwWordTimeLeft = 0;
let cwGameStarted = false;
let cwScore = 0;
let cwTimePerWord = 30; // Har bir so'z uchun 30 soniya
let cwTotalWords = 0;
let cwCorrectCount = 0;

// Crossword timerni boshlash
function startCrosswordTimer() {
    if (cwGameStarted) return;
    cwGameStarted = true;
    
    cwTotalWords = cwWords.length;
    cwTimeLeft = cwTotalWords * cwTimePerWord;
    cwScore = 0; // Boshlang'ich ball = 0
    cwCorrectCount = 0;
    
    updateCrosswordTimerDisplay();
    updateCrosswordScoreDisplay();
    
    // Asosiy timer
    cwTimerInterval = setInterval(() => {
        cwTimeLeft--;
        updateCrosswordTimerDisplay();
        
        if (cwTimeLeft <= 0) {
            stopCrosswordTimer();
            showCrosswordTimeUp();
        }
    }, 1000);
    
    // So'z timeri
    cwWordTimeLeft = cwTimePerWord;
    cwWordTimerInterval = setInterval(() => {
        cwWordTimeLeft--;
        updateCrosswordWordTimerDisplay();
        
        if (cwWordTimeLeft <= 0) {
            // Vaqt tugadi - ball ayirish
            cwScore--;
            updateCrosswordScoreDisplay();
            showCrosswordScoreChange(-1);
            
            // Timerni qayta boshlash (agar hali so'zlar qolgan bo'lsa)
            if (cwCorrectCount < cwTotalWords) {
                cwWordTimeLeft = cwTimePerWord;
                updateCrosswordWordTimerDisplay();
            }
        }
    }, 1000);
}

// Timer ni to'xtatish
function stopCrosswordTimer() {
    if (cwTimerInterval) {
        clearInterval(cwTimerInterval);
        cwTimerInterval = null;
    }
    if (cwWordTimerInterval) {
        clearInterval(cwWordTimerInterval);
        cwWordTimerInterval = null;
    }
}

// Timer displayni yangilash
function updateCrosswordTimerDisplay() {
    const timerEl = document.getElementById('cw-timer');
    if (timerEl) {
        const minutes = Math.floor(cwTimeLeft / 60);
        const seconds = cwTimeLeft % 60;
        timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Vaqt kam qolganda qizil rang
        if (cwTimeLeft <= 30) {
            timerEl.classList.add('cw-timer-warning');
        } else {
            timerEl.classList.remove('cw-timer-warning');
        }
    }
}

// So'z timerni yangilash
function updateCrosswordWordTimerDisplay() {
    const wordTimerEl = document.getElementById('cw-word-timer');
    if (wordTimerEl) {
        wordTimerEl.textContent = cwWordTimeLeft;
        
        if (cwWordTimeLeft <= 10) {
            wordTimerEl.classList.add('cw-word-timer-warning');
        } else {
            wordTimerEl.classList.remove('cw-word-timer-warning');
        }
    }
}

// Ball displayni yangilash (Word Search kabi)
function updateCrosswordScoreDisplay() {
    const scoreEl = document.getElementById('cw-score');
    if (scoreEl) {
        scoreEl.textContent = cwScore;
        scoreEl.className = 'cw-score-value';
        if (cwScore > 0) {
            scoreEl.classList.add('cw-score-positive');
        } else if (cwScore < 0) {
            scoreEl.classList.add('cw-score-negative');
        }
    }
}

// Ball o'zgarishi animatsiyasi
function showCrosswordScoreChange(change) {
    const indicator = document.createElement('div');
    indicator.className = 'cw-score-change';
    indicator.textContent = change > 0 ? `+${change}` : change;
    indicator.classList.add(change > 0 ? 'cw-score-plus' : 'cw-score-minus');
    
    const scoreSection = document.querySelector('.cw-score-section');
    if (scoreSection) {
        scoreSection.appendChild(indicator);
        setTimeout(() => indicator.remove(), 1000);
    }
}

// So'z timerini qayta boshlash
function resetCrosswordWordTimer() {
    cwWordTimeLeft = cwTimePerWord;
    updateCrosswordWordTimerDisplay();
}

// Vaqt tugadi
function showCrosswordTimeUp() {
    cwGameStarted = false;
    
    const resultDiv = document.createElement('div');
    resultDiv.className = 'cw-result-popup';
    resultDiv.innerHTML = `
        <div class="cw-result-content">
            <h2>⏰ Vaqt tugadi!</h2>
            <p>To'g'ri javoblar: ${cwCorrectCount} / ${cwTotalWords}</p>
            <p>Yakuniy ball: <strong>${cwScore}</strong></p>
            <button onclick="this.parentElement.parentElement.remove();" class="btn btn-primary">OK</button>
        </div>
    `;
    document.body.appendChild(resultDiv);
}

// To'g'ri so'z topilganda
function onCrosswordWordCorrect() {
    cwCorrectCount++;
    cwScore++;
    updateCrosswordScoreDisplay();
    showCrosswordScoreChange(+1);
    resetCrosswordWordTimer();
    
    // Progress yangilash
    updateCrosswordProgress();
    
    // Barcha so'zlar topildi
    if (cwCorrectCount >= cwTotalWords) {
        stopCrosswordTimer();
        showCrosswordComplete();
    }
}

// Noto'g'ri so'z
function onCrosswordWordWrong() {
    cwScore--;
    updateCrosswordScoreDisplay();
    showCrosswordScoreChange(-1);
}

// O'yin tugadi
function showCrosswordComplete() {
    cwGameStarted = false;
    
    const resultDiv = document.createElement('div');
    resultDiv.className = 'cw-result-popup';
    resultDiv.innerHTML = `
        <div class="cw-result-content">
            <h2>🎉 Tabriklaymiz!</h2>
            <p>Barcha so'zlarni topdingiz!</p>
            <p>🏆 Yakuniy ball: <strong>${cwScore}</strong> / ${cwTotalWords}</p>
            <p>Qolgan vaqt: ${Math.floor(cwTimeLeft / 60)}:${(cwTimeLeft % 60).toString().padStart(2, '0')}</p>
            <button onclick="this.parentElement.parentElement.remove();" class="btn btn-success">Ajoyib!</button>
        </div>
    `;
    document.body.appendChild(resultDiv);
}

// 5 ta variant yaratish
function generateCrosswordVariants(words, clues) {
    const variants = [];
    
    for (let i = 0; i < 5; i++) {
        // So'zlar va cluelarni aralashtirish
        const shuffledClues = [...clues].sort(() => Math.random() - 0.5);
        const shuffledWordBtns = [...words].sort(() => Math.random() - 0.5);
        
        variants.push({
            clueOrder: shuffledClues.map(c => c.number + '-' + c.direction),
            wordBtnOrder: shuffledWordBtns.map(w => w.word)
        });
    }
    
    return variants;
}

function loadCrosswordExercise(content, contentArea) {
    if (!content || !content.grid || !content.words) {
        contentArea.innerHTML = '<div class="error-message"><h3>❌ Xatolik!</h3><p>Crossword ma\'lumotlari topilmadi.</p></div>';
        return;
    }
    
    cwGrid = content.grid;
    cwWords = content.words;
    cwPlacedWords = new Set();
    
    // Variantlarni yaratish (faqat birinchi marta)
    if (cwVariants.length === 0) {
        cwVariants = generateCrosswordVariants(cwWords, cwWords);
    }
    
    // Random variant tanlash
    cwCurrentVariant = Math.floor(Math.random() * 5);
    const currentVariant = cwVariants[cwCurrentVariant];
    
    const gridHeight = content.grid.length;
    const gridWidth = content.grid[0].length;
    
    // Across va Down so'zlarni ajratish
    const acrossWords = cwWords.filter(w => w.direction === 'across').sort((a, b) => a.number - b.number);
    const downWords = cwWords.filter(w => w.direction === 'down').sort((a, b) => a.number - b.number);
    
    // Cluelarni variant tartibiga ko'ra aralashtirish
    const acrossCluesShuffled = [...acrossWords].sort(() => Math.random() - 0.5);
    const downCluesShuffled = [...downWords].sort(() => Math.random() - 0.5);
    
    let html = '<div class="crossword-exercise">';
    
    // Vaqt tanlash paneli (o'yin boshlanmagan bo'lsa)
    html += `<div class="cw-time-select-panel" id="cw-time-select">
        <h3>⏰ Vaqtni tanlang</h3>
        <p>Har bir so'z uchun qancha vaqt berilsin?</p>
        <div class="cw-time-options">
            <button class="cw-time-btn" data-time="15">15 soniya</button>
            <button class="cw-time-btn" data-time="20">20 soniya</button>
            <button class="cw-time-btn cw-time-btn-selected" data-time="30">30 soniya</button>
            <button class="cw-time-btn" data-time="45">45 soniya</button>
            <button class="cw-time-btn" data-time="60">1 daqiqa</button>
        </div>
        <button class="cw-start-btn" onclick="startCrosswordGame()">🎮 O'yinni boshlash</button>
    </div>`;
    
    // Timer va Ball paneli (yuqorida) - o'yin boshlangandan keyin ko'rinadi
    html += `<div class="cw-timer-panel" id="cw-timer-panel" style="display: none;">
        <div class="cw-timer-section">
            <div class="cw-timer-box">
                <span class="cw-timer-icon">⏱️</span>
                <span class="cw-timer-label">Umumiy vaqt:</span>
                <span class="cw-timer-text" id="cw-timer">0:00</span>
            </div>
            <div class="cw-word-timer-box">
                <span class="cw-timer-icon">⏳</span>
                <span class="cw-timer-label">So'z uchun:</span>
                <span class="cw-word-timer-text" id="cw-word-timer">30</span>
                <span class="cw-timer-label">s</span>
            </div>
        </div>
        <div class="cw-score-section">
            <span class="cw-score-label">Ball:</span>
            <span class="cw-score-value" id="cw-score">0</span>
        </div>
        <div class="cw-progress-section">
            <span class="cw-progress-label">Topildi:</span>
            <span class="cw-progress-text" id="cw-progress">0 / ${cwWords.length}</span>
        </div>
    </div>`;
    
    // Ustun: Cluelar va Grid
    html += '<div class="cw-main-area">';
    
    // Cluelar paneli
    html += '<div class="cw-clues-panel">';
    
    // Across cluelar (aralashtirilgan)
    html += '<div class="cw-clue-section">';
    html += '<h3>→ Across (Gorizontal)</h3>';
    html += '<div class="cw-clue-list">';
    acrossCluesShuffled.forEach(w => {
        html += `<div class="cw-clue-item" data-number="${w.number}" data-direction="across" data-word="${w.word}">
            <span class="cw-clue-number">${w.number}.</span>
            <span class="cw-clue-text">${w.clue}</span>
        </div>`;
    });
    html += '</div></div>';
    
    // Down cluelar (aralashtirilgan)
    html += '<div class="cw-clue-section">';
    html += '<h3>↓ Down (Vertikal)</h3>';
    html += '<div class="cw-clue-list">';
    downCluesShuffled.forEach(w => {
        html += `<div class="cw-clue-item" data-number="${w.number}" data-direction="down" data-word="${w.word}">
            <span class="cw-clue-number">${w.number}.</span>
            <span class="cw-clue-text">${w.clue}</span>
        </div>`;
    });
    html += '</div></div>';
    
    html += '</div>'; // cw-clues-panel
    
    // Grid
    html += '<div class="cw-grid-container">';
    html += `<div class="cw-grid" style="grid-template-columns: repeat(${gridWidth}, 40px);">`;
    
    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            const cell = content.grid[y][x];
            
            if (cell === null) {
                html += '<div class="cw-cell cw-cell-black"></div>';
            } else {
                // Raqam borligini tekshirish
                const cellNumber = content.numberedCells.find(nc => nc.x === x && nc.y === y);
                const numberHtml = cellNumber ? `<span class="cw-cell-number">${cellNumber.number}</span>` : '';
                
                // Bu katakda qaysi yo'nalishlar mavjud
                const hasAcross = acrossWords.some(w => w.startY === y && x >= w.startX && x < w.startX + w.word.length);
                const hasDown = downWords.some(w => w.startX === x && y >= w.startY && y < w.startY + w.word.length);
                
                const directions = [];
                if (hasAcross) directions.push('across');
                if (hasDown) directions.push('down');
                
                html += `<div class="cw-cell cw-cell-white" data-x="${x}" data-y="${y}" data-directions="${directions.join(',')}" data-answer="${cell}">
                    ${numberHtml}
                    <input type="text" maxlength="1" class="cw-input" readonly>
                </div>`;
            }
        }
    }
    html += '</div>'; // cw-grid
    html += '</div>'; // cw-grid-container
    
    // Inglizcha so'zlar paneli (o'ng tomonda - cw-main-area ichida)
    html += '<div class="cw-words-panel">';
    html += '<h3>📝 Inglizcha so\'zlar</h3>';
    html += '<p class="cw-instruction">Avval katakka bosing, keyin so\'zni tanlang</p>';
    html += '<div class="cw-word-list">';
    
    // So'zlarni variant tartibiga ko'ra aralashtirish (har safar turlicha)
    const wordBtnOrder = currentVariant ? currentVariant.wordBtnOrder : cwWords.map(w => w.word);
    const shuffledWordBtns = wordBtnOrder.length > 0 ? 
        wordBtnOrder.map(word => cwWords.find(w => w.word === word)).filter(w => w) :
        [...cwWords].sort(() => Math.random() - 0.5);
    
    shuffledWordBtns.forEach(w => {
        html += `<div class="cw-word-btn" data-word="${w.word}">${w.word}</div>`;
    });
    html += '</div></div>';
    
    html += '</div>'; // cw-main-area
    
    html += '</div>'; // crossword-exercise
    
    // Modal - yo'nalish tanlash
    html += `<div class="cw-direction-modal" id="cw-direction-modal" style="display: none;">
        <div class="cw-modal-content">
            <h3>Yo'nalishni tanlang</h3>
            <button class="cw-modal-btn" onclick="selectDirection('across')">→ Across (Gorizontal)</button>
            <button class="cw-modal-btn" onclick="selectDirection('down')">↓ Down (Vertikal)</button>
            <button class="cw-modal-btn cw-modal-cancel" onclick="closeDirectionModal()">Bekor qilish</button>
        </div>
    </div>`;
    
    contentArea.innerHTML = html;
    
    // Event listenerlar
    initCrosswordEvents();
}

// Crossword o'yinini boshlash
function startCrosswordGame() {
    // Tanlangan vaqtni olish
    const selectedBtn = document.querySelector('.cw-time-btn-selected');
    cwTimePerWord = selectedBtn ? parseInt(selectedBtn.dataset.time) : 30;
    
    // Vaqt tanlash panelini yashirish
    document.getElementById('cw-time-select').style.display = 'none';
    
    // Timer panelini ko'rsatish
    document.getElementById('cw-timer-panel').style.display = 'flex';
    
    // O'yinni boshlash
    startCrosswordTimer();
}

function initCrosswordEvents() {
    // Vaqt tanlash tugmalari
    document.querySelectorAll('.cw-time-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.cw-time-btn').forEach(b => b.classList.remove('cw-time-btn-selected'));
            btn.classList.add('cw-time-btn-selected');
        });
    });
    
    // Kataklarga bosish
    document.querySelectorAll('.cw-cell-white').forEach(cell => {
        cell.addEventListener('click', () => {
            if (!cwGameStarted) {
                alert('Avval "O\'yinni boshlash" tugmasini bosing!');
                return;
            }
            selectCrosswordCell(cell);
        });
    });
    
    // So'z tugmalariga bosish
    document.querySelectorAll('.cw-word-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!cwGameStarted) {
                alert('Avval "O\'yinni boshlash" tugmasini bosing!');
                return;
            }
            placeWordInCrossword(btn.dataset.word);
        });
    });
    
    // Clue elementlariga bosish
    document.querySelectorAll('.cw-clue-item').forEach(clue => {
        clue.addEventListener('click', () => {
            if (!cwGameStarted) {
                alert('Avval "O\'yinni boshlash" tugmasini bosing!');
                return;
            }
            
            const number = parseInt(clue.dataset.number);
            const direction = clue.dataset.direction;
            highlightWordCells(number, direction);
        });
    });
}

function selectCrosswordCell(cell) {
    // Avvalgi tanlashni olib tashlash
    document.querySelectorAll('.cw-cell-selected').forEach(c => {
        c.classList.remove('cw-cell-selected');
    });
    
    const directions = cell.dataset.directions.split(',').filter(d => d);
    
    if (directions.length === 0) return;
    
    cell.classList.add('cw-cell-selected');
    cwSelectedCell = cell;
    
    if (directions.length === 2) {
        // Ikki yo'nalish mavjud - modal ko'rsatish
        document.getElementById('cw-direction-modal').style.display = 'flex';
    } else {
        cwSelectedDirection = directions[0];
        highlightSelectedWord();
    }
}

function selectDirection(direction) {
    cwSelectedDirection = direction;
    closeDirectionModal();
    highlightSelectedWord();
}

function closeDirectionModal() {
    document.getElementById('cw-direction-modal').style.display = 'none';
}

function highlightSelectedWord() {
    // Avvalgi highlightni olib tashlash
    document.querySelectorAll('.cw-cell-highlight').forEach(c => {
        c.classList.remove('cw-cell-highlight');
    });
    
    if (!cwSelectedCell || !cwSelectedDirection) return;
    
    const x = parseInt(cwSelectedCell.dataset.x);
    const y = parseInt(cwSelectedCell.dataset.y);
    
    // Shu yo'nalishdagi so'zni topish
    const word = cwWords.find(w => {
        if (w.direction !== cwSelectedDirection) return false;
        if (w.direction === 'across') {
            return w.startY === y && x >= w.startX && x < w.startX + w.word.length;
        } else {
            return w.startX === x && y >= w.startY && y < w.startY + w.word.length;
        }
    });
    
    if (word) {
        // So'zning barcha kataklarini highlight qilish
        for (let i = 0; i < word.word.length; i++) {
            const cx = word.direction === 'across' ? word.startX + i : word.startX;
            const cy = word.direction === 'down' ? word.startY + i : word.startY;
            const cell = document.querySelector(`.cw-cell[data-x="${cx}"][data-y="${cy}"]`);
            if (cell) {
                cell.classList.add('cw-cell-highlight');
            }
        }
    }
}

function highlightWordCells(number, direction) {
    const word = cwWords.find(w => w.number === number && w.direction === direction);
    if (!word) return;
    
    // Birinchi katakni topish va tanlash
    const firstCell = document.querySelector(`.cw-cell[data-x="${word.startX}"][data-y="${word.startY}"]`);
    if (firstCell) {
        cwSelectedCell = firstCell;
        cwSelectedDirection = direction;
        
        // Avvalgi tanlashni olib tashlash
        document.querySelectorAll('.cw-cell-selected').forEach(c => {
            c.classList.remove('cw-cell-selected');
        });
        firstCell.classList.add('cw-cell-selected');
        
        highlightSelectedWord();
    }
}

function placeWordInCrossword(word) {
    if (!cwSelectedCell || !cwSelectedDirection) {
        alert('Avval katakka bosing!');
        return;
    }
    
    // Tanlangan so'zni topish
    const targetWord = cwWords.find(w => {
        const x = parseInt(cwSelectedCell.dataset.x);
        const y = parseInt(cwSelectedCell.dataset.y);
        
        if (w.direction !== cwSelectedDirection) return false;
        if (w.direction === 'across') {
            return w.startY === y && x >= w.startX && x < w.startX + w.word.length;
        } else {
            return w.startX === x && y >= w.startY && y < w.startY + w.word.length;
        }
    });
    
    if (!targetWord) {
        alert('Bu joyga so\'z joylashtirib bo\'lmaydi!');
        return;
    }
    
    // So'z uzunligini tekshirish
    if (word.length !== targetWord.word.length) {
        alert(`Bu joy uchun ${targetWord.word.length} harfli so'z kerak!`);
        return;
    }
    
    // So'zni tekshirish - to'g'ri yoki noto'g'ri
    const isCorrect = word.toUpperCase() === targetWord.word.toUpperCase();
    
    // So'zni joylashtirish
    for (let i = 0; i < word.length; i++) {
        const cx = targetWord.direction === 'across' ? targetWord.startX + i : targetWord.startX;
        const cy = targetWord.direction === 'down' ? targetWord.startY + i : targetWord.startY;
        const cell = document.querySelector(`.cw-cell[data-x="${cx}"][data-y="${cy}"]`);
        if (cell) {
            const input = cell.querySelector('.cw-input');
            input.value = word[i];
            cell.classList.add('cw-cell-filled');
            
            // To'g'ri/noto'g'ri rangini ko'rsatish
            if (isCorrect) {
                cell.classList.add('cw-cell-correct');
                cell.classList.remove('cw-cell-wrong');
            } else {
                cell.classList.add('cw-cell-wrong');
                cell.classList.remove('cw-cell-correct');
            }
        }
    }
    
    // Clue ni belgilash
    const clue = document.querySelector(`.cw-clue-item[data-number="${targetWord.number}"][data-direction="${targetWord.direction}"]`);
    if (clue) {
        if (isCorrect) {
            clue.classList.add('cw-clue-correct');
            clue.classList.remove('cw-clue-wrong');
        } else {
            clue.classList.add('cw-clue-wrong');
            clue.classList.remove('cw-clue-correct');
        }
    }
    
    // So'z tugmasini o'chirish
    const wordBtn = document.querySelector(`.cw-word-btn[data-word="${word}"]`);
    if (wordBtn) {
        wordBtn.classList.add('cw-word-used');
        wordBtn.style.pointerEvents = 'none';
    }
    
    cwPlacedWords.add(word);
    
    // Ball tizimini yangilash
    if (isCorrect) {
        onCrosswordWordCorrect();
    } else {
        onCrosswordWordWrong();
    }
    
    // Progress ni yangilash
    updateCrosswordProgress();
    
    // Tanlashni tozalash
    cwSelectedCell = null;
    cwSelectedDirection = null;
    document.querySelectorAll('.cw-cell-selected, .cw-cell-highlight').forEach(c => {
        c.classList.remove('cw-cell-selected', 'cw-cell-highlight');
    });
}

// Progress ni yangilash
function updateCrosswordProgress() {
    const progressEl = document.getElementById('cw-progress');
    if (progressEl) {
        progressEl.textContent = `${cwCorrectCount} / ${cwTotalWords}`;
    }
}

function checkCrosswordAnswers() {
    let correct = 0;
    let total = cwWords.length;
    
    cwWords.forEach(word => {
        let wordCorrect = true;
        for (let i = 0; i < word.word.length; i++) {
            const cx = word.direction === 'across' ? word.startX + i : word.startX;
            const cy = word.direction === 'down' ? word.startY + i : word.startY;
            const cell = document.querySelector(`.cw-cell[data-x="${cx}"][data-y="${cy}"]`);
            if (cell) {
                const input = cell.querySelector('.cw-input');
                if (input.value.toUpperCase() !== word.word[i]) {
                    wordCorrect = false;
                    cell.classList.add('cw-cell-wrong');
                } else {
                    cell.classList.add('cw-cell-correct');
                }
            }
        }
        if (wordCorrect) correct++;
        
        // Clue ni belgilash
        const clue = document.querySelector(`.cw-clue-item[data-number="${word.number}"][data-direction="${word.direction}"]`);
        if (clue) {
            clue.classList.add(wordCorrect ? 'cw-clue-correct' : 'cw-clue-wrong');
        }
    });
    
    return { correct, total, score: Math.round((correct / total) * 100) };
}
