package com.socialApp.Lishare.repos;

import com.socialApp.Lishare.entities.ForgotPassword;
import com.socialApp.Lishare.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ForgotPasswordRepository extends JpaRepository<ForgotPassword, Integer> {

    // 🔹 Used when verifying OTP
    Optional<ForgotPassword> findByOtpAndUser(Integer otp, User user);

    // 🔹 Used to ensure ONE OTP per user (VERY IMPORTANT)
    Optional<ForgotPassword> findByUser(User user);
}
