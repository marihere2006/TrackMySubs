package com.trackmysubs.entity;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

public enum SubscriptionStatus {
    ACTIVE("Active"),
    EXPIRED("Expired"),
    EXPIRING_SOON("Expiring Soon");

    private final String value;

    SubscriptionStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static String calculateStatus(LocalDate expiryDate) {
        LocalDate today = LocalDate.now();
        if (expiryDate.isBefore(today)) {
            return EXPIRED.getValue();
        }
        long daysBetween = ChronoUnit.DAYS.between(today, expiryDate);
        if (daysBetween >= 0 && daysBetween <= 7) {
            return EXPIRING_SOON.getValue();
        }
        return ACTIVE.getValue();
    }
}
