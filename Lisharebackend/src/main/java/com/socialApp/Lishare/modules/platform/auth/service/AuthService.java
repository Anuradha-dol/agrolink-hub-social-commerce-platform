package com.socialApp.Lishare.modules.platform.auth.service;

import com.socialApp.Lishare.modules.platform.auth.dto.AuthResponse;
import com.socialApp.Lishare.modules.platform.auth.dto.LoginRequest;
import com.socialApp.Lishare.modules.platform.user.dto.UserDto;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public interface AuthService {


    AuthResponse signUp(UserDto.RegisterRequest  registerRequest);

    AuthResponse SignIn(LoginRequest loginRequest, HttpServletResponse response);

    AuthResponse verifyCode(String email, String verifyCode);


    AuthResponse resendOtp(String email);

    AuthResponse refreshSession(HttpServletRequest request, HttpServletResponse response);

    void logout(HttpServletRequest request, HttpServletResponse response);


}
