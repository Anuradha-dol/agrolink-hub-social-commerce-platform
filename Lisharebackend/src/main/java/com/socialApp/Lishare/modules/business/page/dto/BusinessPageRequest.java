package com.socialApp.Lishare.modules.business.page.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record BusinessPageRequest(
        @NotBlank(message = "Business name is required")
        @Size(max = 150, message = "Business name must be at most 150 characters")
        String name,

        @Size(max = 1000, message = "Description must be at most 1000 characters")
        String description,

        @Size(max = 100, message = "Category must be at most 100 characters")
        String category
) {}
