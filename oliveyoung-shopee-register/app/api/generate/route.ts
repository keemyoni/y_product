import OpenAI from "openai";
import { NextResponse } from "next/server";
import { z } from "zod";

const Body = z.object({
  product: z.object({
    name: z.string().min(2),
    brand: z.string().default(""),
    description: z.string().default(""),
    capacity: z.string().optional(),
    weightKg: z.number().optional()
  }),
  market: z.string(),
  language: z.string()
});

function fallbackCategory(name: string, description: string) {
  const text = `${name} ${description}`.toLowerCase();
  if (/sunscreen|sun cream|선크림|선스틱|spf/.test(text)) return "Beauty & Personal Care > Skincare > Sunscreen";
  if (/mask|마스크팩|sheet/.test(text)) return "Beauty & Personal Care > Skincare > Facial Masks";
  if (/cleanser|cleansing|클렌징|폼/.test(text)) return "Beauty & Personal Care > Skincare > Facial Cleanser";
  if (/serum|ampoule|essence|세럼|앰플|에센스/.test(text)) return "Beauty & Personal Care > Skincare > Serum & Essence";
  if (/cream|lotion|moistur|크림|로션/.test(text)) return "Beauty & Personal Care > Skincare > Moisturizer";
  if (/lip|틴트|립/.test(text)) return "Beauty & Personal Care > Makeup > Lips";
  if (/shampoo|샴푸/.test(text)) return "Beauty & Personal Care > Hair Care > Shampoo";
  return "Beauty & Personal Care > Skincare > Others";
}

export async function POST(request: Request) {
  try {
    const body = Body.parse(await request.json());
    const apiKey = process.env.OPENAI_API_KEY;
    const fallback = {
      title: `${body.product.brand} ${body.product.name}`.trim().slice(0, 100),
      description: `${body.product.name}

Product information
${body.product.description}

Capacity: ${body.product.capacity || "Please check product package"}
Country of origin: South Korea
Condition: New

Please check ingredients, directions and cautions shown on the genuine package before use.`,
      keywords: [body.product.brand, body.product.name, "Korean beauty"].filter(Boolean),
      attributes: {
        categoryName: fallbackCategory(body.product.name, body.product.description),
        manufacturer: body.product.brand || "To be confirmed",
        countryOfOrigin: "South Korea",
        condition: "New",
        shelfLifeMonths: 24,
        dangerousGoods: "No",
        preOrder: "No",
        daysToShip: 3,
        shippingChannel: "Shopee Supported Logistics",
        optionName: body.product.capacity ? "Size" : "Option",
        optionValue: body.product.capacity || "Default"
      }
    };

    if (!apiKey) return NextResponse.json(fallback);

    const client = new OpenAI({ apiKey });
    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "Create factual Shopee cosmetics listing drafts and conservative editable attribute estimates. Never invent ingredients, certifications, efficacy, medical claims, reviews, rankings, authenticity guarantees, before/after results or package contents. Return JSON: title, description, keywords, attributes. attributes must contain categoryName, manufacturer, countryOfOrigin, condition, shelfLifeMonths, dangerousGoods, preOrder, daysToShip, shippingChannel, optionName, optionValue. Use categoryId only if certain; otherwise omit it."
        },
        {
          role: "user",
          content: JSON.stringify({
            market: body.market,
            language: body.language,
            product: body.product,
            defaults: fallback.attributes,
            rules: {
              title: "Natural search title, max 100 characters, preserve exact brand/product identity",
              description: "Plain text, scannable, supplied facts only, no medical claims",
              attributes: "Estimate conservatively from the product name and supplied facts; uncertain fields use the provided defaults"
            }
          })
        }
      ]
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content || "{}");
    return NextResponse.json({
      ...fallback,
      ...parsed,
      attributes: { ...fallback.attributes, ...(parsed.attributes || {}) }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "생성 오류";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
