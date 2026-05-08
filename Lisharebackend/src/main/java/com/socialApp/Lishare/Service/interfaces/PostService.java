package com.socialApp.Lishare.Service.interfaces;

import com.socialApp.Lishare.entities.Post;
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
