import { getDb } from "./db";

async function resetMigrations() {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    process.exit(1);
  }
  
  try {
    // Delete migration records for the failed migrations
    await db.execute(`DELETE FROM __drizzle_migrations WHERE idx >= 1`);
    console.log('Cleared migration history for idx >= 1');
  } catch (err: any) {
    console.log(`Failed to reset migrations: ${err.message}`);
  }
  
  console.log('Done!');
  process.exit(0);
}

resetMigrations().catch(console.error);
