"use server";

import { revalidatePath } from "next/cache";
import { actionFailure, actionSuccess } from "@/lib/action-result";
import { createReservationRecord, newMemberToken, updateAppData } from "@/lib/server/app-store";
import { cancelMemberReservationInputSchema, idSchema, memberReservationInputSchema } from "@/lib/validation";

export async function createMemberReservationAction(input: {
  memberToken: string;
  date: string;
  time: string;
  memo?: string;
}) {
  const parsed = memberReservationInputSchema.safeParse(input);
  if (!parsed.success) return actionFailure("예약 정보를 다시 확인해주세요.");

  try {
    await updateAppData((data) => {
      const member = data.members.find((item) => item.memberToken === parsed.data.memberToken);
      if (!member) throw new Error("유효하지 않은 예약 링크입니다.");
      if (member.remainingCount <= 0) throw new Error("남은 수업 횟수가 없습니다.");
      createReservationRecord({ data, member, date: parsed.data.date, time: parsed.data.time, memo: parsed.data.memo });
    });
    revalidatePath(`/booking/${parsed.data.memberToken}`);
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/reservations");
    return actionSuccess("예약이 완료되었습니다.");
  } catch (error) {
    return actionFailure(error instanceof Error ? error.message : "예약을 생성하지 못했습니다.");
  }
}

export async function cancelMemberReservationAction(input: {
  memberToken: string;
  reservationId: string;
}) {
  const parsed = cancelMemberReservationInputSchema.safeParse(input);
  if (!parsed.success) return actionFailure("예약 정보를 다시 확인해주세요.");

  try {
    await updateAppData((data) => {
      const member = data.members.find((item) => item.memberToken === parsed.data.memberToken);
      const reservation = data.reservations.find((item) => item.id === parsed.data.reservationId && item.memberId === member?.id);
      if (!member || !reservation) throw new Error("예약을 찾을 수 없습니다.");
      reservation.status = "memberCanceled";
      reservation.cancelReason = "회원 취소";
    });
    revalidatePath(`/booking/${parsed.data.memberToken}`);
    revalidatePath("/admin/reservations");
    return actionSuccess("예약을 취소했습니다.");
  } catch (error) {
    return actionFailure(error instanceof Error ? error.message : "예약을 취소하지 못했습니다.");
  }
}

export async function renewMemberLinkAction(memberId: string) {
  const parsed = idSchema.safeParse(memberId);
  if (!parsed.success) return actionFailure("회원 정보를 다시 확인해주세요.");

  try {
    const token = await updateAppData((data) => {
      const member = data.members.find((item) => item.id === parsed.data);
      if (!member) throw new Error("회원을 찾을 수 없습니다.");
      member.memberToken = newMemberToken();
      return member.memberToken;
    });
    revalidatePath("/admin/members");
    revalidatePath(`/admin/members/${parsed.data}`);
    return actionSuccess("새 예약 링크를 발급했습니다.", { token });
  } catch (error) {
    return actionFailure(error instanceof Error ? error.message : "새 링크를 발급하지 못했습니다.");
  }
}

export async function completeReservationAction(reservationId: string) {
  const parsed = idSchema.safeParse(reservationId);
  if (!parsed.success) return actionFailure("예약 정보를 다시 확인해주세요.");

  try {
    const memberId = await updateAppData((data) => {
      const reservation = data.reservations.find((item) => item.id === parsed.data);
      const member = data.members.find((item) => item.id === reservation?.memberId);
      if (!reservation || !member) throw new Error("예약을 찾을 수 없습니다.");
      if (reservation.status !== "booked") throw new Error("예약 완료 상태만 수업 완료 처리할 수 있습니다.");
      if (member.remainingCount <= 0) throw new Error("남은 수업 횟수가 없습니다.");
      reservation.status = "completed";
      member.remainingCount -= 1;
      member.completedCount += 1;
      return member.id;
    });
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/reservations");
    revalidatePath(`/admin/members/${memberId}`);
    return actionSuccess("수업 완료 처리했습니다.");
  } catch (error) {
    return actionFailure(error instanceof Error ? error.message : "수업 완료 처리에 실패했습니다.");
  }
}

export async function noShowReservationAction(reservationId: string) {
  const parsed = idSchema.safeParse(reservationId);
  if (!parsed.success) return actionFailure("예약 정보를 다시 확인해주세요.");

  try {
    const memberId = await updateAppData((data) => {
      const reservation = data.reservations.find((item) => item.id === parsed.data);
      const member = data.members.find((item) => item.id === reservation?.memberId);
      if (!reservation || !member) throw new Error("예약을 찾을 수 없습니다.");
      if (reservation.status !== "booked") throw new Error("예약 완료 상태만 노쇼 처리할 수 있습니다.");
      reservation.status = "noShow";
      reservation.noShowDeducted = true;
      if (member.remainingCount > 0) member.remainingCount -= 1;
      return member.id;
    });
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/reservations");
    revalidatePath(`/admin/members/${memberId}`);
    return actionSuccess("노쇼 처리했습니다.");
  } catch (error) {
    return actionFailure(error instanceof Error ? error.message : "노쇼 처리에 실패했습니다.");
  }
}

export async function cancelAdminReservationAction(reservationId: string) {
  const parsed = idSchema.safeParse(reservationId);
  if (!parsed.success) return actionFailure("예약 정보를 다시 확인해주세요.");

  try {
    await updateAppData((data) => {
      const reservation = data.reservations.find((item) => item.id === parsed.data);
      if (!reservation) throw new Error("예약을 찾을 수 없습니다.");
      reservation.status = "adminCanceled";
      reservation.cancelReason = "관리자 취소";
    });
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/reservations");
    return actionSuccess("예약을 취소했습니다.");
  } catch (error) {
    return actionFailure(error instanceof Error ? error.message : "예약 취소에 실패했습니다.");
  }
}
