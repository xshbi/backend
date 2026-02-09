import type { Context } from 'elysia';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface JWTPayload {
    userId: number;
    email: string;
    role: string;
    iat?: number;
    exp?: number;
}

export interface AuthContext extends Context {
    user?: JWTPayload;
}

/**
 * JWT Authentication Middleware
 * Verifies the JWT token from Authorization header
 */
export const authMiddleware = async (context: AuthContext) => {
    try {
        const authHeader = context.request.headers.get('authorization');

        if (!authHeader) {
            context.set.status = 401;
            return {
                success: false,
                error: 'No authorization header provided',
                message: 'Please provide a valid token'
            };
        }

        // Extract token from "Bearer <token>"
        const token = authHeader.startsWith('Bearer ')
            ? authHeader.substring(7)
            : authHeader;

        if (!token) {
            context.set.status = 401;
            return {
                success: false,
                error: 'No token provided',
                message: 'Authorization token is missing'
            };
        }

        // Verify token
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

            // Attach user info to context
            context.user = decoded;

            // Continue to next handler
            return;
        } catch (jwtError) {
            if (jwtError instanceof jwt.TokenExpiredError) {
                context.set.status = 401;
                return {
                    success: false,
                    error: 'Token expired',
                    message: 'Your session has expired. Please login again.'
                };
            }

            if (jwtError instanceof jwt.JsonWebTokenError) {
                context.set.status = 401;
                return {
                    success: false,
                    error: 'Invalid token',
                    message: 'The provided token is invalid'
                };
            }

            throw jwtError;
        }
    } catch (error) {
        context.set.status = 500;
        return {
            success: false,
            error: 'Authentication error',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
};

/**
 * Optional Auth Middleware
 * Attaches user to context if token is valid, but doesn't block request
 */
export const optionalAuthMiddleware = async (context: AuthContext) => {
    try {
        const authHeader = context.request.headers.get('authorization');

        if (!authHeader) {
            return; // Continue without user
        }

        const token = authHeader.startsWith('Bearer ')
            ? authHeader.substring(7)
            : authHeader;

        if (!token) {
            return; // Continue without user
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
            context.user = decoded;
        } catch {
            // Silently fail - continue without user
        }
    } catch {
        // Silently fail - continue without user
    }
};

/**
 * Role-based authorization middleware
 * Requires authMiddleware to be run first
 */
export const requireRole = (allowedRoles: string[]) => {
    return async (context: AuthContext) => {
        if (!context.user) {
            context.set.status = 401;
            return {
                success: false,
                error: 'Unauthorized',
                message: 'Authentication required'
            };
        }

        if (!allowedRoles.includes(context.user.role)) {
            context.set.status = 403;
            return {
                success: false,
                error: 'Forbidden',
                message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
            };
        }

        return; // Continue to next handler
    };
};

/**
 * Admin-only middleware
 */
export const requireAdmin = requireRole(['admin']);

/**
 * Vendor or Admin middleware
 */
export const requireVendorOrAdmin = requireRole(['vendor', 'admin']);
