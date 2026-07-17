package com.trackmysubs.service;

import com.trackmysubs.entity.Subscription;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class MonthlySpendingCalculatorTest {

    private final MonthlySpendingCalculator calculator = new MonthlySpendingCalculator();

    @Test
    void calculatesCurrentMonthSpendUsingStartDateOnly() {
        LocalDate referenceDate = LocalDate.of(2026, 7, 16);

        Subscription netflix = subscription("Netflix", new BigDecimal("199"), LocalDate.of(2026, 7, 5));
        Subscription spotify = subscription("Spotify", new BigDecimal("499"), LocalDate.of(2026, 6, 15));
        Subscription prime = subscription("Prime", new BigDecimal("1499"), LocalDate.of(2026, 3, 10));
        Subscription chatgpt = subscription("ChatGPT", new BigDecimal("1600"), LocalDate.of(2026, 7, 18));

        BigDecimal total = calculator.calculateCurrentMonthSpend(List.of(netflix, spotify, prime, chatgpt), referenceDate);

        assertEquals(new BigDecimal("1799"), total);
    }

    @Test
    void ignoresSubscriptionsThatStartedInOtherMonthsEvenIfTheyAreActive() {
        LocalDate referenceDate = LocalDate.of(2026, 7, 16);

        Subscription juneService = subscription("June Service", new BigDecimal("250"), LocalDate.of(2026, 6, 1));

        assertEquals(BigDecimal.ZERO, calculator.calculateCurrentMonthSpend(List.of(juneService), referenceDate));
    }

    @Test
    void calculatesRunningSpendUsingRunningStatuses() {
        LocalDate referenceDate = LocalDate.of(2026, 7, 16);

        Subscription active = subscription("Netflix", new BigDecimal("199"), LocalDate.of(2026, 1, 1), LocalDate.of(2026, 8, 1), "Active");
        Subscription expiringSoon = subscription("Spotify", new BigDecimal("499"), LocalDate.of(2026, 2, 1), LocalDate.of(2026, 7, 20), "Expiring Soon");
        Subscription expired = subscription("Prime", new BigDecimal("1499"), LocalDate.of(2026, 3, 1), LocalDate.of(2026, 7, 1), "Expired");

        BigDecimal total = calculator.calculateRunningSpend(List.of(active, expiringSoon, expired), referenceDate);

        assertEquals(new BigDecimal("698"), total);
    }

    private Subscription subscription(String serviceName, BigDecimal cost, LocalDate startDate) {
        Subscription subscription = new Subscription();
        subscription.setServiceName(serviceName);
        subscription.setCost(cost);
        subscription.setStartDate(startDate);
        return subscription;
    }

    private Subscription subscription(String serviceName, BigDecimal cost, LocalDate startDate, LocalDate expiryDate, String status) {
        Subscription subscription = subscription(serviceName, cost, startDate);
        subscription.setExpiryDate(expiryDate);
        subscription.setStatus(status);
        return subscription;
    }
}
