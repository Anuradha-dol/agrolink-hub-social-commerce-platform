package com.socialApp.Lishare.modules.platform.user.repository;

import com.socialApp.Lishare.modules.platform.user.entity.User;
import com.socialApp.Lishare.modules.platform.common.enums.Role;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepo extends JpaRepository<User, Long> {


    Optional<User> findByEmail(String email);

    Optional<User> findByUsernameIgnoreCase(String username);

    Optional<User> findByRefreshToken(String refreshToken);

    Optional<User> findByPhoneNumber(String phoneNumber);






    @Transactional
    @Modifying
    @Query("update User u set u.password= ?2 where u.email = ?1")
    void updatePassword(String email, String password);

    @Query("""
            SELECT u FROM User u
            WHERE u.userId <> :excludeId
            AND (
                LOWER(u.firstname) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(u.lastName) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%'))
            )
            """)
    List<User> searchUsers(@Param("query") String query, @Param("excludeId") Long excludeId);

    Page<User> findByFirstnameContainingIgnoreCaseOrLastNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
            String firstname,
            String lastName,
            String email,
            Pageable pageable
    );

    long countByRole(Role role);
}
