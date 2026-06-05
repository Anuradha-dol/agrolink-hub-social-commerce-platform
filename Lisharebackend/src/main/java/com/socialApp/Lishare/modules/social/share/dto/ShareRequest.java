package com.socialApp.Lishare.modules.social.share.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ShareRequest {
    @Size(max = 500, message = "Caption must be at most 500 characters")
    private String caption;

    private Boolean notifyFollowers;

    @Size(max = 20, message = "Too many mentions")
    private List<Long> mentionedUserIds;

    @Size(max = 20, message = "Post value is too long")
    private String postValue;

    @Size(max = 30, message = "Audience is too long")
    private String audience;

}
