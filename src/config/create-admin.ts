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

async function createAdmin() {
  try {
    const password = await promptPassword();
    
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: password,
      database: 'moniepoint'
    });

    console.log('Connected to MySQL server');

    // Hash the admin password
    const adminPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const adminId = uuidv4();

    // Delete existing admin if exists
    await connection.execute('DELETE FROM admins WHERE email = ?', ['admin@example.com']);

    // Insert new admin
    await connection.execute(
      'INSERT INTO admins (admin_id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
      [adminId, 'Test Admin', 'admin@example.com', hashedPassword, 'admin']
    );

    console.log('Admin user created successfully');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
    
    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('Failed to create admin:', error);
    rl.close();
    process.exit(1);
  }
}

createAdmin(); 