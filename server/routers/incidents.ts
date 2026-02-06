import { z } from "zod";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "../_core/trpc";
import {
  getAllOpenIncidents,
  getIncidentById,
  getIncidentsByUser,
  getUnclaimedIncidents,
  updateIncidentStatus,
  closeIncident,
  getCallAttemptsByIncident,
  getIncidentEvents,
  getUserById,
  getSiteById,
} from "../db";
import {
  assignIncident,
  startRouting,
  logIncidentEvent,
} from "../routing-engine";

export const incidentsRouter = router({
  // Get all open incidents (for admin board) - ADMIN ONLY
  getAllOpen: adminProcedure.query(async () => {
    return await getAllOpenIncidents();
  }),

  // Get unclaimed incidents (for admin board) - ADMIN ONLY
  getUnclaimed: adminProcedure.query(async () => {
    return await getUnclaimedIncidents();
  }),

  // Get incidents assigned to current user (for tech mobile app) - PROTECTED
  getMyIncidents: protectedProcedure.query(async ({ ctx }) => {
    return await getIncidentsByUser(ctx.user.id);
  }),

  // Get incident details with related data - PROTECTED
  getDetails: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const incident = await getIncidentById(input.id);
      if (!incident) {
        throw new Error("Incident not found");
      }

      const [callAttempts, events, assignedUser, site] = await Promise.all([
        getCallAttemptsByIncident(input.id),
        getIncidentEvents(input.id),
        incident.assignedUserId ? getUserById(incident.assignedUserId) : null,
        incident.siteId ? getSiteById(incident.siteId) : null,
      ]);

      return {
        incident,
        callAttempts,
        events,
        assignedUser,
        site,
      };
    }),

  // Accept incident (tech claims it) - PROTECTED
  accept: protectedProcedure
    .input(z.object({ incidentId: z.number() }))
    .mutation(async ({ input, ctx }) => {

      await assignIncident(input.incidentId, ctx.user.id, ctx.user.id);

      await logIncidentEvent({
        incidentId: input.incidentId,
        type: "incident_accepted",
        userId: ctx.user.id,
        payloadJson: { acceptedBy: ctx.user.id },
      });

      return { success: true };
    }),

  // Decline incident (tech declines it) - PROTECTED
  decline: protectedProcedure
    .input(
      z.object({
        incidentId: z.number(),
        reason: z.enum(["busy", "already_on_call", "out_of_area", "other"]),
        reasonText: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {

      await logIncidentEvent({
        incidentId: input.incidentId,
        type: "incident_declined",
        userId: ctx.user.id,
        payloadJson: {
          declinedBy: ctx.user.id,
          reason: input.reason,
          reasonText: input.reasonText,
        },
      });

      // TODO: Trigger next step in routing ladder

      return { success: true };
    }),

  // Update incident status (en route, on site, etc.) - PROTECTED
  updateStatus: protectedProcedure
    .input(
      z.object({
        incidentId: z.number(),
        status: z.enum(["open", "en_route", "on_site", "resolved", "follow_up_required"]),
      })
    )
    .mutation(async ({ input, ctx }) => {

      await updateIncidentStatus(input.incidentId, input.status, ctx.user.id);

      return { success: true };
    }),

  // Close incident with outcome - PROTECTED
  close: protectedProcedure
    .input(
      z.object({
        incidentId: z.number(),
        outcome: z.enum(["nuisance", "device_issue", "panel_trouble", "unknown", "other"]),
        outcomeNotes: z.string().optional(),
        followUpRequired: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {

      await closeIncident(
        input.incidentId,
        {
          outcome: input.outcome,
          outcomeNotes: input.outcomeNotes,
          followUpRequired: input.followUpRequired,
        },
        ctx.user.id
      );

      return { success: true };
    }),

  // Manual assignment (admin only) - ADMIN ONLY
  manualAssign: adminProcedure
    .input(
      z.object({
        incidentId: z.number(),
        userId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {

      await assignIncident(input.incidentId, input.userId, ctx.user.id);

      return { success: true };
    }),

  // Manual escalation (admin only) - ADMIN ONLY
  manualEscalate: adminProcedure
    .input(z.object({ incidentId: z.number() }))
    .mutation(async ({ input, ctx }) => {

      await logIncidentEvent({
        incidentId: input.incidentId,
        type: "manual_escalation",
        userId: ctx.user.id,
        payloadJson: { escalatedBy: ctx.user.id },
      });

      // Restart routing from current step
      await startRouting(input.incidentId);

      return { success: true };
    }),
});
