import { Request, Response, NextFunction } from 'express';
import { User } from '../config/schema';
export interface AuthenticatedRequest extends Request {
    user?: User;
}
export interface JWTPayload {
    userId: string;
    email: string;
    role: string;
    iat?: number;
    exp?: number;
}
export declare const authenticateToken: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const requireAdmin: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const optionalAuth: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const generateToken: (user: User) => string;
//# sourceMappingURL=auth.d.ts.map