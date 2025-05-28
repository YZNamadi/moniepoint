import bcrypt from 'bcryptjs';

async function verifyPassword() {
  const password = 'admin123';
  const hashedPassword = '$2a$10$rQPz0LJ7TYnTqI7W9VQYXOgwwCm76QXzHnFxvtKtFu7q3qQEL3vMi';

  const isMatch = await bcrypt.compare(password, hashedPassword);
  console.log('Password:', password);
  console.log('Hashed Password:', hashedPassword);
  console.log('Is Match:', isMatch);

  // Generate a new hash for comparison
  const newHash = await bcrypt.hash(password, 10);
  console.log('New Hash:', newHash);
}

verifyPassword(); 