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

---

## 🗄️ Database as the Backbone — How Schema Changes Ripple Through the Entire Backend

This project taught me one of the most important lessons in backend development: **the database schema is not just storage — it is the contract your entire application is built on.** Every table column, data type, constraint, and relationship directly shapes the TypeScript models, controller logic, middleware behavior, and API responses.

### The Schema-to-Server Chain

Here's how a single schema decision flows all the way through the stack:

```
PostgreSQL Schema (setup.sql)
        ↓
  DB Types / Models (src/models/)
        ↓
  Controller Logic (src/controller/)
        ↓
  Middleware & Auth (src/middleware/)
        ↓
  Route Responses (src/routes/)
        ↓
  API Response Shape (JSON sent to client)
```

### Real Examples from This Project

#### 1. The `users` Table Defines Your Entire Auth System

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'customer',
  is_active BOOLEAN DEFAULT true,
  failed_login_attempts INT DEFAULT 0,
  locked_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

Every single column here has a downstream effect:

- **`role`** — Adding or renaming a role (e.g., `'customer'` → `'user'`) breaks `requireAdmin()` in `auth.middleware.ts` and every RBAC check across all routes. You must update middleware, TypeScript types, and any seeded data simultaneously.
- **`failed_login_attempts` + `locked_until`** — These two columns *are* the account lockout feature. Remove them and the lockout logic in `auth.controller.ts` collapses. Change their types and the comparison logic breaks silently.
- **`is_active`** — Used in login validation. If you rename it to `active` or `enabled`, every query that checks `WHERE is_active = true` fails — no error at compile time, just silent auth failures at runtime.
- **`email UNIQUE NOT NULL`** — Enforces uniqueness at the DB layer. If you dropped this constraint, duplicate accounts could be created and JWT payloads would become ambiguous (same email, different IDs).

#### 2. The `sessions` Table Controls Token Lifecycle

```sql
CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  refresh_token TEXT NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

- **`ON DELETE CASCADE`** — This single clause means deleting a user automatically removes all their sessions. Without it, orphaned session rows would accumulate and old refresh tokens could theoretically be replayed even after account deletion.
- **`expires_at`** — The refresh token expiry check in the controller queries this column. Change its type from `TIMESTAMP` to `BIGINT` (Unix epoch) and the comparison `WHERE expires_at > NOW()` silently breaks.
- **`is_active`** — Used for soft session revocation (logout without deletion). Renaming this column or removing it means `/auth/logout` and `/auth/logout-all` stop working without any compile-time warning.
- **`ip_address` / `user_agent`** — Optional but changing their `VARCHAR` sizes can cause silent truncation on long user-agent strings, leading to sessions that can't be matched on subsequent requests.

#### 3. Column Type Mismatches Break TypeScript Models Silently

When a PostgreSQL column type doesn't match what the TypeScript model expects, `pg` often performs implicit coercion — and when it doesn't, you get runtime crashes instead of type errors.

| Schema Column | If Changed To | Effect on Backend |
|---|---|---|
| `id SERIAL` | `UUID` | All `WHERE id = $1` queries with integer params break; foreign keys cascade into chaos |
| `role VARCHAR(50)` | `ENUM type` | Requires migration + updating every INSERT/UPDATE that sets role |
| `locked_until TIMESTAMP` | `locked_until_ms BIGINT` | Date comparison logic in controller must be rewritten |
| `failed_login_attempts INT` | removed | Account lockout feature silently stops working |

#### 4. Adding a Column Requires Changes Everywhere

Say you add `profile_picture_url TEXT` to the `users` table. This cascades into:

1. **`auth.model.ts`** — Add the field to the `User` interface
2. **`auth.controller.ts`** — Include it in `SELECT` queries and registration logic
3. **`auth.routes.ts`** — Optionally expose it in the registration body schema
4. **`/auth/profile` response** — The API now returns a new field; frontend consumers must handle it
5. **`setup.sql`** — The migration must be tracked and re-run on all environments

Miss any one of these and you either get `undefined` in responses, TypeScript errors, or a field that exists in the DB but is never surfaced to the API.

### Key Lessons Learned

**Schema is the single source of truth.** The database doesn't just store data — it defines what data *can exist*. Every business rule you can express as a constraint (UNIQUE, NOT NULL, CHECK, FK) is a rule you don't have to duplicate and maintain in application code.

**Naming is a contract.** Column names flow directly into SQL query strings, TypeScript interfaces, and JSON response keys. Renaming a column without updating all three layers causes subtle, hard-to-debug failures.

**Constraints protect your business logic.** The `UNIQUE` on `email`, the `ON DELETE CASCADE` on sessions, the `DEFAULT false` on `is_active` — these aren't just nice-to-haves. They're what prevents duplicate accounts, orphaned tokens, and silent data corruption when something goes wrong upstream.

**Migrations are not optional.** Every schema change is a breaking change until proven otherwise. This project reinforced the habit of treating `setup.sql` as a versioned artifact — not something to edit casually.

---

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

> ⚠️ **IMPORTANT:** Change the JWT secrets in production! Use strong, randomly generated strings.

### 3. Setup Database

```bash
psql -U postgres -d postgres -f setup.sql
```

### 4. Run the Application

```bash
# Development (hot reload)
bun run dev

# Production
bun run build
bun start
```

The server will start at `http://localhost:8000`

---

## 🔐 Authentication System

### Security Features

- Secure password hashing (bcrypt)
- JWT access tokens — short-lived (15 minutes)
- Refresh tokens — long-lived (7 days)
- Account lockout after 5 failed login attempts
- Session tracking with IP and user agent
- Multi-device support
- Role-based access control

### Quick Start

**Register:**
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"first_name":"John","last_name":"Doe","email":"john@example.com","password":"securepass123"}'
```

**Login:**
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"securepass123"}'
```

**Access protected route:**
```bash
curl -X GET http://localhost:8000/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Complete Docs

- **[JWT Authentication Guide](JWT_AUTH_GUIDE.md)**
- **[Implementation Summary](AUTH_IMPLEMENTATION_SUMMARY.md)**
- **[Postman Collection](JWT_Auth_Postman_Collection.json)**

---

## 📍 API Endpoints

### Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API information |
| GET | `/health` | Health check |
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login user |
| POST | `/auth/refresh` | Refresh access token |

### Protected (Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/profile` | Get current user profile |
| GET | `/auth/sessions` | Get active sessions |
| POST | `/auth/logout` | Logout current session |
| POST | `/auth/logout-all` | Logout all sessions |
| DELETE | `/auth/sessions/:id` | Revoke specific session |

### Example Responses

**Success:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { "id": 1, "first_name": "John", "email": "john@example.com", "role": "customer" },
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci...",
    "expiresIn": "15m"
  }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Invalid credentials",
  "message": "Email or password is incorrect"
}
```

---

## 📁 Project Structure

```
webapp/
├── src/
│   ├── index.ts                # Main application file
│   ├── controller/
│   │   └── auth.controller.ts  # Authentication logic
│   ├── middleware/
│   │   └── auth.middleware.ts  # JWT middleware & RBAC
│   ├── routes/
│   │   ├── auth.routes.ts      # Auth endpoints
│   │   └── user.routes.ts      # User endpoints
│   ├── models/
│   │   ├── auth.model.ts       # Auth models
│   │   └── user.model.ts       # User models
│   ├── db/
│   │   └── db.ts               # Database connection
│   └── tests/
│       └── auth.test.ts        # Auth tests
├── .env
├── .env.example
├── setup.sql                   # Database setup script
├── test-auth.ps1
├── test-auth.sh
├── JWT_Auth_Postman_Collection.json
├── JWT_AUTH_GUIDE.md
├── AUTH_IMPLEMENTATION_SUMMARY.md
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🔒 Security Best Practices

### Production Checklist

- [ ] Change default JWT secrets to strong random strings
- [ ] Use HTTPS (never transmit tokens over HTTP)
- [ ] Set appropriate CORS policies
- [ ] Enable rate limiting
- [ ] Implement request logging
- [ ] Regular security audits
- [ ] Keep dependencies updated

### Password & Token Rules

- Minimum 6 characters, bcrypt with cost factor 10
- Access tokens: 15 minutes | Refresh tokens: 7 days
- Tokens stored in DB sessions with revocation support

---

## 🎯 Using Auth in Your Code

### Protect a Route

```typescript
import { authMiddleware } from './middleware/auth.middleware';

app.get('/protected', async (context) => {
  const authResult = await authMiddleware(context);
  if (authResult) return authResult;
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
  return { message: 'Admin dashboard' };
});
```

---

## 📦 Dependencies

**Production:** `elysia`, `postgres` / `pg`, `jsonwebtoken`, `dotenv`

**Development:** `@types/bun`, `@types/jsonwebtoken`, `typescript`, `prettier`

---

## 🛠️ Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start dev server with hot reload |
| `bun start` | Start production server |
| `bun run build` | Build for production |
| `bun run typecheck` | TypeScript type checking |
| `bun run format` | Format with Prettier |
| `bun test` | Run tests |

---

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Feel free to open a Pull Request.

---

**Built with ❤️ using Bun, Elysia, and PostgreSQL**
