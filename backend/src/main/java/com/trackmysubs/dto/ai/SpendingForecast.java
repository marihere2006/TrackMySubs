package com.trackmysubs.dto.ai;

import java.math.BigDecimal;

public record SpendingForecast(
        BigDecimal nextMonth,
        BigDecimal next3Months,
        BigDecimal nextYear,
        int confidence,
        java.util.List<String> reasons
) {}
