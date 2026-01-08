# Edge Tests — Developer Guide

This guide explains how to propose, design, implement, and run a new edge tests page for any class in the Admin panel. Follow the approval-first workflow, reuse the existing patterns, and keep styling consistent with Bootstrap and our codebase conventions.

Note: We are intentionally using this manual, Bootstrap-based edge tests workflow. We’re aware of tools like Postman collections and Swagger/OpenAPI, but this approach is by design — it is grunt work that produces consistent, UI-visible scenarios and reusable components. Please follow these instructions and do not deviate from the established patterns without prior approval. The base URL remains editable via the per-page api-config.

## Structure Overview
- **Location:** Create your page under [page/developer](page/developer) as `edge-tests-<class>/` with files `index.html`, `script.js`, and `style.css`.
- **Reusable rendering:** Each page defines scenarios as data + small helpers; the page auto-renders sections, inputs, code examples, and action buttons.
- **Environment config:** Use the per-page `<script type="application/json" id="api-config">` in `index.html` to set `prod|stage|dev` endpoints. Base URL resolves from `api-config` or `window.AdminEndpoints.base`.
- **UI shell:** Pages run inside the Admin shell and sidebar. Include core and UI modules similar to the demo and existing edge test pages.

See these references for patterns and comprehensive examples:
- Demo template: [page/developer/edge-tests-demo/index.html](page/developer/edge-tests-demo/index.html), [page/developer/edge-tests-demo/script.js](page/developer/edge-tests-demo/script.js)
- Users edge tests: [page/developer/edge-tests-users/index.html](page/developer/edge-tests-users/index.html), [page/developer/edge-tests-users/script.js](page/developer/edge-tests-users/script.js)
- Block edge tests: [page/developer/edge-tests-block/index.html](page/developer/edge-tests-block/index.html), [page/developer/edge-tests-block/script.js](page/developer/edge-tests-block/script.js)

## Scenario Design
- **Name clearly:** List scenarios with descriptive names that communicate purpose, e.g., “Create User”, “Update Role”, “Is IP Blocked (Auth)”.
- **Choose coverage:** Include both happy-path and negative-path cases, boundary conditions, duplicates, non-existent IDs, pagination, auth scopes, and cleanup.
- **Inputs per scenario:**
	- Path params: placeholders in route like `/users/{userId}`.
	- Query params: GET-only parameters (`?q=...&page=...`).
	- Body params: POST/PUT/PATCH request payload; nested inputs are supported (e.g., `settings.theme`, `profile.name.first`).
- **Approval-first:** Before implementation, prepare the scenario list and send it to your supervisor. Only proceed after approval.

## Index Navigation & Scenario Renderer
- **Index navigation:** Implement an index of links to all scenarios using the same pattern as demo/users/block pages. The page script builds the index (e.g., `createIndexNavigation()` in existing pages) and anchors it to each scenario card for quick navigation.
- **Scenario renderer:** Use the renderer function `createTestScenarioSection()` (see users/block pages) to generate scenario cards. It:
	- Displays title, description, and the `METHOD path`.
	- Auto-groups inputs into Path/Query/Body using endpoint placeholders.
	- Renders editable payload for POST/PUT/PATCH and appends `testing: true`.
	- Adds Bootstrap-styled buttons (Play/Clear), a response container, and a manual checklist.
- **Do not diverge:** Reuse the renderer/index patterns; any major deviation requires supervisor approval.

## Styling & Conventions
- **Bootstrap:** Use Bootstrap 5 classes and Bootstrap Icons in all UI (cards, buttons, inputs, alerts, chevrons). Match the demo and edge tests pages.
- **Code style:** Do not deviate from existing patterns in rendering helpers, event wiring, naming, and HTML structure. Any major deviation requires prior approval.
- **Content guidelines:** All POST-like requests must include `testing: true` in the payload.

## Configuration Steps (New Page)
- **Sidebar entry:** Add a new item under Developers → Edge Tests in [assets/js/core/config.js](assets/js/core/config.js). Set `slug: "developer/edge-tests-<class>", label: "<Class> Class"`.
- **Section key:** In your `index.html` `body`, set `data-section="developer/edge-tests-<class>"`.
- **API config:** Add `<script type="application/json" id="api-config">` mapping for your section and class alias, similar to users/block pages. Example:

```json
{
	"developer/edge-tests-example": {
		"prod": { "endpoint": "" },
		"stage": { "endpoint": "" },
		"dev": { "endpoint": "http://localhost:3000/example" }
	},
	"example": {
		"prod": { "endpoint": "" },
		"stage": { "endpoint": "" },
		"dev": { "endpoint": "http://localhost:3000/example" }
	}
}
```

- **Base URL:** The base URL is editable via `api-config`. If omitted, pages may fall back to `window.AdminEndpoints.base[Env.current]`.

## Workflow (Approval to Implementation)
1. **Get approval for tests:** Draft the full set of scenarios with descriptive names and send to your supervisor. Include rationale and inputs required per scenario.
2. **Write tests using APIHandler and Node.js server:**
	 - Implement the page using `APIHandler` from [apiHandler.js](apiHandler.js) for all API calls.
	 - Set up a local Node.js server (Express) that exposes the needed routes at `http://localhost:3000/<class>` (or as configured in `api-config`).
3. **Run tests and verify with a DB visualizer:** Execute scenarios in the page; then open your DB visualizer (e.g., NoSQL Workbench or SQL Workbench) and verify inserts/updates/deletes using your DB tooling or the developer pages in this repo.
4. **Use reusable Bootstrap components:** Compose cards, forms, buttons, and icons exactly as in demo/edge tests; keep consistency in spacing, headings, and collapse toggles.

## Scenario Data Model (Reusable)
Define scenarios as a small data structure feeding a renderer. Each scenario can declare inputs for path, query, and body. Nested body fields render as grouped inputs.

Example scenario declaration (conceptual):

```js
const scenarios = [
	{
		id: "1",
		title: "Create Example",
		method: "POST",
		endpoint: "/example",
		description: "Creates a new example item.",
		requestPayload: {
			name: "Sample",
			settings: { theme: "light", notifications: { email: true } },
			// 'testing: true' will be added automatically by the template
		},
		inputFields: [
			// Body params (nested allowed)
			{ id: "name", label: "Name", required: true, placeholder: "Sample" },
			{ id: "settings.theme", label: "Theme", type: "text", placeholder: "light" },
			{ id: "settings.notifications.email", label: "Email Notifs", type: "checkbox" }
		],
		checklist: [
			"Row inserted in examples table",
			"Audit log marks testing=true",
			"Defaults applied for missing fields"
		]
	},
	{
		id: "2",
		title: "Get Example by ID",
		method: "GET",
		endpoint: "/example/{id}",
		description: "Fetches example item by ID.",
		inputFields: [
			// Path params
			{ id: "id", label: "Example ID", required: true, inputMode: "numeric" },
			// Query params (rendered for GET)
			{ id: "include", label: "Include", placeholder: "details" }
		]
	}
];
```

Your `script.js` should map these to rendered sections with:
- Scenario header, description, endpoint method+path.
- Auto-rendered inputs split across Path/Query/Body using placeholder detection in the endpoint.
- “Test API Call” and “Clear” buttons; response container.
- Code usage example showing `APIHandler` parameters and how `testing: true` is applied.

Refer to the concrete implementations for rendering helpers and input grouping:
- [page/developer/edge-tests-users/script.js](page/developer/edge-tests-users/script.js)
- [page/developer/edge-tests-block/script.js](page/developer/edge-tests-block/script.js)
	- Look for `createIndexNavigation()` and `createTestScenarioSection()` usage and mirror that structure.

## API Calls (APIHandler)
Use `APIHandler` consistently for all requests.

GET example:

```js
const api = new APIHandler();
await api.handleRequest({
	apiBaseUrl: `${getBaseUrl()}/example`,
	httpMethod: "GET",
	queryParams: { per_page: 10, q: "sample" },
	responseCallback: (data) => {
		// render response
	}
});
```

POST/PUT/PATCH example (testing flag included):

```js
const api = new APIHandler();
await api.handleRequest({
	apiBaseUrl: `${getBaseUrl()}/example`,
	httpMethod: "POST",
	requestData: { name: "Sample", testing: true },
	responseCallback: (data) => {
		// render response
	}
});
```

Note: `getBaseUrl()` follows the same logic as in demo/users/block pages: resolve from `api-config` → `AdminEndpoints.base` → fallback `http://localhost:3000`.

## Local Node.js Server (Dev)
When developing or demoing, spin up a minimal Express server that matches your configured routes:

Endpoint naming guidelines:
- Use camelCase and ensure names are descriptive of the action.
- Examples:
  - POST user/createUser
  - GET user/fetchUser/:id

```js
// server.js
import express from "express";
const app = express();
app.use(express.json());

// Example routes (users)
app.post("/user/createuser", (req, res) => {
	res.json({ ok: true, id: 123, ...req.body });
});

app.get("/user/fetchuser/:id", (req, res) => {
	res.json({ id: req.params.id, name: "Sample User" });
});

app.listen(3000, () => console.log("Dev API on http://localhost:3000"));
```

Run it locally:

```bash
node server.js
```

Match your page’s `api-config` `dev` endpoint (e.g., `http://localhost:3000/user`).

## Running & DB Verification
- **Run tests:** Open the edge tests page and execute scenarios via the “Test API Call” buttons; use the collapse toggles and checklist for manual steps.
- **DB visualizer:** Verify results using your preferred DB viewer, or use the developer pages:
	- Postgres: [page/developer/postgres](page/developer/postgres)
	- MySQL: [page/developer/mysql](page/developer/mysql)
	- Scylla DB: [page/developer/scylla-db](page/developer/scylla-db)
- **Cleanup:** Provide a cleanup method/section to undo test data as shown in demo/users/block pages.

## Don’ts and Approvals
- Do not deviate from Bootstrap syntax/icons or established code patterns.
- Any major deviation (new components, layout changes, different rendering approach) requires supervisor approval.
- Keep labels, spacing, and iconography consistent with existing pages.

## Quick Checklist (Before PR)
- Scenarios documented, approved, and descriptive.
- `index.html` includes `api-config`, core modules, and sets `data-section`.
- Sidebar updated in [assets/js/core/config.js](assets/js/core/config.js).
- Inputs grouped correctly (Path/Query/Body), nested body inputs render as parent groups.
- API calls done via `APIHandler` with `testing: true` where applicable.
- Demoed locally with Node server or staging endpoints.
- DB verification and cleanup steps provided.

