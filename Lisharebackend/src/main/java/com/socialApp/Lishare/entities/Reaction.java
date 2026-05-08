package com.socialApp.Lishare.entities;


import jakarta.persistence.*;
import lombok.*;
import java.util.Date;

@Entity
@Table(
        name = "reactions",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "post_id"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Reaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long reactionId;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    // Many reactions belong to one post
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id")
    private Post post;

    @Column(nullable = false)
    private String type; // "like", "love", "care", "haha",

    private Date createdAt;
}
