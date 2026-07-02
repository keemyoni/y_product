import { BarChart3, CalendarDays, CreditCard, Dumbbell, Link2, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "대시보드", icon: BarChart3, active: true },
  { label: "예약 캘린더", icon: CalendarDays },
  { label: "회원 관리", icon: Users },
  { label: "수업권", icon: Dumbbell },
  { label: "예약 링크", icon: Link2 },
  { label: "정산", icon: CreditCard }
];

export function Sidebar() {
  return (
    <aside className="hidden min-h-screen w-64 border-r bg-card/72 p-4 backdrop-blur-xl lg:block">
      <div className="mb-8 px-2">
        <div className="mb-3 h-8 w-8 rounded-md bg-primary" />
        <p className="text-sm font-semibold">Studio OS</p>
        <p className="text-xs text-muted-foreground">Premium scheduling SaaS</p>
      </div>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              className={cn(
                "flex h-10 w-full items-center gap-3 rounded-md px-3 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                item.active && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
