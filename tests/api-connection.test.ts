import { describe, it, expect } from "vitest";

describe("API Connection", () => {
  it("should connect to backend API and fetch debug incidents", async () => {
    const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
    
    expect(apiBaseUrl).toBeDefined();
    expect(apiBaseUrl).toContain("3000-");
    
    // Test the debug endpoint
    const response = await fetch(`${apiBaseUrl}/api/debug/incidents`);
    expect(response.ok).toBe(true);
    
    const data = await response.json();
    expect(data).toHaveProperty("count");
    expect(data).toHaveProperty("incidents");
    expect(Array.isArray(data.incidents)).toBe(true);
    
    console.log(`✓ API connection successful: ${data.count} incidents found`);
  });
});
