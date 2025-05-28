-- Insert test region
INSERT INTO regions (region_id, name) 
VALUES ('reg_001', 'Test Region');

-- Insert test admin (password: admin123)
INSERT INTO admins (admin_id, name, email, password, role) 
VALUES (
    'adm_001', 
    'Test Admin', 
    'admin@example.com',
    '$2a$10$rQPz0LJ7TYnTqI7W9VQYXOgwwCm76QXzHnFxvtKtFu7q3qQEL3vMi',
    'admin'
);

-- Insert test agent (password: agent123)
INSERT INTO agents (agent_id, name, region_id, email, password) 
VALUES (
    'agt_001', 
    'Test Agent', 
    'reg_001',
    'agent@example.com',
    '$2a$10$rQPz0LJ7TYnTqI7W9VQYXOgwwCm76QXzHnFxvtKtFu7q3qQEL3vMi'
); 