/**
 * Edge Tests - Users
 *
 * Config-driven edge test page for the Users controller.
 * Uses shared logic from window.EdgeTestsShared.
 */
(function () {
	const config = {
		section: "users",
		prerequisites: [
			"<strong>Environment Setup:</strong> Development server running (e.g., localhost:3000)",
			"<strong>API Configuration:</strong> API endpoints configured in api-config script tag",
			"<strong>Database Access:</strong> Access to database for manual verification",
			"<strong>Dependencies:</strong> All required JavaScript files loaded (APIHandler, AdminShell, etc.)",
		],
		terminologies: {
			"Edge Test": "A test that verifies behavior at system boundaries and limits.",
			APIHandler: "JavaScript class that manages API requests, responses, and loading states.",
			"Testing Parameter": "Special parameter (testing: true) required in all POST requests.",
			"Query Parameters": "Parameters passed in URL for GET requests (e.g., ?limit=10).",
			"Request Data": "Data sent in request body for POST/PUT requests.",
			"Response Callback": "Function that handles API response after successful request.",
			"Verification Checklist": "Manual steps to verify test results in database.",
			"Cleanup Method": "Function that resets test data after testing is complete.",
		},
		cleanupEndpoint: "/users/cleanupTestUsers",
		arrayFieldIds: [
			"user_profile.backgroundImages",
			"user_profile.socialUrls",
			"user_profile.additionalUrls",
			"backgroundImages",
			"socialUrls",
			"additionalUrls",
		],
		indentSubScenarios: false,
	};

	window.EdgeTestsShared.initPage(config);
})();

