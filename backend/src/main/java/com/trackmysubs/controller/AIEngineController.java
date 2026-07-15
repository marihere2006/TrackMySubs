package com.trackmysubs.controller;

import com.trackmysubs.dto.ApiResponse;
import com.trackmysubs.dto.ai.*;
import com.trackmysubs.security.CustomUserDetails;
import com.trackmysubs.service.AIEngineService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AIEngineController {

    private final AIEngineService aiEngineService;
    private final com.trackmysubs.service.AIResponseCache cache;

    public AIEngineController(AIEngineService aiEngineService, com.trackmysubs.service.AIResponseCache cache) {
        this.aiEngineService = aiEngineService;
        this.cache = cache;
    }

    @GetMapping("/insights")
    public ResponseEntity<ApiResponse<AiInsightsResponse>> getInsights(@AuthenticationPrincipal CustomUserDetails userDetails) {
        String cacheKey = "user_" + userDetails.getUser().getId() + "_insights";
        AiInsightsResponse insights = (AiInsightsResponse) cache.get(cacheKey);
        if (insights == null) {
            insights = aiEngineService.getFinancialInsights(userDetails.getUser());
            if (insights.suggestions() == null || !insights.suggestions().toString().contains("Rate limit")) {
                cache.put(cacheKey, insights);
            }
        }
        return ResponseEntity.ok(new ApiResponse<>(true, "Insights retrieved successfully", insights));
    }

    @GetMapping("/recommendations")
    public ResponseEntity<ApiResponse<List<AiRecommendation>>> getRecommendations(@AuthenticationPrincipal CustomUserDetails userDetails) {
        String cacheKey = "user_" + userDetails.getUser().getId() + "_recommendations";
        @SuppressWarnings("unchecked")
        List<AiRecommendation> recommendations = (List<AiRecommendation>) cache.get(cacheKey);
        if (recommendations == null) {
            recommendations = aiEngineService.getRecommendations(userDetails.getUser());
            if (recommendations.isEmpty() || !recommendations.get(0).description().contains("Rate limit")) {
                cache.put(cacheKey, recommendations);
            }
        }
        return ResponseEntity.ok(new ApiResponse<>(true, "Recommendations retrieved successfully", recommendations));
    }

    @GetMapping("/forecast")
    public ResponseEntity<ApiResponse<SpendingForecast>> getForecast(@AuthenticationPrincipal CustomUserDetails userDetails) {
        String cacheKey = "user_" + userDetails.getUser().getId() + "_forecast";
        SpendingForecast forecast = (SpendingForecast) cache.get(cacheKey);
        if (forecast == null) {
            forecast = aiEngineService.getSpendingForecast(userDetails.getUser());
            if (forecast.reasons() == null || !forecast.reasons().toString().contains("Rate limit")) {
                cache.put(cacheKey, forecast);
            }
        }
        return ResponseEntity.ok(new ApiResponse<>(true, "Forecast retrieved successfully", forecast));
    }

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<AiHealthScoreResponse>> getHealthScore(@AuthenticationPrincipal CustomUserDetails userDetails) {
        String cacheKey = "user_" + userDetails.getUser().getId() + "_health";
        AiHealthScoreResponse healthScore = (AiHealthScoreResponse) cache.get(cacheKey);
        if (healthScore == null) {
            healthScore = aiEngineService.getHealthScore(userDetails.getUser());
            if (healthScore.reason() == null || !healthScore.reason().contains("Rate limit")) {
                cache.put(cacheKey, healthScore);
            }
        }
        return ResponseEntity.ok(new ApiResponse<>(true, "Health score retrieved successfully", healthScore));
    }

    @GetMapping("/alerts")
    public ResponseEntity<ApiResponse<List<SmartAlert>>> getAlerts(@AuthenticationPrincipal CustomUserDetails userDetails) {
        String cacheKey = "user_" + userDetails.getUser().getId() + "_alerts";
        @SuppressWarnings("unchecked")
        List<SmartAlert> alerts = (List<SmartAlert>) cache.get(cacheKey);
        if (alerts == null) {
            alerts = aiEngineService.getSmartAlerts(userDetails.getUser());
            if (alerts.isEmpty() || !alerts.get(0).message().contains("Rate limit")) {
                cache.put(cacheKey, alerts);
            }
        }
        return ResponseEntity.ok(new ApiResponse<>(true, "Alerts retrieved successfully", alerts));
    }

    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<ChatResponse>> chat(@AuthenticationPrincipal CustomUserDetails userDetails, @RequestBody ChatRequest request) {
        if (request == null || request.message() == null || request.message().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Message cannot be empty"));
        }
        ChatResponse response = aiEngineService.chat(userDetails.getUser(), request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Chat response generated successfully", response));
    }

    @GetMapping("/categorize")
    public ResponseEntity<ApiResponse<Map<String, String>>> categorize(@RequestParam String serviceName) {
        String category = aiEngineService.categorizeSubscription(serviceName);
        return ResponseEntity.ok(new ApiResponse<>(true, "Categorization successful", Map.of("category", category)));
    }

    @GetMapping("/copilot")
    public ResponseEntity<ApiResponse<AiCopilotSummary>> getCopilotSummary(@AuthenticationPrincipal CustomUserDetails userDetails) {
        String cacheKey = "user_" + userDetails.getUser().getId() + "_copilot";
        AiCopilotSummary summary = (AiCopilotSummary) cache.get(cacheKey);
        if (summary == null) {
            summary = aiEngineService.getCopilotSummary(userDetails.getUser());
            if (summary.bulletPoints() == null || !summary.bulletPoints().toString().contains("Rate limit")) {
                cache.put(cacheKey, summary);
            }
        }
        return ResponseEntity.ok(new ApiResponse<>(true, "Copilot summary retrieved", summary));
    }

    @GetMapping("/timeline")
    public ResponseEntity<ApiResponse<List<AiTimelineEvent>>> getTimeline(@AuthenticationPrincipal CustomUserDetails userDetails) {
        List<AiTimelineEvent> timeline = aiEngineService.getTimeline(userDetails.getUser());
        return ResponseEntity.ok(new ApiResponse<>(true, "Timeline retrieved", timeline));
    }

    @PostMapping("/smart-add")
    public ResponseEntity<ApiResponse<com.trackmysubs.dto.SubscriptionRequest>> smartAdd(@RequestBody Map<String, String> request) {
        String text = request.get("text");
        if (text == null || text.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Text cannot be empty"));
        }
        com.trackmysubs.dto.SubscriptionRequest parsed = aiEngineService.parseNaturalLanguageSubscription(text);
        return ResponseEntity.ok(ApiResponse.success(parsed, "Parsed successfully"));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<AiDashboardResponse>> getDashboardData(@AuthenticationPrincipal CustomUserDetails userDetails) {
        String cacheKey = "user_" + userDetails.getUser().getId() + "_dashboard";
        AiDashboardResponse dashboard = (AiDashboardResponse) cache.get(cacheKey);
        if (dashboard == null) {
            dashboard = aiEngineService.getDashboardData(userDetails.getUser());
            // Only cache if we didn't hit a rate limit (check one of the sub-objects)
            if (dashboard.copilotSummary() == null || dashboard.copilotSummary().bulletPoints() == null || !dashboard.copilotSummary().bulletPoints().toString().contains("Rate limit")) {
                cache.put(cacheKey, dashboard);
            }
        }
        return ResponseEntity.ok(new ApiResponse<>(true, "Dashboard data retrieved successfully", dashboard));
    }
}
