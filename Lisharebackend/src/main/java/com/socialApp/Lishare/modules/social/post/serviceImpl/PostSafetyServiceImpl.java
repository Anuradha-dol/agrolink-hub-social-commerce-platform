package com.socialApp.Lishare.modules.social.post.serviceImpl;

import com.socialApp.Lishare.modules.social.post.dto.PostResponse;
import com.socialApp.Lishare.modules.social.post.entity.Post;
import com.socialApp.Lishare.modules.platform.user.entity.User;
import com.socialApp.Lishare.modules.social.post.dto.PostReportRequest;
import com.socialApp.Lishare.modules.social.post.dto.PostReportResponse;
import com.socialApp.Lishare.modules.social.post.dto.PostReportStatusUpdateRequest;
import com.socialApp.Lishare.modules.social.post.entity.PostReport;
import com.socialApp.Lishare.modules.social.post.entity.PostReportStatus;
import com.socialApp.Lishare.modules.social.post.entity.SavedPost;
import com.socialApp.Lishare.modules.social.post.repository.PostReportRepository;
import com.socialApp.Lishare.modules.social.post.repository.SavedPostRepository;
import com.socialApp.Lishare.modules.social.post.service.PostSafetyService;
import com.socialApp.Lishare.modules.social.post.repository.PostRepository;
import com.socialApp.Lishare.modules.platform.user.repository.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PostSafetyServiceImpl implements PostSafetyService {

    private final SavedPostRepository savedPostRepository;
    private final PostRepository postRepository;
    private final UserRepo userRepo;
    private final PostReportRepository postReportRepository;

    @Override
    @Transactional
    public void savePost(Long userId, Long postId) {
        if (savedPostRepository.findByUserUserIdAndPostPostId(userId, postId).isPresent()) {
            return;
        }

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        savedPostRepository.save(SavedPost.builder()
                .user(user)
                .post(post)
                .build());
    }

    @Override
    @Transactional
    public void unsavePost(Long userId, Long postId) {
        savedPostRepository.findByUserUserIdAndPostPostId(userId, postId)
                .ifPresent(savedPostRepository::delete);
    }

    @Override
    public Page<PostResponse> getSavedPosts(Long userId, int page, int size) {
        return savedPostRepository.findByUserUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size))
                .map(savedPost -> toPostResponse(savedPost.getPost()));
    }

    @Override
    @Transactional
    public PostReportResponse reportPost(Long userId, Long postId, PostReportRequest request) {
        User reporter = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        PostReport report = PostReport.builder()
                .post(post)
                .reporter(reporter)
                .reason(request.reason().trim())
                .status(PostReportStatus.OPEN)
                .build();

        return toReportResponse(postReportRepository.save(report));
    }

    @Override
    public Page<PostReportResponse> getReports(String status, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<PostReport> reports;
        if (status == null || status.isBlank()) {
            reports = postReportRepository.findAll(pageable);
        } else {
            PostReportStatus parsedStatus = PostReportStatus.valueOf(status.toUpperCase());
            reports = postReportRepository.findByStatusOrderByCreatedAtDesc(parsedStatus, pageable);
        }
        return reports.map(this::toReportResponse);
    }

    @Override
    @Transactional
    public PostReportResponse updateReportStatus(Long reportId, PostReportStatusUpdateRequest request) {
        PostReport report = postReportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Report not found"));

        report.setStatus(request.status());
        return toReportResponse(postReportRepository.save(report));
    }

    private PostResponse toPostResponse(Post post) {
        return PostResponse.builder()
                .postId(post.getPostId())
                .content(post.getContent())
                .imageUrl(post.getImageUrl())
                .authorName(post.getUser().getFirstname() + " " + post.getUser().getLastName())
                .createdAt(post.getCreatedAt())
                .build();
    }

    private PostReportResponse toReportResponse(PostReport report) {
        User reporter = report.getReporter();
        return new PostReportResponse(
                report.getId(),
                report.getPost().getPostId(),
                reporter.getUserId(),
                reporter.getFirstname() + " " + reporter.getLastName(),
                report.getReason(),
                report.getStatus(),
                report.getCreatedAt()
        );
    }
}
