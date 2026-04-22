"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { format, parseISO } from "date-fns";
import { ja } from "date-fns/locale";

export type Photo = {
  id: string;
  client_id: string;
  photo_date: string;
  pose?: string | null;
  storage_path: string;
  weight_kg?: number | null;
  signed_url: string | null;
  created_at?: string;
};

interface Props {
  photos: Photo[];
  onDelete?: (photoId: string) => void;
}

export default function PhotoComparison({ photos, onDelete }: Props) {
  // 新しい順で渡される想定。Before=最古, After=最新を初期表示。
  const sorted = [...photos].sort((a, b) => a.photo_date.localeCompare(b.photo_date));
  const [leftIdx, setLeftIdx] = useState(0);
  const [rightIdx, setRightIdx] = useState(Math.max(0, sorted.length - 1));

  if (sorted.length === 0) {
    return (
      <div className="text-center py-10 text-ink-400 text-sm">
        まだ写真がありません。<br />
        上のボタンから1枚アップロードして比較を始めましょう。
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sorted.length < 2 ? (
        <div className="space-y-2">
          <p className="text-xs text-ink-500 text-center">
            比較するには2枚以上必要です（現在 {sorted.length} 枚）
          </p>
          <div className="aspect-[3/4] bg-ink-100 rounded-xl overflow-hidden relative max-w-[240px] mx-auto">
            {sorted[0].signed_url && (
              <Image src={sorted[0].signed_url} alt="" fill className="object-cover" unoptimized />
            )}
          </div>
          <p className="text-center text-xs text-ink-500">
            {format(parseISO(sorted[0].photo_date), "M月d日", { locale: ja })}
            {sorted[0].weight_kg ? `　${sorted[0].weight_kg}kg` : ""}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <PhotoSelector
            photos={sorted}
            selectedIdx={Math.min(leftIdx, sorted.length - 1)}
            onSelect={setLeftIdx}
            label="Before"
            onDelete={onDelete}
          />
          <PhotoSelector
            photos={sorted}
            selectedIdx={Math.min(rightIdx, sorted.length - 1)}
            onSelect={setRightIdx}
            label="After"
            onDelete={onDelete}
          />
        </div>
      )}

      {/* タイムライン */}
      <div>
        <p className="text-xs text-ink-500 mb-3">タイムライン</p>
        <div className="flex gap-2 overflow-x-auto pb-2 touch-pan-x overscroll-x-contain">
          {sorted.slice(-12).map((photo, i) => (
            <div key={photo.id} className="flex-shrink-0 text-center space-y-1">
              <div className="w-16 h-20 bg-ink-100 rounded-lg overflow-hidden relative">
                {photo.signed_url && (
                  <Image
                    src={photo.signed_url}
                    alt={`#${i + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                )}
              </div>
              <p className="text-[10px] text-ink-500">
                {format(parseISO(photo.photo_date), "M/d", { locale: ja })}
              </p>
              {photo.weight_kg && (
                <p className="text-[10px] text-ink-400">{photo.weight_kg}kg</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PhotoSelector({
  photos,
  selectedIdx,
  onSelect,
  label,
  onDelete,
}: {
  photos: Photo[];
  selectedIdx: number;
  onSelect: (i: number) => void;
  label: string;
  onDelete?: (photoId: string) => void;
}) {
  const photo = photos[selectedIdx];
  const touchStartX = useRef<number | null>(null);
  if (!photo) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null || e.changedTouches.length !== 1) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) {
      if (dx < 0 && selectedIdx < photos.length - 1) onSelect(selectedIdx + 1);
      if (dx > 0 && selectedIdx > 0) onSelect(selectedIdx - 1);
    }
    touchStartX.current = null;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-ink-500 font-semibold">{label}</span>
        <span className="text-[10px] text-ink-500">
          {format(parseISO(photo.photo_date), "M月d日", { locale: ja })}
          {photo.weight_kg && <span className="ml-1 text-ink-400">{photo.weight_kg}kg</span>}
        </span>
      </div>

      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="aspect-[3/4] bg-ink-100 rounded-xl overflow-hidden relative touch-pan-y"
      >
        {photo.signed_url && (
          <Image src={photo.signed_url} alt={label} fill className="object-cover" unoptimized />
        )}
        {photos.length > 1 && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
            {photos.map((_, i) => (
              <div
                key={i}
                className={`w-1 h-1 rounded-full transition-all ${i === selectedIdx ? "bg-white" : "bg-white/30"}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onSelect(Math.max(0, selectedIdx - 1))}
          disabled={selectedIdx === 0}
          className="flex-none w-9 h-9 flex items-center justify-center rounded-lg bg-ink-100 text-ink-600 disabled:opacity-30 text-base hover:bg-ink-200"
          aria-label="前の写真"
        >
          ‹
        </button>
        <select
          value={selectedIdx}
          onChange={(e) => onSelect(Number(e.target.value))}
          title={`${label}の写真を選択`}
          className="flex-1 bg-ink-50 text-ink-700 text-xs rounded-lg px-2 py-2 border border-ink-200 min-h-[36px]"
        >
          {photos.map((p, i) => (
            <option key={p.id} value={i}>
              {format(parseISO(p.photo_date), "M月d日", { locale: ja })}
              {p.weight_kg ? ` (${p.weight_kg}kg)` : ""}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => onSelect(Math.min(photos.length - 1, selectedIdx + 1))}
          disabled={selectedIdx === photos.length - 1}
          className="flex-none w-9 h-9 flex items-center justify-center rounded-lg bg-ink-100 text-ink-600 disabled:opacity-30 text-base hover:bg-ink-200"
          aria-label="次の写真"
        >
          ›
        </button>
      </div>

      {onDelete && (
        <button
          type="button"
          onClick={() => {
            if (confirm("この写真を削除しますか？")) onDelete(photo.id);
          }}
          className="w-full text-[10px] text-red-500 hover:text-red-600 py-1"
        >
          この写真を削除
        </button>
      )}
    </div>
  );
}
