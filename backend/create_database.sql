-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS debate_database;

-- Use the database
USE debate_database;

-- Create debates table
CREATE TABLE IF NOT EXISTS debates (
    id VARCHAR(36) PRIMARY KEY,
    prompt TEXT NOT NULL,
    result TEXT NOT NULL,
    steps JSON NOT NULL,
    timestamp DATETIME NOT NULL,
    tags JSON DEFAULT NULL,
    category VARCHAR(100) DEFAULT NULL,
    is_favorite BOOLEAN DEFAULT FALSE,
    duration_seconds INT DEFAULT NULL,
    INDEX idx_timestamp (timestamp),
    INDEX idx_category (category),
    INDEX idx_favorite (is_favorite)
);

-- Create status_checks table
CREATE TABLE IF NOT EXISTS status_checks (
    id VARCHAR(36) PRIMARY KEY,
    client_name VARCHAR(255) NOT NULL,
    timestamp DATETIME NOT NULL,
    INDEX idx_timestamp (timestamp)
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at DATETIME NOT NULL,
    last_login DATETIME DEFAULT NULL,
    INDEX idx_username (username),
    INDEX idx_email (email)
);

-- Create templates table
CREATE TABLE IF NOT EXISTS templates (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    prompt_template TEXT NOT NULL,
    category VARCHAR(100),
    created_at DATETIME NOT NULL,
    INDEX idx_category (category)
);
