import bcrypt from 'bcryptjs';
import pool from '../config/database';
import { v4 as uuidv4 } from 'uuid';

async function setupTestData() {
    try {
        // Start transaction
        await pool.query('START TRANSACTION');

        // Delete existing test data
        await pool.query('DELETE FROM transactions WHERE agent_id IN (SELECT agent_id FROM agents WHERE email = ?)', ['testagent@example.com']);
        await pool.query('DELETE FROM agents WHERE email = ?', ['testagent@example.com']);
        await pool.query('DELETE FROM admins WHERE email = ?', ['testadmin@example.com']);

        // Create test region
        const regionId = uuidv4();
        await pool.query(`
            INSERT INTO regions (region_id, name)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE name = VALUES(name)
        `, [regionId, 'Lagos']);

        // Create test agent
        const agentId = uuidv4();
        const agentPassword = await bcrypt.hash('testAgent123', 10);
        await pool.query(`
            INSERT INTO agents (agent_id, name, region_id, email, password)
            VALUES (?, ?, ?, ?, ?)
        `, [agentId, 'Test Agent', regionId, 'testagent@example.com', agentPassword]);

        // Create test admin
        const adminId = uuidv4();
        const adminPassword = await bcrypt.hash('testAdmin123', 10);
        await pool.query(`
            INSERT INTO admins (admin_id, name, email, password, role)
            VALUES (?, ?, ?, ?, ?)
        `, [adminId, 'Test Admin', 'testadmin@example.com', adminPassword, 'admin']);

        // Create sample transactions
        const transactionTypes = ['cashout', 'deposit'];
        const statuses = ['success', 'failure'];
        
        for (let i = 0; i < 5; i++) {
            const amount = Math.floor(Math.random() * 10000) + 1000;
            const standardCommission = amount * 0.01; // 1% commission
            const agentMarkup = Math.floor(Math.random() * 100);
            
            await pool.query(`
                INSERT INTO transactions 
                (transaction_id, agent_id, amount, transaction_type, status, standard_commission, agent_markup, customer_phone)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                uuidv4(),
                agentId,
                amount,
                transactionTypes[Math.floor(Math.random() * 2)],
                statuses[Math.floor(Math.random() * 2)],
                standardCommission,
                agentMarkup,
                '+234' + Math.floor(Math.random() * 1000000000)
            ]);
        }

        // Commit transaction
        await pool.query('COMMIT');

        console.log('Test data setup completed successfully!');
        console.log('Test Agent Credentials:');
        console.log('Email: testagent@example.com');
        console.log('Password: testAgent123');
        console.log('\nTest Admin Credentials:');
        console.log('Email: testadmin@example.com');
        console.log('Password: testAdmin123');

    } catch (error) {
        // Rollback on error
        await pool.query('ROLLBACK');
        console.error('Error setting up test data:', error);
    } finally {
        await pool.end();
    }
}

setupTestData(); 