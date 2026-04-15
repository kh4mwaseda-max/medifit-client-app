/**
 * 筋トレ名言・マッチョ用語データベース
 * スクショ返信や進捗メッセージにランダムで添える。
 */

// ── 名言（海外レジェンドの和訳・日本語化含む） ──
export const MACHO_QUOTES: string[] = [
  // ロニー・コールマン
  "「Yeah Buddy!」— ロニー・コールマン",
  "「Light weight, baby!」— ロニー・コールマン",
  "「みんな大きくなりたい。でも誰もクソ重いウエイトを上げたがらない」— ロニー・コールマン",

  // アーノルド・シュワルツェネッガー
  "「最後の3レップが筋肉を作る」— アーノルド・シュワルツェネッガー",
  "「痛みは弱さが体から出ていく感覚だ」— アーノルド・シュワルツェネッガー",
  "「筋肉は1日にしてならず」— アーノルド・シュワルツェネッガー",

  // CT・フレッチャー
  "「IT'S STILL YOUR MOTHA F***IN' SET!」— CT・フレッチャー",
  "「言い訳なんかいらない。やるかやらないかだ」— CT・フレッチャー",

  // その他
  "「筋肉は裏切らない」— 谷本道哉",
  "「ベンチプレス、それは人生」",
  "「迷ったら筋トレ」",
  "「プロテインは飲んだ？」",
  "「あと1レップ。これが効く」",
  "「今日のパンプは明日のサイズ」",
  "「重量は人格である」",
  "「ジムは嘘をつかない」",
  "「筋肉量は資産」",
  "「タンパク質は親友」",
  "「胸の日は休日」",
  "「足の日から逃げるな」",
];

// ── マッチョ用語の豆知識 ──
export const MACHO_TERMS: { term: string; meaning: string }[] = [
  { term: "パンプアップ", meaning: "筋肉に血液が充満してパンパンに張った状態。最高に気持ちいい" },
  { term: "オールアウト", meaning: "限界まで追い込むこと。これができてこそ本物" },
  { term: "RPE", meaning: "主観的運動強度。RPE10 = もう1レップもできない" },
  { term: "ドロップセット", meaning: "重量を下げながら連続で追い込む技。地獄" },
  { term: "ストリクト", meaning: "反動を使わず正しいフォームで挙げること" },
  { term: "チーティング", meaning: "反動を使って挙げる技術。上級者向け" },
  { term: "プログレッシブオーバーロード", meaning: "漸進的過負荷。少しずつ重量を増やす原則" },
  { term: "ハイパートロフィー", meaning: "筋肥大。8〜12レップが効果的" },
  { term: "コンパウンド種目", meaning: "複数関節を使う種目（BIG3など）。効率最強" },
  { term: "アイソレーション種目", meaning: "1関節のみの種目。フィニッシュに最適" },
  { term: "PR（パーソナルレコード）", meaning: "自己ベスト。これを更新するためにジムへ行く" },
  { term: "バルクアップ", meaning: "増量期。食って食って筋肉を作る" },
  { term: "カッティング", meaning: "減量期。脂肪を削って筋肉を浮き彫りに" },
  { term: "プラトー", meaning: "停滞期。誰もが通る道。乗り越えろ" },
  { term: "MTUT", meaning: "Time Under Tension（筋肉に負荷がかかる時間）" },
  { term: "Mind-Muscle Connection", meaning: "意識を筋肉に集中させる技術。効きが変わる" },
];

/** ランダムな名言を1つ取得 */
export function randomQuote(): string {
  return MACHO_QUOTES[Math.floor(Math.random() * MACHO_QUOTES.length)];
}

/** ランダムな用語を1つ取得（豆知識フォーマット） */
export function randomTerm(): string {
  const t = MACHO_TERMS[Math.floor(Math.random() * MACHO_TERMS.length)];
  return `💡 ${t.term}: ${t.meaning}`;
}

/** 名言 or 用語をランダムに返す（50/50） */
export function randomMachoLine(): string {
  return Math.random() < 0.5 ? randomQuote() : randomTerm();
}
