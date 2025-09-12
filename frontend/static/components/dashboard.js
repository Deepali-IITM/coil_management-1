export default {
  template: `
    <div class="container my-4">
      <h2 class="text-center">📊 Dashboard</h2>

      <!-- Summary Cards -->
      <div class="row text-center">
        <div class="col-md-3 mb-3" v-for="card in cards" :key="card.title">
          <div class="card shadow-sm" :class="card.border">
            <div class="card-body">
              <h5>{{ card.title }}</h5>
              <h2 :class="card.color">{{ card.value }}</h2>
            </div>
          </div>
        </div>
      </div>

      <!-- Remaining Material -->
      <div class="row mt-4">
        <div class="col-md-12 text-center">
          <div class="card shadow-sm border-info">
            <div class="card-body">
              <h5>Remaining Material in Active Coils</h5>
              <h3 class="text-info">{{ stats.remaining_material }} kg</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      stats: {
        total_coils: 0,
        total_products: 0,
        active_orders: 0,
        finished_coils: 0,
        remaining_material: 0
      },
      token: localStorage.getItem("auth-token") || ""
    };
  },
  computed: {
    cards() {
      return [
        { title: "Total Coils", value: this.stats.total_coils, border: "border-primary", color: "text-primary" },
        { title: "Total Products", value: this.stats.total_products, border: "border-success", color: "text-success" },
        { title: "Active Orders", value: this.stats.active_orders, border: "border-warning", color: "text-warning" },
        { title: "Finished Coils", value: this.stats.finished_coils, border: "border-danger", color: "text-danger" }
      ];
    }
  },
  async mounted() {
    try {
      const res = await fetch("/api/dashboard", {
        headers: { "Authentication-Token": this.token }
      });
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      this.stats = await res.json();
    } catch (err) {
      console.error(err.message);
    }
  }
};
