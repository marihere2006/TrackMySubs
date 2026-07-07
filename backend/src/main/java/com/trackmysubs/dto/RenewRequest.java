package com.trackmysubs.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.math.BigDecimal;

public class RenewRequest {

    @NotNull(message = "New expiry date is required")
    private LocalDate newExpiryDate;

    private BigDecimal newCost;

    public RenewRequest() {}

    public RenewRequest(LocalDate newExpiryDate, BigDecimal newCost) {
        this.newExpiryDate = newExpiryDate;
        this.newCost = newCost;
    }

    public LocalDate getNewExpiryDate() {
        return newExpiryDate;
    }

    public void setNewExpiryDate(LocalDate newExpiryDate) {
        this.newExpiryDate = newExpiryDate;
    }

    public BigDecimal getNewCost() {
        return newCost;
    }

    public void setNewCost(BigDecimal newCost) {
        this.newCost = newCost;
    }
}
