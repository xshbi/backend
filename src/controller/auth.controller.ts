import type { Context } from 'elysia';
import { AuthModel, OAuthModel } from '../models/auth.model';
import { UserModel } from '../models/user.model';
import type { AuthContext } from '../middleware/auth.middleware';

interface RegisterBody {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    phone?: string;
}

interface LoginBody {
    email: string;
    password: string;
}

interface RefreshTokenBody {
    refreshToken: string;
}

export class AuthController {
    /**
     * Register a new user
     */
    static async register(context: Context) {
        try {
            const body = context.body as RegisterBody;
            let { first_name, last_name, email, password, phone } = body;

            // Normalize inputs
            if (email) email = email.toLowerCase().trim();
            if (first_name) first_name = first_name.trim();
            if (last_name) last_name = last_name.trim();

            // Validation
            if (!first_name || !last_name || !email || !password) {
                context.set.status = 400;
                return {
                    success: false,
                    error: 'Missing required fields',
                    message: 'Please provide first_name, last_name, email, and password'
                };
            }

            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                context.set.status = 400;
                return {
                    success: false,
                    error: 'Invalid email format',
                    message: 'Please provide a valid email address'
                };
            }

            // Password validation (minimum 6 characters)
            if (password.length < 6) {
                context.set.status = 400;
                return {
                    success: false,
                    error: 'Weak password',
                    message: 'Password must be at least 6 characters long'
                };
            }

            // Check if user already exists
            const existingUser = await UserModel.findByEmail(email);
            if (existingUser) {
                context.set.status = 409;
                return {
                    success: false,
                    error: 'User already exists',
                    message: 'An account with this email already exists'
                };
            }

            // Register user
            const { user } = await AuthModel.register({
                first_name,
                last_name,
                email,
                password,
                phone
            });

            // Auto login after register
            const ipAddress = context.request.headers.get('x-forwarded-for') ||
                context.request.headers.get('x-real-ip') ||
                '127.0.0.1';
            const userAgent = context.request.headers.get('user-agent') || 'unknown';

            const loginResult = await AuthModel.login(email, password, ipAddress, userAgent);

            if (!loginResult.success) {
                // This shouldn't happen right after register unless DB error
                context.set.status = 500;
                return {
                    success: false,
                    error: 'Login failed',
                    message: 'Account created but failed to log in automatically.'
                };
            }

            context.set.status = 201;
            return {
                success: true,
                message: 'User registered successfully',
                data: {
                    user: loginResult.user,
                    accessToken: loginResult.accessToken,
                    refreshToken: loginResult.refreshToken,
                    // expiresIn is handled in AuthModel but not returned explicitly in result payload structure, 
                    // usually clients decode token or we can hardcode response if needed.
                    // AuthModel.login return structure: { success, user, accessToken, refreshToken, session }
                }
            };

        } catch (error: any) {
            console.error('Register error:', error);
            context.set.status = 500;
            return {
                success: false,
                error: 'Registration failed',
                message: error.message || 'Unknown error occurred'
            };
        }
    }

    /**
     * Login user
     */
    static async login(context: Context) {
        try {
            const body = context.body as LoginBody;
            let { email, password } = body;

            // Normalize email
            if (email) email = email.toLowerCase().trim();

            // Validation
            if (!email || !password) {
                context.set.status = 400;
                return {
                    success: false,
                    error: 'Missing credentials',
                    message: 'Please provide email and password'
                };
            }

            const ipAddress = context.request.headers.get('x-forwarded-for') ||
                context.request.headers.get('x-real-ip') ||
                '127.0.0.1';
            const userAgent = context.request.headers.get('user-agent') || 'unknown';

            const result = await AuthModel.login(email, password, ipAddress, userAgent);

            if (!result.success) {
                // Determine status code based on error message usually, but 401 is safe default
                context.set.status = 401;
                return {
                    success: false,
                    error: 'Authentication failed',
                    message: result.error
                };
            }

            return {
                success: true,
                message: 'Login successful',
                data: {
                    user: result.user,
                    accessToken: result.accessToken,
                    refreshToken: result.refreshToken
                }
            };
        } catch (error: any) {
            console.error('Login error:', error);
            context.set.status = 500;
            return {
                success: false,
                error: 'Login failed',
                message: error.message || 'Unknown error occurred'
            };
        }
    }

    /**
     * Refresh access token
     */
    static async refreshToken(context: Context) {
        try {
            const body = context.body as RefreshTokenBody;
            const { refreshToken } = body;

            if (!refreshToken) {
                context.set.status = 400;
                return {
                    success: false,
                    error: 'Missing refresh token',
                    message: 'Please provide a refresh token'
                };
            }

            const result = await AuthModel.refreshAccessToken(refreshToken);

            if (!result.success) {
                context.set.status = 401;
                return {
                    success: false,
                    error: 'Token refresh failed',
                    message: result.error
                };
            }

            return {
                success: true,
                message: 'Token refreshed successfully',
                data: {
                    accessToken: result.accessToken
                }
            };
        } catch (error: any) {
            console.error('Refresh token error:', error);
            context.set.status = 500;
            return {
                success: false,
                error: 'Token refresh failed',
                message: error.message || 'Unknown error occurred'
            };
        }
    }

    /**
     * Logout user
     */
    static async logout(context: AuthContext) {
        try {
            const authHeader = context.request.headers.get('authorization');

            if (!authHeader) {
                context.set.status = 400;
                return {
                    success: false,
                    error: 'No token provided',
                    message: 'Authorization header is required'
                };
            }

            const token = authHeader.startsWith('Bearer ')
                ? authHeader.substring(7)
                : authHeader;

            await AuthModel.logout(token);

            return {
                success: true,
                message: 'Logged out successfully'
            };
        } catch (error: any) {
            console.error('Logout error:', error);
            context.set.status = 500;
            return {
                success: false,
                error: 'Logout failed',
                message: error.message || 'Unknown error occurred'
            };
        }
    }

    /**
     * Logout from all devices
     */
    static async logoutAll(context: AuthContext) {
        try {
            if (!context.user) {
                context.set.status = 401;
                return {
                    success: false,
                    error: 'Unauthorized',
                    message: 'Authentication required'
                };
            }

            await AuthModel.logoutAll(context.user.userId);

            return {
                success: true,
                message: 'Logged out from all devices successfully'
            };
        } catch (error: any) {
            console.error('Logout all error:', error);
            context.set.status = 500;
            return {
                success: false,
                error: 'Logout failed',
                message: error.message || 'Unknown error occurred'
            };
        }
    }

    /**
     * Get current user profile
     */
    static async getProfile(context: AuthContext) {
        try {
            if (!context.user) {
                context.set.status = 401;
                return {
                    success: false,
                    error: 'Unauthorized',
                    message: 'Authentication required'
                };
            }

            const user = await UserModel.findById(context.user.userId);

            if (!user) {
                context.set.status = 404;
                return {
                    success: false,
                    error: 'User not found',
                    message: 'User account not found'
                };
            }

            // Remove password hash
            const { password_hash, ...userProfile } = user;

            return {
                success: true,
                data: userProfile
            };
        } catch (error: any) {
            console.error('Get profile error:', error);
            context.set.status = 500;
            return {
                success: false,
                error: 'Failed to get profile',
                message: error.message || 'Unknown error occurred'
            };
        }
    }

    /**
     * Get active sessions
     */
    static async getSessions(context: AuthContext) {
        try {
            if (!context.user) {
                context.set.status = 401;
                return {
                    success: false,
                    error: 'Unauthorized',
                    message: 'Authentication required'
                };
            }

            const sessions = await AuthModel.getActiveSessions(context.user.userId);

            return {
                success: true,
                data: {
                    sessions,
                    count: sessions.length
                }
            };
        } catch (error: any) {
            console.error('Get sessions error:', error);
            context.set.status = 500;
            return {
                success: false,
                error: 'Failed to get sessions',
                message: error.message || 'Unknown error occurred'
            };
        }
    }

    /**
     * Revoke a specific session
     */
    static async revokeSession(context: AuthContext) {
        try {
            if (!context.user) {
                context.set.status = 401;
                return {
                    success: false,
                    error: 'Unauthorized',
                    message: 'Authentication required'
                };
            }

            const { sessionId } = context.params as { sessionId: string };

            if (!sessionId) {
                context.set.status = 400;
                return {
                    success: false,
                    error: 'Missing session ID',
                    message: 'Please provide a session ID'
                };
            }

            const success = await AuthModel.revokeSession(context.user.userId, parseInt(sessionId));

            if (!success) {
                context.set.status = 404;
                return {
                    success: false,
                    error: 'Session not found',
                    message: 'The specified session was not found'
                };
            }

            return {
                success: true,
                message: 'Session revoked successfully'
            };
        } catch (error: any) {
            console.error('Revoke session error:', error);
            context.set.status = 500;
            return {
                success: false,
                error: 'Failed to revoke session',
                message: error.message || 'Unknown error occurred'
            };
        }
    }
}
