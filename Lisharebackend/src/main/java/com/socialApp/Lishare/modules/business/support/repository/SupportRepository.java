package com.socialApp.Lishare.modules.business.support.repository;

import com.socialApp.Lishare.modules.business.support.entity.SupportQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SupportRepository extends JpaRepository<SupportQuestion, Long> {

    List<SupportQuestion> findByUserId(Long userId);
}

