package com.trackmysubs.controller;

import com.trackmysubs.dto.ApiResponse;
import com.trackmysubs.dto.RenewRequest;
import com.trackmysubs.dto.SubscriptionRequest;
import com.trackmysubs.dto.SubscriptionResponse;
import com.trackmysubs.security.CustomUserDetails;
import com.trackmysubs.service.SubscriptionService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subscriptions")
public class SubscriptionController {

    @Autowired
    private SubscriptionService subscriptionService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SubscriptionResponse>>> getAllSubscriptions(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<SubscriptionResponse> subs = subscriptionService.getAllSubscriptions(userDetails.getUser());
        ApiResponse<List<SubscriptionResponse>> response = new ApiResponse<>(true, "Subscriptions retrieved successfully", subs);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> getSubscriptionById(
            @PathVariable String id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        SubscriptionResponse sub = subscriptionService.getSubscriptionById(id, userDetails.getUser());
        ApiResponse<SubscriptionResponse> response = new ApiResponse<>(true, "Subscription retrieved successfully", sub);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SubscriptionResponse>> createSubscription(
            @Valid @RequestBody SubscriptionRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        SubscriptionResponse created = subscriptionService.createSubscription(request, userDetails.getUser());
        ApiResponse<SubscriptionResponse> response = new ApiResponse<>(true, "Subscription created successfully", created);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> updateSubscription(
            @PathVariable String id,
            @Valid @RequestBody SubscriptionRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        SubscriptionResponse updated = subscriptionService.updateSubscription(id, request, userDetails.getUser());
        ApiResponse<SubscriptionResponse> response = new ApiResponse<>(true, "Subscription updated successfully", updated);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSubscription(
            @PathVariable String id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        subscriptionService.deleteSubscription(id, userDetails.getUser());
        ApiResponse<Void> response = new ApiResponse<>(true, "Subscription deleted successfully", null);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/renew")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> renewSubscription(
            @PathVariable String id,
            @Valid @RequestBody RenewRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        SubscriptionResponse renewed = subscriptionService.renewSubscription(
                id,
                request.getNewExpiryDate(),
                request.getNewCost(),
                Boolean.TRUE.equals(request.getRenewFromPreviousExpiry()),
                userDetails.getUser());
        ApiResponse<SubscriptionResponse> response = new ApiResponse<>(true, "Subscription renewed successfully", renewed);
        return ResponseEntity.ok(response);
    }
}
