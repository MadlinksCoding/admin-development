(function () {
  function waitForAdminShell() {
    return new Promise((resolve) => {
      if (window.AdminShell && window.AdminShell.pageContent) resolve();
      else document.body.addEventListener("adminshell:ready", resolve, { once: true });
    });
  }
  function formatDDMMYYYY(v) {
    if (!v) return "-";
    try {
      const d = new Date(v);
      if (Number.isNaN(d.getTime())) return String(v);
      return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
    } catch (e) { return String(v); }
  }
  function cap(s) { if (!s) return "-"; const x = String(s); return x.charAt(0).toUpperCase() + x.slice(1).toLowerCase(); }

  function ensurePaymentWebhookOffcanvas() {
    let offcanvasElement = document.querySelector("#paymentWebhookDetailsOffcanvas");
    if (!offcanvasElement) {
      const wrapperElement = document.createElement("div");
      wrapperElement.innerHTML = `
        <div class="offcanvas offcanvas-end offcanvas-details" tabindex="-1" id="paymentWebhookDetailsOffcanvas">
          <div class="offcanvas-header">
            <h5 class="offcanvas-title">Webhook</h5>
            <button type="button" class="btn-close" data-bs-dismiss="offcanvas"></button>
          </div>
          <div class="offcanvas-body" id="paymentWebhookDetailsBody"></div>
        </div>
      `;
      document.body.appendChild(wrapperElement.firstElementChild);
      offcanvasElement = document.querySelector("#paymentWebhookDetailsOffcanvas");
    }
    return {
      canvas: offcanvasElement,
      body: document.querySelector("#paymentWebhookDetailsBody"),
      api: new bootstrap.Offcanvas(offcanvasElement),
    };
  }

  waitForAdminShell().then(() => {
    if (!window.AdminShell || !window.AdminShell.pageContent) return;
    const SECTION = "payment-webhooks";

    // Support deep-linking from sessions page:
    // /page/payment-webhooks/index.html?orderId=ord_001
    // Use the query param to pre-filter the grid by orderId.
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const orderIdParam = urlParams.get("orderId");
      if (orderIdParam && window.StateManager) {
        const existingFilters = window.StateManager.getFilters(SECTION) || {};
        const filters = { ...existingFilters, orderId: orderIdParam };
        window.StateManager.setFilters(SECTION, filters);
      }
    } catch (e) {
      console.warn("Failed to initialize payment-webhooks filters from URL", e);
    }
    const TABLE_CONFIG = {
      id: "payment-webhooks-table",
      columns: [
        { field: "idempotencyKey", label: "Webhook ID", sortable: true },
        { field: "createdAt", label: "Created", sortable: true, formatter: (v) => formatDDMMYYYY(v) },
        { field: "actionTaken", label: "Action", sortable: true, formatter: (v) => cap(v || "") },
        { field: "orderId", label: "Order ID", sortable: true },
        { field: "handled", label: "Handled", sortable: true, formatter: (v) => v === true ? "Handled" : v === false ? "Pending" : "-" },
        {
          field: "actions",
          label: "Actions",
          formatter: (value, row) => {
            const encoded = encodeURIComponent(JSON.stringify(row));
            return `<button class="btn btn-sm btn-primary" data-payment-view='${encoded}'>View</button>`;
          }
        }
      ]
    };
    const TABS = [
      { id: "all", label: "All", statusFilter: null },
      { id: "handled", label: "Handled", statusFilter: "true" },
      { id: "pending", label: "Pending", statusFilter: "false" }
    ];
    window.PageRenderer.init({
      section: SECTION,
      tableConfig: TABLE_CONFIG,
      tabFilterKey: "handled",
      tabs: TABS,
      pagination: { enabled: true, pageSize: 20 }
    });

    if (!document.body.dataset.paymentWebhooksViewAttached) {
      document.body.dataset.paymentWebhooksViewAttached = "true";
      document.body.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-payment-view]");
        if (!btn) return;
        e.preventDefault();
        try {
          const row = JSON.parse(decodeURIComponent(btn.getAttribute("data-payment-view")));
          showPaymentView(row, "Webhook");
        } catch (err) {
          console.warn("Failed to decode row:", err);
        }
      });
    }

    function showPaymentView(rowData, entityLabel) {
      if (!rowData) return;
      const { canvas, body, api } = ensurePaymentWebhookOffcanvas();
      const titleEl = canvas.querySelector(".offcanvas-title");
      if (titleEl) titleEl.textContent = `${entityLabel}: ${rowData.idempotencyKey || rowData.orderId || "-"}`;
      const created = rowData.createdAt ? formatDDMMYYYY(rowData.createdAt) + " " + new Date(rowData.createdAt).toTimeString().slice(0, 8) : "-";
      body.innerHTML = `
        <div class="mb-3">
          <p class="mb-1"><strong>ID:</strong> ${rowData.idempotencyKey || "-"}</p>
          <p class="mb-1"><strong>Created:</strong> ${created}</p>
          <p class="mb-1"><strong>Type:</strong> ${cap(rowData.actionTaken || "")}</p>
          <p class="mb-1"><strong>Reference ID:</strong> ${rowData.orderId || "-"}</p>
          <p class="mb-1"><strong>State:</strong> ${rowData.handled === true ? "Handled" : rowData.handled === false ? "Pending" : "-"}</p>
        </div>
        <div class="mt-4 border-top pt-3"><h6>Full payload</h6><pre class="code-json bg-light p-3 rounded mb-0">${JSON.stringify(rowData, null, 2)}</pre></div>
      `;
      api.show();
    }
  });
})();
