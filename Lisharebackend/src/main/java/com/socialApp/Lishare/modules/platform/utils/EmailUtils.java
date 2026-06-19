package com.socialApp.Lishare.modules.platform.utils;

import com.socialApp.Lishare.modules.platform.auth.dto.MailBody;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

@Component
public class EmailUtils {


    private final JavaMailSender javaMailSender;
    private final String fromAddress;

    public EmailUtils(JavaMailSender javaMailSender,
                      @Value("${spring.mail.username:}") String fromAddress) {
        this.javaMailSender = javaMailSender;
        this.fromAddress = fromAddress;
    }

    public void sendMail(MailBody mailBody) throws MessagingException {
        String sender = fromAddress == null ? "" : fromAddress.trim();
        if (sender.isBlank()) {
            throw new MessagingException("Email sender address is not configured. Set MAIL_USERNAME in .env.");
        }

        MimeMessage message = javaMailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setTo(mailBody.to());
        helper.setFrom(sender);
        helper.setSubject(mailBody.subject());
        helper.setText(mailBody.text(), true); // Set to true for HTML content

        javaMailSender.send(message);
    }


}
