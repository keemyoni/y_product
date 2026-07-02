"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { createAdminMemberAction } from "@/app/actions";
import { Button, Input, Modal, Textarea } from "@/components/ui";
import type { LessonPackage, Trainer } from "@/lib/domain";
import { cn } from "@/lib/utils";

type MemberCreateButtonProps = {
  trainers: Trainer[];
  packages: LessonPackage[];
};

const selectClass =
  "flex h-11 w-full rounded-md border bg-background px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function MemberCreateButton({ trainers, packages }: MemberCreateButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const defaultTrainerId = trainers[0]?.id ?? "";
  const defaultPackageId = packages[0]?.id ?? "";

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" aria-hidden />
        회원 등록
      </Button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="회원 등록"
        description="회원 정보와 수업권을 등록하면 예약 링크가 자동으로 생성됩니다."
      >
        <form
          className="space-y-4"
          action={(formData) => {
            setMessage("");
            startTransition(async () => {
              const result = await createAdminMemberAction({
                name: String(formData.get("name") ?? ""),
                phone: String(formData.get("phone") ?? ""),
                trainerId: String(formData.get("trainerId") ?? ""),
                packageId: String(formData.get("packageId") ?? ""),
                memo: String(formData.get("memo") ?? "") || undefined
              });
              setMessage(result.message);
              if (result.ok) {
                setOpen(false);
                router.refresh();
              }
            });
          }}
        >
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium">
              회원명
              <Input name="name" placeholder="홍길동" required />
            </label>
            <label className="space-y-1.5 text-sm font-medium">
              연락처
              <Input name="phone" placeholder="010-0000-0000" required />
            </label>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium">
              담당 트레이너
              <select name="trainerId" defaultValue={defaultTrainerId} className={selectClass} required>
                {trainers.map((trainer) => (
                  <option key={trainer.id} value={trainer.id}>
                    {trainer.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 text-sm font-medium">
              수업권
              <select name="packageId" defaultValue={defaultPackageId} className={selectClass} required>
                {packages.map((lessonPackage) => (
                  <option key={lessonPackage.id} value={lessonPackage.id}>
                    {lessonPackage.name} · {lessonPackage.totalCount}회
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="space-y-1.5 text-sm font-medium">
            메모
            <Textarea name="memo" placeholder="선호 시간, 주의사항 등을 입력하세요." />
          </label>
          {message ? <p className={cn("text-sm", message.includes("했습니다") ? "text-success" : "text-destructive")}>{message}</p> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              닫기
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "등록 중" : "등록"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
