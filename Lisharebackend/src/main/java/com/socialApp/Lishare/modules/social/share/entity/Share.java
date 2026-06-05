package com.socialApp.Lishare.modules.social.share.entity;

import com.socialApp.Lishare.modules.social.post.entity.Post;
import com.socialApp.Lishare.modules.platform.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "shares",
        indexes = {
                @Index(name = "idx_shares_user_id", columnList = "user_id"),
                @Index(name = "idx_shares_post_id", columnList = "post_id"),
                @Index(name = "idx_shares_created_at", columnList = "created_at")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Share {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long shareId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id")
    private Post post;

    @Column(name = "original_post_id")
    private Long originalPostId;

    @Column(name = "original_author_name", length = 300)
    private String originalAuthorName;

    @Column(name = "original_content", length = 2000)
    private String originalContent;

    @Column(name = "original_image_url", length = 600)
    private String originalImageUrl;

    @Column(name = "original_media_type", length = 20)
    private String originalMediaType;

    @Column(name = "original_post_deleted", nullable = false)
    private boolean originalPostDeleted;

    private String caption; // optional

    @Column(name = "post_value", length = 20)
    private String postValue;

    @Column(length = 30)
    private String audience;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        if (!this.originalPostDeleted) {
            this.originalPostDeleted = false;
        }
        if (this.audience == null || this.audience.isBlank()) {
            this.audience = "PUBLIC";
        }
    }
}
