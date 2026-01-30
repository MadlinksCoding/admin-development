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
          field: "id", 
          label: "Id", 
          sortable: true,
          formatter: (value) => `<span>${value || 'Untitled'}</span>`
        },
          { 
          field: "media_id", 
          label: "mediaId", 
          sortable: true,
          formatter: (value) => `<span>${value || 'Untitled'}</span>`
        },
        { 
          field: "title", 
          label: "Title", 
          sortable: true,
          formatter: (value) => `<span>${value || 'Untitled'}</span>`
        },
        { 
          field: "media_type", 
          label: "Type", 
          sortable: true,
          formatter: (value) => {
            return `<span class="text-uppercase">${value || 'other'}</span>`;
          }
        },
        { 
          field: "status", 
          label: "Status", 
          sortable: true,
          formatter: (value) => {
          
            return `<span class="text-nowrap small">${value || 'unknown'}</span>`;
          }
        },
        { 
          field: "visibility", 
          label: "Visibility", 
          sortable: true,
          formatter: (value) => {
            return `<span class="text-nowrap small">${value || 'public'}</span>`;
          }
        },
        { 
          field: "owner_user_id", 
          label: "Owner", 
          sortable: true,
          formatter: (value) => `<span class="text-nowrap small">${value || '-'}</span>`
        },
        { 
          field: "file_size_bytes", 
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
          field: "featured", 
          label: "featured", 
          sortable: true,
          formatter: (value) => {
            const val = String(!!value);
            const badgeClass = val === 'true' ? 'bg-primary-subtle text-primary' : 'text-muted';
            return `<span class="badge ${badgeClass} text-uppercase" style="font-size: 0.7rem;">${val}</span>`;
          }
        },
         { 
          field: "coming_soon", 
          label: "commingSoon", 
          sortable: true,
          formatter: (value) => {
            const val = String(!!value);
            const badgeClass = val === 'true' ? 'bg-primary-subtle text-primary' : 'text-muted';
            return `<span class="badge ${badgeClass} text-uppercase" style="font-size: 0.7rem;">${val}</span>`;
          }
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
      pagination: { enabled: true, pageSize: 10 }
    });

    /**
     * GLOBAL ACTION HANDLERS
     */

    // 1. View Media (Preview Modal like Moderation)
    window.handleMediaView = (rowData) => {
      const modal = window.ModalViewer;
      modal.init();
      
      const titleEl = document.querySelector("#viewModal .modal-title");
      if (titleEl) titleEl.textContent = `Preview: ${rowData.title || rowData.media_id}`;

      // Detect type
      const typeInfo = window.ContentTypeDetector.detect(rowData);
      const url = rowData.url || rowData.content?.url || "";

      let mediaHtml = "";
      if (url) {
        if (typeInfo.type === 'image') {
          mediaHtml = `<img src="${url}" class="img-fluid rounded border shadow-sm" style="max-height: 500px;">`;
        } else if (typeInfo.type === 'video') {
          mediaHtml = `<video src="${url}" controls class="img-fluid rounded border shadow-sm" style="max-height: 500px;"></video>`;
        } else {
          mediaHtml = `<div class="bg-light p-5 border rounded text-center"><i class="bi bi-file-earmark-play" style="font-size: 3rem;"></i><p class="mt-2">${typeInfo.displayLabel}</p></div>`;
        }
      } else {
        mediaHtml = `<div class="alert alert-warning">No preview URL available</div>`;
      }

      modal.body.innerHTML = `
        <div class="text-center mb-4">
          ${mediaHtml}
        </div>
        <div class="row g-3 small">
          <div class="col-md-6"><strong>Title:</strong> ${rowData.title || '-'}</div>
          <div class="col-md-6"><strong>Type:</strong> ${rowData.media_type || '-'}</div>
          <div class="col-md-12 text-break"><strong>URL:</strong> <a href="${url}" target="_blank">${url}</a></div>
        </div>
        <div class="mt-4 pt-3 border-top d-flex justify-content-between">
          <button type="button" class="btn btn-outline-primary btn-sm" onclick='handleMediaDelete(${JSON.stringify(rowData)})'>
             <i class="bi bi-trash me-1"></i>Delete
          </button>
          <button type="button" class="btn btn-outline-primary btn-sm" data-bs-dismiss="modal">Close</button>
        </div>
      `;
      modal.modal.show();
    };

    // 2. Data View (Slide-in Offcanvas)
    window.handleMediaData = (rowData) => {
      window.MediaUtils.showMediaDetailsOffcanvas(rowData);
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
          <i class="bi bi-exclamation-triangle text-primary mb-3" style="font-size: 3rem;"></i>
          <h5>Delete media item?</h5>
          <p class="text-muted">This will soft-delete the media item <strong>${mediaId}</strong>.</p>
          <div class="mt-4 d-flex justify-content-center gap-2">
            <button type="button" class="btn btn-outline-primary px-4" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary px-4" id="confirmDeleteBtn">Delete</button>
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
              const res = await window.ApiService.delete("media", `deleteMediaItem/${mediaId}`, { 
                'x-actor-user-id': 'admin-user' 
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


  });
})();
