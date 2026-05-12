export default {
  name: "Products",
  template: `
  <div class="page-wrapper">
    <div class="page-header">
      <div>
        <h1 class="page-title">Products</h1>
        <p class="page-sub">{{ products.length }} product{{ products.length !== 1 ? 's' : '' }} defined</p>
      </div>
      <button class="btn btn-primary" @click="$router.push('/create-product')">
        <i class="bi bi-plus-lg me-1"></i>Add Product
      </button>
    </div>

    <div v-if="loading" class="d-flex justify-content-center py-5">
      <div class="spinner-border text-primary"></div>
    </div>

    <div v-else class="card">
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead class="table-head-accent">
            <tr>
              <th>Make</th>
              <th>Type</th>
              <th>Color</th>
              <th class="text-end">Rate (₹/ft)</th>
              <th class="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!products.length">
              <td colspan="5" class="text-center text-muted py-5">
                <i class="bi bi-box-seam display-4 d-block mb-2"></i>
                No products yet. Add your first product to get started.
              </td>
            </tr>
            <tr v-for="p in products" :key="p.id">
              <td class="fw-semibold">{{ p.make }}</td>
              <td>{{ p.type }}</td>
              <td>{{ p.color }}</td>
              <td class="text-end fw-semibold text-success">₹ {{ p.rate }}</td>
              <td class="text-center">
                <div class="d-flex gap-1 justify-content-center">
                  <button class="btn btn-sm btn-outline-secondary" @click="editProduct(p.id)" title="Edit">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger" @click="deleteProduct(p.id)" title="Delete">
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
      products: [],
      loading: true,
    };
  },

  methods: {
    token() { return localStorage.getItem("auth-token"); },

    async fetchProducts() {
      this.loading = true;
      try {
        const res = await fetch("/api/products", {
          headers: { "Authentication-Token": this.token() },
        });
        if (res.ok) {
          this.products = await res.json();
        } else {
          this.$toast.error("Failed to load products.");
        }
      } catch {
        this.$toast.error("Network error loading products.");
      } finally {
        this.loading = false;
      }
    },

    editProduct(productId) {
      localStorage.setItem("update_product_id", productId);
      this.$router.push("/update-product");
    },

    async deleteProduct(productId) {
      if (!confirm("Delete this product? This cannot be undone.")) return;
      try {
        const res = await fetch(`/delete/product/${productId}`, {
          method: "DELETE",
          headers: { "Authentication-Token": this.token() },
        });
        if (res.ok) {
          await this.fetchProducts();
          this.$toast.success("Product deleted.");
        } else {
          this.$toast.error("Cannot delete — this product is linked to existing sale orders.");
        }
      } catch {
        this.$toast.error("Network error. Could not delete product.");
      }
    },
  },

  mounted() { this.fetchProducts(); },
};
