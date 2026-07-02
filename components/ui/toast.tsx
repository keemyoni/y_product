"use client";

import * as ToastPrimitive from "@radix-ui/react-toast";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ToastProvider({ children }: { children: ReactNode }) {
  return <ToastPrimitive.Provider swipeDirection="right">{children}</ToastPrimitive.Provider>;
}

export function Toast({
  title,
  description,
  open,
  onOpenChange
}: {
  title: string;
  description?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <>
      <ToastPrimitive.Root
        open={open}
        onOpenChange={onOpenChange}
        className={cn("rounded-md border bg-card p-4 text-card-foreground shadow-lift data-[state=open]:animate-in data-[state=closed]:animate-out")}
      >
        <ToastPrimitive.Title className="text-sm font-semibold">{title}</ToastPrimitive.Title>
        {description ? <ToastPrimitive.Description className="mt-1 text-sm text-muted-foreground">{description}</ToastPrimitive.Description> : null}
      </ToastPrimitive.Root>
      <ToastPrimitive.Viewport className="fixed bottom-5 right-5 z-50 flex w-[min(92vw,360px)] flex-col gap-2" />
    </>
  );
}
