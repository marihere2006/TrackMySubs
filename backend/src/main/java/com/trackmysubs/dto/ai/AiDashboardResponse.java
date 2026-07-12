package com.trackmysubs.dto.ai;

import java.util.List;

public record AiDashboardResponse(
        AiCopilotSummary copilotSummary,
        AiHealthScoreResponse healthScore,
        AiInsightsResponse insights,
        List<AiRecommendation> recommendations,
        SpendingForecast forecast,
        List<SmartAlert> alerts
) {}
