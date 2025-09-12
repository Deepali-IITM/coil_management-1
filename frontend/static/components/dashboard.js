
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

      <!-- Sales Trend Chart -->
      <div class="row mt-5">
        <div class="col-md-12">
          <div class="card shadow-sm">
            <div class="card-body">
              <h5 class="text-center">📈 Sales Trend (Last 6 Months)</h5>
              <canvas id="salesChart"></canvas>
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
        remaining_material: 0,
        sales_trend: []
      },
      token: localStorage.getItem("auth-token") || "",
      chart: null
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
      this.renderChart();
    } catch (err) {
      console.error(err.message);
    }
  },
  methods: {
    renderChart() {
      if (this.chart) this.chart.destroy();
      const ctx = document.getElementById("salesChart").getContext("2d");
      const labels = this.stats.sales_trend.map(s => `Month ${s.month}`);
      const data = this.stats.sales_trend.map(s => s.total);

      this.chart = new Chart(ctx, {
        type: "line",
        data: {
          labels,
          datasets: [{
            label: "Total Sales",
            data,
            borderColor: "rgba(54, 162, 235, 1)",
            backgroundColor: "rgba(54, 162, 235, 0.2)",
            fill: true,
            tension: 0.3,
            pointBackgroundColor: "blue"
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: true, position: "top" }
          }
        }
      });
    }
  }
};