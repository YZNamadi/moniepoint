import { Request, Response } from 'express';
import { TransactionService } from '../services/transaction.service';
import { validatePhoneNumber, calculateCommission } from '../utils/helpers';

export class TransactionController {
  static async createTransaction(req: Request, res: Response) {
    try {
      const {
        agent_id,
        amount,
        transaction_type,
        agent_markup,
        customer_phone,
        notes
      } = req.body;

      // Validate required fields
      if (!agent_id || !amount || !transaction_type) {
        return res.status(400).json({
          status: 'error',
          message: 'Missing required fields'
        });
      }

      // Validate amount
      if (amount <= 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid amount'
        });
      }

      // Validate transaction type
      if (!['cashout', 'deposit'].includes(transaction_type)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid transaction type'
        });
      }

      // Validate phone number if provided
      if (customer_phone && !validatePhoneNumber(customer_phone)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid phone number format'
        });
      }

      // Calculate standard commission
      const standard_commission = calculateCommission(amount, transaction_type);

      const transaction = await TransactionService.createTransaction({
        agent_id,
        amount,
        transaction_type,
        status: 'success', // Default to success, can be updated later
        standard_commission,
        agent_markup: agent_markup || 0,
        customer_phone,
        notes
      });

      // Check for suspicious activity
      const isSuspicious = await TransactionService.detectSuspiciousActivity(agent_id);
      if (isSuspicious) {
        // TODO: Trigger webhook notification for suspicious activity
        console.warn(`Suspicious activity detected for agent ${agent_id}`);
      }

      return res.status(201).json({
        status: 'success',
        data: transaction
      });
    } catch (error: any) {
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Internal server error'
      });
    }
  }

  static async getAgentTransactions(req: Request, res: Response) {
    try {
      const { agent_id } = req.params;
      const { start_date, end_date } = req.query;

      const transactions = await TransactionService.getAgentTransactions(
        agent_id,
        start_date as string,
        end_date as string
      );

      return res.status(200).json({
        status: 'success',
        data: transactions
      });
    } catch (error: any) {
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Internal server error'
      });
    }
  }

  static async getAgentPerformance(req: Request, res: Response) {
    try {
      const { agent_id } = req.params;

      const metrics = await TransactionService.getAgentPerformanceMetrics(agent_id);

      return res.status(200).json({
        status: 'success',
        data: metrics
      });
    } catch (error: any) {
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Internal server error'
      });
    }
  }

  static async getAgentTransactionById(req: Request, res: Response) {
    try {
      const { transactionId } = req.params;
      const agentId = req.user?.id;

      if (!agentId) {
        return res.status(401).json({
          status: 'error',
          message: 'Unauthorized'
        });
      }

      const transaction = await TransactionService.getTransactionById(transactionId, agentId);

      if (!transaction) {
        return res.status(404).json({
          status: 'error',
          message: 'Transaction not found'
        });
      }

      return res.status(200).json({
        status: 'success',
        data: transaction
      });
    } catch (error: any) {
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Internal server error'
      });
    }
  }
} 