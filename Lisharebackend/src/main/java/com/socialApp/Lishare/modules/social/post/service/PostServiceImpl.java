package com.socialApp.Lishare.modules.social.post.service;

import com.socialApp.Lishare.modules.platform.user.entity.User;
import com.socialApp.Lishare.modules.platform.user.repository.UserBlockRepository;
import com.socialApp.Lishare.modules.platform.user.repository.UserRepo;
import com.socialApp.Lishare.modules.platform.storage.UploadPathResolver;
import com.socialApp.Lishare.modules.social.follow.entity.Follow;
import com.socialApp.Lishare.modules.social.follow.repository.FollowRepository;
import com.socialApp.Lishare.modules.social.friend.entity.Friend;
import com.socialApp.Lishare.modules.social.friend.repository.FriendRepository;
import com.socialApp.Lishare.modules.social.notification.entity.Notification;
import com.socialApp.Lishare.modules.social.notification.entity.NotificationType;
import com.socialApp.Lishare.modules.social.notification.service.NotificationService;
import com.socialApp.Lishare.modules.social.comment.repository.CommentRepository;
import com.socialApp.Lishare.modules.social.mention.service.MentionNotificationService;
import com.socialApp.Lishare.modules.social.post.entity.Post;
import com.socialApp.Lishare.modules.social.post.entity.PostPollVote;
import com.socialApp.Lishare.modules.social.post.repository.PostPollVoteRepository;
import com.socialApp.Lishare.modules.social.post.repository.PostReportRepository;
import com.socialApp.Lishare.modules.social.post.repository.PostRepository;
import com.socialApp.Lishare.modules.social.post.repository.SavedPostRepository;
import com.socialApp.Lishare.modules.social.post.support.PostXpPolicy;
import com.socialApp.Lishare.modules.social.reaction.repository.ReactionRepository;
import com.socialApp.Lishare.modules.social.share.entity.Share;
import com.socialApp.Lishare.modules.social.share.repository.ShareRepository;
import com.socialApp.Lishare.modules.social.story.entity.Story;
import com.socialApp.Lishare.modules.social.story.repository.StoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class PostServiceImpl implements PostService {

    private final PostRepository postRepository;
    private final UserRepo userRepository;
    private final UserBlockRepository userBlockRepository;
    private final ShareRepository shareRepository;
    private final SavedPostRepository savedPostRepository;
    private final PostReportRepository postReportRepository;
    private final StoryRepository storyRepository;
    private final ReactionRepository reactionRepository;
    private final CommentRepository commentRepository;
    private final PostPollVoteRepository postPollVoteRepository;
    private final FollowRepository followRepository;
    private final FriendRepository friendRepository;
    private final NotificationService notificationService;
    private final MentionNotificationService mentionNotificationService;
    private final UploadPathResolver uploadPathResolver;

    @Override
    @Transactional
    public Post createPost(Long userId, String content, MultipartFile imageFile, String category) {
        return createPost(userId, content, imageFile, category, null, null, null, null);
    }

    @Override
    @Transactional
    public Post createPost(Long userId, String content, MultipartFile imageFile, String category,
                           String feeling, String locationName, String pollQuestion, String pollOptionsJson) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String mediaUrl = saveMedia(imageFile);
        String mediaType = resolveMediaType(imageFile, mediaUrl);
        String normalizedCategory = normalizeCategory(category);
        List<String> pollOptions = parsePollOptionsInput(pollOptionsJson);
        String normalizedPollQuestion = normalizeNullable(pollQuestion);
        boolean hasValidPoll = normalizedPollQuestion != null && pollOptions.size() >= 2;

        Post post = Post.builder()
                .user(user)
                .content(content != null ? content.trim() : "")
                .imageUrl(mediaUrl)
                .mediaType(mediaType)
                .category(normalizedCategory)
                .feeling(normalizeNullable(feeling))
                .locationName(normalizeNullable(locationName))
                .pollQuestion(hasValidPoll ? normalizedPollQuestion : null)
                .pollOptionsJson(hasValidPoll ? serializePollOptions(pollOptions) : null)
                .xpAwarded(PostXpPolicy.xpForCategory(normalizedCategory))
                .createdAt(LocalDateTime.now())
                .reelViewCount(0L)
                .build();

        Post savedPost = postRepository.save(post);
        notifyFollowersAndFriendsOnPost(savedPost);
        mentionNotificationService.notifyMentions(user, savedPost.getContent(), savedPost.getPostId(), null, null, "POST");
        return savedPost;
    }

    @Override
    @Transactional
    public Post updatePost(Long userId, Long postId, String content, MultipartFile imageFile, boolean removeMedia) {
        return updatePost(userId, postId, content, imageFile, removeMedia, null, null, null, null);
    }

    @Override
    @Transactional
    public Post updatePost(Long userId, Long postId, String content, MultipartFile imageFile, boolean removeMedia,
                           String feeling, String locationName, String pollQuestion, String pollOptionsJson) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        if (!post.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("Cannot edit others' posts");
        }

        if (content != null) {
            post.setContent(content.trim());
        }

        if (removeMedia) {
            post.setImageUrl(null);
            post.setMediaType(null);
        }

        if (imageFile != null && !imageFile.isEmpty()) {
            String mediaUrl = saveMedia(imageFile);
            post.setImageUrl(mediaUrl);
            post.setMediaType(resolveMediaType(imageFile, mediaUrl));
        }

        if (feeling != null) {
            post.setFeeling(normalizeNullable(feeling));
        }
        if (locationName != null) {
            post.setLocationName(normalizeNullable(locationName));
        }
        applyPollUpdate(post, pollQuestion, pollOptionsJson);
        post.setEditedAt(LocalDateTime.now());
        Post savedPost = postRepository.save(post);
        mentionNotificationService.notifyMentions(post.getUser(), savedPost.getContent(), savedPost.getPostId(), null, null, "POST");
        return savedPost;
    }

    @Override
    @Transactional
    public void deletePost(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        List<Share> linkedShares = shareRepository.findByPostPostId(postId);
        if (!linkedShares.isEmpty()) {
            for (Share share : linkedShares) {
                if (share.getOriginalPostId() == null) {
                    share.setOriginalPostId(post.getPostId());
                }
                if (share.getOriginalAuthorName() == null || share.getOriginalAuthorName().isBlank()) {
                    share.setOriginalAuthorName(post.getAuthorName());
                }
                if (share.getOriginalContent() == null) {
                    share.setOriginalContent(post.getContent());
                }
                if (share.getOriginalImageUrl() == null) {
                    share.setOriginalImageUrl(post.getImageUrl());
                }
                if (share.getOriginalMediaType() == null) {
                    share.setOriginalMediaType(post.getMediaType());
                }
                share.setOriginalPostDeleted(true);
                share.setPost(null);
            }
            shareRepository.saveAll(linkedShares);
        }

        List<Story> sourceStories = storyRepository.findBySourcePostPostId(postId);
        if (!sourceStories.isEmpty()) {
            sourceStories.forEach(story -> story.setSourcePost(null));
            storyRepository.saveAll(sourceStories);
        }

        savedPostRepository.deleteByPostPostId(postId);
        postReportRepository.deleteByPostPostId(postId);
        postPollVoteRepository.deleteByPostPostId(postId);
        reactionRepository.deleteAllByPostId(postId);
        commentRepository.deleteRepliesByPostId(postId);
        commentRepository.deleteTopLevelByPostId(postId);
        postRepository.delete(post);
    }

    @Override
    public List<Post> getPostsByUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return postRepository.findByUser(user);
    }

    @Override
    public Post getPostById(Long postId) {
        return postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
    }

    @Override
    public List<Post> getFeedPosts(Long userId) {
        User currentUser = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Post> aggregated = new ArrayList<>(postRepository.findByUser(currentUser));
        for (Follow follow : currentUser.getFollowing()) {
            aggregated.addAll(postRepository.findByUser(follow.getFollowing()));
        }
        for (Follow follow : currentUser.getFollowers()) {
            aggregated.addAll(postRepository.findByUser(follow.getFollower()));
        }

        Map<Long, Post> unique = new LinkedHashMap<>();
        for (Post post : aggregated) {
            if (post.getPostId() == null) continue;
            if (userBlockRepository.hasBlockBetween(currentUser.getUserId(), post.getUser().getUserId())) continue;
            unique.put(post.getPostId(), post);
        }

        List<Post> feedPosts = new ArrayList<>(unique.values());
        feedPosts.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
        return feedPosts;
    }

    @Override
    @Transactional
    public long incrementReelView(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        long current = post.getReelViewCount() == null ? 0L : post.getReelViewCount();
        post.setReelViewCount(current + 1);
        postRepository.save(post);
        return post.getReelViewCount();
    }

    @Override
    @Transactional
    public Post votePoll(Long userId, Long postId, Integer optionIndex) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        List<String> options = getPollOptions(post);
        if (options.size() < 2 || post.getPollQuestion() == null || post.getPollQuestion().isBlank()) {
            throw new IllegalArgumentException("Post does not contain an active poll");
        }
        if (optionIndex == null || optionIndex < 0 || optionIndex >= options.size()) {
            throw new IllegalArgumentException("Invalid poll option");
        }

        PostPollVote vote = postPollVoteRepository.findByPostPostIdAndUserUserId(postId, userId)
                .orElseGet(() -> PostPollVote.builder()
                        .post(post)
                        .user(user)
                        .build());
        vote.setOptionIndex(optionIndex);
        postPollVoteRepository.save(vote);
        return post;
    }

    @Override
    public List<String> getPollOptions(Post post) {
        if (post == null || post.getPollOptionsJson() == null || post.getPollOptionsJson().isBlank()) {
            return List.of();
        }
        return parsePollOptionsInput(post.getPollOptionsJson());
    }

    @Override
    public List<Long> getPollVotes(Post post) {
        List<String> options = getPollOptions(post);
        if (post == null || post.getPostId() == null || options.isEmpty()) {
            return List.of();
        }

        List<Long> counts = new ArrayList<>(Collections.nCopies(options.size(), 0L));
        for (PostPollVote vote : postPollVoteRepository.findByPostPostId(post.getPostId())) {
            Integer index = vote.getOptionIndex();
            if (index != null && index >= 0 && index < counts.size()) {
                counts.set(index, counts.get(index) + 1);
            }
        }
        return counts;
    }

    @Override
    public Integer getViewerPollOptionIndex(Post post, Long userId) {
        if (post == null || post.getPostId() == null || userId == null) {
            return null;
        }
        return postPollVoteRepository.findByPostPostIdAndUserUserId(post.getPostId(), userId)
                .map(PostPollVote::getOptionIndex)
                .orElse(null);
    }

    private String saveMedia(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return null;
        }

        try {
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null) {
                int dotIndex = originalFilename.lastIndexOf(".");
                if (dotIndex >= 0) {
                    extension = originalFilename.substring(dotIndex);
                }
            }
            String filename = UUID.randomUUID() + extension;
            Path folder = uploadPathResolver.ensurePrimaryUploadPath();
            Path destinationPath = folder.resolve(filename).normalize();
            if (!destinationPath.startsWith(folder)) {
                throw new IllegalArgumentException("Invalid media path");
            }
            File destination = destinationPath.toFile();
            file.transferTo(destination);
            return "/uploads/" + filename;
        } catch (IOException exception) {
            throw new RuntimeException("Failed to save media", exception);
        }
    }

    private String resolveMediaType(MultipartFile imageFile, String mediaUrl) {
        if (imageFile != null && imageFile.getContentType() != null) {
            if ("image/gif".equalsIgnoreCase(imageFile.getContentType())) {
                return "GIF";
            }
            if (imageFile.getContentType().startsWith("video")) {
                return "VIDEO";
            }
            if (imageFile.getContentType().startsWith("image")) {
                return "IMAGE";
            }
        }
        if (mediaUrl != null) {
            String normalized = mediaUrl.toLowerCase();
            if (normalized.endsWith(".gif")) {
                return "GIF";
            }
            if (normalized.endsWith(".mp4") || normalized.endsWith(".webm") || normalized.endsWith(".mov")
                    || normalized.endsWith(".m4v") || normalized.endsWith(".ogg") || normalized.endsWith(".avi")) {
                return "VIDEO";
            }
            return "IMAGE";
        }
        return null;
    }

    private String normalizeCategory(String category) {
        if (category == null || category.isBlank()) {
            throw new IllegalArgumentException("Post category is required");
        }

        String normalized = category.trim().toUpperCase(Locale.ROOT).replace("-", "_").replace(" ", "_");
        Set<String> allowedCategories = Set.of(
                "GENERAL",
                "EDUCATION",
                "FUNNY",
                "NEWS",
                "BUSINESS",
                "LIFESTYLE",
                "TECH",
                "OTHER"
        );
        if (!allowedCategories.contains(normalized)) {
            throw new IllegalArgumentException("Unsupported post category");
        }
        return normalized;
    }

    private void applyPollUpdate(Post post, String pollQuestion, String pollOptionsJson) {
        if (pollQuestion == null && pollOptionsJson == null) {
            return;
        }

        String normalizedQuestion = normalizeNullable(pollQuestion);
        List<String> options = parsePollOptionsInput(pollOptionsJson);
        if (normalizedQuestion == null || options.size() < 2) {
            post.setPollQuestion(null);
            post.setPollOptionsJson(null);
            if (post.getPostId() != null) {
                postPollVoteRepository.deleteByPostPostId(post.getPostId());
            }
            return;
        }

        post.setPollQuestion(normalizedQuestion);
        post.setPollOptionsJson(serializePollOptions(options));
        if (post.getPostId() != null) {
            List<PostPollVote> existingVotes = postPollVoteRepository.findByPostPostId(post.getPostId());
            boolean invalidVoteExists = existingVotes.stream()
                    .map(PostPollVote::getOptionIndex)
                    .anyMatch(index -> index == null || index < 0 || index >= options.size());
            if (invalidVoteExists) {
                postPollVoteRepository.deleteByPostPostId(post.getPostId());
            }
        }
    }

    private String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isBlank() ? null : normalized;
    }

    private List<String> parsePollOptionsInput(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }

        List<String> rawOptions = decodeStoredPollOptions(value);

        return rawOptions.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(option -> !option.isBlank())
                .map(option -> option.length() > 160 ? option.substring(0, 160) : option)
                .limit(8)
                .toList();
    }

    private String serializePollOptions(List<String> options) {
        List<String> encoded = options.stream()
                .map(option -> Base64.getUrlEncoder().withoutPadding().encodeToString(option.getBytes(StandardCharsets.UTF_8)))
                .toList();
        return "b64:" + String.join("|", encoded);
    }

    private List<String> decodeStoredPollOptions(String value) {
        String trimmed = value.trim();
        if (trimmed.startsWith("b64:")) {
            return Arrays.stream(trimmed.substring(4).split("\\|"))
                    .filter(token -> !token.isBlank())
                    .map(token -> new String(Base64.getUrlDecoder().decode(token), StandardCharsets.UTF_8))
                    .toList();
        }
        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
            return parseJsonLikePollOptions(trimmed);
        }
        return Arrays.stream(trimmed.split("\\|"))
                .map(String::trim)
                .toList();
    }

    private List<String> parseJsonLikePollOptions(String value) {
        List<String> options = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inString = false;
        boolean escaping = false;
        boolean tokenStarted = false;

        for (int index = 1; index < value.length() - 1; index++) {
            char character = value.charAt(index);
            if (escaping) {
                current.append(character);
                escaping = false;
                continue;
            }
            if (character == '\\' && inString) {
                escaping = true;
                continue;
            }
            if (character == '"') {
                inString = !inString;
                tokenStarted = true;
                continue;
            }
            if (character == ',' && !inString) {
                if (tokenStarted || !current.isEmpty()) {
                    options.add(current.toString());
                }
                current.setLength(0);
                tokenStarted = false;
                continue;
            }
            if (inString || !Character.isWhitespace(character)) {
                current.append(character);
                tokenStarted = true;
            }
        }

        if (tokenStarted || !current.isEmpty()) {
            options.add(current.toString());
        }
        return options;
    }

    private void notifyFollowersAndFriendsOnPost(Post post) {
        User actor = post.getUser();
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

        String message = "VIDEO".equalsIgnoreCase(post.getMediaType())
                ? actor.getFirstname() + " posted a new reel"
                : actor.getFirstname() + " published a new post";

        for (Long recipientId : audienceUserIds) {
            if (recipientId.equals(actorId)) continue;
            User recipient = userRepository.findById(recipientId).orElse(null);
            if (recipient == null) continue;

            notificationService.publish(Notification.builder()
                    .user(recipient)
                    .actorUser(actor)
                    .type(NotificationType.SYSTEM)
                    .referenceId(post.getPostId())
                    .referenceType("POST")
                    .postId(post.getPostId())
                    .message(message)
                    .read(false)
                    .build());
        }
    }
}
