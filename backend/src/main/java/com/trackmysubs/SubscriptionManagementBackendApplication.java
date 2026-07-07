package com.trackmysubs;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SubscriptionManagementBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(SubscriptionManagementBackendApplication.class, args);
    }
}
