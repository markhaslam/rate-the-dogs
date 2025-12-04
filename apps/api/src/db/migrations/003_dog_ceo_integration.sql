-- Migration 003: Dog CEO Integration + Analytics + User Enhancements
-- Combined migration for Dog CEO support, analytics fields, and user system prep

-- =============================================================================
-- DOG CEO INTEGRATION
-- =============================================================================

-- Add Dog CEO fields to breeds table
ALTER TABLE breeds ADD COLUMN dog_ceo_path TEXT;
ALTER TABLE breeds ADD COLUMN image_count INTEGER DEFAULT 0;
ALTER TABLE breeds ADD COLUMN last_synced_at TEXT;

-- Add Dog CEO fields to dogs table
-- image_url stores the direct URL for Dog CEO images
-- image_source distinguishes between 'dog_ceo' and 'user_upload'
ALTER TABLE dogs ADD COLUMN image_url TEXT;
ALTER TABLE dogs ADD COLUMN image_source TEXT DEFAULT 'user_upload';

-- Index for filtering by image source
CREATE INDEX IF NOT EXISTS idx_dogs_image_source ON dogs(image_source);

-- Index for breed sync timestamp
CREATE INDEX IF NOT EXISTS idx_breeds_last_synced ON breeds(last_synced_at);

-- =============================================================================
-- ANALYTICS ENHANCEMENTS
-- =============================================================================

-- Add user agent to ratings for browser/device analytics
ALTER TABLE ratings ADD COLUMN user_agent TEXT;

-- Add user agent tracking to anonymous users
ALTER TABLE anonymous_users ADD COLUMN user_agent TEXT;

-- =============================================================================
-- USER SYSTEM ENHANCEMENTS (Phase 2 Prep)
-- =============================================================================

-- Add updated_at for profile changes
ALTER TABLE users ADD COLUMN updated_at TEXT DEFAULT (datetime('now'));

-- Add email verification flag
ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0;

-- Add OAuth provider field (for future providers like GitHub, Discord)
ALTER TABLE users ADD COLUMN provider TEXT DEFAULT 'google';

-- Link anonymous user to registered user (for merging ratings)
ALTER TABLE users ADD COLUMN linked_anon_id TEXT;

-- Index for finding users by linked anon ID
CREATE INDEX IF NOT EXISTS idx_users_linked_anon ON users(linked_anon_id);
