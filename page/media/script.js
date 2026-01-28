// Wrap in IIFE to avoid polluting global scope
(function () {
  'use strict';

  // Wait for AdminShell to be available before proceeding
  function waitForAdminShell() {
    return new Promise((resolve) => {
      if (window.AdminShell && window.AdminShell.pageContent) resolve();
      else document.body.addEventListener("adminshell:ready", resolve, { once: true });
    });
  }

  waitForAdminShell().then(() => {
    const SECTION = "media";

    /**
     * Media Table Configuration
     * Uses core Table component's action system
     */
    const MEDIA_TABLE_CONFIG = {
      id: "media-table",
      columns: [
        { 
          field: "asset_url", 
          label: "Preview",
          formatter: (value, row) => {
            if (row.media_type === 'image') {
              return `<img src="${value}" class="rounded border" width="40" height="40" style="object-fit: cover;" onerror="this.src='assets/img/placeholder.png'">`;
            } else if (row.media_type === 'video') {
              return `<div class="rounded border bg-dark d-flex align-items-center justify-content-center" width="40" height="40" style="width:40px; height:40px;"><i class="bi bi-play-fill text-white"></i></div>`;
            } else if (row.media_type === 'audio') {
              return `<div class="rounded border bg-light d-flex align-items-center justify-content-center" width="40" height="40" style="width:40px; height:40px;"><i class="bi bi-music-note"></i></div>`;
            }
            return `<div class="rounded border bg-light d-flex align-items-center justify-content-center" width="40" height="40" style="width:40px; height:40px;"><i class="bi bi-file-earmark"></i></div>`;
          }
        },
        { 
          field: "title", 
          label: "Title", 
          sortable: true,
          formatter: (value) => `<strong>${value || 'Untitled'}</strong>`
        },
        { 
          field: "media_type", 
          label: "Type", 
          sortable: true,
          formatter: (value) => {
            const types = { 
              image: 'bg-primary-subtle text-primary', 
              video: 'bg-danger-subtle text-danger', 
              audio: 'bg-warning-subtle text-warning',
              file: 'bg-secondary-subtle text-secondary',
              gallery: 'bg-info-subtle text-info'
            };
            const badgeClass = types[value?.toLowerCase()] || 'bg-light text-dark';
            return `<span class="badge ${badgeClass} text-uppercase" style="font-size: 0.7rem;">${value || 'other'}</span>`;
          }
        },
        { 
          field: "status", 
          label: "Status", 
          sortable: true,
          formatter: (value) => {
            const statuses = { 
              published: 'bg-success', 
              scheduled: 'bg-info', 
              draft: 'bg-secondary',
              pending: 'bg-warning text-dark'
            };
            const badgeClass = statuses[value?.toLowerCase()] || 'bg-secondary';
            return `<span class="badge ${badgeClass}">${value || 'unknown'}</span>`;
          }
        },
        { 
          field: "visibility", 
          label: "Visibility", 
          sortable: true,
          formatter: (value) => {
            const icons = {
              public: 'bi-globe-americas text-success',
              subscribers: 'bi-people-fill text-primary',
              purchasers: 'bi-currency-dollar text-warning',
              private: 'bi-lock-fill text-danger',
              unlisted: 'bi-eye-slash-fill text-secondary'
            };
            const icon = icons[value?.toLowerCase()] || 'bi-question-circle';
            return `<span class="text-nowrap small"><i class="bi ${icon} me-1"></i>${value || 'public'}</span>`;
          }
        },
        { 
          field: "owner_user_id", 
          label: "Owner", 
          sortable: true,
          formatter: (value) => `<code class="small">${value || '-'}</code>`
        },
        { 
          field: "created_at", 
          label: "Created", 
          sortable: true,
          formatter: (value) => value ? new Date(value).toLocaleDateString() : '-'
        }
      ],
      actions: [
        {
          label: "View",
          className: "btn btn-sm btn-outline-primary",
          onClick: "handleMediaView"
        },
        {
          label: "Edit",
          className: "btn btn-sm btn-primary",
          onClick: "handleMediaEdit"
        }
      ]
    };

    // Initialize Page
    window.PageRenderer.init({
      section: SECTION,
      tableConfig: MEDIA_TABLE_CONFIG,
      pagination: { enabled: true, pageSize: 10 }
    });

    /**
     * GLOBAL ACTION HANDLERS
     */

    // 1. View Media Details
    window.handleMediaView = async (rowData) => {
      const modal = window.ModalViewer;
      modal.init();
      
      const titleEl = document.querySelector("#viewModal .modal-title");
      if (titleEl) titleEl.textContent = `Media Details: ${rowData.title}`;

      modal.body.innerHTML = `
        <div class="media-preview-container mb-4 text-center bg-light rounded p-3">
          ${renderMediaPreview(rowData)}
        </div>
        <div class="row g-3">
          <div class="col-md-6">
            <label class="small text-muted d-block">Media ID</label>
            <code>${rowData.media_id}</code>
          </div>
          <div class="col-md-6">
            <label class="small text-muted d-block">Owner ID</label>
            <code>${rowData.owner_user_id}</code>
          </div>
          <div class="col-md-4">
            <label class="small text-muted d-block">Type</label>
            <span class="badge bg-info">${rowData.media_type}</span>
          </div>
          <div class="col-md-4">
            <label class="small text-muted d-block">Visibility</label>
            <span class="badge bg-primary">${rowData.visibility}</span>
          </div>
          <div class="col-md-4">
            <label class="small text-muted d-block">Status</label>
            <span class="badge bg-success">${rowData.status}</span>
          </div>
          <div class="col-12">
            <label class="small text-muted d-block">URL</label>
            <a href="${rowData.asset_url}" target="_blank" class="text-break small">${rowData.asset_url}</a>
          </div>
          <div class="col-12">
            <label class="small text-muted d-block">Description</label>
            <p class="small mb-0">${rowData.description || 'No description provided.'}</p>
          </div>
        </div>
        <div class="mt-4 pt-3 border-top">
          <h6 class="small fw-bold mb-2">Meta Data</h6>
          <pre class="bg-dark text-light p-2 rounded small" style="max-height: 200px; overflow: auto;">${JSON.stringify(rowData, null, 2)}</pre>
        </div>
      `;
      modal.modal.show();
    };

    // 2. Edit Media
    window.handleMediaEdit = (rowData) => {
      const modal = window.ModalViewer;
      modal.init();
      
      const titleEl = document.querySelector("#viewModal .modal-title");
      if (titleEl) titleEl.textContent = `Edit Media: ${rowData.title}`;

      modal.body.innerHTML = `
        <form id="editMediaForm">
          <div class="row g-3">
            <div class="col-12">
              <label class="form-label small fw-bold">Title</label>
              <input type="text" class="form-control form-control-sm" name="title" value="${rowData.title || ''}" required>
            </div>
            <div class="col-md-6">
              <label class="form-label small fw-bold">Visibility</label>
              <select class="form-select form-select-sm" name="visibility">
                <option value="public" ${rowData.visibility === 'public' ? 'selected' : ''}>Public</option>
                <option value="subscribers" ${rowData.visibility === 'subscribers' ? 'selected' : ''}>Subscribers</option>
                <option value="purchasers" ${rowData.visibility === 'purchasers' ? 'selected' : ''}>Purchasers</option>
                <option value="private" ${rowData.visibility === 'private' ? 'selected' : ''}>Private</option>
                <option value="unlisted" ${rowData.visibility === 'unlisted' ? 'selected' : ''}>Unlisted</option>
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label small fw-bold">Status</label>
              <select class="form-select form-select-sm" name="status">
                <option value="published" ${rowData.status === 'published' ? 'selected' : ''}>Published</option>
                <option value="scheduled" ${rowData.status === 'scheduled' ? 'selected' : ''}>Scheduled</option>
                <option value="draft" ${rowData.status === 'draft' ? 'selected' : ''}>Draft</option>
              </select>
            </div>
            <div class="col-12">
              <label class="form-label small fw-bold">Description</label>
              <textarea class="form-control form-control-sm" name="description" rows="3">${rowData.description || ''}</textarea>
            </div>
            <div class="col-md-6">
               <div class="form-check form-switch mt-2">
                 <input class="form-check-input" type="checkbox" name="featured" ${rowData.featured ? 'checked' : ''}>
                 <label class="form-check-label small">Featured</label>
               </div>
            </div>
            <div class="col-md-6">
               <div class="form-check form-switch mt-2">
                 <input class="form-check-input" type="checkbox" name="coming_soon" ${rowData.coming_soon ? 'checked' : ''}>
                 <label class="form-check-label small">Coming Soon</label>
               </div>
            </div>
          </div>
          <div class="mt-4 pt-3 border-top d-flex justify-content-between">
            <button type="button" class="btn btn-outline-danger btn-sm" onclick="handleMediaDelete('${rowData.media_id}')">Delete Item</button>
            <div class="d-flex gap-2">
              <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-primary btn-sm px-4">Save Changes</button>
            </div>
          </div>
        </form>
      `;
      modal.modal.show();

      document.getElementById("editMediaForm").onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const updates = Object.fromEntries(formData);
        updates.featured = formData.has('featured');
        updates.coming_soon = formData.has('coming_soon');

        await window.Processing.process(async () => {
          const url = await resolveEndpoint("media", "updateMediaItem", rowData.media_id);
          const res = await window.ApiService._fetchWithTimeout(url, { 
            method: "PUT", 
            body: JSON.stringify(updates),
            headers: { 'x-actor-user-id': 'admin-user' }
          });
          const result = await res.json();
          if (!result.success) throw new Error(result.message || "Update failed");
          
          modal.modal.hide();
          document.body.dispatchEvent(new CustomEvent('section:refresh'));
        }, "Saving changes...", "Media updated successfully!");
      };
    };

    // 3. Delete Media
    window.handleMediaDelete = (mediaId) => {
      const modal = window.ModalViewer;
      modal.init();

      const titleEl = document.querySelector("#viewModal .modal-title");
      if (titleEl) titleEl.textContent = "Confirm Delete";

      modal.body.innerHTML = `
        <div class="text-center py-3">
          <i class="bi bi-exclamation-triangle text-danger mb-3" style="font-size: 3rem;"></i>
          <h5>Delete media item?</h5>
          <p class="text-muted">This will soft-delete the media item <strong>${mediaId}</strong>.</p>
          <div class="mt-4 d-flex justify-content-center gap-2">
            <button type="button" class="btn btn-secondary px-4" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-danger px-4" id="confirmDeleteBtn">Delete</button>
          </div>
        </div>
      `;
      modal.modal.show();

      document.getElementById("confirmDeleteBtn").onclick = async () => {
        await window.Processing.process(async () => {
          const url = await resolveEndpoint("media", "deleteMediaItem", mediaId);
          const res = await window.ApiService._fetchWithTimeout(url, { 
            method: "DELETE",
            headers: { 'x-actor-user-id': 'admin-user' }
          });
          const result = await res.json();
          if (!result.success) throw new Error(result.message || "Deletion failed");

          modal.modal.hide();
          document.body.dispatchEvent(new CustomEvent('section:refresh'));
        }, "Deleting...", "Media deleted.");
      };
    };

    /**
     * HELPER FUNCTIONS
     */

    function renderMediaPreview(media) {
      if (media.media_type === 'image') {
        return `<img src="${media.asset_url}" class="img-fluid rounded border" style="max-height: 300px;">`;
      } else if (media.media_type === 'video') {
        return `<video src="${media.asset_url}" controls class="img-fluid rounded border" style="max-height: 300px; width: 100%;"></video>`;
      } else if (media.media_type === 'audio') {
        return `<audio src="${media.asset_url}" controls class="w-100 mt-3"></audio>`;
      }
      return `<div class="py-5"><i class="bi bi-file-earmark-text" style="font-size: 4rem;"></i><p>${media.file_name || 'Generic File'}</p></div>`;
    }

    async function resolveEndpoint(section, action, id = "") {
      const pageApiConfig = JSON.parse(document.getElementById("api-config").textContent);
      const currentEnv = window.Env?.current || "dev";
      const config = pageApiConfig[section]?.[currentEnv];
      let baseUrl = config?.endpoint?.match(/^https?:\/\/[^\/]+/)?.[0] || "";
      if (!baseUrl) baseUrl = (window.AdminEndpoints?.base || {})[currentEnv] || "";
      // If still empty (e.g. dev with no endpoint), return default path
      const base = baseUrl || "";
      return `${base}/media/${action}${id ? '/' + id : ''}`;
    }
  });
})();
