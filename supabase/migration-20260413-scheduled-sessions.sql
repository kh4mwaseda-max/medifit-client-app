-- Migration: 予約・セッション管理テーブル
-- 2026-04-13
-- Run this in Supabase SQL Editor

create table if not exists scheduled_sessions (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references trainers(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  scheduled_at timestamptz not null,
  duration_min integer not null default 60,
  notes text,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
  created_at timestamptz default now()
);

create index if not exists idx_scheduled_sessions_trainer on scheduled_sessions(trainer_id);
create index if not exists idx_scheduled_sessions_client on scheduled_sessions(client_id);
create index if not exists idx_scheduled_sessions_at on scheduled_sessions(scheduled_at);
