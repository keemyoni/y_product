import type { MarketCode } from "./types";

export const MARKETS: Record<MarketCode, {
  label: string;
  currency: string;
  language: string;
  fallbackFxPerKrw: number;
}> = {
  MY: { label: "Malaysia", currency: "MYR", language: "English / Malay", fallbackFxPerKrw: 0.0032 },
  SG: { label: "Singapore", currency: "SGD", language: "English", fallbackFxPerKrw: 0.00094 },
  PH: { label: "Philippines", currency: "PHP", language: "English", fallbackFxPerKrw: 0.040 },
  TH: { label: "Thailand", currency: "THB", language: "Thai", fallbackFxPerKrw: 0.023 },
  VN: { label: "Vietnam", currency: "VND", language: "Vietnamese", fallbackFxPerKrw: 18.0 },
  TW: { label: "Taiwan", currency: "TWD", language: "Traditional Chinese", fallbackFxPerKrw: 0.022 }
};
