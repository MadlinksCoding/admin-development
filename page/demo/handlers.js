/**
 * Demo Page Handlers
 * Contains all demo-specific action handlers
 */

(function () {
  'use strict';

  const { spinner, spinnerInline, errorMessage } = window.AdminUtils;

  /**
   * Fetch all items from data.json
   */
  async function fetchAllItems() {
    const currentPathname = window.location.pathname;
    const basePath = currentPathname.substring(0, currentPathname.indexOf("/page/") + 1) || "";
    const dataFileUrl = `${basePath}page/demo/data.json`;
    
    try {
      const response = await fetch(dataFileUrl, { cache: "no-store" });
      if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error("[Demo] Error fetching data:", error);
      return [];
    }
  }

  /**
   * Handle edit action
   */
  window.handleDemoEdit = (row) => {
    const modal = window.ModalViewer;
    modal.init();
    modal.show({
      title: "Edit Item",
      body: `
        <div class="text-center py-4">
          <i class="bi bi-pencil-square text-primary mb-3" style="font-size: 3rem;"></i>
          <h5>Edit functionality placeholder</h5>
          <p class="text-muted">Currently editing: <strong>${row.name}</strong> (ID: ${row.id})</p>
          <button type="button" class="btn btn-primary px-4 mt-3" data-bs-dismiss="modal">Close</button>
        </div>
      `
    });
  };

  /**
   * Handle delete action
   */
  window.handleDemoDelete = (row) => {
    window.Processing.showNotice(`Item deletion simulation for: ${row.name}`, "Deleted");
  };

  /**
   * Handle view all action - opens offcanvas
   */
  window.handleDemoViewAll = async (row) => {
    const offcanvasEl = document.getElementById("viewAllOffcanvas");
    const offcanvasBody = document.getElementById("viewAllOffcanvasBody");
    const offcanvasTitle = document.getElementById("viewAllOffcanvasLabel");

    if (!offcanvasEl || !offcanvasBody) {
      console.error("Offcanvas element not found");
      return;
    }

    const bsOffcanvas = bootstrap.Offcanvas.getOrCreateInstance(offcanvasEl);
    offcanvasTitle.textContent = `Item: ${row.id}`;
    offcanvasBody.innerHTML = spinnerInline(`Loading item details…`);
    bsOffcanvas.show();

    try {
      // Simulate fetch or use row data directly if complete
      const allItems = await fetchAllItems();
      const item = allItems.find((i) => i.id === row.id) || row;

      const fields = [
        { label: "ID", value: item.id },
        { label: "Name", value: item.name },
        { label: "Category", value: item.category || "-" },
        { label: "Status", value: item.status || "-" },
        { label: "Type", value: item.type || "-" },
        { label: "Price", value: item.price ? `$${item.price.toFixed(2)}` : "-" },
        { label: "In Stock", value: item.inStock ? "Yes" : "No" }
      ];

      const fieldsHtml = fields.map(f => `<p class="mb-2"><strong>${f.label}:</strong> ${f.value}</p>`).join("");

      offcanvasBody.innerHTML = `
        <div class="mb-3 d-flex justify-content-between align-items-center">
          <h5 class="mb-0">Item Overview</h5>
          <span class="badge text-bg-primary">${(item.status || "UNKNOWN").toUpperCase()}</span>
        </div>
        <div class="item-details-body">
          ${fieldsHtml}
          ${item.details ? `
            <div class="mt-4 border-top pt-3">
              <h6>Additional Details</h6>
              ${item.details.map(d => `<p class="mb-2"><strong>${d.key}:</strong> ${d.value}</p>`).join("")}
            </div>
          ` : ''}
          <div class="mt-4 border-top pt-3">
            <h6>Full Item Payload</h6>
            <pre class="code-json bg-white border p-3 rounded small" style="max-height: 400px; overflow: auto;">${JSON.stringify(item, null, 2)}</pre>
          </div>
        </div>
      `;
    } catch (loadError) {
      offcanvasBody.innerHTML = errorMessage(loadError);
    }
  };

  // Expose handlers
  window.DemoHandlers = {
    fetchAllItems
  };
})();

