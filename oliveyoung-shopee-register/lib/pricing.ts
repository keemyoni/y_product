export type PricingInput = {
  productCostKrw: number;
  domesticShippingKrw: number;
  internationalShippingKrw: number;
  packagingKrw: number;
  platformFeeRate: number;
  paymentFeeRate: number;
  adReserveRate: number;
  returnReserveRate: number;
  targetMarginRate: number;
  sellerVoucherRate: number;
  launchDiscountRate: number;
  fxPerKrw: number;
};

export function calculatePricing(input: PricingInput) {
  const fixedCost =
    input.productCostKrw +
    input.domesticShippingKrw +
    input.internationalShippingKrw +
    input.packagingKrw;

  const totalRate =
    input.platformFeeRate +
    input.paymentFeeRate +
    input.adReserveRate +
    input.returnReserveRate +
    input.sellerVoucherRate +
    input.targetMarginRate;

  if (totalRate >= 0.9) throw new Error("수수료·쿠폰·충당금·마진 합계가 너무 큽니다.");
  if (input.launchDiscountRate < 0 || input.launchDiscountRate >= 0.8) throw new Error("런칭 할인율을 확인하세요.");

  // 고객이 실제 결제하는 할인 판매가에서 모든 비용과 목표 마진이 확보되도록 역산합니다.
  const requiredSaleKrw = fixedCost / (1 - totalRate);
  const salePrice = roundMarketPrice(requiredSaleKrw * input.fxPerKrw);
  const listPrice = roundMarketPrice(salePrice / (1 - input.launchDiscountRate));

  const realizedSaleKrw = salePrice / input.fxPerKrw;
  const variableCostsKrw = realizedSaleKrw * (
    input.platformFeeRate + input.paymentFeeRate + input.adReserveRate +
    input.returnReserveRate + input.sellerVoucherRate
  );
  const estimatedProfitKrw = realizedSaleKrw - fixedCost - variableCostsKrw;

  return {
    listPrice,
    salePrice,
    discountRate: input.launchDiscountRate,
    sellerVoucherRate: input.sellerVoucherRate,
    estimatedProfitKrw: Math.round(estimatedProfitKrw)
  };
}

function roundMarketPrice(value: number) {
  if (value >= 1000) return Math.max(1, Math.ceil(value / 100) * 100 - 1);
  if (value >= 100) return Math.max(1, Math.ceil(value) - 0.1);
  return Math.max(0.01, Math.ceil(value * 10) / 10 - 0.01);
}
