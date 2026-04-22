"use client";

import { useRef, useState } from "react";
import PhotoComparison, { type Photo } from "./PhotoComparison";
import { Icon } from "@/components/cf/primitives";

interface Props {
  clientId: string;
  initialPhotos: Photo[];
}

const MAX_LONG_EDGE = 1200;
const JPEG_QUALITY = 0.85;

/** ブラウザ側で1200px / JPEG 85% にリサイズしてアップロード負荷を下げる。 */
async function resizeImage(file: File): Promise<Blob> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new window.Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });

  const longEdge = Math.max(img.width, img.height);
  const scale = longEdge > MAX_LONG_EDGE ? MAX_LONG_EDGE / longEdge : 1;
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas未対応");
  ctx.drawImage(img, 0, 0, w, h);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("リサイズ失敗"))),
      "image/jpeg",
      JPEG_QUALITY,
    );
  });
}

export default function PhotoTab({ clientId, initialPhotos }: Props) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weight, setWeight] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const blob = await resizeImage(file);
      const fd = new FormData();
      fd.append("clientId", clientId);
      fd.append("file", blob, "photo.jpg");
      if (weight.trim() !== "") fd.append("weight_kg", weight.trim());

      const res = await fetch("/api/photos/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "アップロード失敗");
      setPhotos((prev) => [json.photo as Photo, ...prev]);
      setWeight("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "アップロード失敗");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (photoId: string) => {
    const target = photos.find((p) => p.id === photoId);
    if (!target) return;
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    const res = await fetch(`/api/photos/${photoId}`, { method: "DELETE" });
    if (!res.ok) {
      // 失敗時は復元
      setPhotos((prev) => [target, ...prev].sort((a, b) => b.photo_date.localeCompare(a.photo_date)));
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "削除に失敗しました");
    }
  };

  return (
    <div className="space-y-4">
      {/* アップローダー */}
      <div className="bg-white rounded-2xl p-4 border border-ink-200/70 shadow-card space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
            <Icon name="camera" />
          </div>
          <p className="text-sm font-bold text-ink-800">体型写真をアップロード</p>
        </div>
        <p className="text-[11px] text-ink-500 leading-relaxed">
          同じポーズ・同じ照明で撮ると変化が分かりやすいです。<br />
          画像は本人とトレーナーのみ閲覧できます。
        </p>

        <div className="flex items-center gap-2">
          <label className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            <span
              className={`flex items-center justify-center gap-2 w-full bg-grad-brand text-white font-bold py-2.5 rounded-xl text-sm shadow-pop cursor-pointer ${
                uploading ? "opacity-60 pointer-events-none" : "hover:opacity-95"
              }`}
            >
              {uploading ? "アップロード中..." : "📷 写真を選択"}
            </span>
          </label>
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            placeholder="体重kg"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-24 bg-ink-50 border border-ink-200 rounded-xl px-3 py-2.5 text-sm text-ink-800 focus:outline-none focus:border-brand-500"
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            <Icon name="alert-circle" className="text-red-600 mt-0.5" />
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}
      </div>

      {/* Before/After 比較 */}
      <div className="bg-white rounded-2xl p-4 border border-ink-200/70 shadow-card">
        <PhotoComparison photos={photos} onDelete={handleDelete} />
      </div>
    </div>
  );
}
