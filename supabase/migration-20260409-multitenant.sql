-- ============================================================
-- マルチテナント対応マイグレーション 2026-04-09
-- Supabase SQL Editor で実行してください
-- ============================================================

-- trainers テーブルに列追加
ALTER TABLE trainers ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE trainers ADD COLUMN IF NOT EXISTS password_hash text;
ALTER TABLE trainers ADD COLUMN IF NOT EXISTS plan text DEFAULT 'free' CHECK (plan IN ('free', 'pro'));
ALTER TABLE trainers ADD COLUMN IF NOT EXISTS line_channel_access_token text;
ALTER TABLE trainers ADD COLUMN IF NOT EXISTS line_channel_secret text;
ALTER TABLE trainers ADD COLUMN IF NOT EXISTS line_notify_user_id text; -- トレーナー自身のLINE ID（通知用）
ALTER TABLE trainers ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 既存トレーナー（masaya4887 でログインしていたアカウント）を移行
-- パスワード "masaya4887" の SHA-256 ハッシュ
-- SELECT encode(sha256('masaya4887'), 'hex'); → 下記の値
UPDATE trainers
SET
  name         = '稲川雅也',
  password_hash = encode(sha256('masaya4887'::bytea), 'hex'),
  plan         = 'pro'
WHERE id = '3072f02e-d70e-4e3a-a67b-55e88981351c';

-- email がまだ設定されていない場合に備えて
UPDATE trainers
SET email = 'kh4mwaseda@gmail.com'
WHERE id = '3072f02e-d70e-4e3a-a67b-55e88981351c'
  AND (email IS NULL OR email = '');
