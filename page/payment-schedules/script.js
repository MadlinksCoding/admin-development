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
  function escapeHtml(s) {
    if (!s) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function ensurePaymentScheduleOffcanvas() {
    let offcanvasElement = document.querySelector("#paymentScheduleDetailsOffcanvas");
    if (!offcanvasElement) {
      const wrapperElement = document.createElement("div");
      wrapperElement.innerHTML = `
        <div class="offcanvas offcanvas-end offcanvas-details" tabindex="-1" id="paymentScheduleDetailsOffcanvas">
          <div class="offcanvas-header">
            <h5 class="offcanvas-title">Schedule</h5>
            <button type="button" class="btn-close" data-bs-dismiss="offcanvas"></button>
          </div>
          <div class="offcanvas-body" id="paymentScheduleDetailsBody"></div>
        </div>
      `;
      document.body.appendChild(wrapperElement.firstElementChild);
      offcanvasElement = document.querySelector("#paymentScheduleDetailsOffcanvas");
    }
    return {
      canvas: offcanvasElement,
      body: document.querySelector("#paymentScheduleDetailsBody"),
      api: new bootstrap.Offcanvas(offcanvasElement),
    };
  }

  waitForAdminShell().then(() => {
    if (!window.AdminShell || !window.AdminShell.pageContent) return;
    const SECTION = "payment-schedules";
    const TABLE_CONFIG = {
      id: "payment-schedules-table",
      columns: [
        { field: "subscriptionId", label: "ID", sortable: true },
        { field: "createdAt", label: "Created", sortable: true, formatter: (v) => formatDDMMYYYY(v) },
        { field: "frequency", label: "Type", sortable: true, formatter: (v) => cap(v || "") },
        { field: "userId", label: "Payer", sortable: true },
        { field: "orderId", label: "Reference ID", sortable: true },
        { field: "amount", label: "Amount", sortable: true, formatter: (v, row) => v == null ? "-" : `${Number(v).toFixed(2)} ${row.currency || "USD"}` },
        { field: "startDate", label: "Start", sortable: true, formatter: (v) => formatDDMMYYYY(v) },
        { field: "nextScheduleDate", label: "Next", sortable: true, formatter: (v) => formatDDMMYYYY(v) },
        { field: "status", label: "Status", sortable: true, formatter: (v) => cap(v || "") },
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
      { id: "active", label: "Active", statusFilter: "active" },
      { id: "paused", label: "Paused", statusFilter: "paused" }
    ];
    window.PageRenderer.init({ section: SECTION, tableConfig: TABLE_CONFIG, tabFilterKey: "status", tabs: TABS, pagination: { enabled: true, pageSize: 20 } });

    // Attach one global click handler for all payment tables (reuse pattern from sessions/transactions)
    if (!document.body.dataset.paymentSchedulesViewAttached) {
      document.body.dataset.paymentSchedulesViewAttached = "true";
      document.body.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-payment-view]");
        if (!btn) return;
        e.preventDefault();
        try {
          const row = JSON.parse(decodeURIComponent(btn.getAttribute("data-payment-view")));
          showPaymentScheduleView(row);
        } catch (err) {
          console.warn("Failed to decode schedule row:", err);
        }
      });
    }

    function showPaymentScheduleView(rowData) {
      if (!rowData) return;
      const { canvas, body, api } = ensurePaymentScheduleOffcanvas();
      const titleEl = canvas.querySelector(".offcanvas-title");
      if (titleEl) titleEl.textContent = `Schedule: ${rowData.subscriptionId || "-"}`;

      const created = rowData.createdAt ? formatDDMMYYYY(rowData.createdAt) : "-";
      const start = rowData.startDate ? formatDDMMYYYY(rowData.startDate) : "-";
      const next = rowData.nextScheduleDate ? formatDDMMYYYY(rowData.nextScheduleDate) : "-";
      const amountStr =
        rowData.amount != null ? `${Number(rowData.amount).toFixed(2)} ${rowData.currency || "USD"}` : "-";

      const webhookOrderId = rowData.orderId || "";
      const webhookLink = webhookOrderId
        ? `<p class="mb-1"><strong>Webhooks:</strong> <a href="page/payment-webhooks?orderId=${escapeHtml(
            webhookOrderId
          )}">Open webhooks for ${escapeHtml(webhookOrderId)}</a></p>`
        : "";
      const summary = `
        <div class="mb-3">
          <p class="mb-1"><strong>Subscription ID:</strong> ${rowData.subscriptionId || "-"}</p>
          <p class="mb-1"><strong>User ID (Payer):</strong> ${rowData.userId || "-"}</p>
          <p class="mb-1"><strong>Order ID:</strong> ${rowData.orderId || "-"}</p>
          <p class="mb-1"><strong>Registration ID:</strong> ${rowData.registrationId || "-"}</p>
          <p class="mb-1"><strong>Status:</strong> ${cap(rowData.status || "")}</p>
          <p class="mb-1"><strong>Frequency:</strong> ${cap(rowData.frequency || "")}</p>
          <p class="mb-1"><strong>Amount:</strong> ${amountStr}</p>
          <p class="mb-1"><strong>Start date:</strong> ${start}</p>
          <p class="mb-1"><strong>Next schedule date:</strong> ${next}</p>
          <p class="mb-1"><strong>Created at:</strong> ${created}</p>
          ${webhookLink}
        </div>
      `;

      const payloadHtml = `
        <div class="mt-4 border-top pt-3">
          <h6>Full payload</h6>
          <pre class="code-json bg-light p-3 rounded mb-0">${escapeHtml(JSON.stringify(rowData, null, 2))}</pre>
        </div>
      `;
      body.innerHTML = summary + payloadHtml;
      api.show();
    }
  });
})();
