-- Migration: LINE画像送信カウント（月次）テーブル
-- 2026-04-14
-- Run this in Supabase SQL Editor

-- トレーナーごとの月次LINE画像送信カウントテーブル
create table if not exists line_image_usage (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references trainers(id) on delete cascade,
  year_month text not null, -- 例: '2026-04'
  count integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(trainer_id, year_month)
);

create index if not exists idx_line_image_usage_trainer on line_image_usage(trainer_id);
create index if not exists idx_line_image_usage_year_month on line_image_usage(year_month);

-- updated_at を自動更新するトリガー
create or replace function update_line_image_usage_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_line_image_usage_updated_at
  before update on line_image_usage
  for each row execute function update_line_image_usage_updated_at();
