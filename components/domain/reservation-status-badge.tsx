import type { ReservationStatus } from "@/lib/domain";
import { statusLabel } from "@/lib/domain";
import { Badge } from "@/components/ui";

const statusVariant: Record<ReservationStatus, "secondary" | "success" | "warning" | "destructive"> = {
  booked: "secondary",
  completed: "success",
  memberCanceled: "destructive",
  adminCanceled: "destructive",
  noShow: "warning"
};

export function ReservationStatusBadge({
  status,
  label
}: {
  status?: ReservationStatus;
  label?: string;
}) {
  const key = status ?? "booked";
  return <Badge variant={statusVariant[key]}>{label ?? statusLabel[key]}</Badge>;
}
