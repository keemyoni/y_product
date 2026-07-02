"use client";

import { Button, EmptyState } from "@/components/ui";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <EmptyState
      title="관리자 데이터를 불러오지 못했습니다"
      description="네트워크나 저장소 상태를 확인한 뒤 다시 시도해주세요."
      action={<Button onClick={reset}>다시 불러오기</Button>}
    />
  );
}
