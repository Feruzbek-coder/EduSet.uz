// Create page - mashq yaratish

let questionCounter = 0;

// Sahifa yuklanganda tahrirlash rejimini tekshirish
document.addEventListener('DOMContentLoaded', function() {
    // Pre-select subject passed from index page subject-picker modal
    const pendingSubject = sessionStorage.getItem('pendingSubject');
    if (pendingSubject) {
        const sel = document.getElementById('ex-subject');
        if (sel) sel.value = pendingSubject;
        sessionStorage.removeItem('pendingSubject');
    }

    if (typeof editMode !== 'undefined' && editMode && editExerciseData) {
        loadExerciseForEdit();
    } else if (typeof vocabularyData !== 'undefined' && vocabularyData) {
        loadVocabularyData();
    }
});

// Vocabulary ma'lumotlarini yuklash
function loadVocabularyData() {
    if (!vocabularyData || !vocabularyData.words) return;
    
    const words = vocabularyData.words;
    
    // Words formatini tekshirish
    const isNewFormat = words.length > 0 && typeof words[0] === 'object';
    
    if (exerciseType === 'matching') {
        loadVocabForMatching(words, isNewFormat);
    } else if (exerciseType === 'fill_gaps') {
        loadVocabForFillGaps(words, isNewFormat);
    } else if (exerciseType === 'word_search') {
        loadVocabForWordSearch(words, isNewFormat);
    } else if (exerciseType === 'crossword') {
        loadVocabForCrossword(words, isNewFormat);
    } else if (exerciseType === 'multiple_choice') {
        loadVocabForMultipleChoice(words, isNewFormat);
    } else if (exerciseType === 'find_pairings') {
        loadVocabForFindPairings(words, isNewFormat);
    }
    
    // Title ni o'rnatish
    document.getElementById('title').value = vocabularyData.title + ' - ' + exerciseType;
}

function loadVocabForMatching(words, isNewFormat) {
    const container = document.getElementById('matching-items');
    container.innerHTML = '';
    
    words.forEach(item => {
        const word = isNewFormat ? item.word : item;
        const translation = isNewFormat ? item.translation : '';
        
        const div = document.createElement('div');
        div.className = 'matching-item';
        div.innerHTML = `
            <input type="text" class="word-input" placeholder="So'z yoki ibora" value="${word}">
            <input type="text" class="match-input" placeholder="Mos javob" value="${translation}">
            <button type="button" class="btn-remove" onclick="removeItem(this)">❌</button>
        `;
        container.appendChild(div);
    });
}

function loadVocabForFillGaps(words, isNewFormat) {
    const container = document.getElementById('words-container');
    container.innerHTML = '';
    
    words.forEach(item => {
        const word = isNewFormat ? item.word : item;
        
        const div = document.createElement('div');
        div.className = 'word-gap-item';
        div.innerHTML = `
            <input type="text" class="word-with-gaps" placeholder="Masalan: h__ney" value="${word}">
            <input type="text" class="word-answer" placeholder="To'g'ri javob: ${word}" value="${word}">
            <button type="button" class="btn-remove" onclick="removeWordItem(this)">❌</button>
        `;
        container.appendChild(div);
    });
}

function loadVocabForWordSearch(words, isNewFormat) {
    const container = document.getElementById('wordsearch-words');
    container.innerHTML = '';
    
    words.forEach(item => {
        const word = isNewFormat ? item.word : item;
        const translation = isNewFormat ? item.translation : '';
        
        const div = document.createElement('div');
        div.className = 'wordsearch-word-item';
        div.innerHTML = `
            <input type="text" class="ws-word-input" placeholder="Inglizcha so'z" value="${word}">
            <input type="text" class="ws-translation-input" placeholder="O'zbekcha tarjima" value="${translation}">
            <button type="button" class="btn-remove" onclick="removeWSWord(this)">❌</button>
        `;
        container.appendChild(div);
    });
}

function loadVocabForCrossword(words, isNewFormat) {
    const container = document.getElementById('crossword-words');
    container.innerHTML = '';
    
    words.forEach(item => {
        const word = isNewFormat ? item.word : item;
        const translation = isNewFormat ? item.translation : '';
        
        const div = document.createElement('div');
        div.className = 'crossword-word-item';
        div.innerHTML = `
            <input type="text" class="cw-uzbek-input" placeholder="O'zbekcha" value="${translation}">
            <span class="cw-arrow">→</span>
            <input type="text" class="cw-english-input" placeholder="Inglizcha" value="${word}">
            <button type="button" class="btn-remove" onclick="removeCWWord(this)">❌</button>
        `;
        container.appendChild(div);
    });
}

function loadVocabForMultipleChoice(words, isNewFormat) {
    const container = document.getElementById('questions-list');
    container.innerHTML = '';
    
    words.forEach((item, index) => {
        const word = isNewFormat ? item.word : item;
        const translation = isNewFormat ? item.translation : '';
        
        const div = document.createElement('div');
        div.className = 'question-item';
        div.innerHTML = `
            <input type="text" class="question-text" placeholder="Savol matni" value="${translation || word}">
            <div class="options-group">
                <div class="option-item">
                    <input type="radio" name="correct-${index}" value="0" checked>
                    <input type="text" class="option-text" placeholder="Variant A" value="${word}">
                </div>
                <div class="option-item">
                    <input type="radio" name="correct-${index}" value="1">
                    <input type="text" class="option-text" placeholder="Variant B">
                </div>
                <div class="option-item">
                    <input type="radio" name="correct-${index}" value="2">
                    <input type="text" class="option-text" placeholder="Variant C">
                </div>
                <div class="option-item">
                    <input type="radio" name="correct-${index}" value="3">
                    <input type="text" class="option-text" placeholder="Variant D">
                </div>
            </div>
            <button type="button" class="btn-remove" onclick="removeQuestion(this)">❌ Savolni o'chirish</button>
        `;
        container.appendChild(div);
    });
    
    questionCounter = words.length;
}

// Tahrirlash uchun mashqni yuklash
function loadExerciseForEdit() {
    // Sarlavhani o'rnatish
    document.getElementById('title').value = editExerciseTitle || '';
    
    const data = editExerciseData;
    
    if (exerciseType === 'matching') {
        loadMatchingForEdit(data);
    } else if (exerciseType === 'fill_gaps') {
        loadFillGapsForEdit(data);
    } else if (exerciseType === 'word_search') {
        loadWordSearchForEdit(data);
    } else if (exerciseType === 'crossword') {
        loadCrosswordForEdit(data);
    } else if (exerciseType === 'multiple_choice') {
        loadMultipleChoiceForEdit(data);
    } else if (exerciseType === 'find_pairings') {
        loadFindPairingsForEdit(data);
    }
}

function loadMatchingForEdit(data) {
    if (!data.pairs) return;
    const container = document.getElementById('matching-items');
    container.innerHTML = '';
    
    data.pairs.forEach(pair => {
        const item = document.createElement('div');
        item.className = 'matching-item';
        item.innerHTML = `
            <input type="text" class="word-input" placeholder="So'z yoki ibora" value="${pair.word || ''}">
            <input type="text" class="match-input" placeholder="Mos javob" value="${pair.match || ''}">
            <button type="button" class="btn-remove" onclick="removeItem(this)">❌</button>
        `;
        container.appendChild(item);
    });
}

function loadFillGapsForEdit(data) {
    if (!data.words) return;
    const container = document.getElementById('words-container');
    container.innerHTML = '';
    
    data.words.forEach(word => {
        const item = document.createElement('div');
        item.className = 'word-gap-item';
        item.innerHTML = `
            <input type="text" class="word-with-gaps" placeholder="Masalan: h__ney" value="${word.withGaps || ''}" />
            <input type="text" class="word-answer" placeholder="To'g'ri javob" value="${word.answer || ''}" />
            <button type="button" class="btn-remove" onclick="removeWordItem(this)">❌</button>
        `;
        container.appendChild(item);
    });
}

function loadWordSearchForEdit(data) {
    if (!data.words) return;
    const container = document.getElementById('wordsearch-words');
    container.innerHTML = '';
    
    const translations = data.translations || {};
    
    data.words.forEach(word => {
        const item = document.createElement('div');
        item.className = 'wordsearch-word-item';
        item.innerHTML = `
            <input type="text" class="ws-word-input" placeholder="Inglizcha so'z" value="${word}" />
            <input type="text" class="ws-translation-input" placeholder="O'zbekcha tarjima" value="${translations[word] || ''}" />
            <button type="button" class="btn-remove" onclick="removeWSWord(this)">❌</button>
        `;
        container.appendChild(item);
    });
    
    // Grid size
    const gridSizeSelect = document.getElementById('grid-size');
    if (gridSizeSelect && data.gridSize) {
        gridSizeSelect.value = data.gridSize;
    }
}

function loadCrosswordForEdit(data) {
    if (!data.words) return;
    const container = document.getElementById('crossword-words');
    container.innerHTML = '';
    
    data.words.forEach(w => {
        const item = document.createElement('div');
        item.className = 'crossword-word-item';
        item.innerHTML = `
            <input type="text" class="cw-uzbek-input" placeholder="O'zbekcha" value="${w.clue || ''}" />
            <span class="cw-arrow">→</span>
            <input type="text" class="cw-english-input" placeholder="Inglizcha" value="${w.answer || ''}" />
            <button type="button" class="btn-remove" onclick="removeCWWord(this)">❌</button>
        `;
        container.appendChild(item);
    });
}

function loadMultipleChoiceForEdit(data) {
    if (!data.questions) return;
    const container = document.getElementById('questions-list');
    container.innerHTML = '';
    
    data.questions.forEach((q, index) => {
        questionCounter = index;
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-item';
        questionDiv.innerHTML = `
            <input type="text" class="question-text" placeholder="Savol matni" value="${q.question || ''}">
            <div class="options-group">
                ${q.options.map((opt, i) => `
                    <div class="option-item">
                        <input type="radio" name="correct-${index}" value="${i}" ${q.correct === i ? 'checked' : ''}>
                        <input type="text" class="option-text" placeholder="Variant ${String.fromCharCode(65 + i)}" value="${opt}">
                    </div>
                `).join('')}
            </div>
            <button type="button" class="btn-remove" onclick="removeQuestion(this)">❌ Savolni o'chirish</button>
        `;
        container.appendChild(questionDiv);
    });
    questionCounter = data.questions.length;
}

// Matching mashq uchun yangi item qo'shish
function addMatchingItem() {
    const container = document.getElementById('matching-items');
    const newItem = document.createElement('div');
    newItem.className = 'matching-item';
    newItem.innerHTML = `
        <input type="text" class="word-input" placeholder="So'z yoki ibora">
        <input type="text" class="match-input" placeholder="Mos javob">
        <button type="button" class="btn-remove" onclick="removeItem(this)">❌</button>
    `;
    container.appendChild(newItem);
}

// Item o'chirish
function removeItem(button) {
    const item = button.parentElement;
    if (document.querySelectorAll('.matching-item').length > 1) {
        item.remove();
    } else {
        alert('Kamida bitta element bo\'lishi kerak!');
    }
}

// Fill in gaps - so'zlar uchun funksiyalar
function addWordGapItem() {
    const container = document.getElementById('words-container');
    const newItem = document.createElement('div');
    newItem.className = 'word-gap-item';
    newItem.innerHTML = `
        <input type="text" class="word-with-gaps" placeholder="Masalan: h__ney" />
        <input type="text" class="word-answer" placeholder="To'g'ri javob: honey" />
        <button type="button" class="btn-remove" onclick="removeWordItem(this)">❌</button>
    `;
    container.appendChild(newItem);
}

function removeWordItem(button) {
    const item = button.parentElement;
    if (document.querySelectorAll('.word-gap-item').length > 1) {
        item.remove();
    } else {
        alert('Kamida bitta so\'z bo\'lishi kerak!');
    }
}

// Word Search funksiyalari
function addWSWord() {
    const container = document.getElementById('wordsearch-words');
    const newItem = document.createElement('div');
    newItem.className = 'wordsearch-word-item';
    newItem.innerHTML = `
        <input type="text" class="ws-word-input" placeholder="Inglizcha so'z" />
        <input type="text" class="ws-translation-input" placeholder="O'zbekcha tarjima" />
        <button type="button" class="btn-remove" onclick="removeWSWord(this)">❌</button>
    `;
    container.appendChild(newItem);
    newItem.querySelector('.ws-word-input').focus();
}

function removeWSWord(button) {
    const item = button.parentElement;
    if (document.querySelectorAll('.wordsearch-word-item').length > 1) {
        item.remove();
    } else {
        alert('Kamida bitta so\'z bo\'lishi kerak!');
    }
}

// Word Search grid generatori
function generateWordSearchGrid(words, size) {
    // Jadval yaratish
    const grid = [];
    for (let i = 0; i < size; i++) {
        grid.push(new Array(size).fill(''));
    }

    // Yo'nalishlar: gorizontal, vertikal, diagonal
    const directions = [
        { dx: 1, dy: 0 },   // o'ngga
        { dx: 0, dy: 1 },   // pastga
        { dx: 1, dy: 1 },   // diagonal o'ng-past
        { dx: -1, dy: 0 },  // chapga
        { dx: 0, dy: -1 },  // tepaga
        { dx: -1, dy: 1 },  // diagonal chap-past
        { dx: 1, dy: -1 },  // diagonal o'ng-tepa
        { dx: -1, dy: -1 }  // diagonal chap-tepa
    ];

    // So'zlarni uzunlik bo'yicha saralash (uzunlarini avval joylashtirish)
    const sortedWords = [...words].sort((a, b) => b.length - a.length);

    // Har bir so'zni joylashtirishga urinish
    for (const word of sortedWords) {
        if (word.length > size) {
            return null; // So'z jadvalga sig'maydi
        }

        let placed = false;
        let attempts = 0;
        const maxAttempts = 100;

        while (!placed && attempts < maxAttempts) {
            attempts++;
            const dir = directions[Math.floor(Math.random() * directions.length)];
            
            // Boshlang'ich pozitsiyani topish
            let startX, startY;
            
            if (dir.dx >= 0) {
                startX = Math.floor(Math.random() * (size - word.length * Math.abs(dir.dx) + 1));
            } else {
                startX = word.length - 1 + Math.floor(Math.random() * (size - word.length + 1));
            }
            
            if (dir.dy >= 0) {
                startY = Math.floor(Math.random() * (size - word.length * Math.abs(dir.dy) + 1));
            } else {
                startY = word.length - 1 + Math.floor(Math.random() * (size - word.length + 1));
            }

            // Joylashishini tekshirish
            let canPlace = true;
            for (let i = 0; i < word.length; i++) {
                const x = startX + i * dir.dx;
                const y = startY + i * dir.dy;
                
                if (x < 0 || x >= size || y < 0 || y >= size) {
                    canPlace = false;
                    break;
                }
                
                const cell = grid[y][x];
                if (cell !== '' && cell !== word[i]) {
                    canPlace = false;
                    break;
                }
            }

            // Joylashtirish
            if (canPlace) {
                for (let i = 0; i < word.length; i++) {
                    const x = startX + i * dir.dx;
                    const y = startY + i * dir.dy;
                    grid[y][x] = word[i];
                }
                placed = true;
            }
        }

        if (!placed) {
            return null; // So'zni joylab bo'lmadi
        }
    }

    // Bo'sh joylarni tasodifiy harflar bilan to'ldirish
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            if (grid[y][x] === '') {
                grid[y][x] = letters[Math.floor(Math.random() * letters.length)];
            }
        }
    }

    return grid;
}

// Multiple choice - yangi savol qo'shish
function addQuestion() {
    questionCounter++;
    const container = document.getElementById('questions-list');
    const newQuestion = document.createElement('div');
    newQuestion.className = 'question-item';
    newQuestion.innerHTML = `
        <input type="text" class="question-text" placeholder="Savol matni">
        <div class="options-group">
            <div class="option-item">
                <input type="radio" name="correct-${questionCounter}" value="0" checked>
                <input type="text" class="option-text" placeholder="Variant A">
            </div>
            <div class="option-item">
                <input type="radio" name="correct-${questionCounter}" value="1">
                <input type="text" class="option-text" placeholder="Variant B">
            </div>
            <div class="option-item">
                <input type="radio" name="correct-${questionCounter}" value="2">
                <input type="text" class="option-text" placeholder="Variant C">
            </div>
            <div class="option-item">
                <input type="radio" name="correct-${questionCounter}" value="3">
                <input type="text" class="option-text" placeholder="Variant D">
            </div>
        </div>
        <button type="button" class="btn-remove" onclick="removeQuestion(this)">❌ Savolni o'chirish</button>
    `;
    container.appendChild(newQuestion);
}

// Savolni o'chirish
function removeQuestion(button) {
    const question = button.parentElement;
    if (document.querySelectorAll('.question-item').length > 1) {
        question.remove();
    } else {
        alert('Kamida bitta savol bo\'lishi kerak!');
    }
}

// Crossword funksiyalari
function addCWWord() {
    const container = document.getElementById('crossword-words');
    const newItem = document.createElement('div');
    newItem.className = 'crossword-word-item';
    newItem.innerHTML = `
        <input type="text" class="cw-uzbek-input" placeholder="O'zbekcha (masalan: olma)" />
        <span class="cw-arrow">→</span>
        <input type="text" class="cw-english-input" placeholder="Inglizcha (masalan: apple)" />
        <button type="button" class="btn-remove" onclick="removeCWWord(this)">❌</button>
    `;
    container.appendChild(newItem);
    newItem.querySelector('.cw-uzbek-input').focus();
}

function removeCWWord(button) {
    const item = button.parentElement;
    if (document.querySelectorAll('.crossword-word-item').length > 1) {
        item.remove();
    } else {
        alert('Kamida bitta so\'z bo\'lishi kerak!');
    }
}

// Crossword grid generatori - yaxshilangan versiya
function generateCrosswordGrid(wordPairs) {
    const words = wordPairs.map(wp => ({
        word: wp.english.toUpperCase(),
        clue: wp.uzbek,
        placed: false,
        direction: null,
        startX: null,
        startY: null,
        number: null
    }));
    
    // So'zlarni uzunlik bo'yicha saralash (uzunlari birinchi)
    words.sort((a, b) => b.word.length - a.word.length);
    
    // Katta grid yaratish
    const maxLen = Math.max(...words.map(w => w.word.length));
    const gridSize = Math.max(maxLen * 3, words.length * 4, 30);
    const grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(null));
    
    const centerX = Math.floor(gridSize / 2);
    const centerY = Math.floor(gridSize / 2);
    
    // Birinchi so'zni markazga gorizontal joylashtirish
    const firstWord = words[0];
    const startX = centerX - Math.floor(firstWord.word.length / 2);
    
    for (let i = 0; i < firstWord.word.length; i++) {
        grid[centerY][startX + i] = firstWord.word[i];
    }
    firstWord.placed = true;
    firstWord.direction = 'across';
    firstWord.startX = startX;
    firstWord.startY = centerY;
    
    // Har bir so'z uchun eng yaxshi joyni topish
    let maxAttempts = 10; // Bir necha marta urinish
    
    while (maxAttempts > 0) {
        let placedThisRound = false;
        
        for (const currentWord of words.filter(w => !w.placed)) {
            const placements = findAllPlacements(grid, currentWord.word, words.filter(w => w.placed), gridSize, centerX, centerY);
            
            if (placements.length > 0) {
                // Eng yaxshi joyni tanlash (ko'p kesishish + markazga yaqin)
                placements.sort((a, b) => b.score - a.score);
                const best = placements[0];
                
                placeWord(grid, currentWord.word, best.x, best.y, best.dir);
                currentWord.placed = true;
                currentWord.direction = best.dir;
                currentWord.startX = best.x;
                currentWord.startY = best.y;
                placedThisRound = true;
            }
        }
        
        if (!placedThisRound) break;
        maxAttempts--;
    }
    
    // Joylashmagan so'zlarni alohida joylashtirish
    const unplacedWords = words.filter(w => !w.placed);
    if (unplacedWords.length > 0) {
        let offsetY = 3;
        const boundingBox = getBoundingBox(grid, gridSize);
        
        for (const w of unplacedWords) {
            // Yon tomonga yoki pastga qo'shish
            let placed = false;
            
            // Avval yon tomonga sinash
            for (let tryY = boundingBox.minY; tryY <= boundingBox.maxY && !placed; tryY += 2) {
                const newX = boundingBox.maxX + 3;
                if (newX + w.word.length < gridSize) {
                    if (canPlaceWordRelaxed(grid, w.word, newX, tryY, 'across', gridSize)) {
                        placeWord(grid, w.word, newX, tryY, 'across');
                        w.placed = true;
                        w.direction = 'across';
                        w.startX = newX;
                        w.startY = tryY;
                        placed = true;
                    }
                }
            }
            
            // Pastga qo'shish
            if (!placed) {
                const newY = boundingBox.maxY + offsetY;
                const newX = boundingBox.minX;
                
                if (newY < gridSize && newX + w.word.length < gridSize) {
                    placeWord(grid, w.word, newX, newY, 'across');
                    w.placed = true;
                    w.direction = 'across';
                    w.startX = newX;
                    w.startY = newY;
                    offsetY += 2;
                }
            }
        }
    }
    
    // Raqamlarni belgilash
    let number = 1;
    const numberedCells = [];
    const startPositions = [];
    
    for (const w of words.filter(w => w.placed)) {
        startPositions.push({ x: w.startX, y: w.startY, word: w });
    }
    
    startPositions.sort((a, b) => {
        if (a.y !== b.y) return a.y - b.y;
        return a.x - b.x;
    });
    
    const usedPositions = new Map();
    for (const pos of startPositions) {
        const key = `${pos.x},${pos.y}`;
        if (!usedPositions.has(key)) {
            usedPositions.set(key, number);
            pos.word.number = number;
            numberedCells.push({ x: pos.x, y: pos.y, number: number });
            number++;
        } else {
            pos.word.number = usedPositions.get(key);
        }
    }
    
    // Gridni kompakt qilish (bo'sh qatorlarni olib tashlash)
    const result = compactGrid(grid, words.filter(w => w.placed), numberedCells);
    
    return {
        grid: result.grid,
        gridSize: result.gridSize,
        words: words.filter(w => w.placed).map(w => ({
            word: w.word,
            clue: w.clue,
            direction: w.direction,
            startX: w.startX - result.offsetX,
            startY: w.startY - result.offsetY,
            number: w.number
        })),
        numberedCells: result.numberedCells
    };
}

// Barcha mumkin bo'lgan joylarni topish
function findAllPlacements(grid, word, placedWords, gridSize, centerX, centerY) {
    const placements = [];
    
    // Har bir joylashtirilgan so'z bilan kesishishni tekshirish
    for (const placed of placedWords) {
        for (let pi = 0; pi < placed.word.length; pi++) {
            for (let ci = 0; ci < word.length; ci++) {
                // Agar harflar mos kelsa
                if (placed.word[pi] === word[ci]) {
                    let newDir, newStartX, newStartY;
                    
                    if (placed.direction === 'across') {
                        // Joylashtirilgan so'z gorizontal bo'lsa, yangi so'z vertikal bo'ladi
                        newDir = 'down';
                        newStartX = placed.startX + pi;
                        newStartY = placed.startY - ci;
                    } else {
                        // Joylashtirilgan so'z vertikal bo'lsa, yangi so'z gorizontal bo'ladi
                        newDir = 'across';
                        newStartX = placed.startX - ci;
                        newStartY = placed.startY + pi;
                    }
                    
                    if (canPlaceWord(grid, word, newStartX, newStartY, newDir, gridSize)) {
                        // Ballni hisoblash
                        const intersections = countIntersections(grid, word, newStartX, newStartY, newDir);
                        const distFromCenter = Math.abs(newStartX - centerX) + Math.abs(newStartY - centerY);
                        
                        // Ko'proq kesishish = yuqori ball, markazga yaqin = yuqori ball
                        const score = (intersections * 100) + (50 - distFromCenter);
                        
                        placements.push({
                            dir: newDir,
                            x: newStartX,
                            y: newStartY,
                            score: score,
                            intersections: intersections
                        });
                    }
                }
            }
        }
    }
    
    return placements;
}

// Kesishishlar sonini hisoblash
function countIntersections(grid, word, startX, startY, direction) {
    const dx = direction === 'across' ? 1 : 0;
    const dy = direction === 'down' ? 1 : 0;
    let count = 0;
    
    for (let i = 0; i < word.length; i++) {
        const x = startX + dx * i;
        const y = startY + dy * i;
        if (grid[y] && grid[y][x] === word[i]) {
            count++;
        }
    }
    
    return count;
}

// Alohida joy topish (kesishmasdan)
function findSeparatePlacement(grid, word, placedWords, gridSize, preferredDir) {
    const boundingBox = getBoundingBox(grid, gridSize);
    
    // Vertikal joylashtirish
    if (preferredDir === 'down') {
        // O'ng tomonga qo'shish
        const newX = boundingBox.maxX + 2;
        const newY = boundingBox.minY;
        if (newX < gridSize && newY + word.length < gridSize) {
            if (canPlaceWordRelaxed(grid, word, newX, newY, 'down', gridSize)) {
                return { dir: 'down', x: newX, y: newY };
            }
        }
    } else {
        // Pastga qo'shish
        const newY = boundingBox.maxY + 2;
        const newX = boundingBox.minX;
        if (newY < gridSize && newX + word.length < gridSize) {
            if (canPlaceWordRelaxed(grid, word, newX, newY, 'across', gridSize)) {
                return { dir: 'across', x: newX, y: newY };
            }
        }
    }
    
    return null;
}

// Bounding box topish
function getBoundingBox(grid, gridSize) {
    let minX = gridSize, maxX = 0, minY = gridSize, maxY = 0;
    
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            if (grid[y][x] !== null) {
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);
            }
        }
    }
    
    return { minX, maxX, minY, maxY };
}

// Yumshoqroq tekshirish (alohida joylashtirish uchun)
function canPlaceWordRelaxed(grid, word, startX, startY, direction, gridSize) {
    const dx = direction === 'across' ? 1 : 0;
    const dy = direction === 'down' ? 1 : 0;
    
    const endX = startX + dx * (word.length - 1);
    const endY = startY + dy * (word.length - 1);
    
    if (startX < 0 || startY < 0 || endX >= gridSize || endY >= gridSize) {
        return false;
    }
    
    for (let i = 0; i < word.length; i++) {
        const x = startX + dx * i;
        const y = startY + dy * i;
        if (grid[y][x] !== null) {
            return false;
        }
    }
    
    return true;
}

function canPlaceWord(grid, word, startX, startY, direction, gridSize) {
    const dx = direction === 'across' ? 1 : 0;
    const dy = direction === 'down' ? 1 : 0;
    
    // Chegaradan chiqib ketmasin
    const endX = startX + dx * (word.length - 1);
    const endY = startY + dy * (word.length - 1);
    
    if (startX < 0 || startY < 0 || endX >= gridSize || endY >= gridSize) {
        return false;
    }
    
    // So'z boshidan oldin bo'sh joy bo'lsin
    const beforeX = startX - dx;
    const beforeY = startY - dy;
    if (beforeX >= 0 && beforeY >= 0 && grid[beforeY][beforeX] !== null) {
        return false;
    }
    
    // So'z oxiridan keyin bo'sh joy bo'lsin
    const afterX = endX + dx;
    const afterY = endY + dy;
    if (afterX < gridSize && afterY < gridSize && grid[afterY][afterX] !== null) {
        return false;
    }
    
    // Har bir harf uchun tekshirish
    for (let i = 0; i < word.length; i++) {
        const x = startX + dx * i;
        const y = startY + dy * i;
        
        const cell = grid[y][x];
        
        if (cell !== null && cell !== word[i]) {
            return false; // Boshqa harf bor
        }
        
        // Yon tomonlarda boshqa harf bo'lmasin (kesishish nuqtasidan tashqari)
        if (cell === null) {
            // Gorizontal so'z uchun yuqori/past tekshirish
            if (direction === 'across') {
                if (y > 0 && grid[y-1][x] !== null) return false;
                if (y < gridSize - 1 && grid[y+1][x] !== null) return false;
            }
            // Vertikal so'z uchun chap/o'ng tekshirish
            if (direction === 'down') {
                if (x > 0 && grid[y][x-1] !== null) return false;
                if (x < gridSize - 1 && grid[y][x+1] !== null) return false;
            }
        }
    }
    
    return true;
}

function placeWord(grid, word, startX, startY, direction) {
    const dx = direction === 'across' ? 1 : 0;
    const dy = direction === 'down' ? 1 : 0;
    
    for (let i = 0; i < word.length; i++) {
        const x = startX + dx * i;
        const y = startY + dy * i;
        grid[y][x] = word[i];
    }
}

function compactGrid(grid, placedWords, numberedCells) {
    // Gridning ishlatilgan qismini topish
    let minX = grid[0].length, maxX = 0;
    let minY = grid.length, maxY = 0;
    
    for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[y].length; x++) {
            if (grid[y][x] !== null) {
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);
            }
        }
    }
    
    // Yangi kompakt grid
    const newHeight = maxY - minY + 1;
    const newWidth = maxX - minX + 1;
    const newGrid = [];
    
    for (let y = minY; y <= maxY; y++) {
        const row = [];
        for (let x = minX; x <= maxX; x++) {
            row.push(grid[y][x]);
        }
        newGrid.push(row);
    }
    
    // Raqamli kataklar pozitsiyasini yangilash
    const newNumberedCells = numberedCells.map(nc => ({
        x: nc.x - minX,
        y: nc.y - minY,
        number: nc.number
    }));
    
    return {
        grid: newGrid,
        gridSize: Math.max(newWidth, newHeight),
        gridWidth: newWidth,
        gridHeight: newHeight,
        numberedCells: newNumberedCells,
        offsetX: minX,
        offsetY: minY
    };
}

// Mashqni saqlash
async function saveExercise() {
    const title = document.getElementById('title').value.trim();
    
    if (!title) {
        alert('Mashq nomini kiriting!');
        return;
    }

    // Grade va subject majburiy tekshiruvi
    const gradeEl   = document.getElementById('ex-grade');
    const subjectEl = document.getElementById('ex-subject');
    if (!gradeEl || !gradeEl.value) {
        gradeEl && gradeEl.style.setProperty('border-color','#ef4444','important');
        alert('⚠️ Sinf / Yosh guruhini tanlang!');
        gradeEl && gradeEl.focus();
        return;
    }
    if (!subjectEl || !subjectEl.value) {
        subjectEl && subjectEl.style.setProperty('border-color','#ef4444','important');
        alert('⚠️ Fanni tanlang!');
        subjectEl && subjectEl.focus();
        return;
    }

    let content = {};

    if (exerciseType === 'matching') {
        const items = [];
        const matchingItems = document.querySelectorAll('.matching-item');
        
        matchingItems.forEach((item, index) => {
            const word = item.querySelector('.word-input').value.trim();
            const match = item.querySelector('.match-input').value.trim();
            
            if (word && match) {
                items.push({
                    id: index,
                    word: word,
                    match: match
                });
            }
        });

        if (items.length < 2) {
            alert('Kamida 2 ta juftlik kiriting!');
            return;
        }

        content = { items: items };

    } else if (exerciseType === 'fill_gaps') {
        const words = [];
        const wordItems = document.querySelectorAll('.word-gap-item');

        wordItems.forEach((item, index) => {
            const wordWithGap = item.querySelector('.word-with-gaps').value.trim();
            const answer = item.querySelector('.word-answer').value.trim();
            
            if (wordWithGap && answer) {
                words.push({
                    id: index,
                    word: wordWithGap,
                    answer: answer
                });
            }
        });

        if (words.length === 0) {
            alert('Kamida bitta so\'z kiriting!');
            return;
        }

        content = {
            words: words
        };

    } else if (exerciseType === 'multiple_choice') {
        const questions = [];
        const questionItems = document.querySelectorAll('.question-item');

        questionItems.forEach((item, qIndex) => {
            const questionText = item.querySelector('.question-text').value.trim();
            const options = [];
            const optionInputs = item.querySelectorAll('.option-text');
            
            optionInputs.forEach(input => {
                const optText = input.value.trim();
                if (optText) {
                    options.push(optText);
                }
            });

            const correctRadio = item.querySelector('input[type="radio"]:checked');
            const correctIndex = parseInt(correctRadio.value);

            if (questionText && options.length >= 2) {
                questions.push({
                    question: questionText,
                    options: options,
                    correct: correctIndex
                });
            }
        });

        if (questions.length === 0) {
            alert('Kamida bitta to\'liq savol kiriting!');
            return;
        }

        content = { questions: questions };

    } else if (exerciseType === 'word_search') {
        const words = [];
        const translations = {};
        const wordItems = document.querySelectorAll('.wordsearch-word-item');
        
        wordItems.forEach(item => {
            const wordInput = item.querySelector('.ws-word-input');
            const translationInput = item.querySelector('.ws-translation-input');
            const word = wordInput.value.trim().toUpperCase();
            const translation = translationInput ? translationInput.value.trim() : '';
            
            if (word && word.length >= 2) {
                words.push(word);
                if (translation) {
                    translations[word] = translation;
                }
            }
        });

        if (words.length < 2) {
            alert('Kamida 2 ta so\'z kiriting!');
            return;
        }

        const gridSize = parseInt(document.getElementById('grid-size').value);
        const grid = generateWordSearchGrid(words, gridSize);

        if (!grid) {
            alert('So\'zlar juda uzun yoki ko\'p. Jadval o\'lchamini kattalashtiring!');
            return;
        }

        content = {
            words: words,
            translations: translations,
            grid: grid,
            gridSize: gridSize,
            pdf_options: {
                ws_border_color: (document.getElementById('ws-border-color') || {value: '#e0e0e0'}).value,
                ws_word_font:    (document.getElementById('ws-word-font')    || {value: 'cambria'}).value,
                ws_grid_font:    (document.getElementById('ws-grid-font')    || {value: 'sitka'}).value,
            }
        };
    } else if (exerciseType === 'crossword') {
        const wordPairs = [];
        const wordItems = document.querySelectorAll('.crossword-word-item');
        
        wordItems.forEach(item => {
            const uzbek = item.querySelector('.cw-uzbek-input').value.trim();
            const english = item.querySelector('.cw-english-input').value.trim();
            
            if (uzbek && english && english.length >= 2) {
                wordPairs.push({ uzbek, english: english.toUpperCase() });
            }
        });

        if (wordPairs.length < 2) {
            alert('Kamida 2 ta so\'z juftligi kiriting!');
            return;
        }

        const crosswordData = generateCrosswordGrid(wordPairs);

        if (!crosswordData || crosswordData.words.length < 2) {
            alert('Crossword yaratib bo\'lmadi. So\'zlar orasida umumiy harflar yo\'q yoki so\'zlar juda ko\'p.');
            return;
        }

        content = crosswordData;
    } else if (exerciseType === 'domino') {
        const items = [];
        document.querySelectorAll('.domino-item').forEach(item => {
            const word = item.querySelector('.domino-word-input').value.trim().toUpperCase();
            const imgData = item.querySelector('.domino-img-data').value;
            if (word) items.push({ word, image_data: imgData });
        });
        if (items.length < 1) {
            alert('Kamida bitta element kiriting!');
            return;
        }
        content = { items };
    } else if (exerciseType === 'find_pairings') {
        const pairs = [];
        document.querySelectorAll('.pairing-item').forEach(item => {
            const english = item.querySelector('.pairing-english').value.trim();
            const uzbek   = item.querySelector('.pairing-uzbek').value.trim();
            if (english && uzbek) pairs.push({ english, uzbek });
        });
        if (pairs.length < 2) {
            alert('Kamida 2 ta juftlik kiriting!');
            return;
        }
        content = { pairs };
    }
    try {
        const url = editMode ? '/api/update_exercise' : '/api/save_exercise';

        // Tahrirlash rejimida sharing so'ralmaydi
        let isPublic = false;
        if (!editMode) {
            const consent = await askSharingConsent();
            if (consent === null) {
                // Foydalanuvchi bekor qildi — hech narsa saqlanmaydi
                return;
            }
            isPublic = consent;
        }

        const bodyData = editMode ? {
            id: editExerciseId,
            title: title,
            type: exerciseType,
            content: content,
            grade: document.getElementById('ex-grade')?.value || '',
            subject: document.getElementById('ex-subject')?.value || ''
        } : {
            title: title,
            type: exerciseType,
            content: content,
            is_public: isPublic,
            grade: document.getElementById('ex-grade')?.value || '',
            subject: document.getElementById('ex-subject')?.value || ''
        };
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bodyData)
        });

        const data = await response.json();

        if (data.success) {
            alert(editMode ? 'Mashq muvaffaqiyatli yangilandi! ✓' : 'Mashq muvaffaqiyatli saqlandi! ✓');
            window.location.href = '/admin';
        } else {
            alert('Xatolik yuz berdi!');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Xatolik yuz berdi!');
    }
}

/**
 * Sharing ruxsati uchun modal dialog
 * @returns {Promise<boolean>} - true = public, false = private
 */
function askSharingConsent() {
    return new Promise((resolve) => {
        // Mavjud modalni olib tashlash
        const existing = document.getElementById('sharing-consent-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'sharing-consent-modal';
        modal.style.cssText = `
            position:fixed; inset:0; background:rgba(0,0,0,.55);
            z-index:9999; display:flex; align-items:center; justify-content:center;
        `;
        modal.innerHTML = `
            <div style="background:#fff; border-radius:16px; padding:32px 28px;
                        max-width:460px; width:95%; box-shadow:0 20px 60px rgba(0,0,0,.3);">
                <div style="font-size:2em; text-align:center; margin-bottom:12px;">🔔</div>
                <h3 style="margin:0 0 20px; color:#2c3e50; text-align:center; font-size:1.2em;">
                    Mashqni boshqalar bilan ulashish
                </h3>

                <!-- Muhim eslatma: darhol ko'rinadi -->
                <div style="
                    background:#fff8e1; border:1.5px solid #f9a825;
                    border-radius:10px; padding:12px 16px; margin-bottom:24px;">
                    <div style="display:flex; align-items:flex-start; gap:10px;">
                        <span style="font-size:1.3em; flex-shrink:0;">⚠️</span>
                        <div>
                            <div style="font-weight:700; color:#e65100; font-size:.9em; margin-bottom:4px;">
                                Muhim eslatma
                            </div>
                            <div style="color:#5d4037; font-size:.85em; line-height:1.6;">
                                Siz tayyorlagan mashq <strong>umumiy hisoblanadi</strong> va undan
                                <strong>barcha foydalanuvchilar</strong> foydalanishi mumkin.
                            </div>
                        </div>
                    </div>
                </div>

                <div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap;">
                    <button id="sc-cancel" style="
                        padding:12px 20px; border-radius:10px; border:2px solid #e74c3c;
                        background:#fff; color:#e74c3c; font-size:.9em; cursor:pointer;
                        font-weight:600; transition:all .2s;">
                        ✕ Mashq yaratishni bekor qilish
                    </button>
                    <button id="sc-yes" style="
                        padding:12px 24px; border-radius:10px; border:none;
                        background:linear-gradient(135deg,#27ae60,#2ecc71);
                        color:#fff; font-size:.95em; cursor:pointer;
                        font-weight:600; box-shadow:0 4px 12px rgba(39,174,96,.4);
                        transition:all .2s;">
                        ✅ Roziman, saqlash
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('#sc-yes').onclick    = () => { modal.remove(); resolve(true); };
        modal.querySelector('#sc-cancel').onclick = () => { modal.remove(); resolve(null); };
    });
}

// ==================== DOMINO ====================
let dominoCounter = 1;

function addDominoItem() {
    dominoCounter++;
    const container = document.getElementById('domino-items');
    const div = document.createElement('div');
    div.className = 'domino-item';
    div.dataset.index = dominoCounter - 1;
    div.innerHTML = `
        <div class="domino-item-header">
            <span class="domino-num">${dominoCounter}-element</span>
            <button type="button" class="btn-remove" onclick="removeDominoItem(this)">&#10060;</button>
        </div>
        <div class="domino-item-body">
            <div class="domino-field">
                <label>Inglizcha so'z:</label>
                <input type="text" class="domino-word-input" placeholder="Masalan: CIRCUS">
            </div>
            <div class="domino-field">
                <label>Rasm:</label>
                <div class="domino-img-upload">
                    <input type="file" class="domino-file-input" accept="image/*" onchange="handleDominoImage(this)" style="display:none">
                    <button type="button" class="btn btn-secondary" onclick="this.previousElementSibling.click()">📷 Rasm tanlash</button>
                    <span class="domino-img-name" style="margin-left:8px;color:#666;font-size:.85em;">Rasm tanlanmagan</span>
                </div>
                <div class="domino-img-preview" style="margin-top:8px;"></div>
                <input type="hidden" class="domino-img-data" value="">
            </div>
        </div>`;
    container.appendChild(div);
}

function removeDominoItem(btn) {
    const item = btn.closest('.domino-item');
    if (document.querySelectorAll('.domino-item').length > 1) {
        item.remove();
        document.querySelectorAll('.domino-item').forEach((el, i) => {
            el.querySelector('.domino-num').textContent = (i + 1) + '-element';
        });
    } else {
        alert('Kamida bitta element bo\'lishi kerak!');
    }
}

async function handleDominoImage(input) {
    const file = input.files[0];
    if (!file) return;
    const item = input.closest('.domino-item');
    const nameSpan = item.querySelector('.domino-img-name');
    const preview = item.querySelector('.domino-img-preview');
    const hiddenData = item.querySelector('.domino-img-data');
    nameSpan.textContent = 'Yuklanmoqda...';
    const formData = new FormData();
    formData.append('image', file);
    try {
        const resp = await fetch('/api/upload-image', { method: 'POST', body: formData });
        const data = await resp.json();
        if (data.success) {
            hiddenData.value = data.data_url;
            nameSpan.textContent = file.name;
            preview.innerHTML = `<img src="${data.data_url}">`;
        } else {
            nameSpan.textContent = 'Xatolik: ' + (data.error || 'Noma\'lum xato');
        }
    } catch (e) {
        nameSpan.textContent = 'Xatolik yuz berdi';
    }
}

// ==================== FIND PAIRINGS ====================
function updateFPCount() {
    const badge = document.getElementById('fpCount');
    if (badge) {
        const n = document.querySelectorAll('.pairing-item').length;
        badge.textContent = `${n} ta juftlik`;
    }
}

function addPairingItem() {
    const container = document.getElementById('pairings-items');
    const div = document.createElement('div');
    div.className = 'pairing-item';
    div.innerHTML = `
        <input type="text" class="pairing-english" placeholder="English so'z">
        <div class="fp-arrow">↔</div>
        <input type="text" class="pairing-uzbek" placeholder="O'zbekcha tarjima">
        <button type="button" class="btn-remove" onclick="removePairingItem(this)" title="O'chirish">✕</button>
    `;
    container.appendChild(div);
    div.querySelector('.pairing-english').focus();
    updateFPCount();
}

function removePairingItem(btn) {
    const item = btn.parentElement;
    if (document.querySelectorAll('.pairing-item').length > 1) {
        item.remove();
        updateFPCount();
    } else {
        alert('Kamida bitta juftlik bo\'lishi kerak!');
    }
}

function loadVocabForFindPairings(words, isNewFormat) {
    const container = document.getElementById('pairings-items');
    if (!container) return;
    container.innerHTML = '';
    words.forEach(item => {
        const eng = isNewFormat ? item.word : item;
        const uzb = isNewFormat ? (item.translation || '') : '';
        const div = document.createElement('div');
        div.className = 'pairing-item';
        div.innerHTML = `
            <input type="text" class="pairing-english" value="${eng}">
            <div class="fp-arrow">↔</div>
            <input type="text" class="pairing-uzbek" value="${uzb}">
            <button type="button" class="btn-remove" onclick="removePairingItem(this)" title="O'chirish">✕</button>
        `;
        container.appendChild(div);
    });
    updateFPCount();
}

function loadFindPairingsForEdit(data) {
    if (!data.pairs) return;
    const container = document.getElementById('pairings-items');
    if (!container) return;
    container.innerHTML = '';
    data.pairs.forEach(pair => {
        const div = document.createElement('div');
        div.className = 'pairing-item';
        div.innerHTML = `
            <input type="text" class="pairing-english" value="${pair.english || ''}">
            <div class="fp-arrow">↔</div>
            <input type="text" class="pairing-uzbek" value="${pair.uzbek || ''}">
            <button type="button" class="btn-remove" onclick="removePairingItem(this)" title="O'chirish">✕</button>
        `;
        container.appendChild(div);
    });
}
