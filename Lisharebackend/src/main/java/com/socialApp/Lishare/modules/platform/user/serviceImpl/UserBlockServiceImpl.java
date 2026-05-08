package com.socialApp.Lishare.modules.platform.user.serviceImpl;

import com.socialApp.Lishare.modules.platform.user.entity.User;
import com.socialApp.Lishare.modules.platform.user.repository.UserRepo;
import com.socialApp.Lishare.modules.platform.user.dto.UserBlockResponse;
import com.socialApp.Lishare.modules.platform.user.entity.UserBlock;
import com.socialApp.Lishare.modules.platform.user.repository.UserBlockRepository;
import com.socialApp.Lishare.modules.platform.user.service.UserBlockService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserBlockServiceImpl implements UserBlockService {

    private final UserBlockRepository userBlockRepository;
    private final UserRepo userRepo;

    @Override
    @Transactional
    public UserBlockResponse blockUser(Long blockerId, Long blockedId) {
        if (blockerId.equals(blockedId)) {
            throw new RuntimeException("You cannot block yourself");
        }

        if (userBlockRepository.existsByBlockerUserIdAndBlockedUserId(blockerId, blockedId)) {
            User blockedUser = userRepo.findById(blockedId).orElseThrow(() -> new RuntimeException("User not found"));
            return new UserBlockResponse(
                    null,
                    blockedUser.getUserId(),
                    blockedUser.getFirstname() + " " + blockedUser.getLastName(),
                    null
            );
        }

        User blocker = userRepo.findById(blockerId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        User blocked = userRepo.findById(blockedId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserBlock saved = userBlockRepository.save(UserBlock.builder()
                .blocker(blocker)
                .blocked(blocked)
                .build());

        return toResponse(saved);
    }

    @Override
    @Transactional
    public void unblockUser(Long blockerId, Long blockedId) {
        userBlockRepository.findByBlockerUserIdAndBlockedUserId(blockerId, blockedId)
                .ifPresent(userBlockRepository::delete);
    }

    @Override
    public List<UserBlockResponse> getBlockedUsers(Long blockerId) {
        return userBlockRepository.findByBlockerUserId(blockerId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private UserBlockResponse toResponse(UserBlock block) {
        User blocked = block.getBlocked();
        return new UserBlockResponse(
                block.getId(),
                blocked.getUserId(),
                blocked.getFirstname() + " " + blocked.getLastName(),
                block.getCreatedAt()
        );
    }
}
