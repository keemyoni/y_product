import { Calendar } from "@/components/ui/calendar";
import { PageHeading } from "@/components/layout/page-heading";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { DraggableSlotBoard } from "@/components/ux/draggable-slot-board";
import { getAdminData } from "@/lib/server/view-models";

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
        description="요일별 반복 시간표와 예약 불가 시간을 캘린더 중심으로 관리하는 화면입니다."
        action={<Button>시간표 등록</Button>}
      />
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Calendar events={events} />
        <Card>
          <CardHeader><CardTitle>반복 시간표</CardTitle><CardDescription>Mock Data 기반 미리보기</CardDescription></CardHeader>
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
      <DraggableSlotBoard />
    </div>
  );
}
