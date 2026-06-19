package com.socialApp.Lishare.modules.social.comment.service;

import com.socialApp.Lishare.modules.platform.storage.UploadStorageService;
import com.socialApp.Lishare.modules.social.comment.service.CommentService;
import com.socialApp.Lishare.modules.social.comment.entity.Comment;
import com.socialApp.Lishare.modules.social.comment.entity.CommentReaction;
import com.socialApp.Lishare.modules.social.mention.service.MentionNotificationService;
import com.socialApp.Lishare.modules.social.notification.entity.Notification;
import com.socialApp.Lishare.modules.social.post.entity.Post;
import com.socialApp.Lishare.modules.platform.user.entity.User;
import com.socialApp.Lishare.modules.social.notification.entity.NotificationType;
import com.socialApp.Lishare.modules.social.notification.service.NotificationService;
import com.socialApp.Lishare.modules.social.comment.repository.CommentRepository;
import com.socialApp.Lishare.modules.social.comment.repository.CommentReactionRepository;
import com.socialApp.Lishare.modules.social.post.repository.PostRepository;
import com.socialApp.Lishare.modules.platform.user.repository.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepository;
    private final CommentReactionRepository commentReactionRepository;
    private final PostRepository postRepository;
    private final UserRepo userRepository;
    private final NotificationService notificationService;
    private final MentionNotificationService mentionNotificationService;
    private final UploadStorageService uploadStorageService;

    @Override
    public Comment addComment(Long userId, Long postId, String content) {
        return addComment(userId, postId, content, null);
    }

    @Override
    @Transactional
    public Comment addComment(Long userId, Long postId, String content, MultipartFile mediaFile) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        String mediaUrl = saveMedia(mediaFile);
        String mediaType = resolveMediaType(mediaFile, mediaUrl);
        String cleanContent = normalizeContent(content, mediaUrl);

        Comment comment = Comment.builder()
                .user(user)
                .post(post)
                .content(cleanContent)
                .mediaUrl(mediaUrl)
                .mediaType(mediaType)
                .createdAt(new Date())
                .parentComment(null)
                .build();

        Comment saved = commentRepository.save(comment);

        User postOwner = post.getUser();
        if (!postOwner.getUserId().equals(userId)) {
            notificationService.publish(Notification.builder()
                    .user(postOwner)
                    .actorUser(user)
                    .type(NotificationType.COMMENT)
                    .referenceId(post.getPostId())
                    .referenceType("POST")
                    .postId(post.getPostId())
                    .commentId(saved.getCommentId())
                    .message(user.getFirstname() + " commented on your post")
                    .read(false)
                    .build());
        }

        mentionNotificationService.notifyMentions(user, cleanContent, post.getPostId(), saved.getCommentId(), null, "COMMENT");
        return saved;
    }

    @Override
    public Comment addReply(Long userId, Long postId, Long parentCommentId, String content) {
        return addReply(userId, postId, parentCommentId, content, null);
    }

    @Override
    @Transactional
    public Comment addReply(Long userId, Long postId, Long parentCommentId, String content, MultipartFile mediaFile) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        Comment parent = commentRepository.findById(parentCommentId)
                .orElseThrow(() -> new RuntimeException("Parent comment not found"));
        if (!parent.getPost().getPostId().equals(postId)) {
            throw new RuntimeException("Parent comment does not belong to this post");
        }
        String mediaUrl = saveMedia(mediaFile);
        String mediaType = resolveMediaType(mediaFile, mediaUrl);
        String cleanContent = normalizeContent(content, mediaUrl);

        Comment reply = Comment.builder()
                .user(user)
                .post(post)
                .content(cleanContent)
                .mediaUrl(mediaUrl)
                .mediaType(mediaType)
                .parentComment(parent)
                .createdAt(new Date())
                .build();

        Comment savedReply = commentRepository.save(reply);

        User postOwner = post.getUser();
        if (!postOwner.getUserId().equals(userId)) {
            notificationService.publish(Notification.builder()
                    .user(postOwner)
                    .actorUser(user)
                    .type(NotificationType.COMMENT_REPLY)
                    .referenceId(post.getPostId())
                    .referenceType("POST")
                    .postId(post.getPostId())
                    .commentId(parent.getCommentId())
                    .replyId(savedReply.getCommentId())
                    .message(displayName(user) + " replied to a comment on your post")
                    .read(false)
                    .build());
        }

        User parentOwner = parent.getUser();
        if (!parentOwner.getUserId().equals(userId) && !parentOwner.getUserId().equals(postOwner.getUserId())) {
            notificationService.publish(Notification.builder()
                    .user(parentOwner)
                    .actorUser(user)
                    .type(NotificationType.COMMENT_REPLY)
                    .referenceId(post.getPostId())
                    .referenceType("COMMENT_REPLY")
                    .postId(post.getPostId())
                    .commentId(parent.getCommentId())
                    .replyId(savedReply.getCommentId())
                    .message(displayName(user) + " replied to your comment on " + displayName(postOwner) + "'s post")
                    .read(false)
                    .build());
        }

        mentionNotificationService.notifyMentions(user, cleanContent, post.getPostId(), parent.getCommentId(), savedReply.getCommentId(), "REPLY");
        return savedReply;
    }

    @Override
    public Comment updateComment(Long userId, Long commentId, String content) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));
        if (!comment.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("Cannot update others' comments");
        }
        comment.setContent(content);
        return commentRepository.save(comment);
    }

    @Override
    public void deleteComment(Long commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));
        commentRepository.delete(comment);
    }

    @Override
    public List<Comment> getCommentsByPost(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        return commentRepository.findTopLevelCommentsWithReplies(post.getPostId());
    }

    @Override
    public List<Comment> getAllCommentsByPost(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        return commentRepository.findAllCommentsForThread(post.getPostId());
    }

    @Override
    public Optional<Comment> getCommentById(Long commentId) {
        return commentRepository.findById(commentId);
    }

    @Override
    public Long countCommentsByPost(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        return commentRepository.countByPost(post);
    }

    @Override
    @Transactional
    public Comment reactToComment(Long userId, Long commentId, String type) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));
        String normalizedType = normalizeReactionType(type);

        CommentReaction existingReaction = commentReactionRepository.findByUserAndComment(user, comment).orElse(null);
        if (existingReaction != null && normalizedType.equalsIgnoreCase(existingReaction.getType())) {
            commentReactionRepository.delete(existingReaction);
            return comment;
        }

        if (existingReaction != null) {
            existingReaction.setType(normalizedType);
            existingReaction.setCreatedAt(new Date());
            commentReactionRepository.save(existingReaction);
        } else {
            commentReactionRepository.save(CommentReaction.builder()
                    .user(user)
                    .comment(comment)
                    .type(normalizedType)
                    .createdAt(new Date())
                    .build());
        }

        User commentOwner = comment.getUser();
        if (commentOwner != null && !commentOwner.getUserId().equals(userId)) {
            notificationService.publish(Notification.builder()
                    .user(commentOwner)
                    .actorUser(user)
                    .type(NotificationType.LIKE)
                    .referenceId(comment.getCommentId())
                    .referenceType("COMMENT")
                    .postId(comment.getPost() != null ? comment.getPost().getPostId() : null)
                    .commentId(comment.getCommentId())
                    .message(displayName(user) + " reacted to your comment")
                    .read(false)
                    .build());
        }

        return comment;
    }

    @Override
    public Map<String, Long> getCommentReactionCounts(Long commentId) {
        Map<String, Long> counts = defaultReactionCounts();
        for (Object[] row : commentReactionRepository.countTypesByCommentId(commentId)) {
            if (row.length < 2 || row[0] == null || row[1] == null) continue;
            counts.put(String.valueOf(row[0]).toLowerCase(Locale.ROOT), Number.class.cast(row[1]).longValue());
        }
        return counts;
    }

    private String normalizeContent(String content, String mediaUrl) {
        String cleanContent = content == null ? "" : content.trim();
        if (cleanContent.isBlank() && mediaUrl == null) {
            throw new IllegalArgumentException("Comment text or media is required");
        }
        return cleanContent;
    }

    private String normalizeReactionType(String type) {
        String normalized = type == null ? "" : type.trim().toLowerCase(Locale.ROOT);
        List<String> allowedTypes = List.of("like", "love", "care", "haha", "wow", "sad", "angry");
        return allowedTypes.contains(normalized) ? normalized : "like";
    }

    private Map<String, Long> defaultReactionCounts() {
        Map<String, Long> counts = new LinkedHashMap<>();
        List.of("like", "love", "care", "haha", "wow", "sad", "angry")
                .forEach(type -> counts.put(type, 0L));
        return counts;
    }

    private String saveMedia(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return null;
        }

        return uploadStorageService.saveCommentMedia(file, "", null);
    }

    private String resolveMediaType(MultipartFile mediaFile, String mediaUrl) {
        if (mediaFile != null && mediaFile.getContentType() != null) {
            if ("application/pdf".equalsIgnoreCase(mediaFile.getContentType())) {
                return "PDF";
            }
            if ("image/gif".equalsIgnoreCase(mediaFile.getContentType())) {
                return "GIF";
            }
            if (mediaFile.getContentType().startsWith("video")) {
                return "VIDEO";
            }
            if (mediaFile.getContentType().startsWith("image")) {
                return "IMAGE";
            }
        }
        if (mediaUrl != null) {
            String normalized = mediaUrl.toLowerCase(Locale.ROOT);
            if (normalized.endsWith(".pdf")) {
                return "PDF";
            }
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

    private String displayName(User user) {
        if (user == null) {
            return "Someone";
        }
        String name = ((user.getFirstname() == null ? "" : user.getFirstname()) + " "
                + (user.getLastName() == null ? "" : user.getLastName())).trim();
        return name.isBlank() ? "Someone" : name;
    }

}
