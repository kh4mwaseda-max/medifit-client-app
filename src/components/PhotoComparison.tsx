"use client";

import { useState } from "react";
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
        <div className="flex gap-2 overflow-x-auto pb-2">
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

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{label}</span>
        <span className="text-xs text-gray-500">
          {format(parseISO(photo.photo_date), "M月d日", { locale: ja })}
        </span>
      </div>
      <div className="aspect-[3/4] bg-gray-800 rounded-xl overflow-hidden relative">
        <Image src={getUrl(photo.storage_path)} alt={label} fill className="object-cover" />
      </div>
      <select
        value={selectedIdx}
        onChange={(e) => onSelect(Number(e.target.value))}
        className="w-full bg-gray-800 text-gray-300 text-xs rounded-lg px-2 py-1.5 border border-gray-700"
      >
        {photos.map((p, i) => (
          <option key={p.id} value={i}>
            {format(parseISO(p.photo_date), "M月d日", { locale: ja })}
            {p.weight_kg ? ` (${p.weight_kg}kg)` : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
