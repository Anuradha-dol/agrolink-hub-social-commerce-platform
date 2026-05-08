package com.socialApp.Lishare.modules.business.admin.controller;

import com.socialApp.Lishare.modules.platform.common.response.ApiResponse;
import com.socialApp.Lishare.modules.social.post.dto.PostReportResponse;
import com.socialApp.Lishare.modules.social.post.dto.PostReportStatusUpdateRequest;
import com.socialApp.Lishare.modules.social.post.service.PostSafetyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/reports")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminReportController {

    private final PostSafetyService postSafetyService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<PostReportResponse>>> listReports(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Post reports fetched",
                postSafetyService.getReports(status, page, size)
        ));
    }

    @PutMapping("/{reportId}/status")
    public ResponseEntity<ApiResponse<PostReportResponse>> updateStatus(
            @PathVariable Long reportId,
            @Valid @RequestBody PostReportStatusUpdateRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Report status updated",
                postSafetyService.updateReportStatus(reportId, request)
        ));
    }
}
