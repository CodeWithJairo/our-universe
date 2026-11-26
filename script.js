/* =====================================================================
   OUR LITTLE UNIVERSE — interactions
   Vanilla JS · LocalStorage · 3D page turning
   ===================================================================== */
(function () {
  'use strict';

  const STORAGE_KEY = 'ourLittleUniverse.v1';
  const DB_NAME = 'ourLittleUniverse';
  const DB_VERSION = 1;
  const PHOTO_STORE = 'photos';

  // Photos shipped with the site. Used only when that slot has no saved photo.
  const DEFAULT_PHOTOS = {
    'p1.main': 'assets/images/p1.main.jpeg',
    'p2.main': 'assets/images/p2.main.jpg',
    'p3.a': 'assets/images/p3.a.jpeg',
    'p3.b': 'assets/images/p3.b.jpg',
    'p3.c': 'assets/images/p3.c.jpeg',
    'p3b.a': 'assets/images/p3b.a.jpeg',
    'p3b.b': 'assets/images/p3b.b.jpg',
    'p3b.c': 'assets/images/p3b.c.jpg',
    'p4.a': 'assets/images/p4.a.jpg',
    'p4.b': 'assets/images/p4.b.jpeg',
    'p4.c': 'assets/images/p4.c.jpeg',
    'p4b.a': 'assets/images/p4b.a.jpeg',
    'p4b.b': 'assets/images/p4b.b.jpeg',
    'p4b.c': 'assets/images/p4b.c.jpeg',
    'p4b.d': 'assets/images/p4b.d.jpeg',
    'p5event.main': 'assets/images/p5event.main.jpeg',
    'p5.main': 'assets/images/p5.main.jpg',
    'p6a.a': 'assets/images/p6a.a.jpeg',
    'p6a.b': 'assets/images/p6a.b.jpg',
    'p6a.c': 'assets/images/p6a.c.jpg',
    'p6.a': 'assets/images/p6.a.jpg',
    'p6.b': 'assets/images/p6.b.jpg',
    'p6.c': 'assets/images/p6.c.jpg',
    'p7happy.a': 'assets/images/p7happy.a.jpg',
    'p7happy.b': 'assets/images/p7happy.b.jpeg',
    'p7happy.c': 'assets/images/p7happy.c.jpeg',
    'p10.main': 'assets/images/p10.main.jpg',
    'p9.a': 'assets/images/p9.a.jpeg',
    'p9.b': 'assets/images/p9.b.jpeg',
    'p9.c': 'assets/images/p9.c.jpg'
  };
  const UNLOCK_KEY = 'ourLittleUniverse.unlocked';
  const OPTIMIZED_KEY = 'ourLittleUniverse.photosOptimized';
  const MUSIC_AUTO_KEY = 'ourLittleUniverse.musicAuto';
  const BUNDLED_RELOAD_KEY = 'ourLittleUniverse.bundledReload';
  const BUNDLED_RELOAD_VERSION = 4;
  const CONTAIN_SLOTS = ['p4b.d'];
  const PASSWORD = 'ilovejelay';
  const TOTAL_PAGES = document.querySelectorAll('.page').length;

  /* --------------------------- element refs --------------------------- */
  const cover = document.getElementById('cover');
  const openBtn = document.getElementById('openBtn');
  const stage = document.getElementById('stage');
  const book = document.getElementById('book');
  const bookRight = document.getElementById('bookRight');
  const pages = Array.from(document.querySelectorAll('.page'));
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const pageNow = document.getElementById('pageNow');
  const pageTotal = document.getElementById('pageTotal');
  const leftNote = document.getElementById('leftNote');
  const backCoverBtn = document.getElementById('backCoverBtn');
  const editBtn = document.getElementById('editBtn');
  const editIcon = document.getElementById('editIcon');
  const resetBtn = document.getElementById('resetBtn');
  const filePicker = document.getElementById('filePicker');
  const toastEl = document.getElementById('toast');
  const saveStatus = document.getElementById('saveStatus');
  const storageWarning = document.getElementById('storageWarning');
  const particles = document.getElementById('particles');
  const audio = document.getElementById('backgroundMusic');
  const musicBtn = document.getElementById('musicBtn');
  const musicIcon = document.getElementById('musicIcon');
  const muteBtn = document.getElementById('muteBtn');
  const muteIcon = document.getElementById('muteIcon');
  const lockScreen = document.getElementById('lockScreen');
  const lockForm = document.getElementById('lockForm');
  const lockInput = document.getElementById('lockInput');
  const lockError = document.getElementById('lockError');
  const toolMenuBtn = document.getElementById('toolMenuBtn');
  const toolMenu = document.getElementById('toolMenu');
  const photoEditor = document.getElementById('photoEditor');
  const photoEditorStage = document.getElementById('photoEditorStage');
  const photoEditorImage = document.getElementById('photoEditorImage');
  const zoomRange = document.getElementById('zoomRange');

  /* ------------------------------ state ------------------------------ */
  const state = { text: {}, photos: {} };
  const textEls = Array.from(document.querySelectorAll('[data-text]'));
  const photoSlots = {};
  const textMap = new Map(textEls.map(el => [el.dataset.text, el]));

  let currentPage = 0;
  let isAnimating = false;
  let editMode = false;
  let saveTimer = null;
  let toastTimer = null;
  let storageWarned = false;
  let pendingPhotoId = null;
  let pendingSlotRatio = 1;
  let pendingSlotSize = { w: 300, h: 300 };
  let editorTargetId = null;
  let editorSource = null;
  let editorTransform = { x: 0, y: 0, z: 1 };
  let editorDragStart = null;
  let editorPinchStart = null;
  const editorPointers = new Map();
  let coverOpen = false;
  let musicAvailable = true;
  let musicAutoWanted = true;
  let resetting = false;

  /* ================================================================== *
   *  SMALL UTILITIES
   * ================================================================== */
  function toast(message) {
    toastEl.textContent = message;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2900);
  }

  function pulseSaved() {
    saveStatus.classList.add('pulse');
    setTimeout(() => saveStatus.classList.remove('pulse'), 450);
  }

  function reducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /* ================================================================== *
   *  LOCAL STORAGE
   * ================================================================== */
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return; // Nothing saved yet — keep the beautiful defaults.
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return;
      if (parsed.text && typeof parsed.text === 'object') state.text = parsed.text;
      if (parsed.photos && typeof parsed.photos === 'object') state.photos = parsed.photos;
    } catch (err) {
      console.warn('Could not read saved album:', err);
      toast('I could not read the saved album, but you can keep editing ♥');
    }
  }

  function applySavedState() {
    // Only overwrite defaults where a saved value actually exists.
    Object.keys(state.text).forEach(id => {
      const el = textMap.get(id);
      if (el && typeof state.text[id] === 'string') el.innerHTML = state.text[id];
    });
    Object.keys(state.photos).forEach(id => {
      if (photoSlots[id]) renderPhoto(id);
    });
  }

  function saveNow() {
    clearTimeout(saveTimer);
    saveTimer = null;
    try {
      // Photos live in IndexedDB now; LocalStorage only holds the small text edits.
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ text: state.text }));
      storageWarning.hidden = true;
      storageWarned = false;
      pulseSaved();
    } catch (err) {
      console.warn('Storage save failed:', err);
      // The old value in localStorage is deliberately left untouched.
      storageWarning.hidden = false;
      if (!storageWarned) {
        toast('Storage is full — your changes are on screen but were not saved ♥');
        storageWarned = true;
      }
    }
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 450);
  }

  /* ================================================================== *
   *  INDEXEDDB — large-capacity home for the photos
   * ================================================================== */
  let dbPromise = null;

  function openPhotoDatabase() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error('IndexedDB is not available in this browser.'));
        return;
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(PHOTO_STORE)) db.createObjectStore(PHOTO_STORE);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Could not open the photo database.'));
    });
    return dbPromise;
  }

  async function idbGetAllPhotos() {
    const db = await openPhotoDatabase();
    return new Promise((resolve, reject) => {
      const result = {};
      const tx = db.transaction(PHOTO_STORE, 'readonly');
      const store = tx.objectStore(PHOTO_STORE);
      const keys = store.getAllKeys();
      const values = store.getAll();
      tx.oncomplete = () => {
        const keysArray = keys.result || [];
        const valuesArray = values.result || [];
        keysArray.forEach((key, index) => { result[key] = valuesArray[index]; });
        resolve(result);
      };
      tx.onerror = () => reject(tx.error || new Error('Could not read saved photos.'));
    });
  }

  async function idbSetPhoto(id, dataUrl) {
    const db = await openPhotoDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PHOTO_STORE, 'readwrite');
      tx.objectStore(PHOTO_STORE).put(dataUrl, id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Could not save this photo.'));
    });
  }

  async function idbDeletePhoto(id) {
    const db = await openPhotoDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PHOTO_STORE, 'readwrite');
      tx.objectStore(PHOTO_STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Could not delete this photo.'));
    });
  }

  async function idbClearPhotos() {
    const db = await openPhotoDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PHOTO_STORE, 'readwrite');
      tx.objectStore(PHOTO_STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Could not clear photos.'));
    });
  }

  function warnPhotoSave(err) {
    console.warn('Photo database save failed:', err);
    storageWarning.hidden = false;
    if (!storageWarned) {
      toast('This photo could not be saved in the browser ♥');
      storageWarned = true;
    }
  }

  async function initSavedPhotos() {
    // state.photos may hold legacy LocalStorage photos from an older version.
    const legacy = Object.assign({}, state.photos);
    try {
      if (Object.keys(legacy).length) {
        for (const id of Object.keys(legacy)) {
          try { await idbSetPhoto(id, legacy[id]); } catch (err) { console.warn('Could not migrate one photo:', err); }
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ text: state.text }));
      }
      const stored = await idbGetAllPhotos();
      state.photos = stored;
      Object.keys(stored).forEach(id => { if (photoSlots[id]) renderPhoto(id); });
      await loadBundledPhotos();
      await refreshReplacedBundledPhoto();
      await optimizeSavedPhotos();
    } catch (err) {
      warnPhotoSave(err);
      // Keep the in-memory legacy photos so the current session still shows them.
      state.photos = legacy;
      Object.keys(legacy).forEach(id => { if (photoSlots[id]) renderPhoto(id); });
    }
  }

  /* ================================================================== *
   *  PAGE FURNITURE (backs, page numbers, photo slots)
   * ================================================================== */
  function buildPageFurniture() {
    pages.forEach((page, index) => {
      // A real sheet has a back side. Some spreads ship with their own
      // handcrafted back (the "My Favorite Person" left page), so keep it.
      if (!page.querySelector(':scope > .page-back')) {
        const back = document.createElement('div');
        back.className = 'page-face page-back';
        back.innerHTML =
          '<div class="back-ornament"><svg><use href="#i-rose"></use></svg></div>' +
          '<p class="back-script">a memory, kept safe</p>' +
          '<span class="back-heart">♥ &nbsp;♥ &nbsp;♥</span>';
        page.appendChild(back);
      }

      // Page numbers are added here so every layout stays uncluttered.
      const front = page.querySelector('.page-front');
      const foot = document.createElement('div');
      foot.className = 'page-foot';
      foot.innerHTML = '<span class="foot-heart">♥</span><span>' +
        String(index + 1).padStart(2, '0') + ' / ' + TOTAL_PAGES + '</span>';
      front.appendChild(foot);

      page.style.zIndex = String(pages.length - index);
    });
    pageTotal.textContent = String(TOTAL_PAGES);
  }

  function buildPhotoSlots() {
    document.querySelectorAll('.photo-slot').forEach(slot => {
      const id = slot.dataset.photo;
      if (!id) return;
      photoSlots[id] = slot;

      slot.innerHTML =
        '<span class="ph-empty">' +
          '<svg><use href="#i-camera"></use></svg>' +
          '<span>Add Your Photo</span>' +
        '</span>' +
        '<img alt="" hidden />' +
        '<span class="ph-actions">' +
          '<span class="ph-adjust" role="button" tabindex="0" aria-label="Move or zoom photo">Adjust</span>' +
          '<span class="ph-replace" role="button" tabindex="0" aria-label="Replace photo">Replace</span>' +
          '<span class="ph-delete" role="button" tabindex="0" aria-label="Delete photo">×</span>' +
        '</span>';

      // The whole frame is clickable — it opens the device's file picker.
      slot.addEventListener('click', () => openPicker(id));

      const adjust = slot.querySelector('.ph-adjust');
      const replace = slot.querySelector('.ph-replace');
      const remove = slot.querySelector('.ph-delete');

      const runControl = control => {
        if (control === adjust) adjustCurrentPhoto(id);
        else if (control === replace) openPicker(id);
        else deletePhoto(id);
      };

      [adjust, replace, remove].forEach(control => {
        control.addEventListener('click', event => {
          event.stopPropagation();
          runControl(control);
        });
        control.addEventListener('keydown', event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            event.stopPropagation();
            runControl(control);
          }
        });
      });
    });
  }

  function renderPhoto(id) {
    const slot = photoSlots[id];
    if (!slot) return;
    const img = slot.querySelector('img');
    const src = state.photos[id];
    if (src && typeof src === 'string') {
      if (img.getAttribute('src') !== src) img.src = src;
      img.hidden = false;
      slot.classList.add('has-photo');
    } else {
      img.hidden = true;
      img.removeAttribute('src');
      slot.classList.remove('has-photo');
    }
  }

  async function deletePhoto(id) {
    if (!Object.prototype.hasOwnProperty.call(state.photos, id)) {
      toast('There is no photo here yet ♥');
      return;
    }
    delete state.photos[id];
    renderPhoto(id);
    try {
      await idbDeletePhoto(id);
    } catch (err) {
      warnPhotoSave(err);
    }
    toast('Photo removed ♥');
  }

  function getSlotSize(id) {
    const slot = photoSlots[id];
    if (!slot) return { w: 300, h: 300, ratio: 1 };
    const rect = slot.getBoundingClientRect();
    const w = rect.width > 0 ? rect.width : 300;
    const h = rect.height > 0 ? rect.height : 300;
    return { w, h, ratio: w / h };
  }

  function getSlotRatio(id) {
    return getSlotSize(id).ratio;
  }

  function openPicker(id) {
    pendingPhotoId = id;
    pendingSlotSize = getSlotSize(id);
    pendingSlotRatio = pendingSlotSize.ratio;
    filePicker.value = '';
    filePicker.click();
  }

  /* ================================================================== *
   *  IMAGE UPLOAD + COMPRESSION
   * ================================================================== */
  function readAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Could not read the image file.'));
      reader.readAsDataURL(file);
    });
  }

  function loadImage(dataUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('That image could not be opened.'));
      img.src = dataUrl;
    });
  }

  function getSource(file, dataUrl) {
    if ('createImageBitmap' in window) {
      return createImageBitmap(file, { imageOrientation: 'from-image' })
        .catch(() => loadImage(dataUrl));
    }
    return loadImage(dataUrl);
  }

  function sourceSize(source) {
    return {
      w: source.width || source.naturalWidth || 1,
      h: source.height || source.naturalHeight || 1
    };
  }

  function encode(source, maxSize, quality) {
    const size = sourceSize(source);
    const scale = Math.min(1, maxSize / Math.max(size.w, size.h));
    const width = Math.max(1, Math.round(size.w * scale));
    const height = Math.max(1, Math.round(size.h * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff'; // JPEG has no transparency: give PNGs a clean base.
    ctx.fillRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', quality);
  }

  async function compressImage(file) {
    const dataUrl = await readAsDataURL(file);
    const source = await getSource(file, dataUrl);
    let output = encode(source, 1400, 0.84);
    if (output.length > 850 * 1024) output = encode(source, 1000, 0.76);
    if (output.length > 620 * 1024) output = encode(source, 800, 0.7);
    if (source.close) source.close();
    return output;
  }

  /* ================================================================== *
   *  AUTO-FIT + OPTIONAL MOVE / ZOOM PHOTO EDITOR
   * ================================================================== */
  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function photoTargetMax(size) {
    const longest = Math.max(size.w || 300, size.h || 300);
    return Math.round(clamp(longest * 2.2, 360, 900));
  }

  function bakePhoto(img, transform, viewW, viewH, options) {
    const settings = options || {};
    const maxDimension = settings.maxDimension || 900;
    const quality = settings.quality || 0.76;
    const scale = Math.min(8, maxDimension / Math.max(viewW, viewH));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(viewW * scale));
    canvas.height = Math.max(1, Math.round(viewH * scale));
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const sw = img.naturalWidth || img.width || 1;
    const sh = img.naturalHeight || img.height || 1;
    const fitScale = settings.contain
      ? Math.min(viewW / sw, viewH / sh)
      : Math.max(viewW / sw, viewH / sh);
    const dw = sw * fitScale * transform.z;
    const dh = sh * fitScale * transform.z;
    const dx = (viewW / 2 + transform.x - dw / 2) * scale;
    const dy = (viewH / 2 + transform.y - dh / 2) * scale;
    ctx.drawImage(img, dx, dy, dw * scale, dh * scale);
    return canvas.toDataURL('image/jpeg', quality);
  }

  function photoOptions(id, size) {
    return {
      maxDimension: photoTargetMax(size),
      quality: 0.76,
      contain: CONTAIN_SLOTS.indexOf(id) !== -1
    };
  }

  function autoFitPhoto(dataUrl, size, id) {
    return loadImage(dataUrl).then(img => {
      const viewW = 600;
      const viewH = Math.max(1, Math.round(viewW / (size.ratio > 0 ? size.ratio : 1)));
      return bakePhoto(img, { x: 0, y: 0, z: 1 }, viewW, viewH, photoOptions(id, size));
    });
  }

  async function optimizeSavedPhotos() {
    let done = false;
    try { done = localStorage.getItem(OPTIMIZED_KEY) === '1'; } catch (err) { /* private mode */ }
    if (done) return;

    const ids = Object.keys(state.photos);
    if (!ids.length) {
      try { localStorage.setItem(OPTIMIZED_KEY, '1'); } catch (err) { /* ignore */ }
      return;
    }

    toast('Making your saved photos lighter ♥');
    try {
      for (const id of ids) {
        const src = state.photos[id];
        if (typeof src !== 'string') continue;
        try {
          const img = await loadImage(src);
          const size = getSlotSize(id);
          const viewW = 600;
          const viewH = Math.max(1, Math.round(viewW / (size.ratio > 0 ? size.ratio : 1)));
          state.photos[id] = bakePhoto(img, { x: 0, y: 0, z: 1 }, viewW, viewH, photoOptions(id, size));
        } catch (err) {
          console.warn('Could not shrink one saved photo:', err);
        }
      }
      Object.keys(state.photos).forEach(renderPhoto);
      for (const id of ids) {
        if (typeof state.photos[id] === 'string') {
          try { await idbSetPhoto(id, state.photos[id]); } catch (err) { console.warn('Could not store shrunken photo:', err); }
        }
      }
      toast('Your photos are now lighter ♥');
    } finally {
      try { localStorage.setItem(OPTIMIZED_KEY, '1'); } catch (err) { /* ignore */ }
    }
  }

  async function findBundledPhotoUrl(id, version) {
    const base = DEFAULT_PHOTOS[id];
    if (!base) return null;
    const dot = base.lastIndexOf('.');
    const stem = dot === -1 ? base : base.slice(0, dot);
    const candidates = [base];
    ['jpg', 'jpeg', 'png', 'webp'].forEach(ext => {
      const alt = stem + '.' + ext;
      if (candidates.indexOf(alt) === -1) candidates.push(alt);
    });
    for (const url of candidates) {
      const check = version ? url + '?v=' + version : url;
      try {
        const res = await fetch(check, { method: 'HEAD' });
        if (res.ok) return check;
      } catch (err) { /* try next extension */ }
    }
    return null;
  }

  async function loadBundledPhotos() {
    for (const id of Object.keys(DEFAULT_PHOTOS)) {
      if (state.photos[id]) continue;
      try {
        const url = await findBundledPhotoUrl(id);
        if (!url) continue;
        const img = await loadImage(url);
        const size = getSlotSize(id);
        const viewW = 600;
        const viewH = Math.max(1, Math.round(viewW / (size.ratio > 0 ? size.ratio : 1)));
        const fitted = bakePhoto(img, { x: 0, y: 0, z: 1 }, viewW, viewH, photoOptions(id, size));
        state.photos[id] = fitted;
        await idbSetPhoto(id, fitted);
        renderPhoto(id);
      } catch (err) {
        console.warn('Could not load bundled photo ' + id + ':', err);
      }
    }
  }

  async function refreshReplacedBundledPhoto() {
    const id = 'p4b.d';
    if (!DEFAULT_PHOTOS[id]) return;
    let version = 0;
    try { version = Number(localStorage.getItem(BUNDLED_RELOAD_KEY)) || 0; } catch (err) { /* private mode */ }
    if (version >= BUNDLED_RELOAD_VERSION) return;
    try {
      const url = await findBundledPhotoUrl(id, BUNDLED_RELOAD_VERSION);
      if (!url) return;
      const img = await loadImage(url);
      const size = getSlotSize(id);
      const viewW = 600;
      const viewH = Math.max(1, Math.round(viewW / (size.ratio > 0 ? size.ratio : 1)));
      const fitted = bakePhoto(img, { x: 0, y: 0, z: 1 }, viewW, viewH, photoOptions(id, size));
      state.photos[id] = fitted;
      await idbSetPhoto(id, fitted);
      renderPhoto(id);
    } catch (err) {
      console.warn('Could not refresh bundled photo:', err);
    } finally {
      try { localStorage.setItem(BUNDLED_RELOAD_KEY, String(BUNDLED_RELOAD_VERSION)); } catch (err) { /* ignore */ }
    }
  }

  function applyEditorTransform() {
    if (photoEditor.hidden) return;
    const w = Math.max(1, photoEditorStage.clientWidth);
    const h = Math.max(1, photoEditorStage.clientHeight);
    const maxX = Math.max(0, (editorTransform.z - 1) * w / 2);
    const maxY = Math.max(0, (editorTransform.z - 1) * h / 2);
    editorTransform.x = clamp(editorTransform.x, -maxX, maxX);
    editorTransform.y = clamp(editorTransform.y, -maxY, maxY);
    photoEditorImage.style.transform =
      'translate(-50%, -50%) translate(' + editorTransform.x + 'px, ' + editorTransform.y + 'px) scale(' + editorTransform.z + ')';
    zoomRange.value = String(editorTransform.z);
  }

  function setEditorZoom(value) {
    editorTransform.z = clamp(Number(value) || 1, 1, 3);
    applyEditorTransform();
  }

  function openPhotoEditor(id, img, ratio) {
    editorTargetId = id;
    editorSource = img;
    editorTransform = { x: 0, y: 0, z: 1 };
    editorDragStart = null;
    editorPinchStart = null;
    editorPointers.clear();
    photoEditorStage.style.aspectRatio = String(ratio > 0 ? ratio : 1);
    photoEditorImage.src = img.src;
    photoEditor.hidden = false;
    zoomRange.value = '1';
    requestAnimationFrame(applyEditorTransform);
    setTimeout(() => document.getElementById('editorSaveBtn').focus(), 60);
  }

  function closePhotoEditor() {
    photoEditor.hidden = true;
    photoEditorStage.classList.remove('dragging');
    editorPointers.clear();
    editorDragStart = null;
    editorPinchStart = null;
    editorSource = null;
    editorTargetId = null;
  }

  function adjustCurrentPhoto(id) {
    const src = state.photos[id];
    if (!src) {
      toast('Add a photo here first ♥');
      return;
    }
    pendingSlotSize = getSlotSize(id);
    pendingSlotRatio = pendingSlotSize.ratio;
    loadImage(src)
      .then(img => openPhotoEditor(id, img, pendingSlotRatio))
      .catch(() => toast('That photo could not be opened ♥'));
  }

  async function saveEditorPhoto() {
    if (!editorSource || !editorTargetId) return;
    applyEditorTransform();
    const w = Math.max(1, photoEditorStage.clientWidth || 600);
    const h = Math.max(1, photoEditorStage.clientHeight || Math.round(w / pendingSlotRatio));
    let fitted;
    try {
      fitted = bakePhoto(editorSource, editorTransform, w, h, photoOptions(editorTargetId, pendingSlotSize));
    } catch (err) {
      console.warn('Could not save adjusted photo:', err);
      toast('That photo could not be saved — please try again ♥');
      return;
    }
    state.photos[editorTargetId] = fitted;
    renderPhoto(editorTargetId);
    try {
      await idbSetPhoto(editorTargetId, fitted);
    } catch (err) {
      warnPhotoSave(err);
    }
    closePhotoEditor();
    toast('Photo saved in your scrapbook ♥');
  }

  function initPhotoEditor() {
    if (!photoEditor || !photoEditorStage) return;

    document.getElementById('zoomInBtn').addEventListener('click', () => setEditorZoom(editorTransform.z + 0.15));
    document.getElementById('zoomOutBtn').addEventListener('click', () => setEditorZoom(editorTransform.z - 0.15));
    document.getElementById('resetTransformBtn').addEventListener('click', () => {
      editorTransform = { x: 0, y: 0, z: 1 };
      applyEditorTransform();
    });
    document.getElementById('editorCancelBtn').addEventListener('click', closePhotoEditor);
    document.getElementById('editorSaveBtn').addEventListener('click', saveEditorPhoto);

    photoEditor.addEventListener('click', event => {
      if (event.target === photoEditor) closePhotoEditor();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !photoEditor.hidden) closePhotoEditor();
    });

    zoomRange.addEventListener('input', event => setEditorZoom(event.target.value));

    const pointerDistance = () => {
      const points = Array.from(editorPointers.values());
      if (points.length < 2) return 1;
      return Math.max(1, Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y));
    };

    photoEditorStage.addEventListener('pointerdown', event => {
      if (editorPointers.size >= 2) return;
      photoEditorStage.setPointerCapture(event.pointerId);
      editorPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (editorPointers.size === 1) {
        editorDragStart = {
          x: event.clientX,
          y: event.clientY,
          tx: editorTransform.x,
          ty: editorTransform.y
        };
        photoEditorStage.classList.add('dragging');
      } else {
        editorDragStart = null;
        editorPinchStart = { distance: pointerDistance(), z: editorTransform.z };
      }
    });

    photoEditorStage.addEventListener('pointermove', event => {
      if (!editorPointers.has(event.pointerId)) return;
      editorPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

      if (editorPointers.size >= 2 && editorPinchStart) {
        setEditorZoom(editorPinchStart.z * pointerDistance() / editorPinchStart.distance);
      } else if (editorDragStart) {
        editorTransform.x = editorDragStart.tx + (event.clientX - editorDragStart.x);
        editorTransform.y = editorDragStart.ty + (event.clientY - editorDragStart.y);
        applyEditorTransform();
      }
    });

    const endPointer = event => {
      if (!editorPointers.has(event.pointerId)) return;
      editorPointers.delete(event.pointerId);
      if (editorPointers.size < 2) editorPinchStart = null;
      if (editorPointers.size === 0) {
        editorDragStart = null;
        photoEditorStage.classList.remove('dragging');
      } else {
        const point = Array.from(editorPointers.values())[0];
        editorDragStart = { x: point.x, y: point.y, tx: editorTransform.x, ty: editorTransform.y };
      }
    };
    photoEditorStage.addEventListener('pointerup', endPointer);
    photoEditorStage.addEventListener('pointercancel', endPointer);

    photoEditorStage.addEventListener('wheel', event => {
      event.preventDefault();
      setEditorZoom(editorTransform.z + (event.deltaY < 0 ? 0.08 : -0.08));
    }, { passive: false });
  }

  filePicker.addEventListener('change', async () => {
    const file = filePicker.files && filePicker.files[0];
    const id = pendingPhotoId;
    pendingPhotoId = null;
    if (!file || !id) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.indexOf(file.type) === -1) {
      toast('Please choose a JPG, PNG or WEBP image ♥');
      return;
    }
    if (file.size > 30 * 1024 * 1024) {
      toast('That image is too large — try one under 30 MB ♥');
      return;
    }

    toast('Adding your photo…');
    try {
      const dataUrl = await compressImage(file);
      let fitted = dataUrl;
      try {
        fitted = await autoFitPhoto(dataUrl, pendingSlotSize, id);
      } catch (fitErr) {
        console.warn('Auto-fit failed; using original crop:', fitErr);
      }
      state.photos[id] = fitted;
      renderPhoto(id);
      try {
        await idbSetPhoto(id, fitted);
      } catch (err) {
        warnPhotoSave(err);
      }
      toast('Photo added to your scrapbook ♥');
    } catch (err) {
      console.warn('Image processing failed:', err);
      toast('That photo could not be added — please try another one ♥');
    }
  });

  /* ================================================================== *
   *  EDIT MODE & TEXT EDITING
   * ================================================================== */
  function setEditMode(on) {
    editMode = on;
    document.body.classList.toggle('edit-mode', on);
    textEls.forEach(el => {
      el.contentEditable = on ? 'true' : 'false';
      el.spellcheck = on;
    });
    editBtn.setAttribute('aria-pressed', String(on));
    editIcon.textContent = on ? '✓' : '✎';
    toast(on
      ? 'Edit mode is on — click any text or photo to change it ♥'
      : 'Your scrapbook is ready to enjoy ♥');
  }

  editBtn.addEventListener('click', () => setEditMode(!editMode));

  document.addEventListener('input', event => {
    const el = event.target.closest && event.target.closest('[data-text]');
    if (!el || !editMode) return;
    state.text[el.dataset.text] = el.innerHTML;
    scheduleSave();
  });

  // Paste as plain text so pasted content never breaks the scrapbook layout.
  document.addEventListener('paste', event => {
    const el = event.target.closest && event.target.closest('[data-text]');
    if (!el || !editMode) return;
    event.preventDefault();
    const text = (event.clipboardData || window.clipboardData).getData('text/plain');
    if (document.queryCommandSupported && document.queryCommandSupported('insertText')) {
      document.execCommand('insertText', false, text);
    } else {
      const selection = window.getSelection();
      if (!selection.rangeCount) return;
      const range = selection.getRangeAt(0);
      range.deleteContents();
      const node = document.createTextNode(text);
      range.insertNode(node);
      range.setStartAfter(node);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    state.text[el.dataset.text] = el.innerHTML;
    scheduleSave();
  });

  resetBtn.addEventListener('click', async () => {
    const ok = window.confirm(
      'Reset the whole scrapbook?\n\nAll uploaded photos and edited text saved in this browser will be removed. This cannot be undone.'
    );
    if (!ok) return;
    resetting = true;
    clearTimeout(saveTimer);
    saveTimer = null;
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(OPTIMIZED_KEY);
      await idbClearPhotos();
    } catch (err) {
      console.warn('Could not clear storage:', err);
    }
    window.location.reload();
  });

  /* ================================================================== *
   *  REALISTIC 3D PAGE TURNING
   * ================================================================== */
  function updateNav() {
    pageNow.textContent = String(currentPage + 1);
    prevBtn.disabled = isAnimating || currentPage === 0;
    nextBtn.disabled = isAnimating || currentPage >= pages.length - 1;
  }

  function updateLeftNote() {
    const previous = textMap.get('p' + currentPage + '.title');
    if (currentPage === 0) {
      leftNote.textContent = 'Every page holds a piece of my heart.';
    } else if (previous) {
      leftNote.textContent = '✦  ' + (previous.textContent || 'a memory').trim();
    }
  }

  function flipTo(target) {
    if (isAnimating || target < 0 || target >= pages.length || target === currentPage) return;

    const forward = target > currentPage;
    const sheetIndex = forward ? currentPage : currentPage - 1;
    const sheet = pages[sheetIndex];
    if (!sheet) return;

    isAnimating = true;
    updateNav();
    sheet.classList.add('turning');
    sheet.style.zIndex = '200';

    currentPage = target;
    pageNow.textContent = String(currentPage + 1);
    updateLeftNote();

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      sheet.removeEventListener('transitionend', onEnd);
      sheet.classList.remove('turning');
      // Turned sheets rest on the left stack; unturned sheets stay in order.
      sheet.style.zIndex = forward
        ? String(sheetIndex + 1)
        : String(pages.length - sheetIndex);
      isAnimating = false;
      updateNav();
    };
    const onEnd = event => {
      if (event.target === sheet && event.propertyName === 'transform') finish();
    };

    sheet.addEventListener('transitionend', onEnd);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => sheet.classList.toggle('turned', forward));
    });
    setTimeout(finish, reducedMotion() ? 90 : 1000);
  }

  function goNext() { flipTo(currentPage + 1); }
  function goPrev() { flipTo(currentPage - 1); }

  nextBtn.addEventListener('click', goNext);
  prevBtn.addEventListener('click', goPrev);

  // Tapping the outer edges of a page turns it, like a real book.
  bookRight.addEventListener('click', event => {
    if (event.target.closest('button, [contenteditable="true"], .ph-replace, .ph-delete')) return;
    const face = event.target.closest('.page-face');
    if (!face) return;
    const rect = face.getBoundingClientRect();
    const x = event.clientX - rect.left;
    if (x > rect.width * 0.88) goNext();
    else if (x < rect.width * 0.1 && currentPage > 0) goPrev();
  });

  // Swipe gestures (pointer events cover touch, mouse and pen).
  let pointerStart = null;
  book.addEventListener('pointerdown', event => {
    if (event.target.closest('button, [contenteditable="true"], .ph-replace, .ph-delete')) return;
    pointerStart = { x: event.clientX, y: event.clientY };
  });
  book.addEventListener('pointerup', event => {
    if (!pointerStart) return;
    const dx = event.clientX - pointerStart.x;
    const dy = event.clientY - pointerStart.y;
    pointerStart = null;
    if (Math.abs(dx) < 55 || Math.abs(dx) < Math.abs(dy) * 1.3) return;
    dx < 0 ? goNext() : goPrev();
  });
  book.addEventListener('pointercancel', () => { pointerStart = null; });

  document.addEventListener('keydown', event => {
    if (!cover.hidden || isAnimating) return;
    const active = document.activeElement;
    if (active && (active.isContentEditable || active.tagName === 'INPUT')) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); goNext(); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); goPrev(); }
  });

  /* ================================================================== *
   *  COVER OPENING / CLOSING
   * ================================================================== */
  openBtn.addEventListener('click', () => {
    if (coverOpen) return;
    coverOpen = true;
    cover.classList.add('opening');
    setTimeout(() => {
      cover.hidden = true;
      stage.hidden = false;
      updateNav();
      updateLeftNote();
    }, reducedMotion() ? 60 : 900);
  });

  backCoverBtn.addEventListener('click', () => {
    if (!coverOpen) return;
    coverOpen = false;
    stage.hidden = true;
    cover.hidden = false;
    cover.classList.remove('opening');
  });

  /* ================================================================== *
   *  OPTIONAL BACKGROUND MUSIC
   * ================================================================== */
  function rememberMusicAuto(wanted) {
    musicAutoWanted = wanted;
    try { localStorage.setItem(MUSIC_AUTO_KEY, wanted ? '1' : '0'); } catch (err) { /* private mode */ }
  }

  function markMusicPlaying() {
    musicIcon.textContent = '❚❚';
    musicBtn.setAttribute('aria-label', 'Pause background music');
  }

  async function startAutoMusic() {
    if (!musicAutoWanted || !audio.paused) return;
    audio.volume = 0.45;
    audio.muted = false;
    muteIcon.textContent = '♫';
    muteBtn.setAttribute('aria-label', 'Mute music');
    muteBtn.classList.remove('is-off');
    try {
      await audio.play();
      markMusicPlaying();
    } catch (err) {
      // Browsers require a user gesture; armAutoMusic tries again on first interaction.
    }
  }

  function armAutoMusic() {
    if (!musicAutoWanted) return;
    startAutoMusic();
    const onGesture = () => {
      document.removeEventListener('pointerdown', onGesture);
      document.removeEventListener('keydown', onGesture);
      startAutoMusic();
    };
    document.addEventListener('pointerdown', onGesture);
    document.addEventListener('keydown', onGesture);
  }

  musicBtn.addEventListener('click', async () => {
    if (!musicAvailable) {
      toast('Add your song at assets/music/background.mp3 to play it here ♥');
      return;
    }
    if (audio.paused) {
      try {
        await audio.play();
        rememberMusicAuto(true);
        markMusicPlaying();
      } catch (err) {
        musicAvailable = false;
        console.warn('Music could not be played:', err);
        toast('No music file found yet — add assets/music/background.mp3 ♥');
      }
    } else {
      rememberMusicAuto(false);
      audio.pause();
      musicIcon.textContent = '♪';
      musicBtn.setAttribute('aria-label', 'Play background music');
    }
  });

  muteBtn.addEventListener('click', () => {
    audio.muted = !audio.muted;
    rememberMusicAuto(!audio.muted);
    muteIcon.textContent = audio.muted ? '✕' : '♫';
    muteBtn.setAttribute('aria-label', audio.muted ? 'Unmute music' : 'Mute music');
    muteBtn.classList.toggle('is-off', audio.muted);
  });

  audio.addEventListener('pause', () => {
    if (!audio.paused) return;
    musicIcon.textContent = '♪';
    musicBtn.setAttribute('aria-label', 'Play background music');
  });

  /* ================================================================== *
   *  LIGHTWEIGHT BACKGROUND PARTICLES
   * ================================================================== */
  function buildParticles() {
    particles.innerHTML = '';
    const smallScreen = window.innerWidth < 700;
    const petalCount = smallScreen ? 9 : 15;
    const heartCount = smallScreen ? 4 : 7;

    for (let i = 0; i < petalCount; i++) {
      const petal = document.createElement('span');
      petal.className = 'petal';
      petal.style.setProperty('--x', (Math.random() * 100).toFixed(1) + '%');
      petal.style.setProperty('--size', (9 + Math.random() * 11).toFixed(0) + 'px');
      petal.style.setProperty('--duration', (14 + Math.random() * 14).toFixed(1) + 's');
      petal.style.setProperty('--delay', (-Math.random() * 26).toFixed(1) + 's');
      petal.style.setProperty('--drift', ((Math.random() - .5) * 220).toFixed(0) + 'px');
      petal.style.setProperty('--rot', (Math.random() * 360).toFixed(0) + 'deg');
      particles.appendChild(petal);
    }

    for (let i = 0; i < heartCount; i++) {
      const heart = document.createElement('span');
      heart.className = 'float-heart';
      heart.textContent = '♥';
      heart.style.setProperty('--x', (Math.random() * 100).toFixed(1) + '%');
      heart.style.setProperty('--size', (9 + Math.random() * 9).toFixed(0) + 'px');
      heart.style.setProperty('--duration', (20 + Math.random() * 16).toFixed(1) + 's');
      heart.style.setProperty('--delay', (-Math.random() * 32).toFixed(1) + 's');
      heart.style.setProperty('--drift', ((Math.random() - .5) * 120).toFixed(0) + 'px');
      particles.appendChild(heart);
    }
  }

  /* ================================================================== *
   *  ONE-TIME TEXT UPDATE — replace old saved defaults with the new words
   * ================================================================== */
  const TEXT_UPDATES = {
    'p1.date': { from: ['August 14, 2021', 'April 22, 2024'], to: 'MAY 9' },
    'cover.date': { from: ['August 14, 2021', 'April 22, 2024'], to: 'April 22, 2023' },
    'p1.location': { from: ['The little café downtown'], to: 'The milktea shop' },
    'p2note.letter': {
      from: ["Dear you,\n\nThis page is yours. Write whatever you want me to remember — a promise, a memory, or just the way I make you feel.\n\nI'll keep it safe here forever."],
      to: 'Dear my Lovelove,\n\nKahit na madalas maldita ka i will always love every part of youuuu!! I ALWAYS LOVE YOUUUU'
    },
    'p2note.signature': { from: ['With all my love'], to: 'With all my love. Your&nbsp;&nbsp;Poging Jairo' },
    'p3.capA': { from: ['morning coffee'], to: 'Chowking' },
    'p3.capB': { from: ['that one laugh'], to: 'jabii' },
    'p3.capC': { from: ['slow Sundays'], to: 'gala before uwi' },
    'p3b.capA': { from: ['the way you smile'], to: 'first ice creamm!!!' },
    'p3b.capB': { from: ['inside jokes'], to: 'coffeee' },
    'p3b.capC': { from: ['late night talks'], to: 'bracelet:>' },
    'p4.placeA': { from: ['Somewhere by the sea'], to: 'ILOG W/ BOTCHI' },
    'p4.dateA': { from: ['June 2022'], to: 'MAY 2025' },
    'p4.placeB': { from: ['Our little city'], to: 'BAGUIO' },
    'p4.dateB': { from: ['October 2022'], to: 'JUNE 2024' },
    'p4.placeC': { from: ['The mountains'], to: 'CAMP JOHN HAY' },
    'p4.dateC': { from: ['March 2023'], to: 'JUNE 2024' },
    'p4b.capA': { from: ['first hello'], to: 'FIRST DATE' },
    'p4b.capB': { from: ['first date'], to: '2ND DATE' },
    'p4b.capC': { from: ['first trip'], to: 'FIRST TRIP' },
    'p4b.capD': { from: ['us now'], to: 'US NOW' },
    'p5event.date': { from: ['August 14, 2021'], to: 'APRIL 20, 2024' },
    'p5event.caption': { from: ['Write about the moment that changed everything.'], to: '1ST ANNIVERSARY!!!' },
    'p5.caption': { from: ['I hope I never run out of reasons to make you smile.'], to: 'I WILL NEVER RUN OUT OF REASONS TO MAKE YOU SMILE.' },
    'p6a.capB': { from: ['a silly inside joke'], to: 'hihi' },
    'p6a.capC': { from: ['just because'], to: 'sm' },
    'p6.capA': { from: ['a random Tuesday'], to: 'a random night' },
    'p6.capB': { from: ['singing in the car'], to: 'bday dinner' },
    'p7.reasonA': { from: ['The way you laugh at your own jokes.'], to: 'The way you laugh at our corny jokes BUWHAHAH.' },
    'p7.reasonB': { from: ['How you always know when I need a hug.'], to: 'How you always know when I need your armpits' },
    'p7happy.capA': { from: ['the day we laughed until we cried'], to: 'your bdayyyy!!' },
    'p7happy.capB': { from: ['our favorite place'], to: 'day of our first kiss' },
    'p7happy.capC': { from: ['a perfect ordinary day'], to: 'new yearrr!!' },
    'p10.caption': {
      from: ['It would be that ordinary evening when we talked for hours and I realized, quite suddenly, that I never wanted the night to end. I would go back just to feel that feeling again — and then I would tell you, right then, that I loved you.'],
      to: "I would choose that simple evening when we talked for hours, sharing little stories and laughing about the smallest things. I remember how, without even realizing it, you made an ordinary night feel like something I wanted to hold on to forever. If I could go back, I wouldn't change a single thing. I'd just stay a little longer, look at you a little more, and tell you how much you mean to me. And this time, I wouldn't keep it to myself. I'd tell you that I was already falling in love with you, and that if I had to choose all over again, I'd still choose you"
    },
    'p9.dateA': { from: ['February 14'], to: 'JULY 23' },
    'p9.capA': { from: ["Our first Valentine's"], to: 'First SM' },
    'p9.dateB': { from: ['May 20'], to: 'FEBRUARY 9' },
    'p9.capB': { from: ['The best surprise'], to: 'Our First CFO' },
    'p9.dateC': { from: ['December 24'], to: 'NOVEMBER 24' },
    'p9.capC': { from: ['Home for the holidays'], to: 'We bought your printer' }
  };

  function updateSavedTexts() {
    let changed = false;
    Object.keys(TEXT_UPDATES).forEach(id => {
      const el = textMap.get(id);
      if (!el) return;
      const saved = state.text[id];
      if (!saved || TEXT_UPDATES[id].from.indexOf(saved) !== -1) {
        state.text[id] = TEXT_UPDATES[id].to;
        el.innerHTML = TEXT_UPDATES[id].to;
        changed = true;
      }
    });
    if (changed) scheduleSave();
  }

  /* ================================================================== *
   *  PHOTO CAROUSEL — move through the frames on a single page
   * ================================================================== */
  function buildCarousels() {
    document.querySelectorAll('[data-carousel]').forEach(carousel => {
      const track = carousel.querySelector('.carousel-track');
      const slides = Array.from(track.children);
      if (!slides.length) return;
      const dotsBox = carousel.querySelector('.carousel-dots');
      const prev = carousel.querySelector('.carousel-prev');
      const next = carousel.querySelector('.carousel-next');
      let index = 0;

      slides.forEach((_, i) => {
        const dot = document.createElement('span');
        dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
        dotsBox.appendChild(dot);
      });
      const dots = Array.from(dotsBox.children);

      function show(n) {
        index = (n + slides.length) % slides.length;
        track.style.transform = 'translateX(' + (-index * 100) + '%)';
        dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
      }

      prev.addEventListener('click', event => { event.stopPropagation(); show(index - 1); });
      next.addEventListener('click', event => { event.stopPropagation(); show(index + 1); });

      // The carousel owns horizontal swipes so they never flip the book.
      let startX = null;
      carousel.addEventListener('pointerdown', event => {
        event.stopPropagation();
        startX = event.clientX;
      });
      carousel.addEventListener('pointerup', event => {
        event.stopPropagation();
        if (startX === null) return;
        const dx = event.clientX - startX;
        startX = null;
        if (Math.abs(dx) > 40) show(index + (dx < 0 ? 1 : -1));
      });
      carousel.addEventListener('pointercancel', () => { startX = null; });
      carousel.addEventListener('click', event => event.stopPropagation());

      show(0);
    });
  }

  /* ================================================================== *
   *  HIDDEN TOOL MENU — tucks music / edit / reset behind one button
   * ================================================================== */
  function initToolMenu() {
    if (!toolMenuBtn || !toolMenu) return;

    const closeMenu = () => {
      toolMenu.hidden = true;
      toolMenuBtn.setAttribute('aria-expanded', 'false');
    };

    toolMenuBtn.addEventListener('click', event => {
      event.stopPropagation();
      const shouldOpen = toolMenu.hidden;
      toolMenu.hidden = !shouldOpen;
      toolMenuBtn.setAttribute('aria-expanded', String(shouldOpen));
    });

    document.addEventListener('click', event => {
      if (!toolMenu.hidden && !toolMenu.contains(event.target)) closeMenu();
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !toolMenu.hidden) {
        closeMenu();
        toolMenuBtn.focus();
      }
    });
  }

  /* ================================================================== *
   *  PASSWORD GATE — keeps the album behind a simple local password
   * ================================================================== */
  function initLock() {
    if (!lockScreen || !lockForm) return;

    let unlocked = false;
    try { unlocked = localStorage.getItem(UNLOCK_KEY) === '1'; } catch (err) { /* private mode */ }

    if (unlocked) {
      lockScreen.hidden = true;
      armAutoMusic();
      return;
    }

    lockScreen.hidden = false;
    setTimeout(() => lockInput.focus(), 120);

    lockForm.addEventListener('submit', event => {
      event.preventDefault();
      if (lockInput.value === PASSWORD) {
        try { localStorage.setItem(UNLOCK_KEY, '1'); } catch (err) { /* still unlock this session */ }
        lockError.textContent = '';
        lockScreen.hidden = true;
        toast('Welcome back ♥');
        startAutoMusic();
        return;
      }
      lockError.textContent = 'That’s not it — try again ♥';
      lockInput.value = '';
      lockInput.focus();
      lockScreen.classList.remove('shake');
      void lockScreen.offsetWidth;
      lockScreen.classList.add('shake');
    });
  }

  /* ================================================================== *
   *  START
   * ================================================================== */
  audio.volume = 0.45;
  try { musicAutoWanted = localStorage.getItem(MUSIC_AUTO_KEY) !== '0'; } catch (err) { /* private mode */ }

  initToolMenu();
  initPhotoEditor();
  initLock();
  buildPageFurniture();
  buildCarousels();
  buildPhotoSlots();
  loadState();
  applySavedState();
  updateSavedTexts();
  initSavedPhotos();
  buildParticles();
  updateNav();
  updateLeftNote();

  window.addEventListener('beforeunload', () => {
    if (!resetting && saveTimer) saveNow();
  });

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(buildParticles, 400);
  });
})();
