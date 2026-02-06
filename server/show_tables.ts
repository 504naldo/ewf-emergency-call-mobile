import { getDb } from "./db";

async function showTables() {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    process.exit(1);
  }
  
  const result: any = await db.execute("SHOW TABLES");
  console.log("Tables in database:");
  if (result.rows) {
    result.rows.forEach((row: any) => console.log("  -", Object.values(row)[0]));
  }
  process.exit(0);
}

showTables().catch(console.error);
