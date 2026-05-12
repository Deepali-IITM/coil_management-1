export default {
  name: "UpdateProductForm",
  template: `
  <div class="page-wrapper" style="max-width:560px;">
    <div class="page-header">
      <div>
        <h1 class="page-title">Edit Product</h1>
        <p class="page-sub">Update the product details below.</p>
      </div>
      <button class="btn btn-outline-secondary" @click="$router.push('/productions')">
        <i class="bi bi-arrow-left me-1"></i>Back
      </button>
    </div>

    <div v-if="loading" class="d-flex justify-content-center py-5">
      <div class="spinner-border text-primary"></div>
    </div>

    <div v-else class="card">
      <div class="card-body p-4">
        <form @submit.prevent="updateProduct">

          <div class="mb-3">
            <label class="form-label">Make <span class="text-danger">*</span></label>
            <input type="text" v-model="product.make" class="form-control" required />
          </div>
          <div class="mb-3">
            <label class="form-label">Type <span class="text-danger">*</span></label>
            <input type="text" v-model="product.type" class="form-control" required />
          </div>
          <div class="mb-3">
            <label class="form-label">Color <span class="text-danger">*</span></label>
            <input type="text" v-model="product.color" class="form-control" required />
          </div>
          <div class="mb-4">
            <label class="form-label">Rate (₹ per ft) <span class="text-danger">*</span></label>
            <input type="number" v-model.number="product.rate" class="form-control"
                   step="0.01" min="0" required />
          </div>

          <div class="d-flex gap-2">
            <button type="submit" class="btn btn-primary flex-grow-1" :disabled="saving">
              <span v-if="saving"><span class="spinner-border spinner-border-sm me-1"></span>Saving…</span>
              <span v-else><i class="bi bi-check-lg me-1"></i>Update Product</span>
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
      product: { make: "", type: "", color: "", rate: "" },
      productId: localStorage.getItem("update_product_id"),
      loading: true,
      saving: false,
    };
  },

  methods: {
    token() { return localStorage.getItem("auth-token"); },

    async fetchProductDetails() {
      try {
        const res = await fetch(`/api/update/product/${this.productId}`, {
          headers: { "Authentication-Token": this.token() },
        });
        if (res.ok) {
          this.product = await res.json();
        } else {
          this.$toast.error("Product not found.");
          this.$router.push("/productions");
        }
      } catch {
        this.$toast.error("Network error. Could not load product.");
        this.$router.push("/productions");
      } finally {
        this.loading = false;
      }
    },

    async updateProduct() {
      this.saving = true;
      try {
        const res = await fetch(`/api/update/product/${this.productId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authentication-Token": this.token(),
          },
          body: JSON.stringify(this.product),
        });
        if (res.ok) {
          localStorage.removeItem("update_product_id");
          this.$toast.success("Product updated successfully!");
          this.$router.push("/productions");
        } else {
          this.$toast.error("Error updating product.");
        }
      } catch {
        this.$toast.error("Network error. Could not update product.");
      } finally {
        this.saving = false;
      }
    },
  },

  mounted() {
    if (!this.productId) {
      this.$toast.warning("No product selected for update.");
      this.$router.push("/productions");
      return;
    }
    this.fetchProductDetails();
  },
};
