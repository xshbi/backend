import { Elysia } from 'elysia';
import { AuthController } from '../controller/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

/**
 * Authentication Routes
 * 
 * Public routes:
 * - POST /auth/register - Register a new user
 * - POST /auth/login - Login user
 * - POST /auth/refresh - Refresh access token
 * 
 * Protected routes (require authentication):
 * - POST /auth/logout - Logout current session
 * - POST /auth/logout-all - Logout from all devices
 * - GET /auth/profile - Get current user profile
 * - GET /auth/sessions - Get active sessions
 * - DELETE /auth/sessions/:sessionId - Revoke a specific session
 */
export const authRoutes = new Elysia({ prefix: '/api/auth' })
    // Public routes
    .post('/register', AuthController.register)
    .post('/login', AuthController.login)
    .post('/refresh', AuthController.refreshToken)

    // Protected routes
    .post('/logout', async (context) => {
        const authResult = await authMiddleware(context);
        if (authResult) return authResult;
        return AuthController.logout(context);
    })
    .post('/logout-all', async (context) => {
        const authResult = await authMiddleware(context);
        if (authResult) return authResult;
        return AuthController.logoutAll(context);
    })
    .get('/profile', async (context) => {
        const authResult = await authMiddleware(context);
        if (authResult) return authResult;
        return AuthController.getProfile(context);
    })
    .get('/sessions', async (context) => {
        const authResult = await authMiddleware(context);
        if (authResult) return authResult;
        return AuthController.getSessions(context);
    })
    .delete('/sessions/:sessionId', async (context) => {
        const authResult = await authMiddleware(context);
        if (authResult) return authResult;
        return AuthController.revokeSession(context);
    });
