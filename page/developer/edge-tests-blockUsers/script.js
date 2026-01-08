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
					
					<!-- User-User Actions -->
					<a href="#test-scenario-1" class="index-link"><i class="bi bi-play-circle"></i> ${formatScenarioLabel("1-A", "User to User - List User Blocks(all, global)")}</a>
					<a href="#test-scenario-1-B" class="index-link" ${subScenarioStyle}>${iconStyle} ${formatScenarioLabel("1-B", "User to User - List Blocks (Feed)")}</a>
					<a href="#test-scenario-1-C" class="index-link" ${subScenarioStyle}>${iconStyle} ${formatScenarioLabel("1-C", "User to User - List Blocks (Private Chat)")}</a>

					<a href="#test-scenario-2" class="index-link"><i class="bi bi-play-circle"></i> ${formatScenarioLabel("2-A", "User to User - Block User (Feed Permanent)")}</a>
					<a href="#test-scenario-2-B" class="index-link" ${subScenarioStyle}>${iconStyle} ${formatScenarioLabel("2-B", "User to User - Block User (Private Chat Permanent)")}</a>
					<a href="#test-scenario-2-C" class="index-link" ${subScenarioStyle}>${iconStyle} ${formatScenarioLabel("2-C", "User to User - Block User (Feed Temporary)")}</a>
					<a href="#test-scenario-2-D" class="index-link" ${subScenarioStyle}>${iconStyle} ${formatScenarioLabel("2-D", "User to User - Block User (Private Chat Temporary)")}</a>

					<a href="#test-scenario-3" class="index-link"><i class="bi bi-play-circle"></i> ${formatScenarioLabel("3-A", "User to User - Unblock (Feed)")}</a>
					<a href="#test-scenario-3-B" class="index-link" ${subScenarioStyle}>${iconStyle} ${formatScenarioLabel("3-B", "User to User - Unblock (Feed, Non-Existent)")}</a>
					<a href="#test-scenario-3-C" class="index-link" ${subScenarioStyle}>${iconStyle} ${formatScenarioLabel("3-C", "User to User - Unblock (Private Chat)")}</a>
					<a href="#test-scenario-3-D" class="index-link" ${subScenarioStyle}>${iconStyle} ${formatScenarioLabel("3-D", "User to User - Unblock (Private Chat, Non-Existent)")}</a>

					<a href="#test-scenario-4-C" class="index-link" ${subScenarioStyle}>${iconStyle} ${formatScenarioLabel("4-A", "User to User - Is Blocked (Feed)")}</a>
					<a href="#test-scenario-4-D" class="index-link" ${subScenarioStyle}>${iconStyle} ${formatScenarioLabel("4-B", "User to User - Is Blocked (Private Chat)")}</a>

					<a href="#test-scenario-5" class="index-link"><i class="bi bi-play-circle"></i> ${formatScenarioLabel("5", "User to User - Batch Check (all, global Scopes)")}</a>

					<!-- System Blocks -->
					<a href="#test-scenario-6" class="index-link"><i class="bi bi-play-circle"></i> ${formatScenarioLabel("6-A", "System - List System Blocks(all/ global scopes)")}</a>
					<a href="#test-scenario-6-B" class="index-link" ${subScenarioStyle}>${iconStyle} ${formatScenarioLabel("6-B", "System - List System (Auth)")}</a>
					<a href="#test-scenario-6-C" class="index-link" ${subScenarioStyle}>${iconStyle} ${formatScenarioLabel("6-C", "System - List System (Feed)")}</a>
					<a href="#test-scenario-6-D" class="index-link" ${subScenarioStyle}>${iconStyle} ${formatScenarioLabel("6-D", "System - List System (Private Chat)")}</a>

					<a href="#test-scenario-7" class="index-link"><i class="bi bi-play-circle"></i> ${formatScenarioLabel("7-A", "System - Block IP (Auth Permanent)")}</a>
					<a href="#test-scenario-7-B" class="index-link" ${subScenarioStyle}>${iconStyle} ${formatScenarioLabel("7-B", "System - Block IP (Feed Permanent)")}</a>
					<a href="#test-scenario-7-C" class="index-link" ${subScenarioStyle}>${iconStyle} ${formatScenarioLabel("7-C", "System - Block IP (Private Chat Permanent)")}</a>

					<a href="#test-scenario-7-D" class="index-link" ${subScenarioStyle}>${iconStyle} ${formatScenarioLabel("7-D", "System - Block IP (Auth Temporary)")}</a>
					<a href="#test-scenario-7-E" class="index-link" ${subScenarioStyle}>${iconStyle} ${formatScenarioLabel("7-E", "System - Block IP (Feed Temporary)")}</a>
					<a href="#test-scenario-7-F" class="index-link" ${subScenarioStyle}>${iconStyle} ${formatScenarioLabel("7-F", "System - Block IP (Private Chat Temporary)")}</a>

					<a href="#test-scenario-8" class="index-link"><i class="bi bi-play-circle"></i> ${formatScenarioLabel("8-A", "System - Is IP Blocked (Auth)")}</a>
					<a href="#test-scenario-8-B" class="index-link" ${subScenarioStyle}>${iconStyle} ${formatScenarioLabel("8-B", "System - Is IP Blocked (Feed)")}</a>
					<a href="#test-scenario-8-C" class="index-link" ${subScenarioStyle}>${iconStyle} ${formatScenarioLabel("8-C", "System - Is IP Blocked (Private Chat)")}</a>

					<a href="#test-scenario-9" class="index-link"><i class="bi bi-play-circle"></i> ${formatScenarioLabel("9-A", "System - Block Email (Auth Permanent)")}</a>
					<a href="#test-scenario-9-B" class="index-link" ${subScenarioStyle}>${iconStyle} ${formatScenarioLabel("9-B", "System - Block Email (Feed Permanent)")}</a>
					<a href="#test-scenario-9-C" class="index-link" ${subScenarioStyle}>${iconStyle} ${formatScenarioLabel("9-C", "System - Block Email (Private Chat Permanent)")}</a>

					<a href="#test-scenario-9-D" class="index-link" ${subScenarioStyle}>${iconStyle} ${formatScenarioLabel("9-D", "System - Block Email (Auth Temporary)")}</a>
					<a href="#test-scenario-9-E" class="index-link" ${subScenarioStyle}>${iconStyle} ${formatScenarioLabel("9-E", "System - Block Email (Feed Temporary)")}</a>
					<a href="#test-scenario-9-F" class="index-link" ${subScenarioStyle}>${iconStyle} ${formatScenarioLabel("9-F", "System - Block Email (Private Chat Temporary)")}</a>

					<a href="#test-scenario-10" class="index-link"><i class="bi bi-play-circle"></i> ${formatScenarioLabel("10-A", "System - Is Email Blocked (Auth)")}</a>
					<a href="#test-scenario-10-B" class="index-link" ${subScenarioStyle}>${iconStyle} ${formatScenarioLabel("10-B", "System - Is Email Blocked (Feed)")}</a>
					<a href="#test-scenario-10-C" class="index-link" ${subScenarioStyle}>${iconStyle} ${formatScenarioLabel("10-C", "System - Is Email Blocked (Private Chat)")}</a>

					<!-- Manual Actions -->
					<a href="#test-scenario-11" class="index-link"><i class="bi bi-play-circle"></i> ${formatScenarioLabel("11", "Manual Action - List Manual Actions(all, paginated)")}</a>
					<a href="#test-scenario-12" class="index-link"><i class="bi bi-play-circle"></i> ${formatScenarioLabel("12-A", "Manual Action - Suspend User")}</a>
					<a href="#test-scenario-12-B" class="index-link" ${subScenarioStyle}>${iconStyle} ${formatScenarioLabel("12-B", "Manual Action - Suspend (Duplicate)")}</a>
					<a href="#test-scenario-13" class="index-link"><i class="bi bi-play-circle"></i> ${formatScenarioLabel("13", "Manual Action - Unsuspend User")}</a>
					<a href="#test-scenario-14" class="index-link"><i class="bi bi-play-circle"></i> ${formatScenarioLabel("14", "Manual Action - Is User Suspended")}</a>
					<a href="#test-scenario-15" class="index-link"><i class="bi bi-play-circle"></i> ${formatScenarioLabel("15", "Manual Action - Warn User")}</a>

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

				// If an expiresAt datetime is provided (ms since epoch) but temporary is not,
				// derive temporary (seconds) as the difference from now.
				try {
					if (
						Object.prototype.hasOwnProperty.call(inputValues, "expiresAt") &&
						!Object.prototype.hasOwnProperty.call(inputValues, "temporary")
					) {
						const expMs = parseInt(String(inputValues.expiresAt), 10);
						if (!Number.isNaN(expMs)) {
							const nowMs = Date.now();
							const diffSec = Math.max(0, Math.ceil((expMs - nowMs) / 1000));
							inputValues.temporary = String(diffSec);
						}
					}
				} catch (e) {
					console.warn("[Edge Tests Block] Could not derive temporary from expiresAt:", e);
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
				const cleanupUrl = `${baseUrl}/block-users/cleanupTestBlocks`;

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
						<strong>Scope:</strong> Context for a block (e.g., feed, private_chat).
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
						"1-A",
						"User to User - List User Blocks(all, global)",
						"Lists user blocks with filters via GET /block-users/listUserBlocks.",
						"GET",
						"/block-users/listUserBlocks",
						null,
						[
							"Validate pagination limit/nextToken",
							"Filter by from/to/scope and ensure results match",
							"Confirm count matches returned items length",
						],
						[
							{ type: "text", id: "from", label: "From", placeholder: "user id", value: "" },
							{ type: "text", id: "to", label: "To", placeholder: "user id", value: "" },
							{
								type: "select",
								id: "scope",
								label: "Scope",
								options: [
									{ value: "", text: "Any" },
									{ value: "feed", text: "Feed" },
									{ value: "private_chat", text: "Private Chat (DM)" },
								],
								value: "",
							},
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
						"1-B",
						"User to User - List Blocks (Feed)",
						"Lists user blocks filtered by 'feed' scope.",
						"GET",
						"/block-users/listUserBlocks",
						null,
						[
							"Verify all returned items have scope 'feed'",
						],
						[
							{ type: "text", id: "scope", label: "Scope", value: "feed", required: true },
							{ type: "text", id: "limit", label: "Limit", placeholder: "20", value: "20", inputMode: "numeric" },
						]
					)}

					${createTestScenarioSection(
						"1-C",
						"User to User - List Blocks (Private Chat)",
						"Lists user blocks filtered by 'private_chat' scope.",
						"GET",
						"/block-users/listUserBlocks",
						null,
						[
							"Verify all returned items have scope 'private_chat'",
						],
						[
							{ type: "text", id: "scope", label: "Scope", value: "private_chat", required: true },
							{ type: "text", id: "limit", label: "Limit", placeholder: "20", value: "20", inputMode: "numeric" },
						]
					)}

					<!-- Block Actions -->

					${createTestScenarioSection(
						"2-A",
						"User to User - Block User (Feed Permanent)",
						"Blocks a user specifically in the 'feed' scope.",
						"POST",
						"/block-users/blockUser",
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
							{ type: "text", id: "scope", required: true, label: "Scope", value: "feed" }
						]
					)}

					${createTestScenarioSection(
						"2-B",
						"User to User - Block User (Private Chat Permanent)",
						"Blocks a user specifically in the 'private_chat' (dm) scope.",
						"POST",
						"/block-users/blockUser",
						{
							from: "user_a",
							to: "user_b",
							scope: "private_chat",
							permanent: true
						},
						[
							"Verify scope is correctly recorded as 'private_chat'",
							"Ensure this does not affect 'feed' scope"
						],
						[
							{ type: "text", id: "from", required: true, label: "From", value: "user_a" },
							{ type: "text", id: "to", required: true, label: "To", value: "user_b" },
							{ type: "text", id: "scope", required: true, label: "Scope", value: "private_chat" }
						]
					)}

					${createTestScenarioSection(
						"2-C",
						"User to User - Block User (Feed Temporary)",
						"Temporarily blocks a user in the 'feed' scope.",
						"POST",
						"/block-users/blockUser",
						{
							from: "user_a",
							to: "user_b",
							scope: "feed",
							permanent: false,
							temporary: 86400
						},
						[
							"Verify block expires after ~24 hours",
							"Ensure permanent is false",
						],
						[
							{ type: "text", id: "from", required: true, label: "From", value: "user_a" },
							{ type: "text", id: "to", required: true, label: "To", value: "user_b" },
							{
								type: "select",
								id: "scope",
								label: "Scope",
								options: [
									{ value: "feed", text: "Feed" },
									{ value: "private_chat", text: "Private Chat (DM)" },
								],
								value: "feed",
								required: true
							},
							{
								type: "select",
								id: "permanent",
								label: "Permanent",
								options: [
									{ value: "false", text: "False" },
									{ value: "true", text: "True" }
								],
								value: "false",
								required: true
							},
							{ type: "text", id: "temporary", label: "Temporary (seconds)", placeholder: "86400", value: "86400", inputMode: "numeric" },
							{ type: "text", id: "expiresAt", label: "Expires At (optional)", placeholder: "Pick date/time below", typeOverride: "datetime-local" }
						]
					)}

					${createTestScenarioSection(
						"2-D",
						"User to User - Block User (Private Chat Temporary)",
						"Temporarily blocks a user in the 'private_chat' scope.",
						"POST",
						"/block-users/blockUser",
						{
							from: "user_a",
							to: "user_b",
							scope: "private_chat",
							permanent: false,
							temporary: 86400
						},
						[
							"Verify block expires after ~24 hours",
							"Ensure permanent is false",
						],
						[
							{ type: "text", id: "from", required: true, label: "From", value: "user_a" },
							{ type: "text", id: "to", required: true, label: "To", value: "user_b" },
							{
								type: "select",
								id: "scope",
								label: "Scope",
								options: [
									{ value: "feed", text: "Feed" },
									{ value: "private_chat", text: "Private Chat (DM)" },
								],
								value: "private_chat",
								required: true
							},
							{
								type: "select",
								id: "permanent",
								label: "Permanent",
								options: [
									{ value: "false", text: "False" },
									{ value: "true", text: "True" }
								],
								value: "false",
								required: true
							},
							{ type: "text", id: "temporary", label: "Temporary (seconds)", placeholder: "86400", value: "86400", inputMode: "numeric" },
							{ type: "text", id: "expiresAt", label: "Expires At (optional)", placeholder: "Pick date/time below", typeOverride: "datetime-local" }
						]
					)}

					<!-- Unblock Actions -->

					${createTestScenarioSection(
						"3-A",
						"User to User - Unblock (Feed)",
						"Unblocks a user specifically in the 'feed' scope.",
						"POST",
						"/block-users/unblockUser",
						{
							from: "user_a",
							to: "user_b",
							scope: "feed"
						},
						[
							"Verify 'feed' block is removed",
							"Verify other scopes remain if they existed"
						],
						[
							{ type: "text", id: "from", required: true, label: "From", value: "user_a" },
							{ type: "text", id: "to", required: true, label: "To", value: "user_b" },
							{ type: "text", id: "scope", required: true, label: "Scope", value: "feed" }
						]
					)}

					${createTestScenarioSection(
						"3-B",
						"User to User - Unblock (Feed, Non-Existent)",
						"Attempts to unblock a user pair that is not blocked (Feed scope).",
						"POST",
						"/block-users/unblockUser",
						{
							from: "user_x",
							to: "user_y",
							scope: "feed"
						},
						[
							"Ideally should be idempotent (success or 404, not 500)",
							"Confirm no ghost entries created"
						],
						[
							{ type: "text", id: "from", required: true, label: "From", value: "user_x" },
							{ type: "text", id: "to", required: true, label: "To", value: "user_y" },
							{ type: "text", id: "scope", required: true, label: "Scope", value: "feed" }
						]
					)}

					${createTestScenarioSection(
						"3-C",
						"User to User - Unblock (Private Chat)",
						"Unblocks a user specifically in the 'private_chat' scope.",
						"POST",
						"/block-users/unblockUser",
						{
							from: "user_a",
							to: "user_b",
							scope: "private_chat"
						},
						[
							"Verify 'private_chat' block is removed",
							"Verify other scopes remain if they existed"
						],
						[
							{ type: "text", id: "from", required: true, label: "From", value: "user_a" },
							{ type: "text", id: "to", required: true, label: "To", value: "user_b" },
							{ type: "text", id: "scope", required: true, label: "Scope", value: "private_chat" }
						]
					)}

					${createTestScenarioSection(
						"3-D",
						"User to User - Unblock (Private Chat, Non-Existent)",
						"Attempts to unblock a user pair that is not blocked (Private Chat scope).",
						"POST",
						"/block-users/unblockUser",
						{
							from: "user_x",
							to: "user_y",
							scope: "private_chat"
						},
						[
							"Ideally should be idempotent"
						],
						[
							{ type: "text", id: "from", required: true, label: "From", value: "user_x" },
							{ type: "text", id: "to", required: true, label: "To", value: "user_y" },
							{ type: "text", id: "scope", required: true, label: "Scope", value: "private_chat" }
						]
					)}

					<!-- Check Actions -->

					${createTestScenarioSection(
						"4-A",
						"User to User - Is Blocked (Feed)",
						"Checks block status specifically for 'feed' scope.",
						"GET",
						"/block-users/isUserBlocked",
						null,
						[
							"Confirm result reflects feed block status",
						],
						[
							{ type: "text", id: "from", required: true, label: "From", value: "user_a" },
							{ type: "text", id: "to", required: true, label: "To", value: "user_b" },
							{
								type: "select",
								id: "scope",
								label: "Scope",
								options: [
									{ value: "", text: "Any" },
									{ value: "feed", text: "Feed" },
									{ value: "private_chat", text: "Private Chat (DM)" },
								],
								value: "feed",
								required: true
							}
						]
					)}

					${createTestScenarioSection(
						"4-B",
						"User to User - Is Blocked (Private Chat)",
						"Checks block status specifically for 'private_chat' scope.",
						"GET",
						"/block-users/isUserBlocked",
						null,
						[
							"Confirm result reflects private_chat block status",
						],
						[
							{ type: "text", id: "from", required: true, label: "From", value: "user_a" },
							{ type: "text", id: "to", required: true, label: "To", value: "user_b" },
							{
								type: "select",
								id: "scope",
								label: "Scope",
								options: [
									{ value: "", text: "Any" },
									{ value: "feed", text: "Feed" },
									{ value: "private_chat", text: "Private Chat (DM)" },
								],
								value: "private_chat",
								required: true
							}
						]
					)}

					${createTestScenarioSection(
						"5",
						"User to User - Batch Check (all, global Scopes)",
						"Batch check multiple pairs via POST /block-users/batchCheckUserBlocks.",
						"POST",
						"/block-users/batchCheckUserBlocks",
						{
							blocks: [
								{ from: "user_a", to: "user_b", scope: "feed" },
								{ from: "user_c", to: "user_d", scope: "private_chat" },
							],
						},
						[
							"Confirm array validation returns 400 when blocks is not an array",
							"Verify per-item results align with single check endpoint",
							"Test mixed blocked/unblocked cases",
						],
						[]
					)}

					<!-- System Blocks -->

					${createTestScenarioSection(
						"6-A",
						"System - List System Blocks(all/ global scopes)",
						"Lists system blocks with filters via GET /block-users/listSystemBlocks.",
						"GET",
						"/block-users/listSystemBlocks",
						null,
						[
							"Validate pagination and filters (ip, flag, permanent, scope)",
							"Confirm count matches items length",
						],
						[
							{ type: "text", id: "ip", label: "IP", placeholder: "203.0.113.10", value: "" },
							{ type: "text", id: "flag", label: "Flag", placeholder: "manual", value: "" },
							{
								type: "select",
								id: "scope",
								label: "Scope",
								options: [
									{ value: "", text: "Any" },
									{ value: "auth", text: "Auth" },
									{ value: "feed", text: "Feed" },
									{ value: "private_chat", text: "Private Chat" },
								],
								value: "",
							},
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
						"6-B",
						"System - List System (Auth)",
						"Lists system blocks filtered by 'auth' scope.",
						"GET",
						"/block-users/listSystemBlocks",
						null,
						[
							"Verify all returned items have scope 'auth'",
						],
						[
							{ type: "text", id: "scope", label: "Scope", value: "auth", required: true },
							{ type: "text", id: "limit", label: "Limit", placeholder: "20", value: "20", inputMode: "numeric" },
						]
					)}

					${createTestScenarioSection(
						"6-C",
						"System - List System (Feed)",
						"Lists system blocks filtered by 'feed' scope.",
						"GET",
						"/block-users/listSystemBlocks",
						null,
						[
							"Verify all returned items have scope 'feed'",
						],
						[
							{ type: "text", id: "scope", label: "Scope", value: "feed", required: true },
							{ type: "text", id: "limit", label: "Limit", placeholder: "20", value: "20", inputMode: "numeric" },
						]
					)}

					${createTestScenarioSection(
						"6-D",
						"System - List System (Private Chat)",
						"Lists system blocks filtered by 'private_chat' scope.",
						"GET",
						"/block-users/listSystemBlocks",
						null,
						[
							"Verify all returned items have scope 'private_chat'",
						],
						[
							{ type: "text", id: "scope", label: "Scope", value: "private_chat", required: true },
							{ type: "text", id: "limit", label: "Limit", placeholder: "20", value: "20", inputMode: "numeric" },
						]
					)}

					${createTestScenarioSection(
						"7-A",
						"System - Block IP (Auth Permanent)",
						"Blocks an IP in the 'auth' scope.",
						"POST",
						"/block-users/blockIP",
						{
							ip: "203.0.113.10",
							scope: "auth",
							permanent: true
						},
						[
							"Verify scope is correctly recorded as 'auth'",
						],
						[
							{ type: "text", id: "ip", required: true, label: "IP", value: "203.0.113.10" },
							{ type: "text", id: "scope", required: true, label: "Scope", value: "auth" }
						]
					)}

					${createTestScenarioSection(
						"7-B",
						"System - Block IP (Feed Permanent)",
						"Blocks an IP in the 'feed' scope.",
						"POST",
						"/block-users/blockIP",
						{
							ip: "203.0.113.10",
							scope: "feed",
							permanent: true
						},
						[
							"Verify scope is correctly recorded as 'feed'",
						],
						[
							{ type: "text", id: "ip", required: true, label: "IP", value: "203.0.113.10" },
							{ type: "text", id: "scope", required: true, label: "Scope", value: "feed" }
						]
					)}

					${createTestScenarioSection(
						"7-C",
						"System - Block IP (Private Chat Permanent)",
						"Blocks an IP in the 'private_chat' scope.",
						"POST",
						"/block-users/blockIP",
						{
							ip: "203.0.113.10",
							scope: "private_chat",
							permanent: true
						},
						[
							"Verify scope is correctly recorded as 'private_chat'",
						],
						[
							{ type: "text", id: "ip", required: true, label: "IP", value: "203.0.113.10" },
							{ type: "text", id: "scope", required: true, label: "Scope", value: "private_chat" }
						]
					)}

					${createTestScenarioSection(
						"7-D",
						"System - Block IP (Auth Temporary)",
						"Temporarily blocks an IP in the 'auth' scope.",
						"POST",
						"/block-users/blockIP",
						{
							ip: "203.0.113.10",
							scope: "auth",
							permanent: false,
							temporary: 86400
						},
						[
							"Verify IP block expires after ~24 hours",
						],
						[
							{ type: "text", id: "ip", required: true, label: "IP", value: "203.0.113.10" },
							{
								type: "select",
								id: "scope",
								label: "Scope",
								options: [
									{ value: "auth", text: "Auth" },
									{ value: "feed", text: "Feed" },
									{ value: "private_chat", text: "Private Chat" },
								],
								value: "auth",
								required: true
							},
							{
								type: "select",
								id: "permanent",
								label: "Permanent",
								options: [
									{ value: "false", text: "False" },
									{ value: "true", text: "True" }
								],
								value: "false",
								required: true
							},
							{ type: "text", id: "temporary", label: "Temporary (seconds)", placeholder: "86400", value: "86400", inputMode: "numeric" },
							{ type: "text", id: "expiresAt", label: "Expires At (optional)", placeholder: "Pick date/time below", typeOverride: "datetime-local" }
						]
					)}

					${createTestScenarioSection(
						"7-E",
						"System - Block IP (Feed Temporary)",
						"Temporarily blocks an IP in the 'feed' scope.",
						"POST",
						"/block-users/blockIP",
						{
							ip: "203.0.113.10",
							scope: "feed",
							permanent: false,
							temporary: 86400
						},
						[
							"Verify IP block expires after ~24 hours",
						],
						[
							{ type: "text", id: "ip", required: true, label: "IP", value: "203.0.113.10" },
							{
								type: "select",
								id: "scope",
								label: "Scope",
								options: [
									{ value: "auth", text: "Auth" },
									{ value: "feed", text: "Feed" },
									{ value: "private_chat", text: "Private Chat" },
								],
								value: "feed",
								required: true
							},
							{
								type: "select",
								id: "permanent",
								label: "Permanent",
								options: [
									{ value: "false", text: "False" },
									{ value: "true", text: "True" }
								],
								value: "false",
								required: true
							},
							{ type: "text", id: "temporary", label: "Temporary (seconds)", placeholder: "86400", value: "86400", inputMode: "numeric" },
							{ type: "text", id: "expiresAt", label: "Expires At (optional)", placeholder: "Pick date/time below", typeOverride: "datetime-local" }
						]
					)}

					${createTestScenarioSection(
						"7-F",
						"System - Block IP (Private Chat Temporary)",
						"Temporarily blocks an IP in the 'private_chat' scope.",
						"POST",
						"/block-users/blockIP",
						{
							ip: "203.0.113.10",
							scope: "private_chat",
							permanent: false,
							temporary: 86400
						},
						[
							"Verify IP block expires after ~24 hours",
						],
						[
							{ type: "text", id: "ip", required: true, label: "IP", value: "203.0.113.10" },
							{
								type: "select",
								id: "scope",
								label: "Scope",
								options: [
									{ value: "auth", text: "Auth" },
									{ value: "feed", text: "Feed" },
									{ value: "private_chat", text: "Private Chat" },
								],
								value: "private_chat",
								required: true
							},
							{
								type: "select",
								id: "permanent",
								label: "Permanent",
								options: [
									{ value: "false", text: "False" },
									{ value: "true", text: "True" }
								],
								value: "false",
								required: true
							},
							{ type: "text", id: "temporary", label: "Temporary (seconds)", placeholder: "86400", value: "86400", inputMode: "numeric" },
							{ type: "text", id: "expiresAt", label: "Expires At (optional)", placeholder: "Pick date/time below", typeOverride: "datetime-local" }
						]
					)}

					${createTestScenarioSection(
						"8-A",
						"System - Is IP Blocked (Auth)",
						"Checks if IP is blocked in 'auth' scope.",
						"GET",
						"/block-users/isIPBlocked",
						null,
						[
							"Confirm result reflects auth block status",
						],
						[
							{ type: "text", id: "ip", required: true, label: "IP", value: "203.0.113.10" },
							{ type: "text", id: "scope", required: true, label: "Scope", value: "auth" }
						]
					)}

					${createTestScenarioSection(
						"8-B",
						"System - Is IP Blocked (Feed)",
						"Checks if IP is blocked in 'feed' scope.",
						"GET",
						"/block-users/isIPBlocked",
						null,
						[
							"Confirm result reflects feed block status",
						],
						[
							{ type: "text", id: "ip", required: true, label: "IP", value: "203.0.113.10" },
							{ type: "text", id: "scope", required: true, label: "Scope", value: "feed" }
						]
					)}

					${createTestScenarioSection(
						"8-C",
						"System - Is IP Blocked (Private Chat)",
						"Checks if IP is blocked in 'private_chat' scope.",
						"GET",
						"/block-users/isIPBlocked",
						null,
						[
							"Confirm result reflects private_chat block status",
						],
						[
							{ type: "text", id: "ip", required: true, label: "IP", value: "203.0.113.10" },
							{ type: "text", id: "scope", required: true, label: "Scope", value: "private_chat" }
						]
					)}

					${createTestScenarioSection(
						"9-A",
						"System - Block Email (Auth Permanent)",
						"Blocks an email in the 'auth' scope.",
						"POST",
						"/block-users/blockEmail",
						{
							email: "test@example.com",
							scope: "auth",
							permanent: true
						},
						[
							"Verify scope is correctly recorded as 'auth'",
						],
						[
							{ type: "text", id: "email", required: true, label: "Email", value: "test@example.com" },
							{ type: "text", id: "scope", required: true, label: "Scope", value: "auth" }
						]
					)}

					${createTestScenarioSection(
						"9-B",
						"System - Block Email (Feed Permanent)",
						"Blocks an email in the 'feed' scope.",
						"POST",
						"/block-users/blockEmail",
						{
							email: "test@example.com",
							scope: "feed",
							permanent: true
						},
						[
							"Verify scope is correctly recorded as 'feed'",
						],
						[
							{ type: "text", id: "email", required: true, label: "Email", value: "test@example.com" },
							{ type: "text", id: "scope", required: true, label: "Scope", value: "feed" }
						]
					)}

					${createTestScenarioSection(
						"9-C",
						"System - Block Email (Private Chat Permanent)",
						"Blocks an email in the 'private_chat' scope.",
						"POST",
						"/block-users/blockEmail",
						{
							email: "test@example.com",
							scope: "private_chat",
							permanent: true
						},
						[
							"Verify scope is correctly recorded as 'private_chat'",
						],
						[
							{ type: "text", id: "email", required: true, label: "Email", value: "test@example.com" },
							{ type: "text", id: "scope", required: true, label: "Scope", value: "private_chat" }
						]
					)}

					${createTestScenarioSection(
						"9-D",
						"System - Block Email (Auth Temporary)",
						"Temporarily blocks an email in the 'auth' scope.",
						"POST",
						"/block-users/blockEmail",
						{
							email: "test@example.com",
							scope: "auth",
							permanent: false,
							temporary: 86400
						},
						[
							"Verify email block expires after ~24 hours",
						],
						[
							{ type: "text", id: "email", required: true, label: "Email", value: "test@example.com" },
							{
								type: "select",
								id: "scope",
								label: "Scope",
								options: [
									{ value: "auth", text: "Auth" },
									{ value: "feed", text: "Feed" },
									{ value: "private_chat", text: "Private Chat" },
								],
								value: "auth",
								required: true
							},
							{
								type: "select",
								id: "permanent",
								label: "Permanent",
								options: [
									{ value: "false", text: "False" },
									{ value: "true", text: "True" }
								],
								value: "false",
								required: true
							},
							{ type: "text", id: "temporary", label: "Temporary (seconds)", placeholder: "86400", value: "86400", inputMode: "numeric" },
							{ type: "text", id: "expiresAt", label: "Expires At (optional)", placeholder: "Pick date/time below", typeOverride: "datetime-local" }
						]
					)}

					${createTestScenarioSection(
						"9-E",
						"System - Block Email (Feed Temporary)",
						"Temporarily blocks an email in the 'feed' scope.",
						"POST",
						"/block-users/blockEmail",
						{
							email: "test@example.com",
							scope: "feed",
							permanent: false,
							temporary: 86400
						},
						[
							"Verify email block expires after ~24 hours",
						],
						[
							{ type: "text", id: "email", required: true, label: "Email", value: "test@example.com" },
							{
								type: "select",
								id: "scope",
								label: "Scope",
								options: [
									{ value: "auth", text: "Auth" },
									{ value: "feed", text: "Feed" },
									{ value: "private_chat", text: "Private Chat" },
								],
								value: "feed",
								required: true
							},
							{
								type: "select",
								id: "permanent",
								label: "Permanent",
								options: [
									{ value: "false", text: "False" },
									{ value: "true", text: "True" }
								],
								value: "false",
								required: true
							},
							{ type: "text", id: "temporary", label: "Temporary (seconds)", placeholder: "86400", value: "86400", inputMode: "numeric" },
							{ type: "text", id: "expiresAt", label: "Expires At (optional)", placeholder: "Pick date/time below", typeOverride: "datetime-local" }
						]
					)}

					${createTestScenarioSection(
						"9-F",
						"System - Block Email (Private Chat Temporary)",
						"Temporarily blocks an email in the 'private_chat' scope.",
						"POST",
						"/block-users/blockEmail",
						{
							email: "test@example.com",
							scope: "private_chat",
							permanent: false,
							temporary: 86400
						},
						[
							"Verify email block expires after ~24 hours",
						],
						[
							{ type: "text", id: "email", required: true, label: "Email", value: "test@example.com" },
							{
								type: "select",
								id: "scope",
								label: "Scope",
								options: [
									{ value: "auth", text: "Auth" },
									{ value: "feed", text: "Feed" },
									{ value: "private_chat", text: "Private Chat" },
								],
								value: "private_chat",
								required: true
							},
							{
								type: "select",
								id: "permanent",
								label: "Permanent",
								options: [
									{ value: "false", text: "False" },
									{ value: "true", text: "True" }
								],
								value: "false",
								required: true
							},
							{ type: "text", id: "temporary", label: "Temporary (seconds)", placeholder: "86400", value: "86400", inputMode: "numeric" },
							{ type: "text", id: "expiresAt", label: "Expires At (optional)", placeholder: "Pick date/time below", typeOverride: "datetime-local" }
						]
					)}

					${createTestScenarioSection(
						"10-A",
						"System - Is Email Blocked (Auth)",
						"Checks if email is blocked in 'auth' scope.",
						"GET",
						"/block-users/isEmailBlocked",
						null,
						[
							"Confirm result reflects auth block status",
						],
						[
							{ type: "text", id: "email", required: true, label: "Email", value: "test@example.com" },
							{ type: "text", id: "scope", required: true, label: "Scope", value: "auth" }
						]
					)}

					${createTestScenarioSection(
						"10-B",
						"System - Is Email Blocked (Feed)",
						"Checks if email is blocked in 'feed' scope.",
						"GET",
						"/block-users/isEmailBlocked",
						null,
						[
							"Confirm result reflects feed block status",
						],
						[
							{ type: "text", id: "email", required: true, label: "Email", value: "test@example.com" },
							{ type: "text", id: "scope", required: true, label: "Scope", value: "feed" }
						]
					)}

					${createTestScenarioSection(
						"10-C",
						"System - Is Email Blocked (Private Chat)",
						"Checks if email is blocked in 'private_chat' scope.",
						"GET",
						"/block-users/isEmailBlocked",
						null,
						[
							"Confirm result reflects private_chat block status",
						],
						[
							{ type: "text", id: "email", required: true, label: "Email", value: "test@example.com" },
							{ type: "text", id: "scope", required: true, label: "Scope", value: "private_chat" }
						]
					)}

					<!-- Manual Actions -->

					${createTestScenarioSection(
						"11",
						"Manual Action - List Manual Actions(all, paginated)",
						"Lists manual actions with filters via GET /block-users/listManualActions.",
						"GET",
						"/block-users/listManualActions",
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
						"12",
						"Manual Action - Suspend User",
						"Suspends a user via POST /block-users/suspendUser.",
						"POST",
						"/block-users/suspendUser",
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
						"12-B",
						"Manual Action - Suspend (Duplicate)",
						"Attempts to suspend an already suspended user to test idempotency/update behavior.",
						"POST",
						"/block-users/suspendUser",
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
						"13",
						"Manual Action - Unsuspend User",
						"Unsuspends a user via POST /block-users/unsuspendUser.",
						"POST",
						"/block-users/unsuspendUser",
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
						"14",
						"Manual Action - Is User Suspended",
						"Checks suspension status via GET /block-users/isUserSuspended.",
						"GET",
						"/block-users/isUserSuspended",
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
						"15",
						"Manual Action - Warn User",
						"Warns a user via POST /block-users/warnUser.",
						"POST",
						"/block-users/warnUser",
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
