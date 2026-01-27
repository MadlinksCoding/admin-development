/**
 * Edge Tests - Shared Utilities
 * Provides reusable builders and helpers for Edge Test pages.
 * Exposes a global namespace: window.EdgeTestsShared
 */
(function () {
	if (window.EdgeTestsShared) return;

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

	function defaultFormatScenarioLabel(id, title) {
		return `Test Scenarios ${id}: ${title}`;
	}

	function getBaseUrl(sectionKey, userBaseUrlOverride = null) {
		if (userBaseUrlOverride) return userBaseUrlOverride;
		let baseUrl = "http://localhost:3000";
		try {
			const configScriptElement = document.getElementById("api-config");
			if (configScriptElement) {
				const pageConfig = JSON.parse(configScriptElement.textContent);
				const currentEnvironment = window.Env?.current || "dev";
				const bodySection = document.body?.dataset?.section;
				const resolvedSectionKey = bodySection || sectionKey;
				const sectionConfig = resolvedSectionKey ? pageConfig[resolvedSectionKey] : undefined;
				const fallbackConfig = sectionKey ? pageConfig[sectionKey] : undefined;
				const targetConfig = sectionConfig || fallbackConfig;
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
					if (adminEndpoints && adminEndpoints.base && adminEndpoints.base[currentEnvironment]) {
						baseUrl = adminEndpoints.base[currentEnvironment];
					}
				}
			}
		} catch (e) {
			console.warn("[Edge Tests Shared] Could not parse API config, using default base URL:", e);
		}
		return baseUrl;
	}

	function createIndexNavigation(ScenarioList = [], options = {}) {
		const indent = !!options.indentSub;
		const formatScenarioLabel = options.formatScenarioLabel || defaultFormatScenarioLabel;
		const subScenarioStyle = indent ? 'style="margin-left: 20px; font-size: 0.9em;"' : "";
		const iconStyle = indent ? '<i class="bi bi-arrow-return-right"></i>' : '<i class="bi bi-play-circle"></i>';

		const buildScenarioLinks = () => {
			if (!Array.isArray(ScenarioList) || ScenarioList.length === 0) return "";
			const childrenByParent = new Map();
			ScenarioList.forEach((s) => {
				if (s && s.parent) {
					if (!childrenByParent.has(s.parent)) childrenByParent.set(s.parent, []);
					childrenByParent.get(s.parent).push(s);
				}
			});
			const parts = [];
			ScenarioList.filter((s) => s && !s.parent).forEach((s) => {
				const id = s.scenarioId;
				const title = s.title || id;
				parts.push(
					`<a href="#test-scenario-${id}" class="index-link"><i class=\"bi bi-play-circle\"></i> ${formatScenarioLabel(id, title)}</a>`
				);
				const kids = childrenByParent.get(id) || [];
				kids.forEach((k) => {
					const kidId = k.scenarioId;
					const kidTitle = k.title || kidId;
					parts.push(
						`<a href="#test-scenario-${kidId}" class="index-link" ${subScenarioStyle}>${iconStyle} ${formatScenarioLabel(kidId, kidTitle)}</a>`
					);
				});
			});
			const renderedIds = new Set(
				parts.join("\n").match(/#test-scenario-([^"']+)/g)?.map((m) => m.replace('#test-scenario-', '')) || []
			);
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

	function buildCodeUsageExample(scenarioId, method, endpoint, payload, inputFields = [], opts = {}) {
		const getUrl = opts.getBaseUrl || (() => getBaseUrl(opts.sectionKey, opts.userBaseUrlOverride));
		const baseUrl = getUrl();
		const pathParams = [...endpoint.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]);
		const endpointTemplate = pathParams.reduce((acc, name) => acc.replace(`{${name}}`, '${' + name + '}'), endpoint);
		const pathParamDecls = pathParams.map((name) => `const ${name} = "<${name}>"; // path param`).join("\n");
		const fullUrlLine = pathParams.length ? `const fullUrl = \`${baseUrl}${endpointTemplate}\`;` : `const fullUrl = \`${baseUrl}${endpoint}\`;`;

		const sampleValue = (field) => {
			if (field.value !== undefined && field.value !== "") return field.value;
			if (field.placeholder) return field.placeholder;
			if (field.options && field.options.length > 0) return field.options[0].value;
			return `<${field.id}>`;
		};

		const queryFields = method === "GET" ? inputFields.filter((f) => !pathParams.includes(f.id)) : [];
		let queryParamsBlock = "{}";
		if (queryFields.length) {
			const qpLines = queryFields
				.map((f) => `    ${JSON.stringify(f.id)}: ${JSON.stringify(sampleValue(f))},`)
				.join("\n");
			queryParamsBlock = `{\n${qpLines}\n  }`;
		}

		const payloadWithTesting = method === "POST" || method === "PUT" || method === "PATCH"
			? (payload ? { ...payload, testing: true } : { testing: true })
			: {};
		const requestDataBlock = method === "POST" || method === "PUT" || method === "PATCH"
			? JSON.stringify(payloadWithTesting, null, 2)
			: "{}";

		let paramExplanations = `
			<div class="mt-3">
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
		const codeExample = (method === "GET")
			? `
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
			`
			: `
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

		return `
			<div class="api-params-block">
				<div class="d-flex align-items-center justify-content-between">
					<strong>Code Usage Example:</strong>
					<button class="btn btn-sm btn-outline-secondary collapse-toggle collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#code-example-body-${scenarioId}" aria-expanded="false" aria-controls="code-example-body-${scenarioId}" aria-label="Toggle code example">
						<i class="bi bi-chevron-up icon-expanded" aria-hidden="true"></i>
						<i class="bi bi-chevron-down icon-collapsed" aria-hidden="true"></i>
						<span class="visually-hidden">Toggle code example</span>
					</button>
				</div>
				<div id="code-example-body-${scenarioId}" class="collapse mt-2">
					<div class="code-example mt-2">
						<pre><code>${codeExample}</code></pre>
					</div>
					${paramExplanations}
				</div>
			</div>
		`;
	}

	function createTestScenarioSection(params, opts = {}) {
		const {
			scenarioId,
			title,
			description,
			apiMethod,
			apiEndpoint,
			requestPayload = null,
			checklistItems = [],
			inputFields = [],
		} = params || {};

		const formatScenarioLabel = opts.formatScenarioLabel || defaultFormatScenarioLabel;
		const displayTitle = formatScenarioLabel(scenarioId, title);

		let checklistHtml = "";
		if (Array.isArray(checklistItems) && checklistItems.length > 0) {
			const checklistItemsHtml = checklistItems
				.map((item, index) => `
					<div class="checklist-item">
						<div class="form-check">
							<input class="form-check-input" type="checkbox" id="checklist-${scenarioId}-${index}" />
							<label class="form-check-label" for="checklist-${scenarioId}-${index}">${item}</label>
						</div>
					</div>
				`)
				.join("");
			checklistHtml = `
				<div class="checklist-container">
					<strong><i class="bi bi-check2-square"></i> Manual Verification Checklist:</strong>
					<div class="mt-2">${checklistItemsHtml}</div>
				</div>
			`;
		}

		let requestPayloadHtml = "";
		const methodNeedsBody = apiMethod === "POST" || apiMethod === "PUT" || apiMethod === "PATCH";
		if (methodNeedsBody) {
			const getUrl = opts.getBaseUrl || (() => getBaseUrl(opts.sectionKey, opts.userBaseUrlOverride));
			const baseUrl = getUrl();
			const fullUrl = `${baseUrl}${apiEndpoint}`;
			const payloadWithTesting = requestPayload ? { ...requestPayload, testing: true } : { testing: true };
			const payloadJson = JSON.stringify(payloadWithTesting, null, 2);
			
			const jsExample = `fetch("${fullUrl}", {
  method: "${apiMethod}",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify(${payloadJson})
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));`;
			
			requestPayloadHtml = `
				<div class="api-params-block">
					<strong>Request Payload Example (JavaScript):</strong>
					<div class="code-example mt-2">
						<pre><code>${jsExample}</code></pre>
					</div>
					<small class="text-muted d-block mt-1"><code>testing: true</code> is added automatically to the payload.</small>
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
		if (Array.isArray(inputFields) && inputFields.length > 0) {
			const renderedParents = new Set();
			const renderParentLabels = (parentPaths) => parentPaths
				.map((path) => {
					if (!path || renderedParents.has(path)) return "";
					renderedParents.add(path);
					const indentLevel = path.split(".").length - 1;
					const indentStyle = indentLevel > 0 ? `style="margin-left: ${indentLevel * 16}px; border-left: 2px solid #e0e0e0; padding-left: 8px;"` : "";
					const labelText = path.split(".").pop();
					return `<div class="nested-group-label" ${indentStyle}><strong>${labelText}</strong></div>`;
				})
				.join("");

			const placeholderMatches = [...apiEndpoint.matchAll(/\{([^}]+)\}/g)];
			const placeholderIds = new Set(placeholderMatches.map((m) => m[1]));

			const renderField = (field) => {
				const indentLevel = field.id.includes(".") ? field.id.split(".").length - 1 : 0;
				const indentStyle = indentLevel > 0 ? `style=\"margin-left: ${indentLevel * 16}px; border-left: 2px solid #e0e0e0; padding-left: 8px;\"` : "";
				const inputId = `input-${scenarioId}-${field.id.replace(/\./g, "-")}`;

				const parentPaths = [];
				const parts = field.id.split(".");
				if (parts.length > 1) {
					for (let i = 1; i < parts.length; i += 1) parentPaths.push(parts.slice(0, i).join("."));
				}
				const parentLabelsHtml = renderParentLabels(parentPaths);

				if (field.type === "select") {
					const optionsHtml = field.options
						.map((option) => `<option value="${option.value}">${option.text}</option>`) 
						.join("");
					return `
						${parentLabelsHtml}
						<div class="test-input-group" ${indentStyle}>
							<label for="${inputId}">${field.label}${field.required ? " *" : ""}:</label>
							<select id="${inputId}" class="form-control" data-field-id="${field.id}" data-field-type="select" ${field.required ? "required" : ""} data-required="${field.required ? "true" : "false"}">
								${optionsHtml}
							</select>
						</div>
					`;
				}
				const inputType = field.typeOverride || field.type || "text";
				const patternAttr = field.pattern ? `pattern="${field.pattern}"` : "";
				const inputModeAttr = field.inputMode ? `inputmode="${field.inputMode}"` : "";
				return `
					${parentLabelsHtml}
					<div class="test-input-group" ${indentStyle}>
						<label for="${inputId}">${field.label}${field.required ? " *" : ""}:</label>
						<input type="${inputType}" id="${inputId}" class="form-control" data-field-id="${field.id}" data-field-type="${inputType}" data-required="${field.required ? "true" : "false"}" placeholder="${field.placeholder || ""}" value="${field.value || ""}" ${patternAttr} ${inputModeAttr} ${field.required ? "required" : ""}>
					</div>
				`;
			};

			const pathFields = inputFields.filter((f) => placeholderIds.has(f.id));
			const remainingFields = inputFields.filter((f) => !placeholderIds.has(f.id));
			const queryFields = apiMethod === "GET" ? remainingFields : [];
			const bodyFields = apiMethod === "GET" ? [] : remainingFields;
			const renderGroup = (fields, label) => fields.length ? `
				<div class="mb-3">
					<strong>${label}</strong>
					${fields.map(renderField).join("")}
				</div>
			` : "";

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
			inputFields,
			{ getBaseUrl: opts.getBaseUrl, sectionKey: opts.sectionKey, userBaseUrlOverride: opts.userBaseUrlOverride }
		);

		let importantNoteMessage = "This is a GET request, so no request body is sent.";
		if (apiMethod === "POST" || apiMethod === "PUT" || apiMethod === "PATCH") {
			importantNoteMessage = "This request includes <code>testing: true</code> parameter to indicate this is a test request.";
		} else if (apiMethod === "DELETE") {
			importantNoteMessage = "This is a DELETE request; ensure the backend supports deletion for this endpoint and that test data can be safely removed.";
		}

		return `
			<div class="test-scenario-card card" id="test-scenario-${scenarioId}">
				<div class="card-header">
					<div class="d-flex align-items-center justify-content-between">
						<h5 class="card-title mb-0">${displayTitle}</h5>
						<button class="btn btn-sm btn-outline-secondary collapse-toggle collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#scenario-body-${scenarioId}" aria-expanded="false" aria-controls="scenario-body-${scenarioId}" aria-label="Toggle scenario section">
							<i class="bi bi-chevron-up icon-expanded" aria-hidden="true"></i>
							<i class="bi bi-chevron-down icon-collapsed" aria-hidden="true"></i>
							<span class="visually-hidden">Toggle scenario section</span>
						</button>
					</div>
				</div>
				<div id="scenario-body-${scenarioId}" class="card-body collapse">
					<p class="description-text">${description}</p>
					${apiEndpointHtml}
					${codeExampleHtml}
					${inputFieldsHtml}
					${requestPayloadHtml}
					<div class="important-note">
						<strong><i class="bi bi-exclamation-triangle"></i> Important:</strong>
						${importantNoteMessage}
					</div>
					<div class="mt-3 d-flex gap-2">
						<button class="btn btn-primary flex-grow-1 test-scenario-btn" 
										data-scenario-id="${scenarioId}" 
										data-method="${apiMethod}" 
										data-endpoint="${apiEndpoint}" 
										data-payload='${requestPayload ? JSON.stringify(requestPayload) : "null"}'
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

	function attachIndexLinkSmoothScroll() {
		document.querySelectorAll(".index-link").forEach((link) => {
			link.addEventListener("click", (e) => {
				e.preventDefault();
				const targetId = link.getAttribute("href").substring(1);
				const targetElement = document.getElementById(targetId);
				if (targetElement) {
					targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
				}
			});
		});
	}

	function renderPrerequisites(prerequisites) {
		if (!prerequisites || prerequisites.length === 0) return '';
		const list = prerequisites.map(prereq => `<li>${prereq}</li>`).join('');
		return `
		 <div class="demo-section prerequisites-section" id="prerequisites-section">
          <h3><i class="bi bi-gear"></i> Prerequisites</h3>
          <p class="description-text">
            Before using this edge test page, ensure the following prerequisites are met:
          </p>
				<h6 class="text-muted">Prerequisites</h6>
				<ul >${list}</ul>
				  <div class="important-note">
            <strong>Note:</strong> All POST requests automatically include <code>testing: true</code> parameter.
          </div>
        </div>
			
		`;
	}

	function renderTerminologies(terminologies) {
		if (!terminologies || Object.keys(terminologies).length === 0) return '';
		const list = Object.entries(terminologies).map(([term, desc]) => 
			`<div class="terminology-item">
				<strong>${term}:</strong> ${desc}
			</div>
		`
		).join('');
		return `
        <div class="demo-section terminology-section" id="terminology-section">
		<h3><i class="bi bi-book"></i> Terminology</h3>
			<div class="terminologies-section mb-3">
				<h6 class="text-muted">Terminologies</h6>
					${list}
				</div>
			</div>
			</div>
		`;
	}

	function collectAndValidateInputs(scenarioId) {
		const inputFields = document.querySelectorAll(
			`#test-scenario-${scenarioId} input[data-field-id], #test-scenario-${scenarioId} select[data-field-id]`
		);
		const rawInputValues = {};
		inputFields.forEach((field) => {
			const fieldId = field.getAttribute("data-field-id");
			const fieldType = field.getAttribute("data-field-type") || field.type;
			let fieldValue = field.value;

			if (typeof fieldValue === "string") fieldValue = fieldValue.trim();

			if (fieldType === "datetime-local" && fieldValue) {
				const parsedDate = Date.parse(fieldValue);
				if (!Number.isNaN(parsedDate)) fieldValue = parsedDate.toString();
			}
			rawInputValues[fieldId] = fieldValue;
		});

		const missingRequired = [];
		const inputValues = Object.fromEntries(
			Object.entries(rawInputValues).filter(([key, value]) => {
				const fieldElement = document.querySelector(`#test-scenario-${scenarioId} [data-field-id="${key}"]`);
				const isRequired = fieldElement?.dataset?.required === "true";
				if (isRequired && (value === undefined || value === null || value === "")) missingRequired.push(key);
				return value !== "";
			})
		);

		if (missingRequired.length > 0) throw new Error(`Missing required fields: ${missingRequired.join(", ")}`);
		return inputValues;
	}

	function buildRequestData(scenarioId, method, payload, inputValues, pathParamKeys, arrayFieldIdsSet) {
		const methodNeedsBody = method === "POST" || method === "PUT" || method === "PATCH";
		let editablePayload = payload;
		if (methodNeedsBody) {
			const payloadEditor = document.getElementById(`payload-${scenarioId}`);
			if (payloadEditor) {
				try { editablePayload = payloadEditor.value ? JSON.parse(payloadEditor.value) : {}; }
				catch (e) { throw new Error(`Payload must be valid JSON. ${e.message}`); }
			}
		}

		const parseArrayValue = (raw) => {
			if (Array.isArray(raw)) return raw;
			if (typeof raw !== "string") return raw;
			const trimmed = raw.trim();
			if (!trimmed) return [];
			if ((trimmed.startsWith("[") && trimmed.endsWith("]")) || trimmed.startsWith("{")) {
				try { const parsed = JSON.parse(trimmed); return Array.isArray(parsed) ? parsed : parsed; }
				catch (e) { return trimmed.split(",").map((v) => v.trim()).filter(Boolean); }
			}
			return trimmed.split(",").map((v) => v.trim()).filter(Boolean);
		};

		const nestDotPaths = (flatObj = {}, arrayFields = new Set()) => {
			const clone = { ...flatObj };
			const normalize = (keyPath, value) => {
				if (arrayFields.has(keyPath)) return parseArrayValue(value);
				if (value === "true") return true;
				if (value === "false") return false;
				return value;
			};
			Object.entries(flatObj).forEach(([key, value]) => {
				if (!key.includes(".")) { clone[key] = normalize(key, value); return; }
				delete clone[key];
				const parts = key.split(".");
				let cursor = clone;
				parts.forEach((part, idx) => {
					if (idx === parts.length - 1) cursor[part] = normalize(parts.join("."), value);
					else {
						if (!cursor[part] || typeof cursor[part] !== "object" || Array.isArray(cursor[part])) cursor[part] = {};
						cursor = cursor[part];
					}
				});
			});
			return clone;
		};

		let requestData = {};
		if (methodNeedsBody) requestData = { ...(editablePayload || {}), ...inputValues, testing: true };

		if (methodNeedsBody) requestData = nestDotPaths(requestData, arrayFieldIdsSet);

		const queryParams = method === "GET"
			? Object.fromEntries(Object.entries(inputValues).filter(([key]) => !pathParamKeys.has(key)))
			: {};

		return { requestData, queryParams };
	}

	function initPage(config) {
		const {
			section,
			prerequisites = [],
			terminologies = {},
			cleanupEndpoint = null,
			arrayFieldIds = [],
			indentSubScenarios = false,
		} = config;

		const arrayFieldIdsSet = new Set(arrayFieldIds);
		let ScenarioList = [];
		let userBaseUrlOverride = null;

		const { spinner, spinnerInline, errorMessage } = window.AdminUtils || {};

		async function testScenario(scenarioId, method, endpoint, payload) {
			const responseContainer = document.getElementById(`response-${scenarioId}`);
			if (!responseContainer) return;

			responseContainer.innerHTML = spinnerInline ? spinnerInline("Testing API call...") : '<div class="loading-state">Testing API call...</div>';

			try {
				const baseUrl = getBaseUrl(section, userBaseUrlOverride);
				const inputValues = collectAndValidateInputs(scenarioId);
				let finalEndpoint = endpoint;
				const pathParamKeys = new Set();
				Object.entries(inputValues).forEach(([fieldId, fieldValue]) => {
					if (finalEndpoint.includes(`{${fieldId}}`)) {
						finalEndpoint = finalEndpoint.replace(`{${fieldId}}`, fieldValue);
						pathParamKeys.add(fieldId);
					}
				});

				const { requestData, queryParams } = buildRequestData(scenarioId, method, payload, inputValues, pathParamKeys, arrayFieldIdsSet);
				const apiHandler = new APIHandler();
				let didRenderResponse = false;

				const apiParams = {
					apiBaseUrl: `${baseUrl}${finalEndpoint}`,
					queryParams,
					httpMethod: method,
					requestData,
					responseCallback: (data) => {
						didRenderResponse = true;
						responseContainer.innerHTML = `
							<div class="alert alert-success">
								<strong><i class="bi bi-check-circle"></i> Success (200):</strong>
								<pre class="bg-light p-3 rounded mt-2" style="max-height: 400px; overflow: auto;"><code>${JSON.stringify(data, null, 2)}</code></pre>
							</div>
						`;
					},
				};

				const apiHandlerResponseListener = (event) => {
					const detail = event?.detail;
					const args = detail?.args;
					if (!args || args.apiBaseUrl !== apiParams.apiBaseUrl || args.httpMethod !== apiParams.httpMethod) return;
					
					if (detail.success === false) {
						didRenderResponse = true;
						const msg = detail.error_message?.message || detail.error_message || "Request failed";
						const status = detail.response?.status || detail.error_message?.status ? `Status: ${detail.response?.status || detail.error_message?.status}` : "";
						const responsePayload = detail.data?.error ?? detail.data ?? detail.response?.data?.error ?? detail.response?.data ?? detail.response;
						responseContainer.innerHTML = `
							<div class="alert alert-danger">
								<strong><i class="bi bi-exclamation-triangle"></i> Error:</strong>
								<p>${status} ${msg}</p>
								<pre class="bg-light p-3 rounded mt-2" style="max-height: 400px; overflow: auto;"><code>${typeof responsePayload === "string" ? responsePayload : JSON.stringify(responsePayload, null, 2)}</code></pre>
							</div>
						`;
					}
				};

				document.addEventListener("dash-api-handler-response", apiHandlerResponseListener);
				try { await apiHandler.handleRequest(apiParams); } finally {
					document.removeEventListener("dash-api-handler-response", apiHandlerResponseListener);
					if (!didRenderResponse && responseContainer.innerHTML.includes("Testing API call")) {
						responseContainer.innerHTML = '<div class="alert alert-danger"><strong>Error:</strong><p>No response received.</p></div>';
					}
				}
			} catch (err) {
				responseContainer.innerHTML = errorMessage ? errorMessage(err, "Error") : `<div class="alert alert-danger"><strong>Error:</strong><p>${err.message}</p></div>`;
			}
		}

		async function cleanupTestData() {
			const cleanupContainer = document.getElementById("cleanup-response");
			if (!cleanupContainer) return;
			cleanupContainer.innerHTML = spinnerInline ? spinnerInline("Cleaning up test data...") : "Cleaning up...";
			try {
				const baseUrl = getBaseUrl(section, userBaseUrlOverride);
				const apiHandler = new APIHandler();
				await apiHandler.handleRequest({
					apiBaseUrl: `${baseUrl}${cleanupEndpoint}`,
					queryParams: {},
					httpMethod: "POST",
					requestData: { testing: true, deleteAll: true },
					responseCallback: (data) => {
						cleanupContainer.innerHTML = `
							<div class="alert alert-success">
								<strong><i class="bi bi-check-circle"></i> Cleanup Successful:</strong>
								<pre class="bg-light p-3 rounded mt-2"><code>${JSON.stringify(data, null, 2)}</code></pre>
							</div>
						`;
					},
				});
			} catch (error) {
				cleanupContainer.innerHTML = `<div class="alert alert-danger"><strong>Cleanup Error:</strong><p>${error.message}</p></div>`;
			}
		}

		function attachEventListeners() {
			const toggleBtn = document.getElementById("toggle-all-scenarios-btn");
			if (toggleBtn) {
				toggleBtn.addEventListener("click", () => {
					const isCollapsing = toggleBtn.innerHTML.includes("Collapse");
					const allBodies = document.querySelectorAll(".test-scenario-card .card-body.collapse");
					if (window.bootstrap && window.bootstrap.Collapse) {
						allBodies.forEach((el) => {
							const instance = window.bootstrap.Collapse.getOrCreateInstance(el, { toggle: false });
							if (isCollapsing) instance.hide(); else instance.show();
						});
					} else {
						allBodies.forEach((el) => { if (isCollapsing) el.classList.remove("show"); else el.classList.add("show"); });
					}
					toggleBtn.innerHTML = isCollapsing ? '<i class="bi bi-arrows-expand"></i> Expand All' : '<i class="bi bi-arrows-collapse"></i> Collapse All';
				});
			}

			const baseUrlInput = document.getElementById("baseUrlInput");
			const applyBtn = document.getElementById("baseUrlApply");

			if (applyBtn && baseUrlInput) {
				applyBtn.addEventListener("click", (e) => {
					e.preventDefault();
					const oldBaseUrl = getBaseUrl(section, userBaseUrlOverride);
					userBaseUrlOverride = baseUrlInput.value.trim() || null;
					const newBaseUrl = getBaseUrl(section, userBaseUrlOverride);

					const status = document.getElementById("baseUrlStatus");
					if (status) {
						status.textContent = userBaseUrlOverride ? `Base URL set to ${userBaseUrlOverride}` : "Base URL reset to page config";
						status.classList.add("text-success");
						setTimeout(() => status.classList.remove("fw-bold"), 2000);
					}

					// Update visual code blocks
					document.querySelectorAll(".code-example pre code").forEach(code => {
						const content = code.textContent;
						const escapedOld = oldBaseUrl.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
						const regex = new RegExp(escapedOld, 'g');
						code.textContent = content.replace(regex, newBaseUrl);
					});
				});
			}

			document.addEventListener("click", (event) => {
				const testBtn = event.target.closest(".test-scenario-btn");
				if (testBtn) {
					const id = testBtn.getAttribute("data-scenario-id");
					const method = testBtn.getAttribute("data-method");
					const endpoint = testBtn.getAttribute("data-endpoint");
					const payloadStr = testBtn.getAttribute("data-payload");
					let payload = null;
					try { if (payloadStr && payloadStr !== "null") payload = JSON.parse(payloadStr); } catch (e) { console.error("Payload parse error", e); }
					testScenario(id, method, endpoint, payload);
				}

				const clearBtn = event.target.closest(".clear-response-btn");
				if (clearBtn) {
					const id = clearBtn.getAttribute("data-scenario-id");
					const respEl = document.getElementById(`response-${id}`);
					if (respEl) respEl.innerHTML = "";
				}

				if (event.target.id === "cleanup-btn" || event.target.closest("#cleanup-btn")) {
					if (confirm("Are you sure you want to clean up test data?")) cleanupTestData();
				}
			});
			attachIndexLinkSmoothScroll();
		}

		async function render() {
			const pageContent = window.AdminShell.pageContent;
			pageContent.innerHTML = spinner ? spinner() : "Loading...";
			const initialBaseUrl = getBaseUrl(section);

			pageContent.innerHTML = `
				${renderPrerequisites(prerequisites)}
				${renderTerminologies(terminologies)}
				${createIndexNavigation(ScenarioList, { indentSub: indentSubScenarios })}
				<div class="demo-section" id="base-url-section">
					<h3><i class="bi bi-link-45deg"></i> API Base URL</h3>
					<div class="test-input-group">
						<label for="baseUrlInput">Base URL:</label>
						<div class="d-flex gap-2">
							<input type="url" id="baseUrlInput" class="form-control" value="${initialBaseUrl}" />
							<button class="btn btn-outline-primary" id="baseUrlApply">Apply</button>
						</div>
						<small id="baseUrlStatus" class="text-muted"></small>
					</div>
				</div>
				<div class="demo-section">
					<div class="d-flex align-items-center justify-content-between">
						<h3><i class="bi bi-play-circle"></i> Test Scenarios</h3>
						<button class="btn btn-sm btn-outline-secondary" id="toggle-all-scenarios-btn"><i class="bi bi-arrows-expand"></i> Expand All</button>
					</div>
					${ScenarioList.map((s) => createTestScenarioSection(s, { sectionKey: section, getBaseUrl: () => getBaseUrl(section, userBaseUrlOverride) })).join("")}
				</div>
				${cleanupEndpoint ? `
				<div class="demo-section cleanup-section" id="cleanup-section">
					<h3><i class="bi bi-trash"></i> Cleanup Method</h3>
					<button class="btn btn-danger" id="cleanup-btn"><i class="bi bi-trash"></i> Run Cleanup</button>
					<div id="cleanup-response" class="response-container mt-3"></div>
				</div>` : ""}
			`;
			attachEventListeners();
		}

		waitForAdminShell().then(async () => {
			try {
				let path = window.location.pathname;
				// If path ends with a file (has dot), remove it
				if (path.split('/').pop().includes('.')) {
					path = path.substring(0, path.lastIndexOf('/'));
				}
				// Ensure trailing slash
				if (!path.endsWith('/')) {
					path += '/';
				}
				const scenariosUrl = window.location.origin + path + 'scenarios.json';
				const resp = await fetch(scenariosUrl);
				const json = await resp.json();
				ScenarioList = Array.isArray(json) ? json : (json.scenarios || []);
				render();
			} catch (e) { console.error(`[Edge Tests ${section}] Failed to load scenarios.json`, e); }
		});
	}

	window.EdgeTestsShared = {
		waitForAdminShell,
		defaultFormatScenarioLabel,
		getBaseUrl,
		createIndexNavigation,
		buildCodeUsageExample,
		createTestScenarioSection,
		attachIndexLinkSmoothScroll,
		renderPrerequisites,
		renderTerminologies,
		initPage,
	};
})();

