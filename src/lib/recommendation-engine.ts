// recommendation-engine.ts
// PHRデータ → 提案・リスク分析エンジン
// NOTE: API呼び出し部分は Claude API クレジット補充後に実装

export interface SupplementRecommendation {
  name: string;              // "プロテイン（ホエイ）"
  reason: string;            // "タンパク質摂取量が目標の68%に留まっています"
  timing: string;            // "トレーニング後30分以内"
  priority: "high" | "medium" | "low";
  affiliate_keyword?: string; // 将来のEC連携用キーワード
}

export interface FoodRecommendation {
  food_name: string;         // "鶏むね肉"
  reason: string;
  target_amount: string;     // "1日200g目安"
  priority: "high" | "medium" | "low";
}

export interface HealthRisk {
  category: "obesity" | "musculoskeletal" | "nutrition" | "sleep" | "cardiovascular";
  label: string;             // "内臓脂肪蓄積リスク"
  level: "low" | "medium" | "high";
  current_score: number;     // 0-100
  description: string;       // "直近30日の体脂肪率が上昇傾向..."
}

export interface ImprovementAction {
  risk_category: HealthRisk["category"];
  action: string;            // "週3回 有酸素20分（ウォーキング or 自転車）"
  risk_reduction_pct: number; // 40 → "40%軽減見込み"
  timeline_weeks: number;    // 効果が出るまでの週数
  timeline_description: string; // "3週間で体重-1kg目安"
  difficulty: "easy" | "medium" | "hard";
}

export interface RecommendationResult {
  generated_at: string;      // ISO 8601
  supplements: SupplementRecommendation[];
  foods: FoodRecommendation[];
  risks: HealthRisk[];
  actions: ImprovementAction[];
  overall_score: number;     // 0-100 総合健康スコア
  summary: string;           // 全体サマリー文
}

// PHRデータの入力型
export interface PHRInput {
  client: {
    name: string;
    goal: string | null;
    start_date: string;
  };
  latest_body: {
    weight_kg: number | null;
    body_fat_pct: number | null;
    muscle_mass_kg: number | null;
    blood_pressure_sys: number | null;
    blood_pressure_dia: number | null;
    sleep_hours: number | null;
    condition_score: number | null;
  } | null;
  body_trend: { weight_kg: number | null; body_fat_pct: number | null; recorded_at: string }[];
  training_sessions: {
    session_date: string;
    training_sets: { exercise_name: string; weight_kg: number | null; reps: number | null }[];
  }[];
  meal_summary: {
    avg_calories: number | null;
    avg_protein_g: number | null;
    avg_fat_g: number | null;
    avg_carbs_g: number | null;
  } | null;
}

// TODO: Claude API クレジット補充後に実装
export async function generateRecommendation(_input: PHRInput): Promise<RecommendationResult> {
  throw new Error("NOT_IMPLEMENTED: Claude API クレジットを補充後に実装してください");
}

// モックデータ（開発・UI確認用）
export function getMockRecommendation(): RecommendationResult {
  return {
    generated_at: new Date().toISOString(),
    overall_score: 72,
    summary:
      "タンパク質摂取量の不足とトレーニングボリュームの安定が課題です。睡眠の質を改善することで、筋肉合成と回復効率が大きく向上する見込みです。",
    supplements: [
      {
        name: "ホエイプロテイン",
        reason: "直近7日の平均タンパク質摂取量が目標値の約65%に留まっています",
        timing: "トレーニング後30分以内 / 起床直後",
        priority: "high",
        affiliate_keyword: "ホエイプロテイン おすすめ",
      },
      {
        name: "クレアチン（モノハイドレート）",
        reason: "筋力向上・トレーニングボリューム増加に有効。摂取記録なし",
        timing: "毎日同じ時間に3〜5g",
        priority: "medium",
        affiliate_keyword: "クレアチン モノハイドレート",
      },
      {
        name: "マグネシウム",
        reason: "睡眠スコアが7未満の日が多く、睡眠の質改善に効果的",
        timing: "就寝30分前に200〜300mg",
        priority: "medium",
      },
    ],
    foods: [
      {
        food_name: "鶏むね肉",
        reason: "高タンパク・低脂質で目標達成に最適。コスパも良い",
        target_amount: "1日200〜300g",
        priority: "high",
      },
      {
        food_name: "卵",
        reason: "良質なタンパク質とビタミンDを同時に補給できる",
        target_amount: "1日2〜3個",
        priority: "high",
      },
      {
        food_name: "オートミール",
        reason: "朝食の炭水化物源として血糖値を安定させる。食物繊維も豊富",
        target_amount: "50g/日（朝食）",
        priority: "medium",
      },
    ],
    risks: [
      {
        category: "nutrition",
        label: "栄養バランスリスク",
        level: "high",
        current_score: 42,
        description:
          "タンパク質摂取が慢性的に不足しています。筋肉合成が阻害され、トレーニング効果が落ちている可能性があります。",
      },
      {
        category: "sleep",
        label: "睡眠・疲労リスク",
        level: "medium",
        current_score: 58,
        description:
          "平均睡眠スコアが6.2/10。睡眠不足はコルチゾール上昇を招き、筋肉分解を促進します。",
      },
      {
        category: "musculoskeletal",
        label: "筋骨格系リスク",
        level: "low",
        current_score: 78,
        description:
          "トレーニング頻度・フォームは良好。直近30日でボリューム5%増加を確認。",
      },
      {
        category: "obesity",
        label: "生活習慣病リスク",
        level: "low",
        current_score: 82,
        description: "体重・体脂肪率ともに正常範囲内。血圧も安定しています。",
      },
    ],
    actions: [
      {
        risk_category: "nutrition",
        action: "毎食にタンパク質源（肉・魚・卵・大豆）を必ず1品追加する",
        risk_reduction_pct: 55,
        timeline_weeks: 3,
        timeline_description: "3週間でタンパク質摂取量が目標値に近づき、筋肉合成効率が改善",
        difficulty: "easy",
      },
      {
        risk_category: "sleep",
        action: "就寝1時間前のスマホ・PC使用を止め、マグネシウムを摂取する",
        risk_reduction_pct: 40,
        timeline_weeks: 2,
        timeline_description: "2週間で睡眠の質に自覚的な変化が出始める",
        difficulty: "easy",
      },
      {
        risk_category: "musculoskeletal",
        action: "週1回ストレッチ・モビリティワークを30分確保する",
        risk_reduction_pct: 25,
        timeline_weeks: 4,
        timeline_description: "4週間で関節可動域と動作効率が向上",
        difficulty: "medium",
      },
    ],
  };
}
