package com.socialApp.Lishare.modules.platform.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(

        @NotBlank(message = "email is required")
        @Email(message = "please provide valid email")
        String email,
        @NotBlank(message = "password is required ") String password) {

}
