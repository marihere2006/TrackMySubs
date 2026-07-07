package com.trackmysubs.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.TOO_MANY_REQUESTS)
public class OtpCooldownException extends RuntimeException {
    public OtpCooldownException(String message) {
        super(message);
    }
}
