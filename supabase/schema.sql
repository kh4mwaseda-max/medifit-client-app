-- medifit client app schema
-- Run this in Supabase SQL Editor

-- トレーナーテーブル
create table if not exists trainers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz default now()
);

-- クライアントテーブル
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid references trainers(id) on delete cascade not null,
  name text not null,
  pin text not null,
  goal text,
  start_date date not null default current_date,
  line_user_id text unique,          -- LINE公式アカウントから連携したユーザーID
  created_at timestamptz default now()
);

-- LINE解析ログテーブル（スクショ受信・解析結果を記録）
create table if not exists line_parse_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade not null,
  line_message_id text not null,
  app_type text check (app_type in ('asken', 'kintore', 'unknown')) not null,
  raw_json jsonb,                    -- Claudeが抽出した生データ
  status text check (status in ('success', 'failed')) not null,
  error_message text,
  created_at timestamptz default now()
);

-- 身体記録テーブル
create table if not exists body_records (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade not null,
  recorded_at date not null,
  weight_kg numeric(5,2),
  body_fat_pct numeric(4,1),
  muscle_mass_kg numeric(5,2),
  systolic_bp integer,
  diastolic_bp integer,
  resting_heart_rate integer,
  sleep_hours numeric(3,1),
  sleep_quality integer check (sleep_quality between 1 and 10),
  condition_score integer check (condition_score between 1 and 10),
  water_ml integer,
  created_at timestamptz default now()
);

-- トレーニングセッションテーブル
create table if not exists training_sessions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade not null,
  session_date date not null,
  notes text,
  created_at timestamptz default now()
);

-- トレーニングセットテーブル
create table if not exists training_sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references training_sessions(id) on delete cascade not null,
  exercise_name text not null,
  muscle_group text,
  weight_kg numeric(6,2),
  reps integer,
  set_number integer not null,
  rpe numeric(3,1) check (rpe between 1 and 10),
  created_at timestamptz default now()
);

-- 食事記録テーブル
create table if not exists meal_records (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade not null,
  meal_date date not null,
  meal_type text check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')) not null,
  food_name text not null,
  calories integer,
  protein_g numeric(6,1),
  fat_g numeric(6,1),
  carbs_g numeric(6,1),
  created_at timestamptz default now()
);

-- ボディフォトテーブル
create table if not exists body_photos (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade not null,
  photo_date date not null,
  pose text check (pose in ('front', 'back', 'side')) not null,
  storage_path text not null,
  weight_kg numeric(5,2),
  created_at timestamptz default now()
);

-- アセスメントテーブル
create table if not exists assessments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade not null,
  generated_at timestamptz not null default now(),
  published_at timestamptz,
  current_summary text not null,
  prediction_1m text not null,
  prediction_3m text not null,
  risk_obesity text check (risk_obesity in ('low', 'medium', 'high')) not null,
  risk_musculoskeletal text check (risk_musculoskeletal in ('low', 'medium', 'high')) not null,
  risk_nutrition text check (risk_nutrition in ('low', 'medium', 'high')) not null,
  risk_sleep text check (risk_sleep in ('low', 'medium', 'high')) not null,
  action_plan text not null,
  trainer_notes text,
  created_at timestamptz default now()
);

-- Supabase Storage バケット（手動でUIから作成 or CLI）
-- bucket name: body-photos (public: false)

-- RLS ポリシー（service_role keyを使う場合は不要だが念のため）
alter table clients enable row level security;
alter table body_records enable row level security;
alter table training_sessions enable row level security;
alter table training_sets enable row level security;
alter table meal_records enable row level security;
alter table body_photos enable row level security;
alter table assessments enable row level security;

-- service_role はすべてのテーブルにフルアクセス可能（デフォルト動作）
