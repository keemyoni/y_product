import { ShieldCheck } from "lucide-react";
import { PageHeading } from "@/components/layout/page-heading";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Textarea } from "@/components/ui";
import { KeyboardShortcuts } from "@/components/ux/keyboard-shortcuts";
import { ModalDemo } from "@/components/ux/modal-demo";
import { ToastDemo } from "@/components/ux/toast-demo";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Settings"
        title="운영 정책과 스튜디오 정보를 설정합니다"
        description="예약 취소 정책, 링크 보안, 기본 안내 문구를 관리하는 UI입니다."
        action={<><ToastDemo /><ModalDemo /><Button>변경사항 저장</Button></>}
      />
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader><CardTitle>스튜디오 정보</CardTitle><CardDescription>회원 예약 화면에 노출되는 기본 정보</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <Input defaultValue="Studio Balance" />
            <Input defaultValue="서울 강남구 테헤란로 100" />
            <Textarea defaultValue="예약 변경은 수업 12시간 전까지 가능합니다." />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>보안 및 예약 정책</CardTitle><CardDescription>상용 서비스 운영을 위한 정책 UI</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            {["회원별 랜덤 예약 링크 사용", "링크 재발급 시 기존 링크 무효화", "수업 12시간 전까지 회원 취소 가능", "관리자 활동 로그 기록"].map((item) => (
              <div key={item} className="flex items-center justify-between rounded-md border bg-background p-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-success" />
                  <span className="text-sm font-medium">{item}</span>
                </div>
                <Badge variant="success">ON</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <KeyboardShortcuts />
    </div>
  );
}
