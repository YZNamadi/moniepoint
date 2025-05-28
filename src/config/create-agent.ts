import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import readline from 'readline';

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

async function createAgent() {
  try {
    const password = await promptPassword();
    
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: password,
      database: 'moniepoint'
    });

    console.log('Connected to MySQL server');

    // Hash the agent password
    const agentPassword = 'agent123';
    const hashedPassword = await bcrypt.hash(agentPassword, 10);
    const agentId = uuidv4();

    // Delete existing agent if exists
    await connection.execute('DELETE FROM agents WHERE email = ?', ['agent@example.com']);

    // Insert new agent
    await connection.execute(
      'INSERT INTO agents (agent_id, name, region_id, email, password) VALUES (?, ?, ?, ?, ?)',
      [agentId, 'Test Agent', 'reg_001', 'agent@example.com', hashedPassword]
    );

    console.log('Agent user created successfully');
    console.log('Email: agent@example.com');
    console.log('Password: agent123');
    
    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('Failed to create agent:', error);
    rl.close();
    process.exit(1);
  }
}

createAgent(); 