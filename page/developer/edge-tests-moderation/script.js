/**
 * Edge Tests - Block Class
 *
 * Comprehensive edge test page for the Block controller.
 */

(function () {
  const INDENT_SUB_SCENARIOS = false;
  let ScenarioList = [];
  function waitForAdminShell() {
    return new Promise((resolveFunction) => {
      if (window.AdminShell && window.AdminShell.pageContent) {
        resolveFunction();
      } else {
        document.body.addEventListener("adminshell:ready", resolveFunction, {
          once: true,
        });
      }
    });
  }

  waitForAdminShell().then(async () => {
    if (!window.AdminShell || !window.AdminShell.pageContent) {
      console.error("AdminShell.pageContent is still null after ready event");
      return;
    }
    try {
      const resp = await fetch("scenarios.json");
      const json = await resp.json();
      ScenarioList = Array.isArray(json) ? json : json.scenarios || [];
      console.log("scenarios_length:", ScenarioList.length);
    } catch (e) {
      console.warn("[Edge Tests Block] Failed to load scenarios.json:", e);
      ScenarioList = [];
    }

    const pageContent = window.AdminShell.pageContent;
    const { spinner, spinnerInline, spinnerSmall, errorMessage } =
      window.AdminUtils || {};

    let userBaseUrlOverride = null;
	
    function collectAndValidateInputs(scenarioId) {
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
        throw new Error(`Missing required fields: ${missingLabels}`);
      }

      return inputValues;
    }
    function buildRequestData(
      scenarioId,
      method,
      payload,
      inputValues,
      pathParamKeys
    ) {
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
            throw new Error(
              `Payload must be valid JSON. ${parseError.message}`
            );
          }
        }
      }

      const arrayFieldIds = new Set(["blocks"]);

      const parseArrayValue = (raw) => {
        if (Array.isArray(raw)) return raw;
        if (typeof raw !== "string") return raw;
        const trimmed = raw.trim();
        if (!trimmed) return [];
        if (
          (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
          trimmed.startsWith("{")
        ) {
          try {
            const parsed = JSON.parse(trimmed);
            return Array.isArray(parsed) ? parsed : parsed;
          } catch (e) {
            return trimmed
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean);
          }
        }
        return trimmed
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean);
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

      const queryParams =
        method === "GET"
          ? Object.fromEntries(
              Object.entries(inputValues).filter(
                ([key]) => !pathParamKeys.has(key)
              )
            )
          : {};

      return { requestData, queryParams };
    }

    function parseApiConfigBase() {
      try {
        const configScriptElement = document.getElementById("api-config");
        if (!configScriptElement) return "http://localhost:3000";
        const pageConfig = JSON.parse(configScriptElement.textContent);
        const currentEnvironment = window.Env?.current || "dev";
        const sectionKey = document.body?.dataset?.section || "moderation";
        const sectionConfig = pageConfig[sectionKey];
        const moderationConfig = pageConfig["moderation"];
        const targetConfig = sectionConfig || moderationConfig;

        if (
          targetConfig &&
          targetConfig[currentEnvironment] &&
          targetConfig[currentEnvironment].endpoint
        ) {
          const endpointUrl = targetConfig[currentEnvironment].endpoint;
          const urlMatch = endpointUrl.match(/^(https?:\/\/[^\/]+)/);
          if (urlMatch) {
            return urlMatch[1];
          }
        } else {
          const adminEndpoints = window.AdminEndpoints;
          if (
            adminEndpoints &&
            adminEndpoints.base &&
            adminEndpoints.base[currentEnvironment]
          ) {
            return adminEndpoints.base[currentEnvironment];
          }
        }
        return "http://localhost:3000";
      } catch (configError) {
        console.warn(
          "[Edge Tests Moderation] Could not parse API config, using default base URL:",
          configError
        );
        return "http://localhost:3000";
      }
    }

    function getBaseUrl() {
      let baseUrl = userBaseUrlOverride || parseApiConfigBase();
      console.log("[Edge Tests Moderation] Using base URL:", baseUrl);
      return baseUrl;
    }

    function renderPrerequisites(prerequisites) {
      return window.EdgeTestsShared.renderPrerequisites(prerequisites);
    }

    function renderTerminologies(terminologies) {
      return window.EdgeTestsShared.renderTerminologies(terminologies);
    }

    function createIndexNavigation() {
      return window.EdgeTestsShared.createIndexNavigation(ScenarioList, {
        indentSub: INDENT_SUB_SCENARIOS,
      });
    }

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
        </div>`;
    }

    // Shared CSS now provides collapse toggle and input styles.

    async function testScenario(scenarioId, method, endpoint, payload) {
      const responseContainer = document.getElementById(
        `response-${scenarioId}`
      );
      if (!responseContainer) {
        console.error(
          `Response container not found for scenario: ${scenarioId}`
        );
        return;
      }

      responseContainer.innerHTML = spinnerInline
        ? spinnerInline("Testing API call...")
        : '<div class="loading-state">Testing API call...</div>';
      let fullUrl;
      try {
        const baseUrl = getBaseUrl();
        let inputValues, requestData, queryParams, pathParamKeys;
        try {
          inputValues = collectAndValidateInputs(scenarioId);

          let finalEndpoint = endpoint;
          pathParamKeys = new Set();
          Object.entries(inputValues).forEach(([fieldId, fieldValue]) => {
            if (finalEndpoint.includes(`{${fieldId}}`)) {
              finalEndpoint = finalEndpoint.replace(`{${fieldId}}`, fieldValue);
              pathParamKeys.add(fieldId);
            }
          });
          fullUrl = `${baseUrl}${finalEndpoint}`;

          const result = buildRequestData(
            scenarioId,
            method,
            payload,
            inputValues,
            pathParamKeys
          );
          requestData = result.requestData;
          queryParams = result.queryParams;
        } catch (validationError) {
          responseContainer.innerHTML = errorMessage
            ? errorMessage(validationError, "Validation error")
            : `
							<div class="alert alert-warning">
								<strong><i class="bi bi-exclamation-triangle"></i> Validation:</strong>
								<p>${validationError.message}</p>
							</div>
						`;
          return;
        }

        // Continue with API call
        const apiHandler = new APIHandler();
        let didRenderResponse = false;

        const apiParams = {
          apiBaseUrl: fullUrl,
          queryParams,
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
            const statusText =
              detail.response?.status || detail.error_message?.status
                ? `Status: ${
                    detail.response?.status || detail.error_message?.status
                  }${
                    detail.response?.statusText
                      ? ` ${detail.response.statusText}`
                      : ""
                  }`
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
        console.error(
          `[Edge Tests Block] Error in scenario ${scenarioId}:`,
          error
        );
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
        const cleanupUrl = `${baseUrl}/user-blocks/cleanupTestBlocks`;

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
        console.error("[Edge Tests Block] Cleanup error:", error);
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

      // Shared CSS already includes collapse toggle and input styles.

      const prerequisites = [
        "<strong>Environment Setup:</strong> Development server running (e.g., XAMPP, localhost:3000)",
        "<strong>API Configuration:</strong> API endpoints configured in api-config script tag",
        "<strong>Database Access:</strong> Access to database for manual verification",
        "<strong>Dependencies:</strong> All required JavaScript files loaded (APIHandler, AdminShell, etc.)",
      ];

      const terminologies = {
        "Edge Test":
          "A test that verifies behavior at system boundaries and limits.",
        APIHandler:
          "JavaScript class that manages API requests, responses, and loading states.",
        "Testing Parameter":
          "Special parameter (testing: true) required in all POST requests.",
        "Query Parameters":
          "Parameters passed in URL for GET requests (e.g., ?per_page=10).",
        "Request Data": "Data sent in request body for POST/PUT requests.",
        "Response Callback":
          "Function that handles API response after successful request.",
        "Verification Checklist":
          "Manual steps to verify test results in database.",
        "Cleanup Method":
          "Function that resets test data after testing is complete.",
      };

      // Build page content HTML
      const pageHtml = `
        <!-- Prerequisites Section -->
        
        ${renderPrerequisites(prerequisites)}
        

        <!-- Terminology Section -->
		${renderTerminologies(terminologies)}
        

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
		${createTestScenarioSection()}

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
      const toggleAllScenariosBtn = document.getElementById(
        "toggle-all-scenarios-btn"
      );

      if (toggleAllScenariosBtn) {
        toggleAllScenariosBtn.addEventListener("click", () => {
          const isCollapsing =
            toggleAllScenariosBtn.innerHTML.includes("Collapse");
          const allBodies = document.querySelectorAll(
            ".test-scenario-card .card-body.collapse"
          );
          const allToggles = document.querySelectorAll(
            ".test-scenario-card .collapse-toggle"
          );

          if (window.bootstrap && window.bootstrap.Collapse) {
            allBodies.forEach((el) => {
              const instance = window.bootstrap.Collapse.getOrCreateInstance(
                el,
                {
                  toggle: false,
                }
              );
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
              console.error(
                "[Edge Tests Block] Could not parse payload:",
                parseError
              );
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
