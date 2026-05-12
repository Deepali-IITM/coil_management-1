export default {
  name: "Analytics",
  template: `
  <div class="page-wrapper">

    <!-- Header + period switcher -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Sales Analytics</h1>
        <p class="page-sub" v-if="periodData.start">
          {{ periodLabel }} &mdash; {{ periodData.start }}
          <span v-if="periodData.end !== periodData.start"> to {{ periodData.end }}</span>
        </p>
      </div>
      <div class="d-flex gap-1 align-items-center flex-wrap">
        <div class="btn-group" role="group">
          <button v-for="p in periods" :key="p.value"
                  type="button" class="btn btn-sm"
                  :class="period === p.value ? 'btn-primary' : 'btn-outline-secondary'"
                  @click="setPeriod(p.value)">
            {{ p.label }}
          </button>
        </div>
        <button class="btn btn-sm btn-outline-secondary ms-1" @click="refresh" title="Refresh">
          <i class="bi bi-arrow-clockwise" :class="{ 'spin': refreshing }"></i>
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="d-flex justify-content-center py-5">
      <div class="spinner-border text-primary"></div>
    </div>

    <template v-else>

      <!-- ── KPI Cards ── -->
      <div class="stat-grid mb-4">
        <div class="stat-card stat--indigo">
          <div class="stat-card__icon"><i class="bi bi-currency-rupee"></i></div>
          <div class="stat-card__body">
            <div class="stat-card__value">{{ fmtStat(periodData.total_revenue) }}</div>
            <div class="stat-card__label">Revenue</div>
          </div>
        </div>
        <div class="stat-card stat--blue">
          <div class="stat-card__icon"><i class="bi bi-receipt-cutoff"></i></div>
          <div class="stat-card__body">
            <div class="stat-card__value">{{ periodData.total_orders || 0 }}</div>
            <div class="stat-card__label">Orders</div>
          </div>
        </div>
        <div class="stat-card stat--green">
          <div class="stat-card__icon"><i class="bi bi-graph-up-arrow"></i></div>
          <div class="stat-card__body">
            <div class="stat-card__value">{{ fmtStat(avgOrder) }}</div>
            <div class="stat-card__label">Avg Order Value</div>
          </div>
        </div>
        <div class="stat-card stat--amber">
          <div class="stat-card__icon"><i class="bi bi-hourglass-split"></i></div>
          <div class="stat-card__body">
            <div class="stat-card__value">{{ fmtStat(periodData.pending_amount) }}</div>
            <div class="stat-card__label">Pending Amount</div>
          </div>
        </div>
        <div class="stat-card stat--red">
          <div class="stat-card__icon"><i class="bi bi-check-circle-fill"></i></div>
          <div class="stat-card__body">
            <div class="stat-card__value">{{ periodData.paid_orders || 0 }}</div>
            <div class="stat-card__label">Paid Orders</div>
          </div>
        </div>
      </div>

      <!-- ── Monthly Revenue Trend ── -->
      <div class="card mb-4">
        <div class="card-header d-flex align-items-center justify-content-between">
          <h5 class="mb-0">
            <i class="bi bi-bar-chart-fill me-2 text-primary"></i>Monthly Revenue Trend
          </h5>
          <span class="text-muted" style="font-size:12px;">Last 12 months (all-time)</span>
        </div>
        <div class="card-body pt-4 pb-2">
          <div v-if="!trend.length" class="text-center text-muted py-4">
            <i class="bi bi-bar-chart display-4 d-block mb-2 opacity-25"></i>No trend data yet.
          </div>
          <div v-else class="analytics-trend-chart">
            <div v-for="m in trend" :key="m.year + '-' + m.month" class="analytics-trend-bar-wrap">
              <div class="analytics-trend-bar-area">
                <div class="analytics-trend-bar"
                     :class="isCurrentMonth(m) ? 'analytics-trend-bar--current' : ''"
                     :style="{ height: barHeight(m.total) + 'px' }">
                  <span class="analytics-trend-bar__val" v-if="m.total > 0">{{ fmtK(m.total) }}</span>
                </div>
              </div>
              <span class="analytics-trend-bar__label">
                {{ monthShort(m.month) }}<br /><span class="analytics-trend-bar__year">{{ m.year }}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Top Customers + Most Sold Products ── -->
      <div class="row g-4 mb-4">

        <div class="col-lg-6">
          <div class="card h-100">
            <div class="card-header">
              <h5 class="mb-0"><i class="bi bi-people-fill me-2 text-primary"></i>Top Customers</h5>
            </div>
            <div class="card-body">
              <div v-if="!topCustomers.length" class="text-center text-muted py-4">
                <i class="bi bi-people display-4 d-block mb-2 opacity-25"></i>No data yet.
              </div>
              <div v-for="(c, i) in topCustomers" :key="c.name" class="analytics-hbar-row">
                <span class="analytics-hbar-rank">{{ i + 1 }}</span>
                <span class="analytics-hbar-name">{{ c.name }}</span>
                <div class="analytics-hbar">
                  <div class="analytics-hbar__fill"
                       :style="{ width: pct(c.revenue, maxCustomerRev) + '%' }"></div>
                </div>
                <span class="analytics-hbar-val">{{ fmt(c.revenue) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="col-lg-6">
          <div class="card h-100">
            <div class="card-header">
              <h5 class="mb-0"><i class="bi bi-box-seam-fill me-2 text-primary"></i>Most Sold Products</h5>
            </div>
            <div class="card-body">
              <div v-if="!mostSold.length" class="text-center text-muted py-4">
                <i class="bi bi-box-seam display-4 d-block mb-2 opacity-25"></i>No data yet.
              </div>
              <div v-for="(p, i) in mostSold" :key="p.make + p.type + p.color" class="analytics-hbar-row">
                <span class="analytics-hbar-rank">{{ i + 1 }}</span>
                <span class="analytics-hbar-name">
                  {{ p.make }} {{ p.type }}
                  <span class="text-muted" style="font-size:11px;">{{ p.color }}</span>
                </span>
                <div class="analytics-hbar analytics-hbar--green">
                  <div class="analytics-hbar__fill"
                       :style="{ width: pct(p.total_length, maxProductLen) + '%' }"></div>
                </div>
                <span class="analytics-hbar-val">{{ p.total_length.toFixed(0) }} m</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- ── Orders in period ── -->
      <div class="card">
        <div class="card-header d-flex align-items-center justify-content-between">
          <h5 class="mb-0">
            <i class="bi bi-list-ul me-2 text-primary"></i>
            Orders — {{ periodLabel }}
            <span class="badge bg-primary ms-2">{{ (periodData.orders || []).length }}</span>
          </h5>
          <button class="btn btn-sm btn-outline-secondary" @click="showOrders = !showOrders">
            <i class="bi" :class="showOrders ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
            {{ showOrders ? 'Collapse' : 'Expand' }}
          </button>
        </div>
        <div v-if="showOrders" class="table-responsive">
          <table class="table table-sm mb-0">
            <thead class="table-head-accent">
              <tr>
                <th>Invoice</th>
                <th>Date</th>
                <th>Customer</th>
                <th class="text-end">Amount</th>
                <th class="text-center">Payment</th>
                <th class="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!(periodData.orders || []).length">
                <td colspan="6" class="text-center text-muted py-4">
                  <i class="bi bi-inbox display-4 d-block mb-2 opacity-25"></i>
                  No orders in this period.
                </td>
              </tr>
              <tr v-for="o in periodData.orders" :key="o.id">
                <td class="fw-semibold text-primary">{{ o.invoice_number }}</td>
                <td class="text-muted">{{ o.date }}</td>
                <td>{{ o.party }}</td>
                <td class="text-end fw-semibold">{{ fmt(o.net_amount || o.amount) }}</td>
                <td class="text-center">
                  <span class="badge" :class="payBadge(o.payment_status)">{{ cap(o.payment_status) }}</span>
                </td>
                <td class="text-center">
                  <span class="badge" :class="statusBadge(o.status)">{{ cap(o.status) }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </template>
  </div>
  `,

  data() {
    return {
      period: "today",
      periods: [
        { label: "Today",      value: "today" },
        { label: "This Week",  value: "week"  },
        { label: "This Month", value: "month" },
        { label: "This Year",  value: "year"  },
      ],
      loading: true,
      refreshing: false,
      periodData: { total_revenue: 0, total_orders: 0, paid_orders: 0, pending_amount: 0, orders: [], start: "", end: "" },
      trend: [],
      topCustomers: [],
      mostSold: [],
      showOrders: true,
    };
  },

  computed: {
    periodLabel() {
      return this.periods.find(p => p.value === this.period)?.label || "Period";
    },
    avgOrder() {
      const n = this.periodData.total_orders;
      return n > 0 ? (this.periodData.total_revenue || 0) / n : 0;
    },
    trendMax()       { return Math.max(...this.trend.map(m => m.total), 1); },
    maxCustomerRev() { return Math.max(...this.topCustomers.map(c => c.revenue), 1); },
    maxProductLen()  { return Math.max(...this.mostSold.map(p => p.total_length), 1); },
  },

  methods: {
    token() { return localStorage.getItem("auth-token"); },

    async fetchAnalytics() {
      try {
        const res = await fetch("/api/dashboard/analytics", {
          headers: { "Authentication-Token": this.token() },
        });
        if (res.ok) {
          const d = await res.json();
          this.trend        = d.monthly_trend      || [];
          this.topCustomers = d.top_customers      || [];
          this.mostSold     = d.most_sold_products || [];
        }
      } catch {}
    },

    async fetchPeriodData() {
      try {
        const res = await fetch(`/api/reports/sales?period=${this.period}`, {
          headers: { "Authentication-Token": this.token() },
        });
        if (res.ok) this.periodData = await res.json();
      } catch {}
    },

    async setPeriod(p) {
      this.period = p;
      this.refreshing = true;
      await this.fetchPeriodData();
      this.refreshing = false;
    },

    async refresh() {
      this.refreshing = true;
      await Promise.all([this.fetchAnalytics(), this.fetchPeriodData()]);
      this.refreshing = false;
    },

    /* chart helpers */
    barHeight(val) {
      const MAX_PX = 150;
      if (!val || !this.trendMax) return 0;
      return Math.max(Math.round((val / this.trendMax) * MAX_PX), val > 0 ? 4 : 0);
    },
    pct(val, max) {
      if (!max) return 0;
      return Math.max(Math.round((val / max) * 100), val > 0 ? 3 : 0);
    },
    isCurrentMonth(m) {
      const now = new Date();
      return m.year === now.getFullYear() && m.month === now.getMonth() + 1;
    },
    monthShort(n) {
      return ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][n] || n;
    },

    /* formatters */
    fmt(v) {
      if (!v && v !== 0) return "—";
      return "₹" + Number(v).toLocaleString("en-IN", { maximumFractionDigits: 0 });
    },
    fmtStat(v) {
      if (!v && v !== 0) return "₹0";
      if (v >= 10000000) return "₹" + (v / 10000000).toFixed(1) + " Cr";
      if (v >= 100000)   return "₹" + (v / 100000).toFixed(1) + " L";
      if (v >= 1000)     return "₹" + (v / 1000).toFixed(0) + "K";
      return "₹" + Math.round(v);
    },
    fmtK(v) {
      if (v >= 100000) return "₹" + (v / 100000).toFixed(1) + "L";
      if (v >= 1000)   return "₹" + (v / 1000).toFixed(0) + "K";
      return "₹" + Math.round(v);
    },
    cap(s) { return s ? s[0].toUpperCase() + s.slice(1) : "—"; },
    payBadge(s) {
      return { paid: "bg-success", partial: "bg-warning text-dark", pending: "bg-danger" }[s] || "bg-secondary";
    },
    statusBadge(s) {
      return { confirmed: "bg-primary", draft: "bg-secondary", cancelled: "bg-danger" }[s] || "bg-secondary";
    },
  },

  async mounted() {
    await Promise.all([this.fetchAnalytics(), this.fetchPeriodData()]);
    this.loading = false;
  },
};
