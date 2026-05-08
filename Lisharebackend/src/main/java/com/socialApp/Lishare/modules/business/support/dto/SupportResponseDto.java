package com.socialApp.Lishare.modules.business.support.dto;

import jakarta.validation.constraints.NotBlank;

public record SupportResponseDto(
        @NotBlank String response
) {}
