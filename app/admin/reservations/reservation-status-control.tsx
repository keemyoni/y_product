"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateReservationStatusAction } from "@/app/actions";
import { statusLabel, type ReservationStatus } from "@/lib/domain";

const selectClass =
  "h-9 rounded-md border bg-background px-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

const statuses = Object.entries(statusLabel) as Array<[ReservationStatus, string]>;

export function ReservationStatusControl({
  reservationId,
  status
}: {
  reservationId: string;
  status: ReservationStatus;
}) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState<ReservationStatus>(status);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-1">
      <select
        className={selectClass}
        value={currentStatus}
        disabled={isPending}
        aria-label="예약 상태 변경"
        onChange={(event) => {
          const nextStatus = event.target.value as ReservationStatus;
          const previousStatus = currentStatus;
          setCurrentStatus(nextStatus);
          setMessage("");
          startTransition(async () => {
            const result = await updateReservationStatusAction({ reservationId, status: nextStatus });
            setMessage(result.message);
            if (result.ok) {
              router.refresh();
            } else {
              setCurrentStatus(previousStatus);
            }
          });
        }}
      >
        {statuses.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      {message ? <p className="max-w-36 text-xs text-muted-foreground">{message}</p> : null}
    </div>
  );
}
