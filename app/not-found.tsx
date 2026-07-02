import Link from "next/link";
import { Button, EmptyState } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <EmptyState
        title="페이지를 찾을 수 없습니다"
        description="주소가 바뀌었거나 접근할 수 없는 화면입니다."
        action={
          <Button asChild>
            <Link href="/admin/dashboard">Dashboard로 이동</Link>
          </Button>
        }
      />
    </main>
  );
}
