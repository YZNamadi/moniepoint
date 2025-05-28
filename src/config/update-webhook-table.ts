import * as mysql from 'mysql2/promise';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function promptPassword(): Promise<string> {
  return new Promise((resolve) => {
    rl.question('Enter MySQL root password: ', (password) => {
      resolve(password);
    });
  });
}

async function updateWebhookTable() {
  try {
    const password = await promptPassword();
    
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: password,
      database: 'moniepoint'
    });

    console.log('Connected to MySQL server');

    // Drop existing table
    await connection.execute('DROP TABLE IF EXISTS webhook_subscriptions');
    console.log('Dropped existing webhook_subscriptions table');

    // Create new table with updated schema
    await connection.execute(`
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
      )
    `);
    console.log('Created new webhook_subscriptions table with updated schema');

    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('Failed to update webhook table:', error);
    rl.close();
    process.exit(1);
  }
}

updateWebhookTable(); 