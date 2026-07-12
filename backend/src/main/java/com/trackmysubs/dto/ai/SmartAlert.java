package com.trackmysubs.dto.ai;

public record SmartAlert(
        String priority, // High, Medium, Low, Info
        String target,
        String price,
        String message
) {}
