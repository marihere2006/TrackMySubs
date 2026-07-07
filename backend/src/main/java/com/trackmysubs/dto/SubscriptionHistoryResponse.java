package com.trackmysubs.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class SubscriptionHistoryResponse {
    private String id;
    private String subscriptionId;
    private String serviceName;
    private String category;
    private String planName;
    private String billingCycle;
    private String paymentMethod;
    private Boolean autoRenewal;
    private Integer reminderDays;
    private String usageFrequency;
    private Integer renewalNumber;
    private BigDecimal cost;
    private LocalDate startDate;
    private LocalDate expiryDate;
    private LocalDate renewedOn;
    private String website;
    private String notes;
    private Long userId;

    public SubscriptionHistoryResponse() {}

    public SubscriptionHistoryResponse(String id, String subscriptionId, String serviceName, String category, String planName, String billingCycle, String paymentMethod, Boolean autoRenewal, Integer reminderDays, String usageFrequency, Integer renewalNumber, BigDecimal cost, LocalDate startDate, LocalDate expiryDate, LocalDate renewedOn, String website, String notes, Long userId) {
        this.id = id;
        this.subscriptionId = subscriptionId;
        this.serviceName = serviceName;
        this.category = category;
        this.planName = planName;
        this.billingCycle = billingCycle;
        this.paymentMethod = paymentMethod;
        this.autoRenewal = autoRenewal;
        this.reminderDays = reminderDays;
        this.usageFrequency = usageFrequency;
        this.renewalNumber = renewalNumber;
        this.cost = cost;
        this.startDate = startDate;
        this.expiryDate = expiryDate;
        this.renewedOn = renewedOn;
        this.website = website;
        this.notes = notes;
        this.userId = userId;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getSubscriptionId() {
        return subscriptionId;
    }

    public void setSubscriptionId(String subscriptionId) {
        this.subscriptionId = subscriptionId;
    }

    public String getServiceName() {
        return serviceName;
    }

    public void setServiceName(String serviceName) {
        this.serviceName = serviceName;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getPlanName() {
        return planName;
    }

    public void setPlanName(String planName) {
        this.planName = planName;
    }

    public String getBillingCycle() {
        return billingCycle;
    }

    public void setBillingCycle(String billingCycle) {
        this.billingCycle = billingCycle;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public Boolean getAutoRenewal() {
        return autoRenewal;
    }

    public void setAutoRenewal(Boolean autoRenewal) {
        this.autoRenewal = autoRenewal;
    }

    public Integer getReminderDays() {
        return reminderDays;
    }

    public void setReminderDays(Integer reminderDays) {
        this.reminderDays = reminderDays;
    }

    public String getUsageFrequency() {
        return usageFrequency;
    }

    public void setUsageFrequency(String usageFrequency) {
        this.usageFrequency = usageFrequency;
    }

    public Integer getRenewalNumber() {
        return renewalNumber;
    }

    public void setRenewalNumber(Integer renewalNumber) {
        this.renewalNumber = renewalNumber;
    }

    public BigDecimal getCost() {
        return cost;
    }

    public void setCost(BigDecimal cost) {
        this.cost = cost;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(LocalDate expiryDate) {
        this.expiryDate = expiryDate;
    }

    public LocalDate getRenewedOn() {
        return renewedOn;
    }

    public void setRenewedOn(LocalDate renewedOn) {
        this.renewedOn = renewedOn;
    }

    public String getWebsite() {
        return website;
    }

    public void setWebsite(String website) {
        this.website = website;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }
}
