"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CalendarDays, CreditCard, Dumbbell, Link2, Settings, Users } from "lucide-react";
import { Header } from "@/components/layout/header";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/members", label: "회원관리", icon: Users },
  { href: "/admin/reservations", label: "예약관리", icon: CalendarDays },
  { href: "/admin/schedule", label: "시간표", icon: Link2 },
  { href: "/admin/packages", label: "수업권", icon: Dumbbell },
  { href: "/admin/settlement", label: "정산", icon: CreditCard },
  { href: "/admin/settings", label: "설정", icon: Settings }
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen">
      <div className="flex">
        <aside className="hidden min-h-screen w-64 border-r bg-card/80 p-4 backdrop-blur-xl lg:block" aria-label="관리자 사이드바">
          <div className="mb-8 px-2">
            <div className="mb-3 h-8 w-8 rounded-md bg-primary" />
            <p className="text-sm font-semibold">Studio OS</p>
            <p className="text-xs text-muted-foreground">PT · Pilates · Gym SaaS</p>
          </div>
          <nav className="space-y-1" aria-label="관리자 메뉴">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-10 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                    active && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="min-w-0 flex-1">
          <Header />
          <main id="main-content" className="mx-auto max-w-7xl px-5 pb-24 pt-8 md:px-8 lg:pb-8">{children}</main>
        </div>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/92 px-2 py-2 backdrop-blur-xl lg:hidden" aria-label="모바일 관리자 메뉴">
        <div className="grid grid-cols-7 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center gap-1 rounded-md px-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  active && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
                <span className="max-w-full truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
