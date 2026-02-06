import { getDb } from "./db";

async function dropTables() {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    process.exit(1);
  }
  
  const tables = ['call_attempts', 'rotation_state', 'oncall_schedule', 'sites', 'incidents', 'incident_events', 'notifications', 'system_config'];
  
  for (const table of tables) {
    try {
      await db.execute(`DROP TABLE IF EXISTS \`${table}\``);
      console.log(`Dropped table: ${table}`);
    } catch (err: any) {
      console.log(`Failed to drop ${table}: ${err.message}`);
    }
  }
  
  console.log('Done!');
  process.exit(0);
}

dropTables().catch(console.error);
