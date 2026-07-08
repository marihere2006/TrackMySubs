package com.trackmysubs.service;

import com.trackmysubs.exception.MailSendingException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Autowired
    private JavaMailSender mailSender;

    public void sendOtpEmail(String toEmail, String otp) {
        logger.info("sendOtpEmail requested for: {}", toEmail);

        if (mailSender == null) {
            logger.error("JavaMailSender is not initialized. Cannot send real email.");
            throw new MailSendingException("Email configuration is incomplete on the server.");
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("TrackMySubs - Email Verification Code");
            message.setText("Hello,\n\n" +
                    "Your 6-digit email verification code is: " + otp + "\n\n" +
                    "This code will expire in 5 minutes.\n\n" +
                    "If you did not request this code, please ignore this email.\n\n" +
                    "Best regards,\n" +
                    "TrackMySubs Team");
            
            mailSender.send(message);
            logger.info("Real OTP email successfully sent to {}", toEmail);
        } catch (MailException ex) {
            logger.error("Failed to send email to {}: {}", toEmail, ex.getMessage(), ex);
            throw new MailSendingException("Failed to send verification email. Please contact support or try again later.");
        }
    }

    public void sendExpiryReminderEmail(String toEmail, String serviceName, java.time.LocalDate expiryDate, java.math.BigDecimal cost) {
        logger.info("sendExpiryReminderEmail requested for: {} regarding {}", toEmail, serviceName);

        if (mailSender == null) {
            logger.error("JavaMailSender is not initialized. Cannot send real email.");
            return; // Don't throw exception for background jobs to prevent crashing the scheduler loop
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("TrackMySubs - Action Required: " + serviceName + " is Expiring Soon");
            message.setText("Hello,\n\n" +
                    "This is an automated reminder that your subscription for " + serviceName + " is expiring soon.\n\n" +
                    "Details:\n" +
                    "- Service: " + serviceName + "\n" +
                    "- Expiry Date: " + expiryDate + "\n" +
                    "- Cost: " + cost + "\n\n" +
                    "Please take necessary action to renew or cancel this subscription to avoid unwanted charges or interruptions.\n\n" +
                    "Best regards,\n" +
                    "TrackMySubs Team");
            
            mailSender.send(message);
            logger.info("Expiry reminder email successfully sent to {}", toEmail);
        } catch (MailException ex) {
            logger.error("Failed to send expiry email to {}: {}", toEmail, ex.getMessage(), ex);
        }
    }

    public void sendSubscriptionExpiredEmail(String toEmail, String serviceName, java.time.LocalDate expiryDate, java.math.BigDecimal cost) {
        logger.info("sendSubscriptionExpiredEmail requested for: {} regarding {}", toEmail, serviceName);

        if (mailSender == null) {
            logger.error("JavaMailSender is not initialized. Cannot send real email.");
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("TrackMySubs - Notice: " + serviceName + " has Expired");
            message.setText("Hello,\n\n" +
                    "This is an automated notice that your subscription for " + serviceName + " has expired.\n\n" +
                    "Details:\n" +
                    "- Service: " + serviceName + "\n" +
                    "- Expiry Date: " + expiryDate + "\n" +
                    "- Cost: " + cost + "\n\n" +
                    "We have automatically updated your subscription status to EXPIRED in your dashboard.\n\n" +
                    "Best regards,\n" +
                    "TrackMySubs Team");
            
            mailSender.send(message);
            logger.info("Expired notice email successfully sent to {}", toEmail);
        } catch (MailException ex) {
            logger.error("Failed to send expired email to {}: {}", toEmail, ex.getMessage(), ex);
        }
    }
}
