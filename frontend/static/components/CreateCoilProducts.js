export default {
  name: "CreateCoilProducts",
  template: `
  <div class="page-wrapper" style="max-width: 800px;">

    <!-- Page header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Coil Setup Wizard</h1>
        <p class="page-sub">Create a coil and define its products in one guided flow.</p>
      </div>
      <button class="btn btn-outline-secondary" @click="$router.push('/coil_info')">
        <i class="bi bi-arrow-left me-1"></i>Back
      </button>
    </div>

    <!-- ── Step Progress Bar ── -->
    <div class="wizard-stepper mb-4">
      <div class="wizard-step" :class="stepClass(1)">
        <div class="wizard-step__num">
          <i v-if="step > 1" class="bi bi-check-lg"></i>
          <span v-else>1</span>
        </div>
        <div class="wizard-step__text">
          <div class="wizard-step__label">Create Coil</div>
          <div class="wizard-step__sub">Coil details</div>
        </div>
      </div>

      <div class="wizard-connector" :class="{ 'wizard-connector--done': step > 1 }"></div>

      <div class="wizard-step" :class="stepClass(2)">
        <div class="wizard-step__num">
          <i v-if="step > 2" class="bi bi-check-lg"></i>
          <span v-else>2</span>
        </div>
        <div class="wizard-step__text">
          <div class="wizard-step__label">Add Products</div>
          <div class="wizard-step__sub">Rates &amp; variants</div>
        </div>
      </div>

      <div class="wizard-connector" :class="{ 'wizard-connector--done': step > 2 }"></div>

      <div class="wizard-step" :class="stepClass(3)">
        <div class="wizard-step__num">
          <i v-if="step >= 3" class="bi bi-check-lg"></i>
          <span v-else>3</span>
        </div>
        <div class="wizard-step__text">
          <div class="wizard-step__label">Done</div>
          <div class="wizard-step__sub">All set!</div>
        </div>
      </div>
    </div>

    <!-- ════════════ STEP 1 — Create Coil ════════════ -->
    <template v-if="step === 1">
      <div class="card">
        <div class="card-header">
          <h5 class="mb-0">
            <i class="bi bi-layers-half me-2 text-primary"></i>Coil Details
          </h5>
        </div>
        <div class="card-body p-4">
          <form @submit.prevent="saveCoil" novalidate>

            <div class="row g-3 mb-3">
              <div class="col-md-6">
                <label class="form-label">Coil Number <span class="text-danger">*</span></label>
                <input v-model="coil.coil_number" type="text" class="form-control"
                       :class="coilErrors.coil_number ? 'is-invalid' : ''"
                       placeholder="e.g. C001" />
                <div class="invalid-feedback">{{ coilErrors.coil_number }}</div>
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
                       :class="coilErrors.make ? 'is-invalid' : ''"
                       placeholder="e.g. JSW" />
                <div class="invalid-feedback">{{ coilErrors.make }}</div>
              </div>
              <div class="col-md-4">
                <label class="form-label">Type <span class="text-danger">*</span></label>
                <input v-model="coil.type" type="text" class="form-control"
                       :class="coilErrors.type ? 'is-invalid' : ''"
                       placeholder="e.g. Coloron" />
                <div class="invalid-feedback">{{ coilErrors.type }}</div>
              </div>
              <div class="col-md-4">
                <label class="form-label">Color <span class="text-danger">*</span></label>
                <input v-model="coil.color" type="text" class="form-control"
                       :class="coilErrors.color ? 'is-invalid' : ''"
                       placeholder="e.g. Silver" />
                <div class="invalid-feedback">{{ coilErrors.color }}</div>
              </div>
            </div>

            <div class="row g-3 mb-3">
              <div class="col-md-4">
                <label class="form-label">Total Weight (tonnes)</label>
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
                       class="form-control" placeholder="0.00" />
              </div>
            </div>

            <div class="row g-3 mb-4">
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

            <div class="d-flex gap-2">
              <button type="submit" class="btn btn-primary flex-grow-1" :disabled="savingCoil">
                <span v-if="savingCoil">
                  <span class="spinner-border spinner-border-sm me-1"></span>Saving Coil…
                </span>
                <span v-else>
                  <i class="bi bi-arrow-right-circle me-1"></i>Save Coil &amp; Continue to Products
                </span>
              </button>
              <button type="button" class="btn btn-outline-secondary"
                      @click="$router.push('/coil_info')">Cancel</button>
            </div>

          </form>
        </div>
      </div>
    </template>

    <!-- ════════════ STEP 2 — Add Products ════════════ -->
    <template v-if="step === 2">

      <!-- Coil created banner -->
      <div class="wizard-coil-banner mb-3">
        <div class="wizard-coil-banner__icon">
          <i class="bi bi-layers-half"></i>
        </div>
        <div class="wizard-coil-banner__body">
          <div class="wizard-coil-banner__title">
            Coil <strong>{{ createdCoil.coil_number }}</strong> created
          </div>
          <div class="wizard-coil-banner__meta">
            <span>{{ createdCoil.make }}</span>
            <span class="wizard-coil-banner__dot">·</span>
            <span>{{ createdCoil.type }}</span>
            <span class="wizard-coil-banner__dot">·</span>
            <span>{{ createdCoil.color }}</span>
            <span v-if="createdCoil.length" class="wizard-coil-banner__dot">·</span>
            <span v-if="createdCoil.length">{{ createdCoil.length }} m</span>
          </div>
        </div>
        <i class="bi bi-check-circle-fill wizard-coil-banner__check"></i>
      </div>

      <!-- Info alert -->
      <div class="alert alert-info d-flex gap-2 align-items-start mb-4">
        <i class="bi bi-lightbulb-fill flex-shrink-0 mt-1"></i>
        <div style="font-size:13.5px;">
          <strong>Now add products from this coil.</strong>
          Each product row is a pricing variant — the coil's make, type and color are auto-filled.
          Enter a rate (₹/ft) for each product. Click <strong>+ Add Product</strong> to add more rows.
          <br /><em class="text-muted">You can skip this step and add products later from the Products page.</em>
        </div>
      </div>

      <!-- Products card -->
      <div class="card mb-3">
        <div class="card-header d-flex align-items-center justify-content-between">
          <h5 class="mb-0">
            <i class="bi bi-box-seam me-2 text-primary"></i>Products
            <span class="badge bg-primary ms-2">{{ products.length }}</span>
          </h5>
          <button class="btn btn-sm btn-outline-primary" @click="addProduct" :disabled="savingProducts">
            <i class="bi bi-plus-lg me-1"></i>Add Product
          </button>
        </div>
        <div class="card-body p-3">

          <!-- Empty state -->
          <div v-if="products.length === 0" class="text-center text-muted py-5">
            <i class="bi bi-box-seam display-4 d-block mb-2 opacity-25"></i>
            <p class="mb-0">No products yet.</p>
            <p class="small">Click <strong>+ Add Product</strong> above to begin.</p>
          </div>

          <!-- Product rows -->
          <div v-for="(p, idx) in products" :key="idx"
               class="wizard-product-row"
               :class="{
                 'wizard-product-row--saved': p.saved,
                 'wizard-product-row--error': !!p.error,
               }">

            <!-- Row header -->
            <div class="wizard-product-row__header">
              <div class="wizard-product-row__num" :class="p.saved ? 'wizard-product-row__num--done' : ''">
                <i v-if="p.saved" class="bi bi-check-lg"></i>
                <span v-else>{{ idx + 1 }}</span>
              </div>
              <div class="wizard-product-row__chips">
                <span class="badge bg-light text-dark border">{{ createdCoil.make }}</span>
                <span class="badge bg-light text-dark border">{{ createdCoil.type }}</span>
                <span class="badge bg-light text-dark border">{{ createdCoil.color }}</span>
                <span v-if="p.saved" class="badge bg-success ms-1">Saved</span>
              </div>
              <button v-if="!p.saved && !savingProducts"
                      class="btn btn-sm btn-outline-danger ms-auto"
                      @click="removeProduct(idx)" title="Remove">
                <i class="bi bi-x-lg"></i>
              </button>
            </div>

            <!-- Rate input -->
            <div class="wizard-product-row__body">
              <div class="row g-2 align-items-start">
                <div class="col-sm-4">
                  <label class="form-label mb-1" style="font-size:13px;">
                    Rate (₹/ft) <span class="text-danger">*</span>
                  </label>
                  <input type="number" step="0.01" min="0.01"
                         class="form-control form-control-sm"
                         :class="p.rateError ? 'is-invalid' : ''"
                         v-model.number="p.rate"
                         :disabled="p.saved || savingProducts"
                         placeholder="e.g. 50.00" />
                  <div class="invalid-feedback">{{ p.rateError }}</div>
                </div>
                <div class="col-sm-8 d-flex align-items-center" style="padding-top: 26px;">
                  <span class="text-muted" style="font-size:12.5px;">
                    <i class="bi bi-tag me-1"></i>
                    <strong>{{ createdCoil.make }} {{ createdCoil.type }}</strong>
                    ({{ createdCoil.color }})
                    @ <strong>₹{{ p.rate || '?' }}/ft</strong>
                  </span>
                </div>
              </div>
              <div v-if="p.error" class="d-flex align-items-center gap-1 mt-2 text-danger"
                   style="font-size:12.5px;">
                <i class="bi bi-exclamation-circle-fill"></i>{{ p.error }}
              </div>
            </div>

          </div>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="d-flex gap-2 flex-wrap">
        <button class="btn btn-primary flex-grow-1"
                :disabled="savingProducts || products.length === 0 || allProductsSaved"
                @click="saveAllProducts">
          <span v-if="savingProducts">
            <span class="spinner-border spinner-border-sm me-1"></span>Saving Products…
          </span>
          <span v-else-if="allProductsSaved">
            <i class="bi bi-check-circle-fill me-1"></i>All Products Saved — Finishing Up…
          </span>
          <span v-else>
            <i class="bi bi-floppy me-1"></i>Save {{ products.length }} Product{{ products.length !== 1 ? 's' : '' }}
          </span>
        </button>
        <button class="btn btn-outline-secondary" @click="skipProducts" :disabled="savingProducts">
          <i class="bi bi-skip-forward me-1"></i>Skip — Add Later
        </button>
      </div>

    </template>

    <!-- ════════════ STEP 3 — Success ════════════ -->
    <template v-if="step === 3">
      <div class="wizard-success">
        <div class="wizard-success__icon">
          <i class="bi bi-check-circle-fill"></i>
        </div>
        <h2 class="wizard-success__title">Setup Complete!</h2>
        <p class="wizard-success__sub" v-if="savedProductCount > 0">
          Coil <strong>{{ createdCoil.coil_number }}</strong> has been created with
          <strong>{{ savedProductCount }}</strong> product{{ savedProductCount !== 1 ? 's' : '' }}.
        </p>
        <p class="wizard-success__sub" v-else>
          Coil <strong>{{ createdCoil.coil_number }}</strong> has been created.
          You can add products any time from the Products page.
        </p>

        <!-- Summary -->
        <div class="wizard-success__summary">
          <div class="wizard-success__row">
            <span class="wizard-success__lbl">Coil Number</span>
            <span class="wizard-success__val fw-semibold">{{ createdCoil.coil_number }}</span>
          </div>
          <div class="wizard-success__row">
            <span class="wizard-success__lbl">Material</span>
            <span class="wizard-success__val">
              {{ createdCoil.make }} · {{ createdCoil.type }} · {{ createdCoil.color }}
            </span>
          </div>
          <div class="wizard-success__row" v-if="createdCoil.length">
            <span class="wizard-success__lbl">Length</span>
            <span class="wizard-success__val">{{ createdCoil.length }} m</span>
          </div>
          <div class="wizard-success__row">
            <span class="wizard-success__lbl">Products Added</span>
            <span class="wizard-success__val">
              <span v-if="savedProductCount > 0" class="text-success fw-semibold">
                {{ savedProductCount }} product{{ savedProductCount !== 1 ? 's' : '' }}
              </span>
              <span v-else class="text-muted">None — add later</span>
            </span>
          </div>
        </div>

        <!-- Product rate tags -->
        <div v-if="savedProductCount > 0" class="d-flex flex-wrap gap-2 justify-content-center mb-4">
          <span v-for="(p, i) in products.filter(x => x.saved)" :key="i"
                class="badge bg-accent-soft text-accent border border-accent-soft px-3 py-2"
                style="font-size:13px; border-radius:999px;">
            <i class="bi bi-box-seam me-1"></i>₹{{ p.rate }}/ft
          </span>
        </div>

        <!-- Action buttons -->
        <div class="d-flex gap-3 flex-wrap justify-content-center">
          <button class="btn btn-outline-secondary" @click="$router.push('/coil_info')">
            <i class="bi bi-layers me-1"></i>Coil Inventory
          </button>
          <button class="btn btn-outline-secondary" @click="$router.push('/productions')">
            <i class="bi bi-box-seam me-1"></i>Products
          </button>
          <button class="btn btn-primary" @click="startOver">
            <i class="bi bi-plus-lg me-1"></i>Add Another Coil
          </button>
        </div>
      </div>
    </template>

  </div>
  `,

  data() {
    return {
      step: 1,

      /* Step 1 */
      coil: {
        coil_number: "", supplier_name: "", make: "", type: "", color: "",
        total_weight: null, purchase_price: null, length: null,
        purchase_date: "", notes: "",
      },
      coilErrors: {},
      savingCoil: false,

      /* Carries over from step 1 → 2 → 3 */
      createdCoil: null,   /* { id, coil_number, make, type, color, length } */

      /* Step 2 */
      products: [],
      savingProducts: false,
    };
  },

  computed: {
    allProductsSaved() {
      return this.products.length > 0 && this.products.every(p => p.saved);
    },
    savedProductCount() {
      return this.products.filter(p => p.saved).length;
    },
  },

  methods: {
    token() { return localStorage.getItem("auth-token"); },

    stepClass(n) {
      if (this.step > n)   return "wizard-step--done";
      if (this.step === n) return "wizard-step--active";
      return "wizard-step--locked";
    },

    /* ── Step 1 ── */
    async saveCoil() {
      this.coilErrors = {};
      let invalid = false;
      if (!this.coil.coil_number.trim()) { this.coilErrors.coil_number = "Coil number is required."; invalid = true; }
      if (!this.coil.make.trim())        { this.coilErrors.make  = "Make is required."; invalid = true; }
      if (!this.coil.type.trim())        { this.coilErrors.type  = "Type is required."; invalid = true; }
      if (!this.coil.color.trim())       { this.coilErrors.color = "Color is required."; invalid = true; }
      if (invalid) return;

      this.savingCoil = true;
      try {
        const payload = { ...this.coil };
        if (payload.purchase_date) {
          payload.purchase_date = new Date(payload.purchase_date).toISOString().split("T")[0];
        }
        const res  = await fetch("/api/coils", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authentication-Token": this.token() },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.ok) {
          this.createdCoil = {
            id: data.id,
            coil_number: this.coil.coil_number,
            make:   this.coil.make,
            type:   this.coil.type,
            color:  this.coil.color,
            length: this.coil.length,
          };
          this.$toast.success("Coil created! Now add products.");
          this.products = [this._newRow()];
          this.step = 2;
        } else {
          if (data.message && data.message.toLowerCase().includes("already exists")) {
            this.coilErrors.coil_number = data.message;
          } else {
            this.$toast.error(data.message || "Failed to save coil.");
          }
        }
      } catch {
        this.$toast.error("Network error. Could not save coil.");
      } finally {
        this.savingCoil = false;
      }
    },

    /* ── Step 2 helpers ── */
    _newRow() {
      return { rate: null, saving: false, saved: false, error: null, rateError: null };
    },

    addProduct() {
      this.products.push(this._newRow());
    },

    removeProduct(idx) {
      this.products.splice(idx, 1);
    },

    async saveAllProducts() {
      /* Validate all unsaved rows */
      let invalid = false;
      this.products.forEach(p => {
        p.rateError = null;
        p.error     = null;
        if (p.saved) return;
        if (!p.rate || p.rate <= 0) {
          p.rateError = "Enter a rate greater than 0.";
          invalid = true;
        }
      });
      if (invalid) return;

      this.savingProducts = true;
      const unsaved = this.products.filter(p => !p.saved);

      for (const p of unsaved) {
        p.saving = true;
        try {
          const res = await fetch("/api/products", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authentication-Token": this.token() },
            body: JSON.stringify({
              make:    this.createdCoil.make,
              type:    this.createdCoil.type,
              color:   this.createdCoil.color,
              rate:    p.rate,
              coil_id: this.createdCoil.id,
            }),
          });
          const data = await res.json();
          if (res.ok) {
            p.saved = true;
          } else {
            p.error = data.message || "Failed to create product.";
          }
        } catch {
          p.error = "Network error.";
        } finally {
          p.saving = false;
        }
      }

      this.savingProducts = false;

      if (this.products.every(p => p.saved)) {
        this.$toast.success(
          `${this.savedProductCount} product${this.savedProductCount !== 1 ? "s" : ""} created!`
        );
        setTimeout(() => { this.step = 3; }, 500);
      } else {
        this.$toast.warning("Some products could not be saved — check the errors below.");
      }
    },

    skipProducts() {
      this.step = 3;
    },

    /* ── Step 3 ── */
    startOver() {
      this.coil = {
        coil_number: "", supplier_name: "", make: "", type: "", color: "",
        total_weight: null, purchase_price: null, length: null,
        purchase_date: "", notes: "",
      };
      this.coilErrors    = {};
      this.createdCoil   = null;
      this.products      = [];
      this.step          = 1;
    },
  },
};
