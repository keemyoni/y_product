import { Plus } from "lucide-react";
import { PageHeading } from "@/components/layout/page-heading";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { getAdminData } from "@/lib/server/view-models";

export default async function PackagesPage() {
  const { packages } = await getAdminData();

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Packages"
        title="수업권 상품과 잔여 횟수를 관리합니다"
        description="가격, 횟수, 활성 회원 수를 기준으로 수업권 운영 상태를 파악합니다."
        action={<Button><Plus className="h-4 w-4" /> 수업권 추가</Button>}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {packages.map((item) => (
          <Card key={item.name}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{item.name}</CardTitle>
                <Badge variant="secondary">{item.count}</Badge>
              </div>
              <CardDescription>{item.active}명 사용 중</CardDescription>
            </CardHeader>
            <CardContent>
              <strong className="text-3xl font-semibold">{item.price}</strong>
              <div className="mt-5 flex gap-2">
                <Button variant="outline" className="flex-1">수정</Button>
                <Button variant="secondary" className="flex-1">복제</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
