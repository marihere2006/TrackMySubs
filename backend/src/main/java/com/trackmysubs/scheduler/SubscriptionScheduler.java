package com.trackmysubs.scheduler;

import com.trackmysubs.entity.Subscription;
import com.trackmysubs.repository.SubscriptionRepository;
import com.trackmysubs.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
public class SubscriptionScheduler {

    private static final Logger logger = LoggerFactory.getLogger(SubscriptionScheduler.class);

    @Autowired
    private SubscriptionRepository subscriptionRepository;

    @Autowired
    private EmailService emailService;

    // Runs every day at 8:00 AM
    @Scheduled(cron = "0 0 8 * * ?")
    public void sendDailyExpiryReminders() {
        logger.info("Starting daily expiry reminder job...");
        
        List<Subscription> allSubscriptions = subscriptionRepository.findAll();
        LocalDate today = LocalDate.now();

        int emailsSent = 0;

        for (Subscription sub : allSubscriptions) {
            // Only process active subscriptions
            if (!"ACTIVE".equalsIgnoreCase(sub.getStatus())) {
                continue;
            }

            LocalDate expiryDate = sub.getExpiryDate();
            if (expiryDate == null) continue;

            // Calculate days until expiry
            long daysUntilExpiry = ChronoUnit.DAYS.between(today, expiryDate);

            // If the subscription is expiring within the reminder window (and hasn't already expired)
            if (daysUntilExpiry >= 0 && daysUntilExpiry <= sub.getReminderDays()) {
                String userEmail = sub.getUser().getEmail();
                if (userEmail != null && !userEmail.isEmpty()) {
                    emailService.sendExpiryReminderEmail(
                        userEmail, 
                        sub.getServiceName(), 
                        expiryDate, 
                        sub.getCost()
                    );
                    emailsSent++;
                }
            }
        }

        logger.info("Daily expiry reminder job completed. Sent {} emails.", emailsSent);
    }
}
