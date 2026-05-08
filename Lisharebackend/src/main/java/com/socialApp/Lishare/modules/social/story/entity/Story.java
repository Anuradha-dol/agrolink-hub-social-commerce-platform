package com.socialApp.Lishare.modules.social.story.entity;

import com.socialApp.Lishare.modules.platform.user.entity.User;
import com.socialApp.Lishare.modules.social.post.entity.Post;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(
        name = "stories",
        indexes = {
                @Index(name = "idx_stories_user_id", columnList = "user_id"),
                @Index(name = "idx_stories_expires_at", columnList = "expires_at"),
                @Index(name = "idx_stories_created_at", columnList = "created_at")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Story {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_post_id")
    private Post sourcePost;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reshared_from_story_id")
    private Story resharedFromStory;

    @Column(name = "reshared_from_owner_id")
    private Long resharedFromOwnerId;

    @Column(name = "reshared_from_owner_name", length = 300)
    private String resharedFromOwnerName;

    @Column(name = "media_url", nullable = false, length = 700)
    private String mediaUrl;

    @Column(name = "media_type", nullable = false, length = 20)
    private String mediaType;

    @Column(length = 1200)
    private String caption;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "view_count", nullable = false)
    private Long viewCount;

    @OneToMany(mappedBy = "story", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<StoryReaction> reactions;

    @OneToMany(mappedBy = "story", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<StoryView> views;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.viewCount == null) {
            this.viewCount = 0L;
        }
    }
}
