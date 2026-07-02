import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";

const shortcuts = [
  ["Tab", "다음 인터랙션 요소로 이동"],
  ["Shift + Tab", "이전 요소로 이동"],
  ["Enter", "선택 또는 실행"],
  ["Esc", "모달 또는 메뉴 닫기"],
  ["⌘ K", "빠른 검색 예정"]
];

export function KeyboardShortcuts() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Keyboard Navigation</CardTitle>
        <CardDescription>관리자 생산성을 위한 기본 키보드 흐름입니다.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {shortcuts.map(([key, label]) => (
          <div key={key} className="flex items-center justify-between rounded-md border bg-background p-3 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <kbd className="rounded-sm border bg-muted px-2 py-1 text-xs font-semibold">{key}</kbd>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
