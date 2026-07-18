package com.trackmysubs.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trackmysubs.dto.ai.*;
import com.trackmysubs.entity.Subscription;
import com.trackmysubs.entity.User;
import com.trackmysubs.repository.SubscriptionRepository;
import com.trackmysubs.repository.SubscriptionHistoryRepository;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import java.text.NumberFormat;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

@Service
public class AIEngineServiceImpl implements AIEngineService {

    private static final Set<String> STOP_WORDS = Set.of(
            "the", "and", "for", "with", "from", "your", "this", "that", "what", "which", "where", "when", "how", "why",
            "my", "me", "i", "to", "of", "a", "an", "on", "in", "at", "by", "it", "be", "is", "are", "or", "as", "about",
            "show", "find", "compare", "review", "check", "help", "please", "can", "could", "would", "should", "tell",
            "subscription", "subscriptions", "service", "services", "plan", "plans", "budget", "goal", "money", "cost", "costs",
            "spend", "spending", "save", "optimize", "remove", "cancel", "reduce"
    );

    private final ChatClient chatClient;
    private final SubscriptionRepository subscriptionRepository;
    private final SubscriptionHistoryRepository subscriptionHistoryRepository;
    private final MonthlySpendingCalculator monthlySpendingCalculator;
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    public AIEngineServiceImpl(ChatClient.Builder chatClientBuilder, SubscriptionRepository subscriptionRepository, SubscriptionHistoryRepository subscriptionHistoryRepository, MonthlySpendingCalculator monthlySpendingCalculator) {
        this.chatClient = chatClientBuilder.build();
        this.subscriptionRepository = subscriptionRepository;
        this.subscriptionHistoryRepository = subscriptionHistoryRepository;
        this.monthlySpendingCalculator = monthlySpendingCalculator;
    }

    private List<Subscription> getRunningSubs(User user) {
        LocalDate today = LocalDate.now();
        return subscriptionRepository.findByUser(user).stream()
                .filter(subscription -> monthlySpendingCalculator.isCurrentlyRunning(subscription, today))
                .collect(Collectors.toList());
    }

    private List<Subscription> getAllSubs(User user) {
        return subscriptionRepository.findByUser(user);
    }

    private BigDecimal getRunningSpend(List<Subscription> subscriptions) {
        return monthlySpendingCalculator.calculateRunningSpend(subscriptions, LocalDate.now());
    }

    private List<Subscription> getCurrentMonthSubs(User user) {
        LocalDate today = LocalDate.now();
        return getAllSubs(user).stream()
                .filter(subscription -> monthlySpendingCalculator.isCurrentMonthStart(subscription.getStartDate(), today))
                .collect(Collectors.toList());
    }

    private BigDecimal getCurrentMonthSpend(List<Subscription> subscriptions) {
        return monthlySpendingCalculator.calculateCurrentMonthSpend(subscriptions, LocalDate.now());
    }

    private BigDecimal getMonthlyEquivalentCost(Subscription subscription) {
        if (subscription == null || subscription.getCost() == null) {
            return BigDecimal.ZERO;
        }

        BigDecimal cost = subscription.getCost();
        String billingCycle = normalizeText(subscription.getBillingCycle());
        if (billingCycle.contains("annual") || billingCycle.contains("year")) {
            return cost.divide(new BigDecimal("12"), 2, RoundingMode.HALF_UP);
        }
        if (billingCycle.contains("quarter")) {
            return cost.divide(new BigDecimal("3"), 2, RoundingMode.HALF_UP);
        }
        if (billingCycle.contains("week")) {
            return cost.multiply(new BigDecimal("52")).divide(new BigDecimal("12"), 2, RoundingMode.HALF_UP);
        }
        if (billingCycle.contains("day")) {
            return cost.multiply(new BigDecimal("365")).divide(new BigDecimal("12"), 2, RoundingMode.HALF_UP);
        }
        return cost;
    }

    private List<DuplicatePair> getDuplicatePairs(List<Subscription> subs) {
        List<DuplicatePair> pairs = new ArrayList<>();
        for (int i = 0; i < subs.size(); i++) {
            for (int j = i + 1; j < subs.size(); j++) {
                Subscription first = subs.get(i);
                Subscription second = subs.get(j);
                int similarity = getDuplicateSimilarity(first, second);
                boolean exactMatch = compactText(first.getServiceName()).equals(compactText(second.getServiceName()));
                boolean strongNameMatch = compactText(first.getServiceName()).contains(compactText(second.getServiceName()))
                        || compactText(second.getServiceName()).contains(compactText(first.getServiceName()));
                boolean strongTokenMatch = similarity >= 72;
                if (!(exactMatch || strongNameMatch || strongTokenMatch)) {
                    continue;
                }

                BigDecimal lowerCost = getMonthlyEquivalentCost(first).min(getMonthlyEquivalentCost(second));
                BigDecimal estimatedWaste = similarity >= 90
                        ? lowerCost
                        : similarity >= 80
                        ? lowerCost.multiply(new BigDecimal("0.75"))
                        : lowerCost.multiply(new BigDecimal("0.5"));
                String familyLabel = detectFamily(first);
                String confidence = similarity >= 90 ? "High" : similarity >= 80 ? "Medium" : "Review";
                pairs.add(new DuplicatePair(
                        List.of(first, second),
                        similarity,
                        familyLabel,
                        estimatedWaste,
                        confidence,
                        exactMatch
                ));
            }
        }

        pairs.sort(Comparator.comparingInt(DuplicatePair::similarity).reversed());
        return pairs.stream().limit(6).collect(Collectors.toList());
    }

    private HealthMetrics calculateHealthMetrics(List<Subscription> runningSubs) {
        if (runningSubs == null || runningSubs.isEmpty()) {
            return new HealthMetrics(100, List.of(), "Perfect score! You have no active subscriptions yet.", 0, 0);
        }

        BigDecimal monthlyTotal = runningSubs.stream()
                .map(this::getMonthlyEquivalentCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        List<Subscription> upcomingRenewals = runningSubs.stream()
                .filter(sub -> sub.getExpiryDate() != null && !sub.getExpiryDate().isAfter(LocalDate.now().plusDays(30)))
                .collect(Collectors.toList());
        List<Subscription> urgentRenewals = upcomingRenewals.stream()
                .filter(sub -> sub.getExpiryDate() != null && !sub.getExpiryDate().isAfter(LocalDate.now().plusDays(7)))
                .collect(Collectors.toList());
        List<DuplicatePair> duplicatePairs = getDuplicatePairs(runningSubs);
        BigDecimal duplicateWaste = duplicatePairs.stream()
                .map(DuplicatePair::estimatedWaste)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal averageCost = monthlyTotal.divide(new BigDecimal(String.valueOf(Math.max(runningSubs.size(), 1))), 2, RoundingMode.HALF_UP);
        List<Subscription> lowUsageExpensive = runningSubs.stream()
                .filter(sub -> {
                    BigDecimal monthlyCost = getMonthlyEquivalentCost(sub);
                    String usage = normalizeText(sub.getUsageFrequency());
                    return monthlyCost.compareTo(averageCost) >= 0 && usage.matches(".*(rare|never|low).*");
                })
                .collect(Collectors.toList());
        List<Subscription> expensiveAutoRenew = runningSubs.stream()
                .filter(sub -> getMonthlyEquivalentCost(sub).compareTo(averageCost) >= 0 && Boolean.TRUE.equals(sub.getAutoRenewal()))
                .collect(Collectors.toList());

        int renewalManagement = Math.max(0,
                100 - (urgentRenewals.size() * 14) - ((int) upcomingRenewals.stream().filter(sub -> !Boolean.TRUE.equals(sub.getAutoRenewal())).count() * 6));
        int unusedExpensive = Math.max(0, 100 - (lowUsageExpensive.size() * 20));
        int duplicateServices = monthlyTotal.compareTo(BigDecimal.ZERO) > 0
                ? Math.max(0, 100 - Math.round(duplicateWaste.divide(monthlyTotal, 4, RoundingMode.HALF_UP).multiply(new BigDecimal("120")).floatValue()))
                : 100;
        int autoRenewOptimization = Math.max(0, 100 - (expensiveAutoRenew.size() * 12) + (int) runningSubs.stream().filter(sub -> Boolean.TRUE.equals(sub.getAutoRenewal())).count() * 2);

        Map<String, Integer> components = Map.of(
                "renewalManagement", Math.min(100, renewalManagement),
                "unusedExpensive", Math.min(100, unusedExpensive),
                "duplicateServices", Math.min(100, duplicateServices),
                "autoRenewOptimization", Math.min(100, autoRenewOptimization)
        );

        List<WeightedHealthComponent> weightedEntries = List.of(
                new WeightedHealthComponent("renewalManagement", 40, components.get("renewalManagement")),
                new WeightedHealthComponent("unusedExpensive", 20, components.get("unusedExpensive")),
                new WeightedHealthComponent("duplicateServices", 20, components.get("duplicateServices")),
                new WeightedHealthComponent("autoRenewOptimization", 10, components.get("autoRenewOptimization"))
        );

        int totalWeight = weightedEntries.stream().mapToInt(WeightedHealthComponent::weight).sum();
        int score = Math.round(
                (float) weightedEntries.stream().mapToDouble(entry -> entry.value() * entry.weight()).sum() / Math.max(totalWeight, 1)
        );

        List<ScoreBreakdown> breakdown = List.of(
                new ScoreBreakdown(components.get("renewalManagement") + "/100", urgentRenewals.isEmpty()
                        ? "Renewals are under control."
                        : urgentRenewals.size() + " renewal" + (urgentRenewals.size() == 1 ? "" : "s") + " need attention within 7 days."),
                new ScoreBreakdown(components.get("unusedExpensive") + "/100", lowUsageExpensive.isEmpty()
                        ? "No obvious expensive unused plans were found."
                        : lowUsageExpensive.size() + " high-cost subscription" + (lowUsageExpensive.size() == 1 ? "" : "s") + " appear underused."),
                new ScoreBreakdown(components.get("duplicateServices") + "/100", duplicatePairs.isEmpty()
                        ? "No clear duplicate services were detected."
                        : duplicatePairs.size() + " possible overlap" + (duplicatePairs.size() == 1 ? "" : "s") + " were detected."),
                new ScoreBreakdown(components.get("autoRenewOptimization") + "/100", expensiveAutoRenew.isEmpty()
                        ? "Auto-renew settings look balanced."
                        : expensiveAutoRenew.size() + " expensive plan" + (expensiveAutoRenew.size() == 1 ? "" : "s") + " auto-renew automatically.")
        );

        String reason;
        if (!urgentRenewals.isEmpty()) {
            reason = urgentRenewals.size() + " renewal" + (urgentRenewals.size() == 1 ? "" : "s") + " need attention soon.";
        } else if (!lowUsageExpensive.isEmpty()) {
            reason = lowUsageExpensive.size() + " high-cost plan" + (lowUsageExpensive.size() == 1 ? "" : "s") + " look underused.";
        } else if (!duplicatePairs.isEmpty()) {
            reason = duplicatePairs.size() + " overlap" + (duplicatePairs.size() == 1 ? "" : "s") + " may be wasting money.";
        } else if (!expensiveAutoRenew.isEmpty()) {
            reason = expensiveAutoRenew.size() + " expensive auto-renew plan" + (expensiveAutoRenew.size() == 1 ? "" : "s") + " could be reviewed.";
        } else {
            reason = "Your subscription setup looks balanced.";
        }

        return new HealthMetrics(Math.max(0, Math.min(100, score)), breakdown, reason, duplicatePairs.size(), upcomingRenewals.size());
    }

    private String compactText(String value) {
        return normalizeText(value).replaceAll("[^a-z0-9]", "");
    }

    private List<Subscription> getDuplicates(List<Subscription> subs) {
        List<Subscription> duplicates = new ArrayList<>();
        for (int i = 0; i < subs.size(); i++) {
            for (int j = i + 1; j < subs.size(); j++) {
                Subscription first = subs.get(i);
                Subscription second = subs.get(j);
                int similarity = getDuplicateSimilarity(first, second);
                boolean exactMatch = normalizeText(first.getServiceName()).equals(normalizeText(second.getServiceName()));
                if (exactMatch || similarity >= 68) {
                    if (!duplicates.contains(first)) duplicates.add(first);
                    if (!duplicates.contains(second)) duplicates.add(second);
                }
            }
        }
        return duplicates;
    }

    private Set<String> extractTokens(Subscription subscription) {
        String text = normalizeText(
                (subscription.getServiceName() == null ? "" : subscription.getServiceName()) + " " +
                (subscription.getPlanName() == null ? "" : subscription.getPlanName()) + " " +
                (subscription.getCategory() == null ? "" : subscription.getCategory())
        );
        return Arrays.stream(text.split("\\s+"))
                .filter(token -> token.length() > 1 && !STOP_WORDS.contains(token))
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private String detectFamily(Subscription subscription) {
        String text = normalizeText(
                (subscription.getServiceName() == null ? "" : subscription.getServiceName()) + " " +
                (subscription.getPlanName() == null ? "" : subscription.getPlanName()) + " " +
                (subscription.getCategory() == null ? "" : subscription.getCategory())
        );
        if (text.matches(".*(netflix|prime video|prime|hotstar|disney|hulu|stream|video).*")) return "streaming";
        if (text.matches(".*(spotify|apple music|youtube music|music|audio).*")) return "music";
        if (text.matches(".*(dropbox|google drive|google one|icloud|drive|storage|onedrive|mega).*")) return "cloud";
        if (text.matches(".*(chatgpt|claude|gemini|copilot|perplexity|cursor|openai|anthropic|mistral).*")) return "ai";
        if (text.matches(".*(steam|xbox|playstation|nintendo|game pass|gaming).*")) return "gaming";
        if (text.matches(".*(coursera|udemy|skillshare|udacity|masterclass|learning).*")) return "education";
        if (text.matches(".*(notion|todoist|slack|microsoft 365|office|workspace|asana|trello|clickup|figma|canva|adobe).*")) return "productivity";
        if (text.matches(".*(1password|dashlane|lastpass|bitwarden|vpn|security|password).*")) return "security";
        return "other";
    }

    private int getDuplicateSimilarity(Subscription a, Subscription b) {
        String serviceA = normalizeText(a.getServiceName());
        String serviceB = normalizeText(b.getServiceName());
        String compactA = compactText(a.getServiceName());
        String compactB = compactText(b.getServiceName());
        if (compactA.isEmpty() || compactB.isEmpty()) return 0;
        if (compactA.equals(compactB)) return 100;
        if (compactA.contains(compactB) || compactB.contains(compactA)) return 94;
        if (serviceA.isEmpty() || serviceB.isEmpty()) return 0;
        if (serviceA.equals(serviceB)) return 92;
        if (serviceA.contains(serviceB) || serviceB.contains(serviceA)) return 86;

        Set<String> tokensA = extractTokens(a);
        Set<String> tokensB = extractTokens(b);
        Set<String> shared = new LinkedHashSet<>(tokensA);
        shared.retainAll(tokensB);
        Set<String> unionTokens = new LinkedHashSet<>(tokensA);
        unionTokens.addAll(tokensB);
        int union = unionTokens.size();
        double tokenScore = union == 0 ? 0 : ((double) shared.size() / union) * 100.0;

        String familyA = detectFamily(a);
        String familyB = detectFamily(b);
        boolean sameFamily = !familyA.equals("other") && familyA.equals(familyB);
        boolean sameCategory = normalizeText(a.getCategory()).equals(normalizeText(b.getCategory())) && !normalizeText(a.getCategory()).isEmpty();
        boolean sameBrand = !tokensA.isEmpty() && !tokensB.isEmpty() && Objects.equals(tokensA.iterator().next(), tokensB.iterator().next());

        int score = (int) Math.round(tokenScore * 0.35);
        if (sameFamily) score += shared.size() >= 1 ? 24 : 12;
        if (sameCategory) score += 10;
        if (sameBrand) score += 8;
        if (shared.size() >= 2) score += 18;
        else if (shared.size() == 1) score += 6;
        if (compactA.endsWith(compactB) || compactB.endsWith(compactA)) score += 10;
        return Math.min(100, score);
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

    private String formatRupee(BigDecimal amount) {
        if (amount == null) {
            return "\u2014";
        }
        NumberFormat format = NumberFormat.getCurrencyInstance(new Locale("en", "IN"));
        format.setMaximumFractionDigits(amount.stripTrailingZeros().scale() <= 0 ? 0 : 2);
        format.setMinimumFractionDigits(0);
        return format.format(amount);
    }

    private String normalizeText(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private boolean containsAny(String text, String... phrases) {
        String normalized = normalizeText(text);
        for (String phrase : phrases) {
            if (normalized.contains(phrase)) {
                return true;
            }
        }
        return false;
    }

    private Subscription findSubscriptionByPrompt(List<Subscription> subscriptions, String prompt) {
        String normalized = normalizeText(prompt);
        if (normalized.isEmpty()) {
            return null;
        }

        for (Subscription subscription : subscriptions) {
            String service = normalizeText(subscription.getServiceName());
            String plan = normalizeText(subscription.getPlanName());
            if (service.isEmpty()) continue;
            if (normalized.contains(service) || normalized.contains(plan)) {
                return subscription;
            }
        }

        return subscriptions.stream()
                .filter(subscription -> normalized.contains(normalizeText(subscription.getServiceName()).split(" ")[0]))
                .findFirst()
                .orElse(null);
    }

    private String buildSpendSummary(List<Subscription> subs) {
        if (subs.isEmpty()) {
            return "You do not have any subscriptions that started this month yet.";
        }

        BigDecimal monthlyTotal = subs.stream().map(Subscription::getCost).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal yearlyTotal = monthlyTotal.multiply(new BigDecimal("12"));
        Subscription highest = subs.stream().max(Comparator.comparing(Subscription::getCost)).orElse(null);

        String highestPart = highest == null ? "" : " Your highest current-month subscription is " + highest.getServiceName() + " at " + formatRupee(highest.getCost()) + " per month.";
        return "You spend " + formatRupee(monthlyTotal) + " per month and about " + formatRupee(yearlyTotal) + " per year across " + subs.size() + " subscriptions started this month." + highestPart;
    }

    private String buildHealthSummary(List<Subscription> subs) {
        if (subs.isEmpty()) {
            return "Your subscription health score is 100 out of 100 because there are no active subscriptions yet.";
        }

        HealthMetrics metrics = calculateHealthMetrics(subs);
        return "Your subscription health score is " + metrics.score() + " out of 100. I found " + metrics.duplicateGroups() + " possible overlap group" + (metrics.duplicateGroups() == 1 ? "" : "s") + " and " + metrics.upcomingRenewals() + " renewal" + (metrics.upcomingRenewals() == 1 ? "" : "s") + " coming soon.";
    }

    @Override
    public AiCopilotSummary getCopilotSummary(User user) {
        List<Subscription> currentMonthSubs = getCurrentMonthSubs(user);
        List<Subscription> runningSubs = getRunningSubs(user);
        BigDecimal monthlyTotal = getCurrentMonthSpend(currentMonthSubs);
        AiHealthScoreResponse healthScore = getHealthScore(user);
        Subscription highest = currentMonthSubs.stream().max(Comparator.comparing(Subscription::getCost)).orElse(null);
        List<String> bulletPoints = new ArrayList<>();

        if (currentMonthSubs.isEmpty()) {
            bulletPoints.add("Add subscriptions that start this month to see monthly spend insights.");
        } else {
            if (highest != null) {
                bulletPoints.add(highest.getServiceName() + " is your highest current-month expense.");
            }
            bulletPoints.add("You have " + currentMonthSubs.size() + " subscription" + (currentMonthSubs.size() == 1 ? "" : "s") + " that started this month.");
        }

        if (!runningSubs.isEmpty()) {
            long upcomingRenewals = runningSubs.stream()
                    .filter(sub -> sub.getExpiryDate() != null && !sub.getExpiryDate().isAfter(LocalDate.now().plusDays(14)))
                    .count();
            bulletPoints.add(upcomingRenewals + " renewal" + (upcomingRenewals == 1 ? "" : "s") + " are coming soon.");
        }
        bulletPoints.add("Health score: " + healthScore.healthScore() + "/100.");

        String summaryText = currentMonthSubs.isEmpty()
                ? "You do not have any subscriptions that started this month yet."
                : "You currently spend " + formatRupee(monthlyTotal) + " per month across " + currentMonthSubs.size() + " subscriptions that started this month.";

        return new AiCopilotSummary("Hello " + user.getName(), summaryText, bulletPoints, healthScore.healthScore());
    }

    @Override
    public AiHealthScoreResponse getHealthScore(User user) {
        List<Subscription> subs = getRunningSubs(user);
        if (subs.isEmpty()) return new AiHealthScoreResponse(100, Collections.emptyList(), "Perfect score! You have no active subscriptions yet.");

        HealthMetrics metrics = calculateHealthMetrics(subs);
        return new AiHealthScoreResponse(metrics.score(), metrics.breakdown(), metrics.reason());
    }

    @Override
    public AiInsightsResponse getFinancialInsights(User user) {
        List<Subscription> subs = getCurrentMonthSubs(user);

        BigDecimal monthlyTotal = getCurrentMonthSpend(subs);
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
            + "Only subscriptions that started this month count toward monthly spending. "
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
        List<Subscription> subs = getCurrentMonthSubs(user);
        if (subs.isEmpty()) return Collections.emptyList();
        
        String prompt = "Review these subscriptions and provide cost-saving recommendations (Priority 1, 2, 3). "
            + "Only subscriptions that started this month count toward monthly spending. "
            + "Subs: " + subs.stream().map(s -> s.getServiceName() + " (" + s.getCost() + ")").collect(Collectors.joining(", ")) + ". "
            + "Format EXACTLY as a JSON array:\n"
            + "[\n"
            + "  { \"priority\": 1, \"action\": \"Switch to Annual\", \"targetSubscription\": \"AWS\", \"description\": \"Switch AWS to annual billing.\", \"estimatedSavings\": \"Ã¢â€šÂ¹2,300/year\", \"confidence\": 96, \"reason\": \"Continuous monthly renewals detected.\" }\n"
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
        List<Subscription> subs = getCurrentMonthSubs(user);
        BigDecimal monthlyTotal = getCurrentMonthSpend(subs);
        if (subs.isEmpty()) return new SpendingForecast(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, 100, List.of("No subscriptions started this month yet."));
        
        String prompt = "Forecast spending based on these monthly subs:\n"
            + "Only subscriptions that started this month count toward monthly spending. "
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
        List<Subscription> subs = getCurrentMonthSubs(user);
        if (subs.isEmpty()) return Collections.emptyList();
        
        List<Subscription> duplicates = getDuplicates(subs);
        
        String prompt = "Generate Smart Alerts for these subscriptions (High, Medium, Low, Info). "
            + "Identify upcoming renewals or high expenses. Do NOT create alerts for duplicates, I will handle that natively. "
            + "Only subscriptions that started this month count toward monthly spending. "
            + "Subs: " + subs.stream().map(s -> s.getServiceName() + " (" + s.getCost() + ")").collect(Collectors.joining(", ")) + ". "
            + "Format EXACTLY as a valid JSON array:\n"
            + "[\n"
            + "  { \"priority\": \"High\", \"target\": \"AWS\", \"price\": \"₹1999\", \"message\": \"Renews tomorrow\" }\n"
            + "]\n"
            + "Do not output any text outside the JSON.";
            
        try {
            String response = chatClient.prompt().user(prompt).call().content();
            List<SmartAlert> alerts = objectMapper.readValue(extractJson(response), new TypeReference<List<SmartAlert>>(){});
            if (!duplicates.isEmpty()) {
                String names = duplicates.stream().map(Subscription::getServiceName).distinct().collect(Collectors.joining(" & "));
                alerts.add(0, new SmartAlert("High", names, "", "Duplicate subscription types detected. Consider keeping only one."));
            }
            return alerts;
        } catch (Exception e) {
            return List.of(new SmartAlert("High", "System", "₹0", cleanError(e)));
        }
    }

    @Override
    public List<AiTimelineEvent> getTimeline(User user) {
        List<AiTimelineEvent> timeline = new ArrayList<>();
        timeline.add(new AiTimelineEvent("Today", "Health score recalculated"));
        
        List<Subscription> subs = getRunningSubs(user);
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
        String message = request == null ? "" : request.message();
        String workflowType = request == null || request.workflowType() == null ? "" : request.workflowType().trim().toLowerCase(Locale.ROOT);
        String normalized = normalizeText(message);
        List<Subscription> allSubs = getAllSubs(user);
        List<Subscription> currentMonthSubs = getCurrentMonthSubs(user);
        List<Subscription> runningSubs = getRunningSubs(user);
        BigDecimal monthlyTotal = getCurrentMonthSpend(currentMonthSubs);
        BigDecimal yearlyTotal = monthlyTotal.multiply(new BigDecimal("12"));

        if (normalized.isEmpty()) {
            return new ChatResponse("Please type a question about your subscriptions.", "NONE");
        }

        if (normalized.matches("^(hi|hello|hey|good morning|good afternoon|good evening|good night)[.!?\\s]*$") || normalized.startsWith("hi ") || normalized.startsWith("hello ") || normalized.startsWith("hey ")) {
            return new ChatResponse(
                    "Hello " + user.getName() + ". I can help with spending, renewals, cancellations, and duplicate subscriptions. What would you like to look at?",
                    "NONE");
        }

        if (containsAny(normalized, "delete all", "remove all subscriptions", "erase all subscriptions", "clear all subscriptions")) {
            return new ChatResponse(
                    "This will permanently delete all subscriptions and history. Type confirm delete all to continue.",
                    "NONE");
        }

        if (containsAny(normalized, "confirm delete all", "yes delete all", "proceed delete all")) {
            subscriptionHistoryRepository.deleteAll(subscriptionHistoryRepository.findByUser(user));
            subscriptionRepository.deleteAll(allSubs);
            return new ChatResponse("All subscriptions and history were removed.", "RELOAD");
        }

        if (containsAny(normalized, "budget", "spend under", "spend below", "monthly cap", "monthly limit") || "budget_planner".equals(workflowType)) {
            String amount = null;
            try {
                java.util.regex.Matcher matcher = java.util.regex.Pattern.compile("(?:rs\\.?\\s*|inr\\s*|\\$\\s*)?([0-9][0-9,]*(?:\\.[0-9]+)?)", java.util.regex.Pattern.CASE_INSENSITIVE)
                        .matcher(message);
                if (matcher.find()) {
                    amount = matcher.group(1);
                }
            } catch (Exception ignored) {
                // Fall through to a follow-up question.
            }
            if (amount == null || amount.trim().isEmpty()) {
                return new ChatResponse("What monthly spending limit would you like?", "NONE");
            }
            BigDecimal target = new BigDecimal(amount.replace(",", ""));
            if (target.compareTo(BigDecimal.ZERO) <= 0) {
                return new ChatResponse("What monthly spending limit would you like?", "NONE");
            }
            if ("budget_planner".equals(workflowType) && normalized.matches("^[0-9][0-9,]*(?:\\.[0-9]+)?$")) {
                return new ChatResponse(
                        "Got it. Iâ€™ll compare your subscriptions against a monthly budget of " + formatRupee(target) + ".",
                        "NONE");
            }
            return new ChatResponse(
                    "Got it. Iâ€™ll compare your subscriptions against a monthly budget of " + formatRupee(target) + ". Would you like notifications when you get close to that limit?",
                    "NONE");
        }

        if (containsAny(normalized, "how much do i spend", "how much am i spending", "what do i spend", "yearly spending", "monthly spending", "spend every month")) {
            return new ChatResponse(buildSpendSummary(currentMonthSubs), "NONE");
        }

        if (containsAny(normalized, "health score", "how healthy", "improve it")) {
            return new ChatResponse(buildHealthSummary(runningSubs), "NONE");
        }

        if (containsAny(normalized, "what if", "cancel")) {
            Subscription target = findSubscriptionByPrompt(allSubs, message);
            if (target == null) {
                return new ChatResponse("Which subscription should I simulate? Please name the exact service.", "NONE");
            }
            BigDecimal savings = monthlySpendingCalculator.isCurrentMonthStart(target.getStartDate(), LocalDate.now())
                    && target.getCost() != null
                    ? target.getCost()
                    : BigDecimal.ZERO;
            BigDecimal yearlySavings = savings.multiply(new BigDecimal("12"));
            BigDecimal remaining = monthlyTotal.subtract(savings).max(BigDecimal.ZERO);
            return new ChatResponse(
                    "Cancelling " + target.getServiceName() + " would save about " + formatRupee(savings) + " per month and " + formatRupee(yearlySavings) + " per year. Your monthly spend would drop to about " + formatRupee(remaining) + ".",
                    "NONE");
        }

        if (containsAny(normalized, "renewal", "renews", "upcoming renewals")) {
            List<Subscription> upcoming = runningSubs.stream()
                    .filter(sub -> sub.getExpiryDate() != null)
                    .sorted(Comparator.comparing(Subscription::getExpiryDate))
                    .limit(3)
                    .toList();

            if (upcoming.isEmpty()) {
                return new ChatResponse("I could not find any active renewals coming up soon.", "NONE");
            }

            Subscription next = upcoming.get(0);
            return new ChatResponse(
                    "The next renewal is " + next.getServiceName() + " on " + next.getExpiryDate() + ". It costs " + formatRupee(next.getCost()) + " per billing cycle. You can review the rest in the renewals panel.",
                    "NONE");
        }

        if (containsAny(normalized, "duplicate", "overlap", "redundant")) {
            List<Subscription> duplicates = getDuplicates(allSubs);
            if (duplicates.isEmpty()) {
                return new ChatResponse("I did not find any obvious duplicate subscriptions.", "NONE");
            }
            String names = duplicates.stream().map(Subscription::getServiceName).distinct().limit(4).collect(Collectors.joining(", "));
            return new ChatResponse("I found possible duplicate or overlapping subscriptions: " + names + ". Review those before paying for both.", "NONE");
        }

        if (containsAny(normalized, "optimize", "save money", "reduce spending", "cut costs")) {
            Subscription highest = currentMonthSubs.stream().max(Comparator.comparing(Subscription::getCost)).orElse(null);
            if (highest == null) {
                return new ChatResponse("Add subscriptions first and I will suggest places to save.", "NONE");
            }
            return new ChatResponse(
                    "Your quickest savings opportunity is usually " + highest.getServiceName() + " at " + formatRupee(highest.getCost()) + " per month. I can also review duplicates, renewals, and low-usage plans.",
                    "NONE");
        }

        if (containsAny(normalized, "most expensive", "highest subscription", "costs the most")) {
            Subscription highest = currentMonthSubs.stream().max(Comparator.comparing(Subscription::getCost)).orElse(null);
            if (highest == null) {
                return new ChatResponse("Add subscriptions first and I will tell you which one costs the most.", "NONE");
            }
            return new ChatResponse(
                    highest.getServiceName() + " is your most expensive subscription at " + formatRupee(highest.getCost()) + " per month. If you do not use it often, that is usually the first one to review.",
                    "NONE");
        }

        return new ChatResponse(
                "I can help with spending totals, renewals, cancellations, duplicates, and budget planning. Try asking about your most expensive subscription or upcoming renewals.",
                "NONE");
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
                "Required fields: serviceName, category, planName, billingCycle, cost, autoRenewal, startDate, expiryDate.\n" +
                "Optional fields: paymentMethod, reminderDays, usageFrequency, website, notes.\n" +
                "Accepted aliases are okay, but prefer the exact field names serviceName, category, planName, billingCycle, cost, autoRenewal, startDate, expiryDate, paymentMethod, reminderDays, usageFrequency, website, notes.\n" +
                "If a detail is not known, omit it rather than inventing it.\n" +
                "Example response:\n" +
                "{\n" +
                "  \"serviceName\": \"Netflix\",\n" +
                "  \"category\": \"Streaming\",\n" +
                "  \"planName\": \"Premium\",\n" +
                "  \"billingCycle\": \"Monthly\",\n" +
                "  \"cost\": 649.00,\n" +
                "  \"autoRenewal\": false,\n" +
                "  \"startDate\": \"2023-10-01\",\n" +
                "  \"expiryDate\": \"2023-11-01\",\n" +
                "  \"paymentMethod\": \"Credit Card\"\n" +
                "}";

        try {
            String response = chatClient.prompt().user(prompt).call().content();
            String json = extractJson(response);
            String normalized = SubscriptionRequestNormalizer.normalizeSingle(objectMapper, json);
            return objectMapper.readValue(normalized, com.trackmysubs.dto.SubscriptionRequest.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse subscription from text: " + e.getMessage(), e);
        }
    }

    @Override
    public AiDashboardResponse getDashboardData(User user) {
        return new AiDashboardResponse(
                getCopilotSummary(user),
                getHealthScore(user),
                getFinancialInsights(user),
                getRecommendations(user),
                getSpendingForecast(user),
                getSmartAlerts(user)
        );
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
                "Use the exact field names serviceName, category, planName, billingCycle, cost, autoRenewal, startDate, expiryDate, paymentMethod, reminderDays, usageFrequency, website, notes whenever possible.\n" +
                "Format EXACTLY like this:\n" +
                "[\n" +
                "  {\n" +
                "    \"serviceName\": \"Netflix\",\n" +
                "    \"category\": \"Entertainment\",\n" +
                "    \"planName\": \"Premium\",\n" +
                "    \"billingCycle\": \"Monthly\",\n" +
                "    \"cost\": 649.00,\n" +
                "    \"autoRenewal\": true,\n" +
                "    \"startDate\": \"2023-10-01\",\n" +
                "    \"expiryDate\": \"2023-11-01\",\n" +
                "    \"paymentMethod\": \"Credit Card\"\n" +
                "  }\n" +
                "]\n\n" +
                "Emails:\n" + aggregatedEmails;

        try {
            String response = chatClient.prompt().user(prompt).call().content();
            String json = extractJson(response);
            String normalized = SubscriptionRequestNormalizer.normalizeArray(objectMapper, json);
            return objectMapper.readValue(normalized, new TypeReference<List<com.trackmysubs.dto.SubscriptionRequest>>(){});
        } catch (Exception e) {
            System.err.println("Ollama Email Parsing Error: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    private record HealthMetrics(
            int score,
            List<ScoreBreakdown> breakdown,
            String reason,
            int duplicateGroups,
            long upcomingRenewals
    ) {}

    private record DuplicatePair(
            List<Subscription> items,
            int similarity,
            String familyLabel,
            BigDecimal estimatedWaste,
            String confidence,
            boolean exactMatch
    ) {}

    private record WeightedHealthComponent(
            String key,
            int weight,
            int value
    ) {}
}


