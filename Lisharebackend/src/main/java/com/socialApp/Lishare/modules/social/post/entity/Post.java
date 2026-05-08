package com.socialApp.Lishare.modules.social.post.entity;

import com.socialApp.Lishare.modules.social.comment.entity.Comment;
import com.socialApp.Lishare.modules.social.reaction.entity.Reaction;
import com.socialApp.Lishare.modules.social.share.entity.Share;
import com.socialApp.Lishare.modules.platform.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(
        name = "posts",
        indexes = {
                @Index(name = "idx_posts_user_id", columnList = "user_id"),
                @Index(name = "idx_posts_created_at", columnList = "created_at")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long postId;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User user;



    @Column(length = 2000)
    private String content;

    private String imageUrl;

    @Column(length = 20)
    private String mediaType;

    @Column(name = "reel_view_count", nullable = false, columnDefinition = "BIGINT DEFAULT 0")
    private Long reelViewCount;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "edited_at")
    private LocalDateTime editedAt;

    // Comments cascade
    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Comment> comments;

    // Shares cascade
    @OneToMany(mappedBy = "post")
    private List<Share> shares;

    // Reactions cascade
    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Reaction> reactions;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.reelViewCount == null) {
            this.reelViewCount = 0L;
        }
    }

    // Convenience getter for frontend
    public String getAuthorName() {
        return user.getFirstname() + " " + user.getLastName();
    }
}
