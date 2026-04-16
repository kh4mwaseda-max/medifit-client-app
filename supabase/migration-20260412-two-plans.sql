-- Migration: 2プランデザイン対応 + トレーナーLINE連携コード + 個人プランオンボーディング
-- 2026-04-12
-- Run this in Supabase SQL Editor

-- ────────────────────────────────────────────────────────────
-- trainers テーブル拡張
-- ────────────────────────────────────────────────────────────

-- LINE連携コード（トレーナーが自分のLINEを紐付けるための一時コード）
alter table trainers
  add column if not exists line_link_code text,
  add column if not exists line_link_code_expires_at timestamptz;

-- user_type（既存マイグレーションで追加済みの場合はスキップ）
alter table trainers
  add column if not exists user_type text default 'trainer' check (user_type in ('trainer', 'individual'));

-- ────────────────────────────────────────────────────────────
-- clients テーブル拡張（招待フロー用）
-- ────────────────────────────────────────────────────────────

alter table clients
  add column if not exists invite_token text unique,
  add column if not exists invite_expires_at timestamptz;

-- ────────────────────────────────────────────────────────────
-- clients テーブル拡張（個人プランオンボーディング用）
-- ────────────────────────────────────────────────────────────

-- コース選択（5種）
alter table clients
  add column if not exists course text check (course in ('減量', 'ボディメイク', 'バルクアップ', '健康維持', '大会準備'));

-- 身体基本情報（オンボーディング + LINE問診で埋まる）
alter table clients
  add column if not exists height_cm numeric(5,1),
  add column if not exists birth_year integer,
  add column if not exists gender text check (gender in ('male', 'female', 'other')),
  add column if not exists health_concerns text;

-- オンボーディング進行管理
alter table clients
  add column if not exists onboarding_step text,
  add column if not exists intake_completed_at timestamptz,
  add column if not exists pending_image_data jsonb;

-- ────────────────────────────────────────────────────────────
-- client_goals テーブル（既存マイグレーションで作成済みの場合はスキップ）
-- ────────────────────────────────────────────────────────────

create table if not exists client_goals (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade not null,
  trainer_id uuid references trainers(id) on delete cascade not null,
  daily_calories_kcal integer,
  daily_protein_g numeric(6,1),
  daily_fat_g numeric(6,1),
  daily_carbs_g numeric(6,1),
  weekly_training_sessions integer,
  recommended_exercises text[],
  target_weight_kg numeric(5,2),
  target_body_fat_pct numeric(4,1),
  target_muscle_kg numeric(5,2),
  target_date date,
  roadmap_text text,
  nutrition_advice text,
  trainer_notes text,
  created_at timestamptz default now()
);

alter table client_goals enable row level security;

-- ────────────────────────────────────────────────────────────
-- UPSERT用ユニーク制約（既存の場合はスキップ）
-- ────────────────────────────────────────────────────────────

-- body_records: (client_id, recorded_at) でupsert
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'body_records_client_id_recorded_at_key'
  ) then
    alter table body_records add constraint body_records_client_id_recorded_at_key unique (client_id, recorded_at);
  end if;
end $$;

-- meal_records: (client_id, meal_date, meal_type, food_name) でupsert
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'meal_records_upsert_key'
  ) then
    alter table meal_records add constraint meal_records_upsert_key unique (client_id, meal_date, meal_type, food_name);
  end if;
end $$;

-- training_sets: (session_id, exercise_name, set_number) でupsert
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'training_sets_upsert_key'
  ) then
    alter table training_sets add constraint training_sets_upsert_key unique (session_id, exercise_name, set_number);
  end if;
end $$;

-- ────────────────────────────────────────────────────────────
-- line_parse_logs: app_type制約を拡張（新アプリタイプ対応）
-- ────────────────────────────────────────────────────────────

alter table line_parse_logs
  drop constraint if exists line_parse_logs_app_type_check;

alter table line_parse_logs
  add constraint line_parse_logs_app_type_check
  check (app_type in ('meal', 'training', 'body', 'cardio', 'unknown'));
