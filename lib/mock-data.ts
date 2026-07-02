export const trainer = {
  name: "이도윤",
  studio: "Studio Balance",
  phone: "010-2384-9172"
};

export const kpis = [
  { label: "오늘 예약", value: "18", helper: "전일 대비 +3", tone: "default" as const },
  { label: "이번 주 완료", value: "74", helper: "완료율 92%", tone: "success" as const },
  { label: "빈 슬롯", value: "11", helper: "오늘 예약 가능", tone: "warning" as const },
  { label: "이번 달 정산", value: "₩8.72M", helper: "예상 정산", tone: "default" as const }
];

export const members = [
  {
    id: "m-001",
    name: "김승연",
    phone: "010-1234-5678",
    trainer: "이도윤",
    packageName: "20회권",
    total: 20,
    remaining: 12,
    completed: 8,
    status: "활성",
    next: "7월 8일 18:00",
    paid: "₩1,200,000"
  },
  {
    id: "m-002",
    name: "박서현",
    phone: "010-8821-3102",
    trainer: "이도윤",
    packageName: "10회권",
    total: 10,
    remaining: 2,
    completed: 8,
    status: "관리 필요",
    next: "7월 5일 11:00",
    paid: "₩650,000"
  },
  {
    id: "m-003",
    name: "정민재",
    phone: "010-4402-1299",
    trainer: "한유진",
    packageName: "30회권",
    total: 30,
    remaining: 21,
    completed: 9,
    status: "활성",
    next: "7월 4일 20:00",
    paid: "₩1,650,000"
  }
];

export const reservations = [
  { time: "09:00", member: "정민재", type: "PT 60", status: "예약 완료", room: "Room A" },
  { time: "11:00", member: "박서현", type: "Pilates 50", status: "예약 완료", room: "Room B" },
  { time: "14:00", member: "최하린", type: "PT 60", status: "수업 완료", room: "Room A" },
  { time: "18:00", member: "김승연", type: "PT 60", status: "예약 완료", room: "Room C" }
];

export const scheduleSlots = [
  { day: "월", slots: ["10:00", "11:00", "14:00", "18:00"] },
  { day: "화", slots: ["09:00", "13:00", "17:00", "20:00"] },
  { day: "수", slots: ["10:00", "12:00", "16:00", "19:00"] },
  { day: "목", slots: ["09:00", "11:00", "15:00", "18:00"] },
  { day: "금", slots: ["10:00", "14:00", "17:00", "20:00"] }
];

export const packages = [
  { name: "1회 체험권", count: "1회", price: "₩70,000", active: 18 },
  { name: "10회권", count: "10회", price: "₩650,000", active: 54 },
  { name: "20회권", count: "20회", price: "₩1,200,000", active: 41 },
  { name: "30회권", count: "30회", price: "₩1,650,000", active: 22 }
];

export const settlementRows = [
  { month: "2026.07", completed: 118, amount: "₩7,080,000", noShow: 3 },
  { month: "2026.06", completed: 132, amount: "₩7,920,000", noShow: 5 },
  { month: "2026.05", completed: 124, amount: "₩7,440,000", noShow: 2 }
];

export const memberBooking = {
  member: "김승연",
  remaining: 12,
  next: "2026년 7월 8일 18:00",
  dates: ["7월 4일 토", "7월 5일 일", "7월 6일 월", "7월 7일 화", "7월 8일 수"],
  times: ["10:00", "11:00", "14:00", "18:00", "19:00", "20:00"],
  history: [
    { date: "7월 1일", time: "18:00", status: "수업 완료" },
    { date: "7월 8일", time: "18:00", status: "예약 완료" }
  ]
};
