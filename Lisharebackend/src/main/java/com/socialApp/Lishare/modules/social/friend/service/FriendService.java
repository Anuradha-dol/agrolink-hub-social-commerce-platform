package com.socialApp.Lishare.modules.social.friend.service;

import com.socialApp.Lishare.modules.platform.user.entity.User;
import com.socialApp.Lishare.modules.social.friend.dto.FriendActionResponse;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface FriendService {

    // Send a friend request
    FriendActionResponse sendFriendRequest(Long senderId, Long receiverId);

    // Accept a friend request
    FriendActionResponse acceptFriendRequest(Long senderId, Long receiverId);

    // Reject a friend request
    FriendActionResponse rejectFriendRequest(Long senderId, Long receiverId);

    // Remove a friend (unfriend)
    FriendActionResponse unfriend(Long user1Id, Long user2Id);

    // Get all accepted friends of a user
    List<User> getFriends(Long userId);

    // Get all pending friend requests for a user
    List<User> getPendingRequests(Long userId);

    // Get all outgoing pending friend requests for a user
    List<User> getSentRequests(Long userId);



}

