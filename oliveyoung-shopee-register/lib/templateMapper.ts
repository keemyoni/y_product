import * as XLSX from "xlsx";
import type { MarketDraft, ProductSource } from "./types";

const aliases: Record<string, string[]> = {
  sku: ["sku", "seller sku", "parent sku", "상품코드", "판매자 sku"],
  name: ["product name", "item name", "name", "상품명", "상품 이름"],
  description: ["description", "product description", "상품 설명", "상세설명"],
  listPrice: ["original price", "list price", "normal price", "정상가", "정가"],
  price: ["price", "sales price", "discount price", "판매가", "할인가", "가격"],
  discount: ["discount", "discount rate", "할인율"],
  stock: ["stock", "stock quantity", "재고", "수량"],
  brand: ["brand", "브랜드"],
  weight: ["weight", "weight(kg)", "무게", "상품 무게"],
  image1: ["image 1", "main image", "cover image", "대표 이미지", "image url 1"],
  category: ["category", "category name", "카테고리", "카테고리명"],
  categoryId: ["category id", "카테고리 id", "categoryid"],
  manufacturer: ["manufacturer", "제조사", "maker"],
  origin: ["country of origin", "origin", "원산지", "제조국"],
  condition: ["condition", "상품 상태", "상태"],
  shelfLife: ["shelf life", "shelf life months", "expiry", "사용기한", "유통기한"],
  dangerousGoods: ["dangerous goods", "hazardous", "위험물"],
  preOrder: ["pre-order", "preorder", "예약판매"],
  daysToShip: ["days to ship", "dts", "발송 준비일", "출고 소요일"],
  shippingChannel: ["shipping channel", "logistics channel", "배송 채널", "물류 채널"],
  optionName: ["option name", "variation name", "옵션명"],
  optionValue: ["option value", "variation value", "옵션값"],
  capacity: ["capacity", "size", "용량"],
  voucherRate: ["voucher", "voucher rate", "coupon rate", "쿠폰율"]
};

function norm(value: unknown) {
  return String(value ?? "").toLowerCase().replace(/[\s_\-().%]/g, "");
}

function detectHeaderRow(rows: unknown[][]) {
  let best = { index: 0, score: -1 };
  rows.slice(0, 30).forEach((row, index) => {
    const values = row.map(norm);
    const score = Object.values(aliases).flat().filter((a) => values.includes(norm(a))).length;
    if (score > best.score) best = { index, score };
  });
  return best.index;
}

function fieldForHeader(header: unknown) {
  const h = norm(header);
  return Object.entries(aliases).find(([, list]) => list.some((a) => norm(a) === h))?.[0];
}

export async function fillShopeeTemplate(
  file: File,
  products: ProductSource[],
  drafts: MarketDraft[],
  selectedMarket: string
) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellStyles: true, cellFormula: true });
  const sheetName = workbook.SheetNames.find((name) => {
    const sheet = workbook.Sheets[name];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false });
    const headerIndex = detectHeaderRow(rows);
    return rows[headerIndex]?.some((h) => fieldForHeader(h));
  }) || workbook.SheetNames[0];

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false, defval: "" });
  const headerIndex = detectHeaderRow(rows);
  const headers = rows[headerIndex] || [];
  const approved = drafts.filter((d) => d.approved && d.market === selectedMarket);

  const dataRows = approved.map((draft) => {
    const product = products.find((p) => p.id === draft.productId)!;
    const a = draft.attributes;
    return headers.map((header) => {
      switch (fieldForHeader(header)) {
        case "sku": return `${product.brand}-${product.id}-${draft.market}`.replace(/[^a-zA-Z0-9-]/g, "-").slice(0, 80);
        case "name": return draft.title;
        case "description": return draft.description;
        case "listPrice": return draft.listPrice;
        case "price": return draft.salePrice;
        case "discount": return Math.round(draft.discountRate * 100);
        case "stock": return draft.stock;
        case "brand": return product.brand || "No Brand";
        case "weight": return product.weightKg;
        case "image1": return product.imageUrls[0] || "";
        case "category": return a.categoryName;
        case "categoryId": return a.categoryId;
        case "manufacturer": return a.manufacturer;
        case "origin": return a.countryOfOrigin;
        case "condition": return a.condition;
        case "shelfLife": return a.shelfLifeMonths;
        case "dangerousGoods": return a.dangerousGoods;
        case "preOrder": return a.preOrder;
        case "daysToShip": return a.daysToShip;
        case "shippingChannel": return a.shippingChannel;
        case "optionName": return a.optionName;
        case "optionValue": return a.optionValue;
        case "capacity": return product.capacity || a.optionValue;
        case "voucherRate": return Math.round(draft.sellerVoucherRate * 100);
        default: return "";
      }
    });
  });

  const outputRows = [...rows.slice(0, headerIndex + 1), ...dataRows];
  workbook.Sheets[sheetName] = XLSX.utils.aoa_to_sheet(outputRows);
  XLSX.writeFile(workbook, `shopee-${selectedMarket}-upload-ready.xlsx`);
  return { sheetName, count: dataRows.length, mappedHeaders: headers.filter((h) => fieldForHeader(h)).map(String) };
}
