package com.socialApp.Lishare.modules.platform.user.service;

import com.socialApp.Lishare.modules.platform.user.dto.UserDto;
import com.socialApp.Lishare.modules.platform.user.entity.User;

public interface UserProfileService {

    UserDto.UserProfileDto getProfile(Long userId);

    UserDto.PublicProfileDto getPublicProfile(Long userId);

    UserDto.UpdateNameDto updateName(User user, UserDto.UpdateNameDto dto);

    UserDto.UpdateEmailDto updateEmail(User user, UserDto.UpdateEmailDto dto);

    void verifyNewEmail(User user, String otp);

    void updatePassword(User user, UserDto.UpdatePasswordDto dto);

    void deleteAccount(User user, UserDto.DeleteAccountDto dto);

    void requestDeletion(User user);

    void verifyAndDelete(User user, UserDto.DeleteAccountForgotVerifyDto dto);

    UserDto.UserHomeDto getUserHome(Long userId);

    void deleteUser(Long userId);

    // ---------- Utility ----------
    User getCurrentUser(String email);

}
