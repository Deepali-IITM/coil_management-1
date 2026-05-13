export default {
  template: `
  <div class="appinfo-page">

    <!-- Public top nav -->
    <header class="public-topbar">
      <div class="public-topbar__brand">
        <div class="public-topbar__brand-icon">
          <i class="bi bi-layers-half"></i>
        </div>
        <span>CoilMS</span>
      </div>
      <router-link to="/user_login" class="btn btn-primary btn-sm px-4">
        Login &rarr;
      </router-link>
    </header>

    <!-- Hero -->
    <section class="appinfo-hero">
      <div class="appinfo-hero__badge">Coil &amp; Sheet Industry</div>
      <h1 class="appinfo-hero__title">
        Smart Inventory &amp;<br />Sales Management
      </h1>
      <p class="appinfo-hero__sub">
        Track coil stock, manage products, handle customer orders and
        monitor remaining material — all in one place.
      </p>
      <router-link to="/user_login" class="btn btn-primary btn-lg px-5 mt-3">
        Get Started &rarr;
      </router-link>
    </section>

    <!-- Feature cards -->
    <section class="appinfo-features">
      <div class="appinfo-features__grid">

        <div class="appinfo-feature-card">
          <div class="appinfo-feature-card__icon" style="background:#eff6ff; color:#2563eb;">
            <i class="bi bi-layers"></i>
          </div>
          <h3>Coil Inventory</h3>
          <p>Track stock levels, grades, colours and coil sizes in real time. Avoid shortages and
             overstocking with per-coil remaining-length monitoring.</p>
        </div>

        <div class="appinfo-feature-card">
          <div class="appinfo-feature-card__icon" style="background:#f0fdf4; color:#16a34a;">
            <i class="bi bi-scissors"></i>
          </div>
          <h3>Sheet Cutting Management</h3>
          <p>Record coil-to-sheet conversions, manage cutting lengths &amp; quantities and
             optimise material utilisation across orders.</p>
        </div>

        <div class="appinfo-feature-card">
          <div class="appinfo-feature-card__icon" style="background:#fffbeb; color:#d97706;">
            <i class="bi bi-receipt"></i>
          </div>
          <h3>Order Management</h3>
          <p>Track multi-coil customer orders, link them to specific products and
             generate printable invoices in seconds.</p>
        </div>

        <div class="appinfo-feature-card">
          <div class="appinfo-feature-card__icon" style="background:#fdf4ff; color:#9333ea;">
            <i class="bi bi-bar-chart-line"></i>
          </div>
          <h3>Reports &amp; Analytics</h3>
          <p>View production summaries, sales history and material-usage reports to
             improve efficiency and profitability at a glance.</p>
        </div>

      </div>
    </section>

    <!-- CTA footer -->
    <footer class="appinfo-footer">
      <p>Questions? Reach us at
        <a href="mailto:support@coilmanager.com">support@coilmanager.com</a>
      </p>
      <p class="appinfo-footer__copy">&copy; 2026 CoilMS. All rights reserved.</p>
    </footer>
  </div>
  `,
};
