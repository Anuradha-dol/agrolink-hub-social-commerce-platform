package com.socialApp.Lishare.Service;

import com.socialApp.Lishare.Service.interfaces.PostService;
import com.socialApp.Lishare.entities.Follow;
import com.socialApp.Lishare.entities.Post;
import com.socialApp.Lishare.entities.User;
import com.socialApp.Lishare.repos.PostRepository;
import com.socialApp.Lishare.repos.UserRepo;
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
                String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
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

        //  Sort posts by creation date descending
        feedPosts.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));

        return feedPosts;
    }

}