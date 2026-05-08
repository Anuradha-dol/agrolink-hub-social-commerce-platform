package com.socialApp.Lishare.modules.social.reaction.service;


import com.socialApp.Lishare.modules.social.reaction.service.ReactionService;
import com.socialApp.Lishare.modules.social.notification.entity.Notification;
import com.socialApp.Lishare.modules.social.reaction.entity.Reaction;
import com.socialApp.Lishare.modules.social.post.entity.Post;
import com.socialApp.Lishare.modules.platform.user.entity.User;
import com.socialApp.Lishare.modules.social.reaction.repository.ReactionRepository;
import com.socialApp.Lishare.modules.social.post.repository.PostRepository;
import com.socialApp.Lishare.modules.platform.user.repository.UserRepo;
import com.socialApp.Lishare.modules.social.reaction.dto.LikeActionResponse;
import com.socialApp.Lishare.modules.social.notification.entity.NotificationType;
import com.socialApp.Lishare.modules.social.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReactionServiceImpl implements ReactionService {

    private final ReactionRepository reactionRepository;
    private final UserRepo userRepo;
    private final PostRepository postRepo;
    private final NotificationService notificationService;

    @Override
    public LikeActionResponse reactToPost(Long userId, Long postId, String type) {
        User user = userRepo.findById(userId).orElseThrow();
        Post post = postRepo.findById(postId).orElseThrow();

        // Remove previous reaction if exists
        reactionRepository.findByUserAndPost(user, post).ifPresent(reactionRepository::delete);

        Reaction reaction = Reaction.builder()
                .user(user)
                .post(post)
                .type(type)
                .createdAt(new Date())
                .build();

        reactionRepository.save(reaction);

        User postOwner = post.getUser();
        if (!postOwner.getUserId().equals(userId)) {
            notificationService.publish(Notification.builder()
                    .user(postOwner)
                    .actorUser(user)
                    .type(NotificationType.LIKE)
                    .referenceId(post.getPostId())
                    .referenceType("POST")
                    .message(user.getFirstname() + " reacted to your post")
                    .read(false)
                    .build());
        }

        return new LikeActionResponse("Reacted with " + type);
    }

    @Override
    public LikeActionResponse removeReaction(Long userId, Long postId) {
        User user = userRepo.findById(userId).orElseThrow();
        Post post = postRepo.findById(postId).orElseThrow();

        reactionRepository.findByUserAndPost(user, post)
                .ifPresent(reactionRepository::delete);

        return new LikeActionResponse("Reaction removed");
    }

    @Override
    public Map<String, Long> getReactionCounts(Long postId) {
        Post post = postRepo.findById(postId).orElseThrow();

        Map<String, Long> counts = new HashMap<>();
        String[] types = {"like", "love", "care", "haha", "wow", "sad", "angry"};

        for (String type : types) {
            counts.put(type, reactionRepository.countByPostAndType(post, type));
        }

        return counts;
    }
}
