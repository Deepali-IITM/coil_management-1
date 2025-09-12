export default {
    template: `
    <div class="container mt-4">
        <h2 class="text-center">Add New Coil</h2>

        <form @submit.prevent="createCoil" class="mt-3">

            <!-- Coil Number -->
            <div class="mb-3">
                <label class="form-label">Coil Number</label>
                <input v-model="coil.coil_number" type="text" class="form-control" placeholder="Enter coil number" required>
            </div>

            <!-- Supplier Name -->
            <div class="mb-3">
                <label class="form-label">Supplier Name</label>
                <input v-model="coil.supplier_name" type="text" class="form-control" placeholder="Enter supplier name">
            </div>

            <!-- Total Weight -->
            <div class="mb-3">
                <label class="form-label">Total Weight (kg)</label>
                <input v-model.number="coil.total_weight" type="number" step="0.01" class="form-control" placeholder="Enter total weight">
            </div>

            <!-- Purchase Price -->
            <div class="mb-3">
                <label class="form-label">Purchase Price</label>
                <input v-model.number="coil.purchase_price" type="number" step="0.01" class="form-control" placeholder="Enter purchase price">
            </div>

            <!-- Make -->
            <div class="mb-3">
                <label class="form-label">Make</label>
                <input v-model="coil.make" type="text" class="form-control" placeholder="Enter make">
            </div>

            <!-- Type -->
            <div class="mb-3">
                <label class="form-label">Type</label>
                <input v-model="coil.type" type="text" class="form-control" placeholder="Enter type">
            </div>

            <!-- Color -->
            <div class="mb-3">
                <label class="form-label">Color</label>
                <input v-model="coil.color" type="text" class="form-control" placeholder="Enter color">
            </div>

            <!-- length-->
            <div class="mb-3">
                <label class="form-label">length</label>
                <input v-model="coil.length" type="number" class="form-control" placeholder="Enter length of the coil (theoretical)">
            </div>     

            <!-- Purchase Date -->
            <div class="mb-3">
                <label class="form-label">Purchase Date</label>
                <input v-model="coil.purchase_date" type="date" class="form-control">
            </div>

            <!-- Submit -->
            <button type="submit" class="btn btn-success w-100">Save Coil</button>
        </form>
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
                length: "",
                purchase_date: ""
            },
            token: localStorage.getItem("auth-token")
        };
    },
    methods: {
        async createCoil() {
            try {
                // Format date to YYYY-MM-DD if provided
                const payload = { ...this.coil };
                if (payload.purchase_date) {
                    payload.purchase_date = new Date(payload.purchase_date).toISOString();
                }

                const res = await fetch("/api/coils", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authentication-Token": this.token
                    },
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    alert("Coil added successfully!");
                    this.$router.push("/");
                } else {
                    const errorText = await res.text();
                    alert("Failed to add coil: " + errorText);
                }
            } catch (error) {
                console.error("Error creating coil:", error);
                alert("Error creating coil. Check console for details.");
            }
        }
    }
};
