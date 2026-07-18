package com.trackmysubs.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

@JsonIgnoreProperties(ignoreUnknown = true)
public class SubscriptionRequest {

    @NotBlank(message = "Service name is required")
    @JsonAlias({"service", "service_name", "subscriptionName", "subscription_name", "name", "merchantName", "merchant_name"})
    private String serviceName;

    @JsonAlias({"cat", "type"})
    private String category;
    @JsonAlias({"plan", "plan_name", "tier"})
    private String planName;
    @JsonAlias({"billing_cycle", "cycle", "interval", "frequency"})
    private String billingCycle;
    @JsonAlias({"payment_method", "paymentMode", "payment_mode", "method"})
    private String paymentMethod;
    @JsonAlias({"isAutoRenewal", "autoRenew", "autoRenewal"})
    private Boolean autoRenewal;
    @JsonAlias({"reminder_days", "reminder", "daysBeforeRenewal", "days_before_renewal"})
    private Integer reminderDays;
    @JsonAlias({"usage_frequency", "usage", "frequency", "usageRate", "usage_rate"})
    private String usageFrequency;

    @NotNull(message = "Cost is required")
    @DecimalMin(value = "0.01", message = "Cost must be greater than 0")
    @JsonAlias({"price", "amount", "monthlyCost", "monthly_cost", "yearlyCost", "yearly_cost", "subscriptionCost", "subscription_cost"})
    private BigDecimal cost;

    @NotNull(message = "Start date is required")
    @JsonAlias({"start_date", "startedOn", "started_on", "boughtOn", "bought_on", "effectiveDate", "effective_date"})
    private LocalDate startDate;

    @NotNull(message = "Expiry date is required")
    @JsonAlias({"expiry_date", "endDate", "end_date", "renewalDate", "renewal_date", "nextBillingDate", "next_billing_date", "expiresOn", "expires_on"})
    private LocalDate expiryDate;

    @JsonAlias({"url", "link", "site"})
    private String website;

    @JsonAlias({"note", "description", "memo"})
    private String notes;

    public SubscriptionRequest() {}

    public SubscriptionRequest(String serviceName, String category, String planName, String billingCycle, String paymentMethod, Boolean autoRenewal, Integer reminderDays, String usageFrequency, BigDecimal cost, LocalDate startDate, LocalDate expiryDate, String website, String notes) {
        this.serviceName = serviceName;
        this.category = category;
        this.planName = planName;
        this.billingCycle = billingCycle;
        this.paymentMethod = paymentMethod;
        this.autoRenewal = autoRenewal;
        this.reminderDays = reminderDays;
        this.usageFrequency = usageFrequency;
        this.cost = cost;
        this.startDate = startDate;
        this.expiryDate = expiryDate;
        this.website = website;
        this.notes = notes;
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
}
