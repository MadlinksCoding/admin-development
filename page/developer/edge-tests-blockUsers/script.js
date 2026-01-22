/**
 * Edge Tests - Block Users
 *
 * Config-driven edge test page for the Block Users controller.
 * Uses shared logic from window.EdgeTestsShared.
 */
(function () {
	const config = {
		section: "block",
		prerequisites: [
			"<strong>Environment Setup:</strong> Development server running (e.g., localhost:3000)",
			"<strong>API Configuration:</strong> API endpoints configured in api-config script tag",
			"<strong>Database Access:</strong> Access to database for manual verification",
			"<strong>Dependencies:</strong> All required JavaScript files loaded (APIHandler, AdminShell, etc.)",
		],
		terminologies: {
			Block:
				"Restrict interactions or access between subjects (users/IP/email/app scope).",
			Scope: "Context for a block (e.g., feed, private_chat).",
			"Temporary vs Permanent":
				"Temporary uses seconds duration; permanent is boolean flag.",
			"Manual Actions": "Suspensions and warnings tracked per user.",
			Pagination: "limit/nextToken used across list endpoints.",
		},
		cleanupEndpoint: "/user-blocks/cleanupTestBlocks",
		arrayFieldIds: ["blocks"],
		indentSubScenarios: false,
	};

	window.EdgeTestsShared.initPage(config);
})();
