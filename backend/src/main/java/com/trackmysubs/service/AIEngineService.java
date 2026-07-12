package com.trackmysubs.service;

import com.trackmysubs.dto.ai.*;
import com.trackmysubs.entity.User;
import com.trackmysubs.dto.SubscriptionRequest;
import java.util.List;

public interface AIEngineService {
    AiInsightsResponse getFinancialInsights(User user);
    List<AiRecommendation> getRecommendations(User user);
    SpendingForecast getSpendingForecast(User user);
    AiHealthScoreResponse getHealthScore(User user);
    List<SmartAlert> getSmartAlerts(User user);
    ChatResponse chat(User user, ChatRequest request);
    String categorizeSubscription(String serviceName);
    List<AiRecommendation> getFraudAndDuplicateAlerts(User user);
    AiCopilotSummary getCopilotSummary(User user);
    List<AiTimelineEvent> getTimeline(User user);
    SubscriptionRequest parseNaturalLanguageSubscription(String text);
    AiDashboardResponse getDashboardData(User user);
    List<SubscriptionRequest> analyzeEmailsForSubscriptions(List<String> emails);
}
