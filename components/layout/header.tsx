import { Bell, Command, Settings } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SearchBox } from "@/components/ui/search-box";

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/82 px-6 backdrop-blur-xl">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">PT Booking</p>
        <h1 className="text-base font-semibold">운영 콘솔</h1>
      </div>
      <SearchBox className="hidden w-full max-w-md md:block" placeholder="회원, 예약, 시간표 검색" aria-label="전체 검색" />
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" aria-label="명령어">
          <Command className="h-4 w-4" aria-hidden />
        </Button>
        <Button variant="ghost" size="icon" aria-label="알림">
          <Bell className="h-4 w-4" aria-hidden />
        </Button>
        <Button variant="ghost" size="icon" aria-label="설정">
          <Settings className="h-4 w-4" aria-hidden />
        </Button>
        <Avatar>
          <AvatarFallback>PT</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
