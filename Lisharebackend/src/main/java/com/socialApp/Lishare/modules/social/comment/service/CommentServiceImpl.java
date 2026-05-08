package com.socialApp.Lishare.modules.social.comment.service;

import com.socialApp.Lishare.modules.social.comment.service.CommentService;
import com.socialApp.Lishare.modules.social.comment.entity.Comment;
import com.socialApp.Lishare.modules.social.notification.entity.Notification;
import com.socialApp.Lishare.modules.social.post.entity.Post;
import com.socialApp.Lishare.modules.platform.user.entity.User;
import com.socialApp.Lishare.modules.social.notification.entity.NotificationType;
import com.socialApp.Lishare.modules.social.notification.service.NotificationService;
import com.socialApp.Lishare.modules.social.comment.repository.CommentRepository;
import com.socialApp.Lishare.modules.social.post.repository.PostRepository;
import com.socialApp.Lishare.modules.platform.user.repository.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepo userRepository;
    private final NotificationService notificationService;

    @Override
    public Comment addComment(Long userId, Long postId, String content) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        Comment comment = Comment.builder()
                .user(user)
                .post(post)
                .content(content)
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
                    .message(user.getFirstname() + " commented on your post")
                    .read(false)
                    .build());
        }

        return saved;
    }

    @Override
    public Comment addReply(Long userId, Long postId, Long parentCommentId, String content) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        Comment parent = commentRepository.findById(parentCommentId)
                .orElseThrow(() -> new RuntimeException("Parent comment not found"));

        Comment reply = Comment.builder()
                .user(user)
                .post(post)
                .content(content)
                .parentComment(parent)
                .createdAt(new Date())
                .build();

        Comment savedReply = commentRepository.save(reply);

        User postOwner = post.getUser();
        if (!postOwner.getUserId().equals(userId)) {
            notificationService.publish(Notification.builder()
                    .user(postOwner)
                    .actorUser(user)
                    .type(NotificationType.COMMENT)
                    .referenceId(post.getPostId())
                    .referenceType("POST")
                    .message(user.getFirstname() + " replied on your post")
                    .read(false)
                    .build());
        }

        User parentOwner = parent.getUser();
        if (!parentOwner.getUserId().equals(userId) && !parentOwner.getUserId().equals(postOwner.getUserId())) {
            notificationService.publish(Notification.builder()
                    .user(parentOwner)
                    .actorUser(user)
                    .type(NotificationType.COMMENT)
                    .referenceId(parent.getCommentId())
                    .referenceType("COMMENT")
                    .message(user.getFirstname() + " replied to your comment")
                    .read(false)
                    .build());
        }

        return savedReply;
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
        return commentRepository.findByPostAndParentCommentIsNull(post);
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

}
