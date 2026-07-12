package com.trackmysubs.config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AiConfig {

    @Bean
    public ChatClient chatClient(ChatClient.Builder builder) {
        return builder.defaultSystem("You are a helpful AI Assistant for a Subscription Management System. You help users manage their subscriptions, analyze spending, and detect anomalies.").build();
    }
}
