import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type KpiCardProps = {
  label: string;
  value: string;
  helper?: string;
  icon?: LucideIcon;
  tone?: "default" | "success" | "warning";
};

export function KpiCard({ label, value, helper, icon: Icon = ArrowUpRight, tone = "default" }: KpiCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <strong className="mt-2 block text-3xl font-semibold">{value}</strong>
          </div>
          <div className={cn("rounded-md bg-muted p-2 text-muted-foreground", tone === "success" && "bg-success/10 text-success", tone === "warning" && "bg-warning/10 text-amber-700")}>
            <Icon className="h-5 w-5" aria-hidden />
          </div>
        </div>
        {helper ? <p className="mt-4 text-sm text-muted-foreground">{helper}</p> : null}
      </CardContent>
    </Card>
  );
}
