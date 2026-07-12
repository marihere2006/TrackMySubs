package com.trackmysubs.dto.ai;

public record AiRecommendation(
        int priority,
        String action, // e.g., "Cancel", "Downgrade", "Merge"
        String targetSubscription,
        String description,
        String estimatedSavings,
        int confidence,
        String reason
) {}
