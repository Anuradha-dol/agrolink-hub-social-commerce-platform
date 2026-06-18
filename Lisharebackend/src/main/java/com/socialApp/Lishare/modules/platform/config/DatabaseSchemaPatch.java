package com.socialApp.Lishare.modules.platform.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DatabaseSchemaPatch implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Value("${app.schema.patch.enabled:true}")
    private boolean schemaPatchEnabled;

    @Override
    public void run(ApplicationArguments args) {
        if (!schemaPatchEnabled) {
            return;
        }

        List<String> statements = List.of(
                // posts
                "ALTER TABLE posts ADD COLUMN IF NOT EXISTS media_type VARCHAR(20)",
                "ALTER TABLE posts ADD COLUMN IF NOT EXISTS reel_view_count BIGINT NOT NULL DEFAULT 0",
                "ALTER TABLE posts ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP",

                // shares
                "ALTER TABLE shares ADD COLUMN IF NOT EXISTS original_post_id BIGINT",
                "ALTER TABLE shares ADD COLUMN IF NOT EXISTS original_author_name VARCHAR(300)",
                "ALTER TABLE shares ADD COLUMN IF NOT EXISTS original_content VARCHAR(2000)",
                "ALTER TABLE shares ADD COLUMN IF NOT EXISTS original_image_url VARCHAR(600)",
                "ALTER TABLE shares ADD COLUMN IF NOT EXISTS original_media_type VARCHAR(20)",
                "ALTER TABLE shares ADD COLUMN IF NOT EXISTS original_post_deleted BOOLEAN NOT NULL DEFAULT FALSE",
                "ALTER TABLE shares ADD COLUMN IF NOT EXISTS post_value VARCHAR(20) DEFAULT 'medium'",

                // chatbot knowledge base
                """
                CREATE TABLE IF NOT EXISTS concepts (
                    id BIGSERIAL PRIMARY KEY,
                    topic VARCHAR(255),
                    keywords TEXT,
                    description TEXT
                )
                """,
                "ALTER TABLE concepts ADD COLUMN IF NOT EXISTS keywords TEXT",
                "ALTER TABLE concepts ADD COLUMN IF NOT EXISTS description TEXT",

                // stories
                """
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
                )
                """,
                "CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id)",
                "CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON stories(expires_at)",
                "CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at)",

                // story reactions
                """
                CREATE TABLE IF NOT EXISTS story_reactions (
                    id BIGSERIAL PRIMARY KEY,
                    story_id BIGINT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
                    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                    type VARCHAR(20) NOT NULL,
                    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                    CONSTRAINT uq_story_reactions_story_user UNIQUE (story_id, user_id)
                )
                """,
                "CREATE INDEX IF NOT EXISTS idx_story_reactions_story_id ON story_reactions(story_id)",
                "CREATE INDEX IF NOT EXISTS idx_story_reactions_type ON story_reactions(type)",

                // story views
                """
                CREATE TABLE IF NOT EXISTS story_views (
                    id BIGSERIAL PRIMARY KEY,
                    story_id BIGINT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
                    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                    viewed_at TIMESTAMP NOT NULL DEFAULT NOW(),
                    CONSTRAINT uq_story_views_story_user UNIQUE (story_id, user_id)
                )
                """,
                "CREATE INDEX IF NOT EXISTS idx_story_views_story_id ON story_views(story_id)"
        );

        for (String statement : statements) {
            try {
                jdbcTemplate.execute(statement);
            } catch (Exception exception) {
                log.warn("Schema patch statement failed: {}", statement, exception);
            }
        }
    }
}
