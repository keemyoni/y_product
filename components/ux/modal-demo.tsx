"use client";

import { useState } from "react";
import { Button, Modal } from "@/components/ui";

export function ModalDemo() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>모달 애니메이션</Button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="회원 예약 링크 재발급"
        description="실제 기능 연결 전, 모달의 등장/닫힘 감각과 포커스 흐름을 확인합니다."
      >
        <div className="space-y-4 text-sm text-muted-foreground">
          <p>새 링크를 발급하면 기존 링크는 즉시 사용할 수 없게 됩니다.</p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>취소</Button>
            <Button onClick={() => setOpen(false)}>확인</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
