package com.socialApp.Lishare.dtos;

import lombok.Builder;

@Builder
public record MailBody(String to,String subject, String text ) {
}
