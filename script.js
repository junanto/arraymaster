// URL Google Apps Script Anda
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwG8lq190jpyH_IdNdWFKYTzdUavPZSQTeEufq91a6pCA-qb7l1E8326KatmwY5V9s/exec";

const GRID_SIZE = 4;
const MAX_LIVES = 10; // Nyawa maksimal diubah menjadi 10
const ITEMS = {
    TREASURE: '📦',
    KEY: '🔑',
    COIN: '💰',
    EMPTY: '❓'
};

// --- STATE GAME ---
let gameMatrix = [];
let currentTarget = { item: '', row: -1, col: -1 };
let attempts = 0;
let lives = MAX_LIVES;
let score = 0;
let playerName = "";

// --- ELEMEN DOM ---
const gridTable = document.getElementById('game-grid');
const taskPrompt = document.getElementById('task-prompt');
const rowInput = document.getElementById('row-input');
const colInput = document.getElementById('col-input');
const checkBtn = document.getElementById('check-btn');
const resetBtn = document.getElementById('reset-btn');
const codeRowSpan = document.getElementById('code-row');
const codeColSpan = document.getElementById('code-col');
const robotSpeak = document.getElementById('robot-speak');
const activityLog = document.getElementById('activity-log');
const livesDisplay = document.getElementById('lives-display');
const scoreDisplay = document.getElementById('score-display');
const leaderboardList = document.getElementById('leaderboard-list');

window.onload = function() {
    askPlayerName();
    fetchLeaderboard();
    initGame();
};

function askPlayerName() {
    playerName = prompt("Masukkan nama Anda untuk Papan Peringkat:", "Player 1");
    if (!playerName || playerName.trim() === "") {
        playerName = "Player_" + Math.floor(Math.random() * 1000);
    }
}

function initGame() {
    attempts = 0;
    lives = MAX_LIVES; // Mengatur ulang ke 10 nyawa
    rowInput.value = '';
    colInput.value = '';
    if (checkBtn) checkBtn.disabled = false;
    
    updateLivesDisplay();
    updateScoreDisplay();
    generateMatrixData();
    drawGridUI();
    setNewTask();
    
    updateRobot(`Selamat datang ${playerName}! Cari target sebelum nyawa habis!`, "normal");
    clearLog();
    addLog(`--- Game Baru Dimulai | Pemain: ${playerName} ---`, "normal");
}

function updateLivesDisplay() {
    // Menampilkan angka nyawa dan simbol hati agar tampilan tetap rapi
    if (livesDisplay) {
        livesDisplay.textContent = `❤️ ${lives}/${MAX_LIVES}`;
    }
}

function updateScoreDisplay() {
    if (scoreDisplay) scoreDisplay.textContent = score;
}

function generateMatrixData() {
    gameMatrix = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(ITEMS.EMPTY));
    placeItemRandomly(ITEMS.TREASURE);
    placeItemRandomly(ITEMS.KEY);
    placeItemRandomly(ITEMS.COIN);
    placeItemRandomly(ITEMS.COIN);
}

function placeItemRandomly(item) {
    let placed = false;
    while (!placed) {
        let r = Math.floor(Math.random() * GRID_SIZE);
        let c = Math.floor(Math.random() * GRID_SIZE);
        if (gameMatrix[r][c] === ITEMS.EMPTY) {
            gameMatrix[r][c] = item;
            placed = true;
        }
    }
}

function drawGridUI() {
    if (!gridTable) return;
    gridTable.innerHTML = '';

    let headerRow = document.createElement('tr');
    headerRow.appendChild(document.createElement('th'));
    for (let j = 0; j < GRID_SIZE; j++) {
        let th = document.createElement('th');
        th.textContent = j;
        th.className = 'col-label';
        headerRow.appendChild(th);
    }
    gridTable.appendChild(headerRow);

    for (let i = 0; i < GRID_SIZE; i++) {
        let tr = document.createElement('tr');
        let thRow = document.createElement('th');
        thRow.textContent = i;
        thRow.className = 'row-label';
        tr.appendChild(thRow);

        for (let j = 0; j < GRID_SIZE; j++) {
            let td = document.createElement('td');
            td.className = 'grid-cell';
            td.id = `cell-${i}-${j}`;
            td.textContent = ITEMS.EMPTY;
            td.addEventListener('click', () => handleGridClick(i, j));
            tr.appendChild(td);
        }
        gridTable.appendChild(tr);
    }
}

function setNewTask() {
    const targets = [ITEMS.TREASURE, ITEMS.KEY, ITEMS.COIN];
    const selectedItem = targets[Math.floor(Math.random() * targets.length)];
    
    let options = [];
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            if (gameMatrix[i][j] === selectedItem) options.push({r: i, c: j});
        }
    }
    
    const chosen = options[Math.floor(Math.random() * options.length)];
    currentTarget = { item: selectedItem, row: chosen.r, col: chosen.c };

    if (taskPrompt) {
        taskPrompt.innerHTML = `TEMUKAN TARGET: <span style="color:#ff9f43; font-size:1.3em;">${selectedItem}</span>`;
    }
}

function handleGridClick(r, c) {
    rowInput.value = r;
    colInput.value = c;
    updateCodeReference(r, c);
}

function updateCodeReference(r, c) {
    if (codeRowSpan) codeRowSpan.textContent = (r !== '' && r !== null) ? r : 'i';
    if (codeColSpan) codeColSpan.textContent = (c !== '' && c !== null) ? c : 'j';
}

function checkCell() {
    if (lives <= 0) return;

    attempts++;
    const r = parseInt(rowInput.value, 10);
    const c = parseInt(colInput.value, 10);

    if (isNaN(r) || isNaN(c) || r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) {
        updateRobot("⚠️ Masukkan angka 0 - 3!", "error");
        return;
    }

    const cellEl = document.getElementById(`cell-${r}-${c}`);
    const foundItem = gameMatrix[r][c];
    if (cellEl) cellEl.textContent = foundItem;

    const distance = Math.abs(currentTarget.row - r) + Math.abs(currentTarget.col - c);

    // --- TEBAKAN BENAR ---
    if (r === currentTarget.row && c === currentTarget.col) {
        score += 10; // Tambah Skor +10
        updateScoreDisplay();
        if (cellEl) cellEl.classList.add('found');
        
        updateRobot(`🎉 BENAR! Kamu dapat +10 Poin. Menyiapkan target baru...`, "success");
        addLog(`Percobaan #${attempts}: matrix[${r}][${c}] BENAR! (+10 Poin)`, "success");
        
        // Simpan Skor ke Google Sheet
        saveScoreToSheets(playerName, score);

        // Ronde baru secara otomatis setelah 2 detik
        setTimeout(() => {
            generateMatrixData();
            drawGridUI();
            setNewTask();
        }, 2000);

    } else {
        // --- TEBAKAN SALAH ---
        lives--; // Kurangi Nyawa
        updateLivesDisplay();

        if (lives <= 0) {
            // GAME OVER
            updateRobot(`☠️ GAME OVER! Nyawa habis. Total Skor: ${score}`, "error");
            addLog(`GAME OVER! Total Skor Akhir: ${score}`, "error");
            if (checkBtn) checkBtn.disabled = true;
            
            // Simpan skor akhir saat Game Over
            saveScoreToSheets(playerName, score);
        } else {
            updateRobot(`Salah! matrix[${r}][${c}] = ${foundItem}. Jarak target = ${distance} langkah. Sisa nyawa: ${lives}`, "normal");
            addLog(`Percobaan #${attempts}: matrix[${r}][${c}] -> ${foundItem} (Jarak: ${distance} langkah)`, "normal");
        }
    }
}

// --- INTEGRASI GOOGLE SHEETS ---

function saveScoreToSheets(name, finalScore) {
    if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.trim() === "") return;

    fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
            "Content-Type": "text/plain"
        },
        body: JSON.stringify({ nama: name, skor: finalScore })
    }).then(() => {
        addLog("Skor berhasil dikirim ke Google Sheets!", "success");
        setTimeout(fetchLeaderboard, 2000);
    }).catch(err => {
        console.error("Gagal simpan skor:", err);
        addLog("Gagal mengirim skor ke server.", "error");
    });
}

function fetchLeaderboard() {
    if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.trim() === "") {
        if (leaderboardList) leaderboardList.innerHTML = "<li>URL Google Script belum diisi.</li>";
        return;
    }

    fetch(GOOGLE_SCRIPT_URL)
        .then(res => res.json())
        .then(data => {
            if (!leaderboardList) return;
            leaderboardList.innerHTML = "";
            
            if (!data || data.length === 0) {
                leaderboardList.innerHTML = "<li>Belum ada data skor.</li>";
                return;
            }

            data.forEach((item) => {
                const li = document.createElement("li");
                li.textContent = `${item.nama} - ${item.skor} Poin`;
                leaderboardList.appendChild(li);
            });
        })
        .catch(err => {
            console.error("Gagal memuat leaderboard:", err);
            if (leaderboardList) leaderboardList.innerHTML = "<li>Gagal memuat leaderboard.</li>";
        });
}

function updateRobot(text, styleType) {
    if (robotSpeak) robotSpeak.textContent = text;
}

function addLog(text, styleType = "normal") {
    if (!activityLog) return;
    const li = document.createElement('li');
    li.textContent = text;
    activityLog.appendChild(li);
}

function clearLog() {
    if (activityLog) activityLog.innerHTML = '';
}

// Event Listeners
if (checkBtn) checkBtn.addEventListener('click', checkCell);
if (resetBtn) resetBtn.addEventListener('click', () => {
    score = 0;
    initGame();
});
