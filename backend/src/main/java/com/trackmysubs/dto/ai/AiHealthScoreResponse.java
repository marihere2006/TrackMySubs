package com.trackmysubs.dto.ai;

public record AiHealthScoreResponse(
        int healthScore,
        java.util.List<ScoreBreakdown> breakdown,
        String reason
) {}
