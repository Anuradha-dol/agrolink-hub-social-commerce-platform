package com.socialApp.Lishare.modules.social.share.service;

import com.socialApp.Lishare.modules.platform.user.entity.User;
import com.socialApp.Lishare.modules.platform.user.repository.UserBlockRepository;
import com.socialApp.Lishare.modules.platform.user.repository.UserRepo;
import com.socialApp.Lishare.modules.social.follow.repository.FollowRepository;
import com.socialApp.Lishare.modules.social.friend.dto.FriendStatus;
import com.socialApp.Lishare.modules.social.friend.entity.Friend;
import com.socialApp.Lishare.modules.social.friend.repository.FriendRepository;
import com.socialApp.Lishare.modules.social.notification.entity.Notification;
import com.socialApp.Lishare.modules.social.notification.entity.NotificationType;
import com.socialApp.Lishare.modules.social.notification.service.NotificationService;
import com.socialApp.Lishare.modules.social.post.dto.PollVoterResponse;
import com.socialApp.Lishare.modules.social.post.entity.Post;
import com.socialApp.Lishare.modules.social.post.repository.PostRepository;
import com.socialApp.Lishare.modules.social.post.service.PostService;
import com.socialApp.Lishare.modules.social.post.support.PostXpPolicy;
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
    private final PostService postService;
    private final UserBlockRepository userBlockRepository;

    @Override
    @Transactional
    public Share sharePost(Long userId, Long postId, String caption, boolean notifyFollowers, List<Long> mentionedUserIds, String postValue, String audience) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        if (!canViewPost(post, user)) {
            throw new RuntimeException("You cannot share a post outside your audience");
        }

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
                .audience(normalizeAudience(audience))
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
    public List<FeedResponse> getFullFeed(Long viewerUserId) {
        User viewer = viewerUserId == null ? null : userRepository.findById(viewerUserId).orElse(null);
        List<Post> posts = postRepository.findAll();
        List<Share> shares = shareRepository.findAllByOrderByCreatedAtDesc();

        List<FeedResponse> postFeed = posts.stream()
                .filter(post -> canViewPost(post, viewer))
                .map(post -> {
                    List<Long> pollVotes = postService.getPollVotes(post);
                    return FeedResponse.builder()
                        .type("POST")
                        .postId(post.getPostId())
                        .authorId(post.getUser().getUserId())
                        .authorName(post.getAuthorName())
                        .content(post.getContent())
                        .imageUrl(post.getImageUrl())
                        .mediaType(post.getMediaType())
                        .mediaUrls(postService.getMediaUrls(post))
                        .mediaTypes(postService.getMediaTypes(post))
                        .category(resolvePostCategory(post))
                        .audience(normalizeAudience(post.getAudience()))
                        .feeling(post.getFeeling())
                        .locationName(post.getLocationName())
                        .pollQuestion(post.getPollQuestion())
                        .pollOptions(postService.getPollOptions(post))
                        .pollVotes(pollVotes)
                        .pollTotalVotes(pollVotes.stream().mapToLong(Long::longValue).sum())
                        .allowMultipleVotes(Boolean.TRUE.equals(post.getAllowMultipleVotes()))
                        .viewerPollOptionIndex(postService.getViewerPollOptionIndex(post, viewerUserId))
                        .viewerPollOptionIndexes(postService.getViewerPollOptionIndexes(post, viewerUserId))
                        .pollVoters(postService.getPollVoters(post))
                        .xpAwarded(resolvePostXp(post))
                        .authorVerifiedXp(calculateVerifiedXp(post.getUser()))
                        .reelViewCount(post.getReelViewCount())
                        .authorProfileImageUrl(post.getUser().getImageUrl())
                        .createdAt(post.getCreatedAt())
                        .build();
                })
                .toList();

        List<FeedResponse> shareFeed = shares.stream()
                .filter(share -> canViewShare(share, viewer))
                .map(share -> {
                    Post originalPost = share.getPost();
                    boolean originalDeleted = originalPost == null || share.isOriginalPostDeleted();
                    Long originalPostId = originalPost != null ? originalPost.getPostId() : share.getOriginalPostId();
                    String originalAuthor = originalPost != null ? originalPost.getAuthorName() : share.getOriginalAuthorName();
                    String originalContent = originalPost != null ? originalPost.getContent() : share.getOriginalContent();
                    String originalImage = originalPost != null ? originalPost.getImageUrl() : share.getOriginalImageUrl();
                    String mediaType = originalPost != null ? originalPost.getMediaType() : share.getOriginalMediaType();
                    List<String> mediaUrls = originalPost != null ? postService.getMediaUrls(originalPost) : List.of();
                    List<String> mediaTypes = originalPost != null ? postService.getMediaTypes(originalPost) : List.of();
                    String category = originalPost != null ? resolvePostCategory(originalPost) : null;
                    String audience = originalPost != null ? normalizeAudience(originalPost.getAudience()) : null;
                    String feeling = originalPost != null ? originalPost.getFeeling() : null;
                    String locationName = originalPost != null ? originalPost.getLocationName() : null;
                    String pollQuestion = originalPost != null ? originalPost.getPollQuestion() : null;
                    List<String> pollOptions = originalPost != null ? postService.getPollOptions(originalPost) : List.of();
                    List<Long> pollVotes = originalPost != null ? postService.getPollVotes(originalPost) : List.of();
                    Boolean allowMultipleVotes = originalPost != null && Boolean.TRUE.equals(originalPost.getAllowMultipleVotes());
                    List<PollVoterResponse> pollVoters = originalPost != null ? postService.getPollVoters(originalPost) : List.of();
                    Integer xpAwarded = originalPost != null ? resolvePostXp(originalPost) : null;
                    Long authorVerifiedXp = originalPost != null && originalPost.getUser() != null
                            ? calculateVerifiedXp(originalPost.getUser())
                            : null;
                    Long reelViewCount = originalPost != null ? originalPost.getReelViewCount() : 0L;
                    String originalAuthorProfileImage = originalPost != null && originalPost.getUser() != null
                            ? originalPost.getUser().getImageUrl()
                            : null;

                    if (originalDeleted) {
                        originalContent = null;
                        originalImage = null;
                        mediaType = null;
                        mediaUrls = List.of();
                        mediaTypes = List.of();
                        category = null;
                        audience = null;
                        feeling = null;
                        locationName = null;
                        pollQuestion = null;
                        pollOptions = List.of();
                        pollVotes = List.of();
                        allowMultipleVotes = false;
                        pollVoters = List.of();
                        xpAwarded = null;
                        authorVerifiedXp = null;
                        reelViewCount = 0L;
                        originalAuthorProfileImage = null;
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
                            .mediaUrls(mediaUrls)
                            .mediaTypes(mediaTypes)
                            .category(category)
                            .audience(audience)
                            .feeling(feeling)
                            .locationName(locationName)
                            .pollQuestion(pollQuestion)
                            .pollOptions(pollOptions)
                            .pollVotes(pollVotes)
                            .pollTotalVotes(pollVotes.stream().mapToLong(Long::longValue).sum())
                            .allowMultipleVotes(allowMultipleVotes)
                            .viewerPollOptionIndex(originalPost != null ? postService.getViewerPollOptionIndex(originalPost, viewerUserId) : null)
                            .viewerPollOptionIndexes(originalPost != null ? postService.getViewerPollOptionIndexes(originalPost, viewerUserId) : List.of())
                            .pollVoters(pollVoters)
                            .xpAwarded(xpAwarded)
                            .authorVerifiedXp(authorVerifiedXp)
                            .sharedByVerifiedXp(calculateVerifiedXp(share.getUser()))
                            .reelViewCount(reelViewCount)
                            .authorProfileImageUrl(originalAuthorProfileImage)
                            .sharedById(share.getUser().getUserId())
                            .sharedByName(share.getUser().getFirstname() + " " + share.getUser().getLastName())
                            .sharedByProfileImageUrl(share.getUser().getImageUrl())
                            .shareCaption(share.getCaption())
                            .postValue(share.getPostValue())
                            .shareAudience(normalizeAudience(share.getAudience()))
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

    private boolean canViewShare(Share share, User viewer) {
        if (share == null || share.getUser() == null) {
            return false;
        }
        User sharer = share.getUser();
        boolean shareAudienceVisible = canViewAudience(share.getAudience(), viewer, sharer);
        if (!shareAudienceVisible) {
            return false;
        }
        Post originalPost = share.getPost();
        boolean originalDeleted = originalPost == null || share.isOriginalPostDeleted();
        return originalDeleted || canViewPost(originalPost, viewer);
    }

    private boolean canViewPost(Post post, User viewer) {
        if (post == null || post.getUser() == null) {
            return false;
        }
        User author = post.getUser();
        if (viewer == null) {
            return "PUBLIC".equals(normalizeAudience(post.getAudience()));
        }
        if (author.getUserId().equals(viewer.getUserId())) {
            return true;
        }
        if (userBlockRepository.hasBlockBetween(viewer.getUserId(), author.getUserId())) {
            return false;
        }
        return canViewAudience(post.getAudience(), viewer, author);
    }

    private boolean canViewAudience(String audience, User viewer, User owner) {
        String normalized = normalizeAudience(audience);
        if (owner == null) {
            return false;
        }
        if ("PUBLIC".equals(normalized)) {
            return viewer == null || !userBlockRepository.hasBlockBetween(viewer.getUserId(), owner.getUserId());
        }
        if (viewer == null) {
            return false;
        }
        if (owner.getUserId().equals(viewer.getUserId())) {
            return true;
        }
        if (userBlockRepository.hasBlockBetween(viewer.getUserId(), owner.getUserId())) {
            return false;
        }
        boolean friend = isAcceptedFriend(viewer, owner);
        boolean follower = followRepository.existsByFollowerUserIdAndFollowingUserId(viewer.getUserId(), owner.getUserId());
        return switch (normalized) {
            case "FRIENDS" -> friend;
            case "FOLLOWERS" -> follower;
            case "FRIENDS_FOLLOWERS" -> friend || follower;
            default -> true;
        };
    }

    private boolean isAcceptedFriend(User user1, User user2) {
        if (user1 == null || user2 == null) {
            return false;
        }
        return friendRepository.findFriendship(user1, user2)
                .map(Friend::getStatus)
                .filter(FriendStatus.ACCEPTED::equals)
                .isPresent();
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

    private String normalizeAudience(String audience) {
        if (audience == null || audience.isBlank()) {
            return "PUBLIC";
        }
        String normalized = audience.trim().toUpperCase(Locale.ROOT).replace('-', '_');
        if (normalized.equals("FRIENDS_AND_FOLLOWERS") || normalized.equals("FOLLOWERS_FRIENDS")) {
            return "FRIENDS_FOLLOWERS";
        }
        if (normalized.equals("PUBLIC") || normalized.equals("FRIENDS") || normalized.equals("FOLLOWERS") || normalized.equals("FRIENDS_FOLLOWERS")) {
            return normalized;
        }
        return "PUBLIC";
    }

    private long calculateVerifiedXp(User user) {
        if (user == null) {
            return 0L;
        }
        return postRepository.findByUser(user).stream()
                .mapToLong(this::resolvePostXp)
                .sum();
    }

    private int resolvePostXp(Post post) {
        if (post.getXpAwarded() != null && post.getXpAwarded() > 0) {
            return post.getXpAwarded();
        }
        return PostXpPolicy.xpForCategory(post.getCategory());
    }

    private String resolvePostCategory(Post post) {
        return post.getCategory() == null || post.getCategory().isBlank() ? "GENERAL" : post.getCategory();
    }
}
