/**
 * Edge Tests - Users Class
 *
 * Comprehensive edge test page for the Users controller.
 * Mirrored from the moderation template with user-specific scenarios.
 */

(function () {
  const INDENT_SUB_SCENARIOS = false;
  let ScenarioList = [];
  // Wait for AdminShell ready event
  function waitForAdminShell() {
    return window.EdgeTestsShared.waitForAdminShell();
  }

  waitForAdminShell().then(async () => {
    if (!window.AdminShell || !window.AdminShell.pageContent) {
      console.error("AdminShell.pageContent is still null after ready event");
      return;
    }
    try {
        const resp = await fetch('scenarios.json');
        const json = await resp.json();
        ScenarioList = Array.isArray(json) ? json : (json.scenarios || []);
        console.log("scenarios_length:",ScenarioList.length )
      } catch (e) {
        console.warn('[Edge Tests Block] Failed to load scenarios.json:', e);
        ScenarioList = [];
      }
    const pageContent = window.AdminShell.pageContent;
    const { spinner, spinnerInline, spinnerSmall, errorMessage } =
      window.AdminUtils || {};

    let userBaseUrlOverride = null;

    function formatScenarioLabel(id, title) {
      return window.EdgeTestsShared.defaultFormatScenarioLabel(id, title);
    }

    function parseApiConfigBase() {
      return window.EdgeTestsShared.getBaseUrl("users", userBaseUrlOverride);
    }

    function getBaseUrl() {
      let baseUrl = parseApiConfigBase();
      console.log("[Edge Tests Users] Using base URL:", baseUrl);
      return baseUrl;
    }

    function renderPrerequisites(prerequisites) {
      return window.EdgeTestsShared.renderPrerequisites(prerequisites);
    }

    function renderTerminologies(terminologies) {
      return window.EdgeTestsShared.renderTerminologies(terminologies);
    }

    /**
     * Build index navigation
     */
    function createIndexNavigation() {
			const subScenarioStyle = INDENT_SUB_SCENARIOS
				? 'style="margin-left: 20px; font-size: 0.9em;"'
				: "";
			const iconStyle = INDENT_SUB_SCENARIOS
				? '<i class="bi bi-arrow-return-right"></i>'
				: '<i class="bi bi-play-circle"></i>';

			// Build dynamic scenario links from ScenarioList
			const buildScenarioLinks = () => {
				if (!Array.isArray(ScenarioList) || ScenarioList.length === 0) {
					return '';
				}

				// Map parent -> children for quick lookup
				const childrenByParent = new Map();
				ScenarioList.forEach((s) => {
					if (s && s.parent) {
						if (!childrenByParent.has(s.parent)) childrenByParent.set(s.parent, []);
						childrenByParent.get(s.parent).push(s);
					}
				});

				const parts = [];
				// Render top-level scenarios first, in the order they appear
				ScenarioList.filter((s) => s && !s.parent).forEach((s) => {
					const id = s.scenarioId;
					const title = s.title || id;
					parts.push(
						`<a href="#test-scenario-${id}" class="index-link"><i class="bi bi-play-circle"></i> ${formatScenarioLabel(
							id,
							title
						)}</a>`
					);
					const kids = childrenByParent.get(id) || [];
					kids.forEach((k) => {
						const kidId = k.scenarioId;
						const kidTitle = k.title || kidId;
						parts.push(
							`<a href="#test-scenario-${kidId}" class="index-link" ${subScenarioStyle}>${iconStyle} ${formatScenarioLabel(
								kidId,
								kidTitle
							)}</a>`
						);
					});
				});

				// Render any orphan children whose parent wasn't listed as top-level
				const renderedIds = new Set(parts.join('\n').match(/#test-scenario-([^"']+)/g)?.map(m => m.replace('#test-scenario-','')) || []);
				ScenarioList.filter((s) => s && s.parent && !renderedIds.has(s.scenarioId)).forEach((s) => {
					parts.push(
						`<a href="#test-scenario-${s.scenarioId}" class="index-link" ${subScenarioStyle}>${iconStyle} ${formatScenarioLabel(s.scenarioId, s.title || s.scenarioId)}</a>`
					);
				});

				return parts.join("\n");
			};

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

					${buildScenarioLinks()}

					<a href="#cleanup-section" class="index-link">
						<i class="bi bi-trash"></i> Cleanup Method
					</a>
				</div>
			`;
		}

    /**
     * Create scenario sections
     */
    function createTestScenarioSection() {
      return `<div class="demo-section">
          <div class="d-flex align-items-center justify-content-between">
                <h3><i class="bi bi-play-circle"></i> Test Scenarios</h3>
                <button class="btn btn-sm btn-outline-secondary" id="toggle-all-scenarios-btn">
                  <i class="bi bi-arrows-expand"></i> Expand All
                </button>
              </div>
					<p class="description-text">
						Click "Test API Call" on any scenario below to execute the test. 
						Results will be displayed in the response container.
					</p>

			${ScenarioList.map((scenario) => {
        return window.EdgeTestsShared.createTestScenarioSection(scenario, {
          getBaseUrl,
          sectionKey: "moderation",
        });
      }).join("")}
        </div>;`
    }
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

    function buildCodeUsageExample(
      scenarioId,
      method,
      endpoint,
      payload,
      inputFields = []
    ) {
      const baseUrl = getBaseUrl();
      const pathParams = [...endpoint.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]);
      const endpointTemplate = pathParams.reduce(
        (acc, name) => acc.replace(`{${name}}`, '${' + name + '}'),
        endpoint
      );
      const pathParamDecls = pathParams
        .map((name) => `const ${name} = "<${name}>"; // path param`)
        .join("\n");
      const fullUrlLine = pathParams.length
        ? `const fullUrl = \`${baseUrl}${endpointTemplate}\`;`
        : `const fullUrl = \`${baseUrl}${endpoint}\`;`;

      const sampleValue = (field) => {
        if (field.value !== undefined && field.value !== "") return field.value;
        if (field.placeholder) return field.placeholder;
        if (field.options && field.options.length > 0) return field.options[0].value;
        return `<${field.id}>`;
      };

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
     * Execute a scenario
     */
    async function testScenario(scenarioId, method, endpoint, payload) {
      const responseContainer = document.getElementById(
        `response-${scenarioId}`
      );
      if (!responseContainer) {
        console.error(`Response container not found for scenario: ${scenarioId}`);
        return;
      }

      responseContainer.innerHTML = spinnerInline
        ? spinnerInline("Testing API call...")
        : '<div class="loading-state">Testing API call...</div>';

      try {
        const baseUrl = getBaseUrl();
        const inputFields = document.querySelectorAll(
          `#test-scenario-${scenarioId} input[data-field-id], #test-scenario-${scenarioId} select[data-field-id]`
        );
        const rawInputValues = {};
        inputFields.forEach((field) => {
          const fieldId = field.getAttribute("data-field-id");
          const fieldType = field.getAttribute("data-field-type") || field.type;
          let fieldValue = field.value;

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

        let finalEndpoint = endpoint;
        const pathParamKeys = new Set();
        Object.entries(inputValues).forEach(([fieldId, fieldValue]) => {
          if (finalEndpoint.includes(`{${fieldId}}`)) {
            finalEndpoint = finalEndpoint.replace(`{${fieldId}}`, fieldValue);
            pathParamKeys.add(fieldId);
          }
        });
        const fullUrl = `${baseUrl}${finalEndpoint}`;

        const methodNeedsBody =
          method === "POST" || method === "PUT" || method === "PATCH";

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

        const arrayFieldIds = new Set([
          "user_profile.backgroundImages",
          "user_profile.socialUrls",
          "user_profile.additionalUrls",
          "backgroundImages",
          "socialUrls",
          "additionalUrls",
        ]);

        const parseArrayValue = (raw) => {
          if (Array.isArray(raw)) return raw;
          if (typeof raw !== "string") return raw;
          const trimmed = raw.trim();
          if (!trimmed) return [];
          if ((trimmed.startsWith("[") && trimmed.endsWith("]")) || trimmed.startsWith("{")) {
            try {
              const parsed = JSON.parse(trimmed);
              return Array.isArray(parsed) ? parsed : parsed;
            } catch (e) {
              return trimmed.split(",").map((v) => v.trim()).filter(Boolean);
            }
          }
          return trimmed.split(",").map((v) => v.trim()).filter(Boolean);
        };

        const nestDotPaths = (flatObj = {}, arrayFields = new Set()) => {
          const clone = { ...flatObj };
          const normalize = (keyPath, value) => {
            if (arrayFields.has(keyPath)) {
              return parseArrayValue(value);
            }
            if (value === "true") return true;
            if (value === "false") return false;
            return value;
          };

          Object.entries(flatObj).forEach(([key, value]) => {
            if (!key.includes(".")) {
              clone[key] = normalize(key, value);
              return;
            }
            delete clone[key];
            const parts = key.split(".");
            let cursor = clone;
            parts.forEach((part, idx) => {
              const isLast = idx === parts.length - 1;
              if (isLast) {
                const fullPath = parts.join(".");
                cursor[part] = normalize(fullPath, value);
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

        let requestData = {};
        if (methodNeedsBody && editablePayload) {
          requestData = { ...editablePayload, ...inputValues, testing: true };
        } else if (methodNeedsBody) {
          requestData = { ...inputValues, testing: true };
        }

        if (methodNeedsBody) {
          requestData = nestDotPaths(requestData, arrayFieldIds);
        }

        const apiHandler = new APIHandler();
        let didRenderResponse = false;

        const apiParams = {
          apiBaseUrl: fullUrl,
          queryParams:
            method === "GET"
              ? Object.fromEntries(
                  Object.entries(inputValues).filter(
                    ([key]) => !pathParamKeys.has(key)
                  )
                )
              : {},
          httpMethod: method,
          requestData: requestData,
          responseCallback: (data) => {
            didRenderResponse = true;
            const responseJson = JSON.stringify(data, null, 2);
            responseContainer.innerHTML = `
              <div class="alert alert-success">
                <strong><i class="bi bi-check-circle"></i> Success (200):</strong>
                <pre class="bg-light p-3 rounded mt-2" style="max-height: 400px; overflow: auto;"><code>${responseJson}</code></pre>
              </div>
            `;
          },
        };

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
        console.error(`[Edge Tests Users] Error in scenario ${scenarioId}:`, error);
      }
    }

    async function cleanupTestData() {
      const cleanupContainer = document.getElementById("cleanup-response");
      if (!cleanupContainer) {
        console.error("Cleanup container not found");
        return;
      }

      cleanupContainer.innerHTML = spinnerInline
        ? spinnerInline("Cleaning up test data...")
        : '<div class="loading-state">Cleaning up test data...</div>';

      try {
        const baseUrl = getBaseUrl();
        const cleanupUrl = `${baseUrl}/users/cleanupTestUsers`;

        const apiHandler = new APIHandler();

        const cleanupParams = {
          apiBaseUrl: cleanupUrl,
          queryParams: {},
          httpMethod: "POST",
          requestData: {
            testing: true,
            deleteAll: true,
          },
          responseCallback: (data) => {
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

        await apiHandler.handleRequest(cleanupParams);
      } catch (error) {
        cleanupContainer.innerHTML = `
          <div class="alert alert-danger">
            <strong><i class="bi bi-exclamation-triangle"></i> Cleanup Error:</strong>
            <p>${error.message || "Unknown error occurred during cleanup"}</p>
            <p class="mt-2"><small>You may need to manually clean up test data in the database.</small></p>
          </div>
        `;
        console.error("[Edge Tests Users] Cleanup error:", error);
      }
    }

    const terminologies = {
      "Edge Test": "A test that verifies behavior at system boundaries and limits.",
      "APIHandler": "JavaScript class that manages API requests, responses, and loading states.",
      "Testing Parameter": "Special parameter (testing: true) required in all POST requests.",
      "Query Parameters": "Parameters passed in URL for GET requests (e.g., ?limit=10).",
      "Request Data": "Data sent in request body for POST/PUT requests.",
      "Response Callback": "Function that handles API response after successful request.",
      "Verification Checklist": "Manual steps to verify test results in database.",
      "Cleanup Method": "Function that resets test data after testing is complete."
    };

    async function render() {
      pageContent.innerHTML = spinner
        ? spinner()
        : '<div class="loading-state">Loading...</div>';

      const initialBaseUrl = getBaseUrl();
      ensureCollapseToggleStyles();
      ensureEdgeTestInputStyles();
      const prerequisites = [
        "<strong>Environment Setup:</strong> Development server running (e.g., localhost:3000)",
        "<strong>API Configuration:</strong> API endpoints configured in api-config script tag",
        "<strong>Database Access:</strong> Access to database for manual verification",
        "<strong>Dependencies:</strong> All required JavaScript files loaded (APIHandler, AdminShell, etc.)"
      ];

      const pageHtml = `
        ${renderPrerequisites(prerequisites)}
        ${renderTerminologies(terminologies)}

        ${createIndexNavigation()}

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

        <div class="demo-section">
          <div class="d-flex align-items-center justify-content-between">
            <h3><i class="bi bi-play-circle"></i> Test Scenarios</h3>
            <button class="btn btn-sm btn-outline-secondary" id="toggle-all-scenarios-btn">
              <i class="bi bi-arrows-expand"></i> Expand All
            </button>
          </div>
          <p class="description-text">
            Click "Test API Call" on any scenario below to execute the test. 
            Results will be displayed in the response container.
          </p>

         ${createTestScenarioSection()}

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

      pageContent.innerHTML = pageHtml;
      attachEventListeners();
    }

    function attachEventListeners() {
      const baseUrlInput = document.getElementById("baseUrlInput");
      const baseUrlStatus = document.getElementById("baseUrlStatus");
      const baseUrlApplyBtn = document.getElementById("baseUrlApply");
      const toggleAllScenariosBtn = document.getElementById("toggle-all-scenarios-btn");

      if (toggleAllScenariosBtn) {
        toggleAllScenariosBtn.addEventListener("click", () => {
          const isCollapsing = toggleAllScenariosBtn.innerHTML.includes("Collapse");
          const allBodies = document.querySelectorAll(
            ".test-scenario-card .card-body.collapse"
          );
          const allToggles = document.querySelectorAll(
            ".test-scenario-card .collapse-toggle"
          );

          // Use Bootstrap API if available, otherwise toggle classes manually
          if (window.bootstrap && window.bootstrap.Collapse) {
            allBodies.forEach((el) => {
              const instance = window.bootstrap.Collapse.getOrCreateInstance(el, {
                toggle: false,
              });
              if (isCollapsing) instance.hide();
              else instance.show();
            });
          } else {
            allBodies.forEach((el) => {
              if (isCollapsing) el.classList.remove("show");
              else el.classList.add("show");
            });
            allToggles.forEach((btn) => {
              btn.setAttribute("aria-expanded", !isCollapsing);
              if (isCollapsing) btn.classList.add("collapsed");
              else btn.classList.remove("collapsed");
            });
          }

          if (isCollapsing) {
            toggleAllScenariosBtn.innerHTML =
              '<i class="bi bi-arrows-expand"></i> Expand All';
          } else {
            toggleAllScenariosBtn.innerHTML =
              '<i class="bi bi-arrows-collapse"></i> Collapse All';
          }
        });
      }

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

      document.addEventListener("click", (event) => {
        const testBtn = event.target.closest(".test-scenario-btn");
        if (testBtn) {
          const scenarioId = testBtn.getAttribute("data-scenario-id");
          const method = testBtn.getAttribute("data-method");
          const endpoint = testBtn.getAttribute("data-endpoint");
          const payloadString = testBtn.getAttribute("data-payload");
          let payload = null;
          if (payloadString && payloadString !== "null") {
            try {
              payload = JSON.parse(payloadString);
            } catch (parseError) {
              console.error("[Edge Tests Users] Could not parse payload:", parseError);
            }
          }
          testScenario(scenarioId, method, endpoint, payload);
        }

        const clearBtn = event.target.closest(".clear-response-btn");
        if (clearBtn) {
          const scenarioId = clearBtn.getAttribute("data-scenario-id");
          const responseEl = document.getElementById(`response-${scenarioId}`);
          if (responseEl) {
            responseEl.innerHTML = "";
          }
          return;
        }

        if (
          event.target.id === "cleanup-btn" ||
          event.target.closest("#cleanup-btn")
        ) {
          if (
            confirm(
              "Are you sure you want to clean up test data? This action cannot be undone."
            )
          ) {
            cleanupTestData();
          }
        }
      });

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

    window.EdgeTestsUsers = {
      testScenario: testScenario,
      cleanupTestData: cleanupTestData,
      getBaseUrl: getBaseUrl,
    };

    render();
  });
})();
