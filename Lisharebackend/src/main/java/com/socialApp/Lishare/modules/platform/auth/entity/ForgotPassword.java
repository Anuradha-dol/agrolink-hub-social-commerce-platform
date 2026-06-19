package com.socialApp.Lishare.modules.platform.auth.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.socialApp.Lishare.modules.platform.auth.dto.RecoveryChannel;
import com.socialApp.Lishare.modules.platform.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.jspecify.annotations.Nullable;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Date;

@Entity
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Builder
public class ForgotPassword {


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer fid;

    @Column(nullable = false)
    private Integer otp;

    @Column(nullable = false)
    private Date expirationTime;

    // Resend OTP tracking
    private Integer resendCount;          // number of times OTP was resent
    private Date firstResendTime;
    // start time of resend window

    // Stores the recovery channel used for the current OTP.
    @Enumerated(EnumType.STRING)
    private RecoveryChannel recoveryChannel;

    private Date blockUntil;           // if blocked, store block end time
    private Date lastSentAt;


    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User user;


}
