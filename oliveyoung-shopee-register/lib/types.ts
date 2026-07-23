export type ProductSource = {
  id: string;
  url: string;
  name: string;
  brand: string;
  priceKrw: number;
  description: string;
  capacity?: string;
  weightKg: number;
  imageUrls: string[];
  extractionWarnings: string[];
  selected: boolean;
};

export type MarketCode = "MY" | "SG" | "PH" | "TH" | "VN" | "TW";

export type ListingAttributes = {
  categoryName: string;
  categoryId: string;
  manufacturer: string;
  countryOfOrigin: string;
  condition: string;
  shelfLifeMonths: number;
  dangerousGoods: string;
  preOrder: string;
  daysToShip: number;
  shippingChannel: string;
  optionName: string;
  optionValue: string;
};

export type MarketDraft = {
  productId: string;
  market: MarketCode;
  currency: string;
  language: string;
  title: string;
  description: string;
  keywords: string[];
  listPrice: number;
  salePrice: number;
  discountRate: number;
  sellerVoucherRate: number;
  estimatedProfitKrw: number;
  stock: number;
  approved: boolean;
  attributes: ListingAttributes;
  warnings: string[];
};
