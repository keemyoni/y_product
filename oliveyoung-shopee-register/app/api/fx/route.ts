import { NextResponse } from "next/server";
import { MARKETS } from "@/lib/markets";

export async function GET() {
  try {
    const response = await fetch("https://open.er-api.com/v6/latest/KRW", {
      next: { revalidate: 3600 }
    });
    if (!response.ok) throw new Error("환율 조회 실패");
    const data = await response.json();

    const rates = Object.fromEntries(
      Object.entries(MARKETS).map(([code, market]) => [
        code,
        Number(data.rates?.[market.currency]) || market.fallbackFxPerKrw
      ])
    );

    return NextResponse.json({
      base: "KRW",
      rates,
      updatedAt: data.time_last_update_utc || new Date().toISOString(),
      source: "open.er-api.com"
    });
  } catch {
    return NextResponse.json({
      base: "KRW",
      rates: Object.fromEntries(
        Object.entries(MARKETS).map(([code, market]) => [code, market.fallbackFxPerKrw])
      ),
      updatedAt: null,
      source: "fallback"
    });
  }
}
