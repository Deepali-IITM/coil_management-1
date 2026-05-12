export default {
  name: "CoilInventory",
  template: `
  <div class="page-wrapper">
    <div class="page-header">
      <div>
        <h1 class="page-title">Coil Inventory</h1>
        <p class="page-sub">{{ coils.length }} coil{{ coils.length !== 1 ? 's' : '' }} in stock</p>
      </div>
      <button class="btn btn-primary" @click="$router.push('/create-coil')">
        <i class="bi bi-plus-lg me-1"></i>Add New Coil
      </button>
    </div>

    <!-- Alert banner -->
    <div v-if="criticalCount > 0" class="alert alert-danger d-flex align-items-center gap-2 mb-3">
      <i class="bi bi-exclamation-triangle-fill fs-5 flex-shrink-0"></i>
      <span>
        <strong>{{ criticalCount }} coil{{ criticalCount !== 1 ? 's' : '' }} exhausted</strong>
        <span v-if="lowCount"> and <strong>{{ lowCount }} running low</strong></span>
        — highlighted at the top.
      </span>
    </div>
    <div v-else-if="lowCount > 0" class="alert alert-warning d-flex align-items-center gap-2 mb-3">
      <i class="bi bi-exclamation-circle-fill fs-5 flex-shrink-0"></i>
      <span><strong>{{ lowCount }} coil{{ lowCount !== 1 ? 's' : '' }}</strong> running low (≤ 50 m remaining).</span>
    </div>

    <div v-if="loading" class="d-flex justify-content-center py-5">
      <div class="spinner-border text-primary"></div>
    </div>
    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>

    <div v-else class="card">
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead class="table-head-accent">
            <tr>
              <th style="width:28px;"></th>
              <th>Coil No.</th>
              <th>Supplier</th>
              <th>Make</th>
              <th>Type</th>
              <th>Color</th>
              <th class="text-end">Original (m)</th>
              <th class="text-end">Used (m)</th>
              <th class="text-end">Remaining (m)</th>
              <th>Purchase Date</th>
              <th class="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!sortedCoils.length">
              <td colspan="11" class="text-center text-muted py-5">
                <i class="bi bi-layers display-4 d-block mb-2"></i>
                No coils found. Add your first coil to get started.
              </td>
            </tr>
            <tr v-for="coil in sortedCoils" :key="coil.id"
                :class="{
                  'table-danger':  coil._severity === 'critical',
                  'table-warning': coil._severity === 'low',
                }">
              <!-- Flag icon -->
              <td class="text-center p-0" style="vertical-align:middle;">
                <i v-if="coil._severity === 'critical'"
                   class="bi bi-exclamation-triangle-fill text-danger fs-6" title="Exhausted"></i>
                <i v-else-if="coil._severity === 'low'"
                   class="bi bi-exclamation-circle-fill text-warning fs-6" title="Low stock"></i>
              </td>
              <td class="fw-semibold">{{ coil.coil_number }}</td>
              <td>{{ coil.supplier_name || '—' }}</td>
              <td>{{ coil.make }}</td>
              <td>{{ coil.type }}</td>
              <td>{{ coil.color }}</td>
              <td class="text-end text-muted">{{ coil.length != null ? coil.length : '—' }}</td>
              <td class="text-end text-warning fw-semibold">
                {{ coil._used !== null ? coil._used.toFixed(1) : '—' }}
              </td>
              <td class="text-end">
                <span v-if="coil._remaining !== null" class="badge" :class="remainingBadge(coil._severity)">
                  {{ coil._remaining.toFixed(1) }} m
                </span>
                <span v-else class="text-muted">—</span>
              </td>
              <td class="text-muted">{{ formatDate(coil.purchase_date) }}</td>
              <td class="text-center">
                <div class="d-flex gap-1 justify-content-center">
                  <button class="btn btn-sm btn-outline-secondary" @click="editCoil(coil.id)" title="Edit">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger" @click="deleteCoil(coil.id)" title="Delete">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
  `,

  data() {
    return {
      coils: [],
      remainingMap: {},   // coil_id → { remaining_length, used_length }
      loading: true,
      error: null,
    };
  },

  computed: {
    sortedCoils() {
      const order = { critical: 0, low: 1, ok: 2 };
      return [...this.coils]
        .map(c => {
          const info = this.remainingMap[c.id];
          const remaining = info ? info.remaining_length : null;
          const used      = info ? info.used_length      : null;
          const severity  = remaining === null ? 'ok'
            : remaining <= 0  ? 'critical'
            : remaining <= 50 ? 'low'
            : 'ok';
          return { ...c, _remaining: remaining, _used: used, _severity: severity };
        })
        .sort((a, b) => {
          const d = order[a._severity] - order[b._severity];
          if (d !== 0) return d;
          if (a._remaining !== null && b._remaining !== null) return a._remaining - b._remaining;
          return 0;
        });
    },

    criticalCount() { return this.sortedCoils.filter(c => c._severity === 'critical').length; },
    lowCount()      { return this.sortedCoils.filter(c => c._severity === 'low').length; },
  },

  methods: {
    token() { return localStorage.getItem("auth-token"); },

    async fetchCoils() {
      try {
        const res = await fetch("/api/coils", {
          headers: { "Authentication-Token": this.token() },
        });
        if (res.ok) {
          this.coils = await res.json();
        } else {
          this.error = "Failed to load coils.";
        }
      } catch {
        this.error = "Network error.";
      }
    },

    async fetchRemaining() {
      try {
        const res = await fetch("/api/dashboard", {
          headers: { "Authentication-Token": this.token() },
        });
        if (res.ok) {
          const data = await res.json();
          const map = {};
          (data.coil_details || []).forEach(c => { map[c.coil_id] = c; });
          this.remainingMap = map;
        }
      } catch {}
    },

    remainingBadge(severity) {
      return { critical: 'bg-danger', low: 'bg-warning text-dark', ok: 'bg-success' }[severity] || 'bg-secondary';
    },

    formatDate(dateStr) {
      if (!dateStr) return "—";
      const d = new Date(dateStr);
      return isNaN(d) ? String(dateStr).split("T")[0] : d.toLocaleDateString("en-IN");
    },

    editCoil(coilId) {
      localStorage.setItem("update_coil_id", coilId);
      this.$router.push("/update-coil");
    },

    async deleteCoil(coilId) {
      if (!confirm("Delete this coil? This cannot be undone.")) return;
      try {
        const res = await fetch(`/delete/coil/${coilId}`, {
          method: "DELETE",
          headers: { "Authentication-Token": this.token() },
        });
        if (res.ok) {
          await Promise.all([this.fetchCoils(), this.fetchRemaining()]);
          this.$toast.success("Coil deleted.");
        } else {
          this.$toast.error("Cannot delete — this coil is linked to existing sale orders.");
        }
      } catch {
        this.$toast.error("Network error. Could not delete coil.");
      }
    },
  },

  async mounted() {
    await Promise.all([this.fetchCoils(), this.fetchRemaining()]);
    this.loading = false;
  },
};
