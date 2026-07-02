import Link from "next/link";
import { PageHeading } from "@/components/layout/page-heading";
import { Badge, Button, Card, CardContent, SearchBox, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui";
import { getAdminData } from "@/lib/server/view-models";
import { MemberCreateButton } from "./member-create-button";
import { MemberLinkActions } from "./member-link-actions";

export default async function MembersPage() {
  const { members, raw } = await getAdminData();

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Members"
        title="회원 상태와 예약 링크를 빠르게 관리합니다"
        description="남은 횟수, 다음 예약, 담당 트레이너, 수업권 상태를 한 화면에서 스캔합니다."
        action={<MemberCreateButton trainers={raw.trainers} packages={raw.lessonPackages} />}
      />
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row">
          <SearchBox placeholder="회원명, 연락처 검색" className="md:max-w-sm" />
          <Button variant="outline">담당 트레이너</Button>
          <Button variant="outline">잔여 0회</Button>
        </CardContent>
      </Card>
      <Table>
        <TableHeader>
          <TableRow><TableHead>회원</TableHead><TableHead>연락처</TableHead><TableHead>수업권</TableHead><TableHead>잔여</TableHead><TableHead>다음 예약</TableHead><TableHead>상태</TableHead><TableHead>링크</TableHead></TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id}>
              <TableCell><Link className="font-medium hover:underline" href={`/admin/members/${member.id}`}>{member.name}</Link><p className="text-xs text-muted-foreground">{member.trainer}</p></TableCell>
              <TableCell>{member.phone}</TableCell>
              <TableCell>{member.packageName}</TableCell>
              <TableCell>{member.remaining}/{member.total}</TableCell>
              <TableCell>{member.next}</TableCell>
              <TableCell><Badge variant={member.status === "활성" ? "success" : "warning"}>{member.status}</Badge></TableCell>
              <TableCell><MemberLinkActions memberId={member.id} token={member.token} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
