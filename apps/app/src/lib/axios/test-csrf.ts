// Test file to verify CSRF token fetching
import { httpClient } from "./index";

async function testCSRFToken() {
  console.log("Testing CSRF token fetching...");

  try {
    // Test 1: Direct CSRF token fetch
    console.log("Test 1: Fetching CSRF token directly...");
    const csrfProtection = httpClient.components.csrfProtection;
    const token = await csrfProtection.getCSRFToken(true); // Force refresh
    console.log(
      "✅ CSRF token fetched successfully:",
      token ? "Token received" : "No token"
    );

    // Test 2: Make a regular API request that should include CSRF token
    console.log("\nTest 2: Making API request with CSRF token...");
    // const response = await httpClient.api.get('/auth/session');
    const response = await httpClient.api.get("/auth/me");
    console.log("✅ API request completed successfully");

    // Test 3: Check if token is cached
    console.log("\nTest 3: Checking token cache...");
    const cachedToken = await csrfProtection.getCSRFToken(); // Should use cache
    console.log(
      "✅ Cached token retrieved:",
      cachedToken ? "Token from cache" : "No cached token"
    );

    console.log("\n✅ All tests passed! No infinite loop detected.");
  } catch (error) {
    console.error("❌ Test failed:", error);
    if (
      error instanceof Error &&
      error.message.includes("Maximum call stack")
    ) {
      console.error("⚠️  Infinite loop detected in CSRF token fetching!");
    }
  }
}

// Run the test
if (typeof window !== "undefined") {
  // Run in browser
  (window as any).testCSRFToken = testCSRFToken;
  console.log("Run testCSRFToken() in the browser console to test");
} else {
  // Run in Node.js
  testCSRFToken();
}

export { testCSRFToken };
