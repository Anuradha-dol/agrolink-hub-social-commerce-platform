package com.socialApp.Lishare.repos;

import com.socialApp.Lishare.dtos.FriendStatus;
import com.socialApp.Lishare.entities.Friend;
import com.socialApp.Lishare.entities.User;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FriendRepository extends JpaRepository<Friend, Long> {

    @Query("""
        SELECT f FROM Friend f
        WHERE (f.sender = :user1 AND f.receiver = :user2)
           OR (f.sender = :user2 AND f.receiver = :user1)
    """)
    Optional<Friend> findFriendship(@Param("user1") User user1,
                                    @Param("user2") User user2);

    List<Friend> findByReceiverAndStatus(User receiver, FriendStatus status);

    List<Friend> findBySenderAndStatus(User sender, FriendStatus status);

    // New: fetch all accepted friendships for a user
    @Query("""
        SELECT f FROM Friend f
        WHERE f.status = 'ACCEPTED'
          AND (f.sender = :user OR f.receiver = :user)
    """)
    List<Friend> findAcceptedFriends(@Param("user") User user);

    @Modifying
    @Transactional
    @Query("DELETE FROM Friend f WHERE f.sender.userId = :userId OR f.receiver.userId = :userId")
    void deleteAllUserFriends(@Param("userId") Long userId);
}




