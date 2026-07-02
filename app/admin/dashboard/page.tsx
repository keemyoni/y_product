import { CalendarDays, Clock3, CreditCard, Users } from "lucide-react";
import { PageHeading } from "@/components/layout/page-heading";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, KpiCard, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui";
import { ReservationStatusBadge } from "@/components/domain/reservation-status-badge";
import { getAdminData } from "@/lib/server/view-models";

const icons = [CalendarDays, Users, Clock3, CreditCard];

export default async function DashboardPage() {
  const { kpis, reservations, scheduleSlots } = await getAdminData();

  return (
    <div className="space-y-8">
      <PageHeading
        eyebrow="Dashboard"
        title="오늘 운영 흐름을 한눈에 확인하세요"
        description="예약, 완료 수업, 빈 슬롯, 정산 흐름을 조용하고 빠르게 스캔할 수 있는 관리자 홈입니다."
        action={<Button>예약 추가</Button>}
      />
      <div className="grid gap-4 md:grid-cols-4">
        {kpis.map((kpi, index) => <KpiCard key={kpi.label} {...kpi} icon={icons[index]} />)}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>오늘 예약 타임라인</CardTitle>
            <CardDescription>수업 상태와 공간 배정을 함께 확인합니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow><TableHead>시간</TableHead><TableHead>회원</TableHead><TableHead>수업</TableHead><TableHead>상태</TableHead><TableHead>공간</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {reservations.filter((item) => item.status === "예약 완료").map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.time}</TableCell>
                    <TableCell>{item.member}</TableCell>
                    <TableCell>{item.type}</TableCell>
                    <TableCell><ReservationStatusBadge status={item.statusKey} label={item.status} /></TableCell>
                    <TableCell className="text-muted-foreground">{item.room}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>주간 슬롯 밀도</CardTitle>
            <CardDescription>요일별 예약 가능 시간을 빠르게 비교합니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {scheduleSlots.map((day) => (
              <div key={day.day} className="flex items-center gap-3">
                <span className="w-8 text-sm font-medium">{day.day}</span>
                <div className="flex flex-1 flex-wrap gap-2">
                  {day.slots.map((slot) => <span key={slot} className="rounded-sm bg-muted px-2.5 py-1 text-xs">{slot}</span>)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
