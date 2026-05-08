package com.socialApp.Lishare.repos;

import com.socialApp.Lishare.entities.User;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepo extends JpaRepository<User, Long> {


    Optional<User> findByEmail(String email);

    Optional<User> findByRefreshToken(String refreshToken);

    Optional<User> findByPhoneNumber(String phoneNumber);






    @Transactional
    @Modifying
    @Query("update User u set u.password= ?2 where u.email = ?1")
    void updatePassword(String email, String password);

    @Query("SELECT u FROM User u WHERE LOWER(u.firstname) LIKE LOWER(CONCAT('%', :query, '%')) AND u.userId <> :excludeId")
    List<User> searchUsers(@Param("query") String query, @Param("excludeId") Long excludeId);
}