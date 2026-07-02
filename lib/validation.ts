import { z } from "zod";
import type { ReservationStatus } from "@/lib/domain";

export const reservationStatusValues = ["booked", "completed", "memberCanceled", "adminCanceled", "noShow"] as const satisfies readonly ReservationStatus[];

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

export const adminMemberInputSchema = z.object({
  name: z.string().trim().min(2, "회원명을 입력해주세요.").max(40),
  phone: z.string().trim().min(8, "연락처를 입력해주세요.").max(30),
  trainerId: z.string().min(3),
  packageId: z.string().min(3),
  memo: z.string().trim().max(400).optional()
});

export const adminReservationInputSchema = z.object({
  memberId: z.string().min(3),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  memo: z.string().trim().max(400).optional()
});

export const adminReservationStatusInputSchema = z.object({
  reservationId: z.string().min(3),
  status: z.enum(reservationStatusValues)
});
