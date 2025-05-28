import mysql from 'mysql2/promise';
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

async function verifyDatabase() {
  try {
    const password = await promptPassword();
    
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: password,
      database: 'moniepoint'
    });

    console.log('Connected to MySQL server');

    // Check admins table
    const [admins]: any = await connection.query('SELECT * FROM admins');
    console.log('\nAdmins in database:', admins.length);
    console.log(admins);

    // Check agents table
    const [agents]: any = await connection.query('SELECT * FROM agents');
    console.log('\nAgents in database:', agents.length);
    console.log(agents);

    // Check regions table
    const [regions]: any = await connection.query('SELECT * FROM regions');
    console.log('\nRegions in database:', regions.length);
    console.log(regions);

    console.log('\nDatabase verification completed');
    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('Failed to verify database:', error);
    rl.close();
    process.exit(1);
  }
}

verifyDatabase(); 