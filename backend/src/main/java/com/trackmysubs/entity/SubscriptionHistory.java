package com.trackmysubs.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "subscription_history")
public class SubscriptionHistory {

    @Id
    private String id;

    @Column(name = "subscription_id", nullable = false)
    private String subscriptionId;

    @Column(name = "service_name", nullable = false)
    private String serviceName;

    private String category;

    @Column(name = "plan_name")
    private String planName;

    @Column(name = "billing_cycle")
    private String billingCycle;

    @Column(name = "payment_method", nullable = false)
    private String paymentMethod;

    @Column(name = "auto_renewal", nullable = false)
    private Boolean autoRenewal;

    @Column(name = "reminder_days", nullable = false)
    private Integer reminderDays;

    @Column(name = "usage_frequency", nullable = false)
    private String usageFrequency;

    @Column(name = "renewal_number", nullable = false)
    private Integer renewalNumber;

    @Column(nullable = false)
    private BigDecimal cost;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "expiry_date", nullable = false)
    private LocalDate expiryDate;

    @Column(name = "renewed_on", nullable = false)
    private LocalDate renewedOn;

    private String website;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    public SubscriptionHistory() {}

    public SubscriptionHistory(String id, String subscriptionId, String serviceName, String category, String planName, String billingCycle, String paymentMethod, Boolean autoRenewal, Integer reminderDays, String usageFrequency, Integer renewalNumber, BigDecimal cost, LocalDate startDate, LocalDate expiryDate, LocalDate renewedOn, String website, String notes, User user) {
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
        this.user = user;
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

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }
}
