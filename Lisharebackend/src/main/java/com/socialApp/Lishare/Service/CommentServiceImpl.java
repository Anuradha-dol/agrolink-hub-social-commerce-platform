package com.socialApp.Lishare.Service;

import com.socialApp.Lishare.Service.interfaces.CommentService;
import com.socialApp.Lishare.entities.Comment;
import com.socialApp.Lishare.entities.Post;
import com.socialApp.Lishare.entities.User;
import com.socialApp.Lishare.repos.CommentRepository;
import com.socialApp.Lishare.repos.PostRepository;
import com.socialApp.Lishare.repos.UserRepo;
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

        return commentRepository.save(comment);
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

        return commentRepository.save(reply);
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