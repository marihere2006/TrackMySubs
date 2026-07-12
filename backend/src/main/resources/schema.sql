CREATE DATABASE IF NOT EXISTS `trackmysubs_db`;
USE `trackmysubs_db`;

-- Drop tables if they exist (for schema reference)
-- DROP TABLE IF EXISTS `subscription_history`;
-- DROP TABLE IF EXISTS `subscriptions`;
-- DROP TABLE IF EXISTS `users`;

CREATE TABLE IF NOT EXISTS `users` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) UNIQUE NOT NULL,
    `password` VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `subscriptions` (
    `id` VARCHAR(255) PRIMARY KEY,
    `service_name` VARCHAR(255) NOT NULL,
    `category` VARCHAR(255) DEFAULT NULL,
    `plan_name` VARCHAR(255) DEFAULT NULL,
    `billing_cycle` VARCHAR(50) DEFAULT NULL,
    `payment_method` VARCHAR(50) NOT NULL DEFAULT 'Other',
    `auto_renewal` BOOLEAN NOT NULL DEFAULT FALSE,
    `reminder_days` INT NOT NULL DEFAULT 7,
    `renewal_count` INT NOT NULL DEFAULT 0,
    `usage_frequency` VARCHAR(50) NOT NULL DEFAULT 'Monthly',
    `cost` DECIMAL(10, 2) NOT NULL,
    `start_date` DATE NOT NULL,
    `expiry_date` DATE NOT NULL,
    `status` VARCHAR(50) NOT NULL,
    `website` VARCHAR(512) DEFAULT NULL,
    `notes` TEXT DEFAULT NULL,
    `user_id` BIGINT NOT NULL,
    CONSTRAINT `fk_subscriptions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `subscription_history` (
    `id` VARCHAR(255) PRIMARY KEY,
    `subscription_id` VARCHAR(255) NOT NULL,
    `service_name` VARCHAR(255) NOT NULL,
    `category` VARCHAR(255) DEFAULT NULL,
    `plan_name` VARCHAR(255) DEFAULT NULL,
    `billing_cycle` VARCHAR(50) DEFAULT NULL,
    `payment_method` VARCHAR(50) NOT NULL DEFAULT 'Other',
    `auto_renewal` BOOLEAN NOT NULL DEFAULT FALSE,
    `reminder_days` INT NOT NULL DEFAULT 7,
    `usage_frequency` VARCHAR(50) NOT NULL DEFAULT 'Monthly',
    `renewal_number` INT NOT NULL DEFAULT 0,
    `cost` DECIMAL(10, 2) NOT NULL,
    `start_date` DATE NOT NULL,
    `expiry_date` DATE NOT NULL,
    `renewed_on` DATE NOT NULL,
    `website` VARCHAR(512) DEFAULT NULL,
    `notes` TEXT DEFAULT NULL,
    `user_id` BIGINT NOT NULL,
    CONSTRAINT `fk_history_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Analytics Snapshots Table
-- Stores daily snapshots of spending data per user
-- Captured: daily at midnight + on significant subscription changes
-- ============================================================
CREATE TABLE IF NOT EXISTS `analytics_snapshots` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT NOT NULL,
    `snapshot_date` DATE NOT NULL,
    `total_monthly_spend` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `total_count` INT NOT NULL DEFAULT 0,
    `active_count` INT NOT NULL DEFAULT 0,
    `expired_count` INT NOT NULL DEFAULT 0,
    `expiring_soon_count` INT NOT NULL DEFAULT 0,
    `category_breakdown` JSON DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_user_snapshot_date` (`user_id`, `snapshot_date`),
    CONSTRAINT `fk_snapshot_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Merchant Knowledge Base Table
-- Stores known merchant → subscription mappings to reduce AI calls
-- If merchant is in this table, no AI call needed (confidence = 100)
-- ============================================================
CREATE TABLE IF NOT EXISTS `merchant_knowledge` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `normalized_name` VARCHAR(255) UNIQUE NOT NULL,
    `display_name` VARCHAR(255) NOT NULL,
    `category` VARCHAR(100) NOT NULL DEFAULT 'Other',
    `billing_cycle` VARCHAR(50) DEFAULT 'Monthly',
    `confidence` INT DEFAULT 100,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `last_used_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pre-populate common merchants (avoids AI calls for these)
INSERT IGNORE INTO `merchant_knowledge` (`normalized_name`, `display_name`, `category`, `billing_cycle`, `confidence`) VALUES
('netflix', 'Netflix', 'Streaming', 'Monthly', 100),
('spotify', 'Spotify', 'Music', 'Monthly', 100),
('amazon_prime', 'Amazon Prime', 'Shopping', 'Monthly', 100),
('youtube_premium', 'YouTube Premium', 'Streaming', 'Monthly', 100),
('hotstar', 'Disney+ Hotstar', 'Streaming', 'Monthly', 100),
('zee5', 'ZEE5', 'Streaming', 'Monthly', 100),
('sonyliv', 'SonyLIV', 'Streaming', 'Monthly', 100),
('apple_music', 'Apple Music', 'Music', 'Monthly', 100),
('google_one', 'Google One', 'Cloud Storage', 'Monthly', 100),
('microsoft_365', 'Microsoft 365', 'Productivity', 'Monthly', 100),
('notion', 'Notion', 'Productivity', 'Monthly', 100),
('chatgpt', 'ChatGPT Plus', 'AI Tools', 'Monthly', 100),
('adobe', 'Adobe Creative Cloud', 'Design & Creative', 'Monthly', 100),
('canva', 'Canva Pro', 'Design & Creative', 'Monthly', 100),
('dropbox', 'Dropbox', 'Cloud Storage', 'Monthly', 100),
('icloud', 'iCloud', 'Cloud Storage', 'Monthly', 100),
('jio_cinema', 'JioCinema', 'Streaming', 'Monthly', 100),
('prime_video', 'Prime Video', 'Streaming', 'Monthly', 100),
('github_copilot', 'GitHub Copilot', 'AI Tools', 'Monthly', 100),
('xbox_game_pass', 'Xbox Game Pass', 'Gaming', 'Monthly', 100);
