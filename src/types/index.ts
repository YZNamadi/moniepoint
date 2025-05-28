import { Request } from 'express';

export type UserRole = 'admin' | 'super_admin' | 'agent';

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                role: UserRole;
            };
        }
    }
}

export interface JwtPayload {
    id: string;
    role: UserRole;
}

export interface Agent {
  agent_id: string;
  name: string;
  region_id: string;
  email: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at: Date | string;
  updated_at: Date | string;
}

export interface Region {
  region_id: string;
  name: string;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface Transaction {
  transaction_id: string;
  agent_id: string;
  amount: number;
  transaction_type: 'cashout' | 'deposit';
  status: 'success' | 'failure';
  standard_commission: number;
  agent_markup: number;
  customer_phone?: string;
  notes?: string;
  created_at: Date | string;
}

export interface WebhookSubscription {
  webhook_id: string;
  agent_id: string;
  url: string;
  status: 'active' | 'inactive';
  secret: string;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface PerformanceMetrics {
  metric_id: string;
  agent_id: string;
  date: Date | string;
  total_transactions: number;
  successful_transactions: number;
  failed_transactions: number;
  total_amount: number;
  total_commission: number;
  total_markup: number;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface AuditLog {
  log_id: string;
  agent_id?: string;
  action: string;
  details: any;
  created_at: Date | string;
}

export interface AgentPerformance {
  total_transactions: number;
  successful_transactions: number;
  failed_transactions: number;
  total_amount: number;
  total_commission: number;
  total_markup: number;
  success_rate: number;
  average_transaction_amount: number;
  daily_trends: {
    date: string;
    transactions: number;
    amount: number;
    commission: number;
    markup: number;
  }[];
}

export interface RegionPerformance {
  region_id: string;
  region_name: string;
  total_transactions: number;
  total_amount: number;
  total_commission: number;
  total_markup: number;
  average_markup_per_agent: number;
  success_rate: number;
  suspicious_activities: {
    agent_id: string;
    agent_name: string;
    issue: string;
    details: any;
  }[];
} 