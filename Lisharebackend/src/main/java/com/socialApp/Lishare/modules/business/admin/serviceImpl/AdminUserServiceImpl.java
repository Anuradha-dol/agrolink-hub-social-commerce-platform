package com.socialApp.Lishare.modules.business.admin.serviceImpl;

import com.socialApp.Lishare.modules.platform.auth.dto.MailBody;
import com.socialApp.Lishare.modules.platform.user.service.UserProfileService;
import com.socialApp.Lishare.modules.business.admin.dto.AdminDashboardStatsResponse;
import com.socialApp.Lishare.modules.business.admin.dto.AdminUserResponse;
import com.socialApp.Lishare.modules.business.admin.dto.DeleteUserRequest;
import com.socialApp.Lishare.modules.business.admin.dto.UpdateUserModerationRequest;
import com.socialApp.Lishare.modules.business.admin.dto.UpdateUserRoleRequest;
import com.socialApp.Lishare.modules.business.admin.mapper.AdminUserMapper;
import com.socialApp.Lishare.modules.business.admin.service.AdminUserService;
import com.socialApp.Lishare.modules.business.page.repository.BusinessPageRepository;
import com.socialApp.Lishare.modules.platform.common.enums.AccountModerationStatus;
import com.socialApp.Lishare.modules.platform.common.enums.Role;
import com.socialApp.Lishare.modules.platform.user.entity.User;
import com.socialApp.Lishare.modules.business.order.repository.AppOrderRepository;
import com.socialApp.Lishare.modules.business.product.repository.ProductRepository;
import com.socialApp.Lishare.modules.social.post.repository.PostRepository;
import com.socialApp.Lishare.modules.platform.user.repository.UserRepo;
import com.socialApp.Lishare.modules.platform.utils.EmailUtils;
import jakarta.mail.MessagingException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminUserServiceImpl implements AdminUserService {

    private final UserRepo userRepo;
    private final AdminUserMapper mapper;
    private final UserProfileService userProfileService;
    private final PostRepository postRepository;
    private final AppOrderRepository appOrderRepository;
    private final ProductRepository productRepository;
    private final BusinessPageRepository businessPageRepository;
    private final EmailUtils emailUtils;

    @Override
    public Page<AdminUserResponse> getUsers(int page, int size, String query) {
        PageRequest pageable = PageRequest.of(page, size);
        Page<User> users;
        if (query == null || query.isBlank()) {
            users = userRepo.findAll(pageable);
        } else {
            users = userRepo.findByFirstnameContainingIgnoreCaseOrLastNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
                    query, query, query, pageable
            );
        }
        return users.map(mapper::toResponse);
    }

    @Override
    @Transactional
    public AdminUserResponse updateUserRole(Long userId, UpdateUserRoleRequest request) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() == Role.ROLE_ADMIN && request.role() != Role.ROLE_ADMIN) {
            long admins = userRepo.countByRole(Role.ROLE_ADMIN);
            if (admins <= 1) {
                throw new RuntimeException("At least one admin account must remain");
            }
        }

        user.setRole(request.role());
        return mapper.toResponse(userRepo.save(user));
    }

    @Override
    @Transactional
    public AdminUserResponse updateUserModeration(Long userId, UpdateUserModerationRequest request) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() == Role.ROLE_ADMIN && request.status() == AccountModerationStatus.SUSPENDED) {
            long admins = userRepo.countByRole(Role.ROLE_ADMIN);
            if (admins <= 1) {
                throw new RuntimeException("Cannot suspend the last admin account");
            }
        }

        user.setModerationStatus(request.status());
        user.setModerationMessage(request.message() == null ? "" : request.message().trim());
        return mapper.toResponse(userRepo.save(user));
    }

    @Override
    @Transactional
    public void deleteUser(Long userId, DeleteUserRequest request) {
        User target = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (target.getRole() == Role.ROLE_ADMIN) {
            long admins = userRepo.countByRole(Role.ROLE_ADMIN);
            if (admins <= 1) {
                throw new RuntimeException("Cannot delete the last admin account");
            }
        }

        sendDeletionEmail(target, request.reason().trim());
        userProfileService.deleteUser(userId);
    }

    private void sendDeletionEmail(User target, String reason) {
        String body = """
                <html>
                    <body>
                        <h2>Your AgroLink Hub account was deleted</h2>
                        <p>Hello %s,</p>
                        <p>An administrator deleted your account after review.</p>
                        <p><strong>Reason:</strong> %s</p>
                        <p>If you believe this was a mistake, contact AgroLink Hub support.</p>
                    </body>
                </html>
                """.formatted(escapeHtml(target.getFirstname()), escapeHtml(reason));
        try {
            emailUtils.sendMail(new MailBody(target.getEmail(), "AgroLink Hub account deletion notice", body));
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to email deletion reason");
        }
    }

    private String escapeHtml(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    @Override
    public AdminDashboardStatsResponse getDashboardStats() {
        return new AdminDashboardStatsResponse(
                userRepo.count(),
                postRepository.count(),
                appOrderRepository.count(),
                productRepository.count(),
                businessPageRepository.count()
        );
    }
}
