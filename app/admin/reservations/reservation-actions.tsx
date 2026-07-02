"use client";

import { useTransition } from "react";
import { cancelAdminReservationAction, completeReservationAction, noShowReservationAction } from "@/app/actions";
import { Button } from "@/components/ui";

export function ReservationActions({ reservationId, disabled }: { reservationId: string; disabled?: boolean }) {
  const [isPending, startTransition] = useTransition();

  const run = (action: "complete" | "noshow" | "cancel") => {
    startTransition(async () => {
      if (action === "complete") await completeReservationAction(reservationId);
      if (action === "noshow") await noShowReservationAction(reservationId);
      if (action === "cancel") await cancelAdminReservationAction(reservationId);
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" size="sm" aria-busy={isPending} disabled={disabled || isPending} onClick={() => run("complete")}>완료</Button>
      <Button variant="outline" size="sm" aria-busy={isPending} disabled={disabled || isPending} onClick={() => run("noshow")}>노쇼</Button>
      <Button variant="destructive" size="sm" aria-busy={isPending} disabled={disabled || isPending} onClick={() => run("cancel")}>취소</Button>
    </div>
  );
}
