package com.socialApp.Lishare.modules.social.comment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommentRequest {
    @NotBlank(message = "Comment content cannot be empty")
    @Size(max = 1000, message = "Comment content must be at most 1000 characters")
    private String content;
}
