export default {
  template: `
  <nav class="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
    <div class="container-fluid px-4">
      <!-- Brand: goes to /app_info before login, /dashboard after -->
      <router-link
        class="navbar-brand fw-bold"
        :to="isAuthenticated ? '/dashboard' : '/app_info'">
        Coil &amp; Sheet Management
      </router-link>

      <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav"
              aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav mr-auto">
          <li class="nav-item" v-if="isAuthenticated && role === 'admin'">
            <router-link class="nav-link" to="/dashboard">Dashboard</router-link>
          </li>
          <li class="nav-item" v-if="isAuthenticated && role === 'admin'">
            <router-link class="nav-link" to="/customer_info">Customers</router-link>
          </li>
          <li class="nav-item" v-if="isAuthenticated && role === 'admin'">
            <router-link class="nav-link" to="/coil_info">Coils</router-link>
          </li>
          <li class="nav-item" v-if="isAuthenticated && role === 'admin'">
            <router-link class="nav-link" to="/create_sale_order">New Sale</router-link>
          </li>
          <li class="nav-item" v-if="isAuthenticated && role === 'admin'">
            <router-link class="nav-link" to="/productions">Products</router-link>
          </li>
          <li class="nav-item" v-if="isAuthenticated && role === 'admin'">
            <router-link class="nav-link" to="/view_all_orders">All Orders</router-link>
          </li>
        </ul>

        <ul class="navbar-nav ml-auto align-items-center">
          <li class="nav-item" v-if="!isAuthenticated">
            <router-link class="nav-link" to="/app_info">About</router-link>
          </li>
          <li class="nav-item" v-if="!isAuthenticated">
            <router-link class="btn btn-light btn-sm ml-2" to="/user_login">Login</router-link>
          </li>
          <li class="nav-item" v-if="isAuthenticated">
            <span class="navbar-text text-light mr-3" v-if="fullName">Hi, {{ fullName }}</span>
          </li>
          <li class="nav-item" v-if="isAuthenticated">
            <button class="btn btn-outline-light btn-sm" @click="logout">Logout</button>
          </li>
        </ul>
      </div>
    </div>
  </nav>
  `,

  data() {
    return {
      role: localStorage.getItem("role"),
      isAuthenticated: !!localStorage.getItem("auth-token"),
      fullName: localStorage.getItem("full_name") || ""
    };
  },

  watch: {
    $route() {
      this.role = localStorage.getItem("role");
      this.isAuthenticated = !!localStorage.getItem("auth-token");
      this.fullName = localStorage.getItem("full_name") || "";
    }
  },

  methods: {
    logout() {
      localStorage.removeItem("auth-token");
      localStorage.removeItem("role");
      localStorage.removeItem("full_name");
      localStorage.removeItem("user_id");
      localStorage.removeItem("user");
      this.$store.commit("logout");
      this.isAuthenticated = false;
      this.role = null;
      this.fullName = "";
      this.$router.push("/app_info");
    }
  }
};
