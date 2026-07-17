package com.trackmysubs.service;

import com.trackmysubs.entity.Subscription;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Component
public class MonthlySpendingCalculator {

    public boolean isCurrentMonthStart(LocalDate startDate, LocalDate referenceDate) {
        if (startDate == null || referenceDate == null) {
            return false;
        }
        return startDate.getYear() == referenceDate.getYear()
                && startDate.getMonth() == referenceDate.getMonth();
    }

    public boolean isCurrentlyRunning(Subscription subscription, LocalDate referenceDate) {
        if (subscription == null || referenceDate == null) {
            return false;
        }

        String status = subscription.getStatus();
        if (status != null) {
            if ("Expired".equalsIgnoreCase(status)) {
                return false;
            }
            if ("Active".equalsIgnoreCase(status) || "Expiring Soon".equalsIgnoreCase(status)) {
                return true;
            }
        }

        LocalDate expiryDate = subscription.getExpiryDate();
        return expiryDate != null && !expiryDate.isBefore(referenceDate);
    }

    public BigDecimal calculateCurrentMonthSpend(List<Subscription> subscriptions, LocalDate referenceDate) {
        if (subscriptions == null || subscriptions.isEmpty() || referenceDate == null) {
            return BigDecimal.ZERO;
        }

        return subscriptions.stream()
                .filter(subscription -> isCurrentMonthStart(subscription.getStartDate(), referenceDate))
                .map(subscription -> subscription.getCost() == null ? BigDecimal.ZERO : subscription.getCost())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public BigDecimal calculateRunningSpend(List<Subscription> subscriptions, LocalDate referenceDate) {
        if (subscriptions == null || subscriptions.isEmpty() || referenceDate == null) {
            return BigDecimal.ZERO;
        }

        return subscriptions.stream()
                .filter(subscription -> isCurrentlyRunning(subscription, referenceDate))
                .map(subscription -> subscription.getCost() == null ? BigDecimal.ZERO : subscription.getCost())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
