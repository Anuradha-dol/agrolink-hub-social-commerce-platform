package com.socialApp.Lishare.Service;

import com.socialApp.Lishare.Service.interfaces.ShareService;
import com.socialApp.Lishare.dtos.postdTOs.FeedResponse;
import com.socialApp.Lishare.entities.Post;
import com.socialApp.Lishare.entities.Share;
import com.socialApp.Lishare.entities.User;
import com.socialApp.Lishare.repos.PostRepository;
import com.socialApp.Lishare.repos.ShareRepository;
import com.socialApp.Lishare.repos.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class ShareServiceImpl implements ShareService {

    private final ShareRepository shareRepository;
    private final UserRepo userRepository;
    private final PostRepository postRepository;

    @Override
    public Share sharePost(Long userId, Long postId, String caption) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));


        Share share = Share.builder()
                .user(user)
                .post(post)
                .caption(caption)
                .build();

        return shareRepository.save(share);
    }

    @Override
    public List<FeedResponse> getFullFeed() {

        List<Post> posts = postRepository.findAll();
        List<Share> shares = shareRepository.findAllByOrderByCreatedAtDesc();

        List<FeedResponse> postFeed = posts.stream()
                .map(post -> FeedResponse.builder()
                        .type("POST")
                        .postId(post.getPostId())
                        .authorName(post.getAuthorName())
                        .content(post.getContent())
                        .imageUrl(post.getImageUrl())
                        .createdAt(post.getCreatedAt())
                        .build())
                .toList();

        List<FeedResponse> shareFeed = shares.stream()
                .map(share -> FeedResponse.builder()
                        .type("SHARE")
                        .postId(share.getShareId()) // 🔥 IMPORTANT: unique id
                        .originalPostId(share.getPost().getPostId())
                        .authorName(share.getPost().getAuthorName())
                        .content(share.getPost().getContent())
                        .imageUrl(share.getPost().getImageUrl())
                        .sharedByName(
                                share.getUser().getFirstname() + " " +
                                        share.getUser().getLastName()
                        )
                        .shareCaption(share.getCaption())
                        .sharedAt(share.getCreatedAt())
                        .build())
                .toList();

        return Stream.concat(postFeed.stream(), shareFeed.stream())
                .sorted((a, b) -> {
                    LocalDateTime timeA = a.getType().equals("SHARE")
                            ? a.getSharedAt()
                            : a.getCreatedAt();

                    LocalDateTime timeB = b.getType().equals("SHARE")
                            ? b.getSharedAt()
                            : b.getCreatedAt();

                    return timeB.compareTo(timeA);
                })
                .toList();

}


    @Override
    public void deleteShare(Long userId, Long shareId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Share share = shareRepository.findById(shareId)
                .orElseThrow(() -> new RuntimeException("Share not found"));

        if (!share.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("You cannot delete this share");
        }

        shareRepository.delete(share);
    }}