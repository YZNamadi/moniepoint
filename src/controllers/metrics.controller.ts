import { Request, Response } from 'express';
import pool from '../config/database';
import { RowDataPacket } from 'mysql2';

interface MetricsRow extends RowDataPacket {
  total_transactions: number;
  successful_transactions: number;
  total_amount: number;
  commission_earned: number;
  success_rate: number;
  average_transaction_value: number;
}

export class MetricsController {
  static async getAgentMetrics(req: Request, res: Response) {
    try {
      const { agentId } = req.params;
      const { start_date, end_date } = req.query;

      let dateFilter = '';
      const params: any[] = [agentId];

      if (start_date && end_date) {
        dateFilter = 'AND DATE(created_at) BETWEEN ? AND ?';
        params.push(start_date as string, end_date as string);
      }

      const [rows] = await pool.execute<MetricsRow[]>(`
        SELECT 
          COUNT(*) as total_transactions,
          COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_transactions,
          COALESCE(SUM(amount), 0) as total_amount,
          COALESCE(SUM(standard_commission + agent_markup), 0) as commission_earned,
          (COUNT(CASE WHEN status = 'success' THEN 1 END) * 100.0 / COUNT(*)) as success_rate,
          (COALESCE(SUM(amount), 0) / NULLIF(COUNT(*), 0)) as average_transaction_value
        FROM transactions
        WHERE agent_id = ? ${dateFilter}
      `, params);

      const [transactionTypes] = await pool.execute(`
        SELECT 
          transaction_type,
          COUNT(*) as count
        FROM transactions
        WHERE agent_id = ? ${dateFilter}
        GROUP BY transaction_type
      `, params);

      res.json({
        status: 'success',
        data: {
          ...rows[0],
          transaction_by_type: transactionTypes
        }
      });
    } catch (error) {
      console.error('Error getting agent metrics:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get agent metrics'
      });
    }
  }

  static async getRegionMetrics(req: Request, res: Response) {
    try {
      const { regionId } = req.params;
      const { start_date, end_date } = req.query;

      let dateFilter = '';
      const params: any[] = [regionId];

      if (start_date && end_date) {
        dateFilter = 'AND DATE(t.created_at) BETWEEN ? AND ?';
        params.push(start_date as string, end_date as string);
      }

      const [metrics] = await pool.execute<MetricsRow[]>(`
        SELECT 
          COUNT(t.transaction_id) as total_transactions,
          COUNT(CASE WHEN t.status = 'success' THEN 1 END) as successful_transactions,
          COALESCE(SUM(t.amount), 0) as total_amount,
          COALESCE(SUM(t.standard_commission + t.agent_markup), 0) as commission_earned,
          (COUNT(CASE WHEN t.status = 'success' THEN 1 END) * 100.0 / COUNT(*)) as success_rate,
          (COALESCE(SUM(t.amount), 0) / NULLIF(COUNT(*), 0)) as average_transaction_value
        FROM regions r
        JOIN agents a ON a.region_id = r.region_id
        LEFT JOIN transactions t ON t.agent_id = a.agent_id
        WHERE r.region_id = ? ${dateFilter}
      `, params);

      const [agentCount] = await pool.execute<RowDataPacket[]>(`
        SELECT COUNT(*) as count
        FROM agents
        WHERE region_id = ?
      `, [regionId]);

      const [topAgents] = await pool.execute(`
        SELECT 
          a.agent_id,
          a.name,
          COUNT(t.transaction_id) as total_transactions,
          COALESCE(SUM(t.amount), 0) as total_amount
        FROM agents a
        LEFT JOIN transactions t ON t.agent_id = a.agent_id
        WHERE a.region_id = ? ${dateFilter}
        GROUP BY a.agent_id, a.name
        ORDER BY total_amount DESC
        LIMIT 5
      `, params);

      res.json({
        status: 'success',
        data: {
          metrics: metrics[0],
          agent_count: agentCount[0].count,
          top_agents: topAgents
        }
      });
    } catch (error) {
      console.error('Error getting region metrics:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get region metrics'
      });
    }
  }
}