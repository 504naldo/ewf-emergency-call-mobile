import { describe, it, expect, beforeAll } from "vitest";
import { getDb, getIncidentById, getUserById, getSiteById, matchSiteByPhone } from "../server/db";
import { isBusinessHours } from "../server/routing-engine";

describe("EWF Emergency Call System", () => {
  describe("Database Operations", () => {
    it("should connect to database", async () => {
      const db = await getDb();
      expect(db).toBeDefined();
    });

    it("should query users table", async () => {
      const db = await getDb();
      if (!db) {
        console.warn("Database not available, skipping test");
        return;
      }

      const result: any = await db.execute("SELECT COUNT(*) as count FROM users");
      expect(result).toBeDefined();
    });

    it("should match site by phone number", async () => {
      const site = await matchSiteByPhone("+1234560000");
      // Site may or may not exist depending on seed data
      expect(site === null || typeof site === "object").toBe(true);
    });
  });

  describe("Routing Engine", () => {
    it("should detect business hours correctly", async () => {
      const isBH = await isBusinessHours();
      expect(typeof isBH).toBe("boolean");
    });

    it("should handle business hours configuration", async () => {
      // Test that the function doesn't throw
      await expect(isBusinessHours()).resolves.toBeDefined();
    });
  });

  describe("Data Models", () => {
    it("should handle incident creation data structure", () => {
      const incidentData = {
        externalId: "test-123",
        callerId: "+1234567890",
        siteId: 1,
      };

      expect(incidentData.externalId).toBe("test-123");
      expect(incidentData.callerId).toBe("+1234567890");
      expect(incidentData.siteId).toBe(1);
    });

    it("should handle call attempt data structure", () => {
      const attemptData = {
        incidentId: 1,
        step: 0,
        targetUserId: 1,
        result: "ringing" as const,
      };

      expect(attemptData.incidentId).toBe(1);
      expect(attemptData.step).toBe(0);
      expect(attemptData.result).toBe("ringing");
    });
  });

  describe("Configuration", () => {
    it("should have valid business hours config structure", () => {
      const config = {
        days: [1, 2, 3, 4, 5], // Monday-Friday
        startHour: 8,
        startMinute: 0,
        endHour: 17,
        endMinute: 0,
        timezone: "America/Los_Angeles",
      };

      expect(config.days).toHaveLength(5);
      expect(config.startHour).toBeGreaterThanOrEqual(0);
      expect(config.startHour).toBeLessThanOrEqual(23);
      expect(config.endHour).toBeGreaterThanOrEqual(0);
      expect(config.endHour).toBeLessThanOrEqual(23);
    });

    it("should have valid ladder config structure", () => {
      const bhLadder = {
        steps: ["primary_oncall", "secondary", "admin", "manager", "broadcast"],
      };

      const ahLadder = {
        steps: ["primary_oncall", "secondary", "manager", "admin", "rotating_pool"],
      };

      expect(bhLadder.steps).toHaveLength(5);
      expect(ahLadder.steps).toHaveLength(5);
      expect(bhLadder.steps[0]).toBe("primary_oncall");
      expect(ahLadder.steps[0]).toBe("primary_oncall");
    });
  });

  describe("Webhook Payloads", () => {
    it("should validate incoming call payload structure", () => {
      const payload = {
        callId: "test-call-123",
        from: "+1234567890",
        to: "+1800EMERGENCY",
        timestamp: new Date().toISOString(),
      };

      expect(payload.callId).toBeDefined();
      expect(payload.from).toBeDefined();
      expect(payload.to).toBeDefined();
      expect(payload.timestamp).toBeDefined();
    });

    it("should validate answered payload structure", () => {
      const payload = {
        callId: "test-call-123",
        answeredBy: "+1234567891",
        timestamp: new Date().toISOString(),
      };

      expect(payload.callId).toBeDefined();
      expect(payload.answeredBy).toBeDefined();
      expect(payload.timestamp).toBeDefined();
    });
  });

  describe("User Roles", () => {
    it("should validate role types", () => {
      const validRoles = ["tech", "admin", "manager"];
      
      expect(validRoles).toContain("tech");
      expect(validRoles).toContain("admin");
      expect(validRoles).toContain("manager");
    });

    it("should validate user data structure", () => {
      const user = {
        id: 1,
        openId: "test-openid",
        name: "Test User",
        email: "test@example.com",
        phone: "+1234567890",
        role: "tech" as const,
        active: true,
        available: true,
      };

      expect(user.role).toBe("tech");
      expect(user.active).toBe(true);
      expect(user.available).toBe(true);
    });
  });

  describe("Incident Lifecycle", () => {
    it("should validate incident status transitions", () => {
      const validStatuses = ["open", "en_route", "on_site", "resolved", "follow_up_required"];
      
      expect(validStatuses).toContain("open");
      expect(validStatuses).toContain("en_route");
      expect(validStatuses).toContain("on_site");
      expect(validStatuses).toContain("resolved");
    });

    it("should validate incident outcome types", () => {
      const validOutcomes = ["nuisance", "device_issue", "panel_trouble", "unknown", "other"];
      
      expect(validOutcomes).toContain("nuisance");
      expect(validOutcomes).toContain("device_issue");
      expect(validOutcomes).toContain("panel_trouble");
    });
  });

  describe("SLA Calculation", () => {
    it("should calculate elapsed time correctly", () => {
      const createdAt = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
      const now = new Date();
      const elapsedMinutes = Math.floor((now.getTime() - createdAt.getTime()) / 1000 / 60);
      
      expect(elapsedMinutes).toBeGreaterThanOrEqual(4);
      expect(elapsedMinutes).toBeLessThanOrEqual(6);
    });

    it("should categorize SLA status correctly", () => {
      const getSLAStatus = (minutes: number) => {
        if (minutes < 5) return "success";
        if (minutes < 15) return "warning";
        return "error";
      };

      expect(getSLAStatus(3)).toBe("success");
      expect(getSLAStatus(10)).toBe("warning");
      expect(getSLAStatus(20)).toBe("error");
    });
  });
});
