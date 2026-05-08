package com.socialApp.Lishare.modules.platform.user.service;

import com.socialApp.Lishare.modules.platform.user.dto.UserBlockResponse;

import java.util.List;

public interface UserBlockService {
    UserBlockResponse blockUser(Long blockerId, Long blockedId);

    void unblockUser(Long blockerId, Long blockedId);

    List<UserBlockResponse> getBlockedUsers(Long blockerId);
}
