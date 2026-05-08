package com.socialApp.Lishare.modules.social.post.service;

import com.socialApp.Lishare.modules.social.post.entity.Post;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface PostService {

    Post createPost(Long userId, String content, MultipartFile imageFile);

    Post updatePost(Long userId, Long postId, String content, MultipartFile imageFile, boolean removeMedia);

    void deletePost(Long postId);

    List<Post> getPostsByUser(Long userId);

    Post getPostById(Long postId);

    List<Post> getFeedPosts(Long userId);

    long incrementReelView(Long postId);
}
