package com.trackmysubs.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.time.format.DateTimeParseException;
import java.time.format.ResolverStyle;
import java.util.List;
import java.util.Locale;

final class SubscriptionRequestNormalizer {

    private static final List<String> SINGLE_WRAPPER_KEYS = List.of("subscription", "data", "result", "item");
    private static final List<String> ARRAY_WRAPPER_KEYS = List.of("subscriptions", "items", "results", "data");

    private SubscriptionRequestNormalizer() {}

    static String normalizeSingle(ObjectMapper mapper, String rawJson) throws Exception {
        JsonNode root = readRoot(mapper, rawJson);
        JsonNode candidate = unwrapSingle(root);
        ObjectNode normalized = normalizeObject(mapper, candidate);
        return mapper.writeValueAsString(normalized);
    }

    static String normalizeArray(ObjectMapper mapper, String rawJson) throws Exception {
        JsonNode root = readRoot(mapper, rawJson);
        ArrayNode normalized = mapper.createArrayNode();

        JsonNode wrapperArray = unwrapArray(root);
        if (wrapperArray != null && wrapperArray.isArray()) {
            for (JsonNode node : wrapperArray) {
                normalized.add(normalizeObject(mapper, node));
            }
            return mapper.writeValueAsString(normalized);
        }

        if (root != null && root.isObject()) {
            normalized.add(normalizeObject(mapper, root));
            return mapper.writeValueAsString(normalized);
        }

        if (root != null && root.isArray()) {
            for (JsonNode node : root) {
                normalized.add(normalizeObject(mapper, node));
            }
        }

        return mapper.writeValueAsString(normalized);
    }

    private static JsonNode readRoot(ObjectMapper mapper, String rawJson) throws Exception {
        if (rawJson == null || rawJson.trim().isEmpty()) {
            return mapper.createObjectNode();
        }
        return mapper.readTree(rawJson);
    }

    private static JsonNode unwrapSingle(JsonNode root) {
        if (root == null || root.isNull()) {
            return null;
        }
        if (root.isArray()) {
            return root.isEmpty() ? null : root.get(0);
        }
        if (root.isObject()) {
            for (String key : SINGLE_WRAPPER_KEYS) {
                JsonNode child = root.get(key);
                if (child != null && child.isObject()) {
                    return child;
                }
            }
        }
        return root;
    }

    private static JsonNode unwrapArray(JsonNode root) {
        if (root == null || root.isNull()) {
            return null;
        }
        if (root.isArray()) {
            return root;
        }
        if (root.isObject()) {
            for (String key : ARRAY_WRAPPER_KEYS) {
                JsonNode child = root.get(key);
                if (child != null && child.isArray()) {
                    return child;
                }
            }
        }
        return null;
    }

    private static ObjectNode normalizeObject(ObjectMapper mapper, JsonNode node) {
        ObjectNode normalized = mapper.createObjectNode();
        if (node == null || !node.isObject()) {
            return normalized;
        }

        node.fields().forEachRemaining(entry -> {
            String canonical = canonicalFieldName(entry.getKey());
            if (canonical == null) {
                return;
            }
            JsonNode value = normalizeValue(mapper, canonical, entry.getValue());
            if (value != null && !value.isNull()) {
                normalized.set(canonical, value);
            }
        });

        return normalized;
    }

    private static JsonNode normalizeValue(ObjectMapper mapper, String canonicalField, JsonNode value) {
        if (value == null || value.isNull()) {
            return null;
        }

        return switch (canonicalField) {
            case "autoRenewal" -> normalizeBoolean(mapper, value);
            case "cost" -> normalizeNumber(mapper, value);
            case "reminderDays" -> normalizeInteger(mapper, value);
            case "startDate", "expiryDate" -> normalizeDate(mapper, value);
            default -> value.isTextual() ? mapper.getNodeFactory().textNode(value.asText().trim()) : value;
        };
    }

    private static JsonNode normalizeBoolean(ObjectMapper mapper, JsonNode value) {
        if (value.isBoolean()) {
            return value;
        }
        String text = normalizeText(value.asText());
        if (text.isEmpty()) {
            return null;
        }
        if (List.of("true", "yes", "y", "1", "on", "enabled", "auto", "automatic").contains(text)) {
            return mapper.getNodeFactory().booleanNode(true);
        }
        if (List.of("false", "no", "n", "0", "off", "disabled", "manual").contains(text)) {
            return mapper.getNodeFactory().booleanNode(false);
        }
        return null;
    }

    private static JsonNode normalizeNumber(ObjectMapper mapper, JsonNode value) {
        if (value.isNumber()) {
            return value;
        }
        String text = normalizeText(value.asText());
        if (text.isEmpty()) {
            return null;
        }
        String cleaned = text.replaceAll("[^0-9.\\-]", "");
        if (cleaned.isEmpty() || cleaned.equals("-") || cleaned.equals(".")) {
            return null;
        }
        try {
            return mapper.getNodeFactory().numberNode(new BigDecimal(cleaned));
        } catch (Exception ignored) {
            return null;
        }
    }

    private static JsonNode normalizeInteger(ObjectMapper mapper, JsonNode value) {
        if (value.isInt() || value.isLong()) {
            return value;
        }
        String text = normalizeText(value.asText());
        if (text.isEmpty()) {
            return null;
        }
        String cleaned = text.replaceAll("[^0-9\\-]", "");
        if (cleaned.isEmpty() || cleaned.equals("-")) {
            return null;
        }
        try {
            return mapper.getNodeFactory().numberNode(Integer.parseInt(cleaned));
        } catch (Exception ignored) {
            return null;
        }
    }

    private static JsonNode normalizeDate(ObjectMapper mapper, JsonNode value) {
        if (value == null || value.isNull()) {
            return null;
        }
        if (value.isTextual()) {
            String parsed = parseDateText(value.asText());
            if (parsed != null) {
                return mapper.getNodeFactory().textNode(parsed);
            }
            return null;
        }
        return null;
    }

    private static String parseDateText(String rawText) {
        String text = rawText == null ? "" : rawText.trim();
        text = text.replace(",", " ")
                .replaceAll("(?i)(\\d)(st|nd|rd|th)\\b", "$1")
                .replaceAll("\\s+", " ")
                .trim();

        if (text.isEmpty()) {
            return null;
        }

        if (text.matches("^\\d{4}-\\d{2}-\\d{2}.*")) {
            return text.substring(0, 10);
        }

        List<DateTimeFormatter> formatters = List.of(
                caseInsensitiveFormatter("d MMM uuuu"),
                caseInsensitiveFormatter("d MMMM uuuu"),
                caseInsensitiveFormatter("MMM d uuuu"),
                caseInsensitiveFormatter("MMMM d uuuu"),
                caseInsensitiveFormatter("d/M/uuuu"),
                caseInsensitiveFormatter("d-M-uuuu"),
                caseInsensitiveFormatter("M/d/uuuu"),
                caseInsensitiveFormatter("M-d-uuuu")
        );

        for (DateTimeFormatter formatter : formatters) {
            try {
                return LocalDate.parse(text, formatter).toString();
            } catch (DateTimeParseException ignored) {
                // Try the next format.
            }
        }

        return null;
    }

    private static DateTimeFormatter caseInsensitiveFormatter(String pattern) {
        return new DateTimeFormatterBuilder()
                .parseCaseInsensitive()
                .appendPattern(pattern)
                .toFormatter(Locale.ENGLISH)
                .withResolverStyle(ResolverStyle.SMART);
    }

    private static String canonicalFieldName(String rawFieldName) {
        String key = normalizeKey(rawFieldName);
        return switch (key) {
            case "servicename", "service", "subscriptionname", "subscription", "name", "merchantname" -> "serviceName";
            case "category", "cat", "type" -> "category";
            case "planname", "plan", "tier" -> "planName";
            case "billingcycle", "billing", "cycle", "interval", "frequency" -> "billingCycle";
            case "paymentmethod", "paymentmode", "payment", "method" -> "paymentMethod";
            case "autorenewal", "isautorenewal", "autorenew", "autorenewalflag", "renewautomatically", "recurring" -> "autoRenewal";
            case "reminderdays", "reminder", "daysbeforerenewal", "reminderdaysbefore", "renewalreminderdays" -> "reminderDays";
            case "usagefrequency", "usage", "usagerate", "usagepattern", "frequencyusage" -> "usageFrequency";
            case "cost", "price", "amount", "monthlycost", "yearlycost", "subscriptioncost" -> "cost";
            case "startdate", "starton", "startedon", "boughton", "effectivedate", "commencedon" -> "startDate";
            case "expirydate", "enddate", "renewaldate", "nextbillingdate", "expireson", "terminationdate" -> "expiryDate";
            case "website", "url", "link", "site" -> "website";
            case "notes", "note", "description", "memo" -> "notes";
            default -> null;
        };
    }

    private static String normalizeKey(String value) {
        return normalizeText(value).replaceAll("[^a-z0-9]", "");
    }

    private static String normalizeText(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }
}
