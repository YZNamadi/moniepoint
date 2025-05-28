-- Create the database
CREATE DATABASE IF NOT EXISTS moniepoint_agents;
USE moniepoint_agents;

-- Create regions table
CREATE TABLE IF NOT EXISTS regions (
    region_id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
    admin_id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'super_admin') NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create agents table
CREATE TABLE IF NOT EXISTS agents (
    agent_id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    region_id VARCHAR(36) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (region_id) REFERENCES regions(region_id)
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    transaction_id VARCHAR(36) PRIMARY KEY,
    agent_id VARCHAR(36) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    transaction_type ENUM('cashout', 'deposit') NOT NULL,
    status ENUM('success', 'failure') NOT NULL,
    standard_commission DECIMAL(10, 2) NOT NULL,
    agent_markup DECIMAL(10, 2) DEFAULT 0.00,
    customer_phone VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES agents(agent_id)
);

-- Create webhook_subscriptions table
CREATE TABLE IF NOT EXISTS webhook_subscriptions (
    webhook_id VARCHAR(36) PRIMARY KEY,
    agent_id VARCHAR(36) NOT NULL,
    url VARCHAR(255) NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    secret VARCHAR(255) NOT NULL,
    events JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES agents(agent_id)
);

-- Create performance_metrics table for caching/aggregating performance data
CREATE TABLE IF NOT EXISTS performance_metrics (
    metric_id VARCHAR(36) PRIMARY KEY,
    agent_id VARCHAR(36) NOT NULL,
    date DATE NOT NULL,
    total_transactions INT DEFAULT 0,
    successful_transactions INT DEFAULT 0,
    failed_transactions INT DEFAULT 0,
    total_amount DECIMAL(15, 2) DEFAULT 0.00,
    total_commission DECIMAL(10, 2) DEFAULT 0.00,
    total_markup DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES agents(agent_id),
    UNIQUE KEY unique_agent_date (agent_id, date)
);

-- Create audit_logs table for tracking important changes
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id VARCHAR(36) PRIMARY KEY,
    agent_id VARCHAR(36),
    action VARCHAR(100) NOT NULL,
    details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES agents(agent_id)
);

-- Indexes for better query performance
CREATE INDEX idx_transactions_date ON transactions(created_at);
CREATE INDEX idx_transactions_agent ON transactions(agent_id);
CREATE INDEX idx_performance_date ON performance_metrics(date);
CREATE INDEX idx_audit_date ON audit_logs(created_at); 