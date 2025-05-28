import axios from 'axios';
import pool from '../config/database';
import { generateWebhookSecret } from '../utils/helpers';
import { WebhookSubscription } from '../types';

export class WebhookService {
  static async subscribe(agent_id: string, url: string): Promise<WebhookSubscription> {
    const webhook_id = generateWebhookSecret();
    const secret = generateWebhookSecret();

    const query = `
      INSERT INTO webhook_subscriptions (
        webhook_id, agent_id, url, secret
      ) VALUES (?, ?, ?, ?)
    `;

    await pool.execute(query, [webhook_id, agent_id, url, secret]);

    return {
      webhook_id,
      agent_id,
      url,
      status: 'active',
      secret,
      created_at: new Date(),
      updated_at: new Date()
    };
  }

  static async getSubscriptions(agent_id: string): Promise<WebhookSubscription[]> {
    const query = 'SELECT * FROM webhook_subscriptions WHERE agent_id = ? AND status = ?';
    const [rows] = await pool.execute<any[]>(query, [agent_id, 'active']);
    return rows as WebhookSubscription[];
  }

  static async notify(subscription: WebhookSubscription, event: string, data: any): Promise<void> {
    try {
      const payload = {
        webhook_id: subscription.webhook_id,
        event,
        data,
        timestamp: new Date().toISOString()
      };

      const headers = {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': this.generateSignature(payload, subscription.secret)
      };

      await axios.post(subscription.url, payload, { headers });
    } catch (error) {
      console.error(`Failed to send webhook notification: ${error}`);
      // If the webhook fails multiple times, we might want to deactivate it
      await this.handleWebhookFailure(subscription.webhook_id);
    }
  }

  private static generateSignature(payload: any, secret: string): string {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
  }

  private static async handleWebhookFailure(webhook_id: string): Promise<void> {
    const query = `
      UPDATE webhook_subscriptions 
      SET status = ?, updated_at = NOW()
      WHERE webhook_id = ? AND failure_count >= 3
    `;
    await pool.execute(query, ['inactive', webhook_id]);
  }

  static async notifyAll(agent_id: string, event: string, data: any): Promise<void> {
    const subscriptions = await this.getSubscriptions(agent_id);
    await Promise.all(
      subscriptions.map(subscription => this.notify(subscription, event, data))
    );
  }
} 