export const STATUSES = {
  booked: "예약 완료",
  completed: "수업 완료",
  memberCanceled: "회원 취소",
  adminCanceled: "관리자 취소",
  noShow: "노쇼"
};

export const STATUS_TONE = {
  booked: "success",
  completed: "success",
  memberCanceled: "danger",
  adminCanceled: "danger",
  noShow: "warning"
};

export const MEMBER_STATUS = {
  active: "활성",
  inactive: "비활성"
};

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function nowStamp() {
  return new Date().toISOString();
}

export function money(value) {
  return Number(value || 0).toLocaleString("ko-KR");
}

export function dateLabel(iso) {
  if (!iso) return "-";
  const date = new Date(`${iso}T00:00:00`);
  return date.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
}

export function shortDate(iso) {
  if (!iso) return "-";
  return iso.replaceAll("-", ".");
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function minutes(time) {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

export function reservationEnd(start, duration) {
  const [hour, minute] = start.split(":").map(Number);
  const date = new Date(2000, 0, 1, hour, minute + Number(duration || 60));
  return date.toTimeString().slice(0, 5);
}

export function slotsForSchedule(schedule) {
  const slots = [];
  for (let m = minutes(schedule.startTime); m + Number(schedule.duration) <= minutes(schedule.endTime); m += Number(schedule.duration)) {
    const hour = String(Math.floor(m / 60)).padStart(2, "0");
    const minute = String(m % 60).padStart(2, "0");
    slots.push(`${hour}:${minute}`);
  }
  return slots;
}

export function unitPrice(member) {
  if (!member || !Number(member.totalCount)) return 0;
  return Math.round(Number(member.paidAmount || 0) / Number(member.totalCount));
}
