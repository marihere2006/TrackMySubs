package com.trackmysubs.controller;

import com.trackmysubs.dto.ApiResponse;
import com.trackmysubs.entity.AnalyticsSnapshot;
import com.trackmysubs.entity.User;
import com.trackmysubs.service.AnalyticsSnapshotService;
import com.trackmysubs.service.AuthService;
import com.trackmysubs.security.CustomUserDetails;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsSnapshotService analyticsSnapshotService;

    public AnalyticsController(AnalyticsSnapshotService analyticsSnapshotService) {
        this.analyticsSnapshotService = analyticsSnapshotService;
    }

    @GetMapping("/snapshots")
    public ResponseEntity<ApiResponse<List<AnalyticsSnapshot>>> getSnapshots(@AuthenticationPrincipal CustomUserDetails userDetails) {
        List<AnalyticsSnapshot> snapshots = analyticsSnapshotService.getSnapshotsForUser(userDetails.getUser().getId());
        return ResponseEntity.ok(ApiResponse.success(snapshots, "Snapshots retrieved successfully"));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSummary(@AuthenticationPrincipal CustomUserDetails userDetails) {
        Map<String, Object> summary = analyticsSnapshotService.getAnalyticsSummaryForUser(userDetails.getUser().getId());
        return ResponseEntity.ok(ApiResponse.success(summary, "Analytics summary retrieved successfully"));
    }
}
