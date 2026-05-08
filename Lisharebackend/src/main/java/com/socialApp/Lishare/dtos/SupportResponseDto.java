package com.socialApp.Lishare.dtos;

import jakarta.validation.constraints.NotBlank;

public record SupportResponseDto(
        @NotBlank String response
) {}
