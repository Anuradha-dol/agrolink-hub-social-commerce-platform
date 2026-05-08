package com.socialApp.Lishare.entities;

import com.socialApp.Lishare.dtos.FriendStatus;
import jakarta.persistence.*;
import lombok.*;

import java.util.Date;

@Entity
@Table(
        name = "friends",
        uniqueConstraints = @UniqueConstraint(columnNames = {"sender_id", "receiver_id"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Friend {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long friendId;

    @ManyToOne
    @JoinColumn(name = "sender_id")
    private User sender;

    @ManyToOne
    @JoinColumn(name = "receiver_id")
    private User receiver;

    @Enumerated(EnumType.STRING)
    private FriendStatus status;

    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;


}


