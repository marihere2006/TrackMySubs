package com.trackmysubs.dto.ai;

import java.util.List;

public record AiCopilotSummary(
        String greeting,
        String summaryText,
        List<String> bulletPoints,
        int healthScore
) {}
