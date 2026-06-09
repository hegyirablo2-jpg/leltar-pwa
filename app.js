// --- CONFIGURATION & GLOBAL STATE ---
const DB_NAME = 'InventoryDB';
const DB_VERSION = 1;
const STORE_NAME = 'scans';

let db = null;
let html5QrCode = null;
let isCameraRunning = false;

// Debounce state for scanning
let lastScannedCode = null;
let lastScannedTime = 0;
const SCAN_DEBOUNCE_MS = 2000; // 2 seconds delay for the same code

// --- INDEXEDDB FUNCTIONS ---
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      console.error('IndexedDB open error:', event);
      reject('Nem sikerült megnyitni a helyi adatbázist.');
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const dbInstance = event.target.result;
      if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
        dbInstance.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

function addScanToDB(scanData) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(scanData);

    request.onsuccess = () => resolve();
    request.onerror = (e) => reject('Mentési hiba: ' + e.target.error);
  });
}

function getAllScansFromDB() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = (event) => {
      // Sort descending by timestamp (newest first)
      const sorted = event.target.result.sort((a, b) => b.timestamp - a.timestamp);
      resolve(sorted);
    };
    request.onerror = (e) => reject('Olvasási hiba: ' + e.target.error);
  });
}

function updateScanInDB(id, quantity) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const getRequest = store.get(id);

    getRequest.onsuccess = (event) => {
      const data = event.target.result;
      if (data) {
        data.quantity = quantity;
        const updateRequest = store.put(data);
        updateRequest.onsuccess = () => resolve();
        updateRequest.onerror = (e) => reject('Frissítési hiba: ' + e.target.error);
      } else {
        reject('A rekord nem található.');
      }
    };
    getRequest.onerror = (e) => reject('Keresési hiba: ' + e.target.error);
  });
}

function deleteScanFromDB(id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = (e) => reject('Törlési hiba: ' + e.target.error);
  });
}

// --- FEEDBACK FUNCTIONS (AUDIO & HAPTIC) ---
function triggerFeedback(type = 'success') {
  // 1. Haptic feedback (Vibration API)
  if ('vibrate' in navigator) {
    if (type === 'success') {
      navigator.vibrate(100);
    } else if (type === 'error') {
      navigator.vibrate([150, 100, 150]);
    } else if (type === 'scan') {
      navigator.vibrate(80);
    }
  }

  // 2. Audio feedback (Web Audio API)
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'scan') {
      // High frequency double beep
      osc.frequency.setValueAtTime(950, now);
      gainNode.gain.setValueAtTime(0.08, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'success') {
      // Pleasant higher double-chime
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.setValueAtTime(1109, now + 0.08); // C#6
      gainNode.gain.setValueAtTime(0.1, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'error') {
      // Low buzz sound
      osc.frequency.setValueAtTime(180, now);
      gainNode.gain.setValueAtTime(0.2, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  } catch (e) {
    console.warn('Audio feedback failed or blocked by autoplay policy:', e);
  }
}

// --- SCANNER CONTROLLER ---
function initScanner() {
  if (html5QrCode) return;
  html5QrCode = new Html5Qrcode('reader');
}

function startCamera() {
  initScanner();
  const readerContainer = document.getElementById('reader-container');
  const fallbackEl = document.getElementById('reader-fallback');
  const toggleBtn = document.getElementById('toggle-camera-btn');

  fallbackEl.classList.add('hidden');

  const config = {
    fps: 10,
    qrbox: (width, height) => {
      // Make qrbox proportional and responsive
      const size = Math.min(width, height) * 0.7;
      return { width: size, height: size * 0.6 };
    }
  };

  html5QrCode.start(
    { facingMode: 'environment' },
    config,
    onBarcodeScanned,
    (errorMessage) => {
      // Ignore normal scanning frame failures to avoid spamming console
    }
  )
  .then(() => {
    isCameraRunning = true;
    toggleBtn.textContent = 'Kamera leállítása';
    toggleBtn.classList.remove('btn-secondary');
    toggleBtn.classList.add('btn-danger');
  })
  .catch((err) => {
    console.error('Camera startup failed:', err);
    isCameraRunning = false;
    toggleBtn.textContent = 'Kamera indítása';
    toggleBtn.classList.remove('btn-danger');
    toggleBtn.classList.add('btn-secondary');
    
    // Show fallback if permissions are denied
    fallbackEl.classList.remove('hidden');
    // Enable manual mode automatically if camera failed
    document.getElementById('manual-mode-checkbox').checked = true;
    toggleManualMode(true);
  });
}

function stopCamera() {
  if (!html5QrCode || !isCameraRunning) return Promise.resolve();

  return html5QrCode.stop().then(() => {
    isCameraRunning = false;
    const toggleBtn = document.getElementById('toggle-camera-btn');
    toggleBtn.textContent = 'Kamera indítása';
    toggleBtn.classList.remove('btn-danger');
    toggleBtn.classList.add('btn-secondary');
  }).catch(err => {
    console.error('Error stopping camera:', err);
  });
}

// Handle scanned barcodes
function onBarcodeScanned(decodedText, decodedResult) {
  const now = Date.now();

  // Debounce duplicate scans within 2 seconds
  if (decodedText === lastScannedCode && (now - lastScannedTime) < SCAN_DEBOUNCE_MS) {
    return;
  }

  lastScannedCode = decodedText;
  lastScannedTime = now;

  triggerFeedback('scan');

  const locInput = document.getElementById('location-code');
  const itemInput = document.getElementById('item-code');
  const qtyInput = document.getElementById('quantity');
  const instructionEl = document.getElementById('scan-instruction');

  if (!locInput.value) {
    // 1. Fill location
    locInput.value = decodedText;
    instructionEl.textContent = 'Olvassa be a termék vonalkódját...';
  } else if (!itemInput.value) {
    // 2. Fill item code
    itemInput.value = decodedText;
    instructionEl.textContent = 'Adja meg a mennyiséget és mentse el!';
    // Auto-focus quantity field
    qtyInput.focus();
  } else {
    // Both filled, check if scanning same item or new item.
    // For safety, overwrite product code with the new scan.
    itemInput.value = decodedText;
    qtyInput.focus();
  }
}

// Toggle manual typing mode
function toggleManualMode(enabled) {
  const locInput = document.getElementById('location-code');
  const itemInput = document.getElementById('item-code');
  const instructionEl = document.getElementById('scan-instruction');

  if (enabled) {
    locInput.removeAttribute('readonly');
    itemInput.removeAttribute('readonly');
    instructionEl.textContent = 'Kézi adatbevitel aktív. Írja be a kódokat.';
    stopCamera();
  } else {
    locInput.setAttribute('readonly', 'true');
    itemInput.setAttribute('readonly', 'true');
    
    // Set appropriate text
    if (!locInput.value) {
      instructionEl.textContent = 'Olvassa be a raktárhely vonalkódját...';
    } else {
      instructionEl.textContent = 'Olvassa be a termék vonalkódját...';
    }
  }
}

// --- UI VIEWS AND RENDERING ---
function switchView(viewName) {
  const scanView = document.getElementById('scan-view');
  const listView = document.getElementById('list-view');
  const navScan = document.getElementById('nav-scan');
  const navList = document.getElementById('nav-list');

  // Stop camera if leaving scan view
  if (viewName !== 'scan') {
    stopCamera();
  }

  if (viewName === 'scan') {
    scanView.classList.add('active');
    listView.classList.remove('active');
    navScan.classList.add('active');
    navList.classList.remove('active');
  } else if (viewName === 'list') {
    scanView.classList.remove('active');
    listView.classList.add('active');
    navScan.classList.remove('active');
    navList.classList.add('active');
    renderScansList();
  }
}

// Format Unix Timestamp
function formatDateTime(timestamp) {
  const date = new Date(timestamp);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

// Load database items and render
async function renderScansList() {
  const scansListContainer = document.getElementById('scans-list');
  const totalScansBadge = document.getElementById('total-scans-badge');
  const totalQtyBadge = document.getElementById('total-qty-badge');

  try {
    const scans = await getAllScansFromDB();
    
    if (scans.length === 0) {
      scansListContainer.innerHTML = `
        <div class="empty-list-message">
          <span class="empty-icon">📝</span>
          <p>Még nincs rögzített tétel.</p>
          <p class="empty-sub">Kezd el a szkennelést az "Olvasás" menüpontban!</p>
        </div>
      `;
      totalScansBadge.textContent = '0 db tétel';
      totalQtyBadge.textContent = 'Össz: 0';
      return;
    }

    let totalQty = 0;
    let htmlContent = '';

    scans.forEach((scan) => {
      totalQty += scan.quantity;
      
      htmlContent += `
        <div class="scan-item" data-id="${scan.id}">
          <div class="scan-info">
            <span class="scan-loc">${escapeHtml(scan.locationCode)}</span>
            <span class="scan-code">${escapeHtml(scan.itemCode)}</span>
            <span class="scan-time">${formatDateTime(scan.timestamp)}</span>
          </div>
          <div class="scan-quantity-actions">
            <span class="scan-qty">${scan.quantity}</span>
            <div class="scan-actions">
              <button class="btn-action btn-edit-item" onclick="openEditModal(${scan.id}, '${escapeJs(scan.locationCode)}', '${escapeJs(scan.itemCode)}', ${scan.quantity})" title="Mennyiség szerkesztése">✏️</button>
              <button class="btn-action btn-delete-item" onclick="handleDeleteScan(${scan.id})" title="Törlés">🗑️</button>
            </div>
          </div>
        </div>
      `;
    });

    scansListContainer.innerHTML = htmlContent;
    totalScansBadge.textContent = `${scans.length} db tétel`;
    totalQtyBadge.textContent = `Össz: ${Number(totalQty.toFixed(4))}`; // Format float accurately
  } catch (error) {
    console.error(error);
    scansListContainer.innerHTML = `<div class="error-text">Hiba történt a tételek betöltésekor.</div>`;
  }
}

// Delete item
async function handleDeleteScan(id) {
  if (confirm('Biztosan törölni szeretné ezt a tételt?')) {
    try {
      await deleteScanFromDB(id);
      triggerFeedback('success');
      renderScansList();
    } catch (err) {
      alert(err);
      triggerFeedback('error');
    }
  }
}

// Edit Modal helpers
function openEditModal(id, location, item, quantity) {
  document.getElementById('modal-scan-id').value = id;
  document.getElementById('modal-info-location').textContent = location;
  document.getElementById('modal-info-item').textContent = item;
  document.getElementById('modal-quantity').value = quantity;
  document.getElementById('edit-modal').classList.remove('hidden');
  document.getElementById('modal-quantity').focus();
}

function closeEditModal() {
  document.getElementById('edit-modal').classList.add('hidden');
}

// Helper to escape HTML tags
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Helper to escape JS strings
function escapeJs(str) {
  if (!str) return '';
  return str.replace(/'/g, "\\'").replace(/"/g, '\\"');
}

// --- EVENT LISTENERS & INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
  // Register Service Worker for PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js')
      .then(() => console.log('Service Worker registered successfully.'))
      .catch((err) => console.error('Service Worker registration error:', err));
  }

  // 1. Initialize IndexedDB
  try {
    await openDB();
  } catch (err) {
    alert('Adatbázis hiba: ' + err);
  }

  // 2. Navigation Switch
  document.getElementById('nav-scan').addEventListener('click', () => switchView('scan'));
  document.getElementById('nav-list').addEventListener('click', () => switchView('list'));

  // 3. Camera Toggle Button
  document.getElementById('toggle-camera-btn').addEventListener('click', () => {
    if (isCameraRunning) {
      stopCamera();
    } else {
      // Ensure manual checkbox is unchecked when user starts camera
      document.getElementById('manual-mode-checkbox').checked = false;
      toggleManualMode(false);
      startCamera();
    }
  });

  // 4. Manual Mode Checkbox
  const manualCheckbox = document.getElementById('manual-mode-checkbox');
  manualCheckbox.addEventListener('change', (e) => {
    toggleManualMode(e.target.checked);
  });

  // 5. Individual field clears
  document.getElementById('clear-location-btn').addEventListener('click', () => {
    document.getElementById('location-code').value = '';
    const instructionEl = document.getElementById('scan-instruction');
    if (!document.getElementById('manual-mode-checkbox').checked) {
      instructionEl.textContent = 'Olvassa be a raktárhely vonalkódját...';
    }
  });

  document.getElementById('clear-item-btn').addEventListener('click', () => {
    document.getElementById('item-code').value = '';
    const instructionEl = document.getElementById('scan-instruction');
    const locValue = document.getElementById('location-code').value;
    if (!document.getElementById('manual-mode-checkbox').checked) {
      if (locValue) {
        instructionEl.textContent = 'Olvassa be a termék vonalkódját...';
      } else {
        instructionEl.textContent = 'Olvassa be a raktárhely vonalkódját...';
      }
    }
  });

  // 6. Form Submission (Save)
  const scanForm = document.getElementById('scan-form');
  scanForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const locationCode = document.getElementById('location-code').value.trim();
    const itemCode = document.getElementById('item-code').value.trim();
    const quantityStr = document.getElementById('quantity').value.trim();

    if (!locationCode || !itemCode || !quantityStr) {
      alert('Minden mező kitöltése kötelező!');
      triggerFeedback('error');
      return;
    }

    // Support Hungarian format (comma as decimal separator)
    const normalizedQty = quantityStr.replace(',', '.');
    const quantity = parseFloat(normalizedQty);

    if (isNaN(quantity) || quantity <= 0) {
      alert('Kérjük, adjon meg egy 0-nál nagyobb érvényes mennyiséget!');
      triggerFeedback('error');
      return;
    }

    const scanRecord = {
      locationCode,
      itemCode,
      quantity,
      timestamp: Date.now(),
      isSynced: false
    };

    try {
      await addScanToDB(scanRecord);
      triggerFeedback('success');

      // Clear input fields according to specifications:
      // Keep locationCode so the user can continue in the same storage spot.
      document.getElementById('item-code').value = '';
      document.getElementById('quantity').value = '';

      // Update scan instruction
      if (!manualCheckbox.checked) {
        document.getElementById('scan-instruction').textContent = 'Olvassa be a termék vonalkódját...';
      }
      
      // Clear last scanned code state to allow immediate re-scanning of the same product
      lastScannedCode = null;
      
    } catch (err) {
      alert(err);
      triggerFeedback('error');
    }
  });

  // 7. Reset Form button ("Új olvasás / Törlés")
  document.getElementById('reset-scans-btn').addEventListener('click', () => {
    document.getElementById('location-code').value = '';
    document.getElementById('item-code').value = '';
    document.getElementById('quantity').value = '';
    
    // Clear last scanned code state
    lastScannedCode = null;

    const instructionEl = document.getElementById('scan-instruction');
    if (!manualCheckbox.checked) {
      instructionEl.textContent = 'Olvassa be a raktárhely vonalkódját...';
    } else {
      instructionEl.textContent = 'Kézi adatbevitel aktív. Írja be a kódokat.';
    }
    triggerFeedback('scan');
  });

  // 8. Modal forms and buttons
  document.getElementById('modal-close-btn').addEventListener('click', closeEditModal);
  document.getElementById('modal-cancel-btn').addEventListener('click', closeEditModal);
  
  const modalForm = document.getElementById('modal-form');
  modalForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = parseInt(document.getElementById('modal-scan-id').value);
    const quantityStr = document.getElementById('modal-quantity').value.trim();

    if (isNaN(id) || !quantityStr) {
      triggerFeedback('error');
      return;
    }

    const normalizedQty = quantityStr.replace(',', '.');
    const quantity = parseFloat(normalizedQty);

    if (isNaN(quantity) || quantity <= 0) {
      alert('Kérjük, adjon meg egy 0-nál nagyobb érvényes mennyiséget!');
      triggerFeedback('error');
      return;
    }

    try {
      await updateScanInDB(id, quantity);
      triggerFeedback('success');
      closeEditModal();
      renderScansList();
    } catch (err) {
      alert(err);
      triggerFeedback('error');
    }
  });
});
