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
  function isExpired(expiry) {
    if (!expiry) return false;
    try {
      // Support YYYY-MM or MM/YY formats; fallback to Date parsing
      let year, month;
      if (/^\d{4}-\d{2}$/.test(expiry)) {
        const [y, m] = expiry.split("-");
        year = Number(y);
        month = Number(m) - 1; // JS months 0-based
      } else if (/^\d{2}\/\d{2}$/.test(expiry)) {
        const [m, y] = expiry.split("/");
        year = 2000 + Number(y);
        month = Number(m) - 1;
      } else {
        const d = new Date(expiry);
        if (Number.isNaN(d.getTime())) return false;
        return d < new Date();
      }
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);
      return endOfMonth < new Date();
    } catch (e) {
      return false;
    }
  }
  function formatExpiryWithBadge(v) {
    if (!v) return "-";
    const text = String(v);
    const expired = isExpired(v);
    return expired
      ? `${text} <span class="badge bg-primary text-white ms-1">Expired</span>`
      : text;
  }
  function cap(s) { if (!s) return "-"; const x = String(s); return x.charAt(0).toUpperCase() + x.slice(1).toLowerCase(); }
  // Only show masked card: •••• {last4}, never full PAN
  function maskLast4(v) { if (!v) return "-"; return "•••• " + String(v).slice(-4); }
  function escapeHtml(s) {
    if (!s) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function ensurePaymentTokenOffcanvas() {
    let offcanvasElement = document.querySelector("#paymentTokenDetailsOffcanvas");
    if (!offcanvasElement) {
      const wrapperElement = document.createElement("div");
      wrapperElement.innerHTML = `
        <div class="offcanvas offcanvas-end offcanvas-details" tabindex="-1" id="paymentTokenDetailsOffcanvas">
          <div class="offcanvas-header">
            <h5 class="offcanvas-title">Card token</h5>
            <button type="button" class="btn-close" data-bs-dismiss="offcanvas"></button>
          </div>
          <div class="offcanvas-body" id="paymentTokenDetailsBody"></div>
        </div>
      `;
      document.body.appendChild(wrapperElement.firstElementChild);
      offcanvasElement = document.querySelector("#paymentTokenDetailsOffcanvas");
    }
    return {
      canvas: offcanvasElement,
      body: document.querySelector("#paymentTokenDetailsBody"),
      api: new bootstrap.Offcanvas(offcanvasElement),
    };
  }

  waitForAdminShell().then(() => {
    if (!window.AdminShell || !window.AdminShell.pageContent) return;
    const SECTION = "payment-tokens";
    const TABLE_CONFIG = {
      id: "payment-tokens-table",
      columns: [
        { field: "registrationId", label: "Card token ID", sortable: true },
        { field: "createdAt", label: "Created", sortable: true, formatter: (v) => formatDDMMYYYY(v) },
        { field: "type", label: "Card type", sortable: true, formatter: (v) => cap(v || "") },
        { field: "userId", label: "Payer", sortable: true },
        { field: "last4", label: "Card number", sortable: true, formatter: (v) => maskLast4(v) },
        { field: "expiry", label: "Expiry", sortable: true, formatter: (v, row) => formatExpiryWithBadge(v || row.expiry) },
        { field: "name", label: "Name", sortable: true },
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
      { id: "all", label: "All", statusFilter: null }
    ];
    window.PageRenderer.init({ section: SECTION, tableConfig: TABLE_CONFIG, tabFilterKey: "status", tabs: TABS, pagination: { enabled: true, pageSize: 20 } });

    if (!document.body.dataset.paymentTokensViewAttached) {
      document.body.dataset.paymentTokensViewAttached = "true";
      document.body.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-payment-view]");
        if (!btn) return;
        e.preventDefault();
        try {
          const row = JSON.parse(decodeURIComponent(btn.getAttribute("data-payment-view")));
          showTokenView(row);
        } catch (err) {
          console.warn("Failed to decode token row:", err);
        }
      });
    }

    function showTokenView(rowData) {
      if (!rowData) return;
      const { canvas, body, api } = ensurePaymentTokenOffcanvas();
      const titleEl = canvas.querySelector(".offcanvas-title");
      if (titleEl) titleEl.textContent = `Card token: ${rowData.registrationId || rowData.id || "-"}`;

      const created = rowData.createdAt ? formatDDMMYYYY(rowData.createdAt) : "-";
      const updated = rowData.updatedAt ? formatDDMMYYYY(rowData.updatedAt) : "-";
      const expired = isExpired(rowData.expiry);
      const status = rowData.status || (expired ? "expired" : "active");
      const statusLabel = cap(status);

      const webhookLink = rowData.registrationId
        ? `<p class="mb-1"><strong>Webhooks:</strong> <a href="page/payment-webhooks?orderId=${escapeHtml(
            rowData.registrationId
          )}">Open webhooks for ${escapeHtml(rowData.registrationId)}</a></p>`
        : "";
      const summary = `
        <div class="mb-3">
          <p class="mb-1"><strong>pk:</strong> ${rowData.pk || "-"}</p>
          <p class="mb-1"><strong>sk:</strong> ${rowData.sk || "-"}</p>
          <p class="mb-1"><strong>ID:</strong> ${rowData.id || rowData.registrationId || "-"}</p>
          <p class="mb-1"><strong>User ID:</strong> ${rowData.userId || "-"}</p>
          <p class="mb-1"><strong>Gateway:</strong> ${cap(rowData.gateway || "")}</p>
          <p class="mb-1"><strong>Brand:</strong> ${rowData.brand || "-"}</p>
          <p class="mb-1"><strong>Card:</strong> ${maskLast4(rowData.last4)}</p>
          <p class="mb-1"><strong>Expiry:</strong> ${escapeHtml(String(rowData.expiry || "-"))}</p>
          <p class="mb-1"><strong>Status:</strong> ${statusLabel}</p>
          <p class="mb-1"><strong>Card holder:</strong> ${escapeHtml(String(rowData.cardHolder || rowData.name || "-"))}</p>
          <p class="mb-1"><strong>Country:</strong> ${escapeHtml(String(rowData.country || "-"))}</p>
          <p class="mb-1"><strong>Fingerprint:</strong> ${escapeHtml(String(rowData.fingerprint || "-"))}</p>
          <p class="mb-1"><strong>Created at:</strong> ${created}</p>
          <p class="mb-1"><strong>Updated at:</strong> ${updated || "-"}</p>
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
