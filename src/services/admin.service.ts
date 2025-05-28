import pool from '../config/database';
import redis from '../config/redis';
import { RegionPerformance } from '../types';
import { detectAnomaly } from '../utils/helpers';
import { RowDataPacket } from 'mysql2';

interface TopAgent extends RowDataPacket {
  agent_id: string;
  name: string;
  region_id: string;
  total_transactions: number;
  total_amount: number;
  total_earnings: number;
}

interface SuspiciousActivity extends RowDataPacket {
  agent_id: string;
  agent_name: string;
  daily_transactions: number;
  daily_amount: number;
  transaction_date: string;
}

interface RegionMetrics extends RowDataPacket {
  region_id: string;
  region_name: string;
  total_transactions: number;
  total_amount: number;
  total_commission: number;
  total_markup: number;
  average_markup_per_agent: number;
  success_rate: number;
}

export class AdminService {
  private static CACHE_TTL = 300; // 5 minutes

  static async getTopAgents(limit: number, region_id?: string): Promise<TopAgent[]> {
    const cacheKey = `top_agents:${region_id || 'all'}:${limit}`;
    
    // Try to get from cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    let query = `
      SELECT 
        a.agent_id,
        a.name,
        a.region_id,
        COUNT(t.transaction_id) as total_transactions,
        SUM(t.amount) as total_amount,
        SUM(t.standard_commission + t.agent_markup) as total_earnings
      FROM agents a
      LEFT JOIN transactions t ON a.agent_id = t.agent_id
    `;

    const values: any[] = [];
    if (region_id) {
      query += ' WHERE a.region_id = ?';
      values.push(region_id);
    }

    query += `
      GROUP BY a.agent_id
      ORDER BY total_earnings DESC
      LIMIT ?
    `;
    values.push(limit);

    const [rows] = await pool.execute<TopAgent[]>(query, values);
    
    // Cache the results
    await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(rows));
    
    return rows;
  }

  static async getRegionPerformance(
    region_id: string,
    startDate?: string,
    endDate?: string
  ): Promise<RegionPerformance> {
    const cacheKey = `region:${region_id}:performance:${startDate || 'all'}:${endDate || 'all'}`;
    
    // Try to get from cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    let query = `
      SELECT 
        r.region_id,
        r.name as region_name,
        COUNT(t.transaction_id) as total_transactions,
        SUM(t.amount) as total_amount,
        SUM(t.standard_commission) as total_commission,
        SUM(t.agent_markup) as total_markup,
        AVG(t.agent_markup) as average_markup_per_agent,
        SUM(CASE WHEN t.status = 'success' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as success_rate
      FROM regions r
      LEFT JOIN agents a ON r.region_id = a.region_id
      LEFT JOIN transactions t ON a.agent_id = t.agent_id
      WHERE r.region_id = ?
    `;

    const values: any[] = [region_id];

    if (startDate && endDate) {
      query += ' AND t.created_at BETWEEN ? AND ?';
      values.push(startDate, endDate);
    }

    query += ' GROUP BY r.region_id';

    const [rows] = await pool.execute<RegionMetrics[]>(query, values);
    const metrics = rows[0] || {};

    // Get suspicious activities
    const suspiciousActivities = await this.getSuspiciousActivities(region_id);

    const performance: RegionPerformance = {
      region_id: metrics.region_id || region_id,
      region_name: metrics.region_name || '',
      total_transactions: metrics.total_transactions || 0,
      total_amount: metrics.total_amount || 0,
      total_commission: metrics.total_commission || 0,
      total_markup: metrics.total_markup || 0,
      average_markup_per_agent: metrics.average_markup_per_agent || 0,
      success_rate: metrics.success_rate || 0,
      suspicious_activities: suspiciousActivities
    };

    // Cache the results
    await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(performance));
    
    return performance;
  }

  static async getSuspiciousActivities(region_id?: string): Promise<any[]> {
    const query = `
      SELECT 
        a.agent_id,
        a.name as agent_name,
        COUNT(t.transaction_id) as daily_transactions,
        SUM(t.amount) as daily_amount,
        DATE(t.created_at) as transaction_date
      FROM agents a
      LEFT JOIN transactions t ON a.agent_id = t.agent_id
      WHERE t.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      ${region_id ? 'AND a.region_id = ?' : ''}
      GROUP BY a.agent_id, DATE(t.created_at)
      ORDER BY a.agent_id, transaction_date
    `;

    const values = region_id ? [region_id] : [];
    const [rows] = await pool.execute<SuspiciousActivity[]>(query, values);

    // Group by agent
    const agentStats = new Map<string, SuspiciousActivity[]>();
    for (const row of rows) {
      if (!agentStats.has(row.agent_id)) {
        agentStats.set(row.agent_id, []);
      }
      agentStats.get(row.agent_id)?.push(row);
    }

    const suspiciousActivities = [];

    // Analyze each agent's patterns
    for (const [agent_id, stats] of agentStats) {
      if (stats.length < 2) continue;

      const avgTransactions = stats.reduce((sum, day) => sum + day.daily_transactions, 0) / stats.length;
      const avgAmount = stats.reduce((sum, day) => sum + day.daily_amount, 0) / stats.length;

      // Check last day's activity
      const lastDay = stats[stats.length - 1];
      const isTransactionAnomaly = detectAnomaly(lastDay.daily_transactions, avgTransactions);
      const isAmountAnomaly = detectAnomaly(lastDay.daily_amount, avgAmount);

      if (isTransactionAnomaly || isAmountAnomaly) {
        suspiciousActivities.push({
          agent_id: lastDay.agent_id,
          agent_name: lastDay.agent_name,
          issue: isTransactionAnomaly ? 'Unusual transaction volume' : 'Unusual transaction amount',
          details: {
            date: lastDay.transaction_date,
            current: {
              transactions: lastDay.daily_transactions,
              amount: lastDay.daily_amount
            },
            average: {
              transactions: avgTransactions,
              amount: avgAmount
            }
          }
        });
      }
    }

    return suspiciousActivities;
  }
} 