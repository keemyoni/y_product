import * as XLSX from "xlsx";
import type { MarketDraft, ProductSource } from "./types";

export function downloadDraftWorkbook(product: ProductSource, drafts: MarketDraft[]) {
  const rows = drafts
    .filter((draft) => draft.approved)
    .map((draft) => ({
      Market: draft.market,
      SKU: `${product.brand}-${product.name}-${draft.market}`.replace(/\s+/g, "-").slice(0, 80),
      Product_Name: draft.title,
      Description: draft.description,
      Currency: draft.currency,
      Price: draft.salePrice,
      Stock: draft.stock,
      Brand: product.brand,
      Source_URL: product.url,
      Source_Price_KRW: product.priceKrw,
      Keywords: draft.keywords.join(", "),
      Image_URLs_Reference_Only: product.imageUrls.join("|")
    }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "Approved Drafts");
  XLSX.writeFile(workbook, "shopee-approved-drafts.xlsx");
}
