-- ========================================
-- Multi-Agent Debate System Database
-- ========================================

-- Drop tables if they exist (for clean reinstall)
DROP TABLE IF EXISTS templates;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS status_checks;
DROP TABLE IF EXISTS debates;

-- ========================================
-- Debates Table
-- ========================================
CREATE TABLE debates (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Status Checks Table
-- ========================================
CREATE TABLE status_checks (
    id VARCHAR(36) PRIMARY KEY,
    client_name VARCHAR(255) NOT NULL,
    timestamp DATETIME NOT NULL,
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Users Table
-- ========================================
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at DATETIME NOT NULL,
    last_login DATETIME DEFAULT NULL,
    INDEX idx_username (username),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Templates Table
-- ========================================
CREATE TABLE templates (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    prompt_template TEXT NOT NULL,
    category VARCHAR(100),
    is_public BOOLEAN DEFAULT TRUE,
    created_by VARCHAR(36),
    created_at DATETIME NOT NULL,
    usage_count INT DEFAULT 0,
    INDEX idx_category (category),
    INDEX idx_public (is_public)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Seed Default Templates
-- ========================================
INSERT INTO templates (id, name, description, prompt_template, category, is_public, created_at, usage_count) VALUES
(UUID(), 'Technical Analysis', 'Analyze technical concepts and provide detailed explanations', 'Explain the technical concept of [TOPIC] in detail, including its benefits, drawbacks, and real-world applications.', 'Technical', TRUE, NOW(), 0),
(UUID(), 'Problem Solving', 'Break down complex problems into manageable solutions', 'Help me solve this problem: [PROBLEM]. Provide a step-by-step approach with clear reasoning.', 'Problem Solving', TRUE, NOW(), 0),
(UUID(), 'Code Review', 'Review code for best practices and improvements', 'Review this code and suggest improvements: [CODE]. Focus on performance, readability, and best practices.', 'Technical', TRUE, NOW(), 0),
(UUID(), 'Business Strategy', 'Analyze business scenarios and provide strategic insights', 'Analyze this business scenario: [SCENARIO]. Provide strategic recommendations and potential outcomes.', 'Business', TRUE, NOW(), 0),
(UUID(), 'Learning Path', 'Create structured learning paths for any topic', 'Create a comprehensive learning path for [TOPIC]. Include resources, milestones, and estimated timeframes.', 'Education', TRUE, NOW(), 0),
(UUID(), 'Comparison Analysis', 'Compare and contrast different options or approaches', 'Compare [OPTION A] vs [OPTION B]. Analyze pros, cons, use cases, and provide a recommendation.', 'Analysis', TRUE, NOW(), 0);

-- ========================================
-- Verification Queries
-- ========================================
-- Run these to verify the setup:
-- SELECT COUNT(*) as debate_count FROM debates;
-- SELECT COUNT(*) as user_count FROM users;
-- SELECT COUNT(*) as template_count FROM templates;
-- SELECT name, category FROM templates;
