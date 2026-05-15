// IndexedDB wrapper — offline-first local storage for CoilMS.
// Provides coil/product/party/sale data caching and a write-mutation queue.

const DB_NAME    = 'coilms_local';
const DB_VERSION = 1;

let _db = null;

function openDB() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = e => {
      const db = e.target.result;
      [
        { name: 'coils',      key: 'id' },
        { name: 'products',   key: 'id' },
        { name: 'parties',    key: 'id' },
        { name: 'sales',      key: 'id' },
        { name: 'sale_items', key: 'id' },
        { name: 'sale_coils', key: 'id' },
        { name: 'metadata',   key: 'key' },
      ].forEach(({ name, key }) => {
        if (!db.objectStoreNames.contains(name))
          db.createObjectStore(name, { keyPath: key });
      });
      // Mutations store uses auto-increment id + synced index
      if (!db.objectStoreNames.contains('mutations')) {
        const ms = db.createObjectStore('mutations', { keyPath: 'id', autoIncrement: true });
        ms.createIndex('synced', 'synced', { unique: false });
      }
    };

    req.onsuccess = e => { _db = e.target.result; resolve(_db); };
    req.onerror   = e => reject(e.target.error);
  });
}

// Run a single IDBRequest inside a transaction; returns a Promise of the result.
function idbReq(storeName, mode, fn) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx      = db.transaction(storeName, mode);
    const store   = tx.objectStore(storeName);
    const request = fn(store);
    request.onsuccess = e => resolve(e.target.result);
    request.onerror   = e => reject(e.target.error);
  }));
}

// Run multiple puts inside one transaction for performance.
function putAllTx(storeName, items) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx    = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    items.forEach(item => store.put(item));
    tx.oncomplete = () => resolve();
    tx.onerror    = e => reject(e.target.error);
  }));
}

export const localdb = {
  getAll:  storeName        => idbReq(storeName, 'readonly',  s => s.getAll()),
  get:     (storeName, key) => idbReq(storeName, 'readonly',  s => s.get(key)),
  put:     (storeName, item)=> idbReq(storeName, 'readwrite', s => s.put(item)),
  delete:  (storeName, key) => idbReq(storeName, 'readwrite', s => s.delete(key)),
  putAll:  putAllTx,

  async clearStore(storeName) {
    return openDB().then(db => new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).clear();
      tx.oncomplete = () => resolve();
      tx.onerror    = e => reject(e.target.error);
    }));
  },

  // Queue a write mutation for later sync
  async queueMutation({ endpoint, method, body }) {
    return idbReq('mutations', 'readwrite', s => s.add({
      endpoint,
      method:    method.toUpperCase(),
      body:      body ? JSON.stringify(body) : null,
      timestamp: Date.now(),
      synced:    false,
    }));
  },

  async getPendingMutations() {
    const all = await this.getAll('mutations');
    return all.filter(m => !m.synced);
  },

  async markSynced(id) {
    const m = await this.get('mutations', id);
    if (m) await this.put('mutations', { ...m, synced: true });
  },

  async getMetadata(key) {
    const rec = await this.get('metadata', key);
    return rec ? rec.value : null;
  },

  async setMetadata(key, value) {
    await this.put('metadata', { key, value });
  },
};
