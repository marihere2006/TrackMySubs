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
