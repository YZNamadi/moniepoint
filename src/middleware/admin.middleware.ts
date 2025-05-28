import { Request, Response, NextFunction } from 'express';

export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        return res.status(403).json({
            status: 'error',
            message: 'Access denied. Admin privileges required.'
        });
    }

    next();
}; 