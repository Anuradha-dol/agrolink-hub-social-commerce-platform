package com.socialApp.Lishare.modules.social.comment.entity;

import com.socialApp.Lishare.modules.platform.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.util.Date;

@Entity
@Table(
        name = "comment_reactions",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "comment_id"}),
        indexes = {
                @Index(name = "idx_comment_reactions_comment_id", columnList = "comment_id"),
                @Index(name = "idx_comment_reactions_type", columnList = "type")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommentReaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long commentReactionId;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comment_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Comment comment;

    @Column(nullable = false, length = 20)
    private String type;

    @Column(name = "created_at")
    private Date createdAt;
}
