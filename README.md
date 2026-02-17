# Elysia + PostgreSQL API with JWT Authentication 🔐

A modern REST API built with Elysia and PostgreSQL using Bun runtime, featuring complete JWT authentication.

## 🚀 Features

- ⚡ Fast Bun runtime
- 🦊 Elysia web framework
- 🐘 PostgreSQL database integration
- 🔐 **JWT Authentication System**
- 🛡️ **Role-Based Access Control (RBAC)**
- 🔄 **Token Refresh Mechanism**
- 📊 **Session Management**
- 🚨 **Account Lockout Protection**
- 🔄 Hot reload in development
- 🎯 TypeScript support
- 🛡️ Error handling

## 📋 Prerequisites

- [Bun](https://bun.sh) installed
- PostgreSQL server running locally or remotely

## 🔧 Setup

### 1. Install Dependencies

```bash
bun install
```

### 2. Configure Environment Variables

Update `.env` file with your PostgreSQL credentials and JWT secrets:

```env
PORT=8000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=postgres

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production-min-32-chars
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
```

**⚠️ IMPORTANT:** Change the JWT secrets in production! Use strong, randomly generated strings.

### 3. Setup Database

Run the SQL setup script to create tables:

```bash
# Using psql
psql -U postgres -d postgres -f setup.sql
```

### 4. Run the Application

**Development mode (with hot reload):**

```bash
bun run dev
```

**Production mode:**

```bash
bun run build
bun start
```

The server will start at `http://localhost:8000`

## 🔐 Authentication System

This API includes a complete JWT authentication system with the following features:

### Security Features

- ✅ Secure password hashing (bcrypt)
- ✅ JWT access tokens (short-lived, 15 minutes)
- ✅ Refresh tokens (long-lived, 7 days)
- ✅ Account lockout after 5 failed login attempts
- ✅ Session tracking with IP and user agent
- ✅ Multi-device support
- ✅ Role-based access control

### Quick Start Guide

1. **Register a new user:**

```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "password": "securepass123"
  }'
```

1. **Login:**

```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepass123"
  }'
```

1. **Access protected routes:**

```bash
curl -X GET http://localhost:8000/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 📚 Complete Documentation

- **[JWT Authentication Guide](JWT_AUTH_GUIDE.md)** - Complete API documentation
- **[Implementation Summary](AUTH_IMPLEMENTATION_SUMMARY.md)** - Quick reference
- **[Postman Collection](JWT_Auth_Postman_Collection.json)** - Import into Postman

### 🧪 Testing

**PowerShell (Windows):**

```powershell
.\test-auth.ps1
```

**Bash (Linux/Mac):**

```bash
chmod +x test-auth.sh
./test-auth.sh
```

## 📍 API Endpoints

### Public Endpoints (No Authentication)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API information |
| GET | `/health` | Health check |
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login user |
| POST | `/auth/refresh` | Refresh access token |

### Protected Endpoints (Authentication Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/profile` | Get current user profile |
| GET | `/auth/sessions` | Get active sessions |
| POST | `/auth/logout` | Logout current session |
| POST | `/auth/logout-all` | Logout all sessions |
| DELETE | `/auth/sessions/:id` | Revoke specific session |

### Example Responses

**Register/Login Success:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "role": "customer"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "15m"
  }
}
```

**Error Response:**

```json
{
  "success": false,
  "error": "Invalid credentials",
  "message": "Email or password is incorrect"
}
```

## 🛠️ Available Scripts

- `bun run dev` - Start development server with hot reload
- `bun start` - Start production server
- `bun run build` - Build for production
- `bun run typecheck` - Run TypeScript type checking
- `bun run format` - Format code with Prettier
- `bun test` - Run tests

## 📁 Project Structure

```
webapp/
├── src/
│   ├── index.ts                    # Main application file
│   ├── controller/
│   │   └── auth.controller.ts      # Authentication logic
│   ├── middleware/
│   │   └── auth.middleware.ts      # JWT middleware & RBAC
│   ├── routes/
│   │   ├── auth.routes.ts          # Auth endpoints
│   │   └── user.routes.ts          # User endpoints
│   ├── models/
│   │   ├── auth.model.ts           # Auth models
│   │   └── user.model.ts           # User models
│   ├── db/
│   │   └── db.ts                   # Database connection
│   └── tests/
│       └── auth.test.ts            # Auth tests
├── .env                            # Environment variables
├── .env.example                    # Environment template
├── setup.sql                       # Database setup script
├── test-auth.ps1                   # PowerShell test script
├── test-auth.sh                    # Bash test script
├── JWT_Auth_Postman_Collection.json # Postman collection
├── JWT_AUTH_GUIDE.md               # Complete auth documentation
├── AUTH_IMPLEMENTATION_SUMMARY.md  # Quick reference
├── package.json                    # Dependencies and scripts
├── tsconfig.json                   # TypeScript configuration
└── README.md                       # This file
```

## 🔒 Security Best Practices

### Production Checklist

- [ ] Change default JWT secrets to strong random strings
- [ ] Use HTTPS in production (never transmit tokens over HTTP)
- [ ] Set appropriate CORS policies
- [ ] Enable rate limiting
- [ ] Implement request logging
- [ ] Regular security audits
- [ ] Keep dependencies updated
- [ ] Use environment-specific configurations

### Password Requirements

- Minimum 6 characters (configurable)
- Bcrypt hashing with cost factor 10
- No password stored in plain text

### Token Security

- Access tokens: Short-lived (15 minutes recommended)
- Refresh tokens: Long-lived (7 days recommended)
- Tokens stored in database sessions
- Automatic token expiration
- Session revocation support

## 🎯 Using Authentication in Your Code

### Protect a Route

```typescript
import { authMiddleware } from './middleware/auth.middleware';

app.get('/protected', async (context) => {
  const authResult = await authMiddleware(context);
  if (authResult) return authResult;
  
  // User is authenticated, access context.user
  return { message: `Hello ${context.user.email}!` };
});
```

### Role-Based Access

```typescript
import { authMiddleware, requireAdmin } from './middleware/auth.middleware';

app.get('/admin/dashboard', async (context) => {
  const authResult = await authMiddleware(context);
  if (authResult) return authResult;
  
  const roleResult = await requireAdmin(context);
  if (roleResult) return roleResult;
  
  // Only admins can access this
  return { message: 'Admin dashboard' };
});
```

## 🐘 PostgreSQL Connection

The app uses the `pg` library for PostgreSQL connections.

Connection string format:

```
postgres://username:password@host:port/database_name
```

## 📦 Dependencies

### Production

- `elysia` - Web framework
- `postgres` / `pg` - PostgreSQL client
- `jsonwebtoken` - JWT token generation/verification
- `dotenv` - Environment variables

### Development

- `@types/bun` - Bun TypeScript types
- `@types/jsonwebtoken` - JWT TypeScript types
- `typescript` - TypeScript compiler
- `prettier` - Code formatter

## 🧪 Testing Tools

- **Postman Collection** - Import `JWT_Auth_Postman_Collection.json`
- **PowerShell Script** - Run `.\test-auth.ps1`
- **Bash Script** - Run `./test-auth.sh`
- **Test File** - See `src/tests/auth.test.ts`

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For issues and questions:

1. Check the [JWT Authentication Guide](JWT_AUTH_GUIDE.md)
2. Review the [Implementation Summary](AUTH_IMPLEMENTATION_SUMMARY.md)
3. Open an issue on GitHub

---

**Built with ❤️ using Bun, Elysia, and PostgreSQL**
