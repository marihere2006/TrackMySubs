package com.trackmysubs.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.trackmysubs.dto.SubscriptionRequest;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SubscriptionRequestNormalizerTest {

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @Test
    void normalizesSingleObjectWithLooseAiFieldNames() throws Exception {
        String json = """
                {
                  "service_name": "Claude",
                  "cat": "AI",
                  "plan": "Pro",
                  "billing_cycle": "Monthly",
                  "price": "₹249",
                  "isAutoRenewal": "yes",
                  "reminder_days": "5",
                  "usage": "Weekly",
                  "start_date": "July 1st 2026",
                  "renewalDate": "August 1st 2026",
                  "url": "https://example.com",
                  "description": "AI assistant"
                }
                """;

        String normalized = SubscriptionRequestNormalizer.normalizeSingle(objectMapper, json);
        SubscriptionRequest request = objectMapper.readValue(normalized, SubscriptionRequest.class);

        assertEquals("Claude", request.getServiceName());
        assertEquals("AI", request.getCategory());
        assertEquals("Pro", request.getPlanName());
        assertEquals("Monthly", request.getBillingCycle());
        assertEquals(new BigDecimal("249"), request.getCost());
        assertTrue(Boolean.TRUE.equals(request.getAutoRenewal()));
        assertEquals(Integer.valueOf(5), request.getReminderDays());
        assertEquals("Weekly", request.getUsageFrequency());
        assertEquals(LocalDate.of(2026, 7, 1), request.getStartDate());
        assertEquals(LocalDate.of(2026, 8, 1), request.getExpiryDate());
        assertEquals("https://example.com", request.getWebsite());
        assertEquals("AI assistant", request.getNotes());
    }

    @Test
    void normalizesArrayWrapperPayloads() throws Exception {
        String json = """
                {
                  "subscriptions": [
                    {
                      "name": "Netflix",
                      "type": "Entertainment",
                      "tier": "Premium",
                      "cycle": "Monthly",
                      "amount": 649,
                      "auto_renewal": false,
                      "startOn": "2026-07-01",
                      "expiresOn": "2026-08-01"
                    },
                    {
                      "subscriptionName": "Spotify",
                      "category": "Music",
                      "planName": "Family",
                      "billingCycle": "Monthly",
                      "cost": 179,
                      "autoRenewal": true,
                      "startDate": "2026-07-03",
                      "expiryDate": "2026-08-03"
                    }
                  ]
                }
                """;

        String normalized = SubscriptionRequestNormalizer.normalizeArray(objectMapper, json);
        List<SubscriptionRequest> requests = objectMapper.readValue(
                normalized,
                new com.fasterxml.jackson.core.type.TypeReference<List<SubscriptionRequest>>() {}
        );

        assertEquals(2, requests.size());
        assertEquals("Netflix", requests.get(0).getServiceName());
        assertEquals("Spotify", requests.get(1).getServiceName());
        assertFalse(Boolean.TRUE.equals(requests.get(0).getAutoRenewal()));
        assertTrue(Boolean.TRUE.equals(requests.get(1).getAutoRenewal()));
    }
}
