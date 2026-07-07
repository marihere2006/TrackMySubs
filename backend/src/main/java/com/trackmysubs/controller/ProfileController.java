package com.trackmysubs.controller;

import com.trackmysubs.dto.ApiResponse;
import com.trackmysubs.dto.ProfileRequest;
import com.trackmysubs.dto.UserResponse;
import com.trackmysubs.security.CustomUserDetails;
import com.trackmysubs.service.ProfileService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    @Autowired
    private ProfileService profileService;

    @GetMapping
    public ResponseEntity<ApiResponse<UserResponse>> getProfile(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        UserResponse profile = profileService.getProfile(userDetails.getUser());
        ApiResponse<UserResponse> response = new ApiResponse<>(true, "Profile retrieved successfully", profile);
        return ResponseEntity.ok(response);
    }

    @PutMapping
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            @Valid @RequestBody ProfileRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        UserResponse updated = profileService.updateProfile(request, userDetails.getUser());
        ApiResponse<UserResponse> response = new ApiResponse<>(true, "Profile updated successfully", updated);
        return ResponseEntity.ok(response);
    }

    @org.springframework.web.bind.annotation.DeleteMapping
    public ResponseEntity<ApiResponse<Void>> deleteProfile(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        profileService.deleteProfile(userDetails.getUser());
        ApiResponse<Void> response = new ApiResponse<>(true, "Profile deleted successfully", null);
        return ResponseEntity.ok(response);
    }
}
