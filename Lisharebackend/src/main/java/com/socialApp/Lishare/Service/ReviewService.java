package com.socialApp.Lishare.Service;

import com.socialApp.Lishare.dtos.ReviewDto;
import com.socialApp.Lishare.entities.Review;
import com.socialApp.Lishare.repos.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;

    // Get all reviews
    public List<Review> getAllReviews() {
        return reviewRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<Review> getReviewsByUserId(Long userId) {
        return reviewRepository.findByUserId(userId);
    }


    // Create review
    public Review createReview(Review review) {
        return reviewRepository.save(review);
    }

    // Update review (owner only)
    public Review updateReview(Long id, ReviewDto.UpdateReviewDto dto, Long userId) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Review not found"));

        if (!review.getUserId().equals(userId)) {
            throw new RuntimeException("You can only update your own review");
        }

        review.setComment(dto.comment());
        review.setRating(dto.rating());
        review.setStatus(dto.status());
        return reviewRepository.save(review);
    }

    // Delete review (owner only)
    public void deleteReview(Long id, Long userId) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Review not found"));

        if (!review.getUserId().equals(userId)) {
            throw new RuntimeException("You can only delete your own review");
        }

        reviewRepository.delete(review);
    }
}
