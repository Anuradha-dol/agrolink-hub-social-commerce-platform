package com.socialApp.Lishare.modules.social.post.repository;

import com.socialApp.Lishare.modules.social.post.entity.PostReport;
import com.socialApp.Lishare.modules.social.post.entity.PostReportStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostReportRepository extends JpaRepository<PostReport, Long> {
    Page<PostReport> findByStatusOrderByCreatedAtDesc(PostReportStatus status, Pageable pageable);
}
