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

    <div v-if="loading" class="d-flex justify-content-center py-5">
      <div class="spinner-border text-primary"></div>
    </div>
    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>

    <div v-else class="card">
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead class="table-head-accent">
            <tr>
              <th>Coil No.</th>
              <th>Supplier</th>
              <th>Make</th>
              <th>Type</th>
              <th>Color</th>
              <th class="text-end">Weight (kg)</th>
              <th class="text-end">Price (₹)</th>
              <th class="text-end">Length (m)</th>
              <th>Purchase Date</th>
              <th class="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!coils.length">
              <td colspan="10" class="text-center text-muted py-5">
                <i class="bi bi-layers display-4 d-block mb-2"></i>
                No coils found. Add your first coil to get started.
              </td>
            </tr>
            <tr v-for="coil in coils" :key="coil.id">
              <td class="fw-semibold">{{ coil.coil_number }}</td>
              <td>{{ coil.supplier_name || '—' }}</td>
              <td>{{ coil.make }}</td>
              <td>{{ coil.type }}</td>
              <td>{{ coil.color }}</td>
              <td class="text-end">{{ coil.total_weight != null ? coil.total_weight : '—' }}</td>
              <td class="text-end">{{ coil.purchase_price != null ? '₹' + coil.purchase_price : '—' }}</td>
              <td class="text-end fw-semibold" :class="coil.length > 0 ? 'text-info' : 'text-muted'">
                {{ coil.length != null ? coil.length : '—' }}
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
      loading: true,
      error: null,
    };
  },

  methods: {
    token() { return localStorage.getItem("auth-token"); },

    async fetchCoils() {
      this.loading = true;
      this.error = null;
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
        this.error = "Network error. Could not load coils.";
      } finally {
        this.loading = false;
      }
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
          await this.fetchCoils();
          this.$toast.success("Coil deleted.");
        } else {
          this.$toast.error("Cannot delete — this coil is linked to existing sale orders.");
        }
      } catch {
        this.$toast.error("Network error. Could not delete coil.");
      }
    },
  },

  mounted() { this.fetchCoils(); },
};
