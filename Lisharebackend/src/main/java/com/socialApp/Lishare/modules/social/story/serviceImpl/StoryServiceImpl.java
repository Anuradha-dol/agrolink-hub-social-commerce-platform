package com.socialApp.Lishare.modules.social.story.serviceImpl;

import com.socialApp.Lishare.modules.platform.user.entity.User;
import com.socialApp.Lishare.modules.platform.user.repository.UserRepo;
import com.socialApp.Lishare.modules.social.chat.dto.ConversationSummaryResponse;
import com.socialApp.Lishare.modules.social.chat.dto.MessageRequest;
import com.socialApp.Lishare.modules.social.chat.service.ChatConversationService;
import com.socialApp.Lishare.modules.social.follow.repository.FollowRepository;
import com.socialApp.Lishare.modules.social.friend.dto.FriendStatus;
import com.socialApp.Lishare.modules.social.friend.entity.Friend;
import com.socialApp.Lishare.modules.social.friend.repository.FriendRepository;
import com.socialApp.Lishare.modules.social.notification.entity.Notification;
import com.socialApp.Lishare.modules.social.notification.entity.NotificationType;
import com.socialApp.Lishare.modules.social.notification.service.NotificationService;
import com.socialApp.Lishare.modules.social.post.entity.Post;
import com.socialApp.Lishare.modules.social.post.repository.PostRepository;
import com.socialApp.Lishare.modules.social.story.dto.StoryResponse;
import com.socialApp.Lishare.modules.social.story.entity.Story;
import com.socialApp.Lishare.modules.social.story.entity.StoryReaction;
import com.socialApp.Lishare.modules.social.story.entity.StoryView;
import com.socialApp.Lishare.modules.social.story.repository.StoryReactionRepository;
import com.socialApp.Lishare.modules.social.story.repository.StoryRepository;
import com.socialApp.Lishare.modules.social.story.repository.StoryViewRepository;
import com.socialApp.Lishare.modules.social.story.service.StoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class StoryServiceImpl implements StoryService {

    private final StoryRepository storyRepository;
    private final StoryReactionRepository storyReactionRepository;
    private final StoryViewRepository storyViewRepository;
    private final UserRepo userRepository;
    private final PostRepository postRepository;
    private final FollowRepository followRepository;
    private final FriendRepository friendRepository;
    private final ChatConversationService chatConversationService;
    private final NotificationService notificationService;

    @Value("${file.upload-dir}")
    private String uploadDir;

    @Override
    @Transactional
    public StoryResponse createStory(Long userId, MultipartFile media, String caption, Long sourcePostId, Integer expiresInHours, Boolean notifyFollowers) {
        User owner = getUser(userId);

        Post sourcePost = null;
        String mediaUrl = null;
        String mediaType = null;

        if (sourcePostId != null) {
            sourcePost = postRepository.findById(sourcePostId)
                    .orElseThrow(() -> new RuntimeException("Source post not found"));
            mediaUrl = sourcePost.getImageUrl();
            mediaType = sourcePost.getMediaType();
        }

        if (media != null && !media.isEmpty()) {
            mediaUrl = saveMedia(media);
            mediaType = resolveMediaType(media, mediaUrl);
        }

        if (mediaUrl == null || mediaUrl.isBlank()) {
            throw new RuntimeException("Story media is required");
        }
        if (mediaType == null || mediaType.isBlank()) {
            mediaType = "IMAGE";
        }

        int ttlHours = (expiresInHours == null || expiresInHours <= 0) ? 24 : Math.min(expiresInHours, 72);
        Story story = Story.builder()
                .user(owner)
                .sourcePost(sourcePost)
                .mediaUrl(mediaUrl)
                .mediaType(mediaType.toUpperCase())
                .caption(caption != null ? caption.trim() : null)
                .expiresAt(LocalDateTime.now().plusHours(ttlHours))
                .viewCount(0L)
                .build();

        Story saved = storyRepository.save(story);
        if (notifyFollowers == null || notifyFollowers) {
            notifyFollowersAndFriendsOnStory(saved);
        }
        return toResponse(saved, userId, Map.of());
    }

    @Override
    @Transactional
    public StoryResponse shareStory(Long userId, Long storyId) {
        Story sourceStory = getActiveStory(storyId, userId);
        User owner = getUser(userId);
        Story originalStory = sourceStory.getResharedFromStory() != null ? sourceStory.getResharedFromStory() : sourceStory;
        Long originalOwnerId = sourceStory.getResharedFromOwnerId() != null
                ? sourceStory.getResharedFromOwnerId()
                : sourceStory.getUser().getUserId();
        String originalOwnerName = sourceStory.getResharedFromOwnerName() != null && !sourceStory.getResharedFromOwnerName().isBlank()
                ? sourceStory.getResharedFromOwnerName()
                : ownerName(sourceStory.getUser());

        Story reshare = Story.builder()
                .user(owner)
                .sourcePost(sourceStory.getSourcePost())
                .resharedFromStory(originalStory)
                .resharedFromOwnerId(originalOwnerId)
                .resharedFromOwnerName(originalOwnerName)
                .mediaUrl(sourceStory.getMediaUrl())
                .mediaType(sourceStory.getMediaType())
                .caption(sourceStory.getCaption())
                .expiresAt(LocalDateTime.now().plusHours(24))
                .viewCount(0L)
                .build();

        Story saved = storyRepository.save(reshare);
        notifyFollowersAndFriendsOnStory(saved);
        return toResponse(saved, userId, Map.of());
    }

    @Override
    public List<StoryResponse> getStoryFeed(Long userId) {
        User currentUser = getUser(userId);
        Set<Long> audience = resolveAudienceForFeed(currentUser);
        audience.add(userId);

        List<Story> stories = storyRepository.findByUserUserIdInAndExpiresAtAfterOrderByCreatedAtDesc(audience, LocalDateTime.now());
        List<Long> storyIds = stories.stream().map(Story::getId).toList();
        Map<Long, Map<String, Long>> reactionCountsByStory = buildReactionCountMap(storyIds);

        return stories.stream()
                .map(story -> toResponse(story, userId, reactionCountsByStory.getOrDefault(story.getId(), Map.of())))
                .toList();
    }

    @Override
    @Transactional
    public StoryResponse reactToStory(Long userId, Long storyId, String type) {
        Story story = getActiveStory(storyId, userId);
        User user = getUser(userId);

        StoryReaction reaction = storyReactionRepository.findByStoryIdAndUserUserId(storyId, userId)
                .orElse(null);

        if (reaction != null && reaction.getType().equalsIgnoreCase(type)) {
            storyReactionRepository.delete(reaction);
        } else if (reaction != null) {
            reaction.setType(type.toLowerCase());
            storyReactionRepository.save(reaction);
        } else {
            storyReactionRepository.save(StoryReaction.builder()
                    .story(story)
                    .user(user)
                    .type(type.toLowerCase())
                    .build());
        }

        Map<String, Long> reactionCounts = buildReactionCountMap(List.of(storyId)).getOrDefault(storyId, Map.of());
        return toResponse(story, userId, reactionCounts);
    }

    @Override
    @Transactional
    public StoryResponse markViewed(Long userId, Long storyId) {
        Story story = getActiveStory(storyId, userId);
        if (!storyViewRepository.existsByStoryIdAndUserUserId(storyId, userId)) {
            StoryView view = StoryView.builder()
                    .story(story)
                    .user(getUser(userId))
                    .build();
            storyViewRepository.save(view);
            story.setViewCount((story.getViewCount() == null ? 0L : story.getViewCount()) + 1L);
            storyRepository.save(story);
        }

        Map<String, Long> reactionCounts = buildReactionCountMap(List.of(storyId)).getOrDefault(storyId, Map.of());
        return toResponse(story, userId, reactionCounts);
    }

    @Override
    @Transactional
    public void replyToStory(Long userId, Long storyId, String content) {
        Story story = getActiveStory(storyId, userId);
        if (story.getUser().getUserId().equals(userId)) {
            return;
        }
        ConversationSummaryResponse conversation = chatConversationService.getOrCreateDirectConversation(userId, story.getUser().getUserId());
        chatConversationService.sendMessage(userId, conversation.conversationId(), new MessageRequest(
                "Story reply: " + content.trim(),
                null,
                null,
                null
        ));
    }

    @Override
    @Transactional
    public void deleteStory(Long userId, Long storyId) {
        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new RuntimeException("Story not found"));
        if (!story.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("Cannot delete others' stories");
        }
        storyRepository.delete(story);
    }

    private Story getActiveStory(Long storyId, Long currentUserId) {
        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new RuntimeException("Story not found"));
        if (story.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Story expired");
        }
        if (!canAccessStory(currentUserId, story)) {
            throw new RuntimeException("Story is not available");
        }
        return story;
    }

    private boolean canAccessStory(Long currentUserId, Story story) {
        Long ownerId = story.getUser().getUserId();
        if (ownerId.equals(currentUserId)) {
            return true;
        }
        if (followRepository.existsByFollowerUserIdAndFollowingUserId(currentUserId, ownerId)) {
            return true;
        }
        if (followRepository.existsByFollowerUserIdAndFollowingUserId(ownerId, currentUserId)) {
            return true;
        }

        User currentUser = getUser(currentUserId);
        return friendRepository.findFriendship(currentUser, story.getUser())
                .map(friend -> FriendStatus.ACCEPTED.equals(friend.getStatus()))
                .orElse(false);
    }

    private Map<Long, Map<String, Long>> buildReactionCountMap(List<Long> storyIds) {
        if (storyIds.isEmpty()) return Map.of();
        Map<Long, Map<String, Long>> result = new HashMap<>();
        List<StoryReaction> reactions = storyReactionRepository.findByStoryIdIn(storyIds);
        for (StoryReaction reaction : reactions) {
            result.computeIfAbsent(reaction.getStory().getId(), ignored -> new HashMap<>());
            Map<String, Long> typeMap = result.get(reaction.getStory().getId());
            String key = reaction.getType() == null ? "like" : reaction.getType().toLowerCase();
            typeMap.put(key, typeMap.getOrDefault(key, 0L) + 1L);
        }
        return result;
    }

    private StoryResponse toResponse(Story story, Long currentUserId, Map<String, Long> reactionCounts) {
        boolean viewed = storyViewRepository.existsByStoryIdAndUserUserId(story.getId(), currentUserId);

        return StoryResponse.builder()
                .id(story.getId())
                .ownerUserId(story.getUser().getUserId())
                .ownerName(ownerName(story.getUser()))
                .mediaUrl(story.getMediaUrl())
                .mediaType(story.getMediaType())
                .caption(story.getCaption())
                .createdAt(story.getCreatedAt())
                .expiresAt(story.getExpiresAt())
                .sourcePostId(story.getSourcePost() != null ? story.getSourcePost().getPostId() : null)
                .resharedFromStoryId(story.getResharedFromStory() != null ? story.getResharedFromStory().getId() : null)
                .resharedFromOwnerId(story.getResharedFromOwnerId())
                .resharedFromOwnerName(story.getResharedFromOwnerName())
                .viewCount(story.getViewCount() == null ? 0L : story.getViewCount())
                .viewedByCurrentUser(viewed)
                .reactionCounts(reactionCounts)
                .build();
    }

    private String ownerName(User user) {
        return ((user.getFirstname() == null ? "" : user.getFirstname()) + " " +
                (user.getLastName() == null ? "" : user.getLastName())).trim();
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private Set<Long> resolveAudienceForFeed(User user) {
        Set<Long> ids = new LinkedHashSet<>();
        followRepository.findByFollowerUserIdOrderByFollowedAtDesc(user.getUserId())
                .forEach(follow -> ids.add(follow.getFollowing().getUserId()));
        followRepository.findByFollowingUserIdOrderByFollowedAtDesc(user.getUserId())
                .forEach(follow -> ids.add(follow.getFollower().getUserId()));

        List<Friend> acceptedFriends = friendRepository.findAcceptedFriends(user);
        for (Friend friend : acceptedFriends) {
            Long otherId = friend.getSender().getUserId().equals(user.getUserId())
                    ? friend.getReceiver().getUserId()
                    : friend.getSender().getUserId();
            ids.add(otherId);
        }
        return ids;
    }

    private void notifyFollowersAndFriendsOnStory(Story story) {
        User actor = story.getUser();
        Set<Long> audienceUserIds = new LinkedHashSet<>();

        followRepository.findByFollowingUserIdOrderByFollowedAtDesc(actor.getUserId())
                .forEach(follow -> audienceUserIds.add(follow.getFollower().getUserId()));

        List<Friend> acceptedFriends = friendRepository.findAcceptedFriends(actor);
        for (Friend friend : acceptedFriends) {
            Long friendId = friend.getSender().getUserId().equals(actor.getUserId())
                    ? friend.getReceiver().getUserId()
                    : friend.getSender().getUserId();
            audienceUserIds.add(friendId);
        }

        for (Long recipientId : audienceUserIds) {
            if (recipientId.equals(actor.getUserId())) continue;
            User recipient = userRepository.findById(recipientId).orElse(null);
            if (recipient == null) continue;

            notificationService.publish(Notification.builder()
                    .user(recipient)
                    .actorUser(actor)
                    .type(NotificationType.SYSTEM)
                    .referenceId(story.getId())
                    .referenceType("STORY")
                    .message(actor.getFirstname() + " added a new story")
                    .read(false)
                    .build());
        }
    }

    private String saveMedia(MultipartFile file) {
        try {
            File folder = new File(uploadDir).getAbsoluteFile();
            if (!folder.exists()) folder.mkdirs();

            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null) {
                int dotIndex = originalFilename.lastIndexOf(".");
                if (dotIndex >= 0) {
                    extension = originalFilename.substring(dotIndex);
                }
            }
            String filename = UUID.randomUUID() + extension;
            File destination = new File(folder, filename);
            file.transferTo(destination);
            return "/uploads/" + filename;
        } catch (IOException exception) {
            throw new RuntimeException("Failed to save story media", exception);
        }
    }

    private String resolveMediaType(MultipartFile media, String mediaUrl) {
        if (media != null && media.getContentType() != null) {
            if (media.getContentType().startsWith("video")) return "VIDEO";
            if (media.getContentType().startsWith("image")) return "IMAGE";
        }
        if (mediaUrl != null) {
            String normalized = mediaUrl.toLowerCase();
            if (normalized.endsWith(".mp4") || normalized.endsWith(".webm")
                    || normalized.endsWith(".mov") || normalized.endsWith(".m4v")
                    || normalized.endsWith(".ogg") || normalized.endsWith(".avi")) {
                return "VIDEO";
            }
        }
        return "IMAGE";
    }
}
