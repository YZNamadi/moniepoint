import { Router } from 'express';
import { AuditController } from '../controllers/audit.controller';
import { authenticateAgent } from '../middlewares/auth.middleware';
import { RequestHandler } from 'express';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     AuditLog:
 *       type: object
 *       properties:
 *         log_id:
 *           type: string
 *         agent_id:
 *           type: string
 *         action:
 *           type: string
 *         details:
 *           type: object
 *         created_at:
 *           type: string
 *           format: date-time
 */

// Apply authentication to all routes
router.use(authenticateAgent as RequestHandler);

/**
 * @swagger
 * /api/audit:
 *   post:
 *     summary: Create a new audit log
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *               details:
 *                 type: object
 *     responses:
 *       201:
 *         description: Audit log created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/AuditLog'
 */
router.post('/', AuditController.createAuditLog as RequestHandler);

/**
 * @swagger
 * /api/audit:
 *   get:
 *     summary: Get audit logs with filtering and pagination
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *       - in: query
 *         name: action
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
 *     responses:
 *       200:
 *         description: List of audit logs
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
 *                     logs:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/AuditLog'
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
router.get('/', AuditController.getAuditLogs as RequestHandler);

/**
 * @swagger
 * /api/audit/{logId}:
 *   get:
 *     summary: Get audit log by ID
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: logId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Audit log details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/AuditLog'
 */
router.get('/:log_id', AuditController.getAuditLogById as RequestHandler);

export default router; 