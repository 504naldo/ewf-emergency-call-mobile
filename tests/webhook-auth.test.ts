import { describe, it, expect } from "vitest";

describe("Webhook Authentication", () => {
  it("should have webhook secret configured", () => {
    const webhookSecret = process.env.WEBHOOK_SECRET;
    
    expect(webhookSecret).toBeDefined();
    expect(webhookSecret).toBeTruthy();
    
    if (webhookSecret) {
      expect(webhookSecret.length).toBeGreaterThan(10);
      console.log(`✓ Webhook secret configured (length: ${webhookSecret.length})`);
    }
  });
});
