package com.socialApp.Lishare.modules.social.reaction.service;

import com.socialApp.Lishare.modules.platform.user.entity.User;
import com.socialApp.Lishare.modules.platform.user.repository.UserRepo;
import com.socialApp.Lishare.modules.social.follow.repository.FollowRepository;
import com.socialApp.Lishare.modules.social.friend.entity.Friend;
import com.socialApp.Lishare.modules.social.friend.repository.FriendRepository;
import com.socialApp.Lishare.modules.social.notification.entity.Notification;
import com.socialApp.Lishare.modules.social.notification.entity.NotificationType;
import com.socialApp.Lishare.modules.social.notification.service.NotificationService;
import com.socialApp.Lishare.modules.social.post.entity.Post;
import com.socialApp.Lishare.modules.social.post.repository.PostRepository;
import com.socialApp.Lishare.modules.social.reaction.dto.LikeActionResponse;
import com.socialApp.Lishare.modules.social.reaction.entity.Reaction;
import com.socialApp.Lishare.modules.social.reaction.repository.ReactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ReactionServiceImpl implements ReactionService {

    private final ReactionRepository reactionRepository;
    private final UserRepo userRepo;
    private final PostRepository postRepo;
    private final NotificationService notificationService;
    private final FollowRepository followRepository;
    private final FriendRepository friendRepository;

    @Override
    @Transactional
    public LikeActionResponse reactToPost(Long userId, Long postId, String type) {
        User user = userRepo.findById(userId).orElseThrow();
        Post post = postRepo.findById(postId).orElseThrow();

        Reaction existingReaction = reactionRepository.findByUserAndPost(user, post).orElse(null);
        if (existingReaction != null && existingReaction.getType() != null
                && existingReaction.getType().equalsIgnoreCase(type)) {
            reactionRepository.delete(existingReaction);
            return new LikeActionResponse("Reaction removed");
        }

        if (existingReaction != null) {
            existingReaction.setType(type);
            existingReaction.setCreatedAt(new Date());
            reactionRepository.save(existingReaction);
        } else {
            Reaction reaction = Reaction.builder()
                    .user(user)
                    .post(post)
                    .type(type)
                    .createdAt(new Date())
                    .build();
            reactionRepository.save(reaction);
        }

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

        notifyFollowersAndFriendsOnReaction(user, post, type);
        return new LikeActionResponse("Reacted with " + type);
    }

    @Override
    @Transactional
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

    private void notifyFollowersAndFriendsOnReaction(User actor, Post post, String reactionType) {
        Long actorId = actor.getUserId();
        Set<Long> audienceUserIds = new LinkedHashSet<>();

        followRepository.findByFollowingUserIdOrderByFollowedAtDesc(actorId)
                .forEach(follow -> audienceUserIds.add(follow.getFollower().getUserId()));

        List<Friend> acceptedFriends = friendRepository.findAcceptedFriends(actor);
        for (Friend friend : acceptedFriends) {
            Long friendId = friend.getSender().getUserId().equals(actorId)
                    ? friend.getReceiver().getUserId()
                    : friend.getSender().getUserId();
            audienceUserIds.add(friendId);
        }

        for (Long recipientId : audienceUserIds) {
            if (recipientId.equals(actorId)) continue;
            User recipient = userRepo.findById(recipientId).orElse(null);
            if (recipient == null) continue;

            notificationService.publish(Notification.builder()
                    .user(recipient)
                    .actorUser(actor)
                    .type(NotificationType.SYSTEM)
                    .referenceId(post.getPostId())
                    .referenceType("POST")
                    .message(actor.getFirstname() + " reacted with " + reactionType)
                    .read(false)
                    .build());
        }
    }
}
