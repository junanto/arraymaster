// --- KONFIGURASI GAME ---
const GRID_SIZE = 4;
const ITEMS = {
    TREASURE: '📦',
    KEY: '🔑',
    COIN: '💰',
    EMPTY: '❓'
};

// --- STATE GAME (Data Penyimpan Status) ---
let gameMatrix = [];
let currentTarget = { item: '', row: -1, col: -1 };
let attempts = 0;

// --- ELEMEN UI ---
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

// --- FUNGSI UTAMA ---

// 1. Inisialisasi Game saat Halaman Dimuat
function initGame() {
    attempts = 0;
    rowInput.value = '';
    colInput.value = '';
    generateMatrixData();
    drawGridUI();
    setNewTask();
    updateRobot("Ok, data baru sudah siap. Lihat tugas di panel kanan!", "normal");
    clearLog();
    addLog("Game Berhasil di-reset. Matrix 4x4 baru telah dibuat.");
}

// 2. Generate Data Matrix 4x4 secara Acak
function generateMatrixData() {
    gameMatrix = [];
    // Isi semua dengan EMPTY
    for (let i = 0; i < GRID_SIZE; i++) {
        gameMatrix[i] = [];
        for (let j = 0; j < GRID_SIZE; j++) {
            gameMatrix[i][j] = ITEMS.EMPTY;
        }
    }

    // Tempatkan item spesial secara acak
    placeItemRandomly(ITEMS.TREASURE);
    placeItemRandomly(ITEMS.KEY);
    placeItemRandomly(ITEMS.COIN);
    // Tambahkan beberapa koin ekstra
    placeItemRandomly(ITEMS.COIN);
    placeItemRandomly(ITEMS.COIN);
}

// Fungsi pembantu menempatkan satu item di sel kosong
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

// 3. Menggambar ulang Tampilan Grid (HTML Table)
function drawGridUI() {
    gridTable.innerHTML = ''; // Kosongkan grid lama

    // a. Buat Header Kolom (Label 0 1 2 3)
    let headerRow = document.createElement('tr');
    headerRow.appendChild(document.createElement('th')); // Pojok kiri atas kosong
    for (let j = 0; j < GRID_SIZE; j++) {
        let th = document.createElement('th');
        th.textContent = j;
        th.className = 'col-label';
        headerRow.appendChild(th);
    }
    gridTable.appendChild(headerRow);

    // b. Buat Baris dan Sel
    for (let i = 0; i < GRID_SIZE; i++) {
        let tr = document.createElement('tr');

        // Label Baris (0, 1, 2, 3 di paling kiri)
        let thRow = document.createElement('th');
        thRow.textContent = i;
        thRow.className = 'row-label';
        tr.appendChild(thRow);

        // Sel Data
        for (let j = 0; j < GRID_SIZE; j++) {
            let td = document.createElement('td');
            td.className = 'grid-cell';
            td.id = `cell-${i}-${j}`;
            td.textContent = ITEMS.EMPTY; // Sembunyikan item asli
            
            // Tambahkan event click agar bisa memilih sel dengan klik
            td.addEventListener('click', () => handleGridClick(i, j));
            
            tr.appendChild(td);
        }
        gridTable.appendChild(tr);
    }
}

// 4. Menentukan Tugas Baru
function setNewTask() {
    const taskItems = [ITEMS.TREASURE, ITEMS.KEY, ITEMS.COIN];
    const selectedItem = taskItems[Math.floor(Math.random() * taskItems.length)];
    
    // Temukan koordinat item tersebut di matrix
    let coords = [];
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            if (gameMatrix[i][j] === selectedItem) {
                coords.push({r:i, c:j});
            }
        }
    }
    
    // Pilih salah satu lokasi acak jika ada banyak koin
    const targetCoord = coords[Math.floor(Math.random() * coords.length)];

    currentTarget = {
        item: selectedItem,
        row: targetCoord.r,
        col: targetCoord.c
    };

    let itemNameHtml = `<span style="color:var(--accent-orange); font-size:1.2em;">${selectedItem}</span>`;
    taskPrompt.innerHTML = `TEMUKAN TARGET: Masukkan koordinat (baris dan kolom) untuk sel yang berisi ${itemNameHtml}.`;
}

// --- HANDLING INPUT & LOGIC ---

// Mengani klik langsung pada sel grid
function handleGridClick(row, col) {
    rowInput.value = row;
    colInput.value = col;
    updateCodeReference(row, col);
    clearHighlights();
    document.getElementById(`cell-${row}-${col}`).classList.add('highlight');
}

// Memperbarui tampilan referensi kode matrix[i][j]
function updateCodeReference(r, c) {
    codeRowSpan.textContent = r;
    codeColSpan.textContent = c;
}

// Membersihkan highlight orange pada grid
function clearHighlights() {
    const cells = document.querySelectorAll('.grid-cell');
    cells.forEach(cell => cell.classList.remove('highlight'));
}

// Menangani sinkronisasi input manual dengan referensi kode
rowInput.addEventListener('input', () => updateCodeReference(rowInput.value || 'i', colInput.value || 'j'));
colInput.addEventListener('input', () => updateCodeReference(rowInput.value || 'i', colInput.value || 'j'));


// Fungsi Utama Cek Jawaban
// Fungsi Utama Cek Jawaban (Dengan Petunjuk Jarak Manhattan)
function checkCell() {
    attempts++;
    const r = parseInt(rowInput.value);
    const c = parseInt(colInput.value);

    // 1. Validasi Input
    if (isNaN(r) || isNaN(c) || r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) {
        updateRobot("Hei! Masukkan angka antara 0 sampai 3 untuk Baris dan Kolom.", "error");
        addLog(`Percobaan #${attempts}: Input tidak valid (${rowInput.value},${colInput.value}).`, "error");
        return;
    }

    clearHighlights();
    const cellEl = document.getElementById(`cell-${r}-${c}`);
    const foundItem = gameMatrix[r][c];
    cellEl.textContent = foundItem; // Buka item di UI

    // 2. Cek Apakah Jawaban Benar
    if (r === currentTarget.row && c === currentTarget.col) {
        cellEl.classList.add('found');
        updateRobot("Luar biasa! Kamu menemukannya dengan tepat. Matriks[i][j] bukan masalah bagimu!", "success");
        addLog(`Percobaan #${attempts}: grid[${r}][${c}] - Ditemukan: ${foundItem}. STATUS: BENAR!`, "success");
        taskPrompt.innerHTML = `<span style="color:var(--accent-green); font-weight:bold;">TUGAS SELESAI! Klik Reset untuk bermain lagi.</span>`;
        checkBtn.disabled = true;
    } else {
        // 3. Hitung Jarak Manhattan Jika Jawaban Salah
        // Rumus: |baris_target - baris_input| + |kolom_target - kolom_input|
        const distance = Math.abs(currentTarget.row - r) + Math.abs(currentTarget.col - c);

        // Tampilkan petunjuk jarak di area Robot dan Log
        updateRobot(`Bukan target! matrix[${r}][${c}] berisi ${foundItem}. Petunjuk: Jarak ke target = ${distance} langkah lagi!`, "normal");
        addLog(`Percobaan #${attempts}: grid[${r}][${c}] - Ditemukan: ${foundItem} (Jarak ke target: ${distance} langkah).`, "normal");
    }
}

// --- UTILITIES (Fungsi Pembantu) ---

function updateRobot(message, type) {
    robotSpeak.textContent = message;
    const feedbackBox = document.querySelector('.robot-feedback');
    feedbackBox.style.borderColor = (type === "success") ? "var(--accent-green)" : (type === "error") ? "var(--accent-red)" : "var(--accent-blue)";
}

function addLog(message, type = "normal") {
    const li = document.createElement('li');
    li.textContent = message;
    if (type !== "normal") li.className = type;
    activityLog.appendChild(li);
    // Auto-scroll ke bawah
    document.querySelector('.log-section').scrollTop = document.querySelector('.log-section').scrollHeight;
}

function clearLog() {
    activityLog.innerHTML = '';
}

// --- EVENT LISTENERS ---
checkBtn.addEventListener('click', checkCell);
resetBtn.addEventListener('click', () => {
    checkBtn.disabled = false;
    initGame();
});

// Jalankan game pertama kali
initGame();
