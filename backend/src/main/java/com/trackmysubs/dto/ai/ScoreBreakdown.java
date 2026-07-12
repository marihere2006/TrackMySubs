package com.trackmysubs.dto.ai;

public record ScoreBreakdown(
        String points, // e.g. "+25", "-8"
        String description
) {}
