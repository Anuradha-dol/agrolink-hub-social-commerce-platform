package com.socialApp.Lishare.Service;

import com.socialApp.Lishare.dtos.AuthResponse;
import com.socialApp.Lishare.dtos.LoginRequest;
import com.socialApp.Lishare.dtos.UserDto;
import jakarta.servlet.http.HttpServletResponse;

public interface AuthService {


    AuthResponse signUp(UserDto.RegisterRequest  registerRequest);

    AuthResponse SignIn(LoginRequest loginRequest, HttpServletResponse response);

    AuthResponse verifyCode(String email, String verifyCode);


    AuthResponse resendOtp(String email);


}
