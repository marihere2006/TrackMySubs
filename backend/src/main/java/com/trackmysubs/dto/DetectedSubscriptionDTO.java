package com.trackmysubs.dto;

import java.math.BigDecimal;

public class DetectedSubscriptionDTO {

    private String merchantName;
    private String normalizedName;
    private String category;
    private BigDecimal estimatedCost;
    private String billingCycle;
    
    // "KNOWLEDGE_BASE" or "AI_DETECTED"
    private String source;
    
    // 0-100
    private Integer confidence;

    // ── Getters & Setters ──────────────────────────────────

    public String getMerchantName() { return merchantName; }
    public void setMerchantName(String merchantName) { this.merchantName = merchantName; }

    public String getNormalizedName() { return normalizedName; }
    public void setNormalizedName(String normalizedName) { this.normalizedName = normalizedName; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public BigDecimal getEstimatedCost() { return estimatedCost; }
    public void setEstimatedCost(BigDecimal estimatedCost) { this.estimatedCost = estimatedCost; }

    public String getBillingCycle() { return billingCycle; }
    public void setBillingCycle(String billingCycle) { this.billingCycle = billingCycle; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public Integer getConfidence() { return confidence; }
    public void setConfidence(Integer confidence) { this.confidence = confidence; }
}
