// --- CONFIGURATION & GLOBAL STATE ---
const DB_NAME = 'InventoryDB';
const DB_VERSION = 1;
const STORE_NAME = 'scans';

let db = null;
let html5QrCode = null;
let isCameraRunning = false;

// Scan States
const STATES = {
  SCAN_WAREHOUSE: 'SCAN_WAREHOUSE',
  SCAN_LOCATION: 'SCAN_LOCATION',
  SCAN_ITEM: 'SCAN_ITEM',
  ENTER_QUANTITY: 'ENTER_QUANTITY'
};

let currentState = STATES.SCAN_WAREHOUSE;
let warehouseCode = null;
let currentLocation = null;
let currentItem = null;

// Modal Freeze Flag
let isConfirming = false;
let confirmModalCallback = null;

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
      osc.frequency.setValueAtTime(950, now);
      gainNode.gain.setValueAtTime(0.08, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'success') {
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.setValueAtTime(1109, now + 0.08); // C#6
      gainNode.gain.setValueAtTime(0.1, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'error') {
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
      // Maximalizált keret: a lehető legnagyobbra növeljük a kameraképen belül
      // (barcode jelleghez igazítva a magasságot kismértékben kisebbre hagyjuk)
      const boxWidth = Math.min(width, height) * 0.97;
      const boxHeight = boxWidth * 0.62;
      return { width: boxWidth, height: boxHeight };
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
    
    fallbackEl.classList.remove('hidden');
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
  // If confirmation modal is open, freeze scanner inputs
  if (isConfirming) return;

  const now = Date.now();

  // Debounce duplicate scans within 2 seconds
  if (decodedText === lastScannedCode && (now - lastScannedTime) < SCAN_DEBOUNCE_MS) {
    return;
  }

  lastScannedCode = decodedText;
  lastScannedTime = now;

  handleCodeInput(decodedText);
}

// --- STATE MACHINE WORKFLOW LOGIC ---
function setTransitionState(state) {
  currentState = state;
  const instructionEl = document.getElementById('scan-instruction');
  const titleEl = document.getElementById('scanner-title');
  const manualInput = document.getElementById('manual-scan-input');
  
  if (manualInput) {
    manualInput.value = '';
  }

  switch (state) {
    case STATES.SCAN_WAREHOUSE:
      titleEl.textContent = 'Raktár kód beolvasása';
      instructionEl.textContent = 'Olvassa be a raktár kódját a kezdéshez...';
      if (manualInput) manualInput.placeholder = 'Raktár kód beírása...';
      break;
    case STATES.SCAN_LOCATION:
      titleEl.textContent = 'Raktárhely beolvasása';
      instructionEl.textContent = 'Olvassa be a raktárhely vonalkódját...';
      if (manualInput) manualInput.placeholder = 'Raktárhely kód beírása...';
      break;
    case STATES.SCAN_ITEM:
      titleEl.textContent = 'Cikkszám beolvasása';
      instructionEl.textContent = 'Olvassa be a termék/cikkszám vonalkódját...';
      if (manualInput) manualInput.placeholder = 'Cikkszám / Termékkód beírása...';
      break;
    case STATES.ENTER_QUANTITY:
      titleEl.textContent = 'Mennyiség megadása';
      instructionEl.textContent = 'Adja meg a mennyiséget a felugró ablakban...';
      break;
  }
}

function handleCodeInput(code) {
  if (!code) return;
  
  triggerFeedback('scan');

  if (currentState === STATES.SCAN_WAREHOUSE) {
    openConfirmModal('Raktár kód megerősítése', 'Raktár kód:', code, () => {
      warehouseCode = code;
      sessionStorage.setItem('warehouseCode', warehouseCode);
      showWarehouseBar(warehouseCode);
      setTransitionState(STATES.SCAN_LOCATION);
    });
  } else if (currentState === STATES.SCAN_LOCATION) {
    openConfirmModal('Raktárhely megerősítése', 'Raktárhely kód:', code, () => {
      currentLocation = code;
      const progressLoc = document.getElementById('progress-location');
      progressLoc.textContent = currentLocation;
      progressLoc.classList.remove('empty');
      setTransitionState(STATES.SCAN_ITEM);
    });
  } else if (currentState === STATES.SCAN_ITEM) {
    openConfirmModal('Cikkszám megerősítése', 'Termékkód / Cikkszám:', code, () => {
      currentItem = code;
      const progressItem = document.getElementById('progress-item');
      progressItem.textContent = currentItem;
      progressItem.classList.remove('empty');
      
      setTransitionState(STATES.ENTER_QUANTITY);
      openQuantityModal();
    });
  }
}

// Confirm Modal Controllers
function openConfirmModal(title, typeLabel, value, onOkCallback) {
  isConfirming = true;
  document.getElementById('confirm-modal-title').textContent = title;
  document.getElementById('confirm-modal-type-label').textContent = typeLabel;
  document.getElementById('confirm-modal-value').textContent = value;
  
  confirmModalCallback = onOkCallback;
  document.getElementById('confirm-modal').classList.remove('hidden');
}

function closeConfirmModal() {
  document.getElementById('confirm-modal').classList.add('hidden');
  isConfirming = false;
  confirmModalCallback = null;
  lastScannedCode = null; // Clear debounce state on close
}

// Quantity Modal Controllers
function openQuantityModal() {
  document.getElementById('qty-modal-location').textContent = currentLocation;
  document.getElementById('qty-modal-item').textContent = currentItem;
  document.getElementById('qty-modal-input').value = '';
  document.getElementById('quantity-modal').classList.remove('hidden');
  document.getElementById('qty-modal-input').focus();
}

function closeQuantityModal(cancelled = false) {
  document.getElementById('quantity-modal').classList.add('hidden');
  
  if (cancelled) {
    // If quantity is cancelled, only discard the item code, keep location
    currentItem = null;
    const progressItem = document.getElementById('progress-item');
    progressItem.textContent = 'Nincs beolvasva';
    progressItem.classList.add('empty');
    setTransitionState(STATES.SCAN_ITEM);
  }
  lastScannedCode = null;
}

// Warehouse Bar Control
function showWarehouseBar(code) {
  document.getElementById('warehouse-value').textContent = code;
  document.getElementById('warehouse-display-bar').classList.remove('hidden');
}

function hideWarehouseBar() {
  document.getElementById('warehouse-display-bar').classList.add('hidden');
}

// Toggle manual typing mode
function toggleManualMode(enabled) {
  const manualContainer = document.getElementById('manual-scan-container');
  const inputEl = document.getElementById('manual-scan-input');

  if (enabled) {
    manualContainer.classList.remove('hidden');
    stopCamera();
    inputEl.focus();
  } else {
    manualContainer.classList.add('hidden');
    if (html5QrCode) {
      startCamera();
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
  } else {
    // If returning to scan view and camera toggle was active, restart camera
    if (!document.getElementById('manual-mode-checkbox').checked && !isCameraRunning) {
      // Only auto-restart if we have instantiated scanner before
      if (html5QrCode) {
        startCamera();
      }
    }
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
            <div style="display:flex; gap:6px; align-items:center; margin-bottom:4px;">
              ${scan.warehouseCode ? `<span class="scan-loc" style="background-color:rgba(16, 185, 129, 0.1); color:var(--primary); border:1px solid rgba(16, 185, 129, 0.15);">${escapeHtml(scan.warehouseCode)}</span>` : ''}
              <span class="scan-loc">${escapeHtml(scan.locationCode)}</span>
            </div>
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
    totalQtyBadge.textContent = `Össz: ${Number(totalQty.toFixed(4))}`;
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
      updateStatusBarCount();
    } catch (err) {
      alert(err);
      triggerFeedback('error');
    }
  }
}

// Edit Modal helpers (For List View)
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

// Update bottom status bar counter
async function updateStatusBarCount() {
  try {
    const scans = await getAllScansFromDB();
    document.getElementById('status-total-count').textContent = scans.length;
  } catch (e) {
    console.error('Failed to query counts:', e);
  }
}

// Reset scan state machine variables
function resetScanCycle() {
  currentLocation = null;
  currentItem = null;
  
  const progressLoc = document.getElementById('progress-location');
  const progressItem = document.getElementById('progress-item');
  
  progressLoc.textContent = 'Nincs beolvasva';
  progressLoc.classList.add('empty');
  progressItem.textContent = 'Nincs beolvasva';
  progressItem.classList.add('empty');
  
  lastScannedCode = null;

  if (warehouseCode) {
    setTransitionState(STATES.SCAN_LOCATION);
  } else {
    setTransitionState(STATES.SCAN_WAREHOUSE);
  }
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
  // Register Service Worker for PWA with auto-update reload
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js')
      .then((reg) => {
        console.log('Service Worker registered successfully.');
        
        // Listen for new service worker installations
        reg.addEventListener('updatefound', () => {
          const installingWorker = reg.installing;
          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // A new worker is available, skip waiting to activate it
                console.log('New version found! Activating...');
                installingWorker.postMessage('skipWaiting');
              }
            }
          });
        });
      })
      .catch((err) => console.error('Service Worker registration error:', err));

    // Reload the page when the active service worker changes to the new one
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        console.log('Controller changed. Reloading page for new version...');
        window.location.reload();
      }
    });
  }

  // 1. Initialize IndexedDB and load counts
  try {
    await openDB();
    updateStatusBarCount();
  } catch (err) {
    alert('Adatbázis hiba: ' + err);
  }

  // Check if warehouse code exists in sessionStorage (keeps state during session)
  const storedWh = sessionStorage.getItem('warehouseCode');
  if (storedWh) {
    warehouseCode = storedWh;
    showWarehouseBar(warehouseCode);
    setTransitionState(STATES.SCAN_LOCATION);
  } else {
    setTransitionState(STATES.SCAN_WAREHOUSE);
  }

  // 2. Navigation Switch
  document.getElementById('nav-scan').addEventListener('click', () => switchView('scan'));
  document.getElementById('nav-list').addEventListener('click', () => switchView('list'));

  // 3. Camera Toggle Button
  document.getElementById('toggle-camera-btn').addEventListener('click', () => {
    if (isCameraRunning) {
      stopCamera();
    } else {
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

  // 5. Manual Input Box Handlers
  const manualInput = document.getElementById('manual-scan-input');
  const manualSubmit = document.getElementById('manual-scan-submit-btn');

  const processManualInput = () => {
    const value = manualInput.value.trim();
    if (value) {
      handleCodeInput(value);
      manualInput.value = '';
    }
  };

  manualSubmit.addEventListener('click', processManualInput);
  manualInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      processManualInput();
    }
  });

  // 6. Confirm Modal Button Listeners
  document.getElementById('confirm-modal-ok-btn').addEventListener('click', () => {
    if (confirmModalCallback) {
      confirmModalCallback();
    }
    closeConfirmModal();
  });

  document.getElementById('confirm-modal-cancel-btn').addEventListener('click', () => {
    closeConfirmModal();
  });

  // 7. Quantity Modal Form Submission
  const quantityForm = document.getElementById('quantity-form');
  quantityForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const quantityStr = document.getElementById('qty-modal-input').value.trim();
    if (!quantityStr) {
      alert('Kérjük, adjon meg egy mennyiséget!');
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

    const scanRecord = {
      warehouseCode,
      locationCode: currentLocation,
      itemCode: currentItem,
      quantity,
      timestamp: Date.now(),
      isSynced: false
    };

    try {
      await addScanToDB(scanRecord);
      triggerFeedback('success');
      closeQuantityModal(false); // successfully closed, not cancelled
      resetScanCycle();          // reset location & item codes to start new loop
      updateStatusBarCount();    // update bottom status bar
    } catch (err) {
      alert(err);
      triggerFeedback('error');
    }
  });

  document.getElementById('qty-modal-cancel-btn').addEventListener('click', () => {
    closeQuantityModal(true); // cancelled
  });

  // 8. General Reset Button on screen ("Újraindítás")
  document.getElementById('reset-scans-btn').addEventListener('click', () => {
    if (confirm('Biztosan szeretné újraindítani a jelenlegi beolvasási folyamatot?')) {
      resetScanCycle();
      triggerFeedback('scan');
    }
  });

  // 9. Warehouse Reset ("Módosítás" button)
  document.getElementById('reset-warehouse-btn').addEventListener('click', () => {
    if (confirm('Biztosan szeretné módosítani a raktárkódot? (A jelenlegi beolvasás törlődik)')) {
      sessionStorage.removeItem('warehouseCode');
      warehouseCode = null;
      hideWarehouseBar();
      resetScanCycle();
      triggerFeedback('scan');
    }
  });

  // 10. Edit Modal form handlers (used in List View)
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
      updateStatusBarCount();
    } catch (err) {
      alert(err);
      triggerFeedback('error');
    }
  });
});
