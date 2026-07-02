"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DropdownProps = {
  label: string;
  items: Array<{ label: string; value: string; checked?: boolean }>;
  onSelect?: (value: string) => void;
};

export function Dropdown({ label, items, onSelect }: DropdownProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button variant="outline" className="justify-between">
          {label}
          <ChevronDown className="h-4 w-4" aria-hidden />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="end" className="z-50 min-w-44 rounded-md border bg-popover p-1 text-popover-foreground shadow-lift">
        {items.map((item) => (
          <DropdownMenu.Item
            key={item.value}
            onSelect={() => onSelect?.(item.value)}
            className={cn("flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm outline-none hover:bg-muted")}
          >
            <Check className={cn("h-4 w-4", !item.checked && "opacity-0")} aria-hidden />
            {item.label}
          </DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
