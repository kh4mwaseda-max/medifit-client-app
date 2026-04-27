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

-- 画像カウントの原子的インクリメント関数（race condition 防止）
-- src/lib/line-usage.ts から supabase.rpc("increment_line_image_count", ...) で呼ばれる
create or replace function increment_line_image_count(p_trainer_id uuid, p_year_month text)
returns integer as $$
declare
  v_count integer;
begin
  insert into line_image_usage (trainer_id, year_month, count)
  values (p_trainer_id, p_year_month, 1)
  on conflict (trainer_id, year_month) do update
    set count = line_image_usage.count + 1,
        updated_at = now()
  returning count into v_count;
  return v_count;
end;
$$ language plpgsql;
