package com.socialApp.Lishare.modules.platform.utils;

import java.security.SecureRandom;

public final class OtpUtils {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private OtpUtils() {
    }

    public static int sixDigitOtp() {
        return 100_000 + SECURE_RANDOM.nextInt(900_000);
    }
}
