"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ja } from "date-fns/locale";

const RISK_LABELS = { low: "低", medium: "中", high: "高" };
const RISK_COLORS = {
  low: "text-green-400",
  medium: "text-yellow-400",
  high: "text-red-400",
};

interface Props {
  clientId: string;
  assessments: any[];
}

export default function AssessmentManager({ clientId, assessments }: Props) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setGenerating(true);
    setError("");
    const res = await fetch("/api/assessment/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "生成に失敗しました");
    }
    setGenerating(false);
    router.refresh();
  };

  const handlePublish = async (assessmentId: string, publish: boolean) => {
    setPublishing(assessmentId);
    await fetch("/api/trainer/assessment", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assessmentId, publish }),
    });
    setPublishing(null);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleGenerate}
        disabled={generating}
        className="w-full bg-green-500 hover:bg-green-400 disabled:bg-gray-700 disabled:text-gray-500 text-black font-semibold py-3 rounded-xl transition-colors text-sm"
      >
        {generating ? "AIが分析中..." : "AIアセスメントを生成"}
      </button>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {assessments.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">アセスメントがありません</p>
      ) : (
        <div className="space-y-3">
          {assessments.map((a) => (
            <div key={a.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-300">
                  {format(parseISO(a.generated_at), "M月d日 HH:mm", { locale: ja })}
                </p>
                <span className={`text-xs px-2 py-1 rounded-full ${a.published_at ? "bg-green-900 text-green-400" : "bg-gray-800 text-gray-500"}`}>
                  {a.published_at ? "公開中" : "非公開"}
                </span>
              </div>

              <p className="text-sm text-gray-400 line-clamp-2">{a.current_summary}</p>

              <div className="grid grid-cols-4 gap-2">
                {(["risk_obesity", "risk_musculoskeletal", "risk_nutrition", "risk_sleep"] as const).map((key) => (
                  <div key={key} className="text-center">
                    <p className={`text-sm font-bold ${RISK_COLORS[a[key] as keyof typeof RISK_COLORS]}`}>
                      {RISK_LABELS[a[key] as keyof typeof RISK_LABELS]}
                    </p>
                    <p className="text-xs text-gray-600 leading-tight mt-0.5">
                      {key === "risk_obesity" ? "生習病" : key === "risk_musculoskeletal" ? "筋骨格" : key === "risk_nutrition" ? "栄養" : "睡眠"}
                    </p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handlePublish(a.id, !a.published_at)}
                disabled={publishing === a.id}
                className={`w-full py-2 rounded-xl text-sm font-medium transition-colors ${
                  a.published_at
                    ? "border border-gray-700 text-gray-400 hover:border-red-700 hover:text-red-400"
                    : "bg-green-500 hover:bg-green-400 text-black"
                }`}
              >
                {publishing === a.id ? "更新中..." : a.published_at ? "非公開にする" : "クライアントに公開"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
