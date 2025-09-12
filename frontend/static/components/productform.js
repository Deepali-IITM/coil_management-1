export default {
    template: `
    <div class="container">
        <h2 class="text-center text-primary">add new production</h2>
        <form @submit.prevent="createProduct">
            
            <!-- Select Coil -->
            <div class="mb-3">
                <label for="coil" class="form-label">Select Coil Number:</label>
                <select class="form-control" id="coil" v-model.number="selectedCoilId" @change="setCoilDetails">
                    <option disabled value="">-- Select a Coil --</option>
                    <option v-for="coil in coils" :key="coil.id" :value="coil.id">
                        {{ coil.coil_number }} ({{ coil.make }} - {{ coil.type }} - {{ coil.color }})
                    </option>
                </select>
            </div>

            <!-- Make -->
            <div class="mb-3">
                <label for="product-make" class="form-label">Make:</label>
                <input type="text" class="form-control" id="product-make" v-model="product.make" readonly>
            </div>

            <!-- Type -->
            <div class="mb-3">
                <label for="product-type" class="form-label">Type:</label>
                <input type="text" class="form-control" id="product-type" v-model="product.type" readonly>
            </div>

            <!-- Color -->
            <div class="mb-3">
                <label for="product-color" class="form-label">Color:</label>
                <input type="text" class="form-control" id="product-color" v-model="product.color" readonly>
            </div>

            <!-- Rate -->
            <div class="mb-3">
                <label for="product-rate" class="form-label">Rate (₹):</label>
                <input type="number" class="form-control" id="product-rate" v-model="product.rate" required>
            </div>

            <button type="submit" class="btn btn-primary">Create Product</button>
        </form>
    </div>
    `,
    data() {
        return {
            coils: [],
            selectedCoilId: "",
            product: { make: "", type: "", color: "", rate: "", coil_id: "" },
            token: localStorage.getItem("auth-token")
        };
    },
    async mounted() {
        await this.fetchCoils();
    },
    methods: {
        async fetchCoils() {
            try {
                const res = await fetch("/api/coils", {
                    headers: {
                        "Content-Type": "application/json",
                        "Authentication-Token": this.token
                    }
                });
                if (res.ok) {
                    this.coils = await res.json();
                } else {
                    alert("Error fetching coils!");
                }
            } catch (error) {
                console.error("Error fetching coils:", error);
            }
        },
        setCoilDetails() {
            const selectedCoil = this.coils.find(c => c.id === this.selectedCoilId);
            if (selectedCoil) {
                this.product.make = selectedCoil.make;
                this.product.type = selectedCoil.type;
                this.product.color = selectedCoil.color;
                this.product.coil_id = selectedCoil.id; // ✅ Always set coil_id
            }
        },
        async createProduct() {
            if (!this.product.coil_id) {
                alert("Please select a coil before creating the product.");
                return;
            }
            try {
                const res = await fetch("/api/products", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authentication-Token": this.token
                    },
                    body: JSON.stringify(this.product)
                });
                if (res.ok) {
                    alert("Product created successfully!");
                    this.$router.push("/");
                } else {
                    const err = await res.json();
                    alert(err.message || "This product already exists or an error occurred!");
                }
            } catch (error) {
                console.error("Error creating product:", error);
            }
        }
    }
};
