-- ============================================================================
-- social_accounts — connected social/analytics accounts (OAuth tokens)
--
-- Every "Connect" flow (app/api/social/<platform>/callback) upserts a row here
-- with onConflict: 'user_id,platform', so the UNIQUE (user_id, platform)
-- constraint below is REQUIRED for those upserts to work.
--
-- Run this in the Supabase SQL editor (or via the Supabase CLI). It is
-- idempotent — safe to run more than once, and safe if the table already
-- exists (it only adds anything missing).
-- ============================================================================

CREATE TABLE IF NOT EXISTS social_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  platform text NOT NULL,           -- 'linkedin' | 'x' | 'facebook' | 'instagram' | 'tiktok' | 'google' | ...
  username text,                    -- display handle/name shown on the Connect + Profile pages
  platform_user_id text,            -- the platform's own user id (e.g. LinkedIn `sub` URN)
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,     -- set by platforms whose access tokens expire (Google/YouTube/Pinterest/Snapchat)
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, platform)
);

-- Backfill any missing columns / constraint if the table pre-existed.
ALTER TABLE social_accounts ADD COLUMN IF NOT EXISTS username text;
ALTER TABLE social_accounts ADD COLUMN IF NOT EXISTS platform_user_id text;
ALTER TABLE social_accounts ADD COLUMN IF NOT EXISTS access_token text;
ALTER TABLE social_accounts ADD COLUMN IF NOT EXISTS refresh_token text;
ALTER TABLE social_accounts ADD COLUMN IF NOT EXISTS token_expires_at timestamptz;
ALTER TABLE social_accounts ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

DO $$ BEGIN
  ALTER TABLE social_accounts ADD CONSTRAINT social_accounts_user_platform_key
    UNIQUE (user_id, platform);
EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL; END $$;

-- Row-level security: each user can only see/manage their own connected
-- accounts. Server routes that write tokens use the service-role key
-- (createAdminClient), which bypasses RLS.
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users manage own social accounts" ON social_accounts
    FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
