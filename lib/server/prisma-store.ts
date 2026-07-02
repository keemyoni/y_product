import "server-only";

import type { AppData, LessonPackage, Member, Reservation, ScheduleBlock, ScheduleSlot, Trainer } from "@/lib/domain";
import { prisma } from "@/lib/server/prisma";
import { seedData } from "@/lib/server/seed-data";

const TENANT_ID = process.env.DEFAULT_TENANT_ID || "tenant_default";
const TENANT_NAME = process.env.DEFAULT_TENANT_NAME || "Studio Balance";

function toDate(date: string) {
  return new Date(`${date}T00:00:00.000Z`);
}

function fromDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function readPrismaData(): Promise<AppData> {
  await ensureSeeded();

  const [trainers, members, scheduleSlots, scheduleBlocks, reservations, lessonPackages] = await Promise.all([
    prisma.trainer.findMany({ where: { tenantId: TENANT_ID }, orderBy: { name: "asc" } }),
    prisma.member.findMany({ where: { tenantId: TENANT_ID }, orderBy: { name: "asc" } }),
    prisma.scheduleSlot.findMany({ where: { tenantId: TENANT_ID }, orderBy: [{ date: "asc" }, { startTime: "asc" }] }),
    prisma.scheduleBlock.findMany({ where: { tenantId: TENANT_ID }, orderBy: [{ date: "asc" }, { startTime: "asc" }] }),
    prisma.reservation.findMany({ where: { tenantId: TENANT_ID }, orderBy: [{ date: "asc" }, { startTime: "asc" }] }),
    prisma.lessonPackage.findMany({ where: { tenantId: TENANT_ID, memberId: null }, orderBy: { totalCount: "asc" } })
  ]);

  return {
    trainers: trainers.map<Trainer>((trainer) => ({
      id: trainer.id,
      name: trainer.name,
      phone: trainer.phone ?? undefined,
      memo: trainer.memo ?? undefined
    })),
    members: members.map<Member>((member) => ({
      id: member.id,
      name: member.name,
      phone: member.phone,
      trainerId: member.trainerId,
      memberToken: member.memberToken,
      status: member.status === "inactive" ? "inactive" : "active",
      memo: member.memo ?? undefined,
      packageName: member.packageName,
      totalCount: member.totalCount,
      remainingCount: member.remainingCount,
      completedCount: member.completedCount,
      paidAmount: member.paidAmount
    })),
    scheduleSlots: scheduleSlots.map<ScheduleSlot>((slot) => ({
      id: slot.id,
      trainerId: slot.trainerId,
      date: fromDate(slot.date),
      startTime: slot.startTime,
      endTime: slot.endTime,
      duration: slot.slotDuration,
      isAvailable: slot.isAvailable,
      room: slot.room ?? "Room A"
    })),
    scheduleBlocks: scheduleBlocks.map<ScheduleBlock>((block) => ({
      id: block.id,
      trainerId: block.trainerId,
      date: fromDate(block.date),
      startTime: block.startTime,
      endTime: block.endTime,
      room: block.room ?? "Room A",
      reason: block.reason ?? undefined
    })),
    reservations: reservations.map<Reservation>((reservation) => ({
      id: reservation.id,
      memberId: reservation.memberId,
      trainerId: reservation.trainerId,
      scheduleSlotId: reservation.scheduleSlotId,
      date: fromDate(reservation.date),
      startTime: reservation.startTime,
      endTime: reservation.endTime,
      status: reservation.status as Reservation["status"],
      memo: reservation.memo ?? undefined,
      cancelReason: reservation.cancelReason ?? undefined,
      noShowDeducted: reservation.noShowDeducted,
      room: reservation.room ?? "Room A"
    })),
    lessonPackages: lessonPackages.map<LessonPackage>((pkg) => ({
      id: pkg.id,
      name: pkg.packageName,
      totalCount: pkg.totalCount,
      paidAmount: pkg.paidAmount
    }))
  };
}

export async function writePrismaData(data: AppData) {
  await prisma.$transaction(async (tx) => {
    await tx.tenant.upsert({
      where: { id: TENANT_ID },
      update: { name: TENANT_NAME },
      create: { id: TENANT_ID, name: TENANT_NAME }
    });

    await tx.settlement.deleteMany({ where: { tenantId: TENANT_ID } });
    await tx.reservation.deleteMany({ where: { tenantId: TENANT_ID } });
    await tx.scheduleBlock.deleteMany({ where: { tenantId: TENANT_ID } });
    await tx.scheduleSlot.deleteMany({ where: { tenantId: TENANT_ID } });
    await tx.lessonPackage.deleteMany({ where: { tenantId: TENANT_ID } });
    await tx.member.deleteMany({ where: { tenantId: TENANT_ID } });
    await tx.trainer.deleteMany({ where: { tenantId: TENANT_ID } });

    for (const trainer of data.trainers) {
      await tx.trainer.create({
        data: {
          id: trainer.id,
          tenantId: TENANT_ID,
          name: trainer.name,
          phone: trainer.phone,
          memo: trainer.memo
        }
      });
    }

    for (const member of data.members) {
      await tx.member.create({
        data: {
          id: member.id,
          tenantId: TENANT_ID,
          trainerId: member.trainerId,
          name: member.name,
          phone: member.phone,
          memberToken: member.memberToken,
          status: member.status,
          memo: member.memo,
          packageName: member.packageName,
          totalCount: member.totalCount,
          remainingCount: member.remainingCount,
          completedCount: member.completedCount,
          paidAmount: member.paidAmount
        }
      });
    }

    for (const slot of data.scheduleSlots) {
      await tx.scheduleSlot.create({
        data: {
          id: slot.id,
          tenantId: TENANT_ID,
          trainerId: slot.trainerId,
          date: toDate(slot.date),
          startTime: slot.startTime,
          endTime: slot.endTime,
          slotDuration: slot.duration,
          isAvailable: slot.isAvailable,
          room: slot.room
        }
      });
    }

    for (const block of data.scheduleBlocks ?? []) {
      await tx.scheduleBlock.create({
        data: {
          id: block.id,
          tenantId: TENANT_ID,
          trainerId: block.trainerId,
          date: toDate(block.date),
          startTime: block.startTime,
          endTime: block.endTime,
          room: block.room,
          reason: block.reason
        }
      });
    }

    for (const pkg of data.lessonPackages) {
      await tx.lessonPackage.create({
        data: {
          id: pkg.id,
          tenantId: TENANT_ID,
          packageName: pkg.name,
          totalCount: pkg.totalCount,
          paidAmount: pkg.paidAmount,
          pricePerLesson: Math.round(pkg.paidAmount / pkg.totalCount)
        }
      });
    }

    for (const reservation of data.reservations) {
      await tx.reservation.create({
        data: {
          id: reservation.id,
          tenantId: TENANT_ID,
          memberId: reservation.memberId,
          trainerId: reservation.trainerId,
          scheduleSlotId: reservation.scheduleSlotId,
          date: toDate(reservation.date),
          startTime: reservation.startTime,
          endTime: reservation.endTime,
          status: reservation.status,
          memo: reservation.memo,
          cancelReason: reservation.cancelReason,
          noShowDeducted: reservation.noShowDeducted ?? false,
          room: reservation.room
        }
      });
    }
  });
}

async function ensureSeeded() {
  const tenant = await prisma.tenant.findUnique({ where: { id: TENANT_ID }, select: { id: true } });
  if (tenant) return;
  await writePrismaData(seedData());
}
