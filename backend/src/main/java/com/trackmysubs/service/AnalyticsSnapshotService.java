package com.trackmysubs.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trackmysubs.entity.AnalyticsSnapshot;
import com.trackmysubs.entity.Subscription;
import com.trackmysubs.entity.User;
import com.trackmysubs.repository.AnalyticsSnapshotRepository;
import com.trackmysubs.repository.SubscriptionRepository;
import com.trackmysubs.repository.UserRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AnalyticsSnapshotService {

    private final AnalyticsSnapshotRepository snapshotRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    private final MonthlySpendingCalculator monthlySpendingCalculator;

    public AnalyticsSnapshotService(AnalyticsSnapshotRepository snapshotRepository,
                                    SubscriptionRepository subscriptionRepository,
                                    UserRepository userRepository,
                                    ObjectMapper objectMapper,
                                    MonthlySpendingCalculator monthlySpendingCalculator) {
        this.snapshotRepository = snapshotRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
        this.monthlySpendingCalculator = monthlySpendingCalculator;
    }

    /**
     * Daily scheduled task to take a snapshot of analytics data for all users.
     * Runs at midnight (server time).
     */
    @Scheduled(cron = "0 0 0 * * ?")
    @Transactional
    public void captureDailySnapshots() {
        LocalDate today = LocalDate.now();
        List<User> users = userRepository.findAll();
        
        for (User user : users) {
            captureSnapshotForUser(user.getId(), today);
        }
    }

    /**
     * Capture a snapshot for a specific user. Call this on subscription mutations.
     */
    @Transactional
    public void triggerSnapshotForUser(Long userId) {
        captureSnapshotForUser(userId, LocalDate.now());
    }

    private void captureSnapshotForUser(Long userId, LocalDate snapshotDate) {
        List<Subscription> subscriptions = subscriptionRepository.findByUserId(userId);
        
        AnalyticsSnapshot snapshot = snapshotRepository.findByUserIdAndSnapshotDate(userId, snapshotDate)
                .orElse(new AnalyticsSnapshot());
        
        snapshot.setUserId(userId);
        snapshot.setSnapshotDate(snapshotDate);
        
        int total = subscriptions.size();
        int active = 0;
        int expired = 0;
        int expiringSoon = 0;
        BigDecimal totalMonthlySpend = monthlySpendingCalculator.calculateRunningSpend(subscriptions, snapshotDate);
        
        Map<String, BigDecimal> categorySpend = new HashMap<>();

        for (Subscription sub : subscriptions) {
            String status = sub.getStatus(); // Assumes computed dynamically or updated properly
            
            if ("Active".equalsIgnoreCase(status) || "Expiring Soon".equalsIgnoreCase(status)) {
                active++;
                if ("Expiring Soon".equalsIgnoreCase(status)) {
                    expiringSoon++;
                }
            } else if ("Expired".equalsIgnoreCase(status)) {
                expired++;
            }

            if (monthlySpendingCalculator.isCurrentlyRunning(sub, snapshotDate)) {
                BigDecimal currentMonthCost = sub.getCost() == null ? BigDecimal.ZERO : sub.getCost();
                String category = sub.getCategory() != null && !sub.getCategory().isEmpty() ? sub.getCategory() : "Other";
                categorySpend.put(category, categorySpend.getOrDefault(category, BigDecimal.ZERO).add(currentMonthCost));
            }
        }
        
        snapshot.setTotalCount(total);
        snapshot.setActiveCount(active);
        snapshot.setExpiredCount(expired);
        snapshot.setExpiringSoonCount(expiringSoon);
        snapshot.setTotalMonthlySpend(totalMonthlySpend);
        
        try {
            snapshot.setCategoryBreakdown(objectMapper.writeValueAsString(categorySpend));
        } catch (JsonProcessingException e) {
            snapshot.setCategoryBreakdown("{}");
        }
        
        snapshotRepository.save(snapshot);
    }
    public List<AnalyticsSnapshot> getSnapshotsForUser(Long userId) {
        return snapshotRepository.findByUserIdOrderBySnapshotDateAsc(userId);
    }
    
    public Map<String, Object> getAnalyticsSummaryForUser(Long userId) {
        List<AnalyticsSnapshot> recent = snapshotRepository.findRecentByUserId(userId, org.springframework.data.domain.PageRequest.of(0, 1));
        AnalyticsSnapshot current = recent.isEmpty() ? null : recent.get(0);
        
        Map<String, Object> summary = new HashMap<>();
        if (current != null) {
            summary.put("totalMonthlySpend", current.getTotalMonthlySpend());
            summary.put("activeSubscriptions", current.getActiveCount());
            summary.put("totalSubscriptions", current.getTotalCount());
        } else {
            summary.put("totalMonthlySpend", BigDecimal.ZERO);
            summary.put("activeSubscriptions", 0);
            summary.put("totalSubscriptions", 0);
        }
        return summary;
    }
}
