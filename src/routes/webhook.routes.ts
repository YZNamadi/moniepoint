import { Router } from 'express';
import { WebhookController } from '../controllers/webhook.controller';
import { authenticateAgent } from '../middlewares/auth.middleware';
import { RequestHandler } from 'express';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     WebhookSubscription:
 *       type: object
 *       properties:
 *         subscription_id:
 *           type: string
 *         agent_id:
 *           type: string
 *         url:
 *           type: string
 *           format: uri
 *         event_types:
 *           type: array
 *           items:
 *             type: string
 *             enum: [transaction.created, transaction.updated, transaction.completed]
 *         secret:
 *           type: string
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *         created_at:
 *           type: string
 *           format: date-time
 */

// Apply agent authentication to all routes
router.use(authenticateAgent as RequestHandler);

/**
 * @swagger
 * /api/webhooks:
 *   post:
 *     summary: Create a new webhook subscription
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *               - event_types
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *               event_types:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [transaction.created, transaction.updated, transaction.completed]
 *     responses:
 *       201:
 *         description: Webhook subscription created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/WebhookSubscription'
 */
router.post('/', WebhookController.createSubscription);

/**
 * @swagger
 * /api/webhooks:
 *   get:
 *     summary: Get all webhook subscriptions for the authenticated agent
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of webhook subscriptions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WebhookSubscription'
 */
router.get('/', WebhookController.listSubscriptions);

/**
 * @swagger
 * /api/webhooks/{webhookId}:
 *   put:
 *     summary: Update a webhook subscription
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: webhookId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *               event_types:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [transaction.created, transaction.updated, transaction.completed]
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: Webhook subscription updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/WebhookSubscription'
 */
router.put('/:webhookId', WebhookController.updateSubscription);

/**
 * @swagger
 * /api/webhooks/{webhookId}:
 *   delete:
 *     summary: Delete a webhook subscription
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: webhookId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Webhook subscription deleted successfully
 */
router.delete('/:webhookId', WebhookController.deleteSubscription);

export default router; 