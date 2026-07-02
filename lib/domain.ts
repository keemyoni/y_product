export type ReservationStatus = "booked" | "completed" | "memberCanceled" | "adminCanceled" | "noShow";
export type MemberStatus = "active" | "inactive";

export type Trainer = {
  id: string;
  name: string;
  phone?: string;
  memo?: string;
};

export type Member = {
  id: string;
  name: string;
  phone: string;
  trainerId: string;
  memberToken: string;
  status: MemberStatus;
  memo?: string;
  packageName: string;
  totalCount: number;
  remainingCount: number;
  completedCount: number;
  paidAmount: number;
};

export type ScheduleSlot = {
  id: string;
  trainerId: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  isAvailable: boolean;
  room: string;
};

export type ScheduleBlock = {
  id: string;
  trainerId: string;
  date: string;
  startTime: string;
  endTime: string;
  room: string;
  reason?: string;
};

export type Reservation = {
  id: string;
  memberId: string;
  trainerId: string;
  scheduleSlotId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: ReservationStatus;
  memo?: string;
  cancelReason?: string;
  noShowDeducted?: boolean;
  room: string;
};

export type LessonPackage = {
  id: string;
  name: string;
  totalCount: number;
  paidAmount: number;
};

export type AppData = {
  trainers: Trainer[];
  members: Member[];
  scheduleSlots: ScheduleSlot[];
  scheduleBlocks: ScheduleBlock[];
  reservations: Reservation[];
  lessonPackages: LessonPackage[];
};

export const statusLabel: Record<ReservationStatus, string> = {
  booked: "예약 완료",
  completed: "수업 완료",
  memberCanceled: "회원 취소",
  adminCanceled: "관리자 취소",
  noShow: "노쇼"
};

export function formatCurrency(value: number) {
  return `₩${value.toLocaleString("ko-KR")}`;
}

export function formatShortDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  return parsed.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
}

export function minutes(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

export function reservationEnd(startTime: string, duration: number) {
  const [hour, minute] = startTime.split(":").map(Number);
  const date = new Date(2000, 0, 1, hour, minute + duration);
  return date.toTimeString().slice(0, 5);
}

export function generateSlots(slot: ScheduleSlot) {
  const slots: string[] = [];
  for (let time = minutes(slot.startTime); time + slot.duration <= minutes(slot.endTime); time += slot.duration) {
    const hour = String(Math.floor(time / 60)).padStart(2, "0");
    const minute = String(time % 60).padStart(2, "0");
    slots.push(`${hour}:${minute}`);
  }
  return slots;
}

export function unitPrice(member: Member) {
  if (!member.totalCount) return 0;
  return Math.round(member.paidAmount / member.totalCount);
}
