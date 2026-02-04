/**
 * Slide-In (Offcanvas) Component
 * Reusable component for showing detailed content in a slide-in panel
 */

(function () {
  'use strict';

  const { $ } = window.AdminUtils;

  window.SlideIn = {
    instance: null,
    element: null,
    body: null,
    title: null,

    /**
     * Initialize the slide-in component
     */
    init() {
      this.ensureElement();
      this.element = $("#appOffcanvas");
      this.body = $("#appOffcanvasBody");
      this.title = $("#appOffcanvasLabel");
      this.instance = bootstrap.Offcanvas.getOrCreateInstance(this.element);
    },

    /**
     * Ensure offcanvas element exists in the DOM
     */
    ensureElement() {
      if (document.querySelector("#appOffcanvas")) return;

      const wrapper = document.createElement("div");
      wrapper.innerHTML = `
        <div class="offcanvas offcanvas-end" tabindex="-1" id="appOffcanvas" aria-labelledby="appOffcanvasLabel">
          <div class="offcanvas-header border-bottom">
            <h5 class="offcanvas-title" id="appOffcanvasLabel">Details</h5>
            <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
          </div>
          <div class="offcanvas-body" id="appOffcanvasBody">
            <div class="text-center py-5">
               <div class="spinner-border text-primary"></div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(wrapper.firstElementChild);
    },

    /**
     * Show HTML content in the slide-in panel
     * @param {string} title - Panel title
     * @param {string} html - HTML content
     */
    showHtml(title, html) {
      if (!this.instance) this.init();
      this.title.textContent = title || "Details";
      this.body.innerHTML = html || '<div class="text-muted">No content</div>';
      this.instance.show();
    },

    /**
     * Show JSON content in the slide-in panel
     * @param {string} title - Panel title
     * @param {Object|string} data - JSON data
     */
    showJson(title, data) {
      if (!this.instance) this.init();
      const jsonString = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
      
      let formattedJson = jsonString;
      try {
        const parsed = typeof data === 'string' ? JSON.parse(data) : data;
        formattedJson = JSON.stringify(parsed, null, 2);
      } catch (e) {}

      this.showHtml(title, `
        <div class="json-preview">
          <pre class="code-json bg-light border p-3 rounded small" style="max-height: 800px; overflow: auto;">${formattedJson}</pre>
        </div>
      `);
    },

    /**
     * Close the slide-in panel
     */
    hide() {
      if (this.instance) {
        this.instance.hide();
      }
    }
  };

  // Initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.SlideIn.init());
  } else {
    window.SlideIn.init();
  }
})();
