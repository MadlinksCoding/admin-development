/**
 * Edge Tests - Users Class
 *
 * Comprehensive edge test page for the Users controller.
 * Mirrored from the moderation template with user-specific scenarios.
 */

(function () {
  const INDENT_SUB_SCENARIOS = false;

  // Wait for AdminShell ready event
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

  waitForAdminShell().then(() => {
    if (!window.AdminShell || !window.AdminShell.pageContent) {
      console.error("AdminShell.pageContent is still null after ready event");
      return;
    }

    const pageContent = window.AdminShell.pageContent;
    const { spinner, spinnerInline, spinnerSmall, errorMessage } =
      window.AdminUtils || {};

    let userBaseUrlOverride = null;

    function formatScenarioLabel(id, title) {
      return `Test Scenarios ${id}: ${title}`;
    }

    /**
     * Resolve base URL from page config or override
     */
    function getBaseUrl() {
      let baseUrl = userBaseUrlOverride || "http://localhost:3000";

      try {
        const configScriptElement = document.getElementById("api-config");
        if (configScriptElement) {
          const pageConfig = JSON.parse(configScriptElement.textContent);
          const currentEnvironment = window.Env?.current || "dev";
          if (!userBaseUrlOverride) {
            const sectionKey = document.body?.dataset?.section || "users";
            const sectionConfig = pageConfig[sectionKey];
            const usersConfig = pageConfig["users"];
            const targetConfig = sectionConfig || usersConfig;

            if (
              targetConfig &&
              targetConfig[currentEnvironment] &&
              targetConfig[currentEnvironment].endpoint
            ) {
              const endpointUrl = targetConfig[currentEnvironment].endpoint;
              const urlMatch = endpointUrl.match(/^(https?:\/\/[^\/]+)/);
              if (urlMatch) {
                baseUrl = urlMatch[1];
              }
            } else {
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
        console.warn(
          "[Edge Tests Users] Could not parse API config, using default base URL:",
          configError
        );
      }

      console.log("[Edge Tests Users] Using base URL:", baseUrl);
      return baseUrl;
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
            <i class="bi bi-play-circle"></i> ${formatScenarioLabel("1", "Create User")}
          </a>

          <a href="#test-scenario-1-D" class="index-link" ${subScenarioStyle}>
             ${iconStyle} ${formatScenarioLabel("1-D", "Duplicate User")}
          </a>
          <a href="#test-scenario-2" class="index-link">
            <i class="bi bi-play-circle"></i> ${formatScenarioLabel("2", "Get Users (list)")}
          </a>
          <a href="#test-scenario-3" class="index-link">
            <i class="bi bi-play-circle"></i> ${formatScenarioLabel("3", "Get User by ID")}
          </a>
          <a href="#test-scenario-3-B" class="index-link" ${subScenarioStyle}>
             ${iconStyle} ${formatScenarioLabel("3-B", "Get Non-Existent User")}
          </a>
          <a href="#test-scenario-4" class="index-link">
            <i class="bi bi-play-circle"></i> ${formatScenarioLabel("4", "Update User (comprehensive)")}
          </a>
          <a href="#test-scenario-4-B" class="index-link" ${subScenarioStyle}>
             ${iconStyle} ${formatScenarioLabel("4-B", "Update Role")}
          </a>
          <a href="#test-scenario-4-C" class="index-link" ${subScenarioStyle}>
             ${iconStyle} ${formatScenarioLabel("4-C", "Update Non-Existent")}
          </a>
          <a href="#test-scenario-5" class="index-link">
            <i class="bi bi-play-circle"></i> ${formatScenarioLabel("5", "Update User Settings")}
          </a>
          <a href="#test-scenario-5-B" class="index-link" ${subScenarioStyle}>
             ${iconStyle} ${formatScenarioLabel("5-B", "Update Settings 404")}
          </a>
          <a href="#test-scenario-6" class="index-link">
            <i class="bi bi-play-circle"></i> ${formatScenarioLabel("6", "Update User Profile")}
          </a>
          <a href="#test-scenario-6-B" class="index-link" ${subScenarioStyle}>
             ${iconStyle} ${formatScenarioLabel("6-B", "Update Profile 404")}
          </a>
          <a href="#test-scenario-7" class="index-link">
            <i class="bi bi-play-circle"></i> ${formatScenarioLabel("7", "Delete User")}
          </a>
          <a href="#test-scenario-7-B" class="index-link" ${subScenarioStyle}>
             ${iconStyle} ${formatScenarioLabel("7-B", "Delete Non-Existent")}
          </a>
          <a href="#cleanup-section" class="index-link">
            <i class="bi bi-trash"></i> Cleanup Method
          </a>
        </div>
      `;
    }

    /**
     * Create scenario sections
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
      let checklistHtml = "";
      const displayTitle = formatScenarioLabel(scenarioId, title);
      if (checklistItems.length > 0) {
        const checklistItemsHtml = checklistItems
          .map((item, index) => {
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
        checklistHtml = `
          <div class="checklist-container">
            <strong><i class="bi bi-check2-square"></i> Manual Verification Checklist:</strong>
            <div class="mt-2">${checklistItemsHtml}</div>
          </div>
        `;
      }

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

      const apiEndpointHtml = `
        <div class="api-params-block">
          <strong>API Endpoint:</strong>
          <div class="mt-2">
            <code>${apiMethod} ${apiEndpoint}</code>
          </div>
        </div>
      `;

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

          const parentPaths = [];
          const parts = field.id.split(".");
          if (parts.length > 1) {
            for (let i = 1; i < parts.length; i += 1) {
              parentPaths.push(parts.slice(0, i).join("."));
            }
          }
          const parentLabelsHtml = renderParentLabels(parentPaths);

          if (field.type === "select") {
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

      const codeExampleHtml = buildCodeUsageExample(
        scenarioId,
        apiMethod,
        apiEndpoint,
        requestPayload,
        inputFields
      );

      let importantNoteMessage =
        "This is a GET request, so no request body is sent.";
      if (apiMethod === "POST" || apiMethod === "PUT" || apiMethod === "PATCH") {
        importantNoteMessage =
          "This request includes <code>testing: true</code> parameter to indicate this is a test request.";
      } else if (apiMethod === "DELETE") {
        importantNoteMessage =
          "This is a DELETE request; ensure the backend supports deletion for this endpoint and that test data can be safely removed.";
      }

      return `
        <div class="test-scenario-card card" id="test-scenario-${scenarioId}">
          <div class="card-header">
            <div class="d-flex align-items-center justify-content-between">
              <h5 class="card-title mb-0">${displayTitle}</h5>
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

    async function render() {
      pageContent.innerHTML = spinner
        ? spinner()
        : '<div class="loading-state">Loading...</div>';

      const initialBaseUrl = getBaseUrl();
      ensureCollapseToggleStyles();
      ensureEdgeTestInputStyles();

      const pageHtml = `
        <div class="demo-section prerequisites-section" id="prerequisites-section">
          <h3><i class="bi bi-gear"></i> Prerequisites</h3>
          <p class="description-text">
            Before using this edge test page, ensure the following prerequisites are met:
          </p>
          <ul>
            <li><strong>Environment Setup:</strong> Development server running (e.g., localhost:3000)</li>
            <li><strong>API Configuration:</strong> API endpoints configured in api-config script tag</li>
            <li><strong>Database Access:</strong> Access to database for manual verification</li>
            <li><strong>Dependencies:</strong> All required JavaScript files loaded (APIHandler, AdminShell, etc.)</li>
          </ul>
          <div class="important-note">
            <strong>Note:</strong> All POST requests automatically include <code>testing: true</code> parameter.
          </div>
        </div>

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
            <strong>Query Parameters:</strong> Parameters passed in URL for GET requests (e.g., ?limit=10).
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
              <i class="bi bi-arrows-collapse"></i> Collapse All
            </button>
          </div>
          <p class="description-text">
            Click "Test API Call" on any scenario below to execute the test. 
            Results will be displayed in the response container.
          </p>

          ${createTestScenarioSection(
            "1",
            "Create User",
            "Creates a new user via POST /users/createUser with nested profile and settings support.",
            "POST",
            "/users/createUser",
            {
              userName: "edge_user_01",
              displayName: "Edge Test User",
              avatarUrl: "https://example.com/avatar.jpg",
              role: "user",
              isNewUser: true,
              user_settings: {
                locale: "en-US",
                notifications: { email: true, sms: false },
                callVideoMessage: true,
                presencePreference: "online",
              },
              user_profile: {
                bio: "Edge test bio",
                gender: "non-binary",
                age: 29,
                bodyType: "athletic",
                hairColor: "brown",
                country: "US",
                coverImage: "https://example.com/cover.jpg",
                backgroundImages: ["https://example.com/bg1.jpg"],
                socialUrls: ["https://twitter.com/edge"],
                additionalUrls: ["https://edge.example.com"],
              },
            },
            [
              "Validate the user is created with the provided username and displayName",
              "Ensure 409 is returned when username is already taken",
              "Confirm nested profile/settings fields are persisted",
              "Check default flags (role, isNewUser) and timestamps",
              "Verify testing flag is present in POST payload",
            ],
            [
              { type: "text", id: "userName", required: true, label: "Username", placeholder: "Unique username", value: "edge_user_01" },
              { type: "text", id: "displayName", label: "Display Name", placeholder: "Display name", value: "Edge Test User" },
              { type: "text", id: "avatarUrl", label: "Avatar URL", placeholder: "https://example.com/avatar.jpg", value: "" },
              {
                type: "select",
                id: "role",
                label: "Role",
                options: [
                  { value: "user", text: "User" },
                  { value: "admin", text: "Admin" },
                  { value: "moderator", text: "Moderator" },
                ],
              },
              {
                type: "select",
                id: "isNewUser",
                label: "Is New User",
                options: [
                  { value: "true", text: "True" },
                  { value: "false", text: "False" },
                ],
              },
              { type: "text", id: "user_settings.locale", label: "Locale", placeholder: "en-US", value: "en-US" },
              {
                type: "select",
                id: "user_settings.callVideoMessage",
                label: "Call Video Message",
                options: [
                  { value: "true", text: "Enabled" },
                  { value: "false", text: "Disabled" },
                ],
              },
              { type: "text", id: "user_settings.presencePreference", label: "Presence Preference", placeholder: "online", value: "online" },
              {
                type: "select",
                id: "user_settings.notifications.email",
                label: "Notify by Email",
                options: [
                  { value: "true", text: "Yes" },
                  { value: "false", text: "No" },
                ],
              },
              {
                type: "select",
                id: "user_settings.notifications.sms",
                label: "Notify by SMS",
                options: [
                  { value: "false", text: "No" },
                  { value: "true", text: "Yes" },
                ],
              },
              { type: "text", id: "user_profile.bio", label: "Bio", placeholder: "Short bio", value: "Edge test bio" },
              { type: "text", id: "user_profile.gender", label: "Gender", placeholder: "", value: "" },
              { type: "text", id: "user_profile.age", label: "Age", placeholder: "Numeric", value: "29", inputMode: "numeric" },
              { type: "text", id: "user_profile.bodyType", label: "Body Type", placeholder: "", value: "" },
              { type: "text", id: "user_profile.hairColor", label: "Hair Color", placeholder: "", value: "" },
              { type: "text", id: "user_profile.country", label: "Country", placeholder: "", value: "US" },
              { type: "text", id: "user_profile.coverImage", label: "Cover Image URL", placeholder: "https://example.com/cover.jpg", value: "" },
              { type: "text", id: "user_profile.backgroundImages", label: "Background Images (comma separated)", placeholder: "https://example.com/bg1.jpg, https://example.com/bg2.jpg", value: "" },
              { type: "text", id: "user_profile.socialUrls", label: "Social URLs (comma separated)", placeholder: "https://twitter.com/edge", value: "" },
              { type: "text", id: "user_profile.additionalUrls", label: "Additional URLs (comma separated)", placeholder: "https://edge.example.com", value: "" },
            ]
          )}





          ${createTestScenarioSection(
            "1-D",
            "Duplicate User Check",
            "Attempts to create a user with an existing username to verify 409 conflict.",
            "POST",
            "/users/createUser",
            {
               userName: "edge_user_01"
            },
            [
               "Ensure response status is 409 Conflict",
               "Verify error message indicates duplicate user"
            ],
            [
               { type: "text", id: "userName", required: true, label: "Existing Username", value: "edge_user_01" }
            ]
          )}

          ${createTestScenarioSection(
            "2",
            "Get Users (list)",
            "Fetches users with pagination via GET /users/fetchUsers using limit and offset.",
            "GET",
            "/users/fetchUsers",
            null,
            [
              "Verify pagination (limit/offset) returns expected counts",
              "Confirm ordering is consistent and deterministic",
              "Cross-check count matches database for the filter criteria",
              "Ensure performance is acceptable for high offsets",
            ],
            [
              { type: "text", id: "limit", label: "Limit", placeholder: "Number of users", value: "10", inputMode: "numeric" },
              { type: "text", id: "offset", label: "Offset", placeholder: "Records to skip", value: "0", inputMode: "numeric" },
            ]
          )}

          ${createTestScenarioSection(
            "3",
            "Get User by ID",
            "Retrieves a single user via GET /users/fetchUserById/{userId} including presence status.",
            "GET",
            "/users/fetchUserById/{userId}",
            null,
            [
              "Confirm the response contains user profile plus online status",
              "Validate 404 behavior for unknown userId",
              "Check presence fields (online/status) reflect service values",
              "Ensure sensitive fields are not leaked",
            ],
            [
              { type: "text", id: "userId", required: true, label: "User ID", placeholder: "Enter userId (uid)", value: "" },
            ]
          )}

          ${createTestScenarioSection(
            "3-B",
            "Get Non-Existent User",
            "Attempts to fetch a user that does not exist to verify 404 handling.",
            "GET",
            "/users/fetchUserById/{userId}",
            null,
            [
              "Ensure response status is 404 Not Found",
              "Verify error structure contains meaningful message"
            ],
            [
              { type: "text", id: "userId", required: true, label: "Non-Existent ID", value: "non_existent_id_99999" }
            ]
          )}

          ${createTestScenarioSection(
            "4",
            "Update User (comprehensive)",
            "Updates core user fields plus nested settings/profile via PUT /users/updateUser/{userId}.",
            "PUT",
            "/users/updateUser/{userId}",
            {
              displayName: "Updated Edge User",
              avatarUrl: "https://example.com/avatar-new.jpg",
              role: "moderator",
              isNewUser: false,
              user_settings: {
                locale: "en-GB",
                notifications: { email: true, sms: true },
                callVideoMessage: false,
                presencePreference: "away",
              },
              user_profile: {
                bio: "Updated edge bio",
                gender: "non-binary",
                age: 30,
                bodyType: "fit",
                hairColor: "black",
                country: "UK",
                coverImage: "https://example.com/cover-new.jpg",
                backgroundImages: ["https://example.com/bg-new.jpg"],
                socialUrls: ["https://linkedin.com/in/edge"],
                additionalUrls: ["https://edge-updated.example.com"],
              },
            },
            [
              "Provide userId path param and expected fields to change",
              "Ensure nested settings/profile flatten correctly in service",
              "Confirm 404 on unknown userId and 200 on success",
              "Validate role changes respect authorization rules",
              "Check audit fields/timestamps update",
            ],
            [
              { type: "text", id: "userId", required: true, label: "User ID", placeholder: "Target userId", value: "" },
              { type: "text", id: "displayName", label: "Display Name", placeholder: "Updated name", value: "Updated Edge User" },
              { type: "text", id: "avatarUrl", label: "Avatar URL", placeholder: "https://example.com/avatar-new.jpg", value: "" },
              {
                type: "select",
                id: "role",
                label: "Role",
                options: [
                  { value: "user", text: "User" },
                  { value: "admin", text: "Admin" },
                  { value: "moderator", text: "Moderator" },
                ],
              },
              {
                type: "select",
                id: "isNewUser",
                label: "Is New User",
                options: [
                  { value: "true", text: "True" },
                  { value: "false", text: "False" },
                ],
              },
              { type: "text", id: "user_settings.locale", label: "Locale", placeholder: "en-GB", value: "en-GB" },
              {
                type: "select",
                id: "user_settings.callVideoMessage",
                label: "Call Video Message",
                options: [
                  { value: "true", text: "Enabled" },
                  { value: "false", text: "Disabled" },
                ],
              },
              { type: "text", id: "user_settings.presencePreference", label: "Presence Preference", placeholder: "away", value: "away" },
              {
                type: "select",
                id: "user_settings.notifications.email",
                label: "Notify by Email",
                options: [
                  { value: "true", text: "Yes" },
                  { value: "false", text: "No" },
                ],
              },
              {
                type: "select",
                id: "user_settings.notifications.sms",
                label: "Notify by SMS",
                options: [
                  { value: "false", text: "No" },
                  { value: "true", text: "Yes" },
                ],
              },
              { type: "text", id: "user_profile.bio", label: "Bio", placeholder: "Updated bio", value: "Updated edge bio" },
              { type: "text", id: "user_profile.gender", label: "Gender", placeholder: "", value: "non-binary" },
              { type: "text", id: "user_profile.age", label: "Age", placeholder: "Numeric", value: "30", inputMode: "numeric" },
              { type: "text", id: "user_profile.bodyType", label: "Body Type", placeholder: "", value: "fit" },
              { type: "text", id: "user_profile.hairColor", label: "Hair Color", placeholder: "", value: "black" },
              { type: "text", id: "user_profile.country", label: "Country", placeholder: "", value: "UK" },
              { type: "text", id: "user_profile.coverImage", label: "Cover Image URL", placeholder: "https://example.com/cover-new.jpg", value: "" },
              { type: "text", id: "user_profile.backgroundImages", label: "Background Images (comma separated)", placeholder: "https://example.com/bg-new.jpg", value: "" },
              { type: "text", id: "user_profile.socialUrls", label: "Social URLs (comma separated)", placeholder: "https://linkedin.com/in/edge", value: "" },
              { type: "text", id: "user_profile.additionalUrls", label: "Additional URLs (comma separated)", placeholder: "https://edge-updated.example.com", value: "" },
            ]
          )}

          ${createTestScenarioSection(
            "4-B",
            "Update User Role",
            "Updates just the user role (privilege escalation) to verify role mutation.",
            "PUT",
            "/users/updateUser/{userId}",
            {
              role: "moderator"
            },
            [
              "Verify role changes from 'user' to 'moderator'",
              "Check that other fields remain unchanged (if patch-like behavior)"
            ],
            [
              { type: "text", id: "userId", required: true, label: "User ID", value: "" },
              { type: "select", id: "role", label: "New Role", options: [{ value: "moderator", text: "Moderator" }, { value: "admin", text: "Admin" }], value: "moderator" }
            ]
          )}

          ${createTestScenarioSection(
            "4-C",
            "Update Non-Existent User",
            "Attempts to update a user that does not exist to verify 404 handling.",
            "PUT",
            "/users/updateUser/{userId}",
            {
              displayName: "Ghost User"
            },
            [
              "Ensure response status is 404 Not Found",
              "Verify system handles invalid ID gracefully without crashing"
            ],
            [
              { type: "text", id: "userId", required: true, label: "Non-Existent ID", value: "non_existent_update_id" },
              { type: "text", id: "displayName", label: "Display Name", value: "Ghost User" }
            ]
          )}

          ${createTestScenarioSection(
            "5",
            "Update User Settings",
            "Updates only the settings payload via PUT /users/updateUserSettings/{userId}.",
            "PUT",
            "/users/updateUserSettings/{userId}",
            {
              locale: "en-US",
              notifications: { email: true, sms: false },
              callVideoMessage: false,
              presencePreference: "online",
            },
            [
              "Ensure only settings fields are changed (no profile mutation)",
              "Validate boolean toggles persist correctly",
              "Confirm presencePreference updates status in presence service",
              "Check 404 on unknown userId",
            ],
            [
              { type: "text", id: "userId", required: true, label: "User ID", placeholder: "Target userId", value: "" },
              { type: "text", id: "locale", label: "Locale", placeholder: "en-US", value: "en-US" },
              { type: "select", id: "callVideoMessage", label: "Call Video Message", options: [ { value: "true", text: "Enabled" }, { value: "false", text: "Disabled" } ] },
              { type: "text", id: "presencePreference", label: "Presence Preference", placeholder: "online/away/dnd", value: "online" },
              { type: "select", id: "notifications.email", label: "Notify by Email", options: [ { value: "true", text: "Yes" }, { value: "false", text: "No" } ] },
              { type: "select", id: "notifications.sms", label: "Notify by SMS", options: [ { value: "false", text: "No" }, { value: "true", text: "Yes" } ] },
            ]
          )}

          ${createTestScenarioSection(
            "5-B",
            "Update Settings Non-Existent",
            "Attempts to update settings for a user that does not exist to verify 404 handling.",
            "PUT",
            "/users/updateUserSettings/{userId}",
            {
              locale: "fr-FR"
            },
            [
              "Ensure response status is 404 Not Found",
              "Verify system handles invalid ID gracefully"
            ],
            [
              { type: "text", id: "userId", required: true, label: "Non-Existent ID", value: "non_existent_settings_id" },
              { type: "text", id: "locale", label: "Locale", value: "fr-FR" }
            ]
          )}

          ${createTestScenarioSection(
            "6",
            "Update User Profile",
            "Updates profile fields via PUT /users/updateUserProfile/{userId} without touching settings.",
            "PUT",
            "/users/updateUserProfile/{userId}",
            {
              bio: "Updated profile bio",
              gender: "female",
              age: 31,
              bodyType: "athletic",
              hairColor: "blonde",
              country: "CA",
              coverImage: "https://example.com/cover-profile.jpg",
              backgroundImages: ["https://example.com/bg1-profile.jpg"],
              socialUrls: ["https://instagram.com/edge"],
              additionalUrls: ["https://edge-profile.example.com"],
            },
            [
              "Verify profile changes do not overwrite settings",
              "Ensure array fields (backgroundImages, socialUrls) persist correctly",
              "Confirm 404 on unknown userId",
              "Check timestamps/audit entries update",
            ],
            [
              { type: "text", id: "userId", required: true, label: "User ID", placeholder: "Target userId", value: "" },
              { type: "text", id: "bio", label: "Bio", placeholder: "Updated profile bio", value: "Updated profile bio" },
              { type: "text", id: "gender", label: "Gender", placeholder: "", value: "female" },
              { type: "text", id: "age", label: "Age", placeholder: "Numeric", value: "31", inputMode: "numeric" },
              { type: "text", id: "bodyType", label: "Body Type", placeholder: "", value: "athletic" },
              { type: "text", id: "hairColor", label: "Hair Color", placeholder: "", value: "blonde" },
              { type: "text", id: "country", label: "Country", placeholder: "", value: "CA" },
              { type: "text", id: "coverImage", label: "Cover Image URL", placeholder: "https://example.com/cover-profile.jpg", value: "" },
              { type: "text", id: "backgroundImages", label: "Background Images (comma separated)", placeholder: "https://example.com/bg1-profile.jpg", value: "" },
              { type: "text", id: "socialUrls", label: "Social URLs (comma separated)", placeholder: "https://instagram.com/edge", value: "" },
              { type: "text", id: "additionalUrls", label: "Additional URLs (comma separated)", placeholder: "https://edge-profile.example.com", value: "" },
            ]
          )}

          ${createTestScenarioSection(
            "6-B",
            "Update Profile Non-Existent",
            "Attempts to update profile for a user that does not exist to verify 404 handling.",
            "PUT",
            "/users/updateUserProfile/{userId}",
            {
              bio: "Ghost Bio"
            },
            [
              "Ensure response status is 404 Not Found",
              "Verify system handles invalid ID gracefully"
            ],
            [
              { type: "text", id: "userId", required: true, label: "Non-Existent ID", value: "non_existent_profile_id" },
              { type: "text", id: "bio", label: "Bio", value: "Ghost Bio" }
            ]
          )}

          ${createTestScenarioSection(
            "7",
            "Delete User",
            "Deletes a user via DELETE /users/deleteUser/{userId}.",
            "DELETE",
            "/users/deleteUser/{userId}",
            null,
            [
              "Use only disposable test users for delete",
              "Confirm soft/hard delete behavior matches contract",
              "Validate related data cleanup (sessions, profile, settings)",
              "Check 404 for already deleted users",
            ],
            [
              { type: "text", id: "userId", label: "User ID", placeholder: "userId to delete", value: "" },
            ]
          )}

          ${createTestScenarioSection(
            "7-B",
            "Delete Non-Existent User",
            "Attempts to delete a user that does not exist to verify error handling.",
            "DELETE",
            "/users/deleteUser/{userId}",
            null,
            [
              "Ensure response status is 404 Not Found (or appropriate error)",
              "Verify idempotent behavior if applicable"
            ],
            [
              { type: "text", id: "userId", required: true, label: "Non-Existent ID", value: "non_existent_delete_id" }
            ]
          )}
        </div>

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
