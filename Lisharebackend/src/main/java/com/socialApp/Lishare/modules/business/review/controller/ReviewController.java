package com.socialApp.Lishare.modules.business.review.controller;

import com.socialApp.Lishare.modules.business.review.service.ReviewService;
import com.socialApp.Lishare.modules.business.review.dto.ReviewDto;
import com.socialApp.Lishare.modules.business.review.entity.Review;
import com.socialApp.Lishare.modules.platform.common.enums.Role;
import com.socialApp.Lishare.modules.platform.user.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    // 1️⃣ Get all reviews
    @GetMapping
    public ResponseEntity<List<Review>> getAllReviews() {
        return ResponseEntity.ok(reviewService.getAllReviews());
    }

    @GetMapping("/business/{businessPageId}")
    public ResponseEntity<List<Review>> getBusinessReviews(@PathVariable Long businessPageId) {
        return ResponseEntity.ok(reviewService.getReviewsByBusinessPageId(businessPageId));
    }

    @PreAuthorize("hasAnyRole('USER','BUSINESS','FARMER','CREATOR')")
    @GetMapping("/gets")
    public ResponseEntity<List<Review>> getMyReviews(
            @AuthenticationPrincipal User loggedUser) {

        return ResponseEntity.ok(
                reviewService.getReviewsByUserId(loggedUser.getUserId())
        );
    }


    // 2️⃣ Create review (only logged-in user)
    @PreAuthorize("hasAnyRole('USER','CREATOR')")
    @PostMapping
    public ResponseEntity<Review> createReview(
            @AuthenticationPrincipal User loggedUser,
            @Valid @RequestBody ReviewDto.CreateReviewDto dto) {
        if (loggedUser.getRole() == Role.ROLE_BUSINESS || loggedUser.getRole() == Role.ROLE_FARMER) {
            throw new RuntimeException("Business seller accounts cannot submit customer feedback");
        }

        Review review = new Review();
        review.setComment(dto.comment());
        review.setRating(dto.rating());
        review.setStatus(dto.status());
        review.setUserId(loggedUser.getUserId());
        review.setUsername(loggedUser.getFirstname() + " " + loggedUser.getLastName());
        review.setBusinessPageId(dto.businessPageId());
        review.setOrderId(dto.orderId());

        return ResponseEntity.ok(reviewService.createReview(review));
    }

    // 3️⃣ Update review (owner only)
    @PreAuthorize("hasAnyRole('USER','BUSINESS','FARMER','CREATOR')")
    @PutMapping("/{id}")
    public ResponseEntity<Review> updateReview(
            @AuthenticationPrincipal User loggedUser,
            @PathVariable Long id,
            @Valid @RequestBody ReviewDto.UpdateReviewDto dto) {

        Review updated = reviewService.updateReview(id, dto, loggedUser.getUserId());
        return ResponseEntity.ok(updated);
    }

    // 4️⃣ Delete review (owner only)
    @PreAuthorize("hasAnyRole('USER','BUSINESS','FARMER','CREATOR')")
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteReview(
            @AuthenticationPrincipal User loggedUser,
            @PathVariable Long id) {

        reviewService.deleteReview(id, loggedUser.getUserId());
        return ResponseEntity.ok("Review deleted successfully");
    }



}

