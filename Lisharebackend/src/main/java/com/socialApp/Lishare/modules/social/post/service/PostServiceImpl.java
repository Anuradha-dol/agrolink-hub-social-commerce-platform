package com.socialApp.Lishare.modules.social.post.service;

import com.socialApp.Lishare.modules.social.post.service.PostService;
import com.socialApp.Lishare.modules.social.follow.entity.Follow;
import com.socialApp.Lishare.modules.social.post.entity.Post;
import com.socialApp.Lishare.modules.platform.user.entity.User;
import com.socialApp.Lishare.modules.social.post.repository.PostRepository;
import com.socialApp.Lishare.modules.platform.user.repository.UserRepo;
import com.socialApp.Lishare.modules.platform.user.repository.UserBlockRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
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

    @Value("${file.upload-dir}")
    private String uploadDir;

    @Override
    public Post createPost(Long userId, String content, MultipartFile imageFile) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String imageUrl = null;

        if (imageFile != null && !imageFile.isEmpty()) {
            try {
                File folder = new File(uploadDir).getAbsoluteFile();
                if (!folder.exists()) folder.mkdirs();

                String originalFilename = imageFile.getOriginalFilename();
                String extension = "";
                if (originalFilename != null) {
                    int dotIndex = originalFilename.lastIndexOf(".");
                    if (dotIndex >= 0) {
                        extension = originalFilename.substring(dotIndex);
                    }
                }
                String filename = UUID.randomUUID() + extension;

                File dest = new File(folder, filename);
                imageFile.transferTo(dest);

                imageUrl = "/uploads/" + filename;
            } catch (IOException e) {
                e.printStackTrace();
                throw new RuntimeException("Failed to save image", e);
            }
        }

        Post post = Post.builder()
                .user(user)
                .content(content)
                .imageUrl(imageUrl)
                .createdAt(LocalDateTime.now()) // ✅ fixed
                .build();

        return postRepository.save(post);
    }

    @Override
    public void deletePost(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));


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

        //  Start with own posts
        List<Post> feedPosts = postRepository.findByUser(currentUser);

        //  Add posts from users the current user is following
        for (Follow f : currentUser.getFollowing()) {
            feedPosts.addAll(postRepository.findByUser(f.getFollowing()));
        }

        // Optionally, add posts from followers too
        for (Follow f : currentUser.getFollowers()) {
            feedPosts.addAll(postRepository.findByUser(f.getFollower()));
        }

        // Remove posts from users who are blocked either direction
        feedPosts = new ArrayList<>(feedPosts.stream()
                .filter(post -> !userBlockRepository.hasBlockBetween(currentUser.getUserId(), post.getUser().getUserId()))
                .toList());

        //  Sort posts by creation date descending
        feedPosts.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));

        return feedPosts;
    }

}
