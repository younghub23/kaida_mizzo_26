-- ============================================================================
-- Message attachments
--
-- Run in the Supabase SQL editor (or via the CLI). Idempotent.
--
-- Adds an optional image attachment URL to messages. Files are uploaded to the
-- public 'post-images' storage bucket (reused via /api/upload-post-image); the
-- resulting public URL is stored here. RLS on messages already restricts rows to
-- the two conversation participants.
-- ============================================================================

ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_url text;
