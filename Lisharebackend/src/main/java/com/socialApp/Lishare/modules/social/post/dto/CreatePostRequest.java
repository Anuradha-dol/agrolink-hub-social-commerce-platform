package com.socialApp.Lishare.modules.social.post.dto;



import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class CreatePostRequest {

    private String content;
    private MultipartFile image;
}
