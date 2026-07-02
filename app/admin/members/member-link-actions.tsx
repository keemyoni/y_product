"use client";

import { useState, useTransition } from "react";
import { Link2, RotateCw } from "lucide-react";
import { renewMemberLinkAction } from "@/app/actions";
import { Button } from "@/components/ui";

export function MemberLinkActions({ memberId, token }: { memberId: string; token: string }) {
  const [currentToken, setCurrentToken] = useState(token);
  const [isPending, startTransition] = useTransition();

  const copyLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/booking/${currentToken}`);
  };

  const renew = () => {
    startTransition(async () => {
      const result = await renewMemberLinkAction(memberId);
      if (result.ok && result.token) setCurrentToken(result.token);
    });
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={copyLink} aria-label="예약 링크 복사">
        <Link2 className="h-3.5 w-3.5" />
        복사
      </Button>
      <Button variant="secondary" size="sm" onClick={renew} disabled={isPending} aria-busy={isPending} aria-label="예약 링크 재발급">
        <RotateCw className="h-3.5 w-3.5" />
        재발급
      </Button>
    </div>
  );
}
