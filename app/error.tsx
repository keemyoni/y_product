"use client";

import { Button, EmptyState } from "@/components/ui";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <EmptyState
        title="화면을 불러오지 못했습니다"
        description="잠시 후 다시 시도해주세요. 문제가 계속되면 관리자에게 문의해주세요."
        action={<Button onClick={reset}>다시 시도</Button>}
      />
    </main>
  );
}
