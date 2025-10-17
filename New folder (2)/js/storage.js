// js/storage.js

/**
 * Compresses a string using CompressionStream if available, otherwise returns null.
 * @param {string} str - The string to compress.
 * @returns {Promise<string|null>} - Base64 encoded compressed string or null.
 */
async function compressString(str) {
  if ('CompressionStream' in window) {
    const cs = new CompressionStream('gzip');
    const writer = new Blob([str]).stream().pipeThrough(cs).getReader();
    const chunks = [];
    while (true) {
      const { done, value } = await writer.read();
      if (done) break;
      chunks.push(value);
    }
    const blob = new Blob(chunks, { type: 'application/gzip' });
    const buf = await blob.arrayBuffer();
    return btoa(String.fromCharCode(...new Uint8Array(buf)));
  }
  return null; // No compression
}

/**
 * Decompresses a base64 encoded string using DecompressionStream if available.
 * @param {string} b64 - The base64 encoded compressed string.
 * @returns {Promise<string|null>} - The decompressed string or null.
 */
async function decompressString(b64) {
  if (!b64) return null;
  if ('DecompressionStream' in window) {
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const ds = new DecompressionStream('gzip');
    const stream = new Blob([bytes]).stream().pipeThrough(ds);
    const text = await new Response(stream).text();
    return text;
  } else {
    return null;
  }
}

/**
 * Safely sets an item in localStorage, trimming stored data if storage is full.
 * @param {string} key - The key to store.
 * @param {string} val - The value to store.
 * @returns {boolean} - True if successful, false otherwise.
 */
function safeSetItem(key, val) {
  try {
    localStorage.setItem(key, val);
    return true;
  } catch (e) {
    // Trim the conversation and delete oldest messages
    try {
      const store = JSON.parse(localStorage.getItem('nibras.store') || '{"history":[]}');
      store.history = store.history.slice(Math.floor(store.history.length / 3)); // Keep last third
      localStorage.setItem('nibras.store', JSON.stringify(store));
      localStorage.setItem(key, val);
      return true;
    } catch (e2) {
      console.warn('Storage full', e2);
      return false;
    }
  }
}

/**
 * Saves the memory (history, userState, theme) to localStorage with compression if possible.
 * @param {Array} history - The chat history.
 * @param {Object} userState - The user state object.
 */
async function saveMemory(history, userState) {
  const store = { history, userState, theme: document.documentElement.getAttribute('data-theme') || 'light' };
  let raw = JSON.stringify(store);
  // Try compression
  const gz = await compressString(raw);
  if (gz) {
    const ok = safeSetItem('nibras.store.gz', gz);
    if (ok) {
      localStorage.removeItem('nibras.store');
      return;
    }
  }
  // If compression failed or storage failed
  safeSetItem('nibras.store', raw);
}

/**
 * Loads the memory from localStorage, decompressing if necessary.
 * @returns {Promise<Object|null>} - The stored data or null.
 */
async function loadMemory() {
  const gz = localStorage.getItem('nibras.store.gz');
  if (gz) {
    const text = await decompressString(gz);
    if (text) {
      try {
        return JSON.parse(text);
      } catch {
        /* ignore */
      }
    }
  }
  const raw = localStorage.getItem('nibras.store');
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      /* ignore */
    }
  }
  return null;
}

/**
 * Clears the stored memory from localStorage.
 */
function clearMemory() {
  localStorage.removeItem('nibras.store');
  localStorage.removeItem('nibras.store.gz');
}

// Export all storage functions
export { safeSetItem, compressString, decompressString, saveMemory, loadMemory, clearMemory };