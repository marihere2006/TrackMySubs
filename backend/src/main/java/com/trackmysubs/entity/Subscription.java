package com.trackmysubs.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "subscriptions")
public class Subscription {

    @Id
    private String id;

    @Column(name = "service_name", nullable = false)
    private String serviceName;

    private String category;

    @Column(name = "plan_name")
    private String planName;

    @Column(name = "billing_cycle")
    private String billingCycle;

    @Column(name = "payment_method", nullable = false)
    private String paymentMethod = "Other";

    @Column(name = "auto_renewal", nullable = false)
    private Boolean autoRenewal = false;

    @Column(name = "reminder_days", nullable = false)
    private Integer reminderDays = 7;

    @Column(name = "renewal_count", nullable = false)
    private Integer renewalCount = 0;

    @Column(name = "usage_frequency", nullable = false)
    private String usageFrequency = "Monthly";

    @Column(nullable = false)
    private BigDecimal cost;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "expiry_date", nullable = false)
    private LocalDate expiryDate;

    @Column(nullable = false)
    private String status;

    private String website;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    public Subscription() {}

    public Subscription(String id, String serviceName, String category, String planName, String billingCycle, String paymentMethod, Boolean autoRenewal, Integer reminderDays, Integer renewalCount, String usageFrequency, BigDecimal cost, LocalDate startDate, LocalDate expiryDate, String status, String website, String notes, User user) {
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
        this.user = user;
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

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }
}
