export default {
  name: "SaleOrders",
  template: `
    <div class="sale-orders">
      <h2>Sale Orders</h2>

      <button @click="exportCSV" :disabled="exporting">
        {{ exporting ? 'Exporting...' : 'Export CSV' }}
      </button>

      <div v-if="loading">Loading...</div>
      <div v-if="error" class="error">{{ error }}</div>

      <table v-if="mergedSales.length && !loading" border="1" cellpadding="5">
        <thead>
          <tr>
            <th>Sale ID</th>
            <th>Date</th>
            <th>Party Name</th>
            <th>Phone</th>
            <th>Coil Number</th>
            <th>Make</th>
            <th>Type</th>
            <th>Color</th>
            <th>Length</th>
            <th>Rate</th>
            <th>Amount</th>
            <th>Total Amount</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="(sale, index) in mergedSales" :key="'sale-' + index">
            <tr v-for="(row, rowIndex) in sale.rows" :key="'row-' + rowIndex">
              <td v-if="rowIndex === 0" :rowspan="sale.rows.length">{{ sale.saleId }}</td>
              <td v-if="rowIndex === 0" :rowspan="sale.rows.length">{{ sale.date }}</td>
              <td v-if="rowIndex === 0" :rowspan="sale.rows.length">{{ sale.partyName }}</td>
              <td v-if="rowIndex === 0" :rowspan="sale.rows.length">{{ sale.partyPhone }}</td>
              <td>{{ row.coilNumber }}</td>
              <td>{{ row.make }}</td>
              <td>{{ row.type }}</td>
              <td>{{ row.color }}</td>
              <td>{{ row.length }}</td>
              <td>{{ row.rate }}</td>
              <td>{{ row.amount }}</td>
              <td v-if="rowIndex === 0" :rowspan="sale.rows.length">{{ sale.totalAmount }}</td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  `,
  data() {
    return {
      sales: [],
      loading: true,
      error: null,
      exporting: false,
      token: localStorage.getItem("auth-token") || ""
    };
  },
  computed: {
    mergedSales() {
      if (!Array.isArray(this.sales)) return [];

      return this.sales.map(sale => {
        const coils = Array.isArray(sale.used_coils) ? sale.used_coils : [];
        let rows = [];
        coils.forEach(coil => {
          const items = Array.isArray(coil.items) ? coil.items : [];
          items.forEach(item => {
            rows.push({
              coilNumber: coil.coil_number || "",
              make: coil.make || "",
              type: coil.type || "",
              color: coil.color || "",
              length: item.length || "",
              rate: item.rate || "",
              amount: item.amount || ""
            });
          });
        });
        return {
          saleId: sale.sale_id || "",
          date: sale.date || "",
          partyName: sale.party?.name || "",
          partyPhone: sale.party?.phone || "",
          totalAmount: sale.total_amount || "",
          rows
        };
      });
    }
  },
  methods: {
    async fetchSales() {
      try {
        const res = await fetch("/api/all_orders", {
          method: "GET",
          headers: {
            "Authentication-Token": this.token
          }
        });

        if (!res.ok) throw new Error("Failed to fetch sale orders");

        const data = await res.json();
        this.sales = Array.isArray(data) ? data : [];
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },
    async exportCSV() {
      try {
        this.exporting = true;
        // Step 1: Trigger CSV generation task
        const res = await fetch("/api/generate_sale_orders_csv", {
          method: "POST",
          headers: {
            "Authentication-Token": this.token
          }
        });
        if (!res.ok) throw new Error("Failed to start CSV export");

        const { task_id } = await res.json();
        if (!task_id) throw new Error("No task ID returned");

        // Step 2: Poll for CSV ready
        let fileReady = false;
        while (!fileReady) {
          const pollRes = await fetch(`/get_csv/${task_id}`);
          if (pollRes.status === 200) {
            // CSV is ready
            const blob = await pollRes.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "sale_orders.csv";
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            fileReady = true;
          } else {
            await new Promise(r => setTimeout(r, 2000)); // wait 2 sec
          }
        }
      } catch (err) {
        alert(err.message);
      } finally {
        this.exporting = false;
      }
    }
  },
  mounted() {
    this.fetchSales();
  }
};
