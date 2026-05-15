import { SyncEngine } from '../js/sync.js';
import { localdb }    from '../js/localdb.js';

const OfflineBar = {
  name: 'OfflineBar',

  template: `
    <transition name="offline-slide">
      <div v-if="show" :class="barClass" class="offline-bar d-flex align-items-center gap-2 px-4 py-2">
        <i :class="iconClass" style="font-size:1rem;flex-shrink:0;"></i>
        <span class="fw-medium small">{{ message }}</span>
        <span v-if="lastSyncLabel" class="ms-auto small opacity-75 d-none d-sm-inline">
          Last sync {{ lastSyncLabel }}
        </span>
        <template v-if="!syncing">
          <button
            v-if="online && pendingCount > 0"
            class="btn btn-sm btn-light ms-2 py-0 px-2"
            @click="triggerSync"
          >Sync now</button>
          <button
            v-if="!online"
            class="btn btn-sm btn-outline-light ms-2 py-0 px-2"
            @click="triggerSync"
          >Retry</button>
        </template>
        <span v-if="syncing" class="ms-auto d-flex align-items-center gap-1 small">
          <span class="spinner-border spinner-border-sm"></span> Syncing…
        </span>
      </div>
    </transition>
  `,

  data() {
    return {
      online:       navigator.onLine,
      pendingCount: 0,
      syncing:      false,
      lastSync:     null,
      _timer:       null,
    };
  },

  computed: {
    show()    { return !this.online || this.pendingCount > 0; },
    barClass() {
      return !this.online ? 'bg-danger text-white' : 'bg-warning text-dark';
    },
    iconClass() {
      return !this.online ? 'bi bi-wifi-off' : 'bi bi-cloud-arrow-up-fill';
    },
    message() {
      if (!this.online && this.pendingCount > 0)
        return `Offline — ${this.pendingCount} change${this.pendingCount > 1 ? 's' : ''} queued`;
      if (!this.online)
        return 'Offline — reading from local cache';
      if (this.pendingCount > 0)
        return `${this.pendingCount} change${this.pendingCount > 1 ? 's' : ''} waiting to sync`;
      return '';
    },
    lastSyncLabel() {
      if (!this.lastSync) return null;
      return new Date(this.lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },
  },

  methods: {
    async refresh() {
      try {
        this.pendingCount = await SyncEngine.pendingCount();
        this.lastSync     = await localdb.getMetadata('lastSync');
      } catch { /* silent */ }
    },

    async triggerSync() {
      if (this.syncing) return;
      this.syncing = true;
      try {
        const flushed = await SyncEngine.flushMutations();
        await SyncEngine.syncFromServer();
        await this.refresh();
        if (flushed > 0) {
          this.$toast?.success(`${flushed} change${flushed > 1 ? 's' : ''} synced successfully`);
          // Notify other components that data changed
          window.dispatchEvent(new Event('coilms:synced'));
        }
      } catch (e) {
        this.$toast?.error('Sync failed — will retry when connection improves');
      } finally {
        this.syncing = false;
      }
    },

    async handleOnline() {
      this.online = true;
      await this.triggerSync();
    },
    handleOffline() { this.online = false; },
  },

  async mounted() {
    window.addEventListener('online',  this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    await this.refresh();
    this._timer = setInterval(this.refresh, 30_000);
    // Initial background sync when first mounted (authenticated)
    if (this.online && localStorage.getItem('auth-token')) {
      SyncEngine.syncFromServer().then(() => this.refresh()).catch(() => {});
    }
  },

  beforeDestroy() {
    window.removeEventListener('online',  this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    clearInterval(this._timer);
  },
};

export default OfflineBar;
