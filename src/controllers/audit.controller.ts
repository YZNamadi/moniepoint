import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';

export class AuditController {
  static async createAuditLog(req: Request, res: Response) {
    try {
      const { action, details } = req.body;
      const agent_id = req.user?.id;

      if (!action) {
        return res.status(400).json({
          status: 'error',
          message: 'Action is required'
        });
      }

      const log_id = uuidv4();
      await pool.execute(
        'INSERT INTO audit_logs (log_id, agent_id, action, details) VALUES (?, ?, ?, ?)',
        [log_id, agent_id, action, JSON.stringify(details || {})]
      );

      return res.status(201).json({
        status: 'success',
        data: {
          log_id,
          agent_id,
          action,
          details,
          created_at: new Date().toISOString()
        }
      });
    } catch (error: any) {
      console.error('Error creating audit log:', error);
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to create audit log'
      });
    }
  }

  static async getAuditLogs(req: Request, res: Response) {
    try {
      const { start_date, end_date, action } = req.query;
      const agent_id = req.user?.id;
      const isAdmin = req.user?.role === 'admin' || req.user?.role === 'super_admin';

      // Build base query
      const baseConditions = [];
      const params: any[] = [];

      // Add agent filter for non-admins
      if (!isAdmin) {
        baseConditions.push('agent_id = ?');
        params.push(agent_id);
      }

      // Add date filters if provided
      if (start_date && end_date) {
        baseConditions.push('created_at BETWEEN ? AND ?');
        params.push(start_date, end_date);
      }

      // Add action filter if provided
      if (action) {
        baseConditions.push('action = ?');
        params.push(action);
      }

      // Construct WHERE clause
      const whereClause = baseConditions.length > 0 ? `WHERE ${baseConditions.join(' AND ')}` : '';

      // Add pagination
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      // Get paginated results
      const [logs] = await pool.execute(
        `SELECT * FROM audit_logs ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );

      // Get total count
      const [countResult] = await pool.execute(
        `SELECT COUNT(*) as total FROM audit_logs ${whereClause}`,
        params
      ) as any[];

      const total = countResult[0].total;

      return res.status(200).json({
        status: 'success',
        data: {
          logs,
          pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error: any) {
      console.error('Error retrieving audit logs:', error);
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to retrieve audit logs'
      });
    }
  }

  static async getAuditLogById(req: Request, res: Response) {
    try {
      const { log_id } = req.params;
      const agent_id = req.user?.id;
      const isAdmin = req.user?.role === 'admin' || req.user?.role === 'super_admin';

      let query = 'SELECT * FROM audit_logs WHERE log_id = ?';
      const params: any[] = [log_id];

      // If not admin, only allow viewing own logs
      if (!isAdmin) {
        query += ' AND agent_id = ?';
        params.push(agent_id);
      }

      const [logs] = await pool.execute(query, params);
      const log = (logs as any[])[0];

      if (!log) {
        return res.status(404).json({
          status: 'error',
          message: 'Audit log not found'
        });
      }

      return res.status(200).json({
        status: 'success',
        data: log
      });
    } catch (error: any) {
      console.error('Error retrieving audit log:', error);
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to retrieve audit log'
      });
    }
  }
} 