// User Blocks page
(function () {
  const SECTION = "user-blocks";
  const SCOPES = ["private_chat", "feed", "global"];
  const COMMON_FLAGS = {
    fraud: { text: "Your Account is suspended due to potential fraudulent activities", action: "Contact Support" },
    abuse: { text: "Your Account will be suspended due to reported abusive behavior", action: "Contact Support" },
    violence: { text: "Your Account is suspended due to violence", action: "Contact Support" },
    unacceptable_behavior: { text: "Your Account is suspended due to unacceptable behavior", action: "Contact Support" },
    exploitation: { text: "Your Account is suspended due to exploitation - non-consensual media", action: "Contact Support" },
    hate: { text: "Your Account is suspended due to hateful activities", action: "Contact Support" },
    harassment: { text: "Your Account will be suspended due to harassment and criticism", action: "Contact Support" },
    child_safety: { text: "Your Account is suspended due to child safety", action: "Contact Support" },
    self_injury: { text: "Your Account is suspended due to self-injury or harmful behavior", action: "Contact Support" },
    graphic_violence: { text: "Your Account is suspended due to graphic violence or threats", action: "Contact Support" },
    dangerous_activities: { text: "Your Account is suspended due to dangerous activities", action: "Contact Support" },
    impersonation: { text: "Your Account will be suspended due to impersonation", action: "Contact Support" },
    security: { text: "Your Account is suspended due to site security and access", action: "Contact Support" },
    spam: { text: "Your Account will be suspended due to spam detection", action: "Contact Support" }
  };

  function waitForAdminShell() {
    return new Promise((resolveFn) => {
      if (window.AdminShell && window.AdminShell.pageContent) {
        resolveFn();
      } else {
        document.body.addEventListener("adminshell:ready", resolveFn, { once: true });
      }
    });
  }

  function parseApiConfigBase() {
    try {
      const cfgEl = document.getElementById("api-config");
      if (!cfgEl) return "";
      const cfg = JSON.parse(cfgEl.textContent || "{}");
      const env = window.Env?.current || "dev";
      const sectionCfg = cfg[SECTION];
      const endpoint = sectionCfg?.[env]?.endpoint || "";
      if (endpoint) return endpoint.replace(/\/$/, "");
      const fallback = window.AdminEndpoints?.base?.[env];
      return (fallback || "").replace(/\/$/, "");
    } catch (e) {
      console.warn("[UserBlocks] Failed to parse api-config", e);
      return "";
    }
  }

  function getRoutes() {
    const base = parseApiConfigBase();
    const withBase = (path) => (base ? `${base}${path}` : path);
    return {
      list: withBase("/listUserBlocks"),
      unblock: withBase("/unblockUser"),
      create: withBase("/blockUser")
    };
  }

  function formatScope(scope) {
    if (!scope) return "-";
    return scope.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function formatFlag(flag) {
    if (!flag) return "-";
    return flag.replace(/_/g, " ");
  }

  function isPermanent(row) {
    return row.isPermanent === true || row.is_permanent === true;
  }

  function expiresAtValue(row) {
    return row.expiresAt || row.expires_at;
  }

  function isExpired(row) {
    if (isPermanent(row)) return false;
    if (row.expired === true) return true;
    if (row.deleted_at) return true;
    const exp = expiresAtValue(row);
    if (exp) {
      return new Date(exp).getTime() < Date.now();
    }
    return false;
  }

  function ensureModalViewer() {
    if (window.ModalViewer && typeof window.ModalViewer.init === "function") {
      window.ModalViewer.init();
    }
  }

  function ensureBlockOffcanvas() {
    let el = document.querySelector("#userBlockDetailsOffcanvas");
    if (!el) {
      const wrapper = document.createElement("div");
      wrapper.innerHTML = `
        <div class="offcanvas offcanvas-end offcanvas-details" tabindex="-1" id="userBlockDetailsOffcanvas">
          <div class="offcanvas-header">
            <h5 class="offcanvas-title">User Block</h5>
            <button type="button" class="btn-close" data-bs-dismiss="offcanvas"></button>
          </div>
          <div class="offcanvas-body" id="userBlockDetailsBody"></div>
        </div>
      `;
      document.body.appendChild(wrapper.firstElementChild);
      el = document.querySelector("#userBlockDetailsOffcanvas");
    }
    return { canvas: el, body: document.querySelector("#userBlockDetailsBody"), api: new bootstrap.Offcanvas(el) };
  }

  function formatDate(value) {
    if (!value) return "-";
    const d = new Date(value);
    return isNaN(d.getTime()) ? value : d.toLocaleString();
  }

  function renderBlockDetails(row) {
    const items = [
      { label: "From User", value: row.blocker_id || row.fromUserId || "-" },
      { label: "To User", value: row.blocked_id || row.toUserId || "-" },
      { label: "Scope", value: formatScope(row.scope) },
      { label: "Flag", value: formatFlag(row.flag) },
      { label: "Reason", value: row.reason || "-" },
      { label: "Permanent", value: isPermanent(row) ? "Yes" : "No" },
      { label: "Created", value: formatDate(row.created_at || row.createdAt) },
      { label: "Expires", value: isPermanent(row) ? "Never" : formatDate(expiresAtValue(row)) },
      { label: "Testing", value: row.testing === true ? "Yes" : "No" }
    ];

    const list = items
      .map((item) => `<p class="mb-2"><strong>${item.label}:</strong> ${item.value}</p>`)
      .join("");

    const rawJson = `<pre class="code-json bg-light p-3 rounded">${JSON.stringify(row, null, 2)}</pre>`;
    return `${list}<div class="mt-3 border-top pt-3"><h6>Full Payload</h6>${rawJson}</div>`;
  }

  function buildTableConfig() {
    return {
      id: "user-blocks-table",
      columns: [
        { field: "blocker_id", label: "From User", sortable: true },
        { field: "blocked_id", label: "To User", sortable: true },
        { field: "scope", label: "Scope", formatter: (value) => formatScope(value) },
        { field: "flag", label: "Flag", formatter: (value) => formatFlag(value) },
        { field: "reason", label: "Reason" },
        {
          field: "is_permanent",
          label: "Permanent",
          formatter: (value, row) => (isPermanent(row) ? "Yes" : "No")
        },
        {
          field: "created_at",
          label: "Created",
          sortable: true,
          formatter: (value) => (value ? window.Table.formatters.datetime(value) : "-")
        },
        {
          field: "expires_at",
          label: "Expires",
          formatter: (value, row) => {
            if (isPermanent(row)) return "Never";
            const exp = expiresAtValue(row);
            if (!exp) return "-";
            const expired = isExpired(row);
            const dateText = new Date(exp).toLocaleString();
            return expired ? `${dateText} (Expired)` : dateText;
          }
        },
        { field: "expired", label: "Expired", formatter: (value, row) => (isExpired(row) ? "Yes" : "No") }
      ],
      actions: [
        { label: "View", className: "btn btn-sm btn-outline-primary", onClick: "handleBlockView" },
        {
          label: "Unblock",
          className: "btn btn-sm btn-primary",
          onClick: "handleBlockUnblock",
          confirm: "Unblock this user block?",
          condition: (row) => !row.deleted_at
        }
      ]
    };
  }

  function buildPageConfig() {
    return {
      section: SECTION,
      tableConfig: buildTableConfig(),
      pagination: { enabled: true, pageSize: 20 },
      tabs: []
    };
  }

  function renderFlagOptions() {
    return Object.keys(COMMON_FLAGS)
      .map((flagKey) => `<option value="${flagKey}">${formatFlag(flagKey)}</option>`)
      .join("");
  }

  function renderScopeOptions() {
    return SCOPES.map((scope) => `<option value="${scope}">${formatScope(scope)}</option>`).join("");
  }

  function ensureSystemBlockModal() {
    if (document.getElementById("systemBlockModal")) return;

    const modalWrapper = document.createElement("div");
    modalWrapper.innerHTML = `
      <div class="modal fade" id="systemBlockModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Add System Block</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <form id="systemBlockForm" class="needs-validation" novalidate>
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label">From</label>
                    <input type="text" class="form-control" name="blocker_id" required  value="system" readonly>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">To User ID</label>
                    <input type="text" class="form-control" name="blocked_id" required>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Scope</label>
                    <select class="form-select" name="scope" required>
                      <option value="" selected disabled>Select scope</option>
                      ${renderScopeOptions()}
                    </select>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Flag</label>
                    <select class="form-select" name="flag" required>
                      <option value="" selected disabled>Select flag</option>
                      ${renderFlagOptions()}
                    </select>
                  </div>
                  <div class="col-12">
                    <label class="form-label">Reason</label>
                    <textarea class="form-control" name="reason" rows="2" required></textarea>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Expires At (optional)</label>
                    <input type="datetime-local" class="form-control" name="expiresAt">
                    <div class="form-text">Leave empty for immediate evaluation; permanent overrides expiry.</div>
                  </div>
                  <div class="col-md-6 d-flex align-items-end justify-content-between">
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" id="isPermanentInput" name="isPermanent">
                      <label class="form-check-label" for="isPermanentInput">Permanent</label>
                    </div>
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" id="testingInput" name="testing">
                      <label class="form-check-label" for="testingInput">Testing</label>
                    </div>
                  </div>
                </div>
              </form>
              <div id="systemBlockFormStatus" class="mt-3 small text-muted"></div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" id="saveSystemBlockBtn" class="btn btn-primary">Save Block</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modalWrapper.firstElementChild);
  }

  function serializeForm(formEl) {
    const formData = new FormData(formEl);
    const data = {};
    formData.forEach((value, key) => {
      data[key] = value;
    });

    // Map to API expected fields
    data.from = data.blocker_id || data.fromUserId;
    data.to = data.blocked_id || data.toUserId;
    data.scope = data.scope;
    data.is_permanent = formEl.querySelector("[name='isPermanent']")?.checked || false;

    // expires_at should be Unix seconds
    if (data.expiresAt) {
      const ts = Math.floor(new Date(data.expiresAt).getTime() / 1000);
      if (!Number.isNaN(ts)) data.expires_at = ts;
    }

    // testing: only send when checked
    const testingChecked = formEl.querySelector("[name='testing']")?.checked;
    if (testingChecked) data.testing = true; else delete data.testing;

    // Clean up form-only keys
    delete data.expiresAt;
    delete data.fromUserId;
    delete data.toUserId;

    return data;
  }

  function attachSystemBlockHandlers(routes, pageRenderer) {
    const addBtn = document.getElementById("addSystemBlockBtn");
    if (!addBtn) return;

    ensureSystemBlockModal();
    const modalInstance = new bootstrap.Modal("#systemBlockModal");
    const formEl = document.getElementById("systemBlockForm");
    const statusEl = document.getElementById("systemBlockFormStatus");
    const saveBtn = document.getElementById("saveSystemBlockBtn");

    addBtn.addEventListener("click", () => {
      formEl.reset();
      statusEl.textContent = "";
      modalInstance.show();
    });

    saveBtn.addEventListener("click", async () => {
      if (!formEl.checkValidity()) {
        formEl.classList.add("was-validated");
        return;
      }
      const payload = serializeForm(formEl);
      statusEl.textContent = "Saving...";
      try {
        await window.ApiService._fetchWithTimeout(routes.create, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        statusEl.textContent = "Saved. Refreshing list...";
        modalInstance.hide();
        pageRenderer.reset();
        pageRenderer.render(false);
      } catch (e) {
        statusEl.textContent = e?.message || "Failed to save block";
      }
    });
  }

  window.handleBlockView = (row) => {
    const { canvas, body, api } = ensureBlockOffcanvas();
    const titleEl = canvas.querySelector(".offcanvas-title");
    if (titleEl) {
      const id = row.blockId || row.id || row.sk_scope || "User Block";
      titleEl.textContent = `User Block: ${id}`;
    }
    body.innerHTML = renderBlockDetails(row);
    api.show();
  };

  window.handleBlockUnblock = async (row) => {
    const routes = getRoutes();
    try {
      await window.ApiService._fetchWithTimeout(routes.unblock, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: row.blocker_id || row.fromUserId,
          to: row.blocked_id || row.toUserId,
          scope: row.scope
        })
      });
      alert("Block removed");
      document.body.dispatchEvent(new CustomEvent("section:refresh"));
    } catch (e) {
      alert(e?.message || "Failed to unblock");
    }
  };

  waitForAdminShell().then(async () => {
    if (!window.AdminShell || !window.AdminShell.pageContent) {
      console.error("AdminShell.pageContent is still null after ready event");
      return;
    }

    const pageRenderer = window.PageRenderer.init(buildPageConfig());

    attachSystemBlockHandlers(getRoutes(), pageRenderer);

    document.body.addEventListener("section:refresh", () => {
      pageRenderer.reset();
      pageRenderer.render(false);
    });

    document.body.addEventListener("env:changed", () => {
      pageRenderer.reset();
      pageRenderer.render(false);
    });
  });
})();
