package com.trackmysubs.service;

import com.trackmysubs.dto.SubscriptionHistoryResponse;
import com.trackmysubs.dto.SubscriptionRequest;
import com.trackmysubs.dto.SubscriptionResponse;
import com.trackmysubs.entity.Subscription;
import com.trackmysubs.entity.SubscriptionHistory;
import com.trackmysubs.entity.SubscriptionStatus;
import com.trackmysubs.entity.User;
import com.trackmysubs.exception.InvalidRequestException;
import com.trackmysubs.exception.ResourceNotFoundException;
import com.trackmysubs.repository.SubscriptionHistoryRepository;
import com.trackmysubs.repository.SubscriptionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class SubscriptionService {

    @Autowired
    private SubscriptionRepository subscriptionRepository;

    @Autowired
    private AIEngineService aiEngineService;

    @Autowired
    private SubscriptionHistoryRepository historyRepository;

    @Autowired
    private AnalyticsSnapshotService analyticsSnapshotService;

    @Autowired
    private AIResponseCache aiResponseCache;

    private String generateSubscriptionId() {
        return "sub-" + System.currentTimeMillis() + "-" + (int)(Math.random() * 90000 + 10000);
    }

    private String generateHistoryId() {
        return "hist-" + System.currentTimeMillis() + "-" + (int)(Math.random() * 90000 + 10000);
    }

    @Transactional(readOnly = true)
    public List<SubscriptionResponse> getAllSubscriptions(User user) {
        return subscriptionRepository.findByUser(user).stream()
                .map(this::mapToSubscriptionResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SubscriptionResponse getSubscriptionById(String id, User user) {
        Subscription sub = subscriptionRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription not found with ID: " + id));
        return mapToSubscriptionResponse(sub);
    }

    @Transactional
    public SubscriptionResponse createSubscription(SubscriptionRequest request, User user) {
        if (request.getExpiryDate().isBefore(request.getStartDate()) || request.getExpiryDate().isEqual(request.getStartDate())) {
            throw new InvalidRequestException("Expiry date must be after start date");
        }

        Subscription sub = new Subscription();
        sub.setId(generateSubscriptionId());
        sub.setServiceName(request.getServiceName());
        
        String category = request.getCategory();
        if (category == null || category.trim().isEmpty()) {
            category = aiEngineService.categorizeSubscription(request.getServiceName());
        }
        sub.setCategory(category);
        
        sub.setPlanName(request.getPlanName());
        sub.setBillingCycle(request.getBillingCycle());
        sub.setPaymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "Other");
        sub.setAutoRenewal(request.getAutoRenewal() != null ? request.getAutoRenewal() : false);
        sub.setReminderDays(request.getReminderDays() != null ? request.getReminderDays() : 7);
        sub.setRenewalCount(0);
        sub.setUsageFrequency(request.getUsageFrequency() != null ? request.getUsageFrequency() : "Monthly");
        sub.setCost(request.getCost());
        sub.setStartDate(request.getStartDate());
        sub.setExpiryDate(request.getExpiryDate());
        sub.setStatus(SubscriptionStatus.calculateStatus(request.getExpiryDate()));
        sub.setWebsite(request.getWebsite());
        sub.setNotes(request.getNotes());
        sub.setUser(user);

        Subscription saved = subscriptionRepository.save(sub);
        analyticsSnapshotService.triggerSnapshotForUser(user.getId());
        aiResponseCache.clearUserCache(user.getId());
        return mapToSubscriptionResponse(saved);
    }

    @Transactional
    public SubscriptionResponse updateSubscription(String id, SubscriptionRequest request, User user) {
        Subscription sub = subscriptionRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription not found with ID: " + id));

        if (request.getExpiryDate().isBefore(request.getStartDate()) || request.getExpiryDate().isEqual(request.getStartDate())) {
            throw new InvalidRequestException("Expiry date must be after start date");
        }

        sub.setServiceName(request.getServiceName());
        
        String category = request.getCategory();
        if (category == null || category.trim().isEmpty()) {
            category = aiEngineService.categorizeSubscription(request.getServiceName());
        }
        sub.setCategory(category);
        
        sub.setPlanName(request.getPlanName());
        sub.setBillingCycle(request.getBillingCycle());
        if (request.getPaymentMethod() != null) sub.setPaymentMethod(request.getPaymentMethod());
        if (request.getAutoRenewal() != null) sub.setAutoRenewal(request.getAutoRenewal());
        if (request.getReminderDays() != null) sub.setReminderDays(request.getReminderDays());
        if (request.getUsageFrequency() != null) sub.setUsageFrequency(request.getUsageFrequency());
        sub.setCost(request.getCost());
        sub.setStartDate(request.getStartDate());
        sub.setExpiryDate(request.getExpiryDate());
        sub.setStatus(SubscriptionStatus.calculateStatus(request.getExpiryDate()));
        sub.setWebsite(request.getWebsite());
        sub.setNotes(request.getNotes());

        Subscription updated = subscriptionRepository.save(sub);
        analyticsSnapshotService.triggerSnapshotForUser(user.getId());
        aiResponseCache.clearUserCache(user.getId());
        return mapToSubscriptionResponse(updated);
    }

    @Transactional
    public void deleteSubscription(String id, User user) {
        Subscription sub = subscriptionRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription not found with ID: " + id));
        subscriptionRepository.delete(sub);
        analyticsSnapshotService.triggerSnapshotForUser(user.getId());
        aiResponseCache.clearUserCache(user.getId());
    }

    @Transactional
    public SubscriptionResponse renewSubscription(String id, LocalDate newExpiryDate, java.math.BigDecimal newCost, boolean renewFromPreviousExpiry, User user) {
        Subscription sub = subscriptionRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription not found with ID: " + id));

        LocalDate today = LocalDate.now();
        LocalDate newStartDate = renewFromPreviousExpiry ? sub.getExpiryDate() : today;

        if (newExpiryDate.isBefore(newStartDate) || newExpiryDate.isEqual(newStartDate)) {
            throw new InvalidRequestException("New expiry date must be in the future relative to the start date");
        }

        // 1. Save old state to history
        SubscriptionHistory history = new SubscriptionHistory();
        history.setId(generateHistoryId());
        history.setSubscriptionId(sub.getId());
        history.setServiceName(sub.getServiceName());
        history.setCategory(sub.getCategory());
        history.setPlanName(sub.getPlanName());
        history.setBillingCycle(sub.getBillingCycle());
        history.setPaymentMethod(sub.getPaymentMethod());
        history.setAutoRenewal(sub.getAutoRenewal());
        history.setReminderDays(sub.getReminderDays());
        history.setUsageFrequency(sub.getUsageFrequency());
        history.setRenewalNumber(sub.getRenewalCount());
        history.setCost(sub.getCost());
        history.setStartDate(sub.getStartDate());
        history.setExpiryDate(sub.getExpiryDate());
        history.setRenewedOn(today);
        history.setWebsite(sub.getWebsite());
        history.setNotes(sub.getNotes());
        history.setUser(user);

        historyRepository.save(history);

        // 2. Update active subscription
        sub.setRenewalCount(sub.getRenewalCount() != null ? sub.getRenewalCount() + 1 : 1);
        sub.setStartDate(newStartDate);
        sub.setExpiryDate(newExpiryDate);
        if (newCost != null) {
            sub.setCost(newCost);
        }
        sub.setStatus(SubscriptionStatus.calculateStatus(newExpiryDate));

        Subscription updated = subscriptionRepository.save(sub);
        analyticsSnapshotService.triggerSnapshotForUser(user.getId());
        aiResponseCache.clearUserCache(user.getId());
        return mapToSubscriptionResponse(updated);
    }

    @Transactional(readOnly = true)
    public List<SubscriptionHistoryResponse> getHistory(User user) {
        return historyRepository.findByUser(user).stream()
                .map(this::mapToHistoryResponse)
                .collect(Collectors.toList());
    }

    private SubscriptionResponse mapToSubscriptionResponse(Subscription sub) {
        return new SubscriptionResponse(
                sub.getId(),
                sub.getServiceName(),
                sub.getCategory(),
                sub.getPlanName(),
                sub.getBillingCycle(),
                sub.getPaymentMethod(),
                sub.getAutoRenewal(),
                sub.getReminderDays(),
                sub.getRenewalCount(),
                sub.getUsageFrequency(),
                sub.getCost(),
                sub.getStartDate(),
                sub.getExpiryDate(),
                sub.getStatus(),
                sub.getWebsite(),
                sub.getNotes(),
                sub.getUser().getId()
        );
    }

    private SubscriptionHistoryResponse mapToHistoryResponse(SubscriptionHistory hist) {
        return new SubscriptionHistoryResponse(
                hist.getId(),
                hist.getSubscriptionId(),
                hist.getServiceName(),
                hist.getCategory(),
                hist.getPlanName(),
                hist.getBillingCycle(),
                hist.getPaymentMethod(),
                hist.getAutoRenewal(),
                hist.getReminderDays(),
                hist.getUsageFrequency(),
                hist.getRenewalNumber(),
                hist.getCost(),
                hist.getStartDate(),
                hist.getExpiryDate(),
                hist.getRenewedOn(),
                hist.getWebsite(),
                hist.getNotes(),
                hist.getUser().getId()
        );
    }
}
