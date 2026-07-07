package com.trackmysubs.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
public class MailSendingException extends RuntimeException {
    public MailSendingException(String message) {
        super(message);
    }
}
