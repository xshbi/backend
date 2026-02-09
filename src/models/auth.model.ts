// db/schema.ts (Auth Tables)
import { sql } from '../db/schema';

// Create sessions table
export const createSessionsTable = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      session_token VARCHAR(500) UNIQUE NOT NULL,
      refresh_token VARCHAR(500) UNIQUE,
      device_info JSONB,
      ip_address INET,
      user_agent TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      expires_at TIMESTAMP NOT NULL,
      last_activity TIMESTAMP DEFAULT NOW(),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at)`;
};

// Create OAuth accounts table
export const createOAuthAccountsTable = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS oauth_accounts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      provider VARCHAR(50) NOT NULL CHECK (provider IN ('google', 'facebook', 'apple', 'twitter')),
      provider_account_id VARCHAR(255) NOT NULL,
      access_token TEXT,
      refresh_token TEXT,
      token_expires_at TIMESTAMP,
      scope TEXT,
      id_token TEXT,
      profile_data JSONB,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(provider, provider_account_id)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_oauth_user_id ON oauth_accounts(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_oauth_provider ON oauth_accounts(provider, provider_account_id)`;
};

// Create login attempts table (for security)
export const createLoginAttemptsTable = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS login_attempts (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255),
      ip_address INET NOT NULL,
      user_agent TEXT,
      success BOOLEAN DEFAULT FALSE,
      failure_reason VARCHAR(100),
      attempted_at TIMESTAMP DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_login_attempts_time ON login_attempts(attempted_at DESC)`;
};

// Create password reset tokens table
export const createPasswordResetTokensTable = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      token VARCHAR(500) UNIQUE NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used BOOLEAN DEFAULT FALSE,
      used_at TIMESTAMP,
      ip_address INET,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_reset_tokens_token ON password_reset_tokens(token)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_reset_tokens_user_id ON password_reset_tokens(user_id)`;
};

// Create email verification tokens table
export const createEmailVerificationTokensTable = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS email_verification_tokens (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      token VARCHAR(500) UNIQUE NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      verified BOOLEAN DEFAULT FALSE,
      verified_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON email_verification_tokens(token)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_verification_tokens_user_id ON email_verification_tokens(user_id)`;
};

// Create two-factor authentication table
export const createTwoFactorTable = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS two_factor_auth (
      id SERIAL PRIMARY KEY,
      user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      secret VARCHAR(255) NOT NULL,
      backup_codes TEXT[],
      enabled BOOLEAN DEFAULT FALSE,
      enabled_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_2fa_user_id ON two_factor_auth(user_id)`;
};

// models/Auth.ts
import { sign, verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

export interface Session {
  id: number;
  user_id: number;
  session_token: string;
  refresh_token?: string;
  device_info?: any;
  ip_address?: string;
  user_agent?: string;
  is_active: boolean;
  expires_at: Date;
  last_activity: Date;
  created_at: Date;
}

export interface OAuthAccount {
  id: number;
  user_id: number;
  provider: 'google' | 'facebook' | 'apple' | 'twitter';
  provider_account_id: string;
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: Date;
  scope?: string;
  id_token?: string;
  profile_data?: any;
  created_at: Date;
  updated_at: Date;
}

export interface LoginAttempt {
  id: number;
  email?: string;
  ip_address: string;
  user_agent?: string;
  success: boolean;
  failure_reason?: string;
  attempted_at: Date;
}

export interface TokenPayload {
  userId: number;
  email: string;
  role: string;
}

export class AuthModel {
  // Generate JWT token
  static generateToken(payload: TokenPayload): string {
    return sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  // Generate refresh token
  static generateRefreshToken(payload: TokenPayload): string {
    return sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
  }

  // Verify JWT token
  static verifyToken(token: string): TokenPayload | null {
    try {
      return verify(token, JWT_SECRET) as TokenPayload;
    } catch (error) {
      return null;
    }
  }

  // Verify refresh token
  static verifyRefreshToken(token: string): TokenPayload | null {
    try {
      return verify(token, JWT_REFRESH_SECRET) as TokenPayload;
    } catch (error) {
      return null;
    }
  }

  // Register new user
  static async register(userData: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    phone?: string;
  }) {
    // Hash password using Bun's native bcrypt
    const password_hash = await Bun.password.hash(userData.password, {
      algorithm: 'bcrypt',
      cost: 10
    });

    const [user] = await sql`
      INSERT INTO users (
        first_name, 
        last_name, 
        email, 
        password_hash,
        phone
      )
      VALUES (
        ${userData.first_name},
        ${userData.last_name},
        ${userData.email.toLowerCase()},
        ${password_hash},
        ${userData.phone || null}
      )
      RETURNING id, first_name, last_name, email, phone, role, created_at
    `;

    // Create email verification token
    const verificationToken = await this.createEmailVerificationToken(user.id);

    return { user, verificationToken };
  }

  // Login user
  static async login(
    email: string,
    password: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const [user] = await sql`
      SELECT * FROM users WHERE email = ${email.toLowerCase()} AND is_active = TRUE
    `;

    if (!user) {
      await this.logLoginAttempt(email, false, ipAddress, userAgent, 'user_not_found');
      return { success: false, error: 'Invalid credentials' };
    }

    // Verify password
    const isValidPassword = await Bun.password.verify(password, user.password_hash);

    if (!isValidPassword) {
      await this.logLoginAttempt(email, false, ipAddress, userAgent, 'invalid_password');
      return { success: false, error: 'Invalid credentials' };
    }

    // Check if account is locked due to too many failed attempts
    const isLocked = await this.isAccountLocked(email, ipAddress);
    if (isLocked) {
      return { success: false, error: 'Account temporarily locked. Please try again later.' };
    }

    // Log successful login
    await this.logLoginAttempt(email, true, ipAddress, userAgent);

    // Update last login
    await sql`UPDATE users SET last_login = NOW() WHERE id = ${user.id}`;

    // Generate tokens
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    const accessToken = this.generateToken(tokenPayload);
    const refreshToken = this.generateRefreshToken(tokenPayload);

    // Create session
    const session = await this.createSession({
      user_id: user.id,
      session_token: accessToken,
      refresh_token: refreshToken,
      ip_address: ipAddress,
      user_agent: userAgent
    });

    // Remove password from response
    const { password_hash, ...userWithoutPassword } = user;

    return {
      success: true,
      user: userWithoutPassword,
      accessToken,
      refreshToken,
      session
    };
  }

  // Refresh access token
  static async refreshAccessToken(refreshToken: string) {
    const payload = this.verifyRefreshToken(refreshToken);

    if (!payload) {
      return { success: false, error: 'Invalid refresh token' };
    }

    // Verify session exists and is active
    const [session] = await sql`
      SELECT * FROM sessions 
      WHERE refresh_token = ${refreshToken} 
        AND is_active = TRUE 
        AND expires_at > NOW()
    `;

    if (!session) {
      return { success: false, error: 'Session expired or invalid' };
    }

    // Generate new access token
    const newAccessToken = this.generateToken({
      userId: payload.userId,
      email: payload.email,
      role: payload.role
    });

    // Update session
    await sql`
      UPDATE sessions 
      SET session_token = ${newAccessToken}, last_activity = NOW()
      WHERE id = ${session.id}
    `;

    return {
      success: true,
      accessToken: newAccessToken
    };
  }

  // Logout
  static async logout(sessionToken: string) {
    const result = await sql`
      UPDATE sessions 
      SET is_active = FALSE 
      WHERE session_token = ${sessionToken}
    `;
    return result.count > 0;
  }

  // Logout all sessions
  static async logoutAll(userId: number) {
    await sql`
      UPDATE sessions 
      SET is_active = FALSE 
      WHERE user_id = ${userId}
    `;
  }

  // Create session
  static async createSession(sessionData: {
    user_id: number;
    session_token: string;
    refresh_token?: string;
    ip_address?: string;
    user_agent?: string;
    device_info?: any;
  }): Promise<Session> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const [session] = await sql`
      INSERT INTO sessions (
        user_id,
        session_token,
        refresh_token,
        ip_address,
        user_agent,
        device_info,
        expires_at
      )
      VALUES (
        ${sessionData.user_id},
        ${sessionData.session_token},
        ${sessionData.refresh_token || null},
        ${sessionData.ip_address || null},
        ${sessionData.user_agent || null},
        ${sessionData.device_info ? JSON.stringify(sessionData.device_info) : null},
        ${expiresAt}
      )
      RETURNING *
    `;

    return session;
  }

  // Get active sessions
  static async getActiveSessions(userId: number) {
    const sessions = await sql`
      SELECT id, device_info, ip_address, last_activity, created_at
      FROM sessions
      WHERE user_id = ${userId} AND is_active = TRUE AND expires_at > NOW()
      ORDER BY last_activity DESC
    `;
    return sessions;
  }

  // Revoke session
  static async revokeSession(userId: number, sessionId: number) {
    const result = await sql`
      UPDATE sessions 
      SET is_active = FALSE 
      WHERE id = ${sessionId} AND user_id = ${userId}
    `;
    return result.count > 0;
  }

  // Log login attempt
  static async logLoginAttempt(
    email: string,
    success: boolean,
    ipAddress?: string,
    userAgent?: string,
    failureReason?: string
  ) {
    await sql`
      INSERT INTO login_attempts (email, ip_address, user_agent, success, failure_reason)
      VALUES (
        ${email.toLowerCase()},
        ${ipAddress || null},
        ${userAgent || null},
        ${success},
        ${failureReason || null}
      )
    `;
  }

  // Check if account is locked
  static async isAccountLocked(email: string, ipAddress?: string): Promise<boolean> {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const [result] = await sql`
      SELECT COUNT(*) as failed_attempts
      FROM login_attempts
      WHERE email = ${email.toLowerCase()}
        AND success = FALSE
        AND attempted_at > ${fifteenMinutesAgo}
    `;

    return parseInt(result.failed_attempts) >= 5;
  }

  // Create password reset token
  static async createPasswordResetToken(email: string): Promise<string | null> {
    const [user] = await sql`
      SELECT id FROM users WHERE email = ${email.toLowerCase()}
    `;

    if (!user) return null;

    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour

    await sql`
      INSERT INTO password_reset_tokens (user_id, token, expires_at)
      VALUES (${user.id}, ${token}, ${expiresAt})
    `;

    return token;
  }

  // Verify and use password reset token
  static async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const [resetToken] = await sql`
      SELECT * FROM password_reset_tokens
      WHERE token = ${token} 
        AND used = FALSE 
        AND expires_at > NOW()
    `;

    if (!resetToken) return false;

    const password_hash = await Bun.password.hash(newPassword, {
      algorithm: 'bcrypt',
      cost: 10
    });

    await sql`
      UPDATE users 
      SET password_hash = ${password_hash}, updated_at = NOW()
      WHERE id = ${resetToken.user_id}
    `;

    await sql`
      UPDATE password_reset_tokens 
      SET used = TRUE, used_at = NOW()
      WHERE id = ${resetToken.id}
    `;

    // Logout all sessions
    await this.logoutAll(resetToken.user_id);

    return true;
  }

  // Create email verification token
  static async createEmailVerificationToken(userId: number): Promise<string> {
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

    await sql`
      INSERT INTO email_verification_tokens (user_id, token, expires_at)
      VALUES (${userId}, ${token}, ${expiresAt})
    `;

    return token;
  }

  // Verify email
  static async verifyEmail(token: string): Promise<boolean> {
    const [verificationToken] = await sql`
      SELECT * FROM email_verification_tokens
      WHERE token = ${token} 
        AND verified = FALSE 
        AND expires_at > NOW()
    `;

    if (!verificationToken) return false;

    await sql`
      UPDATE users 
      SET email_verified = TRUE, updated_at = NOW()
      WHERE id = ${verificationToken.user_id}
    `;

    await sql`
      UPDATE email_verification_tokens 
      SET verified = TRUE, verified_at = NOW()
      WHERE id = ${verificationToken.id}
    `;

    return true;
  }

  // Change password (authenticated user)
  static async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    const [user] = await sql`
      SELECT password_hash FROM users WHERE id = ${userId}
    `;

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const isValidPassword = await Bun.password.verify(currentPassword, user.password_hash);

    if (!isValidPassword) {
      return { success: false, error: 'Current password is incorrect' };
    }

    const password_hash = await Bun.password.hash(newPassword, {
      algorithm: 'bcrypt',
      cost: 10
    });

    await sql`
      UPDATE users 
      SET password_hash = ${password_hash}, updated_at = NOW()
      WHERE id = ${userId}
    `;

    return { success: true };
  }
}

// OAuth Model
export class OAuthModel {
  // Link OAuth account
  static async linkAccount(accountData: {
    user_id: number;
    provider: OAuthAccount['provider'];
    provider_account_id: string;
    access_token?: string;
    refresh_token?: string;
    profile_data?: any;
  }) {
    const [account] = await sql`
      INSERT INTO oauth_accounts ${sql(accountData)}
      ON CONFLICT (provider, provider_account_id) 
      DO UPDATE SET 
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        profile_data = EXCLUDED.profile_data,
        updated_at = NOW()
      RETURNING *
    `;
    return account;
  }

  // Find or create user from OAuth
  static async findOrCreateFromOAuth(
    provider: OAuthAccount['provider'],
    providerAccountId: string,
    profileData: {
      email: string;
      first_name: string;
      last_name: string;
      avatar_url?: string;
    }
  ) {
    const [oauthAccount] = await sql`
      SELECT * FROM oauth_accounts 
      WHERE provider = ${provider} AND provider_account_id = ${providerAccountId}
    `;

    if (oauthAccount) {
      const [user] = await sql`
        SELECT id, first_name, last_name, email, role, avatar_url
        FROM users WHERE id = ${oauthAccount.user_id}
      `;
      return { user, isNewUser: false };
    }

    // Create new user
    const [user] = await sql`
      INSERT INTO users (
        first_name, 
        last_name, 
        email, 
        password_hash,
        avatar_url,
        email_verified
      )
      VALUES (
        ${profileData.first_name},
        ${profileData.last_name},
        ${profileData.email.toLowerCase()},
        ${await Bun.password.hash(crypto.randomUUID(), { algorithm: 'bcrypt', cost: 10 })},
        ${profileData.avatar_url || null},
        TRUE
      )
      RETURNING id, first_name, last_name, email, role, avatar_url
    `;

    // Link OAuth account
    await this.linkAccount({
      user_id: user.id,
      provider,
      provider_account_id: providerAccountId,
      profile_data: profileData
    });

    return { user, isNewUser: true };
  }

  // Get user's OAuth accounts
  static async getUserAccounts(userId: number) {
    const accounts = await sql`
      SELECT provider, provider_account_id, created_at
      FROM oauth_accounts
      WHERE user_id = ${userId}
    `;
    return accounts;
  }

  // Unlink OAuth account
  static async unlinkAccount(userId: number, provider: string) {
    const result = await sql`
      DELETE FROM oauth_accounts
      WHERE user_id = ${userId} AND provider = ${provider}
    `;
    return result.count > 0;
  }
}