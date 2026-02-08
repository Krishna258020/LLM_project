-- Database initialization script for Multi-Agent Debate System
-- This is optional - the backend creates tables automatically on startup

-- Create database (if not exists)
CREATE DATABASE IF NOT EXISTS debate_database;
USE debate_database;

-- Debates table
CREATE TABLE IF NOT EXISTS debates (
    id VARCHAR(36) PRIMARY KEY,
    prompt TEXT NOT NULL,
    result TEXT NOT NULL,
    steps JSON NOT NULL,
    timestamp DATETIME NOT NULL,
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Status checks table
CREATE TABLE IF NOT EXISTS status_checks (
    id VARCHAR(36) PRIMARY KEY,
    client_name VARCHAR(255) NOT NULL,
    timestamp DATETIME NOT NULL,
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verify tables
SHOW TABLES;

-- Show table structures
DESCRIBE debates;
DESCRIBE status_checks;
