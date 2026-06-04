package com.socialApp.Lishare.modules.social.mention.service;

import com.socialApp.Lishare.modules.platform.user.entity.User;
import com.socialApp.Lishare.modules.platform.user.repository.UserRepo;
import com.socialApp.Lishare.modules.social.notification.entity.Notification;
import com.socialApp.Lishare.modules.social.notification.entity.NotificationType;
import com.socialApp.Lishare.modules.social.notification.repository.NotificationRepository;
import com.socialApp.Lishare.modules.social.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class MentionNotificationService {

    private static final Pattern MENTION_PATTERN = Pattern.compile("(^|\\s)@([A-Za-z0-9_]{2,40})");

    private final UserRepo userRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;

    @Transactional
    public void notifyMentions(User actor, String text, Long postId, Long commentId, Long replyId, String targetType) {
        if (actor == null || actor.getUserId() == null || text == null || text.isBlank() || postId == null) {
            return;
        }

        String normalizedTarget = normalizeTargetType(targetType);
        Long referenceId = switch (normalizedTarget) {
            case "REPLY" -> replyId;
            case "COMMENT" -> commentId;
            default -> postId;
        };
        if (referenceId == null) {
            return;
        }

        for (String token : extractMentionTokens(text)) {
            Optional<User> mentionedUser = userRepository.findMentionTarget(token);
            if (mentionedUser.isEmpty()) {
                continue;
            }
            User recipient = mentionedUser.get();
            if (recipient.getUserId() == null || recipient.getUserId().equals(actor.getUserId())) {
                continue;
            }

            boolean duplicate = notificationRepository.existsByUserUserIdAndActorUserUserIdAndTypeAndReferenceTypeAndReferenceId(
                    recipient.getUserId(),
                    actor.getUserId(),
                    NotificationType.MENTION,
                    normalizedTarget,
                    referenceId
            );
            if (duplicate) {
                continue;
            }

            notificationService.publish(Notification.builder()
                    .user(recipient)
                    .actorUser(actor)
                    .type(NotificationType.MENTION)
                    .referenceId(referenceId)
                    .referenceType(normalizedTarget)
                    .postId(postId)
                    .commentId(commentId)
                    .replyId(replyId)
                    .message(displayName(actor) + " mentioned you in a " + normalizedTarget.toLowerCase(Locale.ROOT))
                    .read(false)
                    .build());
        }
    }

    private Set<String> extractMentionTokens(String text) {
        Set<String> tokens = new LinkedHashSet<>();
        Matcher matcher = MENTION_PATTERN.matcher(text);
        while (matcher.find()) {
            tokens.add(matcher.group(2));
        }
        return tokens;
    }

    private String normalizeTargetType(String targetType) {
        if (targetType == null || targetType.isBlank()) {
            return "POST";
        }
        String normalized = targetType.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case "COMMENT", "REPLY" -> normalized;
            default -> "POST";
        };
    }

    private String displayName(User user) {
        String name = ((user.getFirstname() == null ? "" : user.getFirstname()) + " "
                + (user.getLastName() == null ? "" : user.getLastName())).trim();
        return name.isBlank() ? "Someone" : name;
    }
}
