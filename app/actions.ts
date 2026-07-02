"use server";

import { revalidatePath } from "next/cache";
import { reservationEnd, type ReservationStatus } from "@/lib/domain";
import { actionFailure, actionSuccess } from "@/lib/action-result";
import { createReservationRecord, newMemberToken, updateAppData } from "@/lib/server/app-store";
import { newId } from "@/lib/server/seed-data";
import {
  adminMemberInputSchema,
  adminReservationInputSchema,
  adminReservationStatusInputSchema,
  adminScheduleBlockInputSchema,
  adminScheduleSlotInputSchema,
  adminTrainerInputSchema,
  cancelMemberReservationInputSchema,
  idSchema,
  memberReservationInputSchema
} from "@/lib/validation";

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

export async function createAdminMemberAction(input: {
  name: string;
  phone: string;
  trainerId: string;
  packageId: string;
  memo?: string;
}) {
  const parsed = adminMemberInputSchema.safeParse(input);
  if (!parsed.success) return actionFailure("회원 정보를 다시 확인해주세요.");

  try {
    const token = await updateAppData((data) => {
      const trainer = data.trainers.find((item) => item.id === parsed.data.trainerId);
      const lessonPackage = data.lessonPackages.find((item) => item.id === parsed.data.packageId);
      if (!trainer) throw new Error("담당 트레이너를 찾을 수 없습니다.");
      if (!lessonPackage) throw new Error("수업권을 찾을 수 없습니다.");

      const member = {
        id: newId("member"),
        name: parsed.data.name,
        phone: parsed.data.phone,
        trainerId: trainer.id,
        memberToken: newMemberToken(),
        status: "active" as const,
        memo: parsed.data.memo,
        packageName: lessonPackage.name,
        totalCount: lessonPackage.totalCount,
        remainingCount: lessonPackage.totalCount,
        completedCount: 0,
        paidAmount: lessonPackage.paidAmount
      };

      data.members.push(member);
      return member.memberToken;
    });
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/members");
    return actionSuccess("회원을 등록했습니다.", { token });
  } catch (error) {
    return actionFailure(error instanceof Error ? error.message : "회원을 등록하지 못했습니다.");
  }
}

export async function createAdminReservationAction(input: {
  memberId: string;
  date: string;
  time: string;
  memo?: string;
}) {
  const parsed = adminReservationInputSchema.safeParse(input);
  if (!parsed.success) return actionFailure("예약 정보를 다시 확인해주세요.");

  try {
    const token = await updateAppData((data) => {
      const member = data.members.find((item) => item.id === parsed.data.memberId);
      if (!member) throw new Error("회원을 찾을 수 없습니다.");
      const reservation = createReservationRecord({
        data,
        member,
        date: parsed.data.date,
        time: parsed.data.time,
        memo: parsed.data.memo
      });
      return { token: member.memberToken, reservationId: reservation.id };
    });
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/reservations");
    revalidatePath(`/booking/${token.token}`);
    return actionSuccess("예약을 추가했습니다.", token);
  } catch (error) {
    return actionFailure(error instanceof Error ? error.message : "예약을 추가하지 못했습니다.");
  }
}

function revertReservationEffect(input: {
  status: ReservationStatus;
  noShowDeducted?: boolean;
  member: { remainingCount: number; completedCount: number; totalCount: number };
}) {
  if (input.status === "completed") {
    input.member.remainingCount = Math.min(input.member.totalCount, input.member.remainingCount + 1);
    input.member.completedCount = Math.max(0, input.member.completedCount - 1);
  }
  if (input.status === "noShow" && input.noShowDeducted) {
    input.member.remainingCount = Math.min(input.member.totalCount, input.member.remainingCount + 1);
  }
}

function applyReservationEffect(input: {
  status: ReservationStatus;
  member: { remainingCount: number; completedCount: number };
}) {
  if (input.status === "completed") {
    if (input.member.remainingCount <= 0) throw new Error("남은 수업 횟수가 없어 완료 처리할 수 없습니다.");
    input.member.remainingCount -= 1;
    input.member.completedCount += 1;
  }
  if (input.status === "noShow") {
    if (input.member.remainingCount <= 0) throw new Error("남은 수업 횟수가 없어 노쇼 차감할 수 없습니다.");
    input.member.remainingCount -= 1;
    return true;
  }
  return false;
}

export async function updateReservationStatusAction(input: {
  reservationId: string;
  status: ReservationStatus;
}) {
  const parsed = adminReservationStatusInputSchema.safeParse(input);
  if (!parsed.success) return actionFailure("예약 상태를 다시 확인해주세요.");

  try {
    const memberToken = await updateAppData((data) => {
      const reservation = data.reservations.find((item) => item.id === parsed.data.reservationId);
      const member = data.members.find((item) => item.id === reservation?.memberId);
      if (!reservation || !member) throw new Error("예약을 찾을 수 없습니다.");

      if (reservation.status === parsed.data.status) return member.memberToken;

      revertReservationEffect({
        status: reservation.status,
        noShowDeducted: reservation.noShowDeducted,
        member
      });

      const noShowDeducted = applyReservationEffect({ status: parsed.data.status, member });
      reservation.status = parsed.data.status;
      reservation.noShowDeducted = noShowDeducted;
      reservation.cancelReason =
        parsed.data.status === "adminCanceled" ? "관리자 취소" : parsed.data.status === "memberCanceled" ? "회원 취소" : undefined;

      return member.memberToken;
    });
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/reservations");
    revalidatePath("/admin/members");
    revalidatePath(`/booking/${memberToken}`);
    return actionSuccess("예약 상태를 변경했습니다.");
  } catch (error) {
    return actionFailure(error instanceof Error ? error.message : "예약 상태를 변경하지 못했습니다.");
  }
}

export async function upsertTrainerAction(input: {
  trainerId?: string;
  name: string;
  phone?: string;
  memo?: string;
}) {
  const parsed = adminTrainerInputSchema.safeParse(input);
  if (!parsed.success) return actionFailure("트레이너 정보를 다시 확인해주세요.");

  try {
    await updateAppData((data) => {
      if (parsed.data.trainerId) {
        const trainer = data.trainers.find((item) => item.id === parsed.data.trainerId);
        if (!trainer) throw new Error("트레이너를 찾을 수 없습니다.");
        trainer.name = parsed.data.name;
        trainer.phone = parsed.data.phone || undefined;
        trainer.memo = parsed.data.memo || undefined;
        return;
      }

      data.trainers.push({
        id: newId("trainer"),
        name: parsed.data.name,
        phone: parsed.data.phone || undefined,
        memo: parsed.data.memo || undefined
      });
    });
    revalidatePath("/admin/settings");
    revalidatePath("/admin/members");
    revalidatePath("/admin/schedule");
    revalidatePath("/admin/reservations");
    return actionSuccess(parsed.data.trainerId ? "트레이너 정보를 수정했습니다." : "트레이너를 등록했습니다.");
  } catch (error) {
    return actionFailure(error instanceof Error ? error.message : "트레이너 정보를 저장하지 못했습니다.");
  }
}

export async function createScheduleSlotAction(input: {
  trainerId: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  room: string;
}) {
  const parsed = adminScheduleSlotInputSchema.safeParse(input);
  if (!parsed.success) return actionFailure("시간표 정보를 다시 확인해주세요.");

  try {
    await updateAppData((data) => {
      const trainer = data.trainers.find((item) => item.id === parsed.data.trainerId);
      if (!trainer) throw new Error("트레이너를 찾을 수 없습니다.");
      if (parsed.data.startTime >= parsed.data.endTime) throw new Error("종료 시간은 시작 시간보다 늦어야 합니다.");

      data.scheduleSlots.push({
        id: newId("slot"),
        trainerId: parsed.data.trainerId,
        date: parsed.data.date,
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        duration: parsed.data.duration,
        isAvailable: true,
        room: parsed.data.room
      });
    });
    revalidatePath("/admin/schedule");
    revalidatePath("/admin/reservations");
    revalidatePath("/admin/members");
    return actionSuccess("시간표를 등록했습니다.");
  } catch (error) {
    return actionFailure(error instanceof Error ? error.message : "시간표를 등록하지 못했습니다.");
  }
}

export async function toggleScheduleBlockAction(input: {
  trainerId: string;
  date: string;
  startTime: string;
}) {
  const parsed = adminScheduleBlockInputSchema.safeParse(input);
  if (!parsed.success) return actionFailure("시간 정보를 다시 확인해주세요.");

  try {
    await updateAppData((data) => {
      const reservation = data.reservations.find(
        (item) =>
          item.trainerId === parsed.data.trainerId &&
          item.date === parsed.data.date &&
          item.startTime === parsed.data.startTime &&
          item.status === "booked"
      );
      if (reservation) throw new Error("이미 예약된 시간은 먼저 예약 상태를 변경해야 막을 수 있습니다.");

      const blockIndex = data.scheduleBlocks.findIndex(
        (item) => item.trainerId === parsed.data.trainerId && item.date === parsed.data.date && item.startTime === parsed.data.startTime
      );
      if (blockIndex >= 0) {
        data.scheduleBlocks.splice(blockIndex, 1);
        return;
      }

      const slot = data.scheduleSlots.find((item) => item.trainerId === parsed.data.trainerId && item.date === parsed.data.date);
      if (!slot) throw new Error("해당 날짜의 시간표를 찾을 수 없습니다.");
      data.scheduleBlocks.push({
        id: newId("block"),
        trainerId: parsed.data.trainerId,
        date: parsed.data.date,
        startTime: parsed.data.startTime,
        endTime: reservationEnd(parsed.data.startTime, slot.duration),
        room: slot.room,
        reason: "관리자 차단"
      });
    });
    revalidatePath("/admin/schedule");
    revalidatePath("/admin/reservations");
    return actionSuccess("타임 상태를 변경했습니다.");
  } catch (error) {
    return actionFailure(error instanceof Error ? error.message : "타임 상태를 변경하지 못했습니다.");
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
