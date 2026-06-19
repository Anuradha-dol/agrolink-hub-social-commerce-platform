package com.socialApp.Lishare.modules.platform.user.service;

import com.socialApp.Lishare.modules.platform.auth.dto.MailBody;
import com.socialApp.Lishare.modules.platform.calendar.repository.CalendarEventRepository;
import com.socialApp.Lishare.modules.platform.user.dto.UserDto;
import com.socialApp.Lishare.modules.platform.auth.entity.ForgotPassword;
import com.socialApp.Lishare.modules.platform.auth.repository.ForgotPasswordRepository;
import com.socialApp.Lishare.modules.social.notification.repository.NotificationRepository;
import com.socialApp.Lishare.modules.social.comment.repository.CommentRepository;
import com.socialApp.Lishare.modules.social.follow.repository.FollowRepository;
import com.socialApp.Lishare.modules.social.friend.repository.FriendRepository;
import com.socialApp.Lishare.modules.social.post.support.PostXpPolicy;
import com.socialApp.Lishare.modules.social.post.repository.PostRepository;
import com.socialApp.Lishare.modules.social.reaction.repository.ReactionRepository;
import com.socialApp.Lishare.modules.social.share.repository.ShareRepository;
import com.socialApp.Lishare.modules.platform.user.entity.User;
import com.socialApp.Lishare.modules.platform.user.repository.UserRepo;
import com.socialApp.Lishare.modules.platform.utils.EmailUtils;
import com.socialApp.Lishare.modules.platform.utils.OtpUtils;
import jakarta.mail.MessagingException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Date;

@Service
@RequiredArgsConstructor
public class UserProfileServiceImpl implements UserProfileService {

    private final UserRepo userRepo;
    private final PasswordEncoder passwordEncoder;
    private final ForgotPasswordRepository forgotPasswordRepository;
    private final EmailUtils emailUtils;

    private final FriendRepository friendRepo;
    private final FollowRepository followRepo;
    private final ReactionRepository reactionRepo;
    private final CommentRepository commentRepo;
    private final ShareRepository shareRepo;
    private final PostRepository postRepo;
    private final NotificationRepository notificationRepository;
    private final CalendarEventRepository calendarEventRepository;


    @Override
    public User getCurrentUser(String email) {
        return userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Transactional
    @Override
    public void deleteAccount(User user, UserDto.DeleteAccountDto dto) {
        if (!passwordEncoder.matches(dto.currentPassword(), user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }
        userRepo.delete(user);
    }

    @Transactional
    @Override
    public void requestDeletion(User user) {
        int otp = OtpUtils.sixDigitOtp();
        Date expiration = new Date(System.currentTimeMillis() + 10 * 60 * 1000);

        ForgotPassword fp = forgotPasswordRepository.findByUser(user)
                .orElse(new ForgotPassword());

        fp.setOtp(otp);
        fp.setExpirationTime(expiration);
        fp.setUser(user);
        forgotPasswordRepository.save(fp);

        try {
            emailUtils.sendMail(new MailBody(
                    user.getEmail(),
                    "OTP for Account Deletion",
                    "Your OTP is: " + otp + " (valid 10 minutes)"
            ));
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send OTP");
        }
    }

    @Transactional
    @Override
    public void verifyAndDelete(User user, UserDto.DeleteAccountForgotVerifyDto dto) {
        ForgotPassword fp = forgotPasswordRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("OTP not requested"));

        if (!fp.getOtp().equals(Integer.parseInt(dto.otp()))) {
            throw new RuntimeException("Invalid OTP");
        }

        if (fp.getExpirationTime().before(new Date())) {
            throw new RuntimeException("OTP expired");
        }

        userRepo.delete(user);
        forgotPasswordRepository.delete(fp);
    }

    @Transactional
    @Override
    public UserDto.UpdateNameDto updateName(User user, UserDto.UpdateNameDto dto) {
        user.setFirstname(dto.name());
        user.setLastName(dto.lastName());
        userRepo.save(user);
        return new UserDto.UpdateNameDto(user.getFirstname(), user.getLastName());
    }

    @Transactional
    @Override
    public UserDto.UserProfileDto updateProfileDetails(User user, UserDto.UpdateProfileDetailsDto dto) {
        String username = clean(dto.username());
        if (username != null) {
            userRepo.findByUsernameIgnoreCase(username)
                    .filter(existing -> !existing.getUserId().equals(user.getUserId()))
                    .ifPresent(existing -> {
                        throw new RuntimeException("Username already in use");
                    });
        }

        String phoneNumber = clean(dto.phoneNumber());
        if (phoneNumber != null) {
            userRepo.findByPhoneNumber(phoneNumber)
                    .filter(existing -> !existing.getUserId().equals(user.getUserId()))
                    .ifPresent(existing -> {
                        throw new RuntimeException("Phone number already registered");
                    });
        }

        user.setUsername(username);
        user.setPhoneNumber(phoneNumber);
        user.setBackupEmail(clean(dto.backupEmail()));
        user.setBio(clean(dto.bio()));
        user.setLocation(clean(dto.location()));
        user.setPreferredLanguage(clean(dto.preferredLanguage()));
        user.setWebsite(clean(dto.website()));
        user.setInterests(clean(dto.interests()));
        user.setHobbies(clean(dto.hobbies()));

        return toProfileDto(userRepo.save(user));
    }

    @Transactional
    @Override
    public UserDto.UpdateEmailDto updateEmail(User user, UserDto.UpdateEmailDto dto) {
        String newEmail = dto.newEmail();

        if (userRepo.findByEmail(newEmail).isPresent()) {
            throw new RuntimeException("Email already in use");
        }

        user.setTempEmail(newEmail);
        int otp = OtpUtils.sixDigitOtp();
        user.setVerifyCode(String.valueOf(otp));
        user.setVerifyCodeExpiry(new Date(System.currentTimeMillis() + 5 * 60 * 1000));
        user.setLastOtpSentAt(new Date());

        userRepo.save(user);

        try {
            emailUtils.sendMail(new MailBody(
                    newEmail,
                    "Verify new email",
                    "Your OTP for updating email is: " + otp + " (valid for 5 minutes)"
            ));
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send OTP");
        }

        return new UserDto.UpdateEmailDto(newEmail);
    }

    @Transactional
    @Override
    public void verifyNewEmail(User user, String otp) {
        if (!user.getVerifyCode().equals(otp)) {
            throw new RuntimeException("Invalid OTP");
        }

        if (user.getVerifyCodeExpiry().before(new Date())) {
            throw new RuntimeException("OTP expired");
        }

        user.setEmail(user.getTempEmail());
        user.setTempEmail(null);
        user.setVerifyCode(null);
        user.setVerifyCodeExpiry(null);
        userRepo.save(user);
    }

    @Transactional
    @Override
    public void updatePassword(User user, UserDto.UpdatePasswordDto dto) {
        if (!passwordEncoder.matches(dto.currentPassword(), user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }

        if (!dto.newPassword().equals(dto.confirmPassword())) {
            throw new RuntimeException("New passwords do not match");
        }

        user.setPassword(passwordEncoder.encode(dto.newPassword()));
        userRepo.save(user);
    }

    @Override
    public UserDto.UserHomeDto getUserHome(Long userId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        long unreadNotifications = notificationRepository.countByUserUserIdAndReadFalse(userId);
        long upcomingEvents = calendarEventRepository.countMyUpcomingEvents(userId, LocalDateTime.now());
        return new UserDto.UserHomeDto(
                "Welcome back, " + user.getFirstname() + "!",
                toSafeInt(unreadNotifications),
                toSafeInt(upcomingEvents)
        );
    }

    @Override
    public UserDto.UserProfileDto getProfile(Long userId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return toProfileDto(user);
    }

    @Override
    public UserDto.PublicProfileDto getPublicProfile(Long userId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return new UserDto.PublicProfileDto(
                user.getUserId(),
                user.getFirstname(),
                user.getLastName(),
                user.getImageUrl(),
                user.getCoverImageUrl(),
                calculateVerifiedXp(user),
                user.getUsername(),
                user.getBio(),
                user.getLocation(),
                user.getPreferredLanguage(),
                user.getWebsite(),
                user.getInterests(),
                user.getHobbies()
        );
    }

    private UserDto.UserProfileDto toProfileDto(User user) {
        return new UserDto.UserProfileDto(
                user.getUserId(),
                user.getFirstname(),
                user.getEmail(),
                user.getLastName(),
                user.getRole(),
                user.getPhoneNumber(),
                user.getTempEmail(),
                user.getImageUrl(),
                user.getCoverImageUrl(),
                calculateVerifiedXp(user),
                user.getModerationStatus(),
                user.getModerationMessage(),
                user.getUsername(),
                user.getBackupEmail(),
                user.getBio(),
                user.getLocation(),
                user.getPreferredLanguage(),
                user.getWebsite(),
                user.getInterests(),
                user.getHobbies()
        );
    }

    private String clean(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private long calculateVerifiedXp(User user) {
        return postRepo.findByUser(user).stream()
                .mapToLong(this::resolvePostXp)
                .sum();
    }

    private int resolvePostXp(com.socialApp.Lishare.modules.social.post.entity.Post post) {
        if (post.getXpAwarded() != null && post.getXpAwarded() > 0) {
            return post.getXpAwarded();
        }
        return PostXpPolicy.xpForCategory(post.getCategory());
    }

    private int toSafeInt(long value) {
        return (int) Math.min(Integer.MAX_VALUE, Math.max(0, value));
    }

    @Transactional
    public void deleteUser(Long userId) {

        // Delete in safe order
        commentRepo.deleteAllByUserId(userId);
        friendRepo.deleteAllUserFriends(userId);
        followRepo.deleteAllUserFollows(userId);
        reactionRepo.deleteAllByUserId(userId);

        shareRepo.deleteAllByUserId(userId);
        postRepo.deleteAllByUserId(userId);

        userRepo.deleteById(userId);
    }
}
