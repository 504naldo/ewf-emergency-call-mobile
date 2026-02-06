import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getUserById, getUsersByRole, updateUserAvailability } from "../db";

export const usersRouter = router({
  // Get current user info
  getMe: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user?.id) {
      return null;
    }
    return await getUserById(ctx.user.id);
  }),

  // Get all techs (for admin board)
  getAllTechs: publicProcedure.query(async () => {
    return await getUsersByRole("tech");
  }),

  // Update availability toggle
  updateAvailability: publicProcedure
    .input(z.object({ available: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user?.id) {
        throw new Error("User not authenticated");
      }

      await updateUserAvailability(ctx.user.id, input.available);

      return { success: true };
    }),
});
