import { Filter } from "lucide-react";
import { PageHeading } from "@/components/layout/page-heading";
import { Badge, Button, Card, CardContent, Dropdown, SearchBox, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui";
import { ReservationStatusBadge } from "@/components/domain/reservation-status-badge";
import { getAdminData } from "@/lib/server/view-models";
import { ReservationCreateButton } from "./reservation-create-button";
import { ReservationStatusControl } from "./reservation-status-control";

export default async function ReservationsPage() {
  const { reservations, raw } = await getAdminData();

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Reservations"
        title="예약 흐름을 상태별로 관리합니다"
        description="수업 완료, 노쇼, 취소, 시간 변경이 필요한 예약을 생산성 중심으로 정리합니다."
        action={<ReservationCreateButton members={raw.members} scheduleSlots={raw.scheduleSlots} reservations={raw.reservations} />}
      />
      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_auto_auto]">
          <SearchBox placeholder="회원명 또는 시간 검색" />
          <Dropdown label="상태" items={[{ label: "전체", value: "all", checked: true }, { label: "예약 완료", value: "booked" }, { label: "수업 완료", value: "done" }]} />
          <Button variant="outline"><Filter className="h-4 w-4" /> 고급 필터</Button>
        </CardContent>
      </Card>
      <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
        <Card>
          <CardContent className="space-y-3 p-5">
            {["09:00", "10:00", "11:00", "14:00", "18:00", "20:00"].map((time, index) => (
              <div key={time} className="flex items-center justify-between rounded-md border bg-background p-3">
                <span className="font-medium">{time}</span>
                <Badge variant={index % 3 === 0 ? "success" : "secondary"}>{index % 3 === 0 ? "예약됨" : "가능"}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <Table>
          <TableHeader><TableRow><TableHead>시간</TableHead><TableHead>회원</TableHead><TableHead>수업</TableHead><TableHead>상태</TableHead><TableHead>공간</TableHead><TableHead>관리</TableHead></TableRow></TableHeader>
          <TableBody>
            {reservations.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.time}</TableCell>
                <TableCell>{item.member}</TableCell>
                <TableCell>{item.type}</TableCell>
                <TableCell><ReservationStatusBadge status={item.statusKey} label={item.status} /></TableCell>
                <TableCell>{item.room}</TableCell>
                <TableCell><ReservationStatusControl reservationId={item.id} status={item.statusKey} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
