import { Request, Response } from 'express';
import { AdminService } from '../services/admin.service';
import pool from '../config/database';
import redis from '../config/redis';
import { RegionPerformance } from '../types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface RegionRow extends RowDataPacket {
  region_id: string;
  region_name: string;
  total_transactions: number;
  total_amount: number;
  total_commission: number;
  total_markup: number;
  average_markup_per_agent: number;
  success_rate: number;
}

interface SuspiciousActivity extends RowDataPacket {
  agent_id: string;
  agent_name: string;
  issue: string;
  details: string;
}

interface AgentRow extends RowDataPacket {
    agent_id: string;
    name: string;
    email: string;
    region_id: string;
    status: 'active' | 'inactive' | 'suspended';
    created_at: Date;
}

interface TransactionStats extends RowDataPacket {
    total_transactions: number;
    successful_transactions: number;
    total_amount: number;
    total_commission: number;
    total_markup: number;
}

interface AgentStats extends RowDataPacket {
    status: string;
    count: number;
}

interface RegionStats extends RowDataPacket {
    region_name: string;
    agent_count: number;
    transaction_count: number;
    total_amount: number;
}

interface PerformanceStats extends RowDataPacket {
    date: Date;
    total_transactions: number;
    successful_transactions: number;
    total_amount: number;
    total_commission: number;
    total_markup: number;
    transaction_type: string;
    status: string;
}

export class AdminController {
  static async getTopAgents(req: Request, res: Response) {
    try {
      const [rows] = await pool.execute<RegionRow[]>(`
        SELECT 
          a.agent_id,
          a.name as agent_name,
          COUNT(*) as total_transactions,
          SUM(t.amount) as total_amount,
          SUM(t.standard_commission + t.agent_markup) as total_commission
        FROM agents a
        LEFT JOIN transactions t ON t.agent_id = a.agent_id
        WHERE t.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY a.agent_id, a.name
        ORDER BY total_amount DESC
        LIMIT 10
      `);

      res.json({
        status: 'success',
        data: rows
      });
    } catch (error) {
      console.error('Error getting top agents:', error);
      res.status(500).json({ 
        status: 'error',
        message: 'Failed to get top agents'
      });
    }
  }

  static async getRegionPerformance(req: Request, res: Response) {
    try {
      const [rows] = await pool.execute<RegionRow[]>(`
        SELECT 
          r.region_id,
          r.name as region_name,
          COUNT(t.transaction_id) as total_transactions,
          COALESCE(SUM(t.amount), 0) as total_amount,
          COALESCE(SUM(t.standard_commission + t.agent_markup), 0) as total_commission,
          COALESCE(SUM(t.agent_markup), 0) as total_markup,
          COALESCE(AVG(t.agent_markup), 0) as average_markup_per_agent,
          COALESCE((COUNT(CASE WHEN t.status = 'success' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)), 0) as success_rate
        FROM regions r
        LEFT JOIN agents a ON a.region_id = r.region_id
        LEFT JOIN transactions t ON t.agent_id = a.agent_id AND t.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY r.region_id, r.name
        ORDER BY total_amount DESC
      `);

      if (!Array.isArray(rows)) {
        throw new Error('Invalid database response');
      }

      const regionsWithSuspicious = await Promise.all(rows.map(async (region) => {
        const [suspicious] = await pool.execute<SuspiciousActivity[]>(`
          SELECT 
            a.agent_id,
            a.name as agent_name,
            'High transaction volume' as issue,
            JSON_OBJECT(
              'transactions', COUNT(*),
              'amount', COALESCE(SUM(t.amount), 0)
            ) as details
          FROM agents a
          LEFT JOIN transactions t ON t.agent_id = a.agent_id
          WHERE a.region_id = ?
          AND t.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
          GROUP BY a.agent_id, a.name
          HAVING COUNT(*) > 100 OR SUM(t.amount) > 1000000
        `, [region.region_id]);

        return {
          ...region,
          suspicious_activities: Array.isArray(suspicious) ? suspicious : []
        };
      }));

      res.json({
        status: 'success',
        data: regionsWithSuspicious
      });
    } catch (error) {
      console.error('Error getting region performance:', error);
      res.status(500).json({ 
        status: 'error',
        message: 'Failed to get region performance'
      });
    }
  }

  static async getSuspiciousActivities(req: Request, res: Response) {
    try {
      const { region_id } = req.query;
      const activities = await AdminService.getSuspiciousActivities(region_id as string);

      return res.status(200).json({
        status: 'success',
        data: activities
      });
    } catch (error: any) {
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Internal server error'
      });
    }
  }

  static async getAllAgents(req: Request, res: Response) {
    try {
      const [rows] = await pool.query<AgentRow[]>(
        'SELECT agent_id, name, email, region_id, status, created_at FROM agents'
      );

      res.status(200).json({
        status: 'success',
        data: rows
      });
    } catch (error) {
      console.error('Error getting agents:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve agents'
      });
    }
  }

  static async getAgentDetails(req: Request, res: Response) {
    try {
      const { agentId } = req.params;

      const [rows] = await pool.query<AgentRow[]>(
        'SELECT agent_id, name, email, region_id, status, created_at FROM agents WHERE agent_id = ?',
        [agentId]
      );

      if (rows.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Agent not found'
        });
      }

      res.status(200).json({
        status: 'success',
        data: rows[0]
      });
    } catch (error) {
      console.error('Error getting agent details:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve agent details'
      });
    }
  }

  static async updateAgentStatus(req: Request, res: Response) {
    try {
      const { agentId } = req.params;
      const { status } = req.body;

      if (!['active', 'inactive', 'suspended'].includes(status)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid status value'
        });
      }

      const [result] = await pool.execute<ResultSetHeader>(
        'UPDATE agents SET status = ? WHERE agent_id = ?',
        [status, agentId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Agent not found'
        });
      }

      res.status(200).json({
        status: 'success',
        message: 'Agent status updated successfully'
      });
    } catch (error) {
      console.error('Error updating agent status:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update agent status'
      });
    }
  }

  static async getSystemOverview(req: Request, res: Response) {
    try {
      // Get total transactions and amounts
      const [transactionStats] = await pool.query<TransactionStats[]>(`
        SELECT 
          COUNT(*) as total_transactions,
          SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful_transactions,
          SUM(amount) as total_amount,
          SUM(standard_commission) as total_commission,
          SUM(agent_markup) as total_markup
        FROM transactions
      `);

      // Get agent counts by status
      const [agentStats] = await pool.query<AgentStats[]>(`
        SELECT 
          status,
          COUNT(*) as count
        FROM agents
        GROUP BY status
      `);

      // Get region stats
      const [regionStats] = await pool.query<RegionStats[]>(`
        SELECT 
          r.name as region_name,
          COUNT(DISTINCT a.agent_id) as agent_count,
          COUNT(t.transaction_id) as transaction_count,
          SUM(t.amount) as total_amount
        FROM regions r
        LEFT JOIN agents a ON r.region_id = a.region_id
        LEFT JOIN transactions t ON a.agent_id = t.agent_id
        GROUP BY r.region_id
      `);

      res.status(200).json({
        status: 'success',
        data: {
          transactions: transactionStats[0] || {
            total_transactions: 0,
            successful_transactions: 0,
            total_amount: 0,
            total_commission: 0,
            total_markup: 0
          },
          agents: agentStats,
          regions: regionStats
        }
      });
    } catch (error) {
      console.error('Error getting system overview:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve system overview'
      });
    }
  }

  static async getAgentPerformance(req: Request, res: Response) {
    try {
      const { agentId } = req.params;
      const { startDate, endDate } = req.query;

      let dateFilter = '';
      const params: any[] = [agentId];

      if (startDate && endDate) {
        dateFilter = 'AND DATE(created_at) BETWEEN ? AND ?';
        params.push(startDate as string, endDate as string);
      }

      const [performance] = await pool.query<PerformanceStats[]>(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as total_transactions,
          SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful_transactions,
          SUM(amount) as total_amount,
          SUM(standard_commission) as total_commission,
          SUM(agent_markup) as total_markup,
          transaction_type,
          status
        FROM transactions
        WHERE agent_id = ? ${dateFilter}
        GROUP BY DATE(created_at), transaction_type, status
        ORDER BY date DESC
      `, params);

      res.status(200).json({
        status: 'success',
        data: performance
      });
    } catch (error) {
      console.error('Error getting agent performance:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve agent performance'
      });
    }
  }

  static async getRegionPerformanceStats(req: Request, res: Response) {
    try {
      const { regionId } = req.params;
      const { startDate, endDate } = req.query;

      let dateFilter = '';
      const params: any[] = [regionId];

      if (startDate && endDate) {
        dateFilter = 'AND DATE(t.created_at) BETWEEN ? AND ?';
        params.push(startDate as string, endDate as string);
      }

      const [performance] = await pool.query<PerformanceStats[]>(`
        SELECT 
          DATE(t.created_at) as date,
          COUNT(DISTINCT a.agent_id) as active_agents,
          COUNT(t.transaction_id) as total_transactions,
          SUM(CASE WHEN t.status = 'success' THEN 1 ELSE 0 END) as successful_transactions,
          SUM(t.amount) as total_amount,
          SUM(t.standard_commission) as total_commission,
          SUM(t.agent_markup) as total_markup
        FROM regions r
        LEFT JOIN agents a ON r.region_id = a.region_id
        LEFT JOIN transactions t ON a.agent_id = t.agent_id
        WHERE r.region_id = ? ${dateFilter}
        GROUP BY DATE(t.created_at)
        ORDER BY date DESC
      `, params);

      res.status(200).json({
        status: 'success',
        data: performance
      });
    } catch (error) {
      console.error('Error getting region performance:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve region performance'
      });
    }
  }
} 