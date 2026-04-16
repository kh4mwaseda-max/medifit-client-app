"use client";

import { useRef, useState } from "react";
import html2canvas from "html2canvas";

interface Props {
  targetId: string;        // キャプチャ対象のDOM id
  shareText?: string;      // Xに投稿するテキスト
  label?: string;          // ボタンラベル
}

export default function ShareButton({ targetId, shareText = "AYFで記録・分析中 📊", label = "シェア" }: Props) {
  const [state, setState] = useState<"idle" | "capturing" | "done">("idle");

  const capture = async () => {
    const el = document.getElementById(targetId);
    if (!el) return;
    setState("capturing");
    try {
      const canvas = await html2canvas(el, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        logging: false,
      });

      // AYFウォーターマーク（右下）
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const pad = 10;
        const text = "AllYourFit";
        ctx.font = `bold ${14 * 2}px sans-serif`;
        const tw = ctx.measureText(text).width;
        ctx.fillStyle = "rgba(255,255,255,0.75)";
        ctx.fillRect(canvas.width - tw - pad * 2 - 4, canvas.height - 38, tw + pad * 2, 28);
        ctx.fillStyle = "#3b82f6";
        ctx.fillText(text, canvas.width - tw - pad - 4, canvas.height - 16);
      }

      const dataUrl = canvas.toDataURL("image/png");

      // Web Share API（モバイル）
      if (navigator.share && navigator.canShare) {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], "ayf-graph.png", { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], text: shareText });
          setState("done");
          setTimeout(() => setState("idle"), 2000);
          return;
        }
      }

      // フォールバック: 画像DL + X シェアタブを開く
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "ayf-graph.png";
      a.click();

      const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText + "\n#AllYourFit #フィットネス")}`;
      window.open(xUrl, "_blank");

      setState("done");
      setTimeout(() => setState("idle"), 2000);
    } catch {
      setState("idle");
    }
  };

  return (
    <button
      type="button"
      onClick={capture}
      disabled={state === "capturing"}
      className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-blue-500 transition-colors disabled:opacity-50"
    >
      {state === "capturing" ? (
        <span className="animate-pulse">⏳</span>
      ) : state === "done" ? (
        <span className="text-teal-500">✓ 完了</span>
      ) : (
        <>
          <span>↗</span>
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
