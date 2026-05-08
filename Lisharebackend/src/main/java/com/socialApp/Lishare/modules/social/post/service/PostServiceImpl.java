package com.socialApp.Lishare.modules.social.post.service;

import com.socialApp.Lishare.modules.platform.user.entity.User;
import com.socialApp.Lishare.modules.platform.user.repository.UserBlockRepository;
import com.socialApp.Lishare.modules.platform.user.repository.UserRepo;
import com.socialApp.Lishare.modules.social.follow.entity.Follow;
import com.socialApp.Lishare.modules.social.follow.repository.FollowRepository;
import com.socialApp.Lishare.modules.social.friend.entity.Friend;
import com.socialApp.Lishare.modules.social.friend.repository.FriendRepository;
import com.socialApp.Lishare.modules.social.notification.entity.Notification;
import com.socialApp.Lishare.modules.social.notification.entity.NotificationType;
import com.socialApp.Lishare.modules.social.notification.service.NotificationService;
import com.socialApp.Lishare.modules.social.post.entity.Post;
import com.socialApp.Lishare.modules.social.post.repository.PostRepository;
import com.socialApp.Lishare.modules.social.share.entity.Share;
import com.socialApp.Lishare.modules.social.share.repository.ShareRepository;
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
public class PostServiceImpl implements PostService {

    private final PostRepository postRepository;
    private final UserRepo userRepository;
    private final UserBlockRepository userBlockRepository;
    private final ShareRepository shareRepository;
    private final FollowRepository followRepository;
    private final FriendRepository friendRepository;
    private final NotificationService notificationService;

    @Value("${file.upload-dir}")
    private String uploadDir;

    @Override
    @Transactional
    public Post createPost(Long userId, String content, MultipartFile imageFile) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String mediaUrl = saveMedia(imageFile);
        String mediaType = resolveMediaType(imageFile, mediaUrl);

        Post post = Post.builder()
                .user(user)
                .content(content != null ? content.trim() : "")
                .imageUrl(mediaUrl)
                .mediaType(mediaType)
                .createdAt(LocalDateTime.now())
                .reelViewCount(0L)
                .build();

        Post savedPost = postRepository.save(post);
        notifyFollowersAndFriendsOnPost(savedPost);
        return savedPost;
    }

    @Override
    @Transactional
    public Post updatePost(Long userId, Long postId, String content, MultipartFile imageFile, boolean removeMedia) {
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

        post.setEditedAt(LocalDateTime.now());
        return postRepository.save(post);
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

    private String saveMedia(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return null;
        }

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
            throw new RuntimeException("Failed to save media", exception);
        }
    }

    private String resolveMediaType(MultipartFile imageFile, String mediaUrl) {
        if (imageFile != null && imageFile.getContentType() != null) {
            if (imageFile.getContentType().startsWith("video")) {
                return "VIDEO";
            }
            if (imageFile.getContentType().startsWith("image")) {
                return "IMAGE";
            }
        }
        if (mediaUrl != null) {
            String normalized = mediaUrl.toLowerCase();
            if (normalized.endsWith(".mp4") || normalized.endsWith(".webm") || normalized.endsWith(".mov")
                    || normalized.endsWith(".m4v") || normalized.endsWith(".ogg") || normalized.endsWith(".avi")) {
                return "VIDEO";
            }
            return "IMAGE";
        }
        return null;
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
                    .message(message)
                    .read(false)
                    .build());
        }
    }
}
