import { randomBytes } from "node:crypto";
import type { AppData, Member, ScheduleSlot } from "@/lib/domain";

export function newId(prefix: string) {
  return `${prefix}_${randomBytes(5).toString("hex")}`;
}

export function newMemberToken() {
  return randomBytes(18).toString("base64url");
}

export function seedData(): AppData {
  const trainerA = "trainer_01";
  const trainerB = "trainer_02";
  const members: Member[] = [
    {
      id: "m-001",
      name: "김승연",
      phone: "010-1234-5678",
      trainerId: trainerA,
      memberToken: "mock-token",
      status: "active",
      memo: "저녁 시간 선호. 어깨 재활 운동 병행.",
      packageName: "20회권",
      totalCount: 20,
      remainingCount: 12,
      completedCount: 8,
      paidAmount: 1200000
    },
    {
      id: "m-002",
      name: "박서현",
      phone: "010-8821-3102",
      trainerId: trainerA,
      memberToken: newMemberToken(),
      status: "active",
      memo: "오전 선호",
      packageName: "10회권",
      totalCount: 10,
      remainingCount: 2,
      completedCount: 8,
      paidAmount: 650000
    },
    {
      id: "m-003",
      name: "정민재",
      phone: "010-4402-1299",
      trainerId: trainerB,
      memberToken: newMemberToken(),
      status: "active",
      memo: "하체 강화 루틴",
      packageName: "30회권",
      totalCount: 30,
      remainingCount: 21,
      completedCount: 9,
      paidAmount: 1650000
    }
  ];

  const scheduleSlots: ScheduleSlot[] = [
    { id: "slot_01", trainerId: trainerA, date: "2026-07-04", startTime: "10:00", endTime: "20:00", duration: 60, isAvailable: true, room: "Room A" },
    { id: "slot_02", trainerId: trainerA, date: "2026-07-05", startTime: "09:00", endTime: "15:00", duration: 60, isAvailable: true, room: "Room B" },
    { id: "slot_03", trainerId: trainerA, date: "2026-07-08", startTime: "10:00", endTime: "21:00", duration: 60, isAvailable: true, room: "Room C" },
    { id: "slot_04", trainerId: trainerB, date: "2026-07-04", startTime: "09:00", endTime: "18:00", duration: 60, isAvailable: true, room: "Room A" }
  ];

  return {
    trainers: [
      { id: trainerA, name: "이도윤", phone: "010-2384-9172" },
      { id: trainerB, name: "한유진", phone: "010-3392-7281" }
    ],
    members,
    scheduleSlots,
    scheduleBlocks: [],
    reservations: [
      { id: "r-001", memberId: "m-003", trainerId: trainerB, scheduleSlotId: "slot_04", date: "2026-07-04", startTime: "09:00", endTime: "10:00", status: "booked", room: "Room A" },
      { id: "r-002", memberId: "m-002", trainerId: trainerA, scheduleSlotId: "slot_02", date: "2026-07-05", startTime: "11:00", endTime: "12:00", status: "booked", room: "Room B" },
      { id: "r-003", memberId: "m-001", trainerId: trainerA, scheduleSlotId: "slot_03", date: "2026-07-01", startTime: "18:00", endTime: "19:00", status: "completed", room: "Room C" },
      { id: "r-004", memberId: "m-001", trainerId: trainerA, scheduleSlotId: "slot_03", date: "2026-07-08", startTime: "18:00", endTime: "19:00", status: "booked", room: "Room C" }
    ],
    lessonPackages: [
      { id: "pkg_01", name: "1회 체험권", totalCount: 1, paidAmount: 70000 },
      { id: "pkg_10", name: "10회권", totalCount: 10, paidAmount: 650000 },
      { id: "pkg_20", name: "20회권", totalCount: 20, paidAmount: 1200000 },
      { id: "pkg_30", name: "30회권", totalCount: 30, paidAmount: 1650000 }
    ]
  };
}
