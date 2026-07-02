import { MessageSquare } from "lucide-react";
import { PageHeading } from "@/components/layout/page-heading";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, KpiCard, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Textarea } from "@/components/ui";
import { ReservationStatusBadge } from "@/components/domain/reservation-status-badge";
import { formatCurrency } from "@/lib/domain";
import { getMemberDetail } from "@/lib/server/view-models";
import { MemberLinkActions } from "../member-link-actions";

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { member, trainer, next, reservations } = await getMemberDetail(id);

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Member Detail"
        title={`${member.name} 회원 상세`}
        description="기본 정보, 수업권, 예약 내역, 메모와 예약 링크를 한 화면에 정리합니다."
        action={<MemberLinkActions memberId={member.id} token={member.memberToken} />}
      />
      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard label="남은 PT" value={`${member.remainingCount}회`} helper={`${member.completedCount}회 완료`} />
        <KpiCard label="수업권" value={member.packageName} helper={formatCurrency(member.paidAmount)} />
        <KpiCard label="다음 예약" value={next ? next.date.slice(5).replace("-", "/") : "-"} helper={next ? `${next.startTime} · ${next.room}` : "예정 없음"} tone="success" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader><CardTitle>회원 프로필</CardTitle><CardDescription>예약 링크 기반 회원 정보</CardDescription></CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">연락처</span><span>{member.phone}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">담당</span><span>{trainer}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">상태</span><Badge variant={member.status === "active" ? "success" : "destructive"}>{member.status === "active" ? "활성" : "비활성"}</Badge></div>
            <Textarea placeholder="회원 메모" defaultValue={member.memo} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>예약 내역</CardTitle><CardDescription>최근 예약과 완료 기록</CardDescription></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>날짜</TableHead><TableHead>시간</TableHead><TableHead>상태</TableHead><TableHead>메모</TableHead></TableRow></TableHeader>
              <TableBody>
                {reservations.map((item) => (
                  <TableRow key={`${item.date}-${item.time}`}>
                    <TableCell>{item.date}</TableCell><TableCell>{item.time}</TableCell><TableCell><ReservationStatusBadge status={item.statusKey} label={item.status} /></TableCell><TableCell className="text-muted-foreground"><MessageSquare className="mr-1 inline h-3.5 w-3.5" /> {item.memo}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
