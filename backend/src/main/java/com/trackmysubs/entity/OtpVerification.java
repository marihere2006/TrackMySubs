package com.trackmysubs.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "otp_verifications")
public class OtpVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String otpCode;

    @Column(nullable = false)
    private LocalDateTime expiryTime;

    @Column(nullable = false)
    private LocalDateTime lastRequestAt;

    @Column(nullable = false)
    private int requestCount;

    @Column(nullable = false)
    private boolean verified;

    public OtpVerification() {}

    public OtpVerification(String email, String otpCode, LocalDateTime expiryTime, LocalDateTime lastRequestAt, int requestCount, boolean verified) {
        this.email = email;
        this.otpCode = otpCode;
        this.expiryTime = expiryTime;
        this.lastRequestAt = lastRequestAt;
        this.requestCount = requestCount;
        this.verified = verified;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getOtpCode() {
        return otpCode;
    }

    public void setOtpCode(String otpCode) {
        this.otpCode = otpCode;
    }

    public LocalDateTime getExpiryTime() {
        return expiryTime;
    }

    public void setExpiryTime(LocalDateTime expiryTime) {
        this.expiryTime = expiryTime;
    }

    public LocalDateTime getLastRequestAt() {
        return lastRequestAt;
    }

    public void setLastRequestAt(LocalDateTime lastRequestAt) {
        this.lastRequestAt = lastRequestAt;
    }

    public int getRequestCount() {
        return requestCount;
    }

    public void setRequestCount(int requestCount) {
        this.requestCount = requestCount;
    }

    public boolean isVerified() {
        return verified;
    }

    public void setVerified(boolean verified) {
        this.verified = verified;
    }
}
