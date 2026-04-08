-- migration-20260408-onboarding.sql
-- オンボーディング・目標設定・トレーナー方針 対応

-- ── clients テーブル拡張 ─────────────────────────────────────────
alter table clients add column if not exists height_cm numeric(5,1);
alter table clients add column if not exists gender text check (gender in ('male', 'female', 'other'));
alter table clients add column if not exists birth_year smallint;
alter table clients add column if not exists health_concerns text;
-- onboarding_step: null | pending_height | pending_weight | pending_body_fat
--                  pending_age | pending_gender | pending_health | intake_done
alter table clients add column if not exists onboarding_step text;
alter table clients add column if not exists intake_completed_at timestamptz;

-- ── client_goals テーブル（トレーナーが設定する詳細目標） ──────────
create table if not exists client_goals (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade not null,
  trainer_id uuid references trainers(id) on delete cascade not null,

  -- 栄養目標
  daily_calories_kcal integer,
  daily_protein_g     numeric(6,1),
  daily_fat_g         numeric(6,1),
  daily_carbs_g       numeric(6,1),

  -- トレーニング目標
  weekly_training_sessions integer,
  recommended_exercises    text[],        -- ['ベンチプレス','スクワット',...]

  -- 身体目標
  target_weight_kg    numeric(5,2),
  target_body_fat_pct numeric(4,1),
  target_muscle_kg    numeric(5,2),
  target_date         date,

  -- ロードマップ（クライアントに送るプランテキスト）
  roadmap_text text,
  sent_at      timestamptz,               -- LINEに送信した日時

  trainer_notes text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- 1クライアントにつき最新ゴールが1件（upsert用にuniqueは不要、INSERT+DELETEで管理）

-- ── trainer_policies テーブル（AI解析に反映する指導方針） ──────────
create table if not exists trainer_policies (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid references trainers(id) on delete cascade unique not null,

  -- 指導スタイル: muscle_gain | fat_loss | health | athletic | rehab
  coaching_style text,
  -- 食事アプローチ: low_carb | calorie_restriction | balanced | high_protein | intuitive
  dietary_approach text,
  -- サプリ方針: recommended | neutral | food_first
  supplement_stance text,
  -- AIアドバイスの口調: strict | encouraging | medical | friendly
  ai_tone text,
  -- 自由記述（プロンプトに追加される）
  custom_instructions text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table client_goals     enable row level security;
alter table trainer_policies enable row level security;

-- line_parse_logs の app_type check を拡張（meal/training/body/cardio を追加）
-- NOTE: 既存の check制約を一度削除して付け直す
alter table line_parse_logs
  drop constraint if exists line_parse_logs_app_type_check;

alter table line_parse_logs
  add constraint line_parse_logs_app_type_check
  check (app_type in ('meal','training','body','cardio','unknown','asken','kintore'));
