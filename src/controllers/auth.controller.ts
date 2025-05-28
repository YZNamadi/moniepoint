import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database';

export class AuthController {
    static async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;

            // Try to find admin first
            const [adminRows]: any = await pool.query(
                'SELECT admin_id, email, password, role FROM admins WHERE email = ?',
                [email]
            );

            if (adminRows.length > 0) {
                const admin = adminRows[0];
                const isValidPassword = await bcrypt.compare(password, admin.password);
                
                if (!isValidPassword) {
                    return res.status(401).json({
                        status: 'error',
                        message: 'Invalid credentials'
                    });
                }

                const token = jwt.sign(
                    { 
                        id: admin.admin_id,
                        role: admin.role
                    },
                    process.env.JWT_SECRET || 'your_jwt_secret_key_here',
                    { expiresIn: '24h' }
                );

                return res.status(200).json({
                    status: 'success',
                    data: {
                        token,
                        admin: {
                            admin_id: admin.admin_id,
                            email: admin.email,
                            role: admin.role
                        }
                    }
                });
            }

            // If not admin, try agent
            const [agentRows]: any = await pool.query(
                'SELECT agent_id, email, password FROM agents WHERE email = ?',
                [email]
            );

            if (agentRows.length === 0) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Invalid credentials'
                });
            }

            const agent = agentRows[0];
            const isValidPassword = await bcrypt.compare(password, agent.password);
            
            if (!isValidPassword) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Invalid credentials'
                });
            }

            const token = jwt.sign(
                { 
                    id: agent.agent_id,
                    role: 'agent'
                },
                process.env.JWT_SECRET || 'your_jwt_secret_key_here',
                { expiresIn: '24h' }
            );

            res.status(200).json({
                status: 'success',
                data: {
                    token,
                    agent: {
                        agent_id: agent.agent_id,
                        email: agent.email
                    }
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                status: 'error',
                message: 'An error occurred during login'
            });
        }
    }
} 