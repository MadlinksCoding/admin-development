// Wrap in IIFE to avoid polluting global scope
(function () {
  // Wait for AdminShell ready event
  function waitForAdminShell() {
    return new Promise((resolveFunction) => {
      if (window.AdminShell && window.AdminShell.pageContent) {
        resolveFunction();
      } else {
        document.body.addEventListener("adminshell:ready", resolveFunction, { once: true });
      }
    });
  }

  // Format date as DD/MM/YYYY for display
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

  // Format full date and time for tooltip (DD/MM/YYYY HH:mm:ss)
  function formatDateTimeTooltip(value) {
    if (!value) return "";
    try {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return String(value);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const seconds = String(date.getSeconds()).padStart(2, "0");
      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    } catch (error) {
      return String(value);
    }
  }

  // Capitalize state (no badge/color) - used for TokenManager.HOLD_STATES ("open", "captured", "reversed")
  function capitalizeState(value) {
    if (!value) return "-";
    const string = String(value);
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  }

  waitForAdminShell().then(() => {
    if (!window.AdminShell || !window.AdminShell.pageContent) {
      console.error("AdminShell.pageContent is still null after ready event");
      return;
    }

    const SECTION = "sales-registry";

    // This grid is a read-only view over the TokenManager TOKEN_REGISTRY table.
    // Backend records contain:
    //   id, userId (payer), beneficiaryId, transactionType, amount,
    //   purpose, refId, createdAt, expiresAt, state (for HOLD), metadata...
    // The UI columns below are a friendly projection of those fields:
    //   - ID -> id
    //   - Created -> createdAt
    //   - Type -> transactionType
    //   - Payer -> userId
    //   - Beneficiary -> beneficiaryId
    //   - Amount -> amount
    //   - Purpose -> purpose
    //   - State -> state (HOLD lifecycle; may be empty for other types)
    //   - Reference -> refId

    // Check for URL parameters from user-tokens drilldown
    const urlParams = new URLSearchParams(window.location.search);
    const payeeParam = urlParams.get("payee");
    const beneficiaryParam = urlParams.get("beneficiary");

    // Initialize filters from URL if present
    const existingFilters = window.StateManager.getFilters(SECTION);
    const hasUrlParams = payeeParam || beneficiaryParam;
    const hasExisting = Object.keys(existingFilters).length > 0;

    if (hasUrlParams || !hasExisting) {
      const filters = { ...existingFilters };
      if (payeeParam) filters.payee = payeeParam;
      if (beneficiaryParam) filters.beneficiary = beneficiaryParam;
      window.StateManager.setFilters(SECTION, filters);
    }

    // Clear any stored drilldown filters from localStorage
    try {
      const stored = localStorage.getItem("sales-registry-filters");
      if (stored) {
        const parsed = JSON.parse(stored);
        const current = window.StateManager.getFilters(SECTION);
        window.StateManager.setFilters(SECTION, { ...current, ...parsed });
        localStorage.removeItem("sales-registry-filters");
      }
    } catch (error) {
      console.warn("Could not read sales-registry-filters from localStorage", error);
    }

    // Ensure slide-in offcanvas exists for Token Registry view
    function ensureTokenRegistryOffcanvas() {
      let offcanvasElement = document.querySelector("#tokenRegistryDetailsOffcanvas");
      if (!offcanvasElement) {
        const wrapperElement = document.createElement("div");
        wrapperElement.innerHTML = `
          <div class="offcanvas offcanvas-end offcanvas-details" tabindex="-1" id="tokenRegistryDetailsOffcanvas">
            <div class="offcanvas-header">
              <h5 class="offcanvas-title">Token Registry Record</h5>
              <button type="button" class="btn-close" data-bs-dismiss="offcanvas"></button>
            </div>
            <div class="offcanvas-body" id="tokenRegistryDetailsBody"></div>
          </div>
        `;
        document.body.appendChild(wrapperElement.firstElementChild);
        offcanvasElement = document.querySelector("#tokenRegistryDetailsOffcanvas");
      }
      return {
        canvas: offcanvasElement,
        body: document.querySelector("#tokenRegistryDetailsBody"),
        api: new bootstrap.Offcanvas(offcanvasElement),
      };
    }

    // Table configuration
    const SALES_REGISTRY_TABLE_CONFIG = {
      id: "sales-registry-table",
      columns: [
        {
          field: "id",
          label: "ID",
          sortable: true
        },
        {
          field: "createdAt",
          label: "Created",
          sortable: true,
          formatter: (value) => {
            const display = formatDDMMYYYY(value);
            if (display === "-" || !value) return display;
            const tooltip = formatDateTimeTooltip(value);
            return `<span title="${tooltip.replace(/"/g, "&quot;")}">${display}</span>`;
          }
        },
        {
          field: "transactionType",
          label: "Type",
          sortable: true,
          formatter: (value) => capitalizeState(value || "")
        },
        {
          field: "userId",
          label: "Payer",
          sortable: true
        },
        {
          field: "beneficiaryId",
          label: "Beneficiary",
          sortable: true
        },
        {
          field: "amount",
          label: "Amount",
          sortable: true,
          formatter: (value) => {
            if (value == null) return "-";
            return Number(value).toFixed(2);
          }
        },
        {
          field: "purpose",
          label: "Purpose",
          sortable: true
        },
        {
          field: "state",
          label: "State",
          sortable: true,
          formatter: (value) => capitalizeState(value || "")
        },
        {
          field: "actions",
          label: "Actions",
          formatter: (value, row) => {
            const rowDataEncoded = encodeURIComponent(JSON.stringify(row));
            return `<button class="btn btn-sm btn-primary" data-token-registry='${rowDataEncoded}'>View</button>`;
          }
        }
      ]
    };

    // Tabs:
    // - All: no extra filters
    // - Open holds: TokenManager.HOLD_STATES.OPEN + transactionType=HOLD
    const TABS = [
      { id: "all", label: "All", statusFilter: null },
      // Held = open HOLD transactions (TokenManager.HOLD_STATES.OPEN)
      { id: "open-holds", label: "Held", statusFilter: "open", filterKey: "type", filterValue: "HOLD" }
    ];

    // Page configuration for PageRenderer
    const PAGE_CONFIG = {
      section: SECTION,
      tableConfig: SALES_REGISTRY_TABLE_CONFIG,
      tabFilterKey: "state",
      tabs: TABS,
      pagination: {
        enabled: true,
        pageSize: 20
      }
    };

    // Initialize page renderer
    window.PageRenderer.init(PAGE_CONFIG);

    // Attach Token Registry view handler (once, via event delegation)
    if (!document.body.dataset.tokenRegistryViewAttached) {
      document.body.dataset.tokenRegistryViewAttached = "true";

      document.body.addEventListener("click", (event) => {
        const buttonElement = event.target.closest("[data-token-registry]");
        if (!buttonElement) return;

        event.preventDefault();

        const encodedRowData = buttonElement.getAttribute("data-token-registry");
        if (!encodedRowData) return;

        let rowData = null;
        try {
          rowData = JSON.parse(decodeURIComponent(encodedRowData));
        } catch (decodeError) {
          console.warn("Failed to decode token registry row data:", decodeError);
          return;
        }

        showTokenRegistryDetails(rowData);
      });
    }

    /**
     * Show Token Registry record details in a structured slide-in offcanvas:
     * - Important summary fields at the top (including expiresAt)
     * - Full table payload (JSON) at the bottom
     */
    function showTokenRegistryDetails(rowData) {
      if (!rowData) return;

      const { canvas, body, api } = ensureTokenRegistryOffcanvas();

      const titleEl = canvas.querySelector(".offcanvas-title");
      if (titleEl) {
        titleEl.textContent = `Token Registry Record: ${rowData.id || "-"}`;
      }

      // Build summary section with the most important fields (top of modal)
      // Map from grid field names (createdAt, transactionType, userId, etc.)
      const createdDisplay = formatDateTimeTooltip(rowData.createdAt);
      const expiresDisplay = rowData.expiresAt
        ? formatDateTimeTooltip(rowData.expiresAt)
        : "-";
      const amountDisplay =
        rowData.amount == null ? "-" : Number(rowData.amount).toFixed(2);

      const summaryHtml = `
        <div class="mb-3">
          <h5 class="mb-2">Token Registry Record</h5>
          <p class="mb-1"><strong>Transaction ID:</strong> ${rowData.id || "-"}</p>
          <p class="mb-1"><strong>Created:</strong> ${createdDisplay || "-"}</p>
          <p class="mb-1"><strong>Type:</strong> ${capitalizeState(rowData.transactionType || "")}</p>
          <p class="mb-1"><strong>Payer:</strong> ${rowData.userId || "-"}</p>
          <p class="mb-1"><strong>Beneficiary:</strong> ${rowData.beneficiaryId || "-"}</p>
          <p class="mb-1"><strong>Amount:</strong> ${amountDisplay}</p>
          <p class="mb-1"><strong>Purpose:</strong> ${rowData.purpose || "-"}</p>
          <p class="mb-1"><strong>State:</strong> ${capitalizeState(rowData.state || "")}</p>
          <p class="mb-1"><strong>Expires at (free tokens only):</strong> ${expiresDisplay}</p>
          <p class="mb-1"><strong>Reference ID:</strong> ${rowData.refId || "-"}</p>
        </div>
      `;

      // Full payload section – mirrors Moderation slide-in styling
      const fullPayloadHtml = `
        <div class="mt-4 border-top pt-3">
          <h6>Full Table Payload</h6>
          <pre class="code-json bg-light p-3 rounded mb-0">${JSON.stringify(
            rowData,
            null,
            2
          )}</pre>
        </div>
      `;

      body.innerHTML = summaryHtml + fullPayloadHtml;
      api.show();
    }
  });
})();
