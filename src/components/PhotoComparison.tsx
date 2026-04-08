"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { format, parseISO } from "date-fns";
import { ja } from "date-fns/locale";

const POSES = ["front", "back", "side"] as const;
const POSE_LABELS = { front: "正面", back: "背面", side: "側面" };

export default function PhotoComparison({ photos }: { photos: any[] }) {
  const [pose, setPose] = useState<(typeof POSES)[number]>("front");
  const [leftIdx, setLeftIdx] = useState(0);
  const [rightIdx, setRightIdx] = useState(0);

  const filtered = photos.filter((p) => p.pose === pose);

  const getUrl = (path: string) => {
    const { data } = supabase.storage.from("body-photos").getPublicUrl(path);
    return data.publicUrl;
  };

  // タイムライン用: poselごとの最新写真
  const timeline = photos
    .filter((p) => p.pose === "front")
    .slice(0, 12);

  if (photos.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        フォトがまだ登録されていません
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ポーズ切替 */}
      <div className="flex gap-2">
        {POSES.map((p) => (
          <button
            key={p}
            onClick={() => { setPose(p); setLeftIdx(0); setRightIdx(Math.min(1, filtered.length - 1)); }}
            className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
              pose === p ? "bg-green-500 text-black font-medium" : "bg-gray-800 text-gray-400"
            }`}
          >
            {POSE_LABELS[p]}
          </button>
        ))}
      </div>

      {filtered.length < 2 ? (
        <p className="text-center text-gray-500 py-8">比較するには2枚以上の写真が必要です</p>
      ) : (
        <>
          {/* サイドバイサイド比較 */}
          <div className="grid grid-cols-2 gap-3">
            <PhotoSelector
              photos={filtered}
              selectedIdx={leftIdx}
              onSelect={setLeftIdx}
              getUrl={getUrl}
              label="Before"
            />
            <PhotoSelector
              photos={filtered}
              selectedIdx={rightIdx}
              onSelect={setRightIdx}
              getUrl={getUrl}
              label="After"
            />
          </div>
        </>
      )}

      {/* タイムライン */}
      <div>
        <p className="text-xs text-gray-500 mb-3">タイムライン（正面）</p>
        {/* touch-pan-x でピンチズームとの競合を防ぐ */}
        <div className="flex gap-2 overflow-x-auto pb-2 touch-pan-x overscroll-x-contain">
          {timeline.map((photo, i) => (
            <div key={photo.id} className="flex-shrink-0 text-center space-y-1">
              <div className="w-16 h-20 bg-gray-800 rounded-lg overflow-hidden relative">
                <Image
                  src={getUrl(photo.storage_path)}
                  alt={`Week ${i + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
              <p className="text-xs text-gray-600">
                {format(parseISO(photo.photo_date), "M/d", { locale: ja })}
              </p>
              {photo.weight_kg && (
                <p className="text-xs text-gray-500">{photo.weight_kg}kg</p>
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
  getUrl,
  label,
}: {
  photos: any[];
  selectedIdx: number;
  onSelect: (i: number) => void;
  getUrl: (path: string) => string;
  label: string;
}) {
  const photo = photos[selectedIdx];
  if (!photo) return null;

  // スワイプ対応（ピンチズームと競合しないよう touch-action: pan-y を画像に付与）
  const touchStartX = useRef<number | null>(null);
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
        <span className="text-xs text-gray-400 font-semibold">{label}</span>
        <span className="text-xs text-gray-500">
          {format(parseISO(photo.photo_date), "M月d日", { locale: ja })}
          {photo.weight_kg && <span className="ml-1 text-gray-600">{photo.weight_kg}kg</span>}
        </span>
      </div>

      {/* 画像: スワイプで前後切替 */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="aspect-[3/4] bg-gray-800 rounded-xl overflow-hidden relative touch-pan-y"
      >
        <Image src={getUrl(photo.storage_path)} alt={label} fill className="object-cover" />

        {/* スワイプヒント（写真が複数枚ある場合のみ） */}
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

      {/* prev/next ボタン（スマホで操作しやすいよう大きめに） */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onSelect(Math.max(0, selectedIdx - 1))}
          disabled={selectedIdx === 0}
          className="flex-none w-10 h-10 flex items-center justify-center rounded-xl bg-gray-800 text-gray-300 disabled:opacity-30 text-lg transition-colors hover:bg-gray-700 active:bg-gray-600"
        >
          ‹
        </button>
        <select
          value={selectedIdx}
          onChange={(e) => onSelect(Number(e.target.value))}
          title={`${label}の写真を選択`}
          className="flex-1 bg-gray-800 text-gray-300 text-xs rounded-lg px-2 py-2.5 border border-gray-700 min-h-[40px]"
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
          className="flex-none w-10 h-10 flex items-center justify-center rounded-xl bg-gray-800 text-gray-300 disabled:opacity-30 text-lg transition-colors hover:bg-gray-700 active:bg-gray-600"
        >
          ›
        </button>
      </div>
    </div>
  );
}
