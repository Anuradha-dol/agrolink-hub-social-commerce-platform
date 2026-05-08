package com.socialApp.Lishare.modules.business.admin.serviceImpl;

import com.socialApp.Lishare.modules.platform.user.service.UserProfileService;
import com.socialApp.Lishare.modules.business.admin.dto.AdminDashboardStatsResponse;
import com.socialApp.Lishare.modules.business.admin.dto.AdminUserResponse;
import com.socialApp.Lishare.modules.business.admin.dto.UpdateUserRoleRequest;
import com.socialApp.Lishare.modules.business.admin.mapper.AdminUserMapper;
import com.socialApp.Lishare.modules.business.admin.service.AdminUserService;
import com.socialApp.Lishare.modules.business.page.repository.BusinessPageRepository;
import com.socialApp.Lishare.modules.platform.common.enums.Role;
import com.socialApp.Lishare.modules.platform.user.entity.User;
import com.socialApp.Lishare.modules.business.order.repository.AppOrderRepository;
import com.socialApp.Lishare.modules.business.product.repository.ProductRepository;
import com.socialApp.Lishare.modules.social.post.repository.PostRepository;
import com.socialApp.Lishare.modules.platform.user.repository.UserRepo;
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
    public void deleteUser(Long userId) {
        User target = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (target.getRole() == Role.ROLE_ADMIN) {
            long admins = userRepo.countByRole(Role.ROLE_ADMIN);
            if (admins <= 1) {
                throw new RuntimeException("Cannot delete the last admin account");
            }
        }

        userProfileService.deleteUser(userId);
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
