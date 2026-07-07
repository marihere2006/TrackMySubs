package com.trackmysubs.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class SubscriptionResponse {
    private String id;
    private String serviceName;
    private String category;
    private String planName;
    private String billingCycle;
    private String paymentMethod;
    private Boolean autoRenewal;
    private Integer reminderDays;
    private Integer renewalCount;
    private String usageFrequency;
    private BigDecimal cost;
    private LocalDate startDate;
    private LocalDate expiryDate;
    private String status;
    private String website;
    private String notes;
    private Long userId;

    public SubscriptionResponse() {}

    public SubscriptionResponse(String id, String serviceName, String category, String planName, String billingCycle, String paymentMethod, Boolean autoRenewal, Integer reminderDays, Integer renewalCount, String usageFrequency, BigDecimal cost, LocalDate startDate, LocalDate expiryDate, String status, String website, String notes, Long userId) {
        this.id = id;
        this.serviceName = serviceName;
        this.category = category;
        this.planName = planName;
        this.billingCycle = billingCycle;
        this.paymentMethod = paymentMethod;
        this.autoRenewal = autoRenewal;
        this.reminderDays = reminderDays;
        this.renewalCount = renewalCount;
        this.usageFrequency = usageFrequency;
        this.cost = cost;
        this.startDate = startDate;
        this.expiryDate = expiryDate;
        this.status = status;
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

    public Integer getRenewalCount() {
        return renewalCount;
    }

    public void setRenewalCount(Integer renewalCount) {
        this.renewalCount = renewalCount;
    }

    public String getUsageFrequency() {
        return usageFrequency;
    }

    public void setUsageFrequency(String usageFrequency) {
        this.usageFrequency = usageFrequency;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
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
