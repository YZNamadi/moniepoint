import { Router } from 'express';
import { TransactionController } from '../controllers/transaction.controller';
import { authenticateAgent } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Transaction:
 *       type: object
 *       properties:
 *         transaction_id:
 *           type: string
 *         agent_id:
 *           type: string
 *         amount:
 *           type: number
 *         phone_number:
 *           type: string
 *         transaction_type:
 *           type: string
 *           enum: [deposit, withdrawal, transfer]
 *         status:
 *           type: string
 *           enum: [pending, success, failed]
 *         standard_commission:
 *           type: number
 *         agent_markup:
 *           type: number
 *         created_at:
 *           type: string
 *           format: date-time
 */

router.use(authenticateAgent);

/**
 * @swagger
 * /api/transactions:
 *   post:
 *     summary: Create a new transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - phone_number
 *               - transaction_type
 *             properties:
 *               amount:
 *                 type: number
 *               phone_number:
 *                 type: string
 *               transaction_type:
 *                 type: string
 *                 enum: [deposit, withdrawal, transfer]
 *               agent_markup:
 *                 type: number
 *     responses:
 *       201:
 *         description: Transaction created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Transaction'
 */
router.post('/', TransactionController.createTransaction);

/**
 * @swagger
 * /api/transactions/agent/{agentId}:
 *   get:
 *     summary: Get all transactions for a specific agent
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: agentId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, success, failed]
 *       - in: query
 *         name: transaction_type
 *         schema:
 *           type: string
 *           enum: [deposit, withdrawal, transfer]
 *     responses:
 *       200:
 *         description: List of transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     transactions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Transaction'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         pages:
 *                           type: integer
 */
router.get('/agent/:agentId', TransactionController.getAgentTransactions);

/**
 * @swagger
 * /api/transactions/agent/{agentId}/performance:
 *   get:
 *     summary: Get agent's performance metrics
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: agentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Agent performance metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_transactions:
 *                       type: integer
 *                     total_amount:
 *                       type: number
 *                     success_rate:
 *                       type: number
 *                     commission_earned:
 *                       type: number
 */
router.get('/agent/:agentId/performance', TransactionController.getAgentPerformance);

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: Get all transactions for the authenticated agent
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, success, failed]
 *       - in: query
 *         name: transaction_type
 *         schema:
 *           type: string
 *           enum: [deposit, withdrawal, transfer]
 *     responses:
 *       200:
 *         description: List of transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     transactions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Transaction'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         pages:
 *                           type: integer
 */
router.get('/', TransactionController.getAgentTransactions);

/**
 * @swagger
 * /api/transactions/{transactionId}:
 *   get:
 *     summary: Get transaction by ID
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Transaction'
 */
router.get('/:transactionId', TransactionController.getAgentTransactionById);

export default router; 