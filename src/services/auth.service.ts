import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import pool from '../config/database';
import { Secret, SignOptions } from 'jsonwebtoken';

interface User {
  id: string;
  role: 'agent' | 'admin';
  email: string;
}

export class AuthService {
  private static JWT_SECRET: Secret = process.env.JWT_SECRET || 'your-secret-key';
  private static JWT_EXPIRES_IN = '24h';

  static async validateUser(id: string): Promise<User | null> {
    // First try to find an agent
    const [agentRows] = await pool.execute<any[]>(
      'SELECT agent_id as id, email FROM agents WHERE agent_id = ? AND status = ?',
      [id, 'active']
    );

    if (agentRows.length > 0) {
      return {
        ...agentRows[0],
        role: 'agent'
      };
    }

    // If not an agent, try to find an admin
    const [adminRows] = await pool.execute<any[]>(
      'SELECT admin_id as id, email FROM admins WHERE admin_id = ? AND status = ?',
      [id, 'active']
    );

    if (adminRows.length > 0) {
      return {
        ...adminRows[0],
        role: 'admin'
      };
    }

    return null;
  }

  static async login(email: string, password: string): Promise<{ token: string; user: User } | null> {
    // First try to find an agent
    const [agentRows] = await pool.execute<any[]>(
      'SELECT agent_id, password FROM agents WHERE email = ? AND status = ?',
      [email, 'active']
    );

    let user: User | null = null;

    if (agentRows.length > 0) {
      const isValid = await bcrypt.compare(password, agentRows[0].password);
      if (isValid) {
        user = {
          id: agentRows[0].agent_id,
          email,
          role: 'agent'
        };
      }
    } else {
      // If not an agent, try to find an admin
      const [adminRows] = await pool.execute<any[]>(
        'SELECT admin_id, password FROM admins WHERE email = ? AND status = ?',
        [email, 'active']
      );

      if (adminRows.length > 0) {
        const isValid = await bcrypt.compare(password, adminRows[0].password);
        if (isValid) {
          user = {
            id: adminRows[0].admin_id,
            email,
            role: 'admin'
          };
        }
      }
    }

    if (!user) {
      return null;
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      this.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return { token, user };
  }

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }
} 