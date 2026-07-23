import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url).searchParams.get("url");
    if (!url) throw new Error("이미지 URL이 없습니다.");
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("허용되지 않은 URL입니다.");
    const response = await fetch(parsed.toString(), {
      headers: { "User-Agent": "Mozilla/5.0", Accept: "image/*" },
      cache: "no-store"
    });
    if (!response.ok) throw new Error(`이미지 조회 실패: ${response.status}`);
    const contentType = response.headers.get("content-type") || "image/jpeg";
    if (!contentType.startsWith("image/")) throw new Error("이미지 형식이 아닙니다.");
    return new NextResponse(await response.arrayBuffer(), {
      headers: { "Content-Type": contentType, "Cache-Control": "private, max-age=300" }
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "이미지 오류" }, { status: 400 });
  }
}
