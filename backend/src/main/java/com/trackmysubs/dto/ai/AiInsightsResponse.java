package com.trackmysubs.dto.ai;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record AiInsightsResponse(
        BigDecimal totalMonthlySpending,
        BigDecimal totalYearlySpending,
        String highestExpense,
        String lowestExpense,
        Map<String, BigDecimal> categoryWiseSpending,
        String spendingTrend,
        String mostExpensiveCategory,
        String leastExpensiveCategory,
        Map<String, Integer> categoryPercentages,
        List<String> suggestions
) {
}
