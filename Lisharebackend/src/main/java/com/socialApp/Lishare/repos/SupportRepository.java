package com.socialApp.Lishare.repos;

import com.socialApp.Lishare.entities.SupportQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SupportRepository extends JpaRepository<SupportQuestion, Long> {

    List<SupportQuestion> findByUserId(Long userId);
}

