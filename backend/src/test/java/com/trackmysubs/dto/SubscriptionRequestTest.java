package com.trackmysubs.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

class SubscriptionRequestTest {

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @Test
    void deserializesAiAliasFieldsForAutoRenewal() throws Exception {
        String json = """
                {
                  "serviceName": "Claude",
                  "category": "AI",
                  "planName": "Pro",
                  "billingCycle": "Monthly",
                  "cost": 249,
                  "isAutoRenewal": false,
                  "startDate": "2026-07-01",
                  "expiryDate": "2026-08-01"
                }
                """;

        SubscriptionRequest request = objectMapper.readValue(json, SubscriptionRequest.class);

        assertEquals("Claude", request.getServiceName());
        assertEquals(new BigDecimal("249"), request.getCost());
        assertFalse(Boolean.TRUE.equals(request.getAutoRenewal()));
        assertEquals(LocalDate.of(2026, 7, 1), request.getStartDate());
        assertEquals(LocalDate.of(2026, 8, 1), request.getExpiryDate());
    }
}
