package com.trackmysubs.service;

import com.trackmysubs.dto.AuthRequest;
import com.trackmysubs.dto.AuthResponse;
import com.trackmysubs.entity.OtpVerification;
import com.trackmysubs.entity.User;
import com.trackmysubs.exception.AuthenticationException;
import com.trackmysubs.exception.InvalidRequestException;
import com.trackmysubs.repository.OtpVerificationRepository;
import com.trackmysubs.repository.UserRepository;
import com.trackmysubs.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OtpVerificationRepository otpVerificationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Transactional
    public String register(AuthRequest request) {
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new InvalidRequestException("Email is required");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new InvalidRequestException("Email is already in use");
        }
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new InvalidRequestException("Name is required");
        }

        // Enforce Email OTP verification
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        OtpVerification verification = otpVerificationRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new InvalidRequestException("Email verification is required before creating an account."));

        if (!verification.isVerified()) {
            throw new InvalidRequestException("Email verification is incomplete. Please verify the OTP code first.");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        userRepository.save(user);

        // Cleanup verification record
        otpVerificationRepository.delete(verification);

        return "User registered successfully";
    }

    public AuthResponse login(AuthRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AuthenticationException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new AuthenticationException("Invalid email or password");
        }

        String token = jwtUtil.generateToken(user.getEmail());
        return new AuthResponse(token);
    }
}
