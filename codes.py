"""
====================================================================================================
WORD SEARCH MASHQI - TO'LIQ KOD PAKETI
====================================================================================================
Bu faylda Word Search mashqining barcha funksiyalari to'liq ko'chirilgan.
Boshqa loyihada ishlatish uchun kerakli qismlarini olib ishlatishingiz mumkin.

Tarkibi:
1. JavaScript - exercise.js (o'yin logikasi)
2. JavaScript - create.js (mashq yaratish)
3. CSS - style.css (stillar)
4. HTML - create.html (forma)
====================================================================================================
"""

# ============================================
# 1. JAVASCRIPT - EXERCISE.JS (O'YIN LOGIKASI)
# ============================================

WORD_SEARCH_JS = '''
// ==================== WORD SEARCH MASHQI ====================

// Global o'zgaruvchilar
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
let wsCurrentVariant = 0;
let wsWordPositions = [];
let wsFoundWords = new Set();

// Musobaqa o'zgaruvchilari
let wsBattleMode = false;
let wsBattlePlayers = ['O\\'yinchi 1', 'O\\'yinchi 2'];
let wsBattleScores = [0, 0];
let wsBattleCurrentPlayer = 0;
let wsBattleTimePerWord = 30;
let wsBattleWordsFound = [[], []];
let wsBattleTranslationBonus = [0, 0];
let wsTranslations = {};

// Grid generator funksiyasi
function generateWordSearchGrid(words, gridSize) {
    const grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(''));
    const wordPositions = [];
    
    const directions = [
        { dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
        { dx: 1, dy: 1 }, { dx: -1, dy: -1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 }
    ];
    
    words.forEach(word => {
        let placed = false;
        let attempts = 0;
        
        while (!placed && attempts < 100) {
            attempts++;
            const dir = directions[Math.floor(Math.random() * directions.length)];
            const startX = Math.floor(Math.random() * gridSize);
            const startY = Math.floor(Math.random() * gridSize);
            
            const endX = startX + dir.dx * (word.length - 1);
            const endY = startY + dir.dy * (word.length - 1);
            
            if (endX < 0 || endX >= gridSize || endY < 0 || endY >= gridSize) continue;
            
            let canPlace = true;
            for (let i = 0; i < word.length; i++) {
                const x = startX + dir.dx * i;
                const y = startY + dir.dy * i;
                if (grid[y][x] !== '' && grid[y][x] !== word[i]) {
                    canPlace = false;
                    break;
                }
            }
            
            if (canPlace) {
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

// Tarjima modali
function showTranslationModal(word, callback) {
    let modal = document.getElementById('ws-translation-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'ws-translation-modal';
        modal.className = 'ws-translation-modal';
        document.body.appendChild(modal);
    }
    
    const allTranslations = Object.entries(window.wsTranslations || {});
    const shuffled = allTranslations.sort(() => Math.random() - 0.5);
    
    let optionsHtml = '';
    shuffled.forEach(([w, t]) => {
        optionsHtml += `<button class="ws-trans-option" onclick="selectTranslation('\\'${w}\\')">\${t}</button>`;
    });
    
    modal.innerHTML = `
        <div class="ws-translation-modal-content">
            <h3>🎯 "\${word}" so'zining tarjimasini toping!</h3>
            <p>To'g'ri tarjimani tanlang (+2 ball)</p>
            <div class="ws-trans-options">\${optionsHtml}</div>
            <button class="btn btn-secondary" onclick="skipTranslation()">⏭️ O'tkazib yuborish</button>
        </div>
    `;
    
    modal.style.display = 'flex';
    wsCurrentWordForTranslation = word;
    wsTranslationCallback = callback;
    
    if (wsWordTimerInterval) clearInterval(wsWordTimerInterval);
}

function selectTranslation(selectedWord) {
    const modal = document.getElementById('ws-translation-modal');
    const isCorrect = selectedWord === wsCurrentWordForTranslation;
    
    if (isCorrect) {
        if (wsBattleMode) {
            wsBattleScores[wsBattleCurrentPlayer] += 2;
            wsBattleTranslationBonus[wsBattleCurrentPlayer] += 2;
            updateBattleScores();
            showBattleScoreChange(wsBattleCurrentPlayer, +2);
        } else {
            wsScore += 2;
            updateScoreDisplay();
        }
        modal.querySelector('.ws-translation-modal-content').classList.add('correct-answer');
    } else {
        modal.querySelector('.ws-translation-modal-content').classList.add('wrong-answer');
    }
    
    setTimeout(() => {
        modal.style.display = 'none';
        if (wsTranslationCallback) wsTranslationCallback();
    }, 800);
}

// Musobaqa rejimi
function startBattleMode() {
    const player1Name = document.getElementById('ws-player1-name').value.trim() || 'O\\'yinchi 1';
    const player2Name = document.getElementById('ws-player2-name').value.trim() || 'O\\'yinchi 2';
    const timePerWord = parseInt(document.getElementById('ws-battle-time').value);
    
    wsBattleMode = true;
    wsBattlePlayers = [player1Name, player2Name];
    wsBattleScores = [0, 0];
    wsBattleTranslationBonus = [0, 0];
    wsBattleTimePerWord = timePerWord;
    wsBattleWordsFound = [[], []];
    wsFoundWords = new Set();
    wsBattleCurrentPlayer = Math.random() < 0.5 ? 0 : 1;
    
    updateBattleTurn();
    startBattleTimer();
    wsGameStarted = true;
}

function switchBattleTurn() {
    wsBattleCurrentPlayer = wsBattleCurrentPlayer === 0 ? 1 : 0;
    updateBattleTurn();
    wsWordTimeLeft = wsBattleTimePerWord;
    startBattleTimer();
}

function startBattleTimer() {
    if (wsWordTimerInterval) clearInterval(wsWordTimerInterval);
    
    wsWordTimerInterval = setInterval(() => {
        wsWordTimeLeft--;
        updateBattleTimerDisplay();
        
        if (wsWordTimeLeft <= 0) {
            wsBattleScores[wsBattleCurrentPlayer]--;
            updateBattleScores();
            switchBattleTurn();
        }
    }, 1000);
}
'''

# ============================================
# 2. JAVASCRIPT - CREATE.JS (MASHQ YARATISH)
# ============================================

WORD_SEARCH_CREATE_JS = '''
// Word Search yaratish funksiyalari

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
}

function generateWordSearchGrid(words, size) {
    const grid = [];
    for (let i = 0; i < size; i++) {
        grid.push(new Array(size).fill(''));
    }
    
    const directions = [
        { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 1, dy: 1 },
        { dx: -1, dy: 0 }, { dx: 0, dy: -1 }, { dx: -1, dy: 1 },
        { dx: 1, dy: -1 }, { dx: -1, dy: -1 }
    ];
    
    const sortedWords = [...words].sort((a, b) => b.length - a.length);
    
    for (const word of sortedWords) {
        if (word.length > size) return null;
        
        let placed = false;
        let attempts = 0;
        
        while (!placed && attempts < 100) {
            attempts++;
            const dir = directions[Math.floor(Math.random() * directions.length)];
            const startX = Math.floor(Math.random() * size);
            const startY = Math.floor(Math.random() * size);
            
            let canPlace = true;
            for (let i = 0; i < word.length; i++) {
                const x = startX + i * dir.dx;
                const y = startY + i * dir.dy;
                if (x < 0 || x >= size || y < 0 || y >= size || 
                    (grid[y][x] !== '' && grid[y][x] !== word[i])) {
                    canPlace = false;
                    break;
                }
            }
            
            if (canPlace) {
                for (let i = 0; i < word.length; i++) {
                    const x = startX + i * dir.dx;
                    const y = startY + i * dir.dy;
                    grid[y][x] = word[i];
                }
                placed = true;
            }
        }
        
        if (!placed) return null;
    }
    
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
'''

# ============================================
# 3. CSS STILLAR
# ============================================

WORD_SEARCH_CSS = '''
/* ==================== WORD SEARCH STILLAR ==================== */

.wordsearch-exercise {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
}

.ws-grid {
    display: inline-block;
    background: #f8f9fa;
    padding: 10px;
    border-radius: 10px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    user-select: none;
}

.ws-row {
    display: flex;
}

.ws-cell {
    width: 35px;
    height: 35px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: 700;
    background: white;
    border: 1px solid #e0e0e0;
    cursor: pointer;
    transition: all 0.15s ease;
}

.ws-cell:hover {
    background: #e8f0fe;
}

.ws-selecting {
    background: #667eea !important;
    color: white !important;
    transform: scale(1.05);
}

.ws-found {
    background: #27ae60 !important;
    color: white !important;
}

.ws-word-list {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
}

.ws-word {
    background: #667eea;
    color: white;
    padding: 8px 15px;
    border-radius: 20px;
    font-weight: 600;
    letter-spacing: 1px;
}

.ws-word-found {
    background: #27ae60;
    text-decoration: line-through;
    opacity: 0.7;
}

/* Musobaqa rejimi */
.ws-battle-header {
    display: flex;
    justify-content: center;
    gap: 30px;
    margin-bottom: 20px;
}

.ws-battle-player {
    background: linear-gradient(135deg, #ecf0f1 0%, #bdc3c7 100%);
    padding: 15px 25px;
    border-radius: 15px;
    display: flex;
    align-items: center;
    gap: 12px;
}

.ws-battle-player.active-player {
    transform: scale(1.08);
    box-shadow: 0 5px 25px rgba(0, 0, 0, 0.3);
}

.ws-player-score {
    font-size: 1.8em;
    font-weight: 700;
    font-family: 'Courier New', monospace;
}

/* Tarjima modal */
.ws-translation-modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    z-index: 10001;
    justify-content: center;
    align-items: center;
}

.ws-translation-modal-content {
    background: white;
    padding: 30px;
    border-radius: 20px;
    text-align: center;
    max-width: 500px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.ws-trans-options {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin-bottom: 20px;
}

.ws-trans-option {
    padding: 15px 20px;
    border: 2px solid #667eea;
    border-radius: 10px;
    background: white;
    font-size: 1.1em;
    font-weight: 600;
    cursor: pointer;
}

.ws-trans-option:hover {
    background: #667eea;
    color: white;
}
'''

# ============================================
# 4. HTML FORMA
# ============================================

WORD_SEARCH_HTML = '''
<!-- Word Search yaratish formasi -->
<div class="wordsearch-form">
    <h3>Qidiriladigan so'zlar va tarjimalarini kiriting:</h3>
    <div id="wordsearch-words">
        <div class="wordsearch-word-item">
            <input type="text" class="ws-word-input" placeholder="Inglizcha so'z" />
            <input type="text" class="ws-translation-input" placeholder="O'zbekcha tarjima" />
            <button type="button" onclick="removeWSWord(this)">❌</button>
        </div>
    </div>
    <button type="button" onclick="addWSWord()">➕ So'z qo'shish</button>
    <div class="grid-size-option">
        <label>Jadval o'lchami: </label>
        <select id="grid-size">
            <option value="10">10x10</option>
            <option value="12">12x12</option>
            <option value="15" selected>15x15</option>
            <option value="18">18x18</option>
            <option value="20">20x20</option>
        </select>
    </div>
</div>
'''

# ============================================
# FOYDALANISH YO'RIQNOMASI
# ============================================

USAGE_GUIDE = '''
====================================================================================================
FOYDALANISH YO'RIQNOMASI
====================================================================================================

1. JAVASCRIPT KODLARINI QO'SHISH:
   - WORD_SEARCH_JS o'zgaruvchisidagi kodni exercise.js fayliga nusxalang
   - WORD_SEARCH_CREATE_JS ni create.js fayliga qo'shing

2. CSS STILLARNI QO'SHISH:
   - WORD_SEARCH_CSS dagi stillarni style.css fayliga qo'shing

3. HTML FORMANI QO'SHISH:
   - WORD_SEARCH_HTML dagi HTMLni o'z sahifangizga joylashtiring

4. ASOSIY FUNKSIYALAR:
   - generateWordSearchGrid(words, gridSize) - Grid yaratadi
   - loadWordSearchExercise(content) - Mashqni yuklaydi
   - startBattleMode() - Musobaqa rejimini boshlaydi
   - showTranslationModal(word, callback) - Tarjima modali

5. KERAKLI O'ZGARUVCHILAR:
   - wsWords - So'zlar ro'yxati
   - wsGridSize - Jadval o'lchami
   - wsTranslations - Tarjimalar objekti
   - wsBattleMode - Musobaqa rejimi flagи

====================================================================================================
'''

if __name__ == "__main__":
    print(USAGE_GUIDE)
    print("\\nKodlar tayyor! Yuqoridagi o'zgaruvchilardan foydalaning:")
    print("- WORD_SEARCH_JS")
    print("- WORD_SEARCH_CREATE_JS")
    print("- WORD_SEARCH_CSS")
    print("- WORD_SEARCH_HTML")
