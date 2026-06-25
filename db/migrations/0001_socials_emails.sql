-- ============================================================================
-- Socials page redesign + Email list / website sync
--
-- Run this in the Supabase SQL editor (or via the Supabase CLI). It is
-- idempotent — safe to run more than once.
-- ============================================================================

-- --- profiles: ensure the Stripe-driven plan columns exist -------------------
-- The Stripe webhook (app/api/webhooks/stripe) writes the resolved tier here.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id text;

-- --- scheduled_posts: the "draft" status (composer Draft button) -------------
CREATE TABLE IF NOT EXISTS scheduled_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  image_url text,
  platforms text[] NOT NULL DEFAULT '{}',
  scheduled_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'published', 'failed', 'draft')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users manage own posts" ON scheduled_posts
    FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Backfill the draft status onto any pre-existing CHECK constraint.
ALTER TABLE scheduled_posts DROP CONSTRAINT IF EXISTS scheduled_posts_status_check;
ALTER TABLE scheduled_posts ADD CONSTRAINT scheduled_posts_status_check
  CHECK (status IN ('scheduled', 'published', 'failed', 'draft'));

-- --- contacts: the email list (reused by /api/email/import-contacts) ---------
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  name text DEFAULT '',
  subscribed boolean NOT NULL DEFAULT true,
  source text NOT NULL DEFAULT 'manual',
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, email)
);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual';
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users manage own contacts" ON contacts
    FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- --- scheduled_emails: email composer drafts / scheduled sends ---------------
CREATE TABLE IF NOT EXISTS scheduled_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  audience text NOT NULL DEFAULT 'all',     -- 'all' | a contacts.source value
  send_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'sent', 'failed')),
  recipient_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE scheduled_emails ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users manage own emails" ON scheduled_emails
    FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- --- ingest_keys: per-user API key for website -> email-list sync ------------
-- Pro/Agency only. The public endpoint /api/public/contacts authenticates with
-- this token and upserts into `contacts`.
CREATE TABLE IF NOT EXISTS ingest_keys (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE ingest_keys ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users read own ingest key" ON ingest_keys
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-- Writes happen via the service-role key (server actions), which bypasses RLS.
