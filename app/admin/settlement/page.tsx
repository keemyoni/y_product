import dynamic from "next/dynamic";
import { CreditCard, Download } from "lucide-react";
import { PageHeading } from "@/components/layout/page-heading";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, KpiCard, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui";
import { getAdminData } from "@/lib/server/view-models";

const RevenueChart = dynamic(() => import("./revenue-chart").then((mod) => mod.RevenueChart), {
  loading: () => <div className="h-72 animate-pulse rounded-md bg-muted" />
});

export default async function SettlementPage() {
  const { settlementRows, kpis } = await getAdminData();
  const completed = kpis[1];
  const settlement = kpis[3];
  const noShow = settlementRows[0]?.noShow ?? 0;

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Settlement"
        title="완료 수업 기준 정산을 예측합니다"
        description="월별 완료 수업, 노쇼, 예상 정산 금액을 시각적으로 확인합니다."
        action={<Button variant="outline"><Download className="h-4 w-4" /> 다운로드</Button>}
      />
      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard label="이번 달 완료" value={completed.value} helper={completed.helper} icon={CreditCard} />
        <KpiCard label="예상 정산" value={settlement.value} helper={settlement.helper} tone="success" />
        <KpiCard label="노쇼" value={String(noShow)} helper="노쇼 처리 기준" tone="warning" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader><CardTitle>월별 정산 추이</CardTitle><CardDescription>Recharts 기반 UI 자리</CardDescription></CardHeader>
          <CardContent><RevenueChart /></CardContent>
        </Card>
        <Table>
          <TableHeader><TableRow><TableHead>월</TableHead><TableHead>완료</TableHead><TableHead>정산</TableHead><TableHead>노쇼</TableHead></TableRow></TableHeader>
          <TableBody>
            {settlementRows.map((row) => (
              <TableRow key={row.month}>
                <TableCell className="font-medium">{row.month}</TableCell>
                <TableCell>{row.completed}</TableCell>
                <TableCell>{row.amount}</TableCell>
                <TableCell><Badge variant="warning">{row.noShow}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
