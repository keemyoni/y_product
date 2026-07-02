"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { Button, Toast, ToastProvider } from "@/components/ui";

export function ToastDemo() {
  const [open, setOpen] = useState(false);

  return (
    <ToastProvider>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Bell className="h-4 w-4" />
        토스트 미리보기
      </Button>
      <Toast
        open={open}
        onOpenChange={setOpen}
        title="예약 변경사항을 저장했습니다"
        description="회원에게 노출되는 화면은 다음 단계에서 실제 기능과 연결됩니다."
      />
    </ToastProvider>
  );
}
