package com.socialApp.Lishare.modules.social.share.service;

import com.socialApp.Lishare.modules.platform.user.entity.User;
import com.socialApp.Lishare.modules.platform.user.repository.UserRepo;
import com.socialApp.Lishare.modules.social.follow.repository.FollowRepository;
import com.socialApp.Lishare.modules.social.friend.entity.Friend;
import com.socialApp.Lishare.modules.social.friend.repository.FriendRepository;
import com.socialApp.Lishare.modules.social.notification.entity.Notification;
import com.socialApp.Lishare.modules.social.notification.entity.NotificationType;
import com.socialApp.Lishare.modules.social.notification.service.NotificationService;
import com.socialApp.Lishare.modules.social.post.entity.Post;
import com.socialApp.Lishare.modules.social.post.repository.PostRepository;
import com.socialApp.Lishare.modules.social.share.dto.FeedResponse;
import com.socialApp.Lishare.modules.social.share.entity.Share;
import com.socialApp.Lishare.modules.social.share.repository.ShareRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class ShareServiceImpl implements ShareService {

    private final ShareRepository shareRepository;
    private final UserRepo userRepository;
    private final PostRepository postRepository;
    private final NotificationService notificationService;
    private final FollowRepository followRepository;
    private final FriendRepository friendRepository;

    @Override
    @Transactional
    public Share sharePost(Long userId, Long postId, String caption, boolean notifyFollowers, List<Long> mentionedUserIds, String postValue) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        Share share = Share.builder()
                .user(user)
                .post(post)
                .caption(caption)
                .originalPostId(post.getPostId())
                .originalAuthorName(post.getAuthorName())
                .originalContent(post.getContent())
                .originalImageUrl(post.getImageUrl())
                .originalMediaType(post.getMediaType())
                .originalPostDeleted(false)
                .postValue(normalizePostValue(postValue))
                .build();

        Share savedShare = shareRepository.save(share);

        User postOwner = post.getUser();
        if (!postOwner.getUserId().equals(userId)) {
            notificationService.publish(Notification.builder()
                    .user(postOwner)
                    .actorUser(user)
                    .type(NotificationType.SYSTEM)
                    .referenceId(post.getPostId())
                    .referenceType("POST")
                    .message(user.getFirstname() + " shared your post")
                    .read(false)
                    .build());
        }

        if (notifyFollowers) {
            notifyFollowersAndFriendsOnShare(savedShare);
        }
        notifyMentionedUsers(savedShare, mentionedUserIds);
        return savedShare;
    }

    @Override
    public List<FeedResponse> getFullFeed() {
        List<Post> posts = postRepository.findAll();
        List<Share> shares = shareRepository.findAllByOrderByCreatedAtDesc();

        List<FeedResponse> postFeed = posts.stream()
                .map(post -> FeedResponse.builder()
                        .type("POST")
                        .postId(post.getPostId())
                        .authorId(post.getUser().getUserId())
                        .authorName(post.getAuthorName())
                        .content(post.getContent())
                        .imageUrl(post.getImageUrl())
                        .mediaType(post.getMediaType())
                        .reelViewCount(post.getReelViewCount())
                        .createdAt(post.getCreatedAt())
                        .build())
                .toList();

        List<FeedResponse> shareFeed = shares.stream()
                .map(share -> {
                    Post originalPost = share.getPost();
                    boolean originalDeleted = originalPost == null || share.isOriginalPostDeleted();
                    Long originalPostId = originalPost != null ? originalPost.getPostId() : share.getOriginalPostId();
                    String originalAuthor = originalPost != null ? originalPost.getAuthorName() : share.getOriginalAuthorName();
                    String originalContent = originalPost != null ? originalPost.getContent() : share.getOriginalContent();
                    String originalImage = originalPost != null ? originalPost.getImageUrl() : share.getOriginalImageUrl();
                    String mediaType = originalPost != null ? originalPost.getMediaType() : share.getOriginalMediaType();
                    Long reelViewCount = originalPost != null ? originalPost.getReelViewCount() : 0L;

                    if (originalDeleted && (originalContent == null || originalContent.isBlank())) {
                        originalContent = "Original post deleted by author";
                    }

                    return FeedResponse.builder()
                            .type("SHARE")
                            .shareId(share.getShareId())
                            .postId(share.getShareId())
                            .originalPostId(originalPostId)
                            .originalPostDeleted(originalDeleted)
                            .authorId(originalPost != null && originalPost.getUser() != null ? originalPost.getUser().getUserId() : null)
                            .authorName(originalAuthor)
                            .content(originalContent)
                            .imageUrl(originalImage)
                            .mediaType(mediaType)
                            .reelViewCount(reelViewCount)
                            .sharedById(share.getUser().getUserId())
                            .sharedByName(share.getUser().getFirstname() + " " + share.getUser().getLastName())
                            .shareCaption(share.getCaption())
                            .postValue(share.getPostValue())
                            .sharedAt(share.getCreatedAt())
                            .build();
                })
                .toList();

        return Stream.concat(postFeed.stream(), shareFeed.stream())
                .sorted((a, b) -> {
                    LocalDateTime timeA = "SHARE".equals(a.getType()) ? a.getSharedAt() : a.getCreatedAt();
                    LocalDateTime timeB = "SHARE".equals(b.getType()) ? b.getSharedAt() : b.getCreatedAt();
                    if (timeA == null && timeB == null) return 0;
                    if (timeA == null) return 1;
                    if (timeB == null) return -1;
                    return timeB.compareTo(timeA);
                })
                .toList();
    }

    @Override
    @Transactional
    public void deleteShare(Long userId, Long shareId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Share share = shareRepository.findById(shareId)
                .orElseThrow(() -> new RuntimeException("Share not found"));

        if (!share.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("You cannot delete this share");
        }
        shareRepository.delete(share);
    }

    private void notifyFollowersAndFriendsOnShare(Share share) {
        User actor = share.getUser();
        Long actorId = actor.getUserId();
        Set<Long> audienceUserIds = new LinkedHashSet<>();

        followRepository.findByFollowingUserIdOrderByFollowedAtDesc(actorId)
                .forEach(follow -> audienceUserIds.add(follow.getFollower().getUserId()));

        List<Friend> acceptedFriends = friendRepository.findAcceptedFriends(actor);
        for (Friend friend : acceptedFriends) {
            Long friendId = friend.getSender().getUserId().equals(actorId)
                    ? friend.getReceiver().getUserId()
                    : friend.getSender().getUserId();
            audienceUserIds.add(friendId);
        }

        for (Long recipientId : audienceUserIds) {
            if (recipientId.equals(actorId)) continue;
            User recipient = userRepository.findById(recipientId).orElse(null);
            if (recipient == null) continue;

            notificationService.publish(Notification.builder()
                    .user(recipient)
                    .actorUser(actor)
                    .type(NotificationType.SYSTEM)
                    .referenceId(share.getShareId())
                    .referenceType("SHARE")
                    .message(actor.getFirstname() + " shared a post")
                    .read(false)
                    .build());
        }
    }

    private void notifyMentionedUsers(Share share, List<Long> mentionedUserIds) {
        if (mentionedUserIds == null || mentionedUserIds.isEmpty()) {
            return;
        }

        User actor = share.getUser();
        Long actorId = actor.getUserId();
        Set<Long> uniqueMentionIds = new LinkedHashSet<>(mentionedUserIds);

        for (Long mentionedUserId : uniqueMentionIds) {
            if (mentionedUserId == null || mentionedUserId.equals(actorId)) continue;
            User mentionedUser = userRepository.findById(mentionedUserId).orElse(null);
            if (mentionedUser == null) continue;

            notificationService.publish(Notification.builder()
                    .user(mentionedUser)
                    .actorUser(actor)
                    .type(NotificationType.SYSTEM)
                    .referenceId(share.getShareId())
                    .referenceType("SHARE_MENTION")
                    .message(actor.getFirstname() + " mentioned you in a shared post")
                    .read(false)
                    .build());
        }
    }

    private String normalizePostValue(String postValue) {
        if (postValue == null || postValue.isBlank()) {
            return "medium";
        }
        String normalized = postValue.trim().toLowerCase(Locale.ROOT);
        if (normalized.equals("top") || normalized.equals("medium") || normalized.equals("low")) {
            return normalized;
        }
        return "medium";
    }
}
