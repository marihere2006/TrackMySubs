package com.trackmysubs.controller;

import com.trackmysubs.dto.ApiResponse;
import com.trackmysubs.dto.SubscriptionHistoryResponse;
import com.trackmysubs.security.CustomUserDetails;
import com.trackmysubs.service.SubscriptionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/history")
public class SubscriptionHistoryController {

    @Autowired
    private SubscriptionService subscriptionService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SubscriptionHistoryResponse>>> getHistory(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<SubscriptionHistoryResponse> history = subscriptionService.getHistory(userDetails.getUser());
        ApiResponse<List<SubscriptionHistoryResponse>> response = new ApiResponse<>(true, "History retrieved successfully", history);
        return ResponseEntity.ok(response);
    }
}
