package com.socialApp.Lishare.modules.business.review.service;

import com.socialApp.Lishare.modules.business.page.entity.BusinessPage;
import com.socialApp.Lishare.modules.business.page.repository.BusinessPageRepository;
import com.socialApp.Lishare.modules.business.review.dto.ReviewDto;
import com.socialApp.Lishare.modules.business.review.entity.Review;
import com.socialApp.Lishare.modules.business.review.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final BusinessPageRepository businessPageRepository;

    // Get all reviews
    public List<Review> getAllReviews() {
        return reviewRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<Review> getReviewsByUserId(Long userId) {
        return reviewRepository.findByUserId(userId);
    }

    public List<Review> getReviewsByBusinessPageId(Long businessPageId) {
        return reviewRepository.findByBusinessPageIdOrderByCreatedAtDesc(businessPageId);
    }

    // Create review
    public Review createReview(Review review) {
        if (review.getBusinessPageId() != null) {
            BusinessPage page = businessPageRepository.findById(review.getBusinessPageId())
                    .orElseThrow(() -> new RuntimeException("Business page not found"));
            review.setBusinessPageName(page.getName());
        }
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
