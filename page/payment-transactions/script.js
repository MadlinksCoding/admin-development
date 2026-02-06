// Payment Gateway – Transactions (Session-style: full payload, View + Fetch from Axcess)
(function () {
  function waitForAdminShell() {
    return new Promise((resolve) => {
      if (window.AdminShell && window.AdminShell.pageContent) resolve();
      else document.body.addEventListener("adminshell:ready", resolve, { once: true });
    });
  }

  function formatDDMMYYYY(value) {
    if (!value) return "-";
    try {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return String(value);
      const d = String(date.getDate()).padStart(2, "0");
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const y = date.getFullYear();
      return `${d}/${m}/${y}`;
    } catch (e) {
      return String(value);
    }
  }

  function formatDateTimeTooltip(value) {
    if (!value) return "";
    try {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return String(value);
      const d = String(date.getDate()).padStart(2, "0");
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const y = date.getFullYear();
      const h = String(date.getHours()).padStart(2, "0");
      const min = String(date.getMinutes()).padStart(2, "0");
      const s = String(date.getSeconds()).padStart(2, "0");
      return `${d}/${m}/${y} ${h}:${min}:${s}`;
    } catch (e) {
      return String(value);
    }
  }

  function capitalize(value) {
    if (!value) return "-";
    const s = String(value);
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  }

  function escapeHtml(s) {
    if (!s) return "";
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function ensurePaymentOffcanvas() {
    let offcanvasElement = document.querySelector("#paymentTransactionDetailsOffcanvas");
    if (!offcanvasElement) {
      const wrapperElement = document.createElement("div");
      wrapperElement.innerHTML = `
        <div class="offcanvas offcanvas-end offcanvas-details" tabindex="-1" id="paymentTransactionDetailsOffcanvas">
          <div class="offcanvas-header">
            <h5 class="offcanvas-title">Transaction</h5>
            <button type="button" class="btn-close" data-bs-dismiss="offcanvas"></button>
          </div>
          <div class="offcanvas-body" id="paymentTransactionDetailsBody"></div>
        </div>
      `;
      document.body.appendChild(wrapperElement.firstElementChild);
      offcanvasElement = document.querySelector("#paymentTransactionDetailsOffcanvas");
    }
    return {
      canvas: offcanvasElement,
      body: document.querySelector("#paymentTransactionDetailsBody"),
      api: new bootstrap.Offcanvas(offcanvasElement),
    };
  }

  waitForAdminShell().then(() => {
    if (!window.AdminShell || !window.AdminShell.pageContent) return;

    const SECTION = "payment-transactions";

    // Apply drill-down filters from URL
    const urlParams = new URLSearchParams(window.location.search);
    const userIdParam = urlParams.get("userId");
    const beneficiaryIdParam = urlParams.get("beneficiaryId");
    const existingFilters = window.StateManager.getFilters(SECTION);
    const hasUrlParams = userIdParam || beneficiaryIdParam;
    const hasExisting = Object.keys(existingFilters || {}).length > 0;
    if (hasUrlParams || !hasExisting) {
      const filters = { ...(existingFilters || {}) };
      if (userIdParam) filters.userId = userIdParam;
      if (beneficiaryIdParam) filters.beneficiaryId = beneficiaryIdParam;
      window.StateManager.setFilters(SECTION, filters);
    }
    try {
      const stored = localStorage.getItem("payment-transactions-filters");
      if (stored) {
        const parsed = JSON.parse(stored);
        const current = window.StateManager.getFilters(SECTION);
        window.StateManager.setFilters(SECTION, { ...current, ...parsed });
        localStorage.removeItem("payment-transactions-filters");
      }
    } catch (e) {
      console.warn("Could not read payment-transactions-filters", e);
    }

    const TABLE_CONFIG = {
      id: "payment-transactions-table",
      columns: [
        { field: "transactionId", label: "ID", sortable: true },
        {
          field: "createdAt",
          label: "Created",
          sortable: true,
          formatter: (value) => {
            const display = formatDDMMYYYY(value);
            if (display === "-" || !value) return display;
            return `<span title="${formatDateTimeTooltip(value).replace(/"/g, "&quot;")}">${display}</span>`;
          }
        },
        {
          field: "updatedAt",
          label: "Updated",
          sortable: true,
          formatter: (value) => {
            if (!value) return "-";
            const display = formatDDMMYYYY(value);
            return display === "-" ? "-" : `<span title="${formatDateTimeTooltip(value).replace(/"/g, "&quot;")}">${display}</span>`;
          }
        },
        { field: "userId", label: "User ID", sortable: true },
        // Reference ID in filters maps to orderId / transactionId.
        // Show this as "Reference ID" in the grid so the user can see
        // which value they are filtering on.
        { field: "orderId", label: "Reference ID", sortable: true },
        { field: "gateway", label: "Gateway", sortable: true, formatter: (v) => capitalize(v || "") },
        { field: "gatewayTxnId", label: "Gateway Txn ID", sortable: true },
        {
          field: "amount",
          label: "Amount",
          sortable: true,
          formatter: (value, row) => {
            if (value == null && !row.currency) return "-";
            const amt = value != null ? Number(value).toFixed(2) : "-";
            const cur = row.currency || "USD";
            return amt !== "-" ? `${amt} ${cur}` : cur;
          }
        },
        { field: "paymentType", label: "Pay Type", sortable: true, formatter: (v) => (v === "DB" ? "Debit" : v === "PA" ? "Preauth" : v || "-") },
        { field: "transactionType", label: "Txn Type", sortable: true, formatter: (v) => capitalize(v || "") },
        { field: "status", label: "Status", sortable: true, formatter: (v) => capitalize(v || "") },
        { field: "beneficiaryId", label: "Beneficiary", sortable: true },
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
      { id: "pending", label: "Pending", statusFilter: "pending" },
      { id: "authorized", label: "Authorized", statusFilter: "authorized" },
      { id: "success", label: "Success", statusFilter: "success" },
      { id: "failed", label: "Failed", statusFilter: "failed" },
      { id: "refunded", label: "Refunded", statusFilter: "refunded" },
      { id: "chargeback", label: "Chargeback", statusFilter: "chargeback" },
      { id: "voided", label: "Voided", statusFilter: "voided" }
    ];

    window.PageRenderer.init({
      section: SECTION,
      tableConfig: TABLE_CONFIG,
      tabFilterKey: "status",
      tabs: TABS,
      pagination: { enabled: true, pageSize: 20 }
    });

    if (!document.body.dataset.paymentViewAttached) {
      document.body.dataset.paymentViewAttached = "true";
      document.body.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-payment-view]");
        if (!btn) return;
        e.preventDefault();
        try {
          const row = JSON.parse(decodeURIComponent(btn.getAttribute("data-payment-view")));
          showPaymentView(row, "Transaction");
        } catch (err) {
          console.warn("Failed to decode row:", err);
        }
      });
    }

    // Handle "Fetch record from Axcess" button (delegated)
    document.body.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-fetch-axcess]");
      if (!btn) return;
      e.preventDefault();
      const entity = btn.getAttribute("data-entity");
      const id = btn.getAttribute("data-id");
      const currentPayload = btn.getAttribute("data-payload");
      let rowData = null;
      try {
        if (currentPayload) rowData = JSON.parse(decodeURIComponent(currentPayload));
      } catch (err) {
        console.warn(err);
      }
      fetchFromAxcessAndShow(entity, id, rowData);
    });

    function fetchFromAxcessAndShow(entity, id, currentRowData) {
      const { body } = ensurePaymentOffcanvas();
      const placeholder = body.querySelector("[data-axcess-result]");
      if (placeholder) {
        placeholder.innerHTML = "<span class=\"spinner-border spinner-border-sm me-2\"></span> Fetching from Axcess…";
        placeholder.classList.remove("d-none");
      }
      const showError = (msg) => {
        if (placeholder) {
          placeholder.innerHTML = `<div class="alert alert-warning mb-0">${escapeHtml(msg)}</div>`;
        }
      };
      const showPayload = (payload) => {
        if (placeholder) {
          placeholder.innerHTML = `<h6 class="mt-2">Axcess payload</h6><pre class="code-json bg-light p-3 rounded mb-0">${escapeHtml(JSON.stringify(payload, null, 2))}</pre>`;
        }
      };
      if (!window.ApiService.fetchFromAxcess) {
        showError("ApiService.fetchFromAxcess is not available.");
        return;
      }
      window.ApiService
        .fetchFromAxcess(entity, id)
        .then((payload) => {
          if (payload != null) {
            showPayload(payload);
          } else {
            showError("Using mock data (no backend configured).");
            if (currentRowData) showPayload(currentRowData);
          }
        })
        .catch((err) => {
          showError(err && err.message ? err.message : "Failed to fetch from Axcess.");
          if (currentRowData) {
            const pre = document.createElement("pre");
            pre.className = "code-json bg-light p-3 rounded mt-2 mb-0";
            pre.textContent = JSON.stringify(currentRowData, null, 2);
            if (placeholder) placeholder.appendChild(pre);
          }
        });
    }

    function showPaymentView(rowData, entityLabel) {
      if (!rowData) return;
      const { canvas, body, api } = ensurePaymentOffcanvas();
      const titleEl = canvas.querySelector(".offcanvas-title");
      if (titleEl) titleEl.textContent = `${entityLabel}: ${rowData.transactionId || rowData.id || "-"}`;
      const created = formatDateTimeTooltip(rowData.createdAt || rowData.created_at);
      const updated = formatDateTimeTooltip(rowData.updatedAt || rowData.updated_at);
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
          <p class="mb-1"><strong>Transaction ID:</strong> ${rowData.transactionId || "-"}</p>
          <p class="mb-1"><strong>pk:</strong> ${rowData.pk || "-"}</p>
          <p class="mb-1"><strong>sk:</strong> ${rowData.sk || "-"}</p>
          <p class="mb-1"><strong>Created:</strong> ${created || "-"}</p>
          <p class="mb-1"><strong>Updated:</strong> ${updated || "-"}</p>
          <p class="mb-1"><strong>User ID:</strong> ${rowData.userId || "-"}</p>
          <p class="mb-1"><strong>Order ID:</strong> ${rowData.orderId || "-"}</p>
          <p class="mb-1"><strong>Gateway:</strong> ${capitalize(rowData.gateway || "")}</p>
          <p class="mb-1"><strong>Gateway Txn ID:</strong> ${rowData.gatewayTxnId || "-"}</p>
          <p class="mb-1"><strong>Registration ID:</strong> ${rowData.registrationId || "-"}</p>
          <p class="mb-1"><strong>Amount:</strong> ${amountStr}</p>
          <p class="mb-1"><strong>Payment type:</strong> ${rowData.paymentType === "DB" ? "Debit" : rowData.paymentType === "PA" ? "Preauth" : rowData.paymentType || "-"}</p>
          <p class="mb-1"><strong>Transaction type:</strong> ${rowData.transactionType || "-"}</p>
          <p class="mb-1"><strong>Status:</strong> ${capitalize(rowData.status || "")}</p>
          <p class="mb-1"><strong>Result code:</strong> ${rowData.resultCode || "-"}</p>
          <p class="mb-1"><strong>Result description:</strong> ${escapeHtml(String(rowData.resultDescription || "-"))}</p>
          <p class="mb-1"><strong>UI message:</strong> ${escapeHtml(String(rowData.uiMessage || "-"))}</p>
          <p class="mb-1"><strong>Payer ID:</strong> ${rowData.payerId || "-"}</p>
          <p class="mb-1"><strong>Beneficiary ID:</strong> ${rowData.beneficiaryId || "-"}</p>
          <p class="mb-1"><strong>Recipient ID:</strong> ${rowData.recipientId || "-"}</p>
          <p class="mb-1"><strong>Card:</strong> ${rowData.brand || ""} ${rowData.last4 != null ? "•••• " + rowData.last4 : ""}</p>
          <p class="mb-1"><strong>Schedule ID:</strong> ${rowData.scheduleId || "-"}</p>
          <p class="mb-1"><strong>Subscription ID:</strong> ${rowData.subscriptionId || "-"}</p>
          ${webhookLink}
        </div>
      `;
      const txnId = rowData.transactionId || rowData.gatewayTxnId || rowData.id;
      const encodedPayload = encodeURIComponent(JSON.stringify(rowData));
      const fetchSection = SECTION;
      const fetchEntity = "transaction";
      const axcessBlock = `
        <div class="mt-3 border-top pt-3">
          <button type="button" class="btn btn-outline-primary btn-sm" data-fetch-axcess data-entity="${fetchEntity}" data-id="${escapeHtml(txnId || "")}" data-payload="${encodedPayload}">
            <i class="bi bi-cloud-download me-1"></i> Fetch record from Axcess
          </button>
          <div class="mt-2" data-axcess-result"></div>
        </div>
      `;
      const payloadHtml = `
        <div class="mt-4 border-top pt-3">
          <h6>Full payload</h6>
          <pre class="code-json bg-light p-3 rounded mb-0">${escapeHtml(JSON.stringify(rowData, null, 2))}</pre>
        </div>
      `;
      body.innerHTML = summary + axcessBlock + payloadHtml;
      api.show();
    }
  });
})();
