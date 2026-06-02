package com.socialApp.Lishare.modules.platform.config;

import com.socialApp.Lishare.modules.platform.storage.UploadPathResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

    private final UploadPathResolver uploadPathResolver;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        uploadPathResolver.ensurePrimaryUploadPath();
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(uploadPathResolver.resourceLocations());
    }
}
