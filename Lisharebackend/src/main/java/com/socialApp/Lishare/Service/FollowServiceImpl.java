package com.socialApp.Lishare.Service;

import com.socialApp.Lishare.Service.interfaces.FollowService;
import com.socialApp.Lishare.dtos.postdTOs.FollowActionResponse;
import com.socialApp.Lishare.entities.Follow;
import com.socialApp.Lishare.entities.Notification;
import com.socialApp.Lishare.entities.User;
import com.socialApp.Lishare.repos.FollowRepository;
import com.socialApp.Lishare.repos.NotificationRepository;
import com.socialApp.Lishare.repos.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FollowServiceImpl implements FollowService {

    private final FollowRepository followRepository;
    private final UserRepo userRepository;
    private final NotificationRepository notificationRepository;

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
                .read(false)
                .build();

        notificationRepository.save(notification);

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
        return userRepository.searchUsers(query, currentUserId);
    }
}
