package com.socialApp.Lishare.Service;


import com.socialApp.Lishare.Service.interfaces.ReactionService;
import com.socialApp.Lishare.entities.Reaction;
import com.socialApp.Lishare.entities.Post;
import com.socialApp.Lishare.entities.User;
import com.socialApp.Lishare.repos.ReactionRepository;
import com.socialApp.Lishare.repos.PostRepository;
import com.socialApp.Lishare.repos.UserRepo;
import com.socialApp.Lishare.dtos.postdTOs.LikeActionResponse;
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
        String[] types = {"like", "love", "care", "haha","Wow","sad","angry"};

        for (String type : types) {
            counts.put(type, reactionRepository.countByPostAndType(post, type));
        }

        return counts;
    }
}
