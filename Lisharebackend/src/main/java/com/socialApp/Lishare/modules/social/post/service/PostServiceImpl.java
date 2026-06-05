package com.socialApp.Lishare.modules.social.post.service;

import com.socialApp.Lishare.modules.platform.user.entity.User;
import com.socialApp.Lishare.modules.platform.user.repository.UserBlockRepository;
import com.socialApp.Lishare.modules.platform.user.repository.UserRepo;
import com.socialApp.Lishare.modules.platform.storage.UploadPathResolver;
import com.socialApp.Lishare.modules.social.follow.entity.Follow;
import com.socialApp.Lishare.modules.social.follow.repository.FollowRepository;
import com.socialApp.Lishare.modules.social.friend.dto.FriendStatus;
import com.socialApp.Lishare.modules.social.friend.entity.Friend;
import com.socialApp.Lishare.modules.social.friend.repository.FriendRepository;
import com.socialApp.Lishare.modules.social.notification.entity.Notification;
import com.socialApp.Lishare.modules.social.notification.entity.NotificationType;
import com.socialApp.Lishare.modules.social.notification.service.NotificationService;
import com.socialApp.Lishare.modules.social.comment.repository.CommentRepository;
import com.socialApp.Lishare.modules.social.mention.service.MentionNotificationService;
import com.socialApp.Lishare.modules.social.post.dto.PollVoterResponse;
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
        return createPost(userId, content, imageFile, List.of(), category, null, null, null, null, null);
    }

    @Override
    @Transactional
    public Post createPost(Long userId, String content, MultipartFile imageFile, String category,
                           String feeling, String locationName, String pollQuestion, String pollOptionsJson) {
        return createPost(userId, content, imageFile, List.of(), category, feeling, locationName, pollQuestion, pollOptionsJson, null);
    }

    @Override
    @Transactional
    public Post createPost(Long userId, String content, MultipartFile imageFile, List<MultipartFile> imageFiles, String category,
                           String feeling, String locationName, String pollQuestion, String pollOptionsJson) {
        return createPost(userId, content, imageFile, imageFiles, category, feeling, locationName, pollQuestion, pollOptionsJson, null);
    }

    @Override
    @Transactional
    public Post createPost(Long userId, String content, MultipartFile imageFile, List<MultipartFile> imageFiles, String category,
                           String feeling, String locationName, String pollQuestion, String pollOptionsJson, String audience) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<MultipartFile> mediaFiles = normalizeMediaFiles(imageFile, imageFiles);
        List<String> mediaUrls = saveMediaFiles(mediaFiles);
        String mediaUrl = mediaUrls.isEmpty() ? null : mediaUrls.get(0);
        String mediaType = resolveAggregateMediaType(mediaFiles, mediaUrls);
        String normalizedCategory = normalizeCategory(category);
        List<String> pollOptions = parsePollOptionsInput(pollOptionsJson);
        String normalizedPollQuestion = normalizeNullable(pollQuestion);
        boolean hasValidPoll = normalizedPollQuestion != null && pollOptions.size() >= 2;

        Post post = Post.builder()
                .user(user)
                .content(content != null ? content.trim() : "")
                .imageUrl(mediaUrl)
                .mediaType(mediaType)
                .mediaUrlsJson(mediaUrls.size() > 1 ? serializeStringList(mediaUrls) : null)
                .category(normalizedCategory)
                .audience(normalizeAudience(audience))
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
        return updatePost(userId, postId, content, imageFile, List.of(), removeMedia, null, null, null, null, null);
    }

    @Override
    @Transactional
    public Post updatePost(Long userId, Long postId, String content, MultipartFile imageFile, boolean removeMedia,
                           String feeling, String locationName, String pollQuestion, String pollOptionsJson) {
        return updatePost(userId, postId, content, imageFile, List.of(), removeMedia, feeling, locationName, pollQuestion, pollOptionsJson, null);
    }

    @Override
    @Transactional
    public Post updatePost(Long userId, Long postId, String content, MultipartFile imageFile, List<MultipartFile> imageFiles, boolean removeMedia,
                           String feeling, String locationName, String pollQuestion, String pollOptionsJson) {
        return updatePost(userId, postId, content, imageFile, imageFiles, removeMedia, feeling, locationName, pollQuestion, pollOptionsJson, null);
    }

    @Override
    @Transactional
    public Post updatePost(Long userId, Long postId, String content, MultipartFile imageFile, List<MultipartFile> imageFiles, boolean removeMedia,
                           String feeling, String locationName, String pollQuestion, String pollOptionsJson, String audience) {
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
            post.setMediaUrlsJson(null);
        }

        List<MultipartFile> mediaFiles = normalizeMediaFiles(imageFile, imageFiles);
        if (!mediaFiles.isEmpty()) {
            List<String> mediaUrls = saveMediaFiles(mediaFiles);
            post.setImageUrl(mediaUrls.isEmpty() ? null : mediaUrls.get(0));
            post.setMediaType(resolveAggregateMediaType(mediaFiles, mediaUrls));
            post.setMediaUrlsJson(mediaUrls.size() > 1 ? serializeStringList(mediaUrls) : null);
        }

        if (feeling != null) {
            post.setFeeling(normalizeNullable(feeling));
        }
        if (locationName != null) {
            post.setLocationName(normalizeNullable(locationName));
        }
        if (audience != null) {
            post.setAudience(normalizeAudience(audience));
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

        List<Post> feedPosts = new ArrayList<>(postRepository.findAll().stream()
                .filter(post -> canViewPost(post, currentUser))
                .toList());
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

    @Override
    @Transactional(readOnly = true)
    public List<PollVoterResponse> getPollVoters(Post post) {
        if (post == null || post.getPostId() == null) {
            return List.of();
        }
        List<String> options = getPollOptions(post);
        return postPollVoteRepository.findByPostPostIdOrderByCreatedAtDesc(post.getPostId()).stream()
                .map(vote -> mapPollVoter(vote, options))
                .filter(Objects::nonNull)
                .toList();
    }

    @Override
    public List<String> getMediaUrls(Post post) {
        if (post == null) {
            return List.of();
        }
        List<String> mediaUrls = parseStoredStringList(post.getMediaUrlsJson());
        if (!mediaUrls.isEmpty()) {
            return mediaUrls;
        }
        return normalizeNullable(post.getImageUrl()) == null ? List.of() : List.of(post.getImageUrl());
    }

    @Override
    public List<String> getMediaTypes(Post post) {
        List<String> mediaUrls = getMediaUrls(post);
        if (mediaUrls.isEmpty()) {
            return List.of();
        }
        String mediaType = post == null ? null : normalizeNullable(post.getMediaType());
        if (mediaUrls.size() == 1 && mediaType != null && !"GALLERY".equalsIgnoreCase(mediaType)) {
            return List.of(mediaType.toUpperCase(Locale.ROOT));
        }
        return mediaUrls.stream()
                .map(this::resolveMediaTypeFromUrl)
                .toList();
    }

    private List<MultipartFile> normalizeMediaFiles(MultipartFile imageFile, List<MultipartFile> imageFiles) {
        if (imageFile != null && !imageFile.isEmpty()) {
            return List.of(imageFile);
        }
        return List.of();
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

    private boolean canViewAudience(String audience, User viewer, User author) {
        String normalized = normalizeAudience(audience);
        if ("PUBLIC".equals(normalized)) {
            return true;
        }
        boolean friend = isAcceptedFriend(viewer, author);
        boolean follower = followRepository.existsByFollowerUserIdAndFollowingUserId(viewer.getUserId(), author.getUserId());
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

    private List<String> saveMediaFiles(List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            return List.of();
        }
        return files.stream()
                .filter(Objects::nonNull)
                .filter(file -> !file.isEmpty())
                .map(this::saveMedia)
                .filter(Objects::nonNull)
                .toList();
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

    private String resolveAggregateMediaType(List<MultipartFile> mediaFiles, List<String> mediaUrls) {
        if (mediaUrls == null || mediaUrls.isEmpty()) {
            return null;
        }
        if (mediaUrls.size() > 1) {
            return "GALLERY";
        }
        MultipartFile firstFile = mediaFiles != null && !mediaFiles.isEmpty() ? mediaFiles.get(0) : null;
        return resolveMediaType(firstFile, mediaUrls.get(0));
    }

    private String resolveMediaTypeFromUrl(String mediaUrl) {
        String normalized = String.valueOf(mediaUrl).toLowerCase(Locale.ROOT).split("\\?")[0];
        if (normalized.endsWith(".gif")) {
            return "GIF";
        }
        if (normalized.endsWith(".mp4") || normalized.endsWith(".webm") || normalized.endsWith(".mov")
                || normalized.endsWith(".m4v") || normalized.endsWith(".ogg") || normalized.endsWith(".avi")) {
            return "VIDEO";
        }
        return "IMAGE";
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

    private PollVoterResponse mapPollVoter(PostPollVote vote, List<String> options) {
        if (vote == null || vote.getUser() == null) {
            return null;
        }
        User user = vote.getUser();
        Integer optionIndex = vote.getOptionIndex();
        String optionText = optionIndex != null && optionIndex >= 0 && optionIndex < options.size()
                ? options.get(optionIndex)
                : "Unknown option";
        String displayName = ((user.getFirstname() == null ? "" : user.getFirstname()) + " " + (user.getLastName() == null ? "" : user.getLastName())).trim();
        if (displayName.isBlank()) {
            displayName = user.getEmail();
        }
        String username = user.getEmail() == null ? "" : user.getEmail().split("@")[0].replaceAll("[^A-Za-z0-9_]", "").toLowerCase(Locale.ROOT);
        return PollVoterResponse.builder()
                .voteId(vote.getId())
                .userId(user.getUserId())
                .name(displayName)
                .email(user.getEmail())
                .username(username)
                .profileImageUrl(user.getImageUrl())
                .optionIndex(optionIndex)
                .optionText(optionText)
                .votedAt(vote.getCreatedAt())
                .build();
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
        return serializeStringList(options);
    }

    private String serializeStringList(List<String> values) {
        List<String> encoded = values.stream()
                .filter(Objects::nonNull)
                .map(value -> Base64.getUrlEncoder().withoutPadding().encodeToString(value.getBytes(StandardCharsets.UTF_8)))
                .toList();
        return "b64:" + String.join("|", encoded);
    }

    private List<String> parseStoredStringList(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }
        return decodeStoredStringList(value).stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(item -> !item.isBlank())
                .toList();
    }

    private List<String> decodeStoredPollOptions(String value) {
        return decodeStoredStringList(value);
    }

    private List<String> decodeStoredStringList(String value) {
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
            if (inString || !Character.isWhitespace(character) || tokenStarted) {
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
