package com.socialApp.Lishare.modules.business.admin.mapper;

import com.socialApp.Lishare.modules.business.admin.dto.AdminUserResponse;
import com.socialApp.Lishare.modules.platform.user.entity.User;
import org.springframework.stereotype.Component;

@Component
public class AdminUserMapper {

    public AdminUserResponse toResponse(User user) {
        return new AdminUserResponse(
                user.getUserId(),
                user.getFirstname(),
                user.getLastName(),
                user.getEmail(),
                user.getPhoneNumber(),
                user.getRole(),
                user.getIsVerified()
        );
    }
}
