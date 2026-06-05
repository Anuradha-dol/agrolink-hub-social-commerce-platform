package com.socialApp.Lishare.modules.business.review.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public class ReviewDto {

    public record CreateReviewDto(
            @NotBlank String comment,
            @Min(1) @Max(5) int rating,
            @NotBlank String status,
            Long businessPageId,
            Long orderId
    ) {}

    public record UpdateReviewDto(
            @NotBlank String comment,
            @Min(1) @Max(5) int rating,
            @NotBlank String status
    ) {}
}
