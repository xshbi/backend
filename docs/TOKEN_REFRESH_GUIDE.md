# JWT Token Refresh Guide

## Overview

The API uses JWT (JSON Web Tokens) for authentication with the following configuration:

- **Access Token Expiry**: 15 minutes
- **Refresh Token Expiry**: 7 days

When your access token expires, you'll receive a `401 Unauthorized` response with the message "Token expired". Instead of requiring the user to log in again, you can use the **refresh token** to obtain a new access token.

---

## How It Works

### 1. Login Response

When a user logs in (or registers), they receive both tokens:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 6,
      "email": "vendor@example.com",
      "role": "vendor"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Token Storage

**Frontend should store BOTH tokens securely:**

- `accessToken`: Used for API requests (expires in 15 minutes)
- `refreshToken`: Used to get a new access token (expires in 7 days)

**Recommended Storage:**

- **LocalStorage** (easier but less secure)
- **Secure HttpOnly Cookies** (more secure but requires backend changes)
- **SessionStorage** (cleared on tab close)

### 3. Handling Token Expiry

When you receive a `401` error with `"error": "Token expired"`:

#### Step 1: Detect Expired Token

```javascript
// Example error response
{
  "success": false,
  "error": "Token expired",
  "message": "Your session has expired. Please login again."
}
```

#### Step 2: Call Refresh Token Endpoint

**Endpoint:** `POST /api/auth/refresh`

**Request:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (Success):**

```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response (Failure - Refresh Token Also Expired):**

```json
{
  "success": false,
  "error": "Token refresh failed",
  "message": "Invalid refresh token"
}
```

#### Step 3: Retry Original Request

After successfully refreshing the token, update your stored `accessToken` and retry the original API request.

---

## Implementation Examples

### Frontend (React/TypeScript)

#### 1. Token Storage Utilities

```typescript
// utils/auth.ts
export const getAccessToken = () => localStorage.getItem('accessToken');
export const getRefreshToken = () => localStorage.getItem('refreshToken');
export const setAccessToken = (token: string) => localStorage.setItem('accessToken', token);
export const setRefreshToken = (token: string) => localStorage.setItem('refreshToken', token);
export const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};
```

#### 2. API Client with Auto-Refresh

```typescript
// api/client.ts
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to add access token
apiClient.interceptors.request.use((config) => {
  const accessToken = getAccessToken();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is due to expired token
    if (
      error.response?.status === 401 &&
      error.response?.data?.error === 'Token expired' &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = getRefreshToken();
        
        if (!refreshToken) {
          // No refresh token - redirect to login
          clearTokens();
          window.location.href = '/login';
          return Promise.reject(error);
        }

        // Call refresh endpoint
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const newAccessToken = data.data.accessToken;
        setAccessToken(newAccessToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - redirect to login
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

#### 3. Login Handler

```typescript
// hooks/useAuth.ts
export const useAuth = () => {
  const login = async (email: string, password: string) => {
    const response = await fetch('http://localhost:8000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (data.success) {
      // Store both tokens
      setAccessToken(data.data.accessToken);
      setRefreshToken(data.data.refreshToken);
      return data.data.user;
    } else {
      throw new Error(data.message);
    }
  };

  return { login };
};
```

#### 4. Making API Requests

```typescript
// Using the configured apiClient
import apiClient from './api/client';

// Create product (will auto-refresh if token expires)
const createProduct = async (productData) => {
  const response = await apiClient.post('/admin/products', productData);
  return response.data;
};
```

---

### Frontend (Vanilla JavaScript)

```javascript
// Store tokens after login
function handleLoginSuccess(response) {
  localStorage.setItem('accessToken', response.data.accessToken);
  localStorage.setItem('refreshToken', response.data.refreshToken);
}

// API call with auto-refresh
async function apiCall(url, options = {}) {
  let accessToken = localStorage.getItem('accessToken');
  
  // Add access token to headers
  options.headers = {
    ...options.headers,
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  };

  let response = await fetch(url, options);
  let data = await response.json();

  // If token expired, refresh and retry
  if (response.status === 401 && data.error === 'Token expired') {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      window.location.href = '/login';
      return;
    }

    // Refresh token
    const refreshResponse = await fetch('http://localhost:8000/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    const refreshData = await refreshResponse.json();

    if (refreshData.success) {
      // Store new access token
      localStorage.setItem('accessToken', refreshData.data.accessToken);
      
      // Retry original request
      options.headers.Authorization = `Bearer ${refreshData.data.accessToken}`;
      response = await fetch(url, options);
      data = await response.json();
    } else {
      // Refresh failed - redirect to login
      localStorage.clear();
      window.location.href = '/login';
      return;
    }
  }

  return data;
}

// Usage example
async function createProduct(productData) {
  return await apiCall('http://localhost:8000/api/admin/products', {
    method: 'POST',
    body: JSON.stringify(productData)
  });
}
```

---

## Best Practices

### 1. **Always Store Both Tokens**

When the user logs in, store both `accessToken` and `refreshToken`.

### 2. **Automatic Token Refresh**

Implement automatic token refresh in your API client (as shown above) so users don't have to log in every 15 minutes.

### 3. **Handle Refresh Failure**

If the refresh token also expires (after 7 days), redirect the user to the login page.

### 4. **Secure Storage**

- Don't store tokens in plain text if dealing with sensitive data
- Consider using HttpOnly cookies for production apps
- Clear tokens on logout

### 5. **Token Lifecycle**

```
User Logs In
    ↓
Store accessToken + refreshToken
    ↓
Use accessToken for API calls
    ↓
Token expires after 15 minutes
    ↓
Use refreshToken to get new accessToken
    ↓
Continue using API
    ↓
After 7 days, refreshToken expires
    ↓
Redirect to login
```

---

## Quick Fix for Current Issue

**For your vendor who's getting the token expired error:**

### Option 1: Implement Token Refresh (Recommended)

Update your frontend code to automatically refresh the token when it expires (see implementation examples above).

### Option 2: Increase Token Expiry (Not Recommended for Production)

Edit `.env` file:

```bash
# Increase to 1 hour (not secure for production)
JWT_EXPIRES_IN=1h

# Or 1 day (very insecure)
JWT_EXPIRES_IN=1d
```

### Option 3: Re-login

Have the vendor log out and log back in to get fresh tokens.

---

## Testing Token Refresh

### Using Postman/Thunder Client

1. **Login**

   ```
   POST http://localhost:8000/api/auth/login
   Body: { "email": "vendor@example.com", "password": "password123" }
   ```

   Save both tokens from response.

2. **Wait 15 minutes** (or modify `.env` to `JWT_EXPIRES_IN=10s` for testing)

3. **Try Creating Product** (should fail)

   ```
   POST http://localhost:8000/api/admin/products
   Headers: Authorization: Bearer <expired_access_token>
   ```

4. **Refresh Token**

   ```
   POST http://localhost:8000/api/auth/refresh
   Body: { "refreshToken": "<your_refresh_token>" }
   ```

5. **Retry Creating Product** with new access token

---

## Summary

- **Access tokens expire in 15 minutes** by design for security
- **Refresh tokens last 7 days** and should be used to get new access tokens
- **Implement automatic token refresh** in your frontend to provide seamless user experience
- **The refresh endpoint is** `POST /api/auth/refresh` with body `{ "refreshToken": "..." }`

This is a standard OAuth2/JWT pattern used by most modern APIs (Google, GitHub, etc.).
