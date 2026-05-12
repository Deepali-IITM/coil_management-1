export default {
  name: "ProductForm",
  template: `
  <div class="page-wrapper" style="max-width:620px;">
    <div class="page-header">
      <div>
        <h1 class="page-title">Add New Product</h1>
        <p class="page-sub">Select a coil and set the rate to define a new product.</p>
      </div>
      <button class="btn btn-outline-secondary" @click="$router.push('/productions')">
        <i class="bi bi-arrow-left me-1"></i>Back
      </button>
    </div>

    <div class="card">
      <div class="card-body p-4">
        <form @submit.prevent="createProduct">

          <div class="mb-3">
            <label class="form-label">Select Coil <span class="text-danger">*</span></label>
            <div v-if="loadingCoils" class="d-flex align-items-center gap-2 text-muted">
              <div class="spinner-border spinner-border-sm"></div>
              <span>Loading coils…</span>
            </div>
            <select v-else class="form-select" v-model.number="selectedCoilId"
                    @change="setCoilDetails" required>
              <option disabled value="">— Select a Coil —</option>
              <option v-for="coil in coils" :key="coil.id" :value="coil.id">
                {{ coil.coil_number }} ({{ coil.make }} · {{ coil.type }} · {{ coil.color }})
              </option>
            </select>
          </div>

          <div class="row g-3 mb-3">
            <div class="col-md-4">
              <label class="form-label">Make</label>
              <input type="text" class="form-control bg-light" v-model="product.make" readonly />
            </div>
            <div class="col-md-4">
              <label class="form-label">Type</label>
              <input type="text" class="form-control bg-light" v-model="product.type" readonly />
            </div>
            <div class="col-md-4">
              <label class="form-label">Color</label>
              <input type="text" class="form-control bg-light" v-model="product.color" readonly />
            </div>
          </div>

          <div class="mb-4">
            <label class="form-label">Rate (₹ per ft) <span class="text-danger">*</span></label>
            <input type="number" class="form-control" v-model.number="product.rate"
                   step="0.01" min="0" placeholder="e.g. 50.00" required />
          </div>

          <div class="d-flex gap-2">
            <button type="submit" class="btn btn-primary flex-grow-1" :disabled="saving || loadingCoils">
              <span v-if="saving"><span class="spinner-border spinner-border-sm me-1"></span>Creating…</span>
              <span v-else><i class="bi bi-check-lg me-1"></i>Create Product</span>
            </button>
            <button type="button" class="btn btn-outline-secondary"
                    @click="$router.push('/productions')">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  </div>
  `,

  data() {
    return {
      coils: [],
      selectedCoilId: "",
      product: { make: "", type: "", color: "", rate: null, coil_id: null },
      saving: false,
      loadingCoils: true,
    };
  },

  mounted() { this.fetchCoils(); },

  methods: {
    token() { return localStorage.getItem("auth-token"); },

    async fetchCoils() {
      this.loadingCoils = true;
      try {
        const res = await fetch("/api/coils", {
          headers: { "Authentication-Token": this.token() },
        });
        if (res.ok) {
          this.coils = await res.json();
        } else {
          this.$toast.error("Could not load coils. Please try again.");
        }
      } catch {
        this.$toast.error("Network error loading coils.");
      } finally {
        this.loadingCoils = false;
      }
    },

    setCoilDetails() {
      const c = this.coils.find(c => c.id === this.selectedCoilId);
      if (c) {
        this.product.make = c.make;
        this.product.type = c.type;
        this.product.color = c.color;
        this.product.coil_id = c.id;
      }
    },

    async createProduct() {
      if (!this.product.coil_id) {
        this.$toast.warning("Please select a coil before creating the product.");
        return;
      }
      if (!this.product.rate || this.product.rate <= 0) {
        this.$toast.warning("Please enter a valid rate.");
        return;
      }
      this.saving = true;
      try {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authentication-Token": this.token(),
          },
          body: JSON.stringify(this.product),
        });
        const data = await res.json();
        if (res.ok) {
          this.$toast.success("Product created successfully!");
          this.$router.push("/productions");
        } else {
          this.$toast.error(data.message || "Failed to create product.");
        }
      } catch {
        this.$toast.error("Network error. Could not create product.");
      } finally {
        this.saving = false;
      }
    },
  },
};
