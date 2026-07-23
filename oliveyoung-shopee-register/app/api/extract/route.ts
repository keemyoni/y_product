import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { z } from "zod";

const Input = z.object({
  url: z.string().url().refine(
    (value) => new URL(value).hostname.endsWith("oliveyoung.co.kr"),
    "올리브영 도메인 URL만 입력할 수 있습니다."
  )
});

function numberFrom(text?: string) {
  if (!text) return undefined;
  const value = Number(text.replace(/[^\d]/g, ""));
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

export async function POST(request: Request) {
  try {
    const { url } = Input.parse(await request.json());
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ListingPreparationTool/1.0)",
        "Accept-Language": "ko-KR,ko;q=0.9"
      },
      redirect: "follow",
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`페이지 조회 실패: HTTP ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const warnings: string[] = [];

    const jsonLd: any[] = [];
    $('script[type="application/ld+json"]').each((_, element) => {
      try {
        const parsed = JSON.parse($(element).text());
        jsonLd.push(...(Array.isArray(parsed) ? parsed : [parsed]));
      } catch {}
    });
    const product = jsonLd.find((x) => x?.["@type"] === "Product") ?? {};

    const name =
      product.name ||
      $('meta[property="og:title"]').attr("content") ||
      $("title").text().trim();

    const brand =
      product.brand?.name ||
      product.brand ||
      $('meta[property="product:brand"]').attr("content") ||
      "";

    const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers;
    const priceKrw =
      numberFrom(String(offer?.price ?? "")) ||
      numberFrom($('meta[property="product:price:amount"]').attr("content")) ||
      numberFrom($('[class*="price"]').first().text());

    const description =
      product.description ||
      $('meta[property="og:description"]').attr("content") ||
      $('meta[name="description"]').attr("content") ||
      "";

    const imageUrls = unique([
      ...(Array.isArray(product.image) ? product.image : [product.image].filter(Boolean)),
      $('meta[property="og:image"]').attr("content") || ""
    ]);

    if (!name) warnings.push("상품명을 자동 확인하지 못했습니다.");
    if (!priceKrw) warnings.push("현재 판매가를 자동 확인하지 못했습니다.");
    if (!brand) warnings.push("브랜드를 자동 확인하지 못했습니다.");
    if (!imageUrls.length) warnings.push("이미지를 자동 확인하지 못했습니다.");
    warnings.push("자동 추출 결과는 상품 페이지와 영수증을 대조해 최종 확인하세요.");

    return NextResponse.json({
      url,
      name: name?.replace(/\s+/g, " ").trim() || "",
      brand: String(brand).trim(),
      priceKrw: priceKrw ?? 0,
      description: String(description).replace(/\s+/g, " ").trim(),
      imageUrls,
      extractionWarnings: warnings
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류";
    return NextResponse.json({
      error: message,
      fallbackRequired: true
    }, { status: 400 });
  }
}
