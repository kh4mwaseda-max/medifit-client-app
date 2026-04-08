// AllYourFit ロゴコンポーネント
// コンセプト: 医療×フィットネス。心電図の波形（バイタルライン）＋上昇する人体シルエット

interface Props {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "full" | "mark";  // full=マーク+テキスト, mark=マークのみ
}

const SIZE = {
  sm: { mark: 28, text: "text-sm",  gap: "gap-2"   },
  md: { mark: 36, text: "text-base", gap: "gap-2.5" },
  lg: { mark: 48, text: "text-xl",  gap: "gap-3"   },
  xl: { mark: 64, text: "text-2xl", gap: "gap-4"   },
};

export default function Logo({ size = "md", variant = "full" }: Props) {
  const s = SIZE[size];
  return (
    <div className={`flex items-center ${s.gap}`}>
      <LogoMark size={s.mark} />
      {variant === "full" && (
        <div className="flex flex-col leading-none">
          <span className={`font-black tracking-tight text-slate-800 ${s.text}`}>
            AllYourFit
          </span>
          {size === "lg" || size === "xl" ? (
            <span className="text-[10px] tracking-widest text-slate-400 font-medium mt-0.5 uppercase">
              Personal Health Intelligence
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}

export function LogoMark({ size = 36 }: { size?: number }) {
  const r = size * 0.2; // corner radius
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="ayf-bg-grad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
        <linearGradient id="ayf-line-grad" x1="0" y1="0" x2="100" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
        </linearGradient>
        <clipPath id="ayf-clip">
          <rect width="100" height="100" rx={r * 5} ry={r * 5} />
        </clipPath>
      </defs>

      {/* 背景 */}
      <rect width="100" height="100" rx={r * 5} ry={r * 5} fill="url(#ayf-bg-grad)" />

      {/* 人体シルエット（上昇ポーズ＝腕を上げたフィットネス人物） */}
      {/* 頭 */}
      <circle cx="50" cy="22" r="9" fill="white" fillOpacity="0.95" />
      {/* 胴体 */}
      <rect x="44" y="33" width="12" height="22" rx="4" fill="white" fillOpacity="0.95" />
      {/* 右腕（上げる） */}
      <path d="M44 38 L28 22" stroke="white" strokeWidth="7" strokeLinecap="round" strokeOpacity="0.95" />
      {/* 左腕（上げる） */}
      <path d="M56 38 L72 22" stroke="white" strokeWidth="7" strokeLinecap="round" strokeOpacity="0.95" />
      {/* 右脚 */}
      <path d="M47 54 L40 75" stroke="white" strokeWidth="7" strokeLinecap="round" strokeOpacity="0.95" />
      {/* 左脚 */}
      <path d="M53 54 L60 75" stroke="white" strokeWidth="7" strokeLinecap="round" strokeOpacity="0.95" />

      {/* 心電図ライン（下部にオーバーレイ） */}
      <path
        d="M8 84 L22 84 L28 72 L34 94 L40 78 L46 84 L54 84 L60 76 L66 90 L72 84 L92 84"
        stroke="url(#ayf-line-grad)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        clipPath="url(#ayf-clip)"
      />
    </svg>
  );
}
