package com.socialApp.Lishare.modules.social.share.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ShareRequest {
    @Size(max = 500, message = "Caption must be at most 500 characters")
    private String caption;

}
