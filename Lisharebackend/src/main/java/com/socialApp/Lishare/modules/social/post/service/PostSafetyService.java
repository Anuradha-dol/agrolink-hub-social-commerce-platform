package com.socialApp.Lishare.modules.social.post.service;

import com.socialApp.Lishare.modules.social.post.dto.PostResponse;
import com.socialApp.Lishare.modules.social.post.dto.PostReportRequest;
import com.socialApp.Lishare.modules.social.post.dto.PostReportResponse;
import com.socialApp.Lishare.modules.social.post.dto.PostReportStatusUpdateRequest;
import org.springframework.data.domain.Page;

public interface PostSafetyService {
    void savePost(Long userId, Long postId);

    void unsavePost(Long userId, Long postId);

    Page<PostResponse> getSavedPosts(Long userId, int page, int size);

    PostReportResponse reportPost(Long userId, Long postId, PostReportRequest request);

    Page<PostReportResponse> getReports(String status, int page, int size);

    PostReportResponse updateReportStatus(Long reportId, PostReportStatusUpdateRequest request);
}
