package com.socialApp.Lishare.modules.social.post.service;

import com.socialApp.Lishare.modules.social.post.entity.Post;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface PostService {

    Post createPost(Long userId, String content, MultipartFile imageFile);

    void deletePost(Long postId);

    List<Post> getPostsByUser(Long userId);

    Post getPostById(Long postId);

    // ✅ Get feed posts for home page (user's posts + friends/followers/following)
    List<Post> getFeedPosts(Long userId);


}
