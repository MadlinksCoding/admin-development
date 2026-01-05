# Edge Tests Moderation Audit

## Highlights
- Scenario cards stay collapsible with Path / Query / Body groupings; dot-path inputs show nested labels for structure clarity.
- Requests honor `application/json` bodies: payload editors remain editable, dot-path keys auto-nest, and `testing: true` is injected for POST/PUT flows.
- Base URL selection is explicit: index links to the API Base URL section, you can override the host, or fall back to `api-config` / `AdminEndpoints` resolution.
- Error handling is richer: API errors now surface status + statusText and the parsed backend body (including `body.error`) via `dash-api-handler-response`; loaders still clear on failure and required fields block sends with guidance.
- Code Usage examples now mirror each scenario’s inputs: path params appear in the URL template, query params are generated from the scenario fields, and body samples include the scenario payload plus `testing: true`.
- Quality-of-life: optional IDs stay blank by default, timestamps use `datetime-local` pickers (converted to epoch ms), and input labels show where values land.

## What Changed (descriptive)
- Scenario UX: Collapse controls, navigation link to base URL, per-group labeling (Path/Query/Body) with required markers and nested indent cues in [page/developer/edge-tests-moderation/script.js](page/developer/edge-tests-moderation/script.js).
- Payload handling: Editable JSON areas for body methods; dot-path flattening to nested objects; auto-merge of form inputs plus `testing: true` for test calls.
- Transport correctness: Ensured `application/json` bodies flow through APIHandler, including meta updates and nested fields for moderation actions.
- Error/loader fixes: APIHandler now parses JSON (falls back to text), attaches `status`, `statusText`, and parsed `data` to dispatched error events, and rethrows enriched errors; the UI renders backend error payloads (preferring `body.error`) with status in the response panel.
- Code samples: Usage snippets are generated from each scenario’s inputs—path params are templated into the URL, query params come from non-path inputs, and body samples include the scenario defaults plus `testing: true`.
- Time inputs: `datetime-local` fields translate to epoch ms to avoid manual timestamp typing.
- Modularity: Centralized base URL lookup, nesting helper, payload editor read, and response rendering for reuse.

## Test Scenarios Covered
1) Create Moderation Entry — POST /moderation
2) Get Moderations (filters: status, userId, priority, type, dayKey, asc, pagination) — GET /moderation
3) Get Moderation by ID — GET /moderation/{moderationId}
4) Update Moderation Meta — PUT /moderation/{moderationId}
5) Moderation Action (approve/reject) — POST /moderation/{moderationId}/action
6) Escalate Moderation — POST /moderation/{moderationId}/escalate
7) Add Moderation Note — POST /moderation/{moderationId}/note
8) Delete Moderation (placeholder) — DELETE /moderation/{moderationId}

## How to Use / Replicate
- Navigate via the index; there is a link to the API Base URL section. Set or override the base URL if needed.
- Open a scenario card (collapsible). Required fields are marked; nested fields show indentation to mirror dot-path structure.
- For POST/PUT flows, edit the payload textarea if needed; form inputs merge into the request and `testing: true` is appended automatically.
- Use the `datetime-local` controls for time fields; values are converted to epoch ms before sending.
- Run “Test API Call.” Success renders formatted JSON; errors now show status/statusText and the backend JSON body (preferring `body.error`) in the response panel; loaders no longer hang.
- Collapse/expand cards with the chevron; Bootstrap handles the animation without custom JS.

## Notes / Follow-ups
- Optional IDs intentionally start empty to avoid accidental calls against production-like data.
- Delete scenario is a placeholder until backend delete is finalized—update the endpoint/contract when available.
- Cleanup section remains unchanged for test data reset.
