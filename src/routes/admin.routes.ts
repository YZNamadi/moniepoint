import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { adminMiddleware } from '../middleware/admin.middleware';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Agent:
 *       type: object
 *       properties:
 *         agent_id:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         region_id:
 *           type: string
 *         status:
 *           type: string
 *           enum: [active, inactive, suspended]
 *         created_at:
 *           type: string
 *           format: date-time
 *     RegionPerformance:
 *       type: object
 *       properties:
 *         region_id:
 *           type: string
 *         region_name:
 *           type: string
 *         total_transactions:
 *           type: number
 *         total_amount:
 *           type: number
 *         total_commission:
 *           type: number
 *         total_markup:
 *           type: number
 *         average_markup_per_agent:
 *           type: number
 *         success_rate:
 *           type: number
 */

// Apply auth and admin middleware to all routes
router.use(authMiddleware);
router.use(adminMiddleware);

/**
 * @swagger
 * /api/admin/agents:
 *   get:
 *     summary: Get all agents
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all agents
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
 *                     $ref: '#/components/schemas/Agent'
 */
router.get('/agents', AdminController.getAllAgents);

/**
 * @swagger
 * /api/admin/agents/{agentId}:
 *   get:
 *     summary: Get agent details by ID
 *     tags: [Admin]
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
 *         description: Agent details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Agent'
 */
router.get('/agents/:agentId', AdminController.getAgentDetails);

/**
 * @swagger
 * /api/admin/agents/{agentId}/status:
 *   put:
 *     summary: Update agent status
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: agentId
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
 *               status:
 *                 type: string
 *                 enum: [active, inactive, suspended]
 *     responses:
 *       200:
 *         description: Agent status updated successfully
 */
router.put('/agents/:agentId/status', AdminController.updateAgentStatus);

/**
 * @swagger
 * /api/admin/performance/overview:
 *   get:
 *     summary: Get system performance overview
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System performance overview
 */
router.get('/performance/overview', AdminController.getSystemOverview);

/**
 * @swagger
 * /api/admin/performance/agents/{agentId}:
 *   get:
 *     summary: Get agent performance
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: agentId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Agent performance data
 */
router.get('/performance/agents/:agentId', AdminController.getAgentPerformance);

/**
 * @swagger
 * /api/admin/performance/regions/{regionId}:
 *   get:
 *     summary: Get region performance stats
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: regionId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Region performance statistics
 */
router.get('/performance/regions/:regionId', AdminController.getRegionPerformanceStats);

/**
 * @swagger
 * /api/admin/top-agents:
 *   get:
 *     summary: Get top performing agents
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of top performing agents
 */
router.get('/top-agents', AdminController.getTopAgents);

/**
 * @swagger
 * /api/admin/region-performance:
 *   get:
 *     summary: Get performance metrics for all regions
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Performance metrics for all regions
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
 *                     $ref: '#/components/schemas/RegionPerformance'
 */
router.get('/region-performance', AdminController.getRegionPerformance);

/**
 * @swagger
 * /api/admin/suspicious-activities:
 *   get:
 *     summary: Get suspicious activities
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: region_id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of suspicious activities
 */
router.get('/suspicious-activities', AdminController.getSuspiciousActivities);

export default router; 