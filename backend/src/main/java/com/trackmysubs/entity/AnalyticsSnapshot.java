package com.trackmysubs.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Stores daily analytics snapshots per user.
 * Captured: daily at midnight + on subscription mutations.
 * Powers all historical trend charts in the Analytics page.
 */
@Entity
@Table(
    name = "analytics_snapshots",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "snapshot_date"})
)
public class AnalyticsSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "snapshot_date", nullable = false)
    private LocalDate snapshotDate;

    @Column(name = "total_monthly_spend", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalMonthlySpend = BigDecimal.ZERO;

    @Column(name = "total_count", nullable = false)
    private Integer totalCount = 0;

    @Column(name = "active_count", nullable = false)
    private Integer activeCount = 0;

    @Column(name = "expired_count", nullable = false)
    private Integer expiredCount = 0;

    @Column(name = "expiring_soon_count", nullable = false)
    private Integer expiringSoonCount = 0;

    /**
     * JSON map of category -> total spend for that snapshot.
     * e.g. {"Streaming": 1200.00, "Music": 179.00}
     * Stored as JSON string, mapped via columnDefinition.
     */
    @Column(name = "category_breakdown", columnDefinition = "JSON")
    private String categoryBreakdown;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    // ── Getters & Setters ──────────────────────────────────

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public LocalDate getSnapshotDate() { return snapshotDate; }
    public void setSnapshotDate(LocalDate snapshotDate) { this.snapshotDate = snapshotDate; }

    public BigDecimal getTotalMonthlySpend() { return totalMonthlySpend; }
    public void setTotalMonthlySpend(BigDecimal totalMonthlySpend) { this.totalMonthlySpend = totalMonthlySpend; }

    public Integer getTotalCount() { return totalCount; }
    public void setTotalCount(Integer totalCount) { this.totalCount = totalCount; }

    public Integer getActiveCount() { return activeCount; }
    public void setActiveCount(Integer activeCount) { this.activeCount = activeCount; }

    public Integer getExpiredCount() { return expiredCount; }
    public void setExpiredCount(Integer expiredCount) { this.expiredCount = expiredCount; }

    public Integer getExpiringSoonCount() { return expiringSoonCount; }
    public void setExpiringSoonCount(Integer expiringSoonCount) { this.expiringSoonCount = expiringSoonCount; }

    public String getCategoryBreakdown() { return categoryBreakdown; }
    public void setCategoryBreakdown(String categoryBreakdown) { this.categoryBreakdown = categoryBreakdown; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
