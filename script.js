// --- KONFIGURASI UTAMA ---
const GRID_SIZE = 4;
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

// Jalankan game otomatis saat halaman dibuka
window.onload = function() {
    initGame();
};

function initGame() {
    attempts = 0;
    rowInput.value = '';
    colInput.value = '';
    if (checkBtn) checkBtn.disabled = false;
    
    generateMatrixData();
    drawGridUI();
    setNewTask();
    
    updateRobot("Papan baru siap! Masukkan baris & kolom lalu klik CHECK CELL.", "normal");
    clearLog();
    addLog("--- Game Baru Dimulai (Matrix 4x4) ---", "normal");
}

function generateMatrixData() {
    gameMatrix = Array.from({ length: GRID_SIZE }, () => 
        Array(GRID_SIZE).fill(ITEMS.EMPTY)
    );

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

    // Header Label Kolom (0, 1, 2, 3)
    let headerRow = document.createElement('tr');
    headerRow.appendChild(document.createElement('th'));
    for (let j = 0; j < GRID_SIZE; j++) {
        let th = document.createElement('th');
        th.textContent = j;
        th.className = 'col-label';
        headerRow.appendChild(th);
    }
    gridTable.appendChild(headerRow);

    // Sel Grid & Label Baris
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
            if (gameMatrix[i][j] === selectedItem) {
                options.push({r: i, c: j});
            }
        }
    }
    
    const chosen = options[Math.floor(Math.random() * options.length)];
    currentTarget = { item: selectedItem, row: chosen.r, col: chosen.c };

    if (taskPrompt) {
        taskPrompt.innerHTML = `TEMUKAN TARGET: Cari item <span style="color:#ff9f43; font-size:1.3em;">${selectedItem}</span> pada grid!`;
    }
}

function handleGridClick(r, c) {
    rowInput.value = r;
    colInput.value = c;
    updateCodeReference(r, c);
    highlightCell(r, c);
}

function updateCodeReference(r, c) {
    if (codeRowSpan) codeRowSpan.textContent = (r !== '' && r !== null) ? r : 'i';
    if (codeColSpan) codeColSpan.textContent = (c !== '' && c !== null) ? c : 'j';
}

function highlightCell(r, c) {
    document.querySelectorAll('.grid-cell').forEach(cell => cell.classList.remove('highlight'));
    const targetCell = document.getElementById(`cell-${r}-${c}`);
    if (targetCell) targetCell.classList.add('highlight');
}

// --- FUNGSI UTAMA PENGECEKAN DENGAN PETUNJUK JARAK ---
function checkCell() {
    attempts++;
    // Konversi string input menjadi Integer secara aman
    const r = parseInt(rowInput.value, 10);
    const c = parseInt(colInput.value, 10);

    // 1. Validasi Input
    if (isNaN(r) || isNaN(c) || r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) {
        updateRobot("⚠️ Masukkan angka 0 - 3 pada Baris dan Kolom!", "error");
        addLog(`Percobaan #${attempts}: Input [${rowInput.value}][${colInput.value}] tidak valid!`, "error");
        return;
    }

    highlightCell(r, c);
    const cellEl = document.getElementById(`cell-${r}-${c}`);
    const foundItem = gameMatrix[r][c];
    if (cellEl) cellEl.textContent = foundItem;

    // 2. Hitung Jarak Manhattan: |r1 - r2| + |c1 - c2|
    const distance = Math.abs(currentTarget.row - r) + Math.abs(currentTarget.col - c);

    // 3. Evaluasi Hasil & Tampilkan Petunjuk
    if (r === currentTarget.row && c === currentTarget.col) {
        if (cellEl) cellEl.classList.add('found');
        updateRobot(`🎉 Sempurna! matrix[${r}][${c}] berisi ${foundItem}. Kamu berhasil menemukan target!`, "success");
        addLog(`Percobaan #${attempts}: matrix[${r}][${c}] -> ${foundItem} | STATUS: BENAR!`, "success");
        if (taskPrompt) taskPrompt.innerHTML = `<b style="color:#2ecc71">BERHASIL! Klik Reset untuk main lagi.</b>`;
        if (checkBtn) checkBtn.disabled = true;
    } else {
        // Tampilkan Pesan Robot dan Log dengan jarak langkah
        updateRobot(`Bukan target! matrix[${r}][${c}] berisi ${foundItem}. 💡 Petunjuk: Jarak ke target = ${distance} langkah lagi!`, "normal");
        addLog(`Percobaan #${attempts}: matrix[${r}][${c}] -> ${foundItem} (Jarak target: ${distance} langkah)`, "normal");
    }
}

function updateRobot(text, styleType) {
    if (robotSpeak) {
        robotSpeak.textContent = text;
    }
    const container = document.querySelector('.robot-feedback');
    if (container) {
        if (styleType === "success") container.style.borderColor = "#2ecc71";
        else if (styleType === "error") container.style.borderColor = "#e74c3c";
        else container.style.borderColor = "#00d2ff";
    }
}

function addLog(text, styleType = "normal") {
    if (!activityLog) return;
    const li = document.createElement('li');
    li.textContent = text;
    if (styleType === "error") li.style.color = "#e74c3c";
    else if (styleType === "success") li.style.color = "#2ecc71";
    else li.style.color = "#a4b0be";
    
    activityLog.appendChild(li);
    const logSection = document.querySelector('.log-section');
    if (logSection) logSection.scrollTop = logSection.scrollHeight;
}

function clearLog() {
    if (activityLog) activityLog.innerHTML = '';
}

// Event Listeners
if (checkBtn) checkBtn.addEventListener('click', checkCell);
if (resetBtn) resetBtn.addEventListener('click', initGame);
if (rowInput) rowInput.addEventListener('input', () => updateCodeReference(rowInput.value, colInput.value));
if (colInput) colInput.addEventListener('input', () => updateCodeReference(rowInput.value, colInput.value));
