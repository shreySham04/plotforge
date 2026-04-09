package com.writerapp.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import lombok.RequiredArgsConstructor;

import static org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE;

@Service
@RequiredArgsConstructor
public class MailService {

    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${app.mail.from:no-reply@plotforge.app}")
    private String fromAddress;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    public void sendPasswordResetEmail(String recipientEmail, String username, String resetUrl) {
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();

        if (!mailEnabled || mailSender == null) {
            throw new ResponseStatusException(
                    SERVICE_UNAVAILABLE,
                    "Password reset email is not configured yet. Please contact support."
            );
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(recipientEmail);
        message.setSubject("Reset your PlotForge password");
        message.setText(buildResetEmailBody(username, resetUrl));
        mailSender.send(message);
    }

    private String buildResetEmailBody(String username, String resetUrl) {
        return "Hi " + username + ",\n\n"
                + "We received a request to reset your PlotForge password.\n"
                + "Use this link to set a new password:\n\n"
                + resetUrl + "\n\n"
                + "This link expires in 30 minutes.\n"
                + "If you did not request this change, you can ignore this email.\n\n"
                + "- PlotForge Team";
    }
}
