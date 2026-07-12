package com.trackmysubs.service;

import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class AIResponseCache {

    private final Map<String, CacheEntry> cache = new ConcurrentHashMap<>();

    // Default TTL in minutes
    private static final int DEFAULT_TTL_MINUTES = 15;

    public void put(String key, Object value) {
        put(key, value, DEFAULT_TTL_MINUTES);
    }

    public void put(String key, Object value, int ttlMinutes) {
        cache.put(key, new CacheEntry(value, LocalDateTime.now().plusMinutes(ttlMinutes)));
    }

    public Object get(String key) {
        CacheEntry entry = cache.get(key);
        if (entry != null) {
            if (entry.getExpiry().isAfter(LocalDateTime.now())) {
                return entry.getValue();
            } else {
                cache.remove(key); // Evict expired
            }
        }
        return null;
    }

    public void clear(String key) {
        cache.remove(key);
    }

    public void clearUserCache(Long userId) {
        cache.keySet().removeIf(k -> k.startsWith("user_" + userId + "_"));
    }

    private static class CacheEntry {
        private final Object value;
        private final LocalDateTime expiry;

        public CacheEntry(Object value, LocalDateTime expiry) {
            this.value = value;
            this.expiry = expiry;
        }

        public Object getValue() { return value; }
        public LocalDateTime getExpiry() { return expiry; }
    }
}
