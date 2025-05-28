import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export const generateId = (): string => {
  return uuidv4();
};

export const calculateCommission = (amount: number, transactionType: 'cashout' | 'deposit'): number => {
  // Example commission calculation (can be adjusted based on business rules)
  const baseRate = transactionType === 'cashout' ? 0.005 : 0.003;
  return amount * baseRate;
};

export const validateMarkup = (markup: number, amount: number): boolean => {
  // Validate that markup is not more than 5% of transaction amount
  const maxMarkupRate = 0.05;
  return markup <= amount * maxMarkupRate;
};

export const detectAnomaly = (
  currentValue: number,
  historicalAverage: number,
  threshold = 2
): boolean => {
  // Detect if current value deviates significantly from historical average
  const deviation = Math.abs(currentValue - historicalAverage) / historicalAverage;
  return deviation > threshold;
};

export const generateWebhookSecret = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const calculateSuccessRate = (
  successful: number,
  total: number
): number => {
  if (total === 0) return 0;
  return (successful / total) * 100;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN'
  }).format(amount);
};

export const calculateDailyStats = (transactions: any[]): any => {
  const dailyStats = transactions.reduce((acc: any, transaction: any) => {
    const date = transaction.created_at.split('T')[0];
    if (!acc[date]) {
      acc[date] = {
        transactions: 0,
        amount: 0,
        commission: 0,
        markup: 0
      };
    }
    
    acc[date].transactions += 1;
    acc[date].amount += transaction.amount;
    acc[date].commission += transaction.standard_commission;
    acc[date].markup += transaction.agent_markup;
    
    return acc;
  }, {});

  return Object.entries(dailyStats).map(([date, stats]: [string, any]) => ({
    date,
    ...stats
  }));
};

export const validatePhoneNumber = (phone: string): boolean => {
  // Validate Nigerian phone numbers
  const phoneRegex = /^(\+234|0)[789][01]\d{8}$/;
  return phoneRegex.test(phone);
}; 