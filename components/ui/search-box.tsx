import { Search } from "lucide-react";
import { Input, type InputProps } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function SearchBox({ className, ...props }: InputProps) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <Input className="pl-9" type="search" aria-label={props["aria-label"] ?? props.placeholder ?? "검색"} {...props} />
    </div>
  );
}
