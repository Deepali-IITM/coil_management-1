export default {
  name: "SaleOrders",
  template: `
    <div class="sale-orders">
      <h2>Sale Orders</h2>

      <div v-if="loading">Loading...</div>
      <div v-if="error" class="error">{{ error }}</div>



      <!-- Product Summary Report -->
      <h2 style="margin-top:30px;">Product Summary Report</h2>
      <table v-if="productSummary.length && !loading" border="1" cellpadding="5">
        <thead>
          <tr>
            <th>Product</th>
            <th>Total Quantity</th>
            <th>Total Amount</th>
            <th>Average Rate</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(prod, index) in productSummary" :key="'prod-' + index">
            <td>{{ prod.name }}</td>
            <td>{{ prod.totalQty }}</td>
            <td>{{ prod.totalAmount }}</td>
            <td>{{ prod.avgRate }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  data() {
    return {
      sales: [],
      loading: true,
      error: null,
      token: localStorage.getItem("auth-token") || ""
    };
  },
  computed: {
    flattenedSales() {
      if (!Array.isArray(this.sales)) return [];
      let rows = [];
      this.sales.forEach(sale => {
        const coils = Array.isArray(sale.used_coils) ? sale.used_coils : [];
        coils.forEach(coil => {
          const items = Array.isArray(coil.items) ? coil.items : [];
          items.forEach(item => {
            rows.push({
              saleId: sale.sale_id || "",
              date: sale.date || "",
              partyName: sale.party?.name || "",
              partyPhone: sale.party?.phone || "",
              coilNumber: coil.coil_number || "",
              make: coil.make || "",
              type: coil.type || "",
              color: coil.color || "",
              length: item.length || 0,
              rate: item.rate || 0,
              amount: item.amount || 0,
              totalAmount: sale.total_amount || 0
            });
          });
        });
      });
      return rows;
    },
    productSummary() {
      let summaryMap = {};
      this.flattenedSales.forEach(item => {
        const key = `${item.make}-${item.type}-${item.color}`;
        if (!summaryMap[key]) {
          summaryMap[key] = {
            name: `${item.make} ${item.type} ${item.color}`,
            totalQty: 0,
            totalAmount: 0,
            totalRateSum: 0,
            count: 0
          };
        }
        summaryMap[key].totalQty += Number(item.length) || 0;
        summaryMap[key].totalAmount += Number(item.amount) || 0;
        summaryMap[key].totalRateSum += Number(item.rate) || 0;
        summaryMap[key].count += 1;
      });

      return Object.values(summaryMap).map(prod => ({
        name: prod.name,
        totalQty: prod.totalQty,
        totalAmount: prod.totalAmount,
        avgRate: prod.count > 0 ? (prod.totalRateSum / prod.count).toFixed(2) : 0
      }));
    }
  },
  async mounted() {
    try {
      const res = await fetch("/api/all_orders", {
        method: "GET",
        headers: { "Authentication-Token": this.token }
      });
      if (!res.ok) throw new Error("Failed to fetch sale orders");
      const data = await res.json();
      this.sales = Array.isArray(data) ? data : [];
    } catch (err) {
      this.error = err.message;
    } finally {
      this.loading = false;
    }
  }
};
