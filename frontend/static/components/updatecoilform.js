export default {
    template: `
    <div class="container">
        <h2 class="text-center text-primary">Update Coil</h2>
        <form @submit.prevent="updateCoil">
            <div class="mb-3">
                <label for="coil-number" class="form-label">Coil Number:</label>
                <input type="text" class="form-control" id="coil-number" v-model="coil.coil_number" required>
            </div>
            <div class="mb-3">
                <label for="supplier-name" class="form-label">Supplier Name:</label>
                <input type="text" class="form-control" id="supplier-name" v-model="coil.supplier_name">
            </div>
            <div class="mb-3">
                <label for="total-weight" class="form-label">Total Weight (kg):</label>
                <input type="number" step="0.01" class="form-control" id="total-weight" v-model="coil.total_weight">
            </div>
            <div class="mb-3">
                <label for="purchase-price" class="form-label">Purchase Price (₹):</label>
                <input type="number" step="0.01" class="form-control" id="purchase-price" v-model="coil.purchase_price">
            </div>
            <div class="mb-3">
                <label for="make" class="form-label">Make:</label>
                <input type="text" class="form-control" id="make" v-model="coil.make">
            </div>
            <div class="mb-3">
                <label for="type" class="form-label">Type:</label>
                <input type="text" class="form-control" id="type" v-model="coil.type">
            </div>
            <div class="mb-3">
                <label for="color" class="form-label">Color:</label>
                <input type="text" class="form-control" id="color" v-model="coil.color">
            </div>
            <div class="mb-3">
                <label for="purchase-date" class="form-label">Purchase Date:</label>
                <input type="date" class="form-control" id="purchase-date" v-model="coil.purchase_date">
            </div>

            <button type="submit" class="btn btn-primary">Update Coil</button>
        </form>
    </div>
    `,
    data() {
        return {
            coilId: localStorage.getItem("update_coil_id"), // Coil ID to update
            coil: {
                coil_number: "",
                supplier_name: "",
                total_weight: "",
                purchase_price: "",
                make: "",
                type: "",
                color: "",
                purchase_date: ""
            },
            token: localStorage.getItem("auth-token")
        };
    },
    methods: {
        // Fetch existing coil details
        async fetchCoilDetails() {
            try {
                const res = await fetch(`api/update/coil/${this.coilId}`, {
                    headers: {
                        "Authentication-Token": this.token
                    }
                });
                if (res.ok) {
                    const data = await res.json();
                    this.coil = {
                        ...data,
                        purchase_date: data.purchase_date ? data.purchase_date.split("T")[0] : "" // format date for input
                    };
                } else {
                    console.error("Failed to fetch coil details");
                }
            } catch (error) {
                console.error("Error fetching coil details:", error);
            }
        },

        // Update coil
        async updateCoil() {
            try {
                const res = await fetch(`/api/update/coil/${this.coilId}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authentication-Token": this.token
                    },
                    body: JSON.stringify(this.coil)
                });

                if (res.ok) {
                    alert("Coil updated successfully!");
                    this.$router.push("/");
                } else {
                    console.error("Failed to update coil");
                }
            } catch (error) {
                console.error("Error updating coil:", error);
            }
        }
    },
    async mounted() {
        await this.fetchCoilDetails(); // Load data when page opens
    }
};
