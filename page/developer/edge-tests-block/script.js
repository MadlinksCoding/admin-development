/**
 * Edge Tests - Block Class
 *
 * Comprehensive edge test page for the Block controller.
 */

(function () {
	const INDENT_SUB_SCENARIOS = false;

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

		function getBaseUrl() {
			let baseUrl = userBaseUrlOverride || "http://localhost:3000";

			try {
				const configScriptElement = document.getElementById("api-config");
				if (configScriptElement) {
					const pageConfig = JSON.parse(configScriptElement.textContent);
					const currentEnvironment = window.Env?.current || "dev";
					if (!userBaseUrlOverride) {
						const sectionKey = document.body?.dataset?.section || "block";
						const sectionConfig = pageConfig[sectionKey];
						const blockConfig = pageConfig["block"];
						const targetConfig = sectionConfig || blockConfig;

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
					"[Edge Tests Block] Could not parse API config, using default base URL:",
					configError
				);
			}

			console.log("[Edge Tests Block] Using base URL:", baseUrl);
			return baseUrl;
		}

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
					<a href="#test-scenario-1" class="index-link"><i class="bi bi-play-circle"></i> ${formatScenarioLabel("1", "List User Blocks")}</a>
					<a href="#test-scenario-2" class="index-link"><i class="bi bi-play-circle"></i> ${formatScenarioLabel("2", "Block User")}</a>
					<a href="#test-scenario-2-B" class="index-link" ${subScenarioStyle}>${iconStyle} ${formatScenarioLabel("2-B", "Block Temporary")}</a>
					<a href="#test-scenario-2-C" class="index-link" ${subScenarioStyle}>${iconStyle} ${formatScenarioLabel("2-C", "Block Feed Scope")}</a>
					<a href="#test-scenario-2-D" class="index-link" ${subScenarioStyle}>${iconStyle} ${formatScenarioLabel("2-D", "Block Self (Cycle)")}</a>
					<a href="#test-scenario-3" class="index-link"><i class="bi bi-play-circle"></i> ${formatScenarioLabel("3", "Unblock User")}</a>
					<a href="#test-scenario-3-B" class="index-link" ${subScenarioStyle}>${iconStyle} ${formatScenarioLabel("3-B", "Unblock (Non-Existent)")}</a>
					<a href="#test-scenario-4" class="index-link"><i class="bi bi-play-circle"></i> ${formatScenarioLabel("4", "Is User Blocked")}</a>
					<a href="#test-scenario-4-B" class="index-link" ${subScenarioStyle}>${iconStyle} ${formatScenarioLabel("4-B", "Is Blocked (False Check)")}</a>
					<a href="#test-scenario-5" class="index-link"><i class="bi bi-play-circle"></i> ${formatScenarioLabel("5", "Batch Check Blocks")}</a>
					<a href="#test-scenario-6" class="index-link"><i class="bi bi-play-circle"></i> ${formatScenarioLabel("6", "List System Blocks")}</a>
					<a href="#test-scenario-7" class="index-link"><i class="bi bi-play-circle"></i> ${formatScenarioLabel("7", "Block IP")}</a>
					<a href="#test-scenario-7-B" class="index-link" ${subScenarioStyle}>${iconStyle} ${formatScenarioLabel("7-B", "Block IP (Invalid)")}</a>
					<a href="#test-scenario-8" class="index-link"><i class="bi bi-play-circle"></i> ${formatScenarioLabel("8", "Is IP Blocked")}</a>
					<a href="#test-scenario-9" class="index-link"><i class="bi bi-play-circle"></i> ${formatScenarioLabel("9", "Block Email")}</a>
					<a href="#test-scenario-9-B" class="index-link" ${subScenarioStyle}>${iconStyle} ${formatScenarioLabel("9-B", "Block Email (Invalid)")}</a>
					<a href="#test-scenario-10" class="index-link"><i class="bi bi-play-circle"></i> ${formatScenarioLabel("10", "Is Email Blocked")}</a>
					<a href="#test-scenario-11" class="index-link"><i class="bi bi-play-circle"></i> ${formatScenarioLabel("11", "Block App Access")}</a>
					<a href="#test-scenario-11-B" class="index-link" ${subScenarioStyle}>${iconStyle} ${formatScenarioLabel("11-B", "Block App (Temporary)")}</a>
					<a href="#test-scenario-12" class="index-link"><i class="bi bi-play-circle"></i> ${formatScenarioLabel("12", "Is App Access Blocked")}</a>
					<a href="#test-scenario-13" class="index-link"><i class="bi bi-play-circle"></i> ${formatScenarioLabel("13", "List Manual Actions")}</a>
					<a href="#test-scenario-14" class="index-link"><i class="bi bi-play-circle"></i> ${formatScenarioLabel("14", "Suspend User")}</a>
					<a href="#test-scenario-14-B" class="index-link" ${subScenarioStyle}>${iconStyle} ${formatScenarioLabel("14-B", "Suspend (Duplicate)")}</a>
					<a href="#test-scenario-15" class="index-link"><i class="bi bi-play-circle"></i> ${formatScenarioLabel("15", "Unsuspend User")}</a>
					<a href="#test-scenario-16" class="index-link"><i class="bi bi-play-circle"></i> ${formatScenarioLabel("16", "Is User Suspended")}</a>
					<a href="#test-scenario-17" class="index-link"><i class="bi bi-play-circle"></i> ${formatScenarioLabel("17", "Warn User")}</a>
					<a href="#test-scenario-18" class="index-link"><i class="bi bi-play-circle"></i> ${formatScenarioLabel("18", "User Manual Actions")}</a>
					<a href="#cleanup-section" class="index-link">
						<i class="bi bi-trash"></i> Cleanup Method
					</a>
				</div>
			`;
		}

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
					"blocks",
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
				console.error(`[Edge Tests Block] Error in scenario ${scenarioId}:`, error);
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
				const cleanupUrl = `${baseUrl}/block/cleanupTestBlocks`;

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
						<strong>Block:</strong> Restrict interactions or access between subjects (users/IP/email/app scope).
					</div>
					<div class="terminology-item">
						<strong>Scope:</strong> Context for a block (e.g., chat, feed, payments).
					</div>
					<div class="terminology-item">
						<strong>Temporary vs Permanent:</strong> Temporary uses seconds duration; permanent is boolean flag.
					</div>
					<div class="terminology-item">
						<strong>Manual Actions:</strong> Suspensions and warnings tracked per user.
					</div>
					<div class="terminology-item">
						<strong>Pagination:</strong> limit/nextToken used across list endpoints.
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
						"List User Blocks",
						"Lists user blocks with filters via GET /block/listUserBlocks.",
						"GET",
						"/block/listUserBlocks",
						null,
						[
							"Validate pagination limit/nextToken",
							"Filter by from/to/scope and ensure results match",
							"Confirm count matches returned items length",
						],
						[
							{ type: "text", id: "from", label: "From", placeholder: "user id", value: "" },
							{ type: "text", id: "to", label: "To", placeholder: "user id", value: "" },
							{ type: "text", id: "scope", label: "Scope", placeholder: "chat", value: "" },
							{ type: "text", id: "flag", label: "Flag", placeholder: "manual", value: "" },
							{
								type: "select",
								id: "permanent",
								label: "Permanent",
								options: [
									{ value: "", text: "Any" },
									{ value: "true", text: "True" },
									{ value: "false", text: "False" },
								],
							},
							{ type: "text", id: "limit", label: "Limit", placeholder: "20", value: "20", inputMode: "numeric" },
							{ type: "text", id: "nextToken", label: "Next Token", placeholder: "token", value: "" },
						]
					)}

					${createTestScenarioSection(
						"2",
						"Block User",
						"Blocks a user with scope and optional reason/flags via POST /block/blockUser.",
						"POST",
						"/block/blockUser",
						{
							from: "user_a",
							to: "user_b",
							scope: "chat",
							reason: "abuse",
							flag: "manual",
							permanent: false,
							temporary: 3600,
						},
						[
							"Confirm 400 when required fields are missing",
							"Validate temporary seconds parsed correctly and positive",
							"Check block entry created with scope and flags",
							"Verify permanent/temporary options honored",
						],
						[
							{ type: "text", id: "from", required: true, label: "From (blocker)", placeholder: "user id", value: "user_a" },
							{ type: "text", id: "to", required: true, label: "To (blocked)", placeholder: "user id", value: "user_b" },
							{ type: "text", id: "scope", required: true, label: "Scope", placeholder: "chat/feed/etc", value: "chat" },
							{ type: "text", id: "reason", label: "Reason", placeholder: "abuse", value: "" },
							{ type: "text", id: "flag", label: "Flag", placeholder: "manual", value: "manual" },
							{
								type: "select",
								id: "permanent",
								label: "Permanent",
								options: [
									{ value: "false", text: "No" },
									{ value: "true", text: "Yes" },
								],
							},
							{ type: "text", id: "temporary", label: "Temporary (seconds)", placeholder: "3600", value: "3600", inputMode: "numeric" },
						]
					)}

					${createTestScenarioSection(
						"2-B",
						"Block User (Temporary)",
						"Blocks a user temporarily for 60 seconds.",
						"POST",
						"/block/blockUser",
						{
							from: "user_a",
							to: "user_b",
							scope: "chat",
							permanent: false,
							temporary: 60,
						},
						[
							"Verify block is active immediately",
							"Verify block expires after 60 seconds (requires manual wait)",
							"Check expiration timestamp in response/DB"
						],
						[
							{ type: "text", id: "from", required: true, label: "From", value: "user_a" },
							{ type: "text", id: "to", required: true, label: "To", value: "user_b" },
							{ type: "text", id: "scope", required: true, value: "chat" },
							{ type: "text", id: "temporary", required: true, label: "Seconds", value: "60" }
						]
					)}

					${createTestScenarioSection(
						"2-C",
						"Block User (Feed Scope)",
						"Blocks a user specifically in the 'feed' scope.",
						"POST",
						"/block/blockUser",
						{
							from: "user_a",
							to: "user_b",
							scope: "feed",
							permanent: true
						},
						[
							"Verify scope is correctly recorded as 'feed'",
							"Ensure this does not affect 'chat' scope if scopes are independent"
						],
						[
							{ type: "text", id: "from", required: true, label: "From", value: "user_a" },
							{ type: "text", id: "to", required: true, label: "To", value: "user_b" },
							{ type: "text", id: "scope", required: true, value: "feed" }
						]
					)}

					${createTestScenarioSection(
						"2-D",
						"Block User (Self Block)",
						"Attempts to block self (from matches to) to test validation.",
						"POST",
						"/block/blockUser",
						{
							from: "user_a",
							to: "user_a",
							scope: "chat"
						},
						[
							"Ideally should return 400 Bad Request",
							"Verify system prevents self-blocking"
						],
						[
							{ type: "text", id: "from", required: true, label: "From", value: "user_a" },
							{ type: "text", id: "to", required: true, label: "To", value: "user_a" }
						]
					)}

					${createTestScenarioSection(
						"3",
						"Unblock User",
						"Unblocks a user via POST /block/unblockUser.",
						"POST",
						"/block/unblockUser",
						{
							from: "user_a",
							to: "user_b",
							scope: "chat",
						},
						[
							"Confirm unblock removes prior block entry",
							"Verify 400 on missing required fields",
							"Check idempotent behavior (unblocking non-blocked returns success/error as expected)",
						],
						[
							{ type: "text", id: "from", required: true, label: "From (blocker)", placeholder: "user id", value: "user_a" },
							{ type: "text", id: "to", required: true, label: "To (blocked)", placeholder: "user id", value: "user_b" },
							{ type: "text", id: "scope", required: true, label: "Scope", placeholder: "chat", value: "chat" },
						]
					)}

					${createTestScenarioSection(
						"3-B",
						"Unblock User (Non-Existent)",
						"Attempts to unblock a user pair that is not blocked.",
						"POST",
						"/block/unblockUser",
						{
							from: "user_x",
							to: "user_y",
							scope: "chat"
						},
						[
							"Ideally should be idempotent (success or 404, not 500)",
							"Confirm no ghost entries created"
						],
						[
							{ type: "text", id: "from", required: true, label: "From", value: "user_x" },
							{ type: "text", id: "to", required: true, label: "To", value: "user_y" },
							{ type: "text", id: "scope", required: true, value: "chat" }
						]
					)}

					${createTestScenarioSection(
						"4",
						"Is User Blocked",
						"Checks block status via GET /block/isUserBlocked.",
						"GET",
						"/block/isUserBlocked",
						null,
						[
							"Validate blocked true/false matches database",
							"Verify blockDetails shape when blocked",
							"Confirm 400 on missing required query params",
						],
						[
							{ type: "text", id: "from", required: true, label: "From", placeholder: "user id", value: "user_a" },
							{ type: "text", id: "to", required: true, label: "To", placeholder: "user id", value: "user_b" },
							{ type: "text", id: "scope", required: true, label: "Scope", placeholder: "chat", value: "chat" },
						]
					)}

					${createTestScenarioSection(
						"4-B",
						"Is User Blocked (False Check)",
						"Verifies that a non-blocked pair returns false.",
						"GET",
						"/block/isUserBlocked",
						null,
						[
							"Ensure blocked status is false",
							"Verify response does not imply a block exists"
						],
						[
							{ type: "text", id: "from", required: true, label: "From", value: "user_x" },
							{ type: "text", id: "to", required: true, label: "To", value: "user_y" },
							{ type: "text", id: "scope", required: true, value: "chat" }
						]
					)}

					${createTestScenarioSection(
						"5",
						"Batch Check User Blocks",
						"Batch check multiple pairs via POST /block/batchCheckUserBlocks.",
						"POST",
						"/block/batchCheckUserBlocks",
						{
							blocks: [
								{ from: "user_a", to: "user_b", scope: "chat" },
								{ from: "user_c", to: "user_d", scope: "feed" },
							],
						},
						[
							"Confirm array validation returns 400 when blocks is not an array",
							"Verify per-item results align with single check endpoint",
							"Test mixed blocked/unblocked cases",
						],
						[]
					)}

					${createTestScenarioSection(
						"6",
						"List System Blocks",
						"Lists system blocks with filters via GET /block/listSystemBlocks.",
						"GET",
						"/block/listSystemBlocks",
						null,
						[
							"Validate pagination and filters (ip, flag, permanent)",
							"Confirm count matches items length",
						],
						[
							{ type: "text", id: "ip", label: "IP", placeholder: "203.0.113.10", value: "" },
							{ type: "text", id: "flag", label: "Flag", placeholder: "manual", value: "" },
							{ type: "text", id: "reason", label: "Reason", placeholder: "fraud", value: "" },
							{
								type: "select",
								id: "permanent",
								label: "Permanent",
								options: [
									{ value: "", text: "Any" },
									{ value: "true", text: "True" },
									{ value: "false", text: "False" },
								],
							},
							{ type: "text", id: "limit", label: "Limit", placeholder: "20", value: "20", inputMode: "numeric" },
							{ type: "text", id: "nextToken", label: "Next Token", placeholder: "token", value: "" },
						]
					)}

					${createTestScenarioSection(
						"7",
						"Block IP",
						"Blocks an IP via POST /block/blockIP.",
						"POST",
						"/block/blockIP",
						{
							ip: "203.0.113.10",
							reason: "abuse",
							permanent: true,
						},
						[
							"Confirm 400 on missing ip",
							"Validate block stored with reason and permanence"
						],
						[
							{ type: "text", id: "ip", required: true, label: "IP", placeholder: "203.0.113.10", value: "203.0.113.10" },
							{ type: "text", id: "reason", label: "Reason", placeholder: "abuse", value: "abuse" },
							{
								type: "select",
								id: "permanent",
								label: "Permanent",
								options: [
									{ value: "true", text: "Yes" },
									{ value: "false", text: "No" },
								],
							},
						]
					)}

					${createTestScenarioSection(
						"7-B",
						"Block IP (Invalid Format)",
						"Attempts to block an invalid IP address to test validation.",
						"POST",
						"/block/blockIP",
						{
							ip: "999.999.999.999",
							reason: "test"
						},
						[
							"Ensure response is 400 Bad Request",
							"Verify invalid IP is not stored"
						],
						[
							{ type: "text", id: "ip", required: true, label: "Invalid IP", value: "999.999.999.999" }
						]
					)}

					${createTestScenarioSection(
						"8",
						"Is IP Blocked",
						"Checks IP block via GET /block/isIPBlocked.",
						"GET",
						"/block/isIPBlocked",
						null,
						[
							"Validate blocked boolean matches IP block entry",
							"Confirm details payload includes metadata",
						],
						[
							{ type: "text", id: "ip", required: true, label: "IP", placeholder: "203.0.113.10", value: "203.0.113.10" },
						]
					)}

					${createTestScenarioSection(
						"9",
						"Block Email",
						"Blocks an email via POST /block/blockEmail.",
						"POST",
						"/block/blockEmail",
						{
							email: "test@example.com",
							reason: "fraud",
							permanent: true,
						},
						[
							"Confirm 400 on missing email",
							"Validate block stored with reason",
							"Check permanence flag"
						],
						[
							{ type: "text", id: "email", required: true, label: "Email", placeholder: "user@example.com", value: "test@example.com" },
							{ type: "text", id: "reason", label: "Reason", placeholder: "fraud", value: "fraud" },
							{
								type: "select",
								id: "permanent",
								label: "Permanent",
								options: [
									{ value: "true", text: "Yes" },
									{ value: "false", text: "No" },
								],
							},
						]
					)}

					${createTestScenarioSection(
						"9-B",
						"Block Email (Invalid Format)",
						"Attempts to block an invalid email to test validation.",
						"POST",
						"/block/blockEmail",
						{
							email: "not-an-email",
							reason: "spam"
						},
						[
							"Ensure response is 400 Bad Request",
							"Verify invalid email is not stored"
						],
						[
							{ type: "text", id: "email", required: true, label: "Invalid Email", value: "not-an-email" }
						]
					)}

					${createTestScenarioSection(
						"10",
						"Is Email Blocked",
						"Checks email block via GET /block/isEmailBlocked.",
						"GET",
						"/block/isEmailBlocked",
						null,
						[
							"Verify blocked boolean matches email block entry",
							"Confirm details payload present when blocked",
						],
						[
							{ type: "text", id: "email", required: true, label: "Email", placeholder: "user@example.com", value: "test@example.com" },
						]
					)}

					${createTestScenarioSection(
						"11",
						"Block App Access",
						"Blocks app access for a user via POST /block/blockAppAccess.",
						"POST",
						"/block/blockAppAccess",
						{
							userId: "user_app_1",
							scope: "app",
							reason: "policy",
							permanent: true,
						},
						[
							"Confirm required userId/scope validation",
							"Validate reason/permanent persisted",
							"Check user cannot access scoped resources",
						],
						[
							{ type: "text", id: "userId", required: true, label: "User ID", placeholder: "user id", value: "user_app_1" },
							{ type: "text", id: "scope", required: true, label: "Scope", placeholder: "app", value: "app" },
							{ type: "text", id: "reason", label: "Reason", placeholder: "policy", value: "policy" },
							{
								type: "select",
								id: "permanent",
								label: "Permanent",
								options: [
									{ value: "true", text: "Yes" },
									{ value: "false", text: "No" },
								],
							},
						]
					)}

					${createTestScenarioSection(
						"11-B",
						"Block App Access (Temporary)",
						"Blocks app access temporarily (e.g. 5 minutes).",
						"POST",
						"/block/blockAppAccess",
						{
							userId: "user_app_1",
							scope: "app",
							permanent: false,
							temporary: 300
						},
						[
							"Verify temporary block is created",
							"Verify expiration time calculation"
						],
						[
							{ type: "text", id: "userId", required: true, label: "User ID", value: "user_app_1" },
							{ type: "text", id: "scope", required: true, label: "Scope", value: "app" },
							{ type: "text", id: "temporary", required: true, label: "Seconds", value: "300" }
						]
					)}

					${createTestScenarioSection(
						"12",
						"Is App Access Blocked",
						"Checks app access block via GET /block/isAppAccessBlocked.",
						"GET",
						"/block/isAppAccessBlocked",
						null,
						[
							"Validate blocked boolean matches block entry",
							"Confirm details payload includes scope and reason",
						],
						[
							{ type: "text", id: "userId", required: true, label: "User ID", placeholder: "user id", value: "user_app_1" },
							{ type: "text", id: "scope", required: true, label: "Scope", placeholder: "app", value: "app" },
						]
					)}

					${createTestScenarioSection(
						"13",
						"List Manual Actions",
						"Lists manual actions with filters via GET /block/listManualActions.",
						"GET",
						"/block/listManualActions",
						null,
						[
							"Validate filters (userId/adminId/flagKey) affect results",
							"Confirm pagination behavior",
						],
						[
							{ type: "text", id: "userId", label: "User ID", placeholder: "user id", value: "" },
							{ type: "text", id: "adminId", label: "Admin ID", placeholder: "admin id", value: "" },
							{ type: "text", id: "flagKey", label: "Flag Key", placeholder: "warning_low", value: "" },
							{ type: "text", id: "limit", label: "Limit", placeholder: "20", value: "20", inputMode: "numeric" },
							{ type: "text", id: "nextToken", label: "Next Token", placeholder: "token", value: "" },
						]
					)}

					${createTestScenarioSection(
						"14",
						"Suspend User",
						"Suspends a user via POST /block/suspendUser.",
						"POST",
						"/block/suspendUser",
						{
							userId: "user_sus_1",
							reason: "tos_violation",
							adminId: "admin_1",
							flag: "manual",
							note: "investigate",
						},
						[
							"Confirm required userId/reason/adminId validation",
							"Validate suspension recorded with flag and note",
							"Check subsequent isUserSuspended reflects true",
						],
						[
							{ type: "text", id: "userId", required: true, label: "User ID", placeholder: "user id", value: "user_sus_1" },
							{ type: "text", id: "reason", required: true, label: "Reason", placeholder: "tos_violation", value: "tos_violation" },
							{ type: "text", id: "adminId", required: true, label: "Admin ID", placeholder: "admin id", value: "admin_1" },
							{ type: "text", id: "flag", label: "Flag", placeholder: "manual", value: "manual" },
							{ type: "text", id: "note", label: "Note", placeholder: "Notes for suspension", value: "investigate" },
						]
					)}

					${createTestScenarioSection(
						"14-B",
						"Suspend User (Duplicate/Update)",
						"Attempts to suspend an already suspended user to test idempotency/update behavior.",
						"POST",
						"/block/suspendUser",
						{
							userId: "user_sus_1",
							reason: "updated_reason",
							adminId: "admin_1"
						},
						[
							"Ideally should update the existing suspension or return success",
							"Verify reason is updated in manual actions list"
						],
						[
							{ type: "text", id: "userId", required: true, label: "User ID", value: "user_sus_1" },
							{ type: "text", id: "reason", required: true, label: "Reason", value: "updated_reason" },
							{ type: "text", id: "adminId", required: true, label: "Admin ID", value: "admin_1" }
						]
					)}

					${createTestScenarioSection(
						"15",
						"Unsuspend User",
						"Unsuspends a user via POST /block/unsuspendUser.",
						"POST",
						"/block/unsuspendUser",
						{
							userId: "user_sus_1",
						},
						[
							"Confirm user returns to active state",
							"Validate idempotent behavior when not suspended",
						],
						[
							{ type: "text", id: "userId", required: true, label: "User ID", placeholder: "user id", value: "user_sus_1" },
						]
					)}

					${createTestScenarioSection(
						"16",
						"Is User Suspended",
						"Checks suspension status via GET /block/isUserSuspended.",
						"GET",
						"/block/isUserSuspended",
						null,
						[
							"Validate suspended boolean matches suspension table",
							"Confirm details payload present when suspended",
						],
						[
							{ type: "text", id: "userId", required: true, label: "User ID", placeholder: "user id", value: "user_sus_1" },
						]
					)}

					${createTestScenarioSection(
						"17",
						"Warn User",
						"Warns a user via POST /block/warnUser.",
						"POST",
						"/block/warnUser",
						{
							userId: "user_warn_1",
							flagKey: "warning_low",
							adminId: "admin_1",
							note: "first warning",
						},
						[
							"Confirm required userId/flagKey/adminId validation",
							"Validate warning stored and visible in manual actions",
						],
						[
							{ type: "text", id: "userId", required: true, label: "User ID", placeholder: "user id", value: "user_warn_1" },
							{ type: "text", id: "flagKey", required: true, label: "Flag Key", placeholder: "warning_low", value: "warning_low" },
							{ type: "text", id: "adminId", required: true, label: "Admin ID", placeholder: "admin id", value: "admin_1" },
							{ type: "text", id: "note", label: "Note", placeholder: "first warning", value: "first warning" },
						]
					)}

					${createTestScenarioSection(
						"18",
						"User Manual Actions",
						"Fetches manual actions via GET /block/getUserManualActions.",
						"GET",
						"/block/getUserManualActions",
						null,
						[
							"Confirm actions include warnings/suspensions for user",
							"Validate 400 when userId missing",
						],
						[
							{ type: "text", id: "userId", required: true, label: "User ID", placeholder: "user id", value: "user_warn_1" },
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
							console.error("[Edge Tests Block] Could not parse payload:", parseError);
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

		window.EdgeTestsBlock = {
			testScenario: testScenario,
			cleanupTestData: cleanupTestData,
			getBaseUrl: getBaseUrl,
		};

		render();
	});
})();
