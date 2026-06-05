package com.socialApp.Lishare.modules.social.post.service;

import com.socialApp.Lishare.modules.social.post.dto.PollVoterResponse;
import com.socialApp.Lishare.modules.social.post.entity.Post;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface PostService {

    Post createPost(Long userId, String content, MultipartFile imageFile, String category);

    Post createPost(Long userId, String content, MultipartFile imageFile, String category,
                    String feeling, String locationName, String pollQuestion, String pollOptionsJson);

    Post createPost(Long userId, String content, MultipartFile imageFile, List<MultipartFile> imageFiles, String category,
                    String feeling, String locationName, String pollQuestion, String pollOptionsJson);

    Post createPost(Long userId, String content, MultipartFile imageFile, List<MultipartFile> imageFiles, String category,
                    String feeling, String locationName, String pollQuestion, String pollOptionsJson, String audience);

    Post updatePost(Long userId, Long postId, String content, MultipartFile imageFile, boolean removeMedia);

    Post updatePost(Long userId, Long postId, String content, MultipartFile imageFile, boolean removeMedia,
                    String feeling, String locationName, String pollQuestion, String pollOptionsJson);

    Post updatePost(Long userId, Long postId, String content, MultipartFile imageFile, List<MultipartFile> imageFiles, boolean removeMedia,
                    String feeling, String locationName, String pollQuestion, String pollOptionsJson);

    Post updatePost(Long userId, Long postId, String content, MultipartFile imageFile, List<MultipartFile> imageFiles, boolean removeMedia,
                    String feeling, String locationName, String pollQuestion, String pollOptionsJson, String audience);

    void deletePost(Long postId);

    List<Post> getPostsByUser(Long userId);

    Post getPostById(Long postId);

    List<Post> getFeedPosts(Long userId);

    long incrementReelView(Long postId);

    Post votePoll(Long userId, Long postId, Integer optionIndex);

    List<String> getPollOptions(Post post);

    List<Long> getPollVotes(Post post);

    Integer getViewerPollOptionIndex(Post post, Long userId);

    List<PollVoterResponse> getPollVoters(Post post);

    List<String> getMediaUrls(Post post);

    List<String> getMediaTypes(Post post);
}
