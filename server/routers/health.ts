import { router, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";

export const healthRouter = router({
  check: publicProcedure.query(async () => {
    try {
      // Check database connection
      const db = await getDb();
      if (!db) {
        return {
          status: "unhealthy",
          database: "disconnected",
          timestamp: new Date().toISOString(),
        };
      }

      // Simple query to verify DB is responsive
      await db.execute("SELECT 1");

      return {
        status: "healthy",
        database: "connected",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: "unhealthy",
        database: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }),
});
