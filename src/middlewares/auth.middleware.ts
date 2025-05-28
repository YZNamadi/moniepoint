import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../types';

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

interface JwtPayload {
  id: string;
  role: UserRole;
}

class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthorizationError('No token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret') as JwtPayload;
    
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      next(error);
    } else {
      next(new AuthorizationError('Invalid token'));
    }
  }
};

export const requireRole = (role: UserRole) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== role) {
      next(new AuthorizationError('Access denied'));
      return;
    }
    next();
  };
};

export const authenticateAdmin = (req: Request, res: Response, next: NextFunction) => {
  authenticate(req, res, (err) => {
    if (err) return next(err);
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
      next(new AuthorizationError('Admin access required'));
      return;
    }
    next();
  });
};

export const authenticateAgent = (req: Request, res: Response, next: NextFunction) => {
  authenticate(req, res, (err) => {
    if (err) return next(err);
    if (!req.user || req.user.role !== 'agent') {
      next(new AuthorizationError('Agent access required'));
      return;
    }

    // For agent-specific endpoints, verify the agent is accessing their own data
    const agent_id = req.params.agent_id || req.body.agent_id;
    if (agent_id && agent_id !== req.user.id) {
      next(new AuthorizationError('Unauthorized access to another agent\'s data'));
      return;
    }

    next();
  });
}; 