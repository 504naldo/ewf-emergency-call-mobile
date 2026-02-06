import { z } from "zod";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "../_core/trpc";
import { getUserById, getUsersByRole, updateUserAvailability } from "../db";

export const usersRouter = router({
  // Get current user info - PROTECTED
  getMe: protectedProcedure.query(async ({ ctx }) => {
    return await getUserById(ctx.user.id);
  }),

  // Get all techs (for admin board) - ADMIN ONLY
  getAllTechs: adminProcedure.query(async () => {
    return await getUsersByRole("tech");
  }),

  // Update availability toggle - PROTECTED
  updateAvailability: protectedProcedure
    .input(z.object({ available: z.boolean() }))
    .mutation(async ({ input, ctx }) => {

      await updateUserAvailability(ctx.user.id, input.available);

      return { success: true };
    }),
});
