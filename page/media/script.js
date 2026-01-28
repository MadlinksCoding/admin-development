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
          field: "file_size", 
          label: "Size", 
          sortable: true,
          formatter: (value) => {
            if (!value) return '-';
            const size = parseInt(value);
            if (size < 1024) return `${size} B`;
            if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
            if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
            return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
          }
        },
        { 
          field: "updated_at", 
          label: "Updated", 
          sortable: true,
          formatter: (value) => value ? new Date(value).toLocaleDateString() : '-'
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
          label: "Data",
          className: "btn btn-sm btn-primary",
          onClick: "handleMediaData"
        }
      ]
    };

    // Initialize Page
    window.PageRenderer.init({
      section: SECTION,
      tableConfig: MEDIA_TABLE_CONFIG,
      pagination: { enabled: true, pageSize: 10 },
      filters: [
        {
          name: "title",
          label: "Title",
          type: "text",
          placeholder: "Search by title..."
        },
        {
          name: "media_type",
          label: "Media Type",
          type: "select",
          options: [
            { value: "", label: "All Types" },
            { value: "image", label: "Image" },
            { value: "video", label: "Video" },
            { value: "audio", label: "Audio" },
            { value: "file", label: "File" },
            { value: "gallery", label: "Gallery" }
          ]
        },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: [
            { value: "", label: "All Statuses" },
            { value: "published", label: "Published" },
            { value: "scheduled", label: "Scheduled" },
            { value: "draft", label: "Draft" },
            { value: "pending", label: "Pending" }
          ]
        },
        {
          name: "visibility",
          label: "Visibility",
          type: "select",
          options: [
            { value: "", label: "All Visibility" },
            { value: "public", label: "Public" },
            { value: "subscribers", label: "Subscribers" },
            { value: "purchasers", label: "Purchasers" },
            { value: "private", label: "Private" },
            { value: "unlisted", label: "Unlisted" }
          ]
        },
        {
          name: "file_extension",
          label: "File Extension",
          type: "text",
          placeholder: "e.g., jpg, mp4, pdf..."
        },
        {
          name: "file_name",
          label: "File Name",
          type: "text",
          placeholder: "Search by filename..."
        },
        {
          name: "description",
          label: "Description",
          type: "text",
          placeholder: "Search in description..."
        },
        {
          name: "featured",
          label: "Featured Only",
          type: "check"
        },
        {
          name: "coming_soon",
          label: "Coming Soon Only",
          type: "check"
        },
        {
          name: "created_from",
          label: "Created From",
          type: "date"
        },
        {
          name: "created_to",
          label: "Created To",
          type: "date"
        },
        {
          name: "file_size_min",
          label: "Min File Size (KB)",
          type: "number",
          placeholder: "0"
        },
        {
          name: "file_size_max",
          label: "Max File Size (KB)",
          type: "number",
          placeholder: "1000000"
        }
      ]
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
        <div class="mt-4 pt-3 border-top d-flex justify-content-between">
          <button type="button" class="btn btn-outline-danger btn-sm" onclick="handleMediaDelete('${rowData.media_id}')">Delete</button>
          <div class="d-flex gap-2">
            <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Close</button>
          </div>
        </div>
      `;
      modal.modal.show();
    };
    window.handleMediaData = (rowData) => {
      const offcanvasEl = document.getElementById('mediaDataOffcanvas');
      const offcanvasBody = document.getElementById('mediaDataOffcanvasBody');
      const offcanvasTitle = document.getElementById('mediaDataOffcanvasLabel');

      offcanvasTitle.textContent = `Media Data: ${rowData.title || rowData.media_id || 'Unknown'}`;

      offcanvasBody.innerHTML = `
        <div class="mb-3">
          <h6>Full JSON Data</h6>
          <pre class="bg-light p-3 rounded small" style="max-height: 600px; overflow: auto;">${JSON.stringify(rowData, null, 2)}</pre>
        </div>
      `;

      const bsOffcanvas = bootstrap.Offcanvas.getOrCreateInstance(offcanvasEl);
      bsOffcanvas.show();
    };

    // 3. Delete Media
    window.handleMediaDelete = (mediaId) => {
      // Handle both string and object inputs
      if (typeof mediaId === 'object' && mediaId.media_id) {
        mediaId = mediaId.media_id;
      }
      
      const modal = window.ModalViewer;
      modal.init();
      
      // Ensure modal is properly reset
      try {
        if (modal.modal && typeof modal.modal.hide === 'function') {
          modal.modal.hide();
        }
      } catch (e) {
        // Ignore hide errors
      }

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
      
      // Small delay to ensure proper cleanup
      setTimeout(() => {
        modal.modal.show();
      }, 50);

      // Remove any existing handler
      const existingBtn = document.getElementById("confirmDeleteBtn");
      if (existingBtn) {
        existingBtn.onclick = null;
      }

      // Attach handler with timeout to ensure modal is shown
      setTimeout(() => {
        const confirmBtn = document.getElementById("confirmDeleteBtn");
        if (confirmBtn) {
          // Flag to prevent action when modal is closing
          let isModalClosing = false;
          
          // Function to clean up all event listeners
          const cleanup = () => {
            isModalClosing = false;
            confirmBtn.onclick = null;
            // Remove event listeners
            modal.modal._element.removeEventListener('hide.bs.modal', handleHide);
            modal.modal._element.removeEventListener('hidden.bs.modal', handleHidden);
          };
          
          // Event handlers
          const handleHide = () => {
            isModalClosing = true;
          };
          
          const handleHidden = () => {
            cleanup();
            // Force remove any lingering backdrop or modal overlays
            const backdrops = document.querySelectorAll('.modal-backdrop');
            backdrops.forEach(backdrop => backdrop.remove());
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
          };
          
          // Listen for modal hide events (one-time cleanup)
          modal.modal._element.addEventListener('hide.bs.modal', handleHide);
          modal.modal._element.addEventListener('hidden.bs.modal', handleHidden);
          
          confirmBtn.onclick = async () => {
            // Check if modal is closing
            if (isModalClosing || !modal.modal._isShown) return;
            
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
        }
      }, 100);
    };

    /**
     * HELPER FUNCTIONS
     */

    function renderMediaPreview(media) {
      if (media.media_type === 'image') {
        return `<img src="${media.asset_url}" class="img-fluid rounded border" style="max-height: 300px;" onerror="this.outerHTML='<div class=\\'py-5 text-center text-muted\\'><i class=\\'bi bi-image\\' style=\\'font-size: 4rem;\\'></i><p>Image unavailable</p></div>';" />`;
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
      return `${baseUrl}/${section}/${action}${id ? '/' + id : ''}`;
    }
  });
})();
