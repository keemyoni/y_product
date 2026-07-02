"use client";

import { useMemo, useState, useTransition } from "react";
import { CalendarCheck, CheckCircle2, Clock3, MapPin } from "lucide-react";
import { cancelMemberReservationAction, createMemberReservationAction } from "@/app/actions";
import { ReservationStatusBadge } from "@/components/domain/reservation-status-badge";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Textarea } from "@/components/ui";
import { BookingSuccessAnimation } from "@/components/ux/booking-success-animation";
import { Stagger, StaggerItem } from "@/components/ux/page-transition";
import type { getMemberBooking } from "@/lib/server/view-models";

type BookingView = NonNullable<Awaited<ReturnType<typeof getMemberBooking>>>;

export function BookingClient({ view }: { view: BookingView }) {
  const [selectedDate, setSelectedDate] = useState(view.selectedDate);
  const [selectedTime, setSelectedTime] = useState(view.dates.find((date) => date.raw === view.selectedDate)?.slots[0]?.time ?? "");
  const [memo, setMemo] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const selectedDateView = useMemo(() => view.dates.find((date) => date.raw === selectedDate) ?? view.dates[0], [selectedDate, view.dates]);
  const selectedSlot = selectedDateView?.slots.find((slot) => slot.time === selectedTime);

  const reserve = () => {
    if (!selectedDate || !selectedTime) return;
    startTransition(async () => {
      const result = await createMemberReservationAction({
        memberToken: view.token,
        date: selectedDate,
        time: selectedTime,
        memo
      });
      setMessage(result.message);
    });
  };

  const cancel = (reservationId: string) => {
    startTransition(async () => {
      const result = await cancelMemberReservationAction({ memberToken: view.token, reservationId });
      setMessage(result.message);
    });
  };

  return (
    <main id="main-content" className="min-h-screen px-4 py-6 md:py-10">
      <Stagger className="mx-auto max-w-md space-y-5">
        <StaggerItem>
          <section className="rounded-[1.25rem] border bg-card p-6 shadow-soft">
            <Badge variant="outline">Private Booking Link</Badge>
            <h1 className="mt-5 text-3xl font-semibold">안녕하세요, {view.member.name}님</h1>
            <p className="mt-3 leading-7 text-muted-foreground">예약할 날짜와 시간을 선택해주세요. 로그인 없이 이 링크에서 바로 예약할 수 있습니다.</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-md bg-muted p-4">
                <p className="text-xs text-muted-foreground">남은 PT</p>
                <strong className="mt-1 block text-2xl">{view.member.remainingCount}회</strong>
              </div>
              <div className="rounded-md bg-muted p-4">
                <p className="text-xs text-muted-foreground">다음 예약</p>
                <strong className="mt-1 block text-sm leading-6">{view.next}</strong>
              </div>
            </div>
            {message ? <p className="mt-4 rounded-md bg-muted p-3 text-sm text-muted-foreground" role="status" aria-live="polite">{message}</p> : null}
          </section>
        </StaggerItem>

        <StaggerItem>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CalendarCheck className="h-5 w-5" /> 날짜 선택</CardTitle>
              <CardDescription>예약 가능한 날짜만 표시됩니다.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {view.dates.map((date) => (
                <button
                  key={date.raw}
                  type="button"
                  aria-pressed={date.raw === selectedDate}
                  onClick={() => {
                    setSelectedDate(date.raw);
                    setSelectedTime(date.slots[0]?.time ?? "");
                  }}
                  className={`rounded-md border p-3 text-left text-sm transition-colors ${date.raw === selectedDate ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
                >
                  <span className="font-medium">{date.label}</span>
                  <span className="mt-1 block text-xs opacity-75">{date.raw === selectedDate ? "선택됨" : `${date.slots.length}개 가능`}</span>
                </button>
              ))}
            </CardContent>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Clock3 className="h-5 w-5" /> 시간 선택</CardTitle>
              <CardDescription>이미 예약된 시간은 제외된 상태입니다.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-2">
              {(selectedDateView?.slots ?? []).map((slot) => (
                <button
                  key={slot.time}
                  type="button"
                  aria-pressed={slot.time === selectedTime}
                  onClick={() => setSelectedTime(slot.time)}
                  className={`h-12 rounded-md border text-sm font-medium transition-colors ${slot.time === selectedTime ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
                >
                  {slot.time}
                </button>
              ))}
              <Textarea className="col-span-3 mt-2" placeholder="요청 메모를 남겨주세요. 선택 입력" aria-label="예약 요청 메모" value={memo} onChange={(event) => setMemo(event.target.value)} />
              <Button className="col-span-3 mt-2" disabled={!selectedSlot || isPending} aria-busy={isPending} onClick={reserve}>예약 완료</Button>
            </CardContent>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card className="border-success/30 bg-success/5">
            <CardHeader>
              <div className="mb-2"><BookingSuccessAnimation /></div>
              <CardTitle className="flex items-center gap-2 text-success"><CheckCircle2 className="h-5 w-5" /> 예약 완료</CardTitle>
              <CardDescription>선택한 예약 정보가 이 영역에 반영됩니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">예약일</span><strong>{selectedDateView?.label ?? "-"}</strong></div>
              <div className="flex justify-between"><span className="text-muted-foreground">시간</span><strong>{selectedTime || "-"}</strong></div>
              <div className="flex justify-between"><span className="text-muted-foreground">담당</span><strong>{view.trainer}</strong></div>
              <div className="flex items-start gap-2 rounded-md bg-background p-3 text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4" /> 수업 횟수는 예약 시점이 아니라 수업 완료 처리 시 차감됩니다.
              </div>
            </CardContent>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card>
            <CardHeader>
              <CardTitle>예약 내역</CardTitle>
              <CardDescription>본인 예약과 완료 내역만 표시됩니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {view.history.map((item) => (
                <div key={`${item.date}-${item.time}-${item.id}`} className="flex items-center justify-between rounded-md border bg-background p-3">
                  <div>
                    <p className="font-medium">{item.date} · {item.time}</p>
                    <p className="text-xs text-muted-foreground">Studio Balance</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ReservationStatusBadge status={item.statusKey} label={item.status} />
                    {item.status === "예약 완료" ? <Button variant="outline" size="sm" disabled={isPending} aria-busy={isPending} onClick={() => cancel(item.id)}>취소</Button> : null}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </StaggerItem>
      </Stagger>
    </main>
  );
}
