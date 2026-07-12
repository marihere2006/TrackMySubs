package com.trackmysubs.dto.ai;

public record AiTimelineEvent(
        String timeframe, // e.g. "Today", "Yesterday", "2 days ago"
        String action
) {}
