export default {
  name: "UpdateCoilForm",
  template: `
  <div class="page-wrapper" style="max-width:700px;">
    <div class="page-header">
      <div>
        <h1 class="page-title">Edit Coil</h1>
        <p class="page-sub" v-if="coil.coil_number">Editing coil <strong>{{ coil.coil_number }}</strong></p>
      </div>
      <button class="btn btn-outline-secondary" @click="$router.push('/coil_info')">
        <i class="bi bi-arrow-left me-1"></i>Back
      </button>
    </div>

    <div v-if="loading" class="d-flex justify-content-center py-5">
      <div class="spinner-border text-primary"></div>
    </div>

    <div v-else class="card">
      <div class="card-body p-4">
        <form @submit.prevent="updateCoil">

          <div class="row g-3 mb-3">
            <div class="col-md-6">
              <label class="form-label">Coil Number <span class="text-danger">*</span></label>
              <input type="text" class="form-control" v-model="coil.coil_number" required />
            </div>
            <div class="col-md-6">
              <label class="form-label">Supplier Name</label>
              <input type="text" class="form-control" v-model="coil.supplier_name"
                     placeholder="Enter supplier name" />
            </div>
          </div>

          <div class="row g-3 mb-3">
            <div class="col-md-4">
              <label class="form-label">Make <span class="text-danger">*</span></label>
              <input type="text" class="form-control" v-model="coil.make" required />
            </div>
            <div class="col-md-4">
              <label class="form-label">Type <span class="text-danger">*</span></label>
              <input type="text" class="form-control" v-model="coil.type" required />
            </div>
            <div class="col-md-4">
              <label class="form-label">Color <span class="text-danger">*</span></label>
              <input type="text" class="form-control" v-model="coil.color" required />
            </div>
          </div>

          <div class="row g-3 mb-3">
            <div class="col-md-4">
              <label class="form-label">Total Weight (tonnes)</label>
              <input type="number" step="0.01" min="0" class="form-control"
                     v-model.number="coil.total_weight" placeholder="0.00" />
            </div>
            <div class="col-md-4">
              <label class="form-label">Purchase Price (₹)</label>
              <input type="number" step="0.01" min="0" class="form-control"
                     v-model.number="coil.purchase_price" placeholder="0.00" />
            </div>
            <div class="col-md-4">
              <label class="form-label">Length (m)</label>
              <input type="number" step="0.01" min="0" class="form-control"
                     v-model.number="coil.length" placeholder="Coil length in metres" />
            </div>
          </div>

          <div class="row g-3 mb-3">
            <div class="col-md-6">
              <label class="form-label">Purchase Date</label>
              <input type="date" class="form-control" v-model="coil.purchase_date" />
            </div>
            <div class="col-md-6">
              <label class="form-label">Notes</label>
              <input type="text" class="form-control" v-model="coil.notes"
                     placeholder="Any notes about this coil" />
            </div>
          </div>

          <div class="d-flex gap-2 mt-4">
            <button type="submit" class="btn btn-primary flex-grow-1" :disabled="saving">
              <span v-if="saving"><span class="spinner-border spinner-border-sm me-1"></span>Saving…</span>
              <span v-else><i class="bi bi-check-lg me-1"></i>Update Coil</span>
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
      coilId: localStorage.getItem("update_coil_id"),
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
      loading: true,
      saving: false,
    };
  },

  methods: {
    token() { return localStorage.getItem("auth-token"); },

    async fetchCoilDetails() {
      try {
        const res = await fetch(`/api/update/coil/${this.coilId}`, {
          headers: { "Authentication-Token": this.token() },
        });
        if (res.ok) {
          const data = await res.json();
          this.coil = {
            ...data,
            purchase_date: data.purchase_date
              ? String(data.purchase_date).split("T")[0]
              : "",
          };
        } else {
          this.$toast.error("Failed to load coil details.");
          this.$router.push("/coil_info");
        }
      } catch {
        this.$toast.error("Network error. Could not load coil.");
        this.$router.push("/coil_info");
      } finally {
        this.loading = false;
      }
    },

    async updateCoil() {
      if (!this.coil.coil_number || !this.coil.make || !this.coil.type || !this.coil.color) {
        this.$toast.warning("Coil number, make, type, and color are required.");
        return;
      }
      this.saving = true;
      try {
        const res = await fetch(`/api/update/coil/${this.coilId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authentication-Token": this.token(),
          },
          body: JSON.stringify(this.coil),
        });
        if (res.ok) {
          localStorage.removeItem("update_coil_id");
          this.$toast.success("Coil updated successfully!");
          this.$router.push("/coil_info");
        } else {
          const err = await res.json();
          this.$toast.error(err.message || "Failed to update coil.");
        }
      } catch {
        this.$toast.error("Network error. Could not update coil.");
      } finally {
        this.saving = false;
      }
    },
  },

  async mounted() {
    if (!this.coilId) {
      this.$toast.warning("No coil selected for update.");
      this.$router.push("/coil_info");
      return;
    }
    await this.fetchCoilDetails();
  },
};
