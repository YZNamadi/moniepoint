import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

// Validation middleware for login
export const validateLogin = [
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email address'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: 'error',
                errors: errors.array()
            });
        }
        next();
    }
];

// Validation middleware for webhook subscription
export const validateWebhookSubscription = [
    body('url')
        .isURL()
        .withMessage('Please provide a valid webhook URL'),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: 'error',
                errors: errors.array()
            });
        }
        next();
    }
];

export const validateTransaction = (req: Request, res: Response, next: NextFunction) => {
  const { amount, phone_number, transaction_type } = req.body;

  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Valid amount is required'
    });
  }

  if (!phone_number || typeof phone_number !== 'string' || !/^\+?[1-9]\d{1,14}$/.test(phone_number)) {
    return res.status(400).json({
      status: 'error',
      message: 'Valid phone number is required'
    });
  }

  if (!transaction_type || !['deposit', 'withdrawal', 'transfer'].includes(transaction_type)) {
    return res.status(400).json({
      status: 'error',
      message: 'Valid transaction type is required (deposit, withdrawal, or transfer)'
    });
  }

  next();
}; 