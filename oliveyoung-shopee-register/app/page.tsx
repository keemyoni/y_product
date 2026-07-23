"use client";

import { useMemo, useState } from "react";
import { MARKETS } from "@/lib/markets";
import type { MarketCode, MarketDraft, ProductSource } from "@/lib/types";
import { calculatePricing } from "@/lib/pricing";
import { fillShopeeTemplate } from "@/lib/templateMapper";
import { downloadProductImageZip } from "@/lib/imageTools";

const marketCodes = Object.keys(MARKETS) as MarketCode[];

export default function Home() {
  const [urls, setUrls] = useState("");
  const [products, setProducts] = useState<ProductSource[]>([]);
  const [drafts, setDrafts] = useState<MarketDraft[]>([]);
  const [market, setMarket] = useState<MarketCode>("MY");
  const [template, setTemplate] = useState<File | null>(null);
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [settings, setSettings] = useState({
    domesticShippingKrw: 0,
    internationalShippingKrw: 9000,
    packagingKrw: 1000,
    platformFeeRate: 0.12,
    paymentFeeRate: 0.03,
    adReserveRate: 0.05,
    returnReserveRate: 0.03,
    sellerVoucherRate: 0.05,
    launchDiscountRate: 0.20,
    targetMarginRate: 0.22
  });

  const selectedProducts = useMemo(() => products.filter(p => p.selected), [products]);
  const selectedDrafts = useMemo(() => drafts.filter(d => d.market === market), [drafts, market]);

  async function extractAll() {
    const list = [...new Set(urls.split(/\r?\n/).map(v => v.trim()).filter(Boolean))].slice(0, 50);
    if (!list.length) return setStatus("올리브영 URL을 한 줄에 하나씩 입력하세요.");
    setBusy(true); setStatus(`0/${list.length} 상품 확인 중`);
    const output: ProductSource[] = [];
    for (let i = 0; i < list.length; i++) {
      try {
        const response = await fetch("/api/extract", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: list[i] }) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        output.push({
          id: `P${String(i+1).padStart(3,"0")}`,
          url: list[i], name: data.name || "", brand: data.brand || "", priceKrw: data.priceKrw || 0,
          description: data.description || "", capacity: "", weightKg: 0.3,
          imageUrls: data.imageUrls || [], extractionWarnings: data.extractionWarnings || [], selected: true
        });
      } catch (error) {
        output.push({
          id: `P${String(i+1).padStart(3,"0")}`, url: list[i], name: "", brand: "", priceKrw: 0,
          description: "", capacity: "", weightKg: 0.3, imageUrls: [], selected: true,
          extractionWarnings: [error instanceof Error ? error.message : "자동 확인 실패", "직접 입력 후 계속 진행할 수 있습니다."]
        });
      }
      setStatus(`${i+1}/${list.length} 상품 확인 중`);
    }
    setProducts(output); setDrafts([]); setStatus(`${output.length}개 상품 확인 완료. 빈 값만 보정하세요.`); setBusy(false);
  }

  function patchProduct(id: string, patch: Partial<ProductSource>) {
    setProducts(items => items.map(p => p.id === id ? { ...p, ...patch } : p));
  }

  async function generate() {
    const targets = selectedProducts.filter(p => p.name && p.priceKrw > 0);
    if (!targets.length) return setStatus("선택 상품의 상품명과 구매 원가를 입력하세요.");
    setBusy(true); setStatus("환율 확인 중");
    try {
      const fx = await (await fetch("/api/fx")).json();
      const output: MarketDraft[] = [];
      for (let i = 0; i < targets.length; i++) {
        const product = targets[i];
        const m = MARKETS[market];
        setStatus(`${i+1}/${targets.length} ${m.label} 등록 문구 생성 중`);
        const response = await fetch("/api/generate", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product, market: m.label, language: m.language })
        });
        const ai = await response.json();
        if (!response.ok) throw new Error(ai.error);
        const pricing = calculatePricing({ productCostKrw: product.priceKrw, ...settings, fxPerKrw: fx.rates?.[market] || m.fallbackFxPerKrw });
        output.push({
          productId: product.id, market, currency: m.currency, language: m.language,
          title: ai.title || `${product.brand} ${product.name}`.trim(), description: ai.description || product.description,
          keywords: ai.keywords || [], listPrice: pricing.listPrice, salePrice: pricing.salePrice,
          discountRate: pricing.discountRate, sellerVoucherRate: pricing.sellerVoucherRate,
          estimatedProfitKrw: pricing.estimatedProfitKrw, stock: 3, approved: true,
          attributes: {
            categoryName: ai.attributes?.categoryName || "Beauty & Personal Care > Skincare > Others",
            categoryId: ai.attributes?.categoryId || "",
            manufacturer: ai.attributes?.manufacturer || product.brand || "To be confirmed",
            countryOfOrigin: ai.attributes?.countryOfOrigin || "South Korea",
            condition: ai.attributes?.condition || "New",
            shelfLifeMonths: Number(ai.attributes?.shelfLifeMonths || 24),
            dangerousGoods: ai.attributes?.dangerousGoods || "No",
            preOrder: ai.attributes?.preOrder || "No",
            daysToShip: Number(ai.attributes?.daysToShip || 3),
            shippingChannel: ai.attributes?.shippingChannel || "Shopee Supported Logistics",
            optionName: ai.attributes?.optionName || (product.capacity ? "Size" : "Option"),
            optionValue: ai.attributes?.optionValue || product.capacity || "Default"
          },
          warnings: [
            ...(!product.capacity ? ["용량 확인 필요"] : []),
            ...(product.weightKg <= 0 ? ["무게 확인 필요"] : []),
            ...(!product.imageUrls.length ? ["이미지 없음"] : [])
          ]
        });
      }
      setDrafts(old => [...old.filter(d => d.market !== market), ...output]);
      setStatus(`${targets.length}개 ${MARKETS[market].label} 초안 완료`);
    } catch (e) { setStatus(e instanceof Error ? e.message : "생성 실패"); }
    finally { setBusy(false); }
  }

  function patchDraft(productId: string, patch: Partial<MarketDraft>) {
    setDrafts(items => items.map(d => d.productId === productId && d.market === market ? { ...d, ...patch } : d));
  }

  async function exportTemplate() {
    if (!template) return setStatus("Shopee Seller Centre에서 받은 최신 XLSX 템플릿을 선택하세요.");
    const result = await fillShopeeTemplate(template, products, drafts, market);
    setStatus(`${result.sheetName} 시트에 ${result.count}개 입력 완료 · 매핑: ${result.mappedHeaders.join(", ")}`);
  }

  return (
    <main>
      <h1>Olive Young → Shopee 당일 등록기</h1>
      <p className="sub">URL 붙여넣기부터 쇼피 업로드 엑셀과 1024px 이미지 ZIP까지 한 화면에서 만듭니다.</p>

      <section className="card">
        <h2>1. URL 일괄 입력</h2>
        <textarea value={urls} onChange={e => setUrls(e.target.value)} placeholder={"올리브영 상품 URL을 한 줄에 하나씩 붙여넣기\n최대 50개"} />
        <button className="primary" disabled={busy} onClick={extractAll}>상품 정보 한 번에 가져오기</button>
      </section>

      {products.length > 0 && <section className="card">
        <h2>2. 자동 확인 결과 보정</h2>
        <div className="tableWrap"><table><thead><tr><th>선택</th><th>브랜드</th><th>상품명</th><th>원가(원)</th><th>용량</th><th>무게(kg)</th><th>이미지</th></tr></thead><tbody>
          {products.map(p => <tr key={p.id}>
            <td><input type="checkbox" checked={p.selected} onChange={e => patchProduct(p.id,{selected:e.target.checked})}/></td>
            <td><input value={p.brand} onChange={e => patchProduct(p.id,{brand:e.target.value})}/></td>
            <td><input value={p.name} onChange={e => patchProduct(p.id,{name:e.target.value})}/>{p.extractionWarnings.map(w=><small key={w}>{w}</small>)}</td>
            <td><input type="number" value={p.priceKrw} onChange={e => patchProduct(p.id,{priceKrw:Number(e.target.value)})}/></td>
            <td><input value={p.capacity || ""} onChange={e => patchProduct(p.id,{capacity:e.target.value})}/></td>
            <td><input type="number" step="0.01" value={p.weightKg} onChange={e => patchProduct(p.id,{weightKg:Number(e.target.value)})}/></td>
            <td>{p.imageUrls.length}장</td>
          </tr>)}
        </tbody></table></div>
      </section>}

      {products.length > 0 && <section className="card">
        <h2>3. 판매국·가격 설정</h2>
        <div className="grid">
          <div><label>판매 국가</label><select value={market} onChange={e => setMarket(e.target.value as MarketCode)}>{marketCodes.map(code=><option key={code} value={code}>{MARKETS[code].label} ({MARKETS[code].currency})</option>)}</select></div>
          <NumberField label="국제 배송비(원)" value={settings.internationalShippingKrw} onChange={v=>setSettings({...settings,internationalShippingKrw:v})}/>
          <NumberField label="포장비(원)" value={settings.packagingKrw} onChange={v=>setSettings({...settings,packagingKrw:v})}/>
          <RateField label="플랫폼 수수료 %" value={settings.platformFeeRate} onChange={v=>setSettings({...settings,platformFeeRate:v})}/>
          <RateField label="광고 충당 %" value={settings.adReserveRate} onChange={v=>setSettings({...settings,adReserveRate:v})}/>
          <RateField label="런칭 할인율 %" value={settings.launchDiscountRate} onChange={v=>setSettings({...settings,launchDiscountRate:v})}/>
          <RateField label="판매자 쿠폰 부담 %" value={settings.sellerVoucherRate} onChange={v=>setSettings({...settings,sellerVoucherRate:v})}/>
          <RateField label="목표 순마진 %" value={settings.targetMarginRate} onChange={v=>setSettings({...settings,targetMarginRate:v})}/>
        </div>
        <p className="hint">기본값은 정상가에서 20% 런칭 할인 + 판매자 쿠폰 5%입니다. 실제 할인 판매가에서 수수료·광고·쿠폰·반품 충당금과 목표 순마진이 남도록 정상가를 역산합니다.</p>
        <button className="primary" disabled={busy} onClick={generate}>{MARKETS[market].label} 등록자료 생성</button>
      </section>}

      {selectedDrafts.length > 0 && <section className="card">
        <h2>4. 상품명·가격 최종 확인</h2>
        <div className="tableWrap"><table><thead><tr><th>승인</th><th>상품</th><th>쇼피 상품명</th><th>정상가</th><th>할인가</th><th>재고</th><th>예상 이익</th></tr></thead><tbody>
          {selectedDrafts.map(d => { const p=products.find(x=>x.id===d.productId)!; return <tr key={d.productId}>
            <td><input type="checkbox" checked={d.approved} onChange={e=>patchDraft(d.productId,{approved:e.target.checked})}/></td>
            <td>{p.brand}<br/>{p.name}</td>
            <td><textarea value={d.title} onChange={e=>patchDraft(d.productId,{title:e.target.value})}/><details><summary>상세설명</summary><textarea value={d.description} onChange={e=>patchDraft(d.productId,{description:e.target.value})}/></details></td>
            <td><input type="number" step="0.01" value={d.listPrice} onChange={e=>patchDraft(d.productId,{listPrice:Number(e.target.value)})}/><small>{Math.round(d.discountRate*100)}% 할인 기준</small></td>
            <td><input type="number" step="0.01" value={d.salePrice} onChange={e=>patchDraft(d.productId,{salePrice:Number(e.target.value)})}/><small>쿠폰 부담 {Math.round(d.sellerVoucherRate*100)}%</small></td>
            <td><input type="number" value={d.stock} onChange={e=>patchDraft(d.productId,{stock:Number(e.target.value)})}/></td>
            <td>{d.estimatedProfitKrw.toLocaleString()}원</td>
          </tr>})}
        </tbody></table></div>
      </section>}


      {selectedDrafts.length > 0 && <section className="card">
        <h2>5. 추정 필수항목 확인·수정</h2>
        <p className="hint">상품명과 설명을 바탕으로 보수적으로 추정한 값입니다. 카테고리 ID·유통기한·배송 채널은 Seller Centre 값과 다르면 수정하세요.</p>
        <div className="attributeGrid">
          {selectedDrafts.map(d => { const p=products.find(x=>x.id===d.productId)!; const a=d.attributes; return <article className="attributeCard" key={d.productId}>
            <strong>{p.brand} {p.name}</strong>
            <Field label="카테고리명" value={a.categoryName} onChange={v=>patchDraft(d.productId,{attributes:{...a,categoryName:v}})}/>
            <Field label="카테고리 ID" value={a.categoryId} onChange={v=>patchDraft(d.productId,{attributes:{...a,categoryId:v}})}/>
            <Field label="제조사" value={a.manufacturer} onChange={v=>patchDraft(d.productId,{attributes:{...a,manufacturer:v}})}/>
            <Field label="원산지" value={a.countryOfOrigin} onChange={v=>patchDraft(d.productId,{attributes:{...a,countryOfOrigin:v}})}/>
            <Field label="상품 상태" value={a.condition} onChange={v=>patchDraft(d.productId,{attributes:{...a,condition:v}})}/>
            <NumberField label="사용기한 추정(개월)" value={a.shelfLifeMonths} onChange={v=>patchDraft(d.productId,{attributes:{...a,shelfLifeMonths:v}})}/>
            <Field label="위험물" value={a.dangerousGoods} onChange={v=>patchDraft(d.productId,{attributes:{...a,dangerousGoods:v}})}/>
            <Field label="예약판매" value={a.preOrder} onChange={v=>patchDraft(d.productId,{attributes:{...a,preOrder:v}})}/>
            <NumberField label="발송 준비일" value={a.daysToShip} onChange={v=>patchDraft(d.productId,{attributes:{...a,daysToShip:v}})}/>
            <Field label="배송 채널" value={a.shippingChannel} onChange={v=>patchDraft(d.productId,{attributes:{...a,shippingChannel:v}})}/>
            <Field label="옵션명" value={a.optionName} onChange={v=>patchDraft(d.productId,{attributes:{...a,optionName:v}})}/>
            <Field label="옵션값" value={a.optionValue} onChange={v=>patchDraft(d.productId,{attributes:{...a,optionValue:v}})}/>
          </article>})}
        </div>
      </section>}

      {selectedDrafts.length > 0 && <section className="card">
        <h2>6. 오늘 바로 업로드 파일 만들기</h2>
        <label>Shopee Seller Centre에서 내려받은 해당 국가 최신 XLSX 템플릿</label>
        <input type="file" accept=".xlsx,.xls" onChange={e=>setTemplate(e.target.files?.[0] || null)}/>
        <div className="rights"><input type="checkbox" checked={rightsConfirmed} onChange={e=>setRightsConfirmed(e.target.checked)}/><span>상품 이미지 사용 권한 또는 재판매에 필요한 권리를 확인했습니다.</span></div>
        <div className="actions">
          <button className="secondary" onClick={exportTemplate} disabled={!template}>쇼피 템플릿 자동 채우기</button>
          <button className="secondary" onClick={()=>downloadProductImageZip(selectedProducts)} disabled={!rightsConfirmed}>1024px 이미지 ZIP 다운로드</button>
        </div>
        <p className="hint">템플릿마다 필수 카테고리 속성·배송 채널 열이 달라 자동 매핑되지 않은 열은 Seller Centre 업로드 오류 메시지에 따라 한 번만 보완하면 됩니다.</p>
      </section>}

      <p className="status">{status}</p>
    </main>
  );
}

function Field({label,value,onChange}:{label:string;value:string;onChange:(v:string)=>void}) { return <div><label>{label}</label><input value={value} onChange={e=>onChange(e.target.value)}/></div> }
function NumberField({label,value,onChange}:{label:string;value:number;onChange:(v:number)=>void}) { return <div><label>{label}</label><input type="number" value={value} onChange={e=>onChange(Number(e.target.value))}/></div> }
function RateField({label,value,onChange}:{label:string;value:number;onChange:(v:number)=>void}) { return <NumberField label={label} value={Math.round(value*100)} onChange={v=>onChange(v/100)}/> }
