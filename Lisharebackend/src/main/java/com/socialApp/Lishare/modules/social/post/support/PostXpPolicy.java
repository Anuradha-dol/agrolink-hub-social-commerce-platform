package com.socialApp.Lishare.modules.social.post.support;

import java.util.Locale;

public final class PostXpPolicy {

    private PostXpPolicy() {
    }

    public static int xpForCategory(String category) {
        String normalized = category == null
                ? "GENERAL"
                : category.trim().toUpperCase(Locale.ROOT).replace("-", "_").replace(" ", "_");

        return switch (normalized) {
            case "EDUCATION", "NEWS" -> 5;
            case "BUSINESS" -> 3;
            case "GENERAL" -> 1;
            default -> 2;
        };
    }
}
