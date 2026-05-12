export default {
  name: "CoilForm",
  template: `
  <div class="page-wrapper" style="max-width:700px;">
    <div class="page-header">
      <div>
        <h1 class="page-title">Add New Coil</h1>
        <p class="page-sub">Fill in the details below to register a new coil.</p>
      </div>
      <button class="btn btn-outline-secondary" @click="$router.push('/coil_info')">
        <i class="bi bi-arrow-left me-1"></i>Back
      </button>
    </div>

    <div class="card">
      <div class="card-body p-4">
        <form @submit.prevent="createCoil">

          <div class="row g-3 mb-3">
            <div class="col-md-6">
              <label class="form-label">Coil Number <span class="text-danger">*</span></label>
              <input v-model="coil.coil_number" type="text" class="form-control"
                     placeholder="e.g. C001" required />
              <div class="form-text text-danger" v-if="errors.coil_number">{{ errors.coil_number }}</div>
            </div>
            <div class="col-md-6">
              <label class="form-label">Supplier Name</label>
              <input v-model="coil.supplier_name" type="text" class="form-control"
                     placeholder="Enter supplier name" />
            </div>
          </div>

          <div class="row g-3 mb-3">
            <div class="col-md-4">
              <label class="form-label">Make <span class="text-danger">*</span></label>
              <input v-model="coil.make" type="text" class="form-control"
                     placeholder="e.g. JSW" required />
            </div>
            <div class="col-md-4">
              <label class="form-label">Type <span class="text-danger">*</span></label>
              <input v-model="coil.type" type="text" class="form-control"
                     placeholder="e.g. Coloron" required />
            </div>
            <div class="col-md-4">
              <label class="form-label">Color <span class="text-danger">*</span></label>
              <input v-model="coil.color" type="text" class="form-control"
                     placeholder="e.g. Silver" required />
            </div>
          </div>

          <div class="row g-3 mb-3">
            <div class="col-md-4">
              <label class="form-label">Total Weight (kg)</label>
              <input v-model.number="coil.total_weight" type="number" step="0.01" min="0"
                     class="form-control" placeholder="0.00" />
            </div>
            <div class="col-md-4">
              <label class="form-label">Purchase Price (₹)</label>
              <input v-model.number="coil.purchase_price" type="number" step="0.01" min="0"
                     class="form-control" placeholder="0.00" />
            </div>
            <div class="col-md-4">
              <label class="form-label">Length (m)</label>
              <input v-model.number="coil.length" type="number" step="0.01" min="0"
                     class="form-control" placeholder="Coil length in metres" />
            </div>
          </div>

          <div class="row g-3 mb-3">
            <div class="col-md-6">
              <label class="form-label">Purchase Date</label>
              <input v-model="coil.purchase_date" type="date" class="form-control" />
            </div>
            <div class="col-md-6">
              <label class="form-label">Notes</label>
              <input v-model="coil.notes" type="text" class="form-control"
                     placeholder="Any notes about this coil" />
            </div>
          </div>

          <div class="d-flex gap-2 mt-4">
            <button type="submit" class="btn btn-primary flex-grow-1" :disabled="saving">
              <span v-if="saving"><span class="spinner-border spinner-border-sm me-1"></span>Saving…</span>
              <span v-else><i class="bi bi-check-lg me-1"></i>Save Coil</span>
            </button>
            <button type="button" class="btn btn-outline-secondary"
                    @click="$router.push('/coil_info')">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  </div>
  `,

  data() {
    return {
      coil: {
        coil_number: "",
        supplier_name: "",
        total_weight: null,
        purchase_price: null,
        make: "",
        type: "",
        color: "",
        length: null,
        purchase_date: "",
        notes: "",
      },
      errors: {},
      saving: false,
    };
  },

  methods: {
    token() { return localStorage.getItem("auth-token"); },

    async createCoil() {
      this.errors = {};
      if (!this.coil.coil_number.trim()) {
        this.errors.coil_number = "Coil number is required.";
        return;
      }
      this.saving = true;
      try {
        const payload = { ...this.coil };
        if (payload.purchase_date) {
          payload.purchase_date = new Date(payload.purchase_date).toISOString().split("T")[0];
        }
        const res = await fetch("/api/coils", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authentication-Token": this.token(),
          },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.ok) {
          this.$toast.success("Coil added successfully!");
          this.$router.push("/coil_info");
        } else {
          if (data.message && data.message.includes("already exists")) {
            this.errors.coil_number = data.message;
          } else {
            this.$toast.error(data.message || "Failed to add coil.");
          }
        }
      } catch {
        this.$toast.error("Network error. Could not save coil.");
      } finally {
        this.saving = false;
      }
    },
  },
};
