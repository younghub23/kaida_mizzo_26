-- ============================================================================
-- Content Marketplace + Messages
--
-- Run this in the Supabase SQL editor (or via the Supabase CLI). It is
-- idempotent — safe to run more than once.
--
-- Adds:
--   1. A widened profiles.plan CHECK (so the Stripe webhook can persist the
--      'creator' plan and the 'past_due' billing state).
--   2. profiles.account_type + profiles.marketplace_visible for the directory,
--      backfilled from auth metadata.
--   3. conversations + messages tables (1:1 brand<->creator DMs) with
--      participant-only RLS, plus realtime on messages.
-- ============================================================================

-- --- profiles.plan: allow the creator plan + billing states --------------------
-- The original constraint only permitted the four business tiers, which made
-- writing 'creator' (creator base plan) or 'past_due' (failed payment) fail.
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_plan_check
  CHECK (plan = ANY (ARRAY[
    'free', 'starter', 'growth', 'pro', 'agency', 'creator', 'past_due'
  ]));

-- --- profiles: marketplace discoverability + queryable account type ------------
-- account_type is authoritative in auth.users.user_metadata, but the directory
-- needs to filter/list by it in SQL, so we denormalize a copy here. The app
-- keeps it in sync on dashboard load (see app/(dashboard)/layout.tsx).
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_type text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS marketplace_visible boolean NOT NULL DEFAULT true;

-- Backfill account_type from auth metadata for existing rows (defaults to
-- 'business', the unchanged experience, when unset).
UPDATE profiles p
SET account_type = COALESCE(NULLIF(u.raw_user_meta_data->>'account_type', ''), 'business')
FROM auth.users u
WHERE u.id = p.id AND (p.account_type IS NULL OR p.account_type = '');

-- --- conversations: one row per 1:1 DM thread ---------------------------------
-- Participants are stored in a canonical order (user_low < user_high) with a
-- unique constraint so a given pair never gets duplicate threads.
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_low uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_high uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz NOT NULL DEFAULT now(),
  last_message_preview text NOT NULL DEFAULT '',
  CONSTRAINT conversations_distinct_users CHECK (user_low <> user_high),
  CONSTRAINT conversations_ordered_users CHECK (user_low < user_high),
  UNIQUE (user_low, user_high)
);
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Participants read conversations" ON conversations
    FOR SELECT USING (auth.uid() = user_low OR auth.uid() = user_high);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Participants create conversations" ON conversations
    FOR INSERT WITH CHECK (auth.uid() = user_low OR auth.uid() = user_high);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Participants update conversations" ON conversations
    FOR UPDATE USING (auth.uid() = user_low OR auth.uid() = user_high);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- --- messages: individual DMs within a conversation ---------------------------
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);
CREATE INDEX IF NOT EXISTS messages_conversation_idx
  ON messages (conversation_id, created_at);
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- A message is readable/insertable only by the two participants of its thread.
DO $$ BEGIN
  CREATE POLICY "Participants read messages" ON messages
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM conversations c
        WHERE c.id = messages.conversation_id
          AND (auth.uid() = c.user_low OR auth.uid() = c.user_high)
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Sender inserts messages" ON messages
    FOR INSERT WITH CHECK (
      auth.uid() = sender_id AND
      EXISTS (
        SELECT 1 FROM conversations c
        WHERE c.id = messages.conversation_id
          AND (auth.uid() = c.user_low OR auth.uid() = c.user_high)
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-- Participants can update messages in their thread (used to set read_at).
DO $$ BEGIN
  CREATE POLICY "Participants update messages" ON messages
    FOR UPDATE USING (
      EXISTS (
        SELECT 1 FROM conversations c
        WHERE c.id = messages.conversation_id
          AND (auth.uid() = c.user_low OR auth.uid() = c.user_high)
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- --- realtime: broadcast new/updated messages to open threads -----------------
-- Enables the live chat (client subscribes to postgres_changes on messages).
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE messages;
EXCEPTION
  WHEN duplicate_object THEN NULL;   -- already in the publication
  WHEN undefined_object THEN NULL;   -- publication doesn't exist (non-Supabase)
END $$;
