-- Drop existing webhook_subscriptions table if it exists
DROP TABLE IF EXISTS webhook_subscriptions;

-- Create webhook_subscriptions table with updated schema
CREATE TABLE webhook_subscriptions (
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