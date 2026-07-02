import { z } from "zod";

export const memberReservationInputSchema = z.object({
  memberToken: z.string().min(8),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  memo: z.string().trim().max(400).optional()
});

export const cancelMemberReservationInputSchema = z.object({
  memberToken: z.string().min(8),
  reservationId: z.string().min(3)
});

export const idSchema = z.string().min(3);
