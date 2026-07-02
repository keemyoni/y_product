import "server-only";

import type { AppData, Member, Reservation } from "@/lib/domain";
import { formatCurrency, formatShortDate, statusLabel, unitPrice } from "@/lib/domain";
import { availableSlots, readAppData } from "@/lib/server/app-store";

function trainerName(data: AppData, id: string) {
  return data.trainers.find((trainer) => trainer.id === id)?.name ?? "-";
}

function memberName(data: AppData, id: string) {
  return data.members.find((member) => member.id === id)?.name ?? "-";
}

function nextReservation(data: AppData, memberId: string) {
  return data.reservations
    .filter((reservation) => reservation.memberId === memberId && reservation.status === "booked")
    .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`))[0];
}

export async function getAdminData() {
  const data = await readAppData();
  const today = "2026-07-04";
  const completed = data.reservations.filter((reservation) => reservation.status === "completed");
  const booked = data.reservations.filter((reservation) => reservation.status === "booked");
  const emptySlots = data.scheduleSlots.reduce((sum, slot) => sum + availableSlots(data, data.members.find((member) => member.trainerId === slot.trainerId) ?? data.members[0], slot.date).length, 0);
  const settlement = completed.reduce((sum, reservation) => {
    const member = data.members.find((item) => item.id === reservation.memberId);
    return member ? sum + unitPrice(member) : sum;
  }, 0);

  return {
    raw: data,
    kpis: [
      { label: "오늘 예약", value: String(booked.filter((reservation) => reservation.date === today).length), helper: "실시간 예약 기준", tone: "default" as const },
      { label: "이번 주 완료", value: String(completed.length), helper: "수업 완료 처리 기준", tone: "success" as const },
      { label: "빈 슬롯", value: String(emptySlots), helper: "예약 가능한 시간", tone: "warning" as const },
      { label: "이번 달 정산", value: formatCurrency(settlement), helper: "완료 수업 기준", tone: "default" as const }
    ],
    members: data.members.map((member) => {
      const next = nextReservation(data, member.id);
      return {
        id: member.id,
        name: member.name,
        phone: member.phone,
        trainer: trainerName(data, member.trainerId),
        packageName: member.packageName,
        total: member.totalCount,
        remaining: member.remainingCount,
        completed: member.completedCount,
        status: member.remainingCount <= 2 ? "관리 필요" : "활성",
        next: next ? `${formatShortDate(next.date)} ${next.startTime}` : "-",
        paid: formatCurrency(member.paidAmount),
        token: member.memberToken
      };
    }),
    reservations: data.reservations.map((reservation) => reservationRow(data, reservation)),
    scheduleSlots: ["월", "화", "수", "목", "금"].map((day, index) => ({
      day,
      slots: data.scheduleSlots[index] ? [data.scheduleSlots[index].startTime, data.scheduleSlots[index].endTime] : []
    })),
    packages: data.lessonPackages.map((item) => ({
      name: item.name,
      count: `${item.totalCount}회`,
      price: formatCurrency(item.paidAmount),
      active: data.members.filter((member) => member.packageName === item.name).length
    })),
    settlementRows: [
      { month: "2026.07", completed: completed.length, amount: formatCurrency(settlement), noShow: data.reservations.filter((item) => item.status === "noShow").length },
      { month: "2026.06", completed: 0, amount: "₩0", noShow: 0 },
      { month: "2026.05", completed: 0, amount: "₩0", noShow: 0 }
    ]
  };
}

function reservationRow(data: AppData, reservation: Reservation) {
  const member = data.members.find((item) => item.id === reservation.memberId);
  return {
    id: reservation.id,
    time: reservation.startTime,
    member: memberName(data, reservation.memberId),
    type: member?.packageName ?? "PT",
    status: statusLabel[reservation.status],
    statusKey: reservation.status,
    room: reservation.room
  };
}

export async function getMemberDetail(memberId: string) {
  const data = await readAppData();
  const member = data.members.find((item) => item.id === memberId) ?? data.members[0];
  const next = nextReservation(data, member.id);
  return {
    member,
    trainer: trainerName(data, member.trainerId),
    next,
    reservations: data.reservations
      .filter((reservation) => reservation.memberId === member.id)
      .map((reservation) => ({
        date: formatShortDate(reservation.date),
        time: reservation.startTime,
        status: statusLabel[reservation.status],
        statusKey: reservation.status,
        memo: reservation.memo || reservation.cancelReason || "요청 없음"
      }))
  };
}

export async function getMemberBooking(memberToken: string) {
  const data = await readAppData();
  const member = data.members.find((item) => item.memberToken === memberToken);
  if (!member) return null;
  const dates = Array.from(new Set(data.scheduleSlots.filter((slot) => slot.trainerId === member.trainerId).map((slot) => slot.date))).sort();
  const selectedDate = dates[0] ?? "2026-07-04";
  const next = nextReservation(data, member.id);
  return {
    member,
    token: memberToken,
    trainer: trainerName(data, member.trainerId),
    next: next ? `${formatShortDate(next.date)} ${next.startTime}` : "없음",
    dates: dates.map((date) => ({ raw: date, label: formatShortDate(date), slots: availableSlots(data, member, date) })),
    selectedDate,
    history: data.reservations
      .filter((reservation) => reservation.memberId === member.id)
      .map((reservation) => ({
        id: reservation.id,
        date: formatShortDate(reservation.date),
        rawDate: reservation.date,
        time: reservation.startTime,
        status: statusLabel[reservation.status],
        statusKey: reservation.status
      }))
  };
}
