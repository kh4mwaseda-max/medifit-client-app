// health-data-connector.ts
// 外部ヘルスデータソースとの連携型定義・統合レイヤー
// 対応予定: マイナポータル / Apple Health / Google Fit / Garmin / Withings

// ── マイナポータル連携データ ──────────────────────────────────

/** 特定健診情報（年1回の健康診断結果） */
export interface HealthCheckResult {
  source: "myna_portal";
  exam_date: string;               // YYYY-MM-DD
  institution_name: string | null; // 受診医療機関名

  // 身体計測
  height_cm: number | null;
  weight_kg: number | null;
  bmi: number | null;
  waist_cm: number | null;

  // 血圧
  systolic_bp: number | null;
  diastolic_bp: number | null;

  // 血液検査（脂質）
  total_cholesterol: number | null;   // mg/dL
  ldl_cholesterol: number | null;
  hdl_cholesterol: number | null;
  triglycerides: number | null;

  // 血糖
  fasting_glucose: number | null;    // mg/dL
  hba1c: number | null;              // %

  // 肝機能
  ast: number | null;                // GOT U/L
  alt: number | null;                // GPT U/L
  gamma_gtp: number | null;

  // 腎機能
  creatinine: number | null;
  egfr: number | null;

  // 尿検査
  urine_protein: "(-)" | "(±)" | "(+)" | "(2+)" | "(3+)" | null;
  urine_glucose: "(-)" | "(±)" | "(+)" | "(2+)" | "(3+)" | null;
}

/** 薬剤情報（おくすり履歴） */
export interface MedicationRecord {
  source: "myna_portal";
  dispensed_date: string;           // YYYY-MM-DD
  drug_name: string;
  dosage: string;                   // "1回1錠 1日3回"
  days_supplied: number | null;
  pharmacy_name: string | null;
  condition_category: string | null; // "高血圧" "糖尿病" 等
}

/** 予防接種記録 */
export interface VaccinationRecord {
  source: "myna_portal";
  vaccine_name: string;
  vaccinated_date: string;
  lot_number: string | null;
  institution_name: string | null;
}

/** マイナポータル統合データ */
export interface MynaPortalData {
  connected: boolean;
  last_synced_at: string | null;
  health_checks: HealthCheckResult[];
  medications: MedicationRecord[];
  vaccinations: VaccinationRecord[];
}

// ── Apple Health / Google Fit ────────────────────────────────

export interface WearableData {
  source: "apple_health" | "google_fit" | "garmin" | "withings" | "polar";
  recorded_at: string;
  steps: number | null;
  active_energy_kcal: number | null;
  resting_heart_rate: number | null;
  heart_rate_variability_ms: number | null; // HRV
  spo2_pct: number | null;                 // 血中酸素
  sleep_hours: number | null;
  deep_sleep_hours: number | null;
  rem_sleep_hours: number | null;
}

// ── 統合PHRビュー ─────────────────────────────────────────────

/** クライアントの全ヘルスデータを統合したビュー */
export interface IntegratedPHR {
  client_id: string;
  myna_portal: MynaPortalData | null;
  wearable: WearableData[];

  // Client Fit内部データ（既存）
  body_records: any[];
  training_sessions: any[];
  meal_records: any[];
}

// ── 将来の連携ソース定義 ─────────────────────────────────────

export const DATA_SOURCES = [
  {
    id: "myna_portal",
    name: "マイナポータル",
    description: "健康診断結果・薬歴・予防接種記録",
    status: "planned",           // planned | in_review | available
    api_provider: "デジタル庁",
    connector: "PocketSign MynaConnect",
    data_types: ["健康診断", "薬剤情報", "予防接種"],
    priority: 1,
  },
  {
    id: "apple_health",
    name: "Apple ヘルスケア",
    description: "歩数・心拍数・睡眠・血中酸素",
    status: "planned",
    api_provider: "Apple",
    connector: "HealthKit API",
    data_types: ["歩数", "心拍数", "HRV", "睡眠", "SpO2"],
    priority: 2,
  },
  {
    id: "google_fit",
    name: "Google Fit",
    description: "活動量・心拍数・ワークアウト",
    status: "planned",
    api_provider: "Google",
    connector: "Fitness REST API",
    data_types: ["活動量", "心拍数", "ワークアウト"],
    priority: 3,
  },
  {
    id: "garmin",
    name: "Garmin Connect",
    description: "GPS・VO2max・詳細睡眠・HRV",
    status: "planned",
    api_provider: "Garmin",
    connector: "Garmin Health API",
    data_types: ["GPS", "VO2max", "睡眠", "HRV", "ストレス"],
    priority: 4,
  },
  {
    id: "withings",
    name: "Withings",
    description: "体重・体組成・血圧・心電図",
    status: "planned",
    api_provider: "Withings",
    connector: "Withings Health API",
    data_types: ["体重", "体組成", "血圧", "心電図"],
    priority: 5,
  },
] as const;

export type DataSourceId = (typeof DATA_SOURCES)[number]["id"];

// ── モックデータ（デモ用） ────────────────────────────────────

export function getMockMynaPortalData(): MynaPortalData {
  return {
    connected: true,
    last_synced_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    health_checks: [
      {
        source: "myna_portal",
        exam_date: "2025-10-15",
        institution_name: "神戸市東灘区 住吉健診クリニック",
        height_cm: 174,
        weight_kg: 78.2,
        bmi: 25.8,
        waist_cm: 84,
        systolic_bp: 122,
        diastolic_bp: 78,
        total_cholesterol: 195,
        ldl_cholesterol: 118,
        hdl_cholesterol: 58,
        triglycerides: 95,
        fasting_glucose: 98,
        hba1c: 5.4,
        ast: 22,
        alt: 28,
        gamma_gtp: 31,
        creatinine: 0.89,
        egfr: 88,
        urine_protein: "(-)",
        urine_glucose: "(-)",
      },
    ],
    medications: [
      {
        source: "myna_portal",
        dispensed_date: "2025-09-20",
        drug_name: "ビタミンD3製剤（コレカルシフェロール）",
        dosage: "1回1カプセル 1日1回",
        days_supplied: 90,
        pharmacy_name: "住吉調剤薬局",
        condition_category: "ビタミンD欠乏",
      },
    ],
    vaccinations: [
      {
        source: "myna_portal",
        vaccine_name: "インフルエンザワクチン",
        vaccinated_date: "2025-10-28",
        lot_number: "FL2025-001",
        institution_name: "住吉ファミリークリニック",
      },
    ],
  };
}
