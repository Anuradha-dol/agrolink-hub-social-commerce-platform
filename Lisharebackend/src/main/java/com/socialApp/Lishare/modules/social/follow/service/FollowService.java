package com.socialApp.Lishare.modules.social.follow.service;

import com.socialApp.Lishare.modules.social.follow.dto.FollowActionResponse;
import com.socialApp.Lishare.modules.platform.user.entity.User;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface FollowService {

    FollowActionResponse followUser(Long followerId, Long followingId);

    FollowActionResponse unfollowUser(Long followerId, Long followingId);

    boolean isFollowing(Long followerId, Long followingId);

    long getFollowersCount(Long userId);

    long getFollowingCount(Long userId);

    List<User> getFollowers(Long userId);

    List<User> getFollowing(Long userId);

    List<User> searchUsers(String query, Long currentUserId);


}
