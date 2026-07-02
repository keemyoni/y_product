import { Calendar } from "@/components/ui/calendar";
import { PageHeading } from "@/components/layout/page-heading";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { getAdminData } from "@/lib/server/view-models";
import { ScheduleManagement } from "./schedule-management";

export default async function SchedulePage() {
  const { raw, scheduleSlots } = await getAdminData();
  const events = raw.reservations
    .filter((reservation) => reservation.status === "booked")
    .map((reservation) => ({
      title: raw.members.find((member) => member.id === reservation.memberId)?.name ?? "예약",
      start: `${reservation.date}T${reservation.startTime}:00`,
      end: `${reservation.date}T${reservation.endTime}:00`
    }));

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Schedule"
        title="예약 가능한 시간을 정교하게 설계합니다"
        description="시간표 등록은 트레이너의 예약 가능 구간을 만들고, 각 타임은 운영 상황에 따라 열거나 막을 수 있습니다."
      />
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Calendar events={events} />
        <Card>
          <CardHeader><CardTitle>등록된 시간표 요약</CardTitle><CardDescription>현재 등록된 트레이너별 예약 가능 구간입니다.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            {scheduleSlots.map((day) => (
              <div key={day.day} className="rounded-md border bg-background p-4">
                <div className="mb-3 flex items-center justify-between">
                  <strong>{day.day}요일</strong>
                  <Badge variant="outline">{day.slots.length} slots</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {day.slots.map((slot) => <span key={slot} className="rounded-sm bg-muted px-2.5 py-1 text-xs">{slot}</span>)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <ScheduleManagement
        trainers={raw.trainers}
        scheduleSlots={raw.scheduleSlots}
        scheduleBlocks={raw.scheduleBlocks}
        reservations={raw.reservations}
      />
    </div>
  );
}
