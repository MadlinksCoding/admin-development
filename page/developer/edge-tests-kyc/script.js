/**
 * Edge Tests - KYC Class
 *
 * Config-driven edge test page for KYC functionality.
 * Uses shared logic from window.EdgeTestsShared.
 */
(function () {
  const config = {
    section: "kyc",
    prerequisites: [
      "<strong>Environment Setup:</strong> Development server running (e.g., XAMPP, localhost:3000)",
      "<strong>API Configuration:</strong> API endpoints configured in api-config script tag",
      "<strong>Database Access:</strong> Access to database for manual verification",
      "<strong>Dependencies:</strong> All required JavaScript files loaded (APIHandler, AdminShell, etc.)",
    ],
    terminologies: {
      "Edge Test": "A test that verifies behavior at system boundaries and limits.",
      APIHandler: "JavaScript class that manages API requests, responses, and loading states.",
      "Testing Parameter": "Special parameter (testing: true) required in all POST requests.",
      "Query Parameters": "Parameters passed in URL for GET requests (e.g., ?per_page=10).",
      "Request Data": "Data sent in request body for POST/PUT requests.",
      "Response Callback": "Function that handles API response after successful request.",
      "Verification Checklist": "Manual steps to verify test results in database.",
      "Cleanup Method": "Function that resets test data after testing is complete.",
    },
    cleanupEndpoint: "/kyc/cleanup",
  };

  window.EdgeTestsShared.initPage(config);
})();
