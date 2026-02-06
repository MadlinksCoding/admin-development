// Wrap in IIFE to avoid polluting global scope
(function () {
  // Wait for AdminShell ready event
  function waitForAdminShell() {
    return new Promise((resolveFunction) => {
      // Check if AdminShell is already ready
      if (window.AdminShell && window.AdminShell.pageContent) {
        // AdminShell is already ready
        resolveFunction();
      } else {
        // Listen for AdminShell ready event
        document.body.addEventListener("adminshell:ready", resolveFunction, { once: true });
      }
    });
  }

  // Format date as DD/MM/YYYY
  function formatDDMMYYYY(value) {
    if (!value) return "-";
    try {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return String(value);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      return String(value);
    }
  }
  function formatDateWithExpiredBadge(value) {
    if (!value) return "-";
    try {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return String(value);
      const text = formatDDMMYYYY(value);
      const isExpired = date < new Date();
      return isExpired ? `${text} <span class="badge bg-warning text-dark ms-1">Expired</span>` : text;
    } catch (error) { return String(value); }
  }

  // In-memory map of creator grants per user
  const creatorGrantsByUser = {};

  function getEndpointForSection(sectionName) {
    try {
      const el = document.getElementById("api-config");
      if (!el) return "";
      const cfg = JSON.parse(el.textContent || "{}");
      const env = window.Env?.current || "dev";
      const endpoint = cfg?.[sectionName]?.[env]?.endpoint || "";
      return String(endpoint || "").trim();
    } catch (e) {
      return "";
    }
  }

  async function loadCreatorGrants() {
    try {
      const base = getEndpointForSection("user-tokens");
      if (!base) return;
      const url = base.replace(/\/$/, "") + "/creator-free-tokens";
      const response = await window.ApiService._fetchWithTimeout(url, { method: "GET" });
      const grants = await response.json();
      const now = new Date();
      grants.forEach((grant) => {
        const userId = grant.userId;
        const creatorId = grant.creatorId;
        const balance = typeof grant.balance === "number" ? grant.balance : 0;
        if (!userId || !creatorId || balance <= 0) return;
        const expiryDate = grant.expiry ? new Date(grant.expiry) : null;
        if (!expiryDate || Number.isNaN(expiryDate.getTime())) return;
        if (expiryDate <= now) return; // only active grants
        if (!creatorGrantsByUser[userId]) creatorGrantsByUser[userId] = [];
        creatorGrantsByUser[userId].push({ creatorId, balance });
      });
    } catch (e) {
      console.warn("Failed to load creator-free-tokens.json", e);
    }
  }

  // This page is shaped to match the TokenManager aggregate:
  // - TokenManager.getUserBalance(userId) returns:
  //   { userId, paidTokens, totalFreeTokens, freeTokensPerBeneficiary: { system, <creatorIds>... } }
  // - Backend for this grid should expose, per user:
  //   userId, paidTokens, systemFreeTokens, creatorFreeTokens (sum of non-system beneficiaries).
  // The mock data in data.json follows this shape so it can be swapped
  // with a real TokenManager-backed endpoint without changing the UI.

  /**
   * Ensure user tokens details offcanvas exists (slide-in view, never popup)
   */
  function ensureUserTokensOffcanvas() {
    let offcanvasElement = document.querySelector("#userTokensDetailsOffcanvas");
    if (!offcanvasElement) {
      const wrapperElement = document.createElement("div");
      wrapperElement.innerHTML = `
        <div class="offcanvas offcanvas-end offcanvas-details" tabindex="-1" id="userTokensDetailsOffcanvas">
          <div class="offcanvas-header">
            <h5 class="offcanvas-title">User Tokens</h5>
            <button type="button" class="btn-close" data-bs-dismiss="offcanvas"></button>
          </div>
          <div class="offcanvas-body" id="userTokensDetailsBody"></div>
        </div>
      `;
      document.body.appendChild(wrapperElement.firstElementChild);
      offcanvasElement = document.querySelector("#userTokensDetailsOffcanvas");
    }
    return {
      canvas: offcanvasElement,
      body: document.querySelector("#userTokensDetailsBody"),
      api: new bootstrap.Offcanvas(offcanvasElement),
    };
  }

  async function fetchUserTokensDrilldown(userId) {
    if (!userId) return null;
    try {
      const baseEndpoint = getEndpointForSection("user-tokens");
      if (!baseEndpoint) return null;
      const url =
        baseEndpoint.replace(/\/$/, "") +
        "/" +
        encodeURIComponent(userId) +
        "/drilldown";
      const response = await window.ApiService._fetchWithTimeout(url, {
        method: "GET",
      });
      return await response.json();
    } catch (error) {
      console.warn("[user-tokens] Failed to fetch drilldown:", error);
      return null;
    }
  }

  function buildFreeExpiryHtml(drilldown) {
    if (!drilldown || !drilldown.freeTokensBreakdown) {
      return '<p class="text-muted mb-0">No free token expiry details available.</p>';
    }
    const sections = [];
    for (const [beneficiaryId, info] of Object.entries(
      drilldown.freeTokensBreakdown
    )) {
      const total = info?.total ?? 0;
      const rows = (info?.byExpiry || []).map((entry) => {
        const expires = entry?.expiresAt
          ? formatDateWithExpiredBadge(entry.expiresAt)
          : "-";
        const amount =
          entry?.amount == null ? "-" : Number(entry.amount).toFixed(2);
        const txId = entry?.transactionId || "-";
        return `
          <tr>
            <td>${expires}</td>
            <td class="text-end">${amount}</td>
            <td class="text-muted">${txId}</td>
          </tr>
        `;
      });
      sections.push(`
        <div class="mb-3">
          <h6 class="mb-1">Beneficiary: ${beneficiaryId}</h6>
          <p class="mb-1"><strong>Total free tokens:</strong> ${Number(
            total
          ).toFixed(2)}</p>
          <div class="table-responsive">
            <table class="table table-sm align-middle mb-0">
              <thead>
                <tr>
                  <th scope="col">Expires at</th>
                  <th scope="col" class="text-end">Amount</th>
                  <th scope="col">Transaction</th>
                </tr>
              </thead>
              <tbody>
                ${rows.join("")}
              </tbody>
            </table>
          </div>
        </div>
      `);
    }
    return sections.join("") || '<p class="text-muted mb-0">No free token expiry details available.</p>';
  }

  async function showUserTokensDetails(row) {
    if (!row || !row.userId) return;
    const { canvas, body, api } = ensureUserTokensOffcanvas();

    const titleEl = canvas.querySelector(".offcanvas-title");
    if (titleEl) {
      titleEl.textContent = `User Tokens: ${row.userId}`;
    }

    body.innerHTML =
      '<div class="text-center text-muted py-3">Loading token details...</div>';
    api.show();

    const drilldown = await fetchUserTokensDrilldown(row.userId);

    const paid = drilldown?.paidTokens ?? row.paidTokens ?? 0;
    const totalFree = drilldown?.totalFreeTokens ?? (row.systemFreeTokens || 0) + (row.creatorFreeTokens || 0);
    const systemFree =
      drilldown?.systemFreeTokens ?? row.systemFreeTokens ?? 0;

    const summaryHtml = `
      <div class="mb-3">
        <h5 class="mb-2">Balance summary</h5>
        <p class="mb-1"><strong>User ID:</strong> ${row.userId}</p>
        <p class="mb-1"><strong>Paid tokens:</strong> ${Number(
          paid
        ).toFixed(2)}</p>
        <p class="mb-1"><strong>Total free tokens:</strong> ${Number(
          totalFree
        ).toFixed(2)}</p>
        <p class="mb-1"><strong>Free (system):</strong> ${Number(
          systemFree
        ).toFixed(2)}</p>
        <p class="mb-1"><strong>Free (creator):</strong> ${Number(
          (row.creatorFreeTokens || 0)
        ).toFixed(2)}</p>
      </div>
    `;

    const expiryHtml = `
      <div class="mt-3 border-top pt-3">
        <h5 class="mb-2">Free tokens by expiry</h5>
        <p class="text-muted small">
          Expiry is per free-credit transaction. This section shows how many free tokens expire when, per beneficiary.
        </p>
        ${buildFreeExpiryHtml(drilldown)}
      </div>
    `;

    body.innerHTML = summaryHtml + expiryHtml;
  }

  // Wait for AdminShell to be available before proceeding
  waitForAdminShell().then(async () => {
    // Verify AdminShell and pageContent are actually ready
    if (!window.AdminShell || !window.AdminShell.pageContent) {
      console.error("AdminShell.pageContent is still null after ready event");
      return;
    }
    // Destructure AdminShell API functions
    const { pageContent, renderChips } = window.AdminShell;
    // Destructure AdminUtils helpers
    const { spinner, formatNumber, errorMessage } = window.AdminUtils;
    // Define section name constant
    const SECTION = "user-tokens";

    // Table configuration (aligned with TokenManager.getUserBalance output)
    const USER_TOKENS_TABLE_CONFIG = {
      id: "user-tokens-table",
      columns: [
        { field: "userId", label: "ID", sortable: true },
        { 
          field: "paidTokens", 
          label: "Paid Tokens", 
          sortable: true,
          formatter: (value) => {
            if (value == null) return "-";
            return Number(value).toFixed(2);
          }
        },
        { 
          field: "systemFreeTokens", 
          label: "Free (System) Tokens", 
          sortable: true,
          formatter: (value) => {
            if (value == null) return "-";
            return Number(value).toFixed(2);
          }
        },
        { 
          field: "creatorFreeTokens", 
          label: "Free (Creator) Tokens", 
          sortable: true,
          formatter: (value, row) => {
            const grants = creatorGrantsByUser[row.userId] || [];
            if (!grants.length) {
              if (value == null || Number(value) === 0) return "-";
              return Number(value).toFixed(2);
            }
            const total = grants.reduce((sum, g) => sum + (g.balance || 0), 0);
            const rowsHtml = grants
              .map(
                (g) =>
                  `<tr><td class="text-muted">${g.creatorId}</td><td class="text-end">${Number(
                    g.balance
                  ).toFixed(2)}</td></tr>`
              )
              .join("");
            return `
              <div>
                <div><strong>${total.toFixed(2)}</strong></div>
                <table class="table table-sm table-borderless mb-0 mt-1">
                  <tbody>${rowsHtml}</tbody>
                </table>
              </div>
            `;
          }
        }
      ],
      actions: [
        {
          label: "View",
          className: "btn btn-sm btn-primary me-1",
          onClick: "handleViewUserTokens",
        },
        { 
          label: "Drilldown as payee", 
          className: "btn btn-sm btn-outline-primary me-1", 
          onClick: "handleDrilldownAsPayee" 
        },
        { 
          label: "Drilldown as beneficiary", 
          className: "btn btn-sm btn-outline-primary me-1", 
          onClick: "handleDrilldownAsBeneficiary" 
        },
        { 
          label: "Transactions (payer)", 
          className: "btn btn-sm btn-outline-secondary me-1", 
          onClick: "handleDrilldownToTransactionsAsPayer" 
        },
        { 
          label: "Transactions (beneficiary)", 
          className: "btn btn-sm btn-outline-secondary", 
          onClick: "handleDrilldownToTransactionsAsBeneficiary" 
        }
      ]
    };

    // Action handlers
    window.handleDrilldownAsPayee = (row) => {
      const userId = row.userId;
      if (!userId) { console.error("User ID not found in row data"); return; }
      try {
        const filters = { payee: userId };
        localStorage.setItem("sales-registry-filters", JSON.stringify(filters));
      } catch (e) { console.warn("Could not save filters to localStorage", e); }
      const base = (window.AdminUtils && window.AdminUtils.getBasePath) ? window.AdminUtils.getBasePath() : "";
      window.location.href = base + "/page/sales-registry?payee=" + encodeURIComponent(userId);
    };

    window.handleDrilldownAsBeneficiary = (row) => {
      const userId = row.userId;
      if (!userId) { console.error("User ID not found in row data"); return; }
      try {
        const filters = { beneficiary: userId };
        localStorage.setItem("sales-registry-filters", JSON.stringify(filters));
      } catch (e) { console.warn("Could not save filters to localStorage", e); }
      const base = (window.AdminUtils && window.AdminUtils.getBasePath) ? window.AdminUtils.getBasePath() : "";
      window.location.href = base + "/page/sales-registry?beneficiary=" + encodeURIComponent(userId);
    };

    window.handleDrilldownToTransactionsAsPayer = (row) => {
      const userId = row.userId;
      if (!userId) { console.error("User ID not found in row data"); return; }
      try {
        const filters = { userId };
        localStorage.setItem("payment-transactions-filters", JSON.stringify(filters));
      } catch (e) { console.warn("Could not save filters to localStorage", e); }
      const base = (window.AdminUtils && window.AdminUtils.getBasePath) ? window.AdminUtils.getBasePath() : "";
      window.location.href = base + "/page/payment-transactions?userId=" + encodeURIComponent(userId);
    };

    window.handleDrilldownToTransactionsAsBeneficiary = (row) => {
      const userId = row.userId;
      if (!userId) { console.error("User ID not found in row data"); return; }
      try {
        const filters = { beneficiaryId: userId };
        localStorage.setItem("payment-transactions-filters", JSON.stringify(filters));
      } catch (e) { console.warn("Could not save filters to localStorage", e); }
      const base = (window.AdminUtils && window.AdminUtils.getBasePath) ? window.AdminUtils.getBasePath() : "";
      window.location.href = base + "/page/payment-transactions?beneficiaryId=" + encodeURIComponent(userId);
    };

    // View handler: slide-in details
    window.handleViewUserTokens = (row) => {
      showUserTokensDetails(row);
    };

    // Use PageRenderer for unified pagination & chips (like Token Registry)
    const PAGE_CONFIG = {
      section: SECTION,
      tableConfig: USER_TOKENS_TABLE_CONFIG,
      pagination: {
        enabled: true,
        pageSize: 20
      },
      tabs: []
    };

    await loadCreatorGrants();
    window.PageRenderer.init(PAGE_CONFIG);
  });
})();
