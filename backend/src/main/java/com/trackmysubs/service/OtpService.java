package com.trackmysubs.service;

import com.trackmysubs.entity.OtpVerification;
import com.trackmysubs.exception.InvalidRequestException;
import com.trackmysubs.exception.OtpCooldownException;
import com.trackmysubs.exception.OtpRateLimitException;
import com.trackmysubs.repository.OtpVerificationRepository;
import com.trackmysubs.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Random;

@Service
public class OtpService {

    @Autowired
    private OtpVerificationRepository otpRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    private final Random random = new Random();

    @Transactional
    public void sendOtp(String email) {
        validateEmailFormat(email);
        if (userRepository.existsByEmail(email.trim())) {
            throw new InvalidRequestException("Email is already registered.");
        }
        handleOtpGenerationAndSend(email.trim().toLowerCase());
    }

    @Transactional
    public void sendForgotPasswordOtp(String email) {
        validateEmailFormat(email);
        if (!userRepository.existsByEmail(email.trim())) {
            throw new InvalidRequestException("Email is not registered.");
        }
        handleOtpGenerationAndSend(email.trim().toLowerCase());
    }

    private void validateEmailFormat(String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new InvalidRequestException("Email address is required.");
        }
        if (!email.matches("^[a-zA-Z0-9_+&*-]+(?:\\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,7}$")) {
            throw new InvalidRequestException("Invalid email format.");
        }
    }

    private void handleOtpGenerationAndSend(String normalizedEmail) {
        LocalDateTime now = LocalDateTime.now();
        OtpVerification verification = otpRepository.findByEmail(normalizedEmail).orElse(null);

        String otpCode = generate6DigitOtp();
        LocalDateTime expiryTime = now.plusMinutes(5);

        if (verification != null) {
            // Check Cooldown (60 seconds)
            if (verification.getLastRequestAt().plusSeconds(60).isAfter(now)) {
                long secondsLeft = java.time.Duration.between(now, verification.getLastRequestAt().plusSeconds(60)).getSeconds();
                throw new OtpCooldownException("Please wait " + secondsLeft + " seconds before requesting a new OTP.");
            }

            // Check Rate Limit (max 5 requests per hour)
            int currentCount = verification.getRequestCount();
            if (verification.getLastRequestAt().plusHours(1).isBefore(now)) {
                // Last request was > 1 hour ago, reset request count
                currentCount = 0;
            }

            if (currentCount >= 5) {
                throw new OtpRateLimitException("Too many OTP requests. Please try again after an hour.");
            }

            // Update verification entity
            verification.setOtpCode(otpCode);
            verification.setExpiryTime(expiryTime);
            verification.setLastRequestAt(now);
            verification.setRequestCount(currentCount + 1);
            verification.setVerified(false); // reset verified flag on new request
            otpRepository.save(verification);
        } else {
            // Create new verification entity
            verification = new OtpVerification(
                    normalizedEmail,
                    otpCode,
                    expiryTime,
                    now,
                    1,
                    false
            );
            otpRepository.save(verification);
        }

        // Send Email
        emailService.sendOtpEmail(normalizedEmail, otpCode);
    }

    @Transactional
    public void verifyOtp(String email, String otp) {
        if (email == null || email.trim().isEmpty()) {
            throw new InvalidRequestException("Email is required.");
        }
        if (otp == null || otp.trim().isEmpty()) {
            throw new InvalidRequestException("Verification code is required.");
        }

        String normalizedEmail = email.trim().toLowerCase();
        OtpVerification verification = otpRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new InvalidRequestException("Verification code not found. Please request a new OTP."));

        // If already verified, allow success response
        if (verification.isVerified() && verification.getOtpCode().equals(otp.trim())) {
            return;
        }

        // Check expiry
        if (verification.getExpiryTime().isBefore(LocalDateTime.now())) {
            throw new InvalidRequestException("OTP has expired. Please request a new code.");
        }

        // Check match
        if (!verification.getOtpCode().equals(otp.trim())) {
            throw new InvalidRequestException("Invalid verification code. Please check the code and try again.");
        }

        // Update verified status
        verification.setVerified(true);
        otpRepository.save(verification);
    }

    private String generate6DigitOtp() {
        return String.format("%06d", random.nextInt(1000000));
    }
}
