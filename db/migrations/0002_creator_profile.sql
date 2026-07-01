-- ============================================================================
-- Creator profile — the questionnaire a creator fills out about themselves.
--
-- Run this in the Supabase SQL editor (or via the Supabase CLI). It is
-- idempotent — safe to run more than once. RLS on `profiles` already covers
-- this column (users manage their own row), so no new policy is needed.
-- ============================================================================

-- The creator analog of profiles.brand_profile: a JSONB blob holding the
-- creator's handle, bio, media channels, demographic, content categories, and
-- values. Consumed via lib/creator.ts (parseCreatorProfile, creatorCompleteness).
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS creator_profile jsonb;
