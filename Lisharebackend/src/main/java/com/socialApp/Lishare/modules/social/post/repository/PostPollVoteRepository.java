package com.socialApp.Lishare.modules.social.post.repository;

import com.socialApp.Lishare.modules.social.post.entity.PostPollVote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PostPollVoteRepository extends JpaRepository<PostPollVote, Long> {

    List<PostPollVote> findByPostPostId(Long postId);

    List<PostPollVote> findByPostPostIdOrderByCreatedAtDesc(Long postId);

    List<PostPollVote> findByPostPostIdAndUserUserId(Long postId, Long userId);

    Optional<PostPollVote> findByPostPostIdAndUserUserIdAndOptionIndex(Long postId, Long userId, Integer optionIndex);

    void deleteByPostPostId(Long postId);
}
