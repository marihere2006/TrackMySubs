package com.trackmysubs.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trackmysubs.dto.ai.*;
import com.trackmysubs.entity.Subscription;
import com.trackmysubs.entity.User;
import com.trackmysubs.repository.SubscriptionRepository;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

@Service
public class AIEngineServiceImpl implements AIEngineService {

    private final ChatClient chatClient;
    private final SubscriptionRepository subscriptionRepository;
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    public AIEngineServiceImpl(ChatClient.Builder chatClientBuilder, SubscriptionRepository subscriptionRepository) {
        this.chatClient = chatClientBuilder.build();
        this.subscriptionRepository = subscriptionRepository;
    }

    private List<Subscription> getActiveSubs(User user) {
        return subscriptionRepository.findByUser(user).stream()
                .filter(s -> "Active".equalsIgnoreCase(s.getStatus()))
                .collect(Collectors.toList());
    }

    private List<Subscription> getDuplicates(List<Subscription> subs) {
        List<Subscription> duplicates = new ArrayList<>();
        for (int i = 0; i < subs.size(); i++) {
            for (int j = i + 1; j < subs.size(); j++) {
                String n1 = subs.get(i).getServiceName().toLowerCase();
                String n2 = subs.get(j).getServiceName().toLowerCase();
                String word1 = n1.split(" ")[0];
                String word2 = n2.split(" ")[0];
                if (word1.equals(word2) && word1.length() > 2) {
                    if (!duplicates.contains(subs.get(i))) duplicates.add(subs.get(i));
                    if (!duplicates.contains(subs.get(j))) duplicates.add(subs.get(j));
                }
            }
        }
        return duplicates;
    }

    private String extractJson(String text) {
        if (text == null) return "{}";
        int start = text.indexOf("{");
        int startArr = text.indexOf("[");
        if (startArr != -1 && (start == -1 || startArr < start)) {
            int endArr = text.lastIndexOf("]");
            return (endArr != -1) ? text.substring(startArr, endArr + 1) : "[]";
        }
        int end = text.lastIndexOf("}");
        return (start != -1 && end != -1) ? text.substring(start, end + 1) : "{}";
    }

    private String cleanError(Exception e) {
        if (e.getMessage() != null && e.getMessage().contains("429")) {
            return "API Rate limit exceeded (15 req/min). Please wait a moment before trying again.";
        }
        return "Error: " + e.getMessage();
    }

    @Override
    public AiCopilotSummary getCopilotSummary(User user) {
        List<Subscription> subs = getActiveSubs(user);
        BigDecimal total = subs.stream().map(Subscription::getCost).reduce(BigDecimal.ZERO, BigDecimal::add);
        
        String prompt = "Generate a JSON object for an AI Copilot Summary. User is " + user.getName() + ". "
            + "Total spending: " + total + ", Subs count: " + subs.size() + ". "
            + "Subs: " + subs.stream().map(s -> s.getServiceName() + " (" + s.getCategory() + " - " + s.getCost() + ")").collect(Collectors.joining(", ")) + ". "
            + "Format EXACTLY as:\n"
            + "{\n"
            + "  \"greeting\": \"Good afternoon, " + user.getName() + ".\",\n"
            + "  \"summaryText\": \"You currently spend " + total + "/month across " + subs.size() + " subscriptions.\",\n"
            + "  \"bulletPoints\": [\"Cloud Storage accounts for 45% of your spending.\", \"Spotify renews in 6 days.\"],\n"
            + "  \"healthScore\": 92\n"
            + "}\n"
            + "Do not include any text outside the JSON.";

        try {
            if (subs.isEmpty()) return new AiCopilotSummary("Hello " + user.getName(), "You have no subscriptions.", List.of("Add some subscriptions to get insights."), 100);
            String response = chatClient.prompt().user(prompt).call().content();
            return objectMapper.readValue(extractJson(response), AiCopilotSummary.class);
        } catch (Exception e) {
            return new AiCopilotSummary("Hello " + user.getName(), "Unable to generate summary.", List.of(cleanError(e)), 0);
        }
    }

    @Override
    public AiHealthScoreResponse getHealthScore(User user) {
        List<Subscription> subs = getActiveSubs(user);
        if (subs.isEmpty()) return new AiHealthScoreResponse(100, Collections.emptyList(), "Perfect score! You have no subscriptions.");
        
        String prompt = "Calculate a realistic subscription health score (0-100) and provide a breakdown of points. "
            + "Start at 100. Deduct points for duplicates or high costs. Add points for good management. "
            + "Subs: " + subs.stream().map(s -> s.getServiceName() + " (" + s.getCost() + ")").collect(Collectors.joining(", ")) + ". "
            + "Format EXACTLY as valid JSON:\n"
            + "{\n"
            + "  \"healthScore\": 92,\n"
            + "  \"breakdown\": [ { \"points\": \"+25\", \"description\": \"Good renewal management\" }, { \"points\": \"-8\", \"description\": \"High cloud spending\" } ],\n"
            + "  \"reason\": \"Most subscriptions are well managed.\"\n"
            + "}\n"
            + "Do not include any text outside the JSON.";

        try {
            String response = chatClient.prompt().user(prompt).call().content();
            return objectMapper.readValue(extractJson(response), AiHealthScoreResponse.class);
        } catch (Exception e) {
            return new AiHealthScoreResponse(0, Collections.emptyList(), cleanError(e));
        }
    }

    @Override
    public AiInsightsResponse getFinancialInsights(User user) {
        List<Subscription> subs = getActiveSubs(user);
        
        BigDecimal monthlyTotal = subs.stream()
            .map(Subscription::getCost)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
            
        BigDecimal yearlyTotal = monthlyTotal.multiply(new BigDecimal("12"));

        Subscription highest = subs.stream().max(Comparator.comparing(Subscription::getCost)).orElse(null);
        Subscription lowest = subs.stream().min(Comparator.comparing(Subscription::getCost)).orElse(null);

        Map<String, BigDecimal> catTotals = new HashMap<>();
        for (Subscription s : subs) {
            String cat = s.getCategory() != null ? s.getCategory() : "Uncategorized";
            catTotals.put(cat, catTotals.getOrDefault(cat, BigDecimal.ZERO).add(s.getCost()));
        }

        String mostExpensiveCat = "N/A";
        String leastExpensiveCat = "N/A";
        BigDecimal maxCat = BigDecimal.ZERO;
        BigDecimal minCat = new BigDecimal("999999999");
        
        Map<String, Integer> catPercentages = new HashMap<>();

        for (Map.Entry<String, BigDecimal> entry : catTotals.entrySet()) {
            if (entry.getValue().compareTo(maxCat) > 0) {
                maxCat = entry.getValue();
                mostExpensiveCat = entry.getKey();
            }
            if (entry.getValue().compareTo(minCat) < 0) {
                minCat = entry.getValue();
                leastExpensiveCat = entry.getKey();
            }
            if (monthlyTotal.compareTo(BigDecimal.ZERO) > 0) {
                int pct = entry.getValue().multiply(new BigDecimal("100")).divide(monthlyTotal, RoundingMode.HALF_UP).intValue();
                catPercentages.put(entry.getKey(), pct);
            }
        }

        String prompt = "Provide 3-4 bullet point financial insights for these subscriptions. "
            + "Subs: " + subs.stream().map(s -> s.getServiceName() + " (" + s.getCost() + ")").collect(Collectors.joining(", ")) + ". "
            + "Format EXACTLY as a JSON array of strings:\n"
            + "[\"AWS Cloud is your largest recurring expense.\", \"Entertainment costs remain low.\"]\n";
            
        List<String> suggestions = new ArrayList<>();
        try {
            if (subs.isEmpty()) {
                suggestions = List.of("Add subscriptions to see insights.");
            } else {
                String response = chatClient.prompt().user(prompt).call().content();
                suggestions = objectMapper.readValue(extractJson(response), new TypeReference<List<String>>(){});
            }
        } catch (Exception e) {
            suggestions = List.of(cleanError(e));
        }

        return new AiInsightsResponse(
            monthlyTotal.setScale(2, RoundingMode.HALF_UP),
            yearlyTotal.setScale(2, RoundingMode.HALF_UP),
            highest != null ? highest.getServiceName() : "N/A",
            lowest != null ? lowest.getServiceName() : "N/A",
            catTotals,
            "Stable",
            mostExpensiveCat,
            leastExpensiveCat,
            catPercentages,
            suggestions
        );
    }

    @Override
    public List<AiRecommendation> getRecommendations(User user) {
        List<Subscription> subs = getActiveSubs(user);
        if (subs.isEmpty()) return Collections.emptyList();
        
        String prompt = "Review these subscriptions and provide cost-saving recommendations (Priority 1, 2, 3). "
            + "Subs: " + subs.stream().map(s -> s.getServiceName() + " (" + s.getCost() + ")").collect(Collectors.joining(", ")) + ". "
            + "Format EXACTLY as a JSON array:\n"
            + "[\n"
            + "  { \"priority\": 1, \"action\": \"Switch to Annual\", \"targetSubscription\": \"AWS\", \"description\": \"Switch AWS to annual billing.\", \"estimatedSavings\": \"₹2,300/year\", \"confidence\": 96, \"reason\": \"Continuous monthly renewals detected.\" }\n"
            + "]\n"
            + "Do not include any text outside the JSON.";
            
        try {
            String response = chatClient.prompt().user(prompt).call().content();
            return objectMapper.readValue(extractJson(response), new TypeReference<List<AiRecommendation>>(){});
        } catch (Exception e) {
            System.err.println("Recommendation Error: " + e.getMessage());
            if (e.getMessage() != null && e.getMessage().contains("429")) {
                AiRecommendation errRec = new AiRecommendation(1, "API Limit", "System", cleanError(e), "-", 0, "");
                return List.of(errRec);
            }
            return Collections.emptyList();
        }
    }

    @Override
    public SpendingForecast getSpendingForecast(User user) {
        List<Subscription> subs = getActiveSubs(user);
        BigDecimal monthlyTotal = subs.stream().map(Subscription::getCost).reduce(BigDecimal.ZERO, BigDecimal::add);
        if (subs.isEmpty()) return new SpendingForecast(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, 100, List.of("No active subscriptions."));
        
        String prompt = "Forecast spending based on these monthly subs: " 
            + subs.stream().map(s -> s.getServiceName() + " (" + s.getCost() + ")").collect(Collectors.joining(", ")) + ". "
            + "Format EXACTLY as valid JSON without markdown. Do NOT use '+' signs for numbers, only output plain digits.\n"
            + "{\n"
            + "  \"nextMonth\": 3946,\n"
            + "  \"next3Months\": 11838,\n"
            + "  \"nextYear\": 47352,\n"
            + "  \"confidence\": 96,\n"
            + "  \"reasons\": [\"AWS renews on 24 Jul\", \"Spotify renews on 18 Jul\"]\n"
            + "}\n";
            
        try {
            String response = chatClient.prompt().user(prompt).call().content();
            return objectMapper.readValue(extractJson(response), SpendingForecast.class);
        } catch (Exception e) {
            return new SpendingForecast(monthlyTotal, monthlyTotal.multiply(new BigDecimal("3")), monthlyTotal.multiply(new BigDecimal("12")), 50, List.of(cleanError(e)));
        }
    }

    @Override
    public List<SmartAlert> getSmartAlerts(User user) {
        List<Subscription> subs = getActiveSubs(user);
        if (subs.isEmpty()) return Collections.emptyList();
        
        List<Subscription> duplicates = getDuplicates(subs);
        
        String prompt = "Generate Smart Alerts for these subscriptions (High, Medium, Low, Info). "
            + "Identify upcoming renewals or high expenses. Do NOT create alerts for duplicates, I will handle that natively. "
            + "Subs: " + subs.stream().map(s -> s.getServiceName() + " (" + s.getCost() + ")").collect(Collectors.joining(", ")) + ". "
            + "Format EXACTLY as a valid JSON array:\n"
            + "[\n"
            + "  { \"priority\": \"🔴 High\", \"target\": \"AWS\", \"price\": \"₹1999\", \"message\": \"Renews tomorrow\" }\n"
            + "]\n"
            + "Do not output any text outside the JSON.";
            
        try {
            String response = chatClient.prompt().user(prompt).call().content();
            List<SmartAlert> alerts = objectMapper.readValue(extractJson(response), new TypeReference<List<SmartAlert>>(){});
            if (!duplicates.isEmpty()) {
                String names = duplicates.stream().map(Subscription::getServiceName).distinct().collect(Collectors.joining(" & "));
                alerts.add(0, new SmartAlert("🔴 High", names, "", "Duplicate subscription types detected. Consider keeping only one."));
            }
            return alerts;
        } catch (Exception e) {
            return List.of(new SmartAlert("🔴 High", "System", "₹0", cleanError(e)));
        }
    }

    @Override
    public List<AiTimelineEvent> getTimeline(User user) {
        List<AiTimelineEvent> timeline = new ArrayList<>();
        timeline.add(new AiTimelineEvent("Today", "Health score recalculated"));
        
        List<Subscription> subs = getActiveSubs(user);
        List<Subscription> duplicates = getDuplicates(subs);
        
        if (!duplicates.isEmpty()) {
            timeline.add(new AiTimelineEvent("Today", "Duplicate subscription detected!"));
        } else {
            timeline.add(new AiTimelineEvent("Today", "Duplicate detection completed - No duplicates found"));
        }
        
        timeline.add(new AiTimelineEvent("2 days ago", "Spending forecast updated"));
        return timeline;
    }

    @Override
    public List<AiRecommendation> getFraudAndDuplicateAlerts(User user) {
        return Collections.emptyList(); // Merged into SmartAlerts natively now via prompt
    }

    @Override
    public ChatResponse chat(User user, ChatRequest request) {
        List<Subscription> subs = getActiveSubs(user);
        String context = "User's Subscriptions: " + subs.stream()
                .map(s -> s.getServiceName() + " (Cost: " + s.getCost() + ", Category: " + s.getCategory() + ")")
                .collect(Collectors.joining("; "));

        String prompt = "You are an AI Subscription Manager. Be extremely concise. Answer the user's question based on their data. " 
            + context + "\nQuestion: " + request.message();
        try {
            String response = chatClient.prompt().user(prompt).call().content();
            return new ChatResponse(response);
        } catch (Exception e) {
            return new ChatResponse(cleanError(e));
        }
    }

    @Override
    public String categorizeSubscription(String serviceName) {
        String prompt = "Categorize the subscription service '" + serviceName + "' into one of these: Entertainment, Education, Software, Fitness, Utilities, Gaming, Cloud Storage, Productivity, Unknown. Reply ONLY with the exact category name.";
        try {
            String response = chatClient.prompt().user(prompt).call().content().trim();
            return response.replaceAll("[^a-zA-Z\\s]", "").trim();
        } catch (Exception e) {
            return "Unknown";
        }
    }

    @Override
    public com.trackmysubs.dto.SubscriptionRequest parseNaturalLanguageSubscription(String text) {
        String prompt = "Extract subscription details from this text: \"" + text + "\". " +
                "Format EXACTLY as a valid JSON object without markdown blocks. Use current date where relative dates are used.\n" +
                "Required fields: serviceName (string), category (string), planName (string), billingCycle (string: 'Monthly' or 'Yearly'), cost (number).\n" +
                "Optional fields: startDate (YYYY-MM-DD), expiryDate (YYYY-MM-DD), paymentMethod (string).\n" +
                "Example response:\n" +
                "{\n" +
                "  \"serviceName\": \"Netflix\",\n" +
                "  \"category\": \"Streaming\",\n" +
                "  \"planName\": \"Premium\",\n" +
                "  \"billingCycle\": \"Monthly\",\n" +
                "  \"cost\": 649.00,\n" +
                "  \"startDate\": \"2023-10-01\",\n" +
                "  \"expiryDate\": \"2023-11-01\",\n" +
                "  \"paymentMethod\": \"Credit Card\"\n" +
                "}";

        try {
            String response = chatClient.prompt().user(prompt).call().content();
            String json = extractJson(response);
            return objectMapper.readValue(json, com.trackmysubs.dto.SubscriptionRequest.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse subscription from text: " + e.getMessage(), e);
        }
    }

    @Override
    public AiDashboardResponse getDashboardData(User user) {
        List<Subscription> subs = getActiveSubs(user);
        
        BigDecimal monthlyTotal = subs.stream().map(Subscription::getCost).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal yearlyTotal = monthlyTotal.multiply(new BigDecimal("12"));
        
        String context = subs.isEmpty() ? "User has no subscriptions." : 
                subs.stream().map(s -> s.getServiceName() + " (" + s.getCategory() + " - " + s.getCost() + ")").collect(Collectors.joining(", "));

        String prompt = "You are an AI financial copilot. Analyze these subscriptions and return exactly ONE valid JSON object with 6 keys: 'copilotSummary', 'healthScore', 'insights', 'recommendations', 'forecast', and 'alerts'.\n" +
                "Do not include any text or markdown formatting outside the JSON block.\n\n" +
                "User Name: " + user.getName() + "\n" +
                "Total Monthly Spend: " + monthlyTotal + "\n" +
                "Subscriptions: " + context + "\n\n" +
                "Required JSON Structure:\n" +
                "{\n" +
                "  \"copilotSummary\": { \"greeting\": \"Good day, " + user.getName() + "\", \"summaryText\": \"String\", \"bulletPoints\": [\"String\"], \"healthScore\": 92 },\n" +
                "  \"healthScore\": { \"healthScore\": 92, \"breakdown\": [ { \"points\": \"String\", \"description\": \"String\" } ], \"reason\": \"String\" },\n" +
                "  \"insights\": { \"monthlyTotal\": " + monthlyTotal + ", \"yearlyTotal\": " + yearlyTotal + ", \"highestSubscription\": \"String\", \"lowestSubscription\": \"String\", \"categoryTotals\": {\"Cat1\": 100}, \"trend\": \"String\", \"mostExpensiveCategory\": \"String\", \"leastExpensiveCategory\": \"String\", \"categoryPercentages\": {\"Cat1\": 100}, \"suggestions\": [\"String\"] },\n" +
                "  \"recommendations\": [ { \"priority\": 1, \"action\": \"String\", \"targetSubscription\": \"String\", \"description\": \"String\", \"estimatedSavings\": \"String\", \"confidence\": 90, \"reason\": \"String\" } ],\n" +
                "  \"forecast\": { \"nextMonth\": " + monthlyTotal + ", \"next3Months\": " + monthlyTotal.multiply(new BigDecimal("3")) + ", \"nextYear\": " + yearlyTotal + ", \"confidence\": 90, \"reasons\": [\"String\"] },\n" +
                "  \"alerts\": [ { \"priority\": \"String\", \"target\": \"String\", \"price\": \"String\", \"message\": \"String\" } ]\n" +
                "}";

        try {
            String response = chatClient.prompt().user(prompt).call().content();
            String json = extractJson(response);
            return objectMapper.readValue(json, AiDashboardResponse.class);
        } catch (Exception e) {
            System.err.println("Mega Prompt Error (Using Local Fallback Engine): " + e.getMessage());
            
            // Perfect Deterministic Fallback Engine
            List<Subscription> duplicates = getDuplicates(subs);
            int score = 100 - (duplicates.size() * 15);
            if (monthlyTotal.compareTo(new BigDecimal("5000")) > 0) score -= 10;
            score = Math.max(0, score);
            
            Subscription highest = subs.stream().max(Comparator.comparing(Subscription::getCost)).orElse(null);
            Subscription lowest = subs.stream().min(Comparator.comparing(Subscription::getCost)).orElse(null);
            String highestName = highest != null ? highest.getServiceName() : "N/A";
            String lowestName = lowest != null ? lowest.getServiceName() : "N/A";

            Map<String, BigDecimal> catTotals = new HashMap<>();
            Map<String, Integer> catPercentages = new HashMap<>();
            for (Subscription s : subs) {
                String cat = s.getCategory() != null ? s.getCategory() : "Uncategorized";
                catTotals.put(cat, catTotals.getOrDefault(cat, BigDecimal.ZERO).add(s.getCost()));
            }
            if (monthlyTotal.compareTo(BigDecimal.ZERO) > 0) {
                for (Map.Entry<String, BigDecimal> entry : catTotals.entrySet()) {
                    int pct = entry.getValue().multiply(new BigDecimal("100")).divide(monthlyTotal, RoundingMode.HALF_UP).intValue();
                    catPercentages.put(entry.getKey(), pct);
                }
            }

            List<String> insightStrs = new ArrayList<>();
            insightStrs.add("Your total monthly spend is " + monthlyTotal + ".");
            if (highest != null) insightStrs.add(highestName + " is your largest recurring expense.");
            if (!duplicates.isEmpty()) insightStrs.add("Warning: Duplicate subscription types detected.");

            List<AiRecommendation> recs = new ArrayList<>();
            if (highest != null) {
                recs.add(new AiRecommendation(1, "Switch to Annual", highestName, "Consider switching your highest expense to annual billing.", "Save ~15-20%", 90, "Annual plans frequently offer significant discounts."));
            }

            List<SmartAlert> smartAlerts = new ArrayList<>();
            if (!duplicates.isEmpty()) {
                smartAlerts.add(new SmartAlert("🔴 High", duplicates.get(0).getServiceName(), "₹" + duplicates.get(0).getCost(), "Duplicate subscription detected. Consider cancelling one."));
            }
            if (monthlyTotal.compareTo(new BigDecimal("5000")) > 0) {
                smartAlerts.add(new SmartAlert("🟠 Medium", "Total Spend", "₹" + monthlyTotal, "Your monthly spending is above average."));
            }

            return new AiDashboardResponse(
                    new AiCopilotSummary("Hello " + user.getName(), "You currently spend " + monthlyTotal + "/month across " + subs.size() + " subscriptions.", insightStrs, score),
                    new AiHealthScoreResponse(score, List.of(new ScoreBreakdown("+0", "Calculated by Local Copilot.")), "Your portfolio is actively managed."),
                    new AiInsightsResponse(monthlyTotal, yearlyTotal, highestName, lowestName, catTotals, "Stable", highestName, lowestName, catPercentages, insightStrs),
                    recs,
                    new SpendingForecast(monthlyTotal, monthlyTotal.multiply(new BigDecimal("3")), monthlyTotal.multiply(new BigDecimal("12")), 99, List.of("Forecast generated perfectly using current active subscriptions.")),
                    smartAlerts
            );
        }
    }

    @Override
    public List<com.trackmysubs.dto.SubscriptionRequest> analyzeEmailsForSubscriptions(List<String> emails) {
        if (emails == null || emails.isEmpty()) return new ArrayList<>();

        // Truncate overly long emails to avoid token limits
        String aggregatedEmails = emails.stream()
                .map(email -> email.length() > 500 ? email.substring(0, 500) + "..." : email)
                .collect(Collectors.joining("\n---\n"));

        String prompt = "You are an expert AI subscription detector. Analyze the following extracted email bodies and identify any software subscriptions or recurring bills.\n" +
                "Respond ONLY with a valid JSON array of objects representing each unique subscription you found. Do not include markdown formatting like ```json.\n" +
                "Format EXACTLY like this:\n" +
                "[\n" +
                "  {\n" +
                "    \"serviceName\": \"Netflix\",\n" +
                "    \"category\": \"Entertainment\",\n" +
                "    \"planName\": \"Premium\",\n" +
                "    \"billingCycle\": \"Monthly\",\n" +
                "    \"cost\": 649.00,\n" +
                "    \"startDate\": \"2023-10-01\",\n" +
                "    \"expiryDate\": \"2023-11-01\",\n" +
                "    \"paymentMethod\": \"Credit Card\"\n" +
                "  }\n" +
                "]\n\n" +
                "Emails:\n" + aggregatedEmails;

        try {
            String response = chatClient.prompt().user(prompt).call().content();
            String json = extractJson(response);
            return objectMapper.readValue(json, new TypeReference<List<com.trackmysubs.dto.SubscriptionRequest>>(){});
        } catch (Exception e) {
            System.err.println("Ollama Email Parsing Error: " + e.getMessage());
            return new ArrayList<>();
        }
    }
}
