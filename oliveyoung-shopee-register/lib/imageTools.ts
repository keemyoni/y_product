import JSZip from "jszip";
import type { ProductSource } from "./types";

async function squareBlob(blob: Blob, size = 1024) {
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas를 사용할 수 없습니다.");
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, size, size);
  const scale = Math.min(size * 0.88 / bitmap.width, size * 0.88 / bitmap.height);
  const w = bitmap.width * scale, h = bitmap.height * scale;
  ctx.drawImage(bitmap, (size-w)/2, (size-h)/2, w, h);
  return await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error("이미지 변환 실패")), "image/jpeg", .92));
}

export async function downloadProductImageZip(
  products: ProductSource[],
  localImages: Record<string, File[]> = {}
) {
  const zip = new JSZip();
  for (const product of products.filter(p => p.selected)) {
    const sources: Array<{ blob?: Blob; url?: string }> = [
      ...(localImages[product.id] || []).map((blob) => ({ blob })),
      ...product.imageUrls.map((url) => ({ url }))
    ].slice(0, 8);

    for (let i = 0; i < sources.length; i++) {
      try {
        let blob = sources[i].blob;
        if (!blob && sources[i].url) {
          const response = await fetch(`/api/image?url=${encodeURIComponent(sources[i].url!)}`);
          if (!response.ok) continue;
          blob = await response.blob();
        }
        if (!blob) continue;
        const squared = await squareBlob(blob);
        zip.file(`${product.id}/${String(i+1).padStart(2,"0")}.jpg`, squared);
      } catch {}
    }
  }
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "shopee-images-1024.zip"; a.click();
  URL.revokeObjectURL(url);
}
