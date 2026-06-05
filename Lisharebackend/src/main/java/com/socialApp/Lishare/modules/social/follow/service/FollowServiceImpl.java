package com.socialApp.Lishare.modules.social.follow.service;

import com.socialApp.Lishare.modules.platform.common.enums.Role;
import com.socialApp.Lishare.modules.social.follow.service.FollowService;
import com.socialApp.Lishare.modules.social.follow.dto.FollowActionResponse;
import com.socialApp.Lishare.modules.social.follow.entity.Follow;
import com.socialApp.Lishare.modules.social.notification.entity.Notification;
import com.socialApp.Lishare.modules.platform.user.entity.User;
import com.socialApp.Lishare.modules.social.notification.entity.NotificationType;
import com.socialApp.Lishare.modules.social.notification.service.NotificationService;
import com.socialApp.Lishare.modules.social.follow.repository.FollowRepository;
import com.socialApp.Lishare.modules.platform.user.repository.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class FollowServiceImpl implements FollowService {

    private final FollowRepository followRepository;
    private final UserRepo userRepository;
    private final NotificationService notificationService;

    @Override
    public FollowActionResponse followUser(Long followerId, Long followingId) {

        if (followerId.equals(followingId)) {
            return new FollowActionResponse(false, "You cannot follow yourself");
        }

        if (followRepository.existsByFollowerUserIdAndFollowingUserId(followerId, followingId)) {
            return new FollowActionResponse(false, "Already following this user");
        }

        User follower = userRepository.findById(followerId)
                .orElseThrow(() -> new RuntimeException("Follower not found"));

        User following = userRepository.findById(followingId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Follow follow = Follow.builder()
                .follower(follower)
                .following(following)
                .build();

        followRepository.save(follow);

        Notification notification = Notification.builder()
                .user(following)
                .message(follower.getFirstname() + " " + follower.getLastName() + " followed you")
                .type(NotificationType.FOLLOW)
                .actorUser(follower)
                .referenceId(follower.getUserId())
                .referenceType("USER")
                .read(false)
                .build();

        notificationService.publish(notification);

        return new FollowActionResponse(true, "Followed successfully");
    }

    @Override
    public FollowActionResponse unfollowUser(Long followerId, Long followingId) {
        Follow follow = followRepository
                .findByFollowerUserIdAndFollowingUserId(followerId, followingId)
                .orElseThrow(() -> new RuntimeException("Not following this user"));

        followRepository.delete(follow);
        return new FollowActionResponse(true, "Unfollowed successfully");
    }

    @Override
    public boolean isFollowing(Long followerId, Long followingId) {
        if (followerId.equals(followingId)) return false;
        return followRepository.existsByFollowerUserIdAndFollowingUserId(followerId, followingId);
    }

    @Override
    public long getFollowersCount(Long userId) {
        return followRepository.countByFollowingUserId(userId);
    }

    @Override
    public long getFollowingCount(Long userId) {
        return followRepository.countByFollowerUserId(userId);
    }

    @Override
    public List<User> getFollowers(Long userId) {
        return followRepository.findByFollowingUserIdOrderByFollowedAtDesc(userId)
                .stream()
                .map(Follow::getFollower)
                .toList();
    }

    @Override
    public List<User> getFollowing(Long userId) {
        return followRepository.findByFollowerUserIdOrderByFollowedAtDesc(userId)
                .stream()
                .map(Follow::getFollowing)
                .toList();
    }

    @Override
    public List<User> searchUsers(String query, Long currentUserId) {
        String cleanQuery = query == null ? "" : query.trim();
        if (cleanQuery.isBlank()) return List.of();

        Map<Long, User> results = new LinkedHashMap<>();
        userRepository.searchUsers(cleanQuery, currentUserId)
                .forEach(user -> results.put(user.getUserId(), user));

        Role role = resolveRoleQuery(cleanQuery);
        if (role != null) {
            userRepository.findByRoleAndUserIdNot(role, currentUserId)
                    .forEach(user -> results.put(user.getUserId(), user));
        }

        return new ArrayList<>(results.values());
    }

    private Role resolveRoleQuery(String query) {
        String normalized = query.trim()
                .toUpperCase(Locale.ROOT)
                .replaceAll("[^A-Z0-9]+", "_")
                .replaceAll("^_+|_+$", "");
        if (normalized.isBlank()) return null;

        for (Role role : Role.values()) {
            String roleName = role.name();
            String shortName = roleName.replaceFirst("^ROLE_", "");
            if (roleName.equals(normalized) || shortName.equals(normalized)) {
                return role;
            }
        }

        return null;
    }
}
