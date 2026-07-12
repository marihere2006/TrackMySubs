package com.trackmysubs.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Merchant knowledge base — maps normalized merchant names to subscription metadata.
 * Used by the bank statement parser to avoid calling AI for known merchants.
 * Pre-populated via schema.sql with 20+ common services.
 */
@Entity
@Table(name = "merchant_knowledge")
public class MerchantKnowledge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Lowercase, underscore-normalized merchant name.
     * e.g. "netflix", "amazon_prime", "youtube_premium"
     */
    @Column(name = "normalized_name", unique = true, nullable = false, length = 255)
    private String normalizedName;

    @Column(name = "display_name", nullable = false, length = 255)
    private String displayName;

    @Column(name = "category", nullable = false, length = 100)
    private String category;

    @Column(name = "billing_cycle", length = 50)
    private String billingCycle = "Monthly";

    /** Confidence 0-100 that this merchant mapping is correct */
    @Column(name = "confidence")
    private Integer confidence = 100;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "last_used_at")
    private LocalDateTime lastUsedAt = LocalDateTime.now();

    // ── Getters & Setters ──────────────────────────────────

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNormalizedName() { return normalizedName; }
    public void setNormalizedName(String normalizedName) { this.normalizedName = normalizedName; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getBillingCycle() { return billingCycle; }
    public void setBillingCycle(String billingCycle) { this.billingCycle = billingCycle; }

    public Integer getConfidence() { return confidence; }
    public void setConfidence(Integer confidence) { this.confidence = confidence; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getLastUsedAt() { return lastUsedAt; }
    public void setLastUsedAt(LocalDateTime lastUsedAt) { this.lastUsedAt = lastUsedAt; }
}
