export default {
    template: `
    <div>
        <h2 class="text-center">See All Available Coils</h2>

        <!-- Add Coil Button -->
        <div class="text-center mb-3">
            <button class="btn btn-outline-success" @click="goToCreateCoil">+ Add New Coil</button>
        </div>

        <!-- Coil List -->
        <div class="table-responsive" v-if="coils.length">
            <table class="table table-striped table-hover text-center">
                <thead class="table-dark">
                    <tr>
                        <th>ID</th>
                        <th>Coil Number</th>
                        <th>Supplier Name</th>
                        <th>Total Weight (kg)</th>
                        <th>Purchase Price</th>
                        <th>Make</th>
                        <th>Type</th>
                        <th>Color</th>
                        <th>length (meter)</th>
                        <th>Purchase Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="coil in coils" :key="coil.id">
                        <td>{{ coil.id }}</td>
                        <td>{{ coil.coil_number }}</td>
                        <td>{{ coil.supplier_name }}</td>
                        <td>{{ coil.total_weight }}</td>
                        <td>{{ coil.purchase_price }}</td>
                        <td>{{ coil.make }}</td>
                        <td>{{ coil.type }}</td>
                        <td>{{ coil.color }}</td>
                        <td> {{coil.length}}</td>
                        <td>{{ formatDate(coil.purchase_date) }}</td>
                        <td>
                            <button @click="updateCoil(coil.id)">
  <img src="/static/components/images/edit.png" alt="Edit" class="icon-btn" />
</button>

<button @click="deleteCoil(coil.id)">
  <img src="/static/components/images/delete.png" alt="Delete" class="icon-btn" />
</button>


                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div v-else class="text-center text-danger">
            No coils available.
        </div>
    </div>
    `,
    data() {
        return {
            coils: [],
            token: localStorage.getItem("auth-token")
        };
    },
    methods: {
        async fetchCoils() {
            try {
                const res = await fetch("/api/coils", {
                    headers: { "Authentication-Token": this.token }
                });
                if (res.ok) {
                    this.coils = await res.json();
                } else {
                    console.error("Failed to fetch coils");
                }
            } catch (error) {
                console.error("Error fetching coils:", error);
            }
        },
        formatDate(dateStr) {
            const date = new Date(dateStr);
            return date.toLocaleDateString();
        },
        goToCreateCoil() {
            this.$router.push("/create-coil");
        },
        updateCoil(coilId) {
            localStorage.setItem("update_coil_id", coilId);
            this.$router.push("/update-coil");
        },
        async deleteCoil(coilId) {
            if (!confirm("Are you sure you want to delete this coil?")) return;
            try {
                const res = await fetch(`/delete/coil/${coilId}`, {
                    method: "DELETE",
                    headers: { "Authentication-Token": this.token }
                });
                if (res.ok) {
                    alert("Coil deleted successfully!");
                    this.fetchCoils();
                } else {
                    alert("Error: Could not delete coil.");
                }
            } catch (error) {
                console.error("Error deleting coil:", error);
            }
        }
    },
    async mounted() {
        this.fetchCoils();
    }
};
