/**
 * Edge Tests - Demo Class (Template)
 *
 * This is a comprehensive demo/template for building edge test pages.
 * Use this as a reference when creating new edge test pages for other classes.
 *
 * STRUCTURE:
 * ==========
 * 1. Prerequisites - Setup requirements and dependencies
 * 2. Terminology - Key terms and definitions
 * 3. Index - Navigation for different test scenarios
 * 4. Headings - Section headers with descriptions
 * 5. Code Usage - Examples with detailed parameter explanations
 * 6. API Integration - Demonstrates APIHandler usage
 * 7. Verification Checklist - Manual database verification steps
 * 8. Cleanup Method - Function to reset test data
 *
 * IMPORTANT NOTES:
 * - All POST requests MUST include testing: true in the request data
 * - We use APIHandler class (apiHandler.js) for all API requests
 * - This template uses a pale blue theme for visual consistency
 */

(function () {
  /**
   * ============================================================================
   * PREREQUISITES SECTION
   * ============================================================================
              note: null,
              publicNote: null,
   *
   * Before using this edge test page, ensure the following prerequisites are met:
   *
   * 1. Environment Setup:
   *    - Development server running (e.g., XAMPP, localhost:3000)
   *    - API endpoints configured in api-config script tag
   *    - Database access for manual verification
   *
   * 2. Dependencies:
   *    - Bootstrap 5.3.3 (loaded from CDN)
   *    - Bootstrap Icons (loaded from CDN)
   *    - AdminShell framework (from assets/js/admin.js)
   *    - APIHandler class (from apiHandler.js)
   *    - Core utilities (utils.js, state.js, config.js)
   *    - UI components (sidebar.js, tabs.js)
   *
   * 3. API Configuration:
   *    - Configure endpoints in the api-config script tag in index.html
   *    - Set appropriate endpoints for dev/stage/prod environments
   *    - Ensure API endpoints accept testing: true parameter
   *
   * 4. Database Access:
   *    - Access to database for manual verification
   *    - Understanding of table structure
   *    - Ability to query and verify test data
   */

  /**
   * Wait for AdminShell ready event
   * This ensures all core components are loaded before we start
   *
   * @returns {Promise} Promise that resolves when AdminShell is ready
   */
  function waitForAdminShell() {
    return new Promise((resolveFunction) => {
      // Check if AdminShell is already ready
      if (window.AdminShell && window.AdminShell.pageContent) {
        // AdminShell is already ready, resolve immediately
        resolveFunction();
      } else {
        // Listen for AdminShell ready event
        document.body.addEventListener("adminshell:ready", resolveFunction, {
          once: true,
        });
      }
    });
  }

  /**
   * ============================================================================
   * TERMINOLOGY SECTION
   * ============================================================================
   *
   * Key terms and definitions used in edge testing:
   *
   * - Edge Test: A test that verifies the behavior at the boundaries or limits
   *   of a system, including edge cases and boundary conditions.
   *
   * - APIHandler: A JavaScript class that manages API requests, handles responses,
   *   and manages loading states. Located in apiHandler.js.
   *
   * - Testing Parameter: A special parameter (testing: true) that must be included
   *   in all POST requests to indicate this is a test request.
   *
   * - Query Parameters: Parameters passed in the URL for GET requests
   *   (e.g., ?per_page=10&page=1)
   *
   * - Request Data: Data sent in the request body for POST/PUT requests
   *   (must include testing: true for POST requests)
   *
   * - Response Callback: A function that handles the API response after a
   *   successful request.
   *
   * - Verification Checklist: Manual steps to verify test results in the database.
   *
   * - Cleanup Method: A function that resets test data after testing is complete.
   */

  // Wait for AdminShell to be available before proceeding
  waitForAdminShell().then(() => {
    // Verify AdminShell and pageContent are actually ready
    if (!window.AdminShell || !window.AdminShell.pageContent) {
      // Log error if AdminShell is not ready
      console.error("AdminShell.pageContent is still null after ready event");
      return;
    }

    // Get page content container element
    const pageContent = window.AdminShell.pageContent;

    // Destructure AdminUtils functions if available
    const { spinner, spinnerInline, spinnerSmall, errorMessage } =
      window.AdminUtils || {};

    // User-defined base URL override (optional)
    let userBaseUrlOverride = null;

    /**
     * ============================================================================
     * HELPER FUNCTIONS
     * ============================================================================
     */

    /**
     * Get base URL from API configuration
     *
     * This function reads the API configuration from the page and extracts
     * the base URL for the current environment (dev/stage/prod).
     *
     * @returns {string} Base URL for API calls
     */
    function getBaseUrl() {
      // Default fallback base URL or user override
      let baseUrl = userBaseUrlOverride || "http://localhost:3000";

      try {
        // Get API config from page
        const configScriptElement = document.getElementById("api-config");
        if (configScriptElement) {
          // Parse page config JSON
          const pageConfig = JSON.parse(configScriptElement.textContent);
          // Get current environment
          const currentEnvironment = window.Env?.current || "dev";
          // If override is set, keep it; otherwise resolve from config
          if (!userBaseUrlOverride) {
            // Try to get moderation config (prioritize page section, then moderation key)
            const sectionKey = document.body?.dataset?.section || "moderation";
            const sectionConfig = pageConfig[sectionKey];
            const moderationConfig = pageConfig["moderation"];
            const targetConfig = sectionConfig || moderationConfig;

            // Check if target config exists and has endpoint for current environment
            if (
              targetConfig &&
              targetConfig[currentEnvironment] &&
              targetConfig[currentEnvironment].endpoint
            ) {
              // Get endpoint URL
              const endpointUrl = targetConfig[currentEnvironment].endpoint;
              // Extract base URL from endpoint (e.g., "http://localhost:3000/moderation" -> "http://localhost:3000")
              const urlMatch = endpointUrl.match(/^(https?:\/\/[^\/]+)/);
              if (urlMatch) {
                // Use extracted base URL
                baseUrl = urlMatch[1];
              }
            } else {
              // If no config match, try to get from window.AdminEndpoints
              const adminEndpoints = window.AdminEndpoints;
              if (
                adminEndpoints &&
                adminEndpoints.base &&
                adminEndpoints.base[currentEnvironment]
              ) {
                baseUrl = adminEndpoints.base[currentEnvironment];
              }
            }
          }
        }
      } catch (configError) {
        // Use default base URL if config parsing fails
        console.warn(
          "[Edge Tests Moderation] Could not parse API config, using default base URL:",
          configError
        );
      }

      console.log("[Edge Tests Moderation] Using base URL:", baseUrl);
      // Return base URL
      return baseUrl;
    }

    /**
     * ============================================================================
     * INDEX / NAVIGATION SECTION
     * ============================================================================
     *
     * This section provides navigation links to different test scenarios.
     * Each link scrolls to the corresponding test section on the page.
     */

    /**
     * Create index/navigation HTML
     *
     * This creates a navigation menu with links to all test sections.
     *
     * @returns {string} HTML string for index navigation
     */
    function createIndexNavigation() {
      return `
        <div class="demo-section index-section">
          <h3><i class="bi bi-list-ul"></i> Test Scenarios Index</h3>
          <p class="description-text">Navigate to different test scenarios:</p>
          <a href="#prerequisites-section" class="index-link">
            <i class="bi bi-check-circle"></i> Prerequisites
          </a>
          <a href="#terminology-section" class="index-link">
            <i class="bi bi-book"></i> Terminology
          </a>
          <a href="#base-url-section" class="index-link">
            <i class="bi bi-link-45deg"></i> API Base URL
          </a>
          <a href="#test-scenario-1" class="index-link">
            <i class="bi bi-play-circle"></i> Test Scenario 1: Create Moderation Entry
          </a>
          <a href="#test-scenario-2" class="index-link">
            <i class="bi bi-play-circle"></i> Test Scenario 2: Get Moderations (Filters)
          </a>
          <a href="#test-scenario-3" class="index-link">
            <i class="bi bi-play-circle"></i> Test Scenario 3: Get Moderation by ID
          </a>
          <a href="#test-scenario-4" class="index-link">
            <i class="bi bi-play-circle"></i> Test Scenario 4: Update Moderation
          </a>
          <a href="#test-scenario-5" class="index-link">
            <i class="bi bi-play-circle"></i> Test Scenario 5: Update Moderation Meta
          </a>
          <a href="#test-scenario-6" class="index-link">
            <i class="bi bi-play-circle"></i> Test Scenario 6: Moderation Action (Approve/Reject)
          </a>
          <a href="#test-scenario-7" class="index-link">
            <i class="bi bi-play-circle"></i> Test Scenario 7: Escalate Moderation
          </a>
          <a href="#test-scenario-8" class="index-link">
            <i class="bi bi-play-circle"></i> Test Scenario 8: Add Moderation Note
          </a>
          <a href="#test-scenario-9" class="index-link">
            <i class="bi bi-play-circle"></i> Test Scenario 9: Delete Moderation (soft delete)
          </a>
          <a href="#cleanup-section" class="index-link">
            <i class="bi bi-trash"></i> Cleanup Method
          </a>
        </div>
      `;
    }

    /**
     * ============================================================================
     * HEADINGS AND DESCRIPTIONS SECTION
     * ============================================================================
     *
     * Each test scenario has:
     * - A heading (h4 or h5) with a unique ID for navigation
     * - A description explaining what the test does
     * - Code usage examples with detailed parameter explanations
     */

    /**
     * ============================================================================
     * CODE USAGE SECTION
     * ============================================================================
     *
     * This section demonstrates how to use the APIHandler class with detailed
     * parameter explanations. Each example includes:
     *
     * 1. Block comment explaining all parameters
     * 2. Code example showing the actual usage
     * 3. Parameter breakdown with types and descriptions
     */

    /**
     * Create test scenario section HTML
     *
     * This function creates a complete test scenario card with:
     * - Heading and description
     * - Input fields (user ID, select dropdown, etc.) if needed
     * - Code usage example with parameter explanations
     * - API endpoint information
     * - Request payload (if applicable)
     * - Test button
     * - Response container
     * - Verification checklist
     *
     * @param {string} scenarioId - Unique ID for the scenario (used in HTML IDs)
     * @param {string} title - Title of the test scenario
     * @param {string} description - Description of what this test does
     * @param {string} apiMethod - HTTP method (GET, POST, PUT, DELETE)
     * @param {string} apiEndpoint - API endpoint path (relative to base URL)
     * @param {Object} requestPayload - Request payload object (optional, for POST/PUT)
     * @param {Array} checklistItems - Array of checklist item strings for manual verification
     * @param {Array} inputFields - Array of input field configurations (optional)
     *   Example: [{ type: 'text', id: 'userId', label: 'User ID', placeholder: 'Enter user ID' },
     *             { type: 'select', id: 'status', label: 'Status', options: [{value: 'active', text: 'Active'}, {value: 'inactive', text: 'Inactive'}] }]
     * @returns {string} HTML string for complete scenario section
     */
    function createTestScenarioSection(
      scenarioId,
      title,
      description,
      apiMethod,
      apiEndpoint,
      requestPayload = null,
      checklistItems = [],
      inputFields = []
    ) {
      // Build checklist HTML
      let checklistHtml = "";
      if (checklistItems.length > 0) {
        // Map checklist items to HTML checkboxes
        const checklistItemsHtml = checklistItems
          .map((item, index) => {
            // Return checkbox HTML for each item
            return `
            <div class="checklist-item">
              <div class="form-check">
                <input class="form-check-input" type="checkbox" id="checklist-${scenarioId}-${index}" />
                <label class="form-check-label" for="checklist-${scenarioId}-${index}">${item}</label>
              </div>
            </div>
          `;
          })
          .join("");
        // Wrap checklist items in container
        checklistHtml = `
          <div class="checklist-container">
            <strong><i class="bi bi-check2-square"></i> Manual Verification Checklist:</strong>
            <div class="mt-2">${checklistItemsHtml}</div>
          </div>
        `;
      }

      // Build request payload display HTML (editable for body methods)
      let requestPayloadHtml = "";
      const methodNeedsBody =
        apiMethod === "POST" || apiMethod === "PUT" || apiMethod === "PATCH";
      if (methodNeedsBody) {
        const payloadJson = JSON.stringify(requestPayload || {}, null, 2);
        requestPayloadHtml = `
          <div class="api-params-block">
            <strong>Request Payload (editable):</strong>
            <textarea class="form-control mt-2" id="payload-${scenarioId}" rows="8" style="font-family: inherit;">${payloadJson}</textarea>
            <small class="text-muted d-block mt-1">Payload must be valid JSON. <code>testing: true</code> is added automatically.</small>
          </div>
        `;
      }

      // Build API endpoint display HTML
      const apiEndpointHtml = `
        <div class="api-params-block">
          <strong>API Endpoint:</strong>
          <div class="mt-2">
            <code>${apiMethod} ${apiEndpoint}</code>
          </div>
        </div>
      `;

      // Build input fields HTML if provided
      let inputFieldsHtml = "";
      if (inputFields && inputFields.length > 0) {
        const renderedParents = new Set();
        const renderParentLabels = (parentPaths) => {
          return parentPaths
            .map((path) => {
              if (!path || renderedParents.has(path)) return "";
              renderedParents.add(path);
              const indentLevel = path.split(".").length - 1;
              const indentStyle =
                indentLevel > 0
                  ? `style="margin-left: ${indentLevel * 16}px; border-left: 2px solid #e0e0e0; padding-left: 8px;"`
                  : "";
              const labelText = path.split(".").pop();
              return `<div class="nested-group-label" ${indentStyle}><strong>${labelText}</strong></div>`;
            })
            .join("");
        };

        // Determine placeholder ids from endpoint (path params)
        const placeholderMatches = [...apiEndpoint.matchAll(/\{([^}]+)\}/g)];
        const placeholderIds = new Set(placeholderMatches.map((m) => m[1]));

        const renderField = (field) => {
          const indentLevel = field.id.includes(".")
            ? field.id.split(".").length - 1
            : 0;
          const indentStyle =
            indentLevel > 0
              ? `style="margin-left: ${indentLevel * 16}px; border-left: 2px solid #e0e0e0; padding-left: 8px;"`
              : "";
          const inputId = `input-${scenarioId}-${field.id.replace(/\./g, "-")}`;

          // Determine parent paths for nested labels (supports multi-level)
          const parentPaths = [];
          const parts = field.id.split(".");
          if (parts.length > 1) {
            for (let i = 1; i < parts.length; i += 1) {
              parentPaths.push(parts.slice(0, i).join("."));
            }
          }
          const parentLabelsHtml = renderParentLabels(parentPaths);

          if (field.type === "select") {
            // Build select dropdown
            const optionsHtml = field.options
              .map(
                (option) =>
                  `<option value="${option.value}">${option.text}</option>`
              )
              .join("");
            return `
            ${parentLabelsHtml}
            <div class="test-input-group" ${indentStyle}>
              <label for="${inputId}">${field.label}${
              field.required ? " *" : ""
            }:</label>
              <select id="${inputId}" class="form-control" data-field-id="${
              field.id
            }" data-field-type="select" ${
              field.required ? "required" : ""
            } data-required="${field.required ? "true" : "false"}">
                ${optionsHtml}
              </select>
            </div>
          `;
          } else {
            // Build text input
            const inputType = field.typeOverride || field.type || "text";
            const patternAttr = field.pattern ? `pattern="${field.pattern}"` : "";
            const inputModeAttr = field.inputMode ? `inputmode="${field.inputMode}"` : "";
            return `
            ${parentLabelsHtml}
            <div class="test-input-group" ${indentStyle}>
              <label for="${inputId}">${field.label}${
              field.required ? " *" : ""
            }:</label>
              <input type="${inputType}" 
                     id="${inputId}" 
                     class="form-control" 
                     data-field-id="${field.id}"
                     data-field-type="${inputType}"
                     data-required="${field.required ? "true" : "false"}"
                     placeholder="${field.placeholder || ""}"
                     value="${field.value || ""}"
                     ${patternAttr}
                     ${inputModeAttr}
                     ${field.required ? "required" : ""}>
            </div>
          `;
          }
        };

        const pathFields = inputFields.filter((f) => placeholderIds.has(f.id));
        const remainingFields = inputFields.filter((f) => !placeholderIds.has(f.id));
        const queryFields = apiMethod === "GET" ? remainingFields : [];
        const bodyFields = apiMethod === "GET" ? [] : remainingFields;

        const renderGroup = (fields, label) => {
          if (!fields.length) return "";
          const content = fields.map(renderField).join("");
          return `
            <div class="mb-3">
              <strong>${label}</strong>
              ${content}
            </div>
          `;
        };

        inputFieldsHtml = `
          ${renderGroup(pathFields, "Path Params")}
          ${renderGroup(queryFields, "Query Params")}
          ${renderGroup(bodyFields, "Body Params")}
        `;
      }

      // Build code usage example with parameter explanations
      const codeExampleHtml = buildCodeUsageExample(
        scenarioId,
        apiMethod,
        apiEndpoint,
        requestPayload,
        inputFields
      );

      // Build important note based on HTTP method
      let importantNoteMessage =
        "This is a GET request, so no request body is sent.";
      if (apiMethod === "POST" || apiMethod === "PUT" || apiMethod === "PATCH") {
        importantNoteMessage =
          "This request includes <code>testing: true</code> parameter to indicate this is a test request.";
      } else if (apiMethod === "DELETE") {
        importantNoteMessage =
          "This is a DELETE request; ensure the backend supports deletion for this endpoint and that test data can be safely removed.";
      }

      // Return complete scenario section HTML
      return `
        <div class="test-scenario-card card" id="test-scenario-${scenarioId}">
          <div class="card-header">
            <div class="d-flex align-items-center justify-content-between">
              <h5 class="card-title mb-0">${title}</h5>
              <button class="btn btn-sm btn-outline-secondary collapse-toggle" type="button" data-bs-toggle="collapse" data-bs-target="#scenario-body-${scenarioId}" aria-expanded="true" aria-controls="scenario-body-${scenarioId}" aria-label="Toggle scenario section">
                <i class="bi bi-chevron-up icon-expanded" aria-hidden="true"></i>
                <i class="bi bi-chevron-down icon-collapsed" aria-hidden="true"></i>
                <span class="visually-hidden">Toggle scenario section</span>
              </button>
            </div>
          </div>
          <div id="scenario-body-${scenarioId}" class="card-body collapse show">
            <p class="description-text">${description}</p>
            ${apiEndpointHtml}
            ${requestPayloadHtml}
            ${inputFieldsHtml}
            ${codeExampleHtml}
            <div class="important-note">
              <strong><i class="bi bi-exclamation-triangle"></i> Important:</strong>
              ${importantNoteMessage}
            </div>
            <div class="mt-3 d-flex gap-2">
              <button class="btn btn-primary flex-grow-1 test-scenario-btn" 
                      data-scenario-id="${scenarioId}" 
                      data-method="${apiMethod}" 
                      data-endpoint="${apiEndpoint}" 
                      data-payload='${
                        requestPayload ? JSON.stringify(requestPayload) : "null"
                      }'
                      data-has-inputs="${inputFields.length > 0}">
                <i class="bi bi-play-fill"></i> Test API Call
              </button>
              <button class="btn btn-outline-secondary clear-response-btn" data-scenario-id="${scenarioId}" aria-label="Clear scenario response">
                <i class="bi bi-x-circle"></i>
              </button>
            </div>
            <div id="response-${scenarioId}" class="response-container mt-3"></div>
            ${checklistHtml}
          </div>
        </div>
      `;
    }

    // Ensure collapse toggle icons show/hide correctly based on collapsed state
    function ensureCollapseToggleStyles() {
      if (document.getElementById("edge-tests-collapse-toggle-style")) {
        return;
      }
      const style = document.createElement("style");
      style.id = "edge-tests-collapse-toggle-style";
      style.textContent = `
        .collapse-toggle .icon-expanded,
        .collapse-toggle .icon-collapsed {
          display: inline-block;
          vertical-align: middle;
        }
        .collapse-toggle .icon-collapsed {
          display: none;
        }
        .collapse-toggle.collapsed .icon-expanded {
          display: none;
        }
        .collapse-toggle.collapsed .icon-collapsed {
          display: inline-block;
        }
      `;
      document.head.appendChild(style);
    }

    // Add a subtle border radius to inputs/selects/textarea in this page
    function ensureEdgeTestInputStyles() {
      if (document.getElementById("edge-tests-input-style")) {
        return;
      }
      const style = document.createElement("style");
      style.id = "edge-tests-input-style";
      style.textContent = `
        .test-input-group .form-control {
          border-radius: 6px;
        }
      `;
      document.head.appendChild(style);
    }

    /**
     * Build code usage example with detailed parameter explanations
     *
     * This creates a comprehensive code example showing how to use APIHandler
     * with detailed comments explaining each parameter.
     *
     * @param {string} scenarioId - Scenario ID for reference
     * @param {string} method - HTTP method
     * @param {string} endpoint - API endpoint
     * @param {Object} payload - Request payload (optional)
     * @returns {string} HTML string for code usage example
     */
    function buildCodeUsageExample(
      scenarioId,
      method,
      endpoint,
      payload,
      inputFields = []
    ) {
      const baseUrl = getBaseUrl();

      // Identify path params from endpoint
      const pathParams = [...endpoint.matchAll(/\{([^}]+)\}/g)].map(
        (m) => m[1]
      );

      // Build a template URL with path params interpolated
      const endpointTemplate = pathParams.reduce(
        (acc, name) => acc.replace(`{${name}}`, '${' + name + '}'),
        endpoint
      );

      // Path param declarations for the code sample
      const pathParamDecls = pathParams
        .map((name) => `const ${name} = "<${name}>"; // path param`)
        .join("\n");

      const fullUrlLine = pathParams.length
        ? `const fullUrl = \`${baseUrl}${endpointTemplate}\`;`
        : `const fullUrl = \`${baseUrl}${endpoint}\`;`;

      // Helper to build sample values
      const sampleValue = (field) => {
        if (field.value !== undefined && field.value !== "") return field.value;
        if (field.placeholder) return field.placeholder;
        if (field.options && field.options.length > 0) return field.options[0].value;
        return `<${field.id}>`;
      };

      // Query fields (non-path) for GET
      const queryFields =
        method === "GET"
          ? inputFields.filter((f) => !pathParams.includes(f.id))
          : [];

      let queryParamsBlock = "{}";
      if (queryFields.length) {
        const qpLines = queryFields
          .map((f) => `    ${JSON.stringify(f.id)}: ${JSON.stringify(sampleValue(f))},`)
          .join("\n");
        queryParamsBlock = `{
${qpLines}
  }`;
      }

      // Body payload sample (keep scenario defaults and ensure testing flag)
      const payloadWithTesting =
        method === "POST" || method === "PUT" || method === "PATCH"
          ? payload
            ? { ...payload, testing: true }
            : { testing: true }
          : {};
      const requestDataBlock =
        method === "POST" || method === "PUT" || method === "PATCH"
          ? JSON.stringify(payloadWithTesting, null, 2)
          : "{}";

      // Build parameter explanations
      let paramExplanations = `
        <div class="api-params-block">
          <strong>Parameter Explanations:</strong>
          <div class="param-item">
            <span class="param-name">apiBaseUrl</span>
            <span class="param-type">(string)</span>
            <div class="param-desc">The base URL for the API endpoint. Example: "${baseUrl}"</div>
          </div>
          <div class="param-item">
            <span class="param-name">queryParams</span>
            <span class="param-type">(Object)</span>
            <div class="param-desc">Query parameters for GET requests (added to URL as ?key=value&key2=value2)</div>
          </div>
          <div class="param-item">
            <span class="param-name">httpMethod</span>
            <span class="param-type">(string)</span>
            <div class="param-desc">HTTP method: 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'. Current: "${method}"</div>
          </div>
      `;

      if (method === "POST" || method === "PUT" || method === "PATCH") {
        paramExplanations += `
          <div class="param-item">
            <span class="param-name">requestData</span>
            <span class="param-type">(Object)</span>
            <div class="param-desc">Request body data. <strong>MUST include testing: true for POST requests.</strong></div>
          </div>
        `;
      }

      paramExplanations += `
          <div class="param-item">
            <span class="param-name">responseCallback</span>
            <span class="param-type">(Function)</span>
            <div class="param-desc">Optional callback function to handle the response data</div>
          </div>
        </div>
      `;

      const pathBlock = pathParams.length ? `${pathParamDecls}\n` : "";

      // Build code example aligned to the scenario inputs
      let codeExample = "";
      if (method === "GET") {
        codeExample = `
// Example: GET request using APIHandler
const apiHandler = new APIHandler();
${pathBlock}${fullUrlLine}

const apiParams = {
  apiBaseUrl: fullUrl,
  queryParams: ${queryParamsBlock},
  httpMethod: "GET",
  requestData: {},
  responseCallback: (data) => {
    console.log("API Response:", data);
  }
};

apiHandler.handleRequest(apiParams);
        `;
      } else {
        codeExample = `
// Example: ${method} request using APIHandler
const apiHandler = new APIHandler();
${pathBlock}${fullUrlLine}

const apiParams = {
  apiBaseUrl: fullUrl,
  queryParams: {},
  httpMethod: "${method}",
  requestData: ${requestDataBlock},
  responseCallback: (data) => {
    console.log("API Response:", data);
  }
};

apiHandler.handleRequest(apiParams);
        `;
      }

      return `
        <div class="api-params-block">
          <strong>Code Usage Example:</strong>
          <div class="code-example mt-2">
            <pre><code>${codeExample}</code></pre>
          </div>
        </div>
        ${paramExplanations}
      `;
    }

    /**
     * ============================================================================
     * API INTEGRATION SECTION
     * ============================================================================
     *
     * This section demonstrates how to use the APIHandler class to make API requests.
     * The APIHandler class handles:
     * - Request construction
     * - Response processing
     * - Error handling
     * - Loading states
     * - Popup management (if needed)
     */

    /**
     * Test API scenario using APIHandler
     *
     * This function demonstrates how to use the APIHandler class to make API requests.
     * It shows the complete flow:
     * 1. Prepare API parameters
     * 2. Create APIHandler instance
     * 3. Call handleRequest method
     * 4. Handle response or errors
     *
     * @param {string} scenarioId - Scenario ID
     * @param {string} method - HTTP method
     * @param {string} endpoint - API endpoint path (relative to base URL)
     * @param {Object} payload - Request payload (optional)
     */
    async function testScenario(scenarioId, method, endpoint, payload) {
      // Get response container element
      const responseContainer = document.getElementById(
        `response-${scenarioId}`
      );
      if (!responseContainer) {
        console.error(
          `Response container not found for scenario: ${scenarioId}`
        );
        return;
      }

      // Show loading spinner
      responseContainer.innerHTML = spinnerInline
        ? spinnerInline("Testing API call...")
        : '<div class="loading-state">Testing API call...</div>';

      try {
        // Get base URL
        const baseUrl = getBaseUrl();

        // Check if this scenario has input fields and collect their values
        const inputFields = document.querySelectorAll(
          `#test-scenario-${scenarioId} input[data-field-id], #test-scenario-${scenarioId} select[data-field-id]`
        );
        const rawInputValues = {};
        inputFields.forEach((field) => {
          const fieldId = field.getAttribute("data-field-id");
          const fieldType = field.getAttribute("data-field-type") || field.type;
          let fieldValue = field.value;

          // Trim text inputs to reduce accidental pattern mismatches (e.g., dayKey)
          if (typeof fieldValue === "string") {
            fieldValue = fieldValue.trim();
          }

          if (fieldType === "datetime-local" && fieldValue) {
            const parsedDate = Date.parse(fieldValue);
            if (!Number.isNaN(parsedDate)) {
              fieldValue = parsedDate.toString();
            }
          }
          rawInputValues[fieldId] = fieldValue;
        });

        // Validate required inputs; remove empties from non-required
        const missingRequired = [];
        const inputValues = Object.fromEntries(
          Object.entries(rawInputValues).filter(([key, value]) => {
            const fieldElement = document.querySelector(
              `#test-scenario-${scenarioId} [data-field-id="${key}"]`
            );
            const isRequired = fieldElement?.dataset?.required === "true";
            if (
              isRequired &&
              (value === undefined || value === null || value === "")
            ) {
              missingRequired.push(key);
            }

            return value !== "";
          })
        );

        if (missingRequired.length > 0) {
          const missingLabels = missingRequired.join(", ");
          const validationMessage = `Missing required fields: ${missingLabels}`;
          responseContainer.innerHTML = errorMessage
            ? errorMessage(new Error(validationMessage), "Validation error")
            : `
              <div class="alert alert-warning">
                <strong><i class="bi bi-exclamation-triangle"></i> Validation:</strong>
                <p>${validationMessage}</p>
              </div>
            `;
          return;
        }

        // Build full URL - replace placeholders with input values
        let finalEndpoint = endpoint;
        const pathParamKeys = new Set();
        Object.entries(inputValues).forEach(([fieldId, fieldValue]) => {
          if (finalEndpoint.includes(`{${fieldId}}`)) {
            finalEndpoint = finalEndpoint.replace(`{${fieldId}}`, fieldValue);
            pathParamKeys.add(fieldId);
          }
        });
        const fullUrl = `${baseUrl}${finalEndpoint}`;

        // IMPORTANT: For POST/PUT/PATCH requests, ensure testing: true is included
        const methodNeedsBody =
          method === "POST" || method === "PUT" || method === "PATCH";

        // Read editable payload (if present)
        let editablePayload = payload;
        if (methodNeedsBody) {
          const payloadEditor = document.getElementById(`payload-${scenarioId}`);
          if (payloadEditor) {
            try {
              editablePayload = payloadEditor.value
                ? JSON.parse(payloadEditor.value)
                : {};
            } catch (parseError) {
              responseContainer.innerHTML = errorMessage
                ? errorMessage(parseError, "Invalid JSON in payload")
                : `
                  <div class="alert alert-warning">
                    <strong><i class="bi bi-exclamation-triangle"></i> Validation:</strong>
                    <p>Payload must be valid JSON. ${parseError.message}</p>
                  </div>
                `;
              return;
            }
          }
        }

        let requestData = {};
        if (methodNeedsBody && editablePayload) {
          // Merge payload with testing parameter and input values
          requestData = { ...editablePayload, ...inputValues, testing: true };
        } else if (methodNeedsBody) {
          // If no payload, include input values and testing: true
          requestData = { ...inputValues, testing: true };
        } else if (method === "GET") {
          // For GET requests, merge input values into query params
          // This will be handled in queryParams below
        }

        // Convert dot-notation keys into nested objects (e.g., meta.contentDeleted)
        const nestDotPaths = (flatObj = {}) => {
          const clone = { ...flatObj };
          const normalize = (v) => (v === "true" ? true : v === "false" ? false : v);
          Object.entries(flatObj).forEach(([key, value]) => {
            if (!key.includes(".")) {
              clone[key] = normalize(value);
              return;
            }
            delete clone[key];
            const parts = key.split(".");
            let cursor = clone;
            parts.forEach((part, idx) => {
              const isLast = idx === parts.length - 1;
              if (isLast) {
                cursor[part] = normalize(value);
              } else {
                if (
                  cursor[part] === undefined ||
                  typeof cursor[part] !== "object" ||
                  Array.isArray(cursor[part])
                ) {
                  cursor[part] = {};
                }
                cursor = cursor[part];
              }
            });
          });
          return clone;
        };

        if (methodNeedsBody) {
          requestData = nestDotPaths(requestData);
        }

        // Create APIHandler instance
        const apiHandler = new APIHandler();

        // Track whether we rendered a response (success or error)
        let didRenderResponse = false;

        // Prepare API parameters
        const apiParams = {
          // Base URL for the API endpoint
          apiBaseUrl: fullUrl,

          // Query parameters (for GET requests, include only non-path inputs)
          queryParams:
            method === "GET"
              ? Object.fromEntries(
                  Object.entries(inputValues).filter(
                    ([key]) => !pathParamKeys.has(key)
                  )
                )
              : {},

          // HTTP method
          httpMethod: method,

          // Request data (for POST/PUT requests, includes testing: true)
          requestData: requestData,

          // Response callback function
          responseCallback: (data) => {
            didRenderResponse = true;
            // Format response for display
            const responseJson = JSON.stringify(data, null, 2);

            // Display success response
            responseContainer.innerHTML = `
              <div class="alert alert-success">
                <strong><i class="bi bi-check-circle"></i> Success (200):</strong>
                <pre class="bg-light p-3 rounded mt-2" style="max-height: 400px; overflow: auto;"><code>${responseJson}</code></pre>
              </div>
            `;
          },
        };

        // Listen for APIHandler error events to surface failures (APIHandler swallows errors)
        const apiHandlerResponseListener = (event) => {
          const detail = event?.detail;
          const args = detail?.args;
          if (
            !args ||
            args.apiBaseUrl !== apiParams.apiBaseUrl ||
            args.httpMethod !== apiParams.httpMethod
          ) {
            return;
          }
          if (detail.success === false) {
            didRenderResponse = true;
            const errorMessageText =
              detail.error_message?.message ||
              detail.error_message ||
              "Request failed";
            const statusText = detail.response?.status || detail.error_message?.status
              ? `Status: ${
                  detail.response?.status || detail.error_message?.status
                }${detail.response?.statusText ? ` ${detail.response.statusText}` : ""}`
              : "";
            const responsePayload =
              detail.data?.error ??
              detail.data ??
              detail.response?.data?.error ??
              detail.response?.data ??
              detail.response?.body ??
              detail.response?.responseJSON ??
              detail.response?.responseText ??
              detail.response;
            const responseBlock = responsePayload
              ? `<pre class="bg-light p-3 rounded mt-2" style="max-height: 400px; overflow: auto;"><code>${
                  typeof responsePayload === "string"
                    ? responsePayload
                    : JSON.stringify(responsePayload, null, 2)
                }</code></pre>`
              : "";
            responseContainer.innerHTML = `
              <div class="alert alert-danger">
                <strong><i class="bi bi-exclamation-triangle"></i> Error:</strong>
                <p>${statusText} ${errorMessageText}</p>
                ${responseBlock}
              </div>
            `;
          }
        };
        document.addEventListener(
          "dash-api-handler-response",
          apiHandlerResponseListener
        );

        try {
          // Execute the API request using APIHandler
          await apiHandler.handleRequest(apiParams);
        } finally {
          document.removeEventListener(
            "dash-api-handler-response",
            apiHandlerResponseListener
          );
          if (
            !didRenderResponse &&
            responseContainer.innerHTML.includes("Testing API call")
          ) {
            responseContainer.innerHTML = `
              <div class="alert alert-danger">
                <strong><i class="bi bi-exclamation-triangle"></i> Error:</strong>
                <p>No response received. Please check the console or network tab.</p>
              </div>
            `;
          }
        }
      } catch (error) {
        // Mark that we rendered to avoid fallback overwrite
        let didRenderResponseCatch = false;
        // Display error message
        const responsePayload =
          error?.data?.error ??
          error?.data ??
          error?.response?.data?.error ??
          error?.response?.data ??
          error?.response?.body ??
          error?.response?.responseJSON ??
          error?.response?.responseText ??
          error?.response;
        const responseBlock = responsePayload
          ? `<pre class="bg-light p-3 rounded mt-2" style="max-height: 400px; overflow: auto;"><code>${
              typeof responsePayload === "string"
                ? responsePayload
                : JSON.stringify(responsePayload, null, 2)
            }</code></pre>`
          : "";
        responseContainer.innerHTML = `
          <div class="alert alert-danger">
            <strong><i class="bi bi-exclamation-triangle"></i> Error:</strong>
            <p>Status: ${error.status || error?.response?.status || ""}${
              error?.response?.statusText ? ` ${error.response.statusText}` : ""
            } ${error.message || "Unknown error occurred"}</p>
            ${responseBlock}
          </div>
        `;
        didRenderResponseCatch = true;
        console.error(
          `[Edge Tests Demo] Error in scenario ${scenarioId}:`,
          error
        );
      }
    }

    /**
     * ============================================================================
     * VERIFICATION CHECKLIST SECTION
     * ============================================================================
     *
     * After running a test, manually verify the results in the database.
     * Each test scenario includes a checklist of verification steps.
     *
     * Verification steps typically include:
     * 1. Check database for created/updated records
     * 2. Verify data matches expected values
     * 3. Check timestamps and status fields
     * 4. Verify relationships and foreign keys
     * 5. Check for any side effects or related records
     */

    /**
     * ============================================================================
     * CLEANUP METHOD SECTION
     * ============================================================================
     *
     * After testing is complete, use the cleanup method to reset test data.
     * This ensures the database is in a clean state for the next test run.
     */

    /**
     * Cleanup test data
     *
     * This function demonstrates how to clean up test data after testing.
     * It should delete or reset any test records created during testing.
     *
     * IMPORTANT: Always include testing: true in cleanup requests to ensure
     * the server knows this is a test cleanup operation.
     *
     * @returns {Promise<void>}
     */
    async function cleanupTestData() {
      const cleanupContainer = document.getElementById("cleanup-response");
      if (!cleanupContainer) {
        console.error("Cleanup container not found");
        return;
      }

      // Show loading state
      cleanupContainer.innerHTML = spinnerInline
        ? spinnerInline("Cleaning up test data...")
        : '<div class="loading-state">Cleaning up test data...</div>';

      try {
        // Get base URL
        const baseUrl = getBaseUrl();
        // Cleanup endpoint (adjust based on your API)
        const cleanupUrl = `${baseUrl}/demo/cleanup`;

        // Create APIHandler instance
        const apiHandler = new APIHandler();

        // Prepare cleanup API parameters
        const cleanupParams = {
          // Base URL for cleanup endpoint
          apiBaseUrl: cleanupUrl,

          // No query parameters needed for cleanup
          queryParams: {},

          // HTTP method (POST for cleanup)
          httpMethod: "POST",

          // Request data - MUST include testing: true
          requestData: {
            testing: true,
            // Add any other cleanup parameters here
            deleteAll: true, // Example: delete all test records
          },

          // Response callback
          responseCallback: (data) => {
            // Display cleanup success
            cleanupContainer.innerHTML = `
              <div class="alert alert-success">
                <strong><i class="bi bi-check-circle"></i> Cleanup Successful:</strong>
                <pre class="bg-light p-3 rounded mt-2"><code>${JSON.stringify(
                  data,
                  null,
                  2
                )}</code></pre>
                <p class="mt-2">Test data has been cleaned up. Database is ready for next test run.</p>
              </div>
            `;
          },
        };

        // Execute cleanup request
        await apiHandler.handleRequest(cleanupParams);
      } catch (error) {
        // Display cleanup error
        cleanupContainer.innerHTML = `
          <div class="alert alert-danger">
            <strong><i class="bi bi-exclamation-triangle"></i> Cleanup Error:</strong>
            <p>${error.message || "Unknown error occurred during cleanup"}</p>
            <p class="mt-2"><small>You may need to manually clean up test data in the database.</small></p>
          </div>
        `;
        console.error("[Edge Tests Demo] Cleanup error:", error);
      }
    }

    /**
     * ============================================================================
     * PAGE RENDERING
     * ============================================================================
     */

    /**
     * Render the complete page content
     *
     * This function builds and displays all sections of the edge test page:
     * - Prerequisites
     * - Terminology
     * - Index navigation
     * - Test scenarios
     * - Cleanup section
     */
    async function render() {
      // Show loading spinner
      pageContent.innerHTML = spinner
        ? spinner()
        : '<div class="loading-state">Loading...</div>';

      const initialBaseUrl = getBaseUrl();

      // Inject collapse toggle styles once
      ensureCollapseToggleStyles();
      // Inject form control rounding for test inputs
      ensureEdgeTestInputStyles();

      // Build page content HTML
      const pageHtml = `
        <!-- Prerequisites Section -->
        <div class="demo-section prerequisites-section" id="prerequisites-section">
          <h3><i class="bi bi-gear"></i> Prerequisites</h3>
          <p class="description-text">
            Before using this edge test page, ensure the following prerequisites are met:
          </p>
          <ul>
            <li><strong>Environment Setup:</strong> Development server running (e.g., XAMPP, localhost:3000)</li>
            <li><strong>API Configuration:</strong> API endpoints configured in api-config script tag</li>
            <li><strong>Database Access:</strong> Access to database for manual verification</li>
            <li><strong>Dependencies:</strong> All required JavaScript files loaded (APIHandler, AdminShell, etc.)</li>
          </ul>
          <div class="important-note">
            <strong>Note:</strong> All POST requests automatically include <code>testing: true</code> parameter.
          </div>
        </div>

        <!-- Terminology Section -->
        <div class="demo-section terminology-section" id="terminology-section">
          <h3><i class="bi bi-book"></i> Terminology</h3>
          <div class="terminology-item">
            <strong>Edge Test:</strong> A test that verifies behavior at system boundaries and limits.
          </div>
          <div class="terminology-item">
            <strong>APIHandler:</strong> JavaScript class that manages API requests, responses, and loading states.
          </div>
          <div class="terminology-item">
            <strong>Testing Parameter:</strong> Special parameter (testing: true) required in all POST requests.
          </div>
          <div class="terminology-item">
            <strong>Query Parameters:</strong> Parameters passed in URL for GET requests (e.g., ?per_page=10).
          </div>
          <div class="terminology-item">
            <strong>Request Data:</strong> Data sent in request body for POST/PUT requests.
          </div>
          <div class="terminology-item">
            <strong>Response Callback:</strong> Function that handles API response after successful request.
          </div>
          <div class="terminology-item">
            <strong>Verification Checklist:</strong> Manual steps to verify test results in database.
          </div>
          <div class="terminology-item">
            <strong>Cleanup Method:</strong> Function that resets test data after testing is complete.
          </div>
        </div>

        <!-- Index Navigation -->
        ${createIndexNavigation()}

        <!-- Base URL Override -->
        <div class="demo-section" id="base-url-section">
          <h3><i class="bi bi-link-45deg"></i> API Base URL</h3>
          <p class="description-text">
            Current base URL is derived from the page config. Override it here to point at a different host.
          </p>
          <div class="test-input-group">
            <label for="baseUrlInput">Base URL:</label>
            <div class="d-flex gap-2">
              <input type="url" id="baseUrlInput" class="form-control" value="${initialBaseUrl}" placeholder="http://localhost:3000" />
              <button class="btn btn-outline-primary" id="baseUrlApply">Apply</button>
            </div>
            <small id="baseUrlStatus" class="text-muted"></small>
          </div>
        </div>

        <!-- Test Scenarios -->
        <div class="demo-section">
          <h3><i class="bi bi-play-circle"></i> Test Scenarios</h3>
          <p class="description-text">
            Click "Test API Call" on any scenario below to execute the test. 
            Results will be displayed in the response container.
          </p>

          ${createTestScenarioSection(
            "1",
            "Test Scenario 1: Create Moderation Entry",
            "This test creates a new moderation entry via POST /moderation/createModerationEntry using the required testing flag.",
            "POST",
            "/moderation/createModerationEntry",
            {
              userId: "user_123",
              contentId: "content_456",
              type: "image",
              priority: "normal",
              contentType: "post",
              mediaType: "jpg",
              isSystemGenerated: false,
              isPreApproved: false,
            },
            [
              "Verify new moderation row exists with provided userId and contentId",
              "Confirm default status is set (e.g., pending) and timestamps are correct",
              "Ensure testing flag is present on the request payload",
              "Validate type, priority, and contentType match expected values",
              "Check mediaType and flags (isSystemGenerated, isPreApproved)",
            ],
            [
              {
                type: "text",
                id: "userId",
                required: true,
                label: "User ID",
                placeholder: "Enter user ID",
                value: "",
              },
              {
                type: "text",
                id: "contentId",
                required: true,
                label: "Content ID",
                placeholder: "Enter content ID",
                value: "content_456",
              },
              {
                type: "select",
                id: "type",
                required: true,
                label: "Type",
                options: [
                  { value: "image", text: "Image" },
                  { value: "video", text: "Video" },
                  { value: "text", text: "Text" },
                ],
              },
              {
                type: "select",
                id: "priority",
                label: "Priority",
                options: [
                  { value: "normal", text: "Normal" },
                  { value: "high", text: "High" },
                  { value: "low", text: "Low" },
                ],
              },
              {
                type: "select",
                id: "contentType",
                label: "Content Type",
                options: [
                  { value: "post", text: "Post" },
                  { value: "comment", text: "Comment" },
                  { value: "profile", text: "Profile" },
                ],
              },
              {
                type: "select",
                id: "mediaType",
                label: "Media Type",
                options: [
                  { value: "jpg", text: "JPG" },
                  { value: "png", text: "PNG" },
                  { value: "mp4", text: "MP4" },
                ],
              },
              {
                type: "select",
                id: "isSystemGenerated",
                label: "Is System Generated",
                options: [
                  { value: "false", text: "No" },
                  { value: "true", text: "Yes" },
                ],
              },
              {
                type: "select",
                id: "isPreApproved",
                label: "Is Pre-Approved",
                options: [
                  { value: "false", text: "No" },
                  { value: "true", text: "Yes" },
                ],
              },
            ]
          )}

          ${createTestScenarioSection(
            "2",
            "Test Scenario 2: Get Moderations (Filters)",
            "This test fetches moderation items via GET /moderation/fetchModerations using optional query filters (status, user, priority, type) plus pagination and date range.",
            "GET",
            "/moderation/fetchModerations",
            null,
            [
              "Apply filters (status, userId, priority, type, asc) and confirm results reflect the query",
              "Validate limit/nextToken pagination behavior",
              "Use start/end to window results by timestamp when provided",
              "Cross-check item count against database for selected filters",
              "Confirm ordering toggles when asc flag is changed",
            ],
            [
              {
                type: "select",
                id: "status",
                label: "Status",
                required: false,
                options: [
                  { value: "", text: "Any" },
                  { value: "pending", text: "Pending" },
                  { value: "approved", text: "Approved" },
                  { value: "rejected", text: "Rejected" },
                  { value: "escalated", text: "Escalated" },
                ],
              },
              {
                type: "text",
                id: "userId",
                label: "User ID",
                placeholder: "Filter by userId (optional)",
                value: "",
              },
              {
                type: "select",
                id: "priority",
                label: "Priority",
                options: [
                  { value: "", text: "Any" },
                  { value: "normal", text: "Normal" },
                  { value: "high", text: "High" },
                  { value: "low", text: "Low" },
                ],
              },
              {
                type: "select",
                id: "type",
                label: "Type",
                options: [
                  { value: "", text: "Any" },
                  { value: "image", text: "Image" },
                  { value: "video", text: "Video" },
                  { value: "text", text: "Text" },
                ],
              },
              {
                type: "text",
                id: "dayKey",
                label: "Day Key (YYYYMMDD)",
                placeholder: "YYYYMMDD",
                value: "",
                inputMode: "numeric",
              },
              {
                type: "select",
                id: "asc",
                label: "Ascending",
                options: [
                  { value: "false", text: "Descending (default)" },
                  { value: "true", text: "Ascending" },
                ],
              },
              {
                type: "text",
                id: "limit",
                label: "Limit",
                placeholder: "Items per page (e.g., 20)",
                value: "20",
              },
              {
                type: "text",
                id: "nextToken",
                label: "Next Token",
                placeholder: "Optional next token for pagination",
                value: "",
              },
              {
                type: "text",
                id: "start",
                label: "Start (datetime)",
                placeholder: "Pick start date/time",
                value: "",
                typeOverride: "datetime-local",
              },
              {
                type: "text",
                id: "end",
                label: "End (datetime)",
                placeholder: "Pick end date/time",
                value: "",
                typeOverride: "datetime-local",
              },
            ]
          )}

          ${createTestScenarioSection(
            "3",
            "Test Scenario 3: Get Moderation by ID",
            "This test retrieves a single moderation record by ID with optional user context.",
            "GET",
            "/moderation/fetchModerationById/{moderationId}",
            null,
            [
              "Enter a moderation ID to fetch a single record",
              "Verify response contains matching moderationId and related details",
              "Confirm optional userId filter is respected when provided",
              "Check status, priority, and timestamps against database values",
              "Ensure 404 or error handling is correct for missing IDs",
            ],
            [
              {
                type: "text",
                id: "moderationId",
                required: true,
                label: "Moderation ID",
                placeholder: "Enter moderation ID (e.g., mod_123)",
                value: "",
              },
              {
                type: "text",
                id: "userId",
                label: "User ID",
                placeholder: "Optional user ID for filtering",
                value: "",
              },
            ]
          )}

          ${createTestScenarioSection(
            "4",
            "Test Scenario 4: Update Moderation",
            "This test updates an existing moderation entry via POST /moderation/updateModerationEntry/{moderationId} using the same payload shape as creation plus the moderationId path parameter.",
            "PUT",
            "/moderation/updateModeration/{moderationId}",
            {
              userId: "user_123",
              contentId: "content_456",
              type: "image",
              priority: "normal",
              contentType: "post",
              mediaType: "jpg",
              isSystemGenerated: false,
              isPreApproved: false,
            },
            [
              "Provide a moderationId path param plus the same body fields used on creation",
              "Confirm core fields (type, priority, contentType, mediaType) are updated",
              "Ensure testing flag is present in the request payload",
              "Verify userId/contentId changes persist correctly",
              "Check audit fields and timestamps reflect the update",
            ],
            [
              {
                type: "text",
                id: "moderationId",
                required: true,
                label: "Moderation ID",
                placeholder: "Enter moderation ID to update",
                value: "",
              },
              {
                type: "text",
                id: "userId",
                required: false,
                label: "User ID",
                placeholder: "Enter user ID",
                value: "",
              },
              {
                type: "text",
                id: "contentId",
                required: false,
                label: "Content ID",
                placeholder: "Enter content ID",
                value: "content_456",
              },
              {
                type: "select",
                id: "type",
                required: false,
                label: "Type",
                options: [
                  { value: "image", text: "Image" },
                  { value: "video", text: "Video" },
                  { value: "text", text: "Text" },
                ],
              },
              {
                type: "select",
                id: "priority",
                label: "Priority",
                options: [
                  { value: "normal", text: "Normal" },
                  { value: "high", text: "High" },
                  { value: "low", text: "Low" },
                ],
              },
              {
                type: "select",
                id: "contentType",
                label: "Content Type",
                options: [
                  { value: "post", text: "Post" },
                  { value: "comment", text: "Comment" },
                  { value: "profile", text: "Profile" },
                ],
              },
              {
                type: "select",
                id: "mediaType",
                label: "Media Type",
                options: [
                  { value: "jpg", text: "JPG" },
                  { value: "png", text: "PNG" },
                  { value: "mp4", text: "MP4" },
                ],
              },
              {
                type: "select",
                id: "isSystemGenerated",
                label: "Is System Generated",
                options: [
                  { value: "false", text: "No" },
                  { value: "true", text: "Yes" },
                ],
              },
              {
                type: "select",
                id: "isPreApproved",
                label: "Is Pre-Approved",
                options: [
                  { value: "false", text: "No" },
                  { value: "true", text: "Yes" },
                ],
              },
            ]
          )}

          ${createTestScenarioSection(
            "5",
            "Test Scenario 5: Update Moderation Meta",
            "This test updates moderation meta fields via POST /moderation/updateModerationMeta/{moderationId}. Use this to toggle meta flags without changing the core content attributes.",
            "POST",
            "/moderation/updateModerationMeta/{moderationId}",
            {
              userId: "",
              meta: {
                contentDeleted: false,
                contentDeletedAt: null,
                updatedBy: "moderator_1",
              },
            },
            [
              "Provide a moderation ID and meta object (contentDeleted, contentDeletedAt?, updatedBy?)",
              "Verify meta updates are persisted (e.g., contentDeleted flags, timestamps)",
              "Ensure testing flag is present in the request payload",
              "Confirm updatedBy defaults to userId when not provided",
              "Check audit fields and timestamps are updated correctly",
            ],
            [
              {
                type: "text",
                id: "moderationId",
                required: true,
                label: "Moderation ID",
                placeholder: "Enter moderation ID to update",
                value: "",
              },
              {
                type: "text",
                id: "userId",
                label: "User ID",
                placeholder: "Optional user ID (used as default updatedBy)",
                value: "",
              },
              {
                type: "select",
                id: "meta.contentDeleted",
                required: true,
                label: "Content Deleted",
                options: [
                  { value: "false", text: "No" },
                  { value: "true", text: "Yes" },
                ],
              },
              {
                type: "text",
                id: "meta.contentDeletedAt",
                label: "Content Deleted At",
                placeholder: "Pick deletion time (optional)",
                value: "",
                typeOverride: "datetime-local",
              },
              {
                type: "text",
                id: "meta.updatedBy",
                label: "Updated By",
                placeholder: "Override updatedBy (optional)",
                value: "",
              },
            ]
          )}

          ${createTestScenarioSection(
            "6",
            "Test Scenario 6: Moderation Action (Approve/Reject)",
            "This test posts an action to approve or reject a moderation record via POST /applyModerationAction/{moderationId}.",
            "POST",
            "/moderation/applyModerationAction/{moderationId}",
            {
              moderationId: "",
              userId: "user_123",
              action: "approve",
              reason: "Content meets guidelines",
              moderatedBy: "QA Tester",
              moderationType: "standard",
            },
            [
              "Provide a moderation ID and select an action (approve/reject)",
              "Verify moderation status updates and audit fields",
              "Confirm reason and moderatedBy are persisted",
              "Ensure testing flag is present in the request payload",
              "Check timestamps and status transitions in the database",
            ],
            [
              {
                type: "text",
                id: "moderationId",
                required: true,
                label: "Moderation ID",
                placeholder: "Enter moderation ID",
                value: "",
              },
              {
                type: "text",
                id: "userId",
                required: true,
                label: "User ID",
                placeholder: "Enter user ID",
                value: "user_123",
              },
              {
                type: "select",
                id: "action",
                required: true,
                label: "Action",
                options: [
                  { value: "approve", text: "Approve" },
                  { value: "reject", text: "Reject" },
                ],
              },
              {
                type: "text",
                id: "reason",
                label: "Reason",
                placeholder: "Add a reason for this action",
                value: "",
              },
              {
                type: "text",
                id: "moderatedBy",
                label: "Moderated By",
                placeholder: "Enter reviewer name",
                value: "",
              },
              {
                type: "select",
                id: "moderationType",
                label: "Moderation Type",
                options: [
                  { value: "standard", text: "Standard" },
                  { value: "manual", text: "Manual" },
                  { value: "automated", text: "Automated" },
                ],
              },
              {
                type: "text",
                id: "note",
                label: "Private Note",
                placeholder: "Optional private note",
                value: "",
              },
              {
                type: "text",
                id: "publicNote",
                label: "Public Note",
                placeholder: "Optional public note",
                value: "",
              },
            ]
          )}

          ${createTestScenarioSection(
            "7",
            "Test Scenario 7: Escalate Moderation",
            "This test escalates a moderation record via POST /escalateModeration/{moderationId}.",
            "POST",
            "/moderation/escalateModeration/{moderationId}",
            {
              userId: "user_123",
              escalatedBy: "qa_reviewer",
            },
            [
              "Provide moderation ID and required fields userId, escalatedBy",
              "Verify the record is escalated and audit fields are updated",
              "Ensure testing flag is present in the request payload",
              "Confirm escalatedBy is stored and timestamped",
              "Check escalation workflow state changes",
            ],
            [
              {
                type: "text",
                id: "moderationId",
                required: true,
                label: "Moderation ID",
                placeholder: "Enter moderation ID",
                value: "",
              },
              {
                type: "text",
                id: "userId",
                required: true,
                label: "User ID",
                placeholder: "Enter user ID",
                value: "",
              },
              {
                type: "text",
                id: "escalatedBy",
                required: true,
                label: "Escalated By",
                placeholder: "Who is escalating this?",
                value: "",
              },
            ]
          )}

          ${createTestScenarioSection(
            "8",
            "Test Scenario 8: Add Moderation Note",
            "This test adds a note to a moderation record via POST /addNote/{moderationId}.",
            "POST",
            "/moderation/addNote/{moderationId}",
            {
              userId: "",
              note: "Flagged for additional review",
              addedBy: "qa_reviewer",
            },
            [
              "Provide moderation ID and required fields userId, note, addedBy",
              "Verify note is attached to the moderation record",
              "Ensure testing flag is present in the request payload",
              "Confirm addedBy is stored and timestamped",
              "Check notes list reflects the new entry",
            ],
            [
              {
                type: "text",
                id: "moderationId",
                required: true,
                label: "Moderation ID",
                placeholder: "Enter moderation ID",
                value: "",
              },
              {
                type: "text",
                id: "userId",
                required: true,
                label: "User ID",
                placeholder: "Enter user ID",
                value: "",
              },
              {
                type: "text",
                id: "note",
                required: true,
                label: "Note",
                placeholder: "Enter note text",
                value: "",
              },
              {
                type: "text",
                id: "addedBy",
                required: true,
                label: "Added By",
                placeholder: "Who is adding this note?",
                value: "",
              },
            ]
          )}

          ${createTestScenarioSection(
            "9",
            "Test Scenario 9: Delete Moderation (soft delete)",
            "This placeholder demonstrates a delete flow for moderation records. Update the endpoint when backend delete support is available.",
            "DELETE",
            "/moderation/deleteModeration/{moderationId}",
            null,
            [
              "Use a test moderation ID intended for deletion only",
              "Confirm the item is removed from the moderation table or marked deleted",
              "Validate related records or notes are cleaned up if applicable",
              "Ensure response codes and messages match API contract for deletes",
              "Verify the operation is only executed in test environments",
            ],
            [
              {
                type: "text",
                id: "moderationId",
                label: "Moderation ID",
                placeholder: "Enter moderation ID to delete",
                value: "",
              },
              {
                type: "text",
                id: "userId",
                label: "User ID",
                placeholder: "Optional user ID for audit tracking",
                value: "",
              },
            ]
          )}
        </div>

        <!-- Cleanup Section -->
        <div class="demo-section cleanup-section" id="cleanup-section">
          <h3><i class="bi bi-trash"></i> Cleanup Method</h3>
          <p class="description-text">
            After testing is complete, use the cleanup method to reset test data.
            This ensures the database is in a clean state for the next test run.
          </p>
          <div class="important-note">
            <strong>Warning:</strong> This will delete test data. Make sure you're in a test environment.
          </div>
          <div class="mt-3">
            <button class="btn btn-danger" id="cleanup-btn">
              <i class="bi bi-trash"></i> Run Cleanup
            </button>
          </div>
          <div id="cleanup-response" class="response-container mt-3"></div>
        </div>
      `;

      // Set page content
      pageContent.innerHTML = pageHtml;

      // Attach event listeners
      attachEventListeners();
    }

    /**
     * Attach event listeners for test scenario buttons and cleanup button
     */
    function attachEventListeners() {
      const baseUrlInput = document.getElementById("baseUrlInput");
      const baseUrlStatus = document.getElementById("baseUrlStatus");
      const baseUrlApplyBtn = document.getElementById("baseUrlApply");

      if (baseUrlApplyBtn && baseUrlInput) {
        baseUrlApplyBtn.addEventListener("click", (e) => {
          e.preventDefault();
          const candidate = baseUrlInput.value.trim();
          if (candidate) {
            userBaseUrlOverride = candidate;
            if (baseUrlStatus) {
              baseUrlStatus.textContent = `Base URL set to ${candidate}`;
            }
          } else {
            userBaseUrlOverride = null;
            if (baseUrlStatus) {
              baseUrlStatus.textContent = "Base URL reset to page config";
            }
          }
        });
      }

      // Use event delegation for test scenario buttons
      document.addEventListener("click", (event) => {
        // Check if clicked element is a test scenario button
        const testBtn = event.target.closest(".test-scenario-btn");
        if (testBtn) {
          // Get scenario ID from data attribute
          const scenarioId = testBtn.getAttribute("data-scenario-id");
          // Get method from data attribute
          const method = testBtn.getAttribute("data-method");
          // Get endpoint from data attribute
          const endpoint = testBtn.getAttribute("data-endpoint");
          // Get payload from data attribute
          const payloadString = testBtn.getAttribute("data-payload");
          // Parse payload if not null
          let payload = null;
          if (payloadString && payloadString !== "null") {
            try {
              // Parse JSON payload
              payload = JSON.parse(payloadString);
            } catch (parseError) {
              // Log parse error
              console.error(
                "[Edge Tests Demo] Could not parse payload:",
                parseError
              );
            }
          }
          // Call test scenario function
          testScenario(scenarioId, method, endpoint, payload);
        }

        // Clear response/output for a scenario
        const clearBtn = event.target.closest(".clear-response-btn");
        if (clearBtn) {
          const scenarioId = clearBtn.getAttribute("data-scenario-id");
          const responseEl = document.getElementById(`response-${scenarioId}`);
          if (responseEl) {
            responseEl.innerHTML = "";
          }
          return;
        }

        // Check if clicked element is cleanup button
        if (
          event.target.id === "cleanup-btn" ||
          event.target.closest("#cleanup-btn")
        ) {
          // Confirm before cleanup
          if (
            confirm(
              "Are you sure you want to clean up test data? This action cannot be undone."
            )
          ) {
            // Run cleanup
            cleanupTestData();
          }
        }
      });

      // Smooth scroll for index links
      document.querySelectorAll(".index-link").forEach((link) => {
        link.addEventListener("click", (e) => {
          e.preventDefault();
          const targetId = link.getAttribute("href").substring(1);
          const targetElement = document.getElementById(targetId);
          if (targetElement) {
            targetElement.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }
        });
      });
    }

    // Expose functions to global scope for debugging
    window.EdgeTestsDemo = {
      testScenario: testScenario,
      cleanupTestData: cleanupTestData,
      getBaseUrl: getBaseUrl,
    };

    // Initialize page - call the async render function
    render();
  });
})();
