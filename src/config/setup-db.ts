import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
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

async function setupDatabase() {
  try {
    const password = await promptPassword();
    
    // Create connection without database
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: password
    });

    console.log('Connected to MySQL server');

    // Read SQL file
    const sqlPath = path.join(__dirname, 'setup.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split SQL file into individual statements
    const statements = sql
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);

    // Execute each statement
    for (const statement of statements) {
      try {
        await connection.query(statement + ';');
        console.log('Executed:', statement.substring(0, 50) + '...');
      } catch (error: any) {
        console.error('Error executing statement:', statement.substring(0, 50) + '...');
        console.error('Error details:', error.message);
      }
    }

    console.log('Database setup completed successfully');
    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('Failed to set up database:', error);
    rl.close();
    process.exit(1);
  }
}

setupDatabase(); 