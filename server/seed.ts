import { getDb } from "./db";
import {
  users,
  sites,
  oncallSchedule,
  rotationState,
  systemConfig,
} from "../drizzle/schema";

async function seed() {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    process.exit(1);
  }

  console.log("Starting database seed...");

  // Insert test users
  console.log("Creating users...");
  const userInserts: any = await db.insert(users).values([
    {
      openId: "tech1-openid",
      name: "John Smith",
      email: "john.smith@ewf.com",
      phone: "+1234567890",
      role: "tech",
      active: true,
      available: true,
    },
    {
      openId: "tech2-openid",
      name: "Jane Doe",
      email: "jane.doe@ewf.com",
      phone: "+1234567891",
      role: "tech",
      active: true,
      available: true,
    },
    {
      openId: "tech3-openid",
      name: "Mike Johnson",
      email: "mike.johnson@ewf.com",
      phone: "+1234567892",
      role: "tech",
      active: true,
      available: true,
    },
    {
      openId: "tech4-openid",
      name: "Sarah Williams",
      email: "sarah.williams@ewf.com",
      phone: "+1234567893",
      role: "tech",
      active: true,
      available: true,
    },
    {
      openId: "admin1-openid",
      name: "Admin User",
      email: "admin@ewf.com",
      phone: "+1234567894",
      role: "admin",
      active: true,
      available: true,
    },
    {
      openId: "manager1-openid",
      name: "Manager User",
      email: "manager@ewf.com",
      phone: "+1234567895",
      role: "manager",
      active: true,
      available: true,
    },
  ]);
  console.log(`Created ${userInserts.affectedRows} users`);

  // Insert test sites
  console.log("Creating sites...");
  const siteInserts: any = await db.insert(sites).values([
    {
      name: "Downtown Office",
      address: "123 Main St, Anytown, CA 90210",
      notes: "Main office building, 5 floors",
      phoneMatchRules: ["+1234560000", "+1234560001"],
    },
    {
      name: "Warehouse District",
      address: "456 Industrial Blvd, Anytown, CA 90211",
      notes: "Large warehouse facility",
      phoneMatchRules: ["+1234560010", "+1234560011"],
    },
    {
      name: "Retail Store #1",
      address: "789 Shopping Center Dr, Anytown, CA 90212",
      notes: "Main retail location",
      phoneMatchRules: ["+1234560020"],
    },
  ]);
  console.log(`Created ${siteInserts.affectedRows} sites`);

  // Insert on-call schedule (current week)
  console.log("Creating on-call schedule...");
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const scheduleInserts: any = await db.insert(oncallSchedule).values([
    {
      userId: 1, // John Smith - Primary
      startTime: weekStart,
      endTime: weekEnd,
      priorityOrder: 1,
      isPrimary: true,
      isSecondary: false,
      eligiblePool: true,
    },
    {
      userId: 2, // Jane Doe - Secondary
      startTime: weekStart,
      endTime: weekEnd,
      priorityOrder: 2,
      isPrimary: false,
      isSecondary: true,
      eligiblePool: true,
    },
    {
      userId: 3, // Mike Johnson - Pool
      startTime: weekStart,
      endTime: weekEnd,
      priorityOrder: 3,
      isPrimary: false,
      isSecondary: false,
      eligiblePool: true,
    },
    {
      userId: 4, // Sarah Williams - Pool
      startTime: weekStart,
      endTime: weekEnd,
      priorityOrder: 4,
      isPrimary: false,
      isSecondary: false,
      eligiblePool: true,
    },
  ]);
  console.log(`Created ${scheduleInserts.affectedRows} on-call schedule entries`);

  // Initialize rotation state
  console.log("Initializing rotation state...");
  const rotationInserts = await db.insert(rotationState).values({
    pointerIndex: 0,
    lastUsedUserIds: [],
  });
  console.log(`Created rotation state`);

  // Insert system configuration
  console.log("Creating system configuration...");
  const configInserts: any = await db.insert(systemConfig).values([
    {
      key: "business_hours",
      value: {
        days: [1, 2, 3, 4, 5], // Monday-Friday
        startHour: 8,
        startMinute: 0,
        endHour: 17,
        endMinute: 0,
        timezone: "America/Los_Angeles",
      },
    },
    {
      key: "ring_duration",
      value: {
        seconds: 30,
      },
    },
    {
      key: "business_hours_ladder",
      value: {
        steps: ["primary_oncall", "secondary", "admin", "manager", "broadcast"],
      },
    },
    {
      key: "after_hours_ladder",
      value: {
        steps: ["primary_oncall", "secondary", "manager", "admin", "rotating_pool"],
      },
    },
  ]);
  console.log(`Created ${configInserts.affectedRows} system configuration entries`);

  console.log("✅ Database seed completed successfully!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Seed failed:", error);
  process.exit(1);
});
