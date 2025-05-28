import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import transactionRoutes from './routes/transaction.routes';
import adminRoutes from './routes/admin.routes';
import webhookRoutes from './routes/webhook.routes';
import authRoutes from './routes/auth.routes';
import metricsRoutes from './routes/metrics.routes';
import auditRoutes from './routes/audit.routes';
//import morgan from 'morgan';

// Load environment variables
dotenv.config();

// Import routes (to be created)
// import agentRoutes from './routes/agent.routes';
// import adminRoutes from './routes/admin.routes';
// import webhookRoutes from './routes/webhook.routes';

const app: Express = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//app.use(morgan('dev'));

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Basic health check route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', message: 'Service is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/audit', auditRoutes);

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);

  // Handle authentication errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid or expired token'
    });
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      status: 'error',
      message: err.message
    });
  }

  // Handle authorization errors
  if (err.name === 'AuthorizationError') {
    return res.status(403).json({
      status: 'error',
      message: err.message
    });
  }

  // Handle database errors
  if (err.code && err.code.startsWith('ER_')) {
    return res.status(500).json({
      status: 'error',
      message: 'Database error'
    });
  }

  // Default error
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Routes (to be implemented)
// app.use('/api/agents', agentRoutes);
// app.use('/api/admin', adminRoutes);
// app.use('/api/webhooks', webhookRoutes);

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
  });
}

export default app; 