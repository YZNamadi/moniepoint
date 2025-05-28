import { Router } from 'express';
import { MetricsController } from '../controllers';
import { authenticateAgent } from '../middlewares/auth.middleware';
import { RequestHandler } from 'express';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     PerformanceMetrics:
 *       type: object
 *       properties:
 *         total_transactions:
 *           type: integer
 *         successful_transactions:
 *           type: integer
 *         total_amount:
 *           type: number
 *         success_rate:
 *           type: number
 *         commission_earned:
 *           type: number
 *         average_transaction_value:
 *           type: number
 *         transaction_by_type:
 *           type: object
 *           properties:
 *             deposit:
 *               type: integer
 *             withdrawal:
 *               type: integer
 *             transfer:
 *               type: integer
 */

router.use(authenticateAgent);

/**
 * @swagger
 * /api/metrics/agent/{agentId}:
 *   get:
 *     summary: Get performance metrics for a specific agent
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: agentId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
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
 *                   $ref: '#/components/schemas/PerformanceMetrics'
 */
router.get('/agent/:agentId', MetricsController.getAgentMetrics);

/**
 * @swagger
 * /api/metrics/region/{regionId}:
 *   get:
 *     summary: Get performance metrics for a specific region
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: regionId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Region performance metrics
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
 *                     metrics:
 *                       $ref: '#/components/schemas/PerformanceMetrics'
 *                     agent_count:
 *                       type: integer
 *                     top_agents:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           agent_id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           total_transactions:
 *                             type: integer
 *                           total_amount:
 *                             type: number
 */
router.get('/region/:regionId', MetricsController.getRegionMetrics);

export default router; 