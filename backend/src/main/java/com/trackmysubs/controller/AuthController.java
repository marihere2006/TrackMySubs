package com.trackmysubs.controller;

import com.trackmysubs.dto.ApiResponse;
import com.trackmysubs.dto.AuthRequest;
import com.trackmysubs.dto.AuthResponse;
import com.trackmysubs.dto.OtpRequest;
import com.trackmysubs.service.AuthService;
import com.trackmysubs.service.OtpService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private OtpService otpService;

    @PostMapping("/send-otp")
    public ResponseEntity<ApiResponse<String>> sendOtp(@Valid @RequestBody OtpRequest request) {
        otpService.sendOtp(request.getEmail());
        ApiResponse<String> response = new ApiResponse<>(true, "Verification code sent successfully", "OTP code sent");
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<String>> verifyOtp(@Valid @RequestBody OtpRequest request) {
        otpService.verifyOtp(request.getEmail(), request.getOtp());
        ApiResponse<String> response = new ApiResponse<>(true, "Email verified successfully", "Email verified");
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<String>> register(@Valid @RequestBody AuthRequest request) {
        String result = authService.register(request);
        ApiResponse<String> response = new ApiResponse<>(true, "User registered successfully", result);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody AuthRequest request) {
        AuthResponse result = authService.login(request);
        ApiResponse<AuthResponse> response = new ApiResponse<>(true, "Login successful", result);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}

