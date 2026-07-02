"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus } from "lucide-react";
import { createAdminReservationAction } from "@/app/actions";
import { Button, Modal, Textarea } from "@/components/ui";
import { generateSlots, reservationEnd, type Member, type Reservation, type ScheduleSlot } from "@/lib/domain";
import { cn } from "@/lib/utils";

type ReservationCreateButtonProps = {
  members: Member[];
  scheduleSlots: ScheduleSlot[];
  reservations: Reservation[];
};

const selectClass =
  "flex h-11 w-full rounded-md border bg-background px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function ReservationCreateButton({ members, scheduleSlots, reservations }: ReservationCreateButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [memberId, setMemberId] = useState(members[0]?.id ?? "");
  const [date, setDate] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const selectedMember = members.find((member) => member.id === memberId);
  const dateOptions = useMemo(() => {
    if (!selectedMember) return [];
    return Array.from(new Set(scheduleSlots.filter((slot) => slot.trainerId === selectedMember.trainerId && slot.isAvailable).map((slot) => slot.date))).sort();
  }, [scheduleSlots, selectedMember]);
  const activeDate = date || dateOptions[0] || "";
  const timeOptions = useMemo(() => {
    if (!selectedMember || !activeDate) return [];
    const taken = new Set(
      reservations
        .filter((reservation) => reservation.trainerId === selectedMember.trainerId && reservation.date === activeDate && reservation.status === "booked")
        .map((reservation) => reservation.startTime)
    );

    return scheduleSlots
      .filter((slot) => slot.trainerId === selectedMember.trainerId && slot.date === activeDate && slot.isAvailable)
      .flatMap((slot) =>
        generateSlots(slot)
          .filter((time) => !taken.has(time))
          .map((time) => ({
            value: time,
            label: `${time} - ${reservationEnd(time, slot.duration)} · ${slot.room}`
          }))
      );
  }, [activeDate, reservations, scheduleSlots, selectedMember]);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <CalendarPlus className="h-4 w-4" aria-hidden />
        예약 추가
      </Button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="예약 추가"
        description="회원의 담당 트레이너 시간표에서 비어 있는 시간만 선택할 수 있습니다."
      >
        <form
          className="space-y-4"
          action={(formData) => {
            setMessage("");
            startTransition(async () => {
              const result = await createAdminReservationAction({
                memberId: String(formData.get("memberId") ?? ""),
                date: String(formData.get("date") ?? ""),
                time: String(formData.get("time") ?? ""),
                memo: String(formData.get("memo") ?? "") || undefined
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
            회원
            <select
              name="memberId"
              value={memberId}
              className={selectClass}
              onChange={(event) => {
                setMemberId(event.target.value);
                setDate("");
              }}
              required
            >
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} · 잔여 {member.remainingCount}회
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium">
              날짜
              <select name="date" value={activeDate} className={selectClass} onChange={(event) => setDate(event.target.value)} required>
                {dateOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 text-sm font-medium">
              시간
              <select name="time" className={selectClass} required>
                {timeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="space-y-1.5 text-sm font-medium">
            메모
            <Textarea name="memo" placeholder="관리자 메모를 입력하세요." />
          </label>
          {timeOptions.length === 0 ? <p className="text-sm text-destructive">선택 가능한 시간이 없습니다.</p> : null}
          {message ? <p className={cn("text-sm", message.includes("했습니다") ? "text-success" : "text-destructive")}>{message}</p> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              닫기
            </Button>
            <Button type="submit" disabled={isPending || timeOptions.length === 0}>
              {isPending ? "추가 중" : "예약 추가"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
