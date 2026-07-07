package com.trackmysubs.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class OtpRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Email format is invalid")
    private String email;

    private String otp;

    public OtpRequest() {}

    public OtpRequest(String email, String otp) {
        this.email = email;
        this.otp = otp;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getOtp() {
        return otp;
    }

    public void setOtp(String otp) {
        this.otp = otp;
    }
}
