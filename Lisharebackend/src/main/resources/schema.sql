-- Pre-JPA schema patch for existing PostgreSQL databases.
-- Ensures new social feed/story columns exist before Hibernate update runs.

ALTER TABLE IF EXISTS posts
    ADD COLUMN IF NOT EXISTS media_type VARCHAR(20);

ALTER TABLE IF EXISTS posts
    ADD COLUMN IF NOT EXISTS reel_view_count BIGINT DEFAULT 0;

UPDATE posts
SET reel_view_count = 0
WHERE reel_view_count IS NULL;

ALTER TABLE IF EXISTS posts
    ALTER COLUMN reel_view_count SET DEFAULT 0;

ALTER TABLE IF EXISTS posts
    ALTER COLUMN reel_view_count SET NOT NULL;

ALTER TABLE IF EXISTS posts
    ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP;

ALTER TABLE IF EXISTS shares
    ADD COLUMN IF NOT EXISTS original_post_id BIGINT;

ALTER TABLE IF EXISTS shares
    ADD COLUMN IF NOT EXISTS original_author_name VARCHAR(300);

ALTER TABLE IF EXISTS shares
    ADD COLUMN IF NOT EXISTS original_content VARCHAR(2000);

ALTER TABLE IF EXISTS shares
    ADD COLUMN IF NOT EXISTS original_image_url VARCHAR(600);

ALTER TABLE IF EXISTS shares
    ADD COLUMN IF NOT EXISTS original_media_type VARCHAR(20);

ALTER TABLE IF EXISTS shares
    ADD COLUMN IF NOT EXISTS original_post_deleted BOOLEAN DEFAULT FALSE;

UPDATE shares
SET original_post_deleted = FALSE
WHERE original_post_deleted IS NULL;

ALTER TABLE IF EXISTS shares
    ALTER COLUMN original_post_deleted SET DEFAULT FALSE;

ALTER TABLE IF EXISTS shares
    ALTER COLUMN original_post_deleted SET NOT NULL;

ALTER TABLE IF EXISTS shares
    ADD COLUMN IF NOT EXISTS post_value VARCHAR(20) DEFAULT 'medium';

UPDATE shares
SET post_value = 'medium'
WHERE post_value IS NULL;

ALTER TABLE IF EXISTS shares
    ALTER COLUMN post_value SET DEFAULT 'medium';

CREATE TABLE IF NOT EXISTS stories (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    source_post_id BIGINT REFERENCES posts(post_id) ON DELETE SET NULL,
    media_url VARCHAR(700) NOT NULL,
    media_type VARCHAR(20) NOT NULL,
    caption VARCHAR(1200),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    view_count BIGINT NOT NULL DEFAULT 0
);

ALTER TABLE IF EXISTS stories
    ADD COLUMN IF NOT EXISTS reshared_from_story_id BIGINT REFERENCES stories(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS stories
    ADD COLUMN IF NOT EXISTS reshared_from_owner_id BIGINT;

ALTER TABLE IF EXISTS stories
    ADD COLUMN IF NOT EXISTS reshared_from_owner_name VARCHAR(300);

CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at);
CREATE INDEX IF NOT EXISTS idx_stories_reshared_from_story_id ON stories(reshared_from_story_id);

CREATE TABLE IF NOT EXISTS story_reactions (
    id BIGSERIAL PRIMARY KEY,
    story_id BIGINT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_story_reactions_story_user UNIQUE (story_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_story_reactions_story_id ON story_reactions(story_id);
CREATE INDEX IF NOT EXISTS idx_story_reactions_type ON story_reactions(type);

CREATE TABLE IF NOT EXISTS story_views (
    id BIGSERIAL PRIMARY KEY,
    story_id BIGINT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    viewed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_story_views_story_user UNIQUE (story_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_story_views_story_id ON story_views(story_id);
