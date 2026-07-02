"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Edit3, Plus } from "lucide-react";
import { upsertTrainerAction } from "@/app/actions";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Modal, Textarea } from "@/components/ui";
import type { Trainer } from "@/lib/domain";

type TrainerManagementProps = {
  trainers: Trainer[];
};

export function TrainerManagement({ trainers }: TrainerManagementProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const openCreate = () => {
    setEditingTrainer(null);
    setMessage("");
    setOpen(true);
  };

  const openEdit = (trainer: Trainer) => {
    setEditingTrainer(trainer);
    setMessage("");
    setOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>트레이너 관리</CardTitle>
              <CardDescription>회원 배정과 시간표 등록에 사용할 트레이너를 관리합니다.</CardDescription>
            </div>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" aria-hidden />
              등록
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {trainers.map((trainer) => (
            <div key={trainer.id} className="flex items-center justify-between gap-3 rounded-md border bg-background p-4">
              <div>
                <p className="font-medium">{trainer.name}</p>
                <p className="text-sm text-muted-foreground">{trainer.phone || "연락처 없음"}</p>
                {trainer.memo ? <p className="mt-1 text-xs text-muted-foreground">{trainer.memo}</p> : null}
              </div>
              <Button variant="outline" size="sm" onClick={() => openEdit(trainer)}>
                <Edit3 className="h-4 w-4" aria-hidden />
                수정
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title={editingTrainer ? "트레이너 수정" : "트레이너 등록"}
        description="트레이너 정보는 회원 등록, 예약 추가, 시간표 관리에서 공통으로 사용됩니다."
      >
        <form
          className="space-y-4"
          action={(formData) => {
            setMessage("");
            startTransition(async () => {
              const result = await upsertTrainerAction({
                trainerId: editingTrainer?.id,
                name: String(formData.get("name") ?? ""),
                phone: String(formData.get("phone") ?? "") || undefined,
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
              이름
              <Input name="name" defaultValue={editingTrainer?.name ?? ""} placeholder="트레이너명" required />
            </label>
            <label className="space-y-1.5 text-sm font-medium">
              연락처
              <Input name="phone" defaultValue={editingTrainer?.phone ?? ""} placeholder="010-0000-0000" />
            </label>
          </div>
          <label className="space-y-1.5 text-sm font-medium">
            메모
            <Textarea name="memo" defaultValue={editingTrainer?.memo ?? ""} placeholder="전문 분야, 근무 메모 등을 입력하세요." />
          </label>
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              닫기
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "저장 중" : "저장"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
