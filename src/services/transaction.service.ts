import { Transaction, AgentPerformance } from '../types';
import pool from '../config/database';
import redis from '../config/redis';
import {
  generateId,
  calculateCommission,
  validateMarkup,
  detectAnomaly
} from '../utils/helpers';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

interface TransactionRow extends RowDataPacket {
  transaction_id: string;
  agent_id: string;
  amount: number;
  transaction_type: 'cashout' | 'deposit';
  status: 'success' | 'failure';
  standard_commission: number;
  agent_markup: number;
  customer_phone?: string;
  notes?: string;
  created_at: Date;
}

interface PerformanceRow extends RowDataPacket {
  total_transactions: number;
  successful_transactions: number;
  failed_transactions: number;
  total_amount: number;
  total_commission: number;
  total_markup: number;
  average_transaction_amount: number;
}

export class TransactionService {
  private static CACHE_TTL = 300; // 5 minutes

  static async createTransaction(data: Omit<Transaction, 'transaction_id' | 'created_at'>): Promise<Transaction> {
    const transaction_id = generateId();
    
    // Validate markup
    if (!validateMarkup(data.agent_markup, data.amount)) {
      throw new Error('Invalid markup amount. Markup cannot exceed 5% of transaction amount.');
    }

    const query = `
      INSERT INTO transactions (
        transaction_id, agent_id, amount, transaction_type,
        status, standard_commission, agent_markup,
        customer_phone, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      transaction_id,
      data.agent_id,
      data.amount,
      data.transaction_type,
      data.status,
      data.standard_commission,
      data.agent_markup,
      data.customer_phone || null,
      data.notes || null
    ];

    const [result] = await pool.execute<ResultSetHeader>(query, values);
    
    if (result.affectedRows !== 1) {
      throw new Error('Failed to create transaction');
    }
    
    // Invalidate cache
    await redis.del(`agent:${data.agent_id}:performance`);
    
    return {
      ...data,
      transaction_id,
      created_at: new Date()
    };
  }

  static async getAgentTransactions(
    agent_id: string,
    startDate?: string,
    endDate?: string
  ): Promise<Transaction[]> {
    const cacheKey = `agent:${agent_id}:transactions:${startDate || 'all'}:${endDate || 'all'}`;
    
    // Try to get from cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    let query = 'SELECT * FROM transactions WHERE agent_id = ?';
    const values: any[] = [agent_id];

    if (startDate && endDate) {
      query += ' AND created_at BETWEEN ? AND ?';
      values.push(startDate, endDate);
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await pool.execute<TransactionRow[]>(query, values);
    
    // Convert dates to ISO strings for consistent serialization
    const transactions = rows.map(row => ({
      ...row,
      created_at: row.created_at.toISOString()
    }));
    
    // Cache the results
    await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(transactions));
    
    return transactions;
  }

  static async getAgentPerformanceMetrics(agent_id: string): Promise<AgentPerformance> {
    const cacheKey = `agent:${agent_id}:performance`;
    
    // Try to get from cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const query = `
      SELECT 
        COUNT(*) as total_transactions,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful_transactions,
        SUM(CASE WHEN status = 'failure' THEN 1 ELSE 0 END) as failed_transactions,
        SUM(amount) as total_amount,
        SUM(standard_commission) as total_commission,
        SUM(agent_markup) as total_markup,
        AVG(amount) as average_transaction_amount
      FROM transactions 
      WHERE agent_id = ?
    `;

    const [rows] = await pool.execute<PerformanceRow[]>(query, [agent_id]);
    const metrics = rows[0];
    
    if (!metrics) {
      return {
        total_transactions: 0,
        successful_transactions: 0,
        failed_transactions: 0,
        total_amount: 0,
        total_commission: 0,
        total_markup: 0,
        success_rate: 0,
        average_transaction_amount: 0,
        daily_trends: []
      };
    }
    
    // Calculate success rate
    const performance: AgentPerformance = {
      total_transactions: metrics.total_transactions || 0,
      successful_transactions: metrics.successful_transactions || 0,
      failed_transactions: metrics.failed_transactions || 0,
      total_amount: metrics.total_amount || 0,
      total_commission: metrics.total_commission || 0,
      total_markup: metrics.total_markup || 0,
      success_rate: 0,
      average_transaction_amount: metrics.average_transaction_amount || 0,
      daily_trends: []
    };

    performance.success_rate = performance.total_transactions > 0 
      ? (performance.successful_transactions / performance.total_transactions) * 100 
      : 0;
    
    // Cache the results
    await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(performance));
    
    return performance;
  }

  static async detectSuspiciousActivity(agent_id: string): Promise<boolean> {
    // Get recent transactions (last 7 days)
    const query = `
      SELECT COUNT(*) as count, SUM(amount) as total_amount
      FROM transactions
      WHERE agent_id = ?
      AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
    `;

    const [rows] = await pool.execute<RowDataPacket[]>(query, [agent_id]);
    const dailyStats = rows as { count: number; total_amount: number }[];

    if (dailyStats.length < 2) return false;

    // Calculate averages
    const avgCount = dailyStats.reduce((sum, day) => sum + day.count, 0) / dailyStats.length;
    const avgAmount = dailyStats.reduce((sum, day) => sum + day.total_amount, 0) / dailyStats.length;

    // Check last day's stats
    const lastDay = dailyStats[dailyStats.length - 1];
    
    return detectAnomaly(lastDay.count, avgCount) || detectAnomaly(lastDay.total_amount, avgAmount);
  }

  static async getTransactionById(transactionId: string, agentId: string) {
    const [rows] = await pool.execute(`
      SELECT * FROM transactions
      WHERE transaction_id = ? AND agent_id = ?
    `, [transactionId, agentId]);

    if (!Array.isArray(rows) || rows.length === 0) {
      return null;
    }

    return rows[0];
  }
} 