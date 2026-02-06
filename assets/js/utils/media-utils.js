/**
 * Media Utilities
 * Contains all media-specific formatting and display logic
 */

(function () {
  'use strict';

  const { spinnerInline, errorMessage } = window.AdminUtils;

  /**
   * Format date/time value
   */
  function formatDateTime(dateValue) {
    if (!dateValue) return "-";
    try {
      const date = typeof dateValue === "number" ? new Date(dateValue) : new Date(dateValue);
      // Check if date is valid
      if (isNaN(date.getTime()) || date.getTime() <= 0) {
        return "-";
      }
      return date.toLocaleString();
    } catch (e) {
      return "-";
    }
  }

  /**
   * Format a field label (capitalize and add spaces)
   */
  function formatFieldLabel(key) {
    if (!key) return '';
    
    // Special cases for common abbreviations
    const specialCases = {
      'id': 'ID',
      'uid': 'UID',
      'url': 'URL',
      'asset_url': 'Asset URL',
      'html': 'HTML',
      'json': 'JSON',
      'size': 'Size',
      'type': 'Type'
    };
    
    // Split by camelCase and underscores
    let formatted = key
      .replace(/([A-Z])/g, ' $1')  // Add space before capital letters
      .replace(/_/g, ' ')           // Replace underscores with spaces
      .trim();
    
    // Capitalize first letter of each word and handle special cases
    formatted = formatted
      .split(' ')
      .map(word => {
        const wordLower = word.toLowerCase();
        // Check if word is a special case
        if (specialCases[wordLower]) {
          return specialCases[wordLower];
        }
        // Capitalize first letter
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
    
    return formatted;
  }

  /**
   * Format a field value for display
   */
  function formatFieldValue(value, key) {
    if (value === null || value === undefined) {
      return "-";
    }
    
    const keyLower = (key || '').toLowerCase();
    
    // Handle booleans (specifically for featured and coming_soon)
    if (typeof value === "boolean") {
      return String(value);
    }

    // Handle string booleans (sometimes mock data has these)
    if (value === "true" || value === "false") {
      return value === "true" ? "true" : "false";
    }

    // Handle dates
    const dateFields = ['createdAt', 'updatedAt', 'deletedAt', 'timestamp', 'published_at', 'created_at', 'updated_at'];
    if (dateFields.some(df => keyLower === df.toLowerCase() || keyLower.endsWith(df.toLowerCase()))) {
      return formatDateTime(value);
    }

    // Handle file sizes (bytes to readable)
    if (keyLower.includes('size') && typeof value === 'number') {
        if (value === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(value) / Math.log(k));
        return parseFloat((value / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Handle arrays
    if (Array.isArray(value)) {
      if (value.length === 0) return "-";
      return `[${value.length} item${value.length !== 1 ? 's' : ''}]`;
    }
    
    // Handle objects
    if (typeof value === "object") {
      return `{Object}`;
    }
    
    return String(value);
  }

  /**
   * Ensure media offcanvas exists
   */
  function ensureMediaOffcanvas() {
    let offcanvasElement = document.querySelector("#mediaDetailsOffcanvas");
    if (!offcanvasElement) {
      const wrapperElement = document.createElement("div");
      wrapperElement.innerHTML = `
        <div class="offcanvas offcanvas-end offcanvas-details" tabindex="-1" id="mediaDetailsOffcanvas">
          <div class="offcanvas-header">
            <h5 class="offcanvas-title">Media Details</h5>
            <button type="button" class="btn-close" data-bs-dismiss="offcanvas"></button>
          </div>
          <div class="offcanvas-body" id="mediaDetailsBody"></div>
        </div>
      `;
      document.body.appendChild(wrapperElement.firstElementChild);
      offcanvasElement = document.querySelector("#mediaDetailsOffcanvas");
    }
    return {
      canvas: offcanvasElement,
      body: document.querySelector("#mediaDetailsBody"),
      api: new bootstrap.Offcanvas(offcanvasElement)
    };
  }

  /**
   * Show media details offcanvas
   * @param {Object} rowData - Full data for the media item
   */
  function showMediaDetailsOffcanvas(rowData) {
    if (!rowData) {
      if (window.Processing) {
        window.Processing.showErrorNotice("Row data is required.", "Error");
      }
      return;
    }

    const { canvas, body, api } = ensureMediaOffcanvas();
    
    body.innerHTML = spinnerInline("Loading details...");
    
    const mediaId = rowData.id || rowData.media_id || "Unknown";
    const titleEl = canvas.querySelector(".offcanvas-title");
    if (titleEl) {
      titleEl.textContent = `Media Item: ${mediaId}`;
    }

    api.show();

    try {
      const recordData = rowData;
      
      // Critical fields to show in the summary (to save space)
      const importantFields = ['media_id', 'owner_user_id', 'media_type', 'status', 'visibility', 'collection_id', 'title', 'asset_url'];
      
      const fields = [];
      for (const key of importantFields) {
        if (recordData.hasOwnProperty(key)) {
          const value = recordData[key];
          if (value !== null && value !== undefined) {
             fields.push({
               label: formatFieldLabel(key),
               value: formatFieldValue(value, key)
             });
          }
        }
      }

      const fieldsHtml = fields.map(field => 
        `<p class="mb-2"><strong>${field.label}:</strong> ${field.value}</p>`
      ).join("");

      // Display content/media preview using ContentTypeDetector
      // Removed per user request to only show payload and fields
      let previewHtml = "";

      // Get previous moderation updates from history or notes
      const history = recordData.meta?.history || [];
      const notes = recordData.notes || [];
      const previousUpdates = [...history, ...notes].sort((a, b) => {
        const timeA = a.timestamp || a.addedAt || 0;
        const timeB = b.timestamp || b.addedAt || 0;
        return timeB - timeA;
      });

      let previousUpdatesHtml = "";
      if (previousUpdates.length > 0) {
        previousUpdatesHtml = `
          <div class="mt-4 border-top pt-4">
            <h6>Previous Updates / History</h6>
            ${previousUpdates.map((update, index) => {
              const updateType = update.action || update.type || "Update";
              const updateTime = formatDateTime(update.timestamp || update.addedAt || update.createdAt);
              const updateUser = update.userId || update.addedBy || update.createdBy || "-";
              
              let noteDisplay = "";
              // Support for new notes schema
              if (update.text) {
                const isPublic = update.isPublic === true;
                noteDisplay = `<div class="ps-2 border-start mt-1"><strong>${isPublic ? 'Public' : 'Private'}:</strong> ${update.text}</div>`;
              } else if (update.publicNote) {
                noteDisplay = `<div class="ps-2 border-start mt-1"><strong>Public:</strong> ${update.publicNote}</div>`;
              } else if (update.note) {
                noteDisplay = `<div class="ps-2 border-start mt-1"><strong>Private:</strong> ${update.note}</div>`;
              }
              
              return `
                <div class="mb-3 small">
                  <div><strong>[${updateTime}] ${updateType.toUpperCase()}</strong> - ${updateUser}</div>
                  ${noteDisplay}
                </div>
              `;
            }).join("")}
          </div>
        `;
      }

      body.innerHTML = `
        ${fieldsHtml}
        ${previewHtml}
        <div class="mt-4 border-top pt-3">
          <h6>Full Technical Payload</h6>
          <pre class="code-json bg-light p-3 rounded small" style="max-height: 600px; overflow-y: auto;">${JSON.stringify(recordData, null, 2)}</pre>
        </div>
        ${previousUpdatesHtml}
      `;
    } catch (error) {
      body.innerHTML = errorMessage(error);
      console.error("Offcanvas render error:", error);
    }
  }

  // Expose utilities
  window.MediaUtils = {
    formatDateTime,
    formatFieldLabel,
    formatFieldValue,
    showMediaDetailsOffcanvas,
    ensureMediaOffcanvas
  };
})();
