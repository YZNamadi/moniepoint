import { Request, Response } from 'express';
import { WebhookService } from '../services/webhook.service';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import crypto from 'crypto';

export class WebhookController {
  static async createSubscription(req: Request, res: Response) {
    try {
      const { url, events } = req.body;
      const agent_id = req.user?.id;

      if (!url || !events || !Array.isArray(events)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid webhook configuration. URL and events array are required.'
        });
      }

      // Validate URL format
      try {
        new URL(url);
      } catch (error) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid webhook URL'
        });
      }

      // Validate event types
      const validEvents = ['transaction.created', 'transaction.updated', 'transaction.failed'];
      const invalidEvents = events.filter(event => !validEvents.includes(event));
      if (invalidEvents.length > 0) {
        return res.status(400).json({
          status: 'error',
          message: `Invalid event types: ${invalidEvents.join(', ')}`
        });
      }

      // Generate webhook secret
      const secret = crypto.randomBytes(32).toString('hex');
      const webhook_id = uuidv4();

      await pool.execute(
        'INSERT INTO webhook_subscriptions (webhook_id, agent_id, url, secret) VALUES (?, ?, ?, ?)',
        [webhook_id, agent_id, url, secret]
      );

      return res.status(201).json({
        status: 'success',
        data: {
          webhook_id,
          url,
          events,
          secret
        }
      });
    } catch (error: any) {
      console.error('Error creating webhook subscription:', error);
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to create webhook subscription'
      });
    }
  }

  static async listSubscriptions(req: Request, res: Response) {
    try {
      const agent_id = req.user?.id;

      const [subscriptions] = await pool.execute(
        'SELECT webhook_id, url, status, created_at FROM webhook_subscriptions WHERE agent_id = ?',
        [agent_id]
      );

      return res.status(200).json({
        status: 'success',
        data: subscriptions
      });
    } catch (error: any) {
      console.error('Error listing webhook subscriptions:', error);
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to list webhook subscriptions'
      });
    }
  }

  static async updateSubscription(req: Request, res: Response) {
    try {
      const { webhook_id } = req.params;
      const { url, status } = req.body;
      const agent_id = req.user?.id;

      // Verify ownership
      const [existing] = await pool.execute(
        'SELECT * FROM webhook_subscriptions WHERE webhook_id = ? AND agent_id = ?',
        [webhook_id, agent_id]
      ) as any[];

      if (!existing.length) {
        return res.status(404).json({
          status: 'error',
          message: 'Webhook subscription not found'
        });
      }

      const updates: string[] = [];
      const values: any[] = [];

      if (url) {
        try {
          new URL(url);
          updates.push('url = ?');
          values.push(url);
        } catch (error) {
          return res.status(400).json({
            status: 'error',
            message: 'Invalid webhook URL'
          });
        }
      }

      if (status) {
        if (!['active', 'inactive'].includes(status)) {
          return res.status(400).json({
            status: 'error',
            message: 'Status must be either active or inactive'
          });
        }
        updates.push('status = ?');
        values.push(status);
      }

      if (updates.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'No valid fields to update'
        });
      }

      values.push(webhook_id, agent_id);
      await pool.execute(
        `UPDATE webhook_subscriptions SET ${updates.join(', ')} WHERE webhook_id = ? AND agent_id = ?`,
        values
      );

      return res.status(200).json({
        status: 'success',
        message: 'Webhook subscription updated successfully'
      });
    } catch (error: any) {
      console.error('Error updating webhook subscription:', error);
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to update webhook subscription'
      });
    }
  }

  static async deleteSubscription(req: Request, res: Response) {
    try {
      const { webhook_id } = req.params;
      const agent_id = req.user?.id;

      const [result] = await pool.execute(
        'DELETE FROM webhook_subscriptions WHERE webhook_id = ? AND agent_id = ?',
        [webhook_id, agent_id]
      ) as any[];

      if (result.affectedRows === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Webhook subscription not found'
        });
      }

      return res.status(200).json({
        status: 'success',
        message: 'Webhook subscription deleted successfully'
      });
    } catch (error: any) {
      console.error('Error deleting webhook subscription:', error);
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to delete webhook subscription'
      });
    }
  }
} 