// Sync engine — pulls server data into IndexedDB and flushes queued mutations.
// Also provides local backup export/import.

import { localdb } from './localdb.js';
import { API_BASE } from './config.js';

// Maps API endpoint → IndexedDB store + JSON key inside the response object
const SYNC_MAP = [
  { url: '/api/coil_details', store: 'coils',    key: 'coil_data' },
  { url: '/api/products',     store: 'products', key: 'products'  },
  { url: '/api/all_parties',  store: 'parties',  key: 'parties'   },
  { url: '/api/all_orders',   store: 'sales',    key: 'sales'     },
];

function authHeaders() {
  const token = localStorage.getItem('auth-token');
  return token ? { 'Authentication-Token': token, 'Content-Type': 'application/json' } : {};
}

export const SyncEngine = {
  // Pull all data from server into IndexedDB
  async syncFromServer() {
    if (!navigator.onLine) return { synced: 0, failed: [] };
    if (!localStorage.getItem('auth-token')) return { synced: 0, failed: [] };

    let synced = 0;
    const failed = [];

    for (const { url, store, key } of SYNC_MAP) {
      try {
        const res = await fetch(`${API_BASE}${url}`, { headers: authHeaders() });
        if (!res.ok) { failed.push(url); continue; }
        const json  = await res.json();
        const items = Array.isArray(json) ? json : (json[key] ?? []);
        if (items.length) await localdb.putAll(store, items);
        synced++;
      } catch {
        failed.push(url);
      }
    }

    if (synced > 0) await localdb.setMetadata('lastSync', new Date().toISOString());
    return { synced, failed };
  },

  // Replay pending mutations in order; stop on first network error
  async flushMutations() {
    if (!navigator.onLine) return 0;
    const pending = await localdb.getPendingMutations();
    let flushed = 0;

    for (const mut of pending) {
      try {
        const res = await fetch(`${API_BASE}${mut.endpoint}`, {
          method:  mut.method,
          headers: authHeaders(),
          body:    mut.body || undefined,
        });
        if (res.ok) { await localdb.markSynced(mut.id); flushed++; }
      } catch { break; }
    }

    return flushed;
  },

  async pendingCount() {
    return (await localdb.getPendingMutations()).length;
  },

  // ── Local backup / restore ────────────────────────────────────────────────

  async exportBackup() {
    const ts = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
    const data = {
      version:    1,
      exported:   new Date().toISOString(),
      coils:      await localdb.getAll('coils'),
      products:   await localdb.getAll('products'),
      parties:    await localdb.getAll('parties'),
      sales:      await localdb.getAll('sales'),
      sale_items: await localdb.getAll('sale_items'),
      sale_coils: await localdb.getAll('sale_coils'),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), {
      href:     url,
      download: `coilms-backup-${ts}.json`,
    });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    return data;
  },

  async importBackup(file) {
    const text   = await file.text();
    const backup = JSON.parse(text);
    if (!backup.version) throw new Error('Invalid backup file — missing version field.');

    for (const store of ['coils', 'products', 'parties', 'sales', 'sale_items', 'sale_coils']) {
      if (Array.isArray(backup[store]) && backup[store].length)
        await localdb.putAll(store, backup[store]);
    }
    return {
      coils:   backup.coils?.length   ?? 0,
      sales:   backup.sales?.length   ?? 0,
      parties: backup.parties?.length ?? 0,
    };
  },
};
