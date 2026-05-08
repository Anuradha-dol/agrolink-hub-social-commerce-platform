package com.socialApp.Lishare.modules.platform.auth.repository;

import com.socialApp.Lishare.modules.platform.auth.entity.ForgotPassword;
import com.socialApp.Lishare.modules.platform.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ForgotPasswordRepository extends JpaRepository<ForgotPassword, Integer> {

    // 🔹 Used when verifying OTP
    Optional<ForgotPassword> findByOtpAndUser(Integer otp, User user);

    // 🔹 Used to ensure ONE OTP per user (VERY IMPORTANT)
    Optional<ForgotPassword> findByUser(User user);
}
