"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Lock, Unlock } from "lucide-react";
import { createScheduleSlotAction, toggleScheduleBlockAction } from "@/app/actions";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Modal } from "@/components/ui";
import { generateSlots, reservationEnd, type Reservation, type ScheduleBlock, type ScheduleSlot, type Trainer } from "@/lib/domain";

type ScheduleManagementProps = {
  trainers: Trainer[];
  scheduleSlots: ScheduleSlot[];
  scheduleBlocks: ScheduleBlock[];
  reservations: Reservation[];
};

const selectClass =
  "flex h-11 w-full rounded-md border bg-background px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function ScheduleManagement({ trainers, scheduleSlots, scheduleBlocks, reservations }: ScheduleManagementProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [trainerId, setTrainerId] = useState(trainers[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const filteredSlots = useMemo(
    () => scheduleSlots.filter((slot) => !trainerId || slot.trainerId === trainerId),
    [scheduleSlots, trainerId]
  );

  const isBooked = (slot: ScheduleSlot, time: string) =>
    reservations.some(
      (reservation) =>
        reservation.trainerId === slot.trainerId &&
        reservation.date === slot.date &&
        reservation.startTime === time &&
        reservation.status === "booked"
    );

  const isBlocked = (slot: ScheduleSlot, time: string) =>
    scheduleBlocks.some((block) => block.trainerId === slot.trainerId && block.date === slot.date && block.startTime === time);

  const trainerName = (id: string) => trainers.find((trainer) => trainer.id === id)?.name ?? "트레이너";

  const toggleBlock = (slot: ScheduleSlot, time: string) => {
    setMessage("");
    startTransition(async () => {
      const result = await toggleScheduleBlockAction({ trainerId: slot.trainerId, date: slot.date, startTime: time });
      setMessage(result.message);
      if (result.ok) router.refresh();
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle>타임별 예약 제어</CardTitle>
              <CardDescription>
                시간표 등록은 트레이너의 예약 가능 구간을 만드는 기능입니다. 생성된 타임은 예약 전까지 열거나 막을 수 있습니다.
              </CardDescription>
            </div>
            <Button onClick={() => setOpen(true)}>
              <CalendarPlus className="h-4 w-4" aria-hidden />
              시간표 등록
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-xs">
            <select value={trainerId} onChange={(event) => setTrainerId(event.target.value)} className={selectClass} aria-label="트레이너 필터">
              {trainers.map((trainer) => (
                <option key={trainer.id} value={trainer.id}>
                  {trainer.name}
                </option>
              ))}
            </select>
          </div>
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
          <div className="space-y-3">
            {filteredSlots.map((slot) => (
              <div key={slot.id} className="rounded-md border bg-background p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      {slot.date} · {slot.startTime}-{slot.endTime}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {trainerName(slot.trainerId)} · {slot.room} · {slot.duration}분 단위
                    </p>
                  </div>
                  <Badge variant={slot.isAvailable ? "success" : "secondary"}>{slot.isAvailable ? "운영 중" : "비활성"}</Badge>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {generateSlots(slot).map((time) => {
                    const booked = isBooked(slot, time);
                    const blocked = isBlocked(slot, time);
                    return (
                      <div key={`${slot.id}-${time}`} className="flex items-center justify-between gap-2 rounded-md border bg-card px-3 py-2">
                        <div>
                          <p className="text-sm font-medium">
                            {time} - {reservationEnd(time, slot.duration)}
                          </p>
                          <p className="text-xs text-muted-foreground">{booked ? "예약됨" : blocked ? "예약 막힘" : "예약 가능"}</p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant={blocked ? "secondary" : "outline"}
                          disabled={isPending || booked}
                          onClick={() => toggleBlock(slot, time)}
                          aria-label={`${time} ${blocked ? "예약 풀기" : "예약 막기"}`}
                        >
                          {blocked ? <Unlock className="h-4 w-4" aria-hidden /> : <Lock className="h-4 w-4" aria-hidden />}
                          {blocked ? "풀기" : "막기"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="시간표 등록"
        description="트레이너, 날짜, 시작/종료 시간을 입력하면 회원이 예약할 수 있는 타임이 생성됩니다."
      >
        <form
          className="space-y-4"
          action={(formData) => {
            setMessage("");
            startTransition(async () => {
              const result = await createScheduleSlotAction({
                trainerId: String(formData.get("trainerId") ?? ""),
                date: String(formData.get("date") ?? ""),
                startTime: String(formData.get("startTime") ?? ""),
                endTime: String(formData.get("endTime") ?? ""),
                duration: Number(formData.get("duration") ?? 60),
                room: String(formData.get("room") ?? "")
              });
              setMessage(result.message);
              if (result.ok) {
                setOpen(false);
                router.refresh();
              }
            });
          }}
        >
          <label className="space-y-1.5 text-sm font-medium">
            트레이너
            <select name="trainerId" defaultValue={trainerId} className={selectClass} required>
              {trainers.map((trainer) => (
                <option key={trainer.id} value={trainer.id}>
                  {trainer.name}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium">
              날짜
              <Input name="date" type="date" required />
            </label>
            <label className="space-y-1.5 text-sm font-medium">
              공간
              <Input name="room" defaultValue="Room A" required />
            </label>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <label className="space-y-1.5 text-sm font-medium">
              시작
              <Input name="startTime" type="time" defaultValue="09:00" required />
            </label>
            <label className="space-y-1.5 text-sm font-medium">
              종료
              <Input name="endTime" type="time" defaultValue="18:00" required />
            </label>
            <label className="space-y-1.5 text-sm font-medium">
              단위
              <select name="duration" defaultValue="60" className={selectClass}>
                <option value="30">30분</option>
                <option value="50">50분</option>
                <option value="60">60분</option>
                <option value="90">90분</option>
              </select>
            </label>
          </div>
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              닫기
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "등록 중" : "등록"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
