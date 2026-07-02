import "server-only";

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { unstable_noStore as noStore } from "next/cache";
import type { AppData, Member, Reservation, ScheduleSlot } from "@/lib/domain";
import { generateSlots, reservationEnd } from "@/lib/domain";
import { readPrismaData, writePrismaData } from "@/lib/server/prisma-store";
import { newId, newMemberToken as createMemberToken, seedData } from "@/lib/server/seed-data";

export const newMemberToken = createMemberToken;

const dataFile = join(process.cwd(), "data", "saas-app-data.json");
let writeQueue = Promise.resolve();

function usesPostgresStorage() {
  return process.env.STORAGE_DRIVER === "postgres";
}

export async function readAppData(): Promise<AppData> {
  noStore();
  if (usesPostgresStorage()) return readPrismaData();
  try {
    return JSON.parse(await readFile(dataFile, "utf8")) as AppData;
  } catch {
    const data = seedData();
    await writeAppData(data);
    return data;
  }
}

export async function writeAppData(data: AppData) {
  if (usesPostgresStorage()) {
    await writePrismaData(data);
    return;
  }
  await mkdir(dirname(dataFile), { recursive: true });
  const tempFile = `${dataFile}.${process.pid}.${newId("tmp")}.tmp`;
  await writeFile(tempFile, JSON.stringify(data, null, 2));
  await rename(tempFile, dataFile);
}

export async function updateAppData<T>(mutator: (data: AppData) => T | Promise<T>) {
  const run = async () => {
    const data = await readAppData();
    const result = await mutator(data);
    await writeAppData(data);
    return result;
  };

  const result = writeQueue.then(run, run);
  writeQueue = result.then(() => undefined, () => undefined);
  return result;
}

export function availableSlots(data: AppData, member: Member, date: string) {
  if (member.status !== "active" || member.remainingCount <= 0) return [];

  const taken = new Set(
    data.reservations
      .filter((reservation) => reservation.trainerId === member.trainerId && reservation.date === date && reservation.status === "booked")
      .map((reservation) => reservation.startTime)
  );

  return data.scheduleSlots
    .filter((slot) => slot.trainerId === member.trainerId && slot.date === date && slot.isAvailable)
    .flatMap((slot) =>
      generateSlots(slot)
        .filter((time) => !taken.has(time))
        .map((time) => ({ scheduleSlotId: slot.id, time, endTime: reservationEnd(time, slot.duration), room: slot.room }))
    );
}

export function createReservationRecord(input: {
  data: AppData;
  member: Member;
  date: string;
  time: string;
  memo?: string;
}) {
  const slot = availableSlots(input.data, input.member, input.date).find((item) => item.time === input.time);
  if (!slot) throw new Error("이미 예약되었거나 선택할 수 없는 시간입니다.");

  const reservation: Reservation = {
    id: newId("reservation"),
    memberId: input.member.id,
    trainerId: input.member.trainerId,
    scheduleSlotId: slot.scheduleSlotId,
    date: input.date,
    startTime: slot.time,
    endTime: slot.endTime,
    status: "booked",
    memo: input.memo,
    room: slot.room
  };

  input.data.reservations.push(reservation);
  return reservation;
}
