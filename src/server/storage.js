import { randomBytes } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { nowStamp } from "../shared/domain.js";

const dataFile = join(process.cwd(), "data", "pt-booking-data.json");

export function uid(prefix) {
  return `${prefix}_${randomBytes(5).toString("hex")}_${Date.now().toString(36)}`;
}

export function token() {
  return randomBytes(18).toString("base64url");
}

function seedData() {
  const trainerId = uid("trainer");
  const memberId = uid("member");
  const data = {
    trainers: [{ id: trainerId, name: "대표 트레이너", phone: "010-0000-0000", memo: "", createdAt: nowStamp(), updatedAt: nowStamp() }],
    members: [{
      id: memberId,
      name: "김승연",
      phone: "010-1234-5678",
      trainerId,
      packageName: "20회권",
      totalCount: 20,
      remainingCount: 12,
      completedCount: 8,
      paidAmount: 1200000,
      memo: "저녁 시간 선호",
      token: token(),
      status: "active",
      createdAt: nowStamp(),
      updatedAt: nowStamp()
    }],
    schedules: [],
    reservations: []
  };

  const start = new Date();
  for (let day = 0; day < 14; day += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + day);
    const weekday = date.getDay();
    if (weekday === 0) continue;
    data.schedules.push({
      id: uid("schedule"),
      trainerId,
      date: date.toISOString().slice(0, 10),
      startTime: "10:00",
      endTime: weekday === 6 ? "15:00" : "20:00",
      duration: 60,
      isAvailable: true,
      createdAt: nowStamp(),
      updatedAt: nowStamp()
    });
  }

  return data;
}

export async function readData() {
  try {
    return JSON.parse(await readFile(dataFile, "utf8"));
  } catch {
    const data = seedData();
    await writeData(data);
    return data;
  }
}

export async function writeData(data) {
  await mkdir(dirname(dataFile), { recursive: true });
  const tempFile = `${dataFile}.${process.pid}.tmp`;
  await writeFile(tempFile, JSON.stringify(data, null, 2));
  await rename(tempFile, dataFile);
}
