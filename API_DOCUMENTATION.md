# Backend API Documentation

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: (Set via environment variable `VITE_API_URL`)

---

## 1. Authentication API (`/api/auth`)

### Public Routes

#### Register User

- **Endpoint**: `POST /api/auth/register`
- **Description**: Register a new user account
- **Access**: Public
- **Request Body**:

  ```json
  {
    "email": "string (required)",
    "password": "string (required)",
    "name": "string (optional)",
    "role": "customer|vendor|admin (optional, default: customer)"
  }
  ```

- **Response**:

  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "data": {
      "user": { "userId": number, "email": "string", "role": "string" },
      "accessToken": "string",
      "refreshToken": "string"
    }
  }
  ```

#### Login

- **Endpoint**: `POST /api/auth/login`
- **Description**: Login with email and password
- **Access**: Public
- **Request Body**:

  ```json
  {
    "email": "string (required)",
    "password": "string (required)"
  }
  ```

- **Response**:

  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "user": { "userId": number, "email": "string", "role": "string" },
      "accessToken": "string",
      "refreshToken": "string"
    }
  }
  ```

#### Refresh Token

- **Endpoint**: `POST /api/auth/refresh`
- **Description**: Refresh access token using refresh token
- **Access**: Public
- **Request Body**:

  ```json
  {
    "refreshToken": "string (required)"
  }
  ```

- **Response**:

  ```json
  {
    "success": true,
    "data": {
      "accessToken": "string"
    }
  }
  ```

### Protected Routes (Require Authentication)

#### Logout

- **Endpoint**: `POST /api/auth/logout`
- **Description**: Logout from current session
- **Access**: Private
- **Headers**: `Authorization: Bearer {accessToken}`
- **Response**:

  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```

#### Logout All Sessions

- **Endpoint**: `POST /api/auth/logout-all`
- **Description**: Logout from all devices
- **Access**: Private
- **Headers**: `Authorization: Bearer {accessToken}`
- **Response**:

  ```json
  {
    "success": true,
    "message": "Logged out from all devices"
  }
  ```

#### Get Profile

- **Endpoint**: `GET /api/auth/profile`
- **Description**: Get current user profile
- **Access**: Private
- **Headers**: `Authorization: Bearer {accessToken}`
- **Response**:

  ```json
  {
    "success": true,
    "data": {
      "userId": number,
      "email": "string",
      "name": "string",
      "role": "string"
    }
  }
  ```

#### Get Active Sessions

- **Endpoint**: `GET /api/auth/sessions`
- **Description**: Get all active sessions
- **Access**: Private
- **Headers**: `Authorization: Bearer {accessToken}`

#### Revoke Session

- **Endpoint**: `DELETE /api/auth/sessions/:sessionId`
- **Description**: Revoke a specific session
- **Access**: Private
- **Headers**: `Authorization: Bearer {accessToken}`

---

## 2. Products API (`/api/products`)

### Public Routes

#### Get All Products

- **Endpoint**: `GET /api/products`
- **Description**: Get all products with optional filters
- **Access**: Public
- **Query Parameters**:
  - `category_id`: Filter by category ID
  - `vendor_id`: Filter by vendor ID
  - `min_price`: Minimum price filter
  - `max_price`: Maximum price filter
  - `search`: Search term
  - `sort`: Sort by (price_asc, price_desc, name_asc, name_desc)
  - `limit`: Results per page
  - `offset`: Pagination offset
- **Response**:

  ```json
  {
    "success": true,
    "data": [
      {
        "id": number,
        "name": "string",
        "slug": "string",
        "description": "string",
        "price": "decimal",
        "stock_quantity": number,
        "category_id": number,
        "vendor_id": number,
        "sku": "string",
        "meta_keywords": "string",
        "meta_description": "string"
      }
    ]
  }
  ```

#### Get Product by ID

- **Endpoint**: `GET /api/products/:id`
- **Description**: Get product details by ID
- **Access**: Public
- **Response**: Product object

#### Get Product by Slug

- **Endpoint**: `GET /api/products/slug/:slug`
- **Description**: Get product details by slug
- **Access**: Public
- **Response**: Product object

#### Get Product Reviews

- **Endpoint**: `GET /api/products/:id/reviews`
- **Description**: Get reviews for a specific product
- **Access**: Public
- **Response**:

  ```json
  {
    "success": true,
    "data": [
      {
        "id": number,
        "product_id": number,
        "user_id": number,
        "rating": number,
        "comment": "string",
        "created_at": "timestamp"
      }
    ]
  }
  ```

#### Get Related Products

- **Endpoint**: `GET /api/products/:id/related`
- **Description**: Get related products
- **Access**: Public
- **Query Parameters**: `limit` (default: 5)

### Protected Routes (Vendor/Admin Only)

#### Create Product

- **Endpoint**: `POST /api/products`
- **Description**: Create a new product
- **Access**: Private (Vendor or Admin)
- **Headers**: `Authorization: Bearer {accessToken}`
- **Request Body**:

  ```json
  {
    "name": "string (required)",
    "description": "string",
    "price": "number (required)",
    "stock_quantity": "number (required)",
    "category_id": "number (required)",
    "vendor_id": "number (auto-assigned for vendors)",
    "sku": "string (required)",
    "slug": "string (required)",
    "meta_keywords": "string",
    "meta_description": "string"
  }
  ```

#### Update Product

- **Endpoint**: `PUT /api/products/:id`
- **Description**: Update product details
- **Access**: Private (Vendor or Admin)
- **Headers**: `Authorization: Bearer {accessToken}`
- **Request Body**: Same as Create Product

#### Delete Product

- **Endpoint**: `DELETE /api/products/:id`
- **Description**: Delete a product
- **Access**: Private (Vendor or Admin)
- **Headers**: `Authorization: Bearer {accessToken}`

#### Update Product Stock

- **Endpoint**: `PATCH /api/products/:id/stock`
- **Description**: Update product stock quantity
- **Access**: Private (Vendor or Admin)
- **Headers**: `Authorization: Bearer {accessToken}`
- **Request Body**:

  ```json
  {
    "stock_quantity": number
  }
  ```

#### Add Product Image

- **Endpoint**: `POST /api/products/:id/images`
- **Description**: Add an image to a product
- **Access**: Private (Vendor or Admin)
- **Headers**: `Authorization: Bearer {accessToken}`
- **Request Body**:

  ```json
  {
    "image_url": "string (required)",
    "is_primary": "boolean (optional)"
  }
  ```

#### Add Product Review

- **Endpoint**: `POST /api/products/:id/reviews`
- **Description**: Add a review to a product
- **Access**: Private (Authenticated users)
- **Headers**: `Authorization: Bearer {accessToken}`
- **Request Body**:

  ```json
  {
    "rating": "number (1-5, required)",
    "comment": "string (optional)"
  }
  ```

---

## 3. Categories API (`/api/categories`)

#### Get All Categories

- **Endpoint**: `GET /api/categories`
- **Description**: Get all product categories
- **Access**: Public
- **Response**:

  ```json
  {
    "success": true,
    "data": [
      {
        "id": number,
        "name": "string",
        "slug": "string",
        "description": "string"
      }
    ]
  }
  ```

#### Create Category

- **Endpoint**: `POST /api/categories`
- **Description**: Create a new category
- **Access**: Private (Admin only)
- **Headers**: `Authorization: Bearer {accessToken}`
- **Request Body**:

  ```json
  {
    "name": "string (required)",
    "slug": "string (required)",
    "description": "string (optional)"
  }
  ```

---

## 4. Cart API (`/api/cart`)

All cart routes require authentication.

#### Get Cart

- **Endpoint**: `GET /api/cart`
- **Description**: Get current user's cart
- **Access**: Private
- **Headers**: `Authorization: Bearer {accessToken}`
- **Response**:

  ```json
  {
    "success": true,
    "data": {
      "items": [
        {
          "product_id": number,
          "quantity": number,
          "product": { /* Product details */ }
        }
      ],
      "total": number
    }
  }
  ```

#### Add to Cart

- **Endpoint**: `POST /api/cart/add`
- **Description**: Add product to cart
- **Access**: Private
- **Headers**: `Authorization: Bearer {accessToken}`
- **Request Body**:

  ```json
  {
    "productId": "number (required)",
    "quantity": "number (optional, default: 1)"
  }
  ```

#### Reduce Quantity

- **Endpoint**: `POST /api/cart/reduce`
- **Description**: Reduce product quantity by 1
- **Access**: Private
- **Headers**: `Authorization: Bearer {accessToken}`
- **Request Body**:

  ```json
  {
    "productId": "number (required)"
  }
  ```

#### Update Quantity

- **Endpoint**: `PUT /api/cart/update`
- **Description**: Update product quantity
- **Access**: Private
- **Headers**: `Authorization: Bearer {accessToken}`
- **Request Body**:

  ```json
  {
    "productId": "number (required)",
    "quantity": "number (required)"
  }
  ```

#### Remove from Cart

- **Endpoint**: `DELETE /api/cart/remove/:productId`
- **Description**: Remove product from cart
- **Access**: Private
- **Headers**: `Authorization: Bearer {accessToken}`

#### Clear Cart

- **Endpoint**: `DELETE /api/cart/clear`
- **Description**: Clear entire cart
- **Access**: Private
- **Headers**: `Authorization: Bearer {accessToken}`

#### Apply Coupon

- **Endpoint**: `POST /api/cart/coupon`
- **Description**: Apply coupon code to cart
- **Access**: Private
- **Headers**: `Authorization: Bearer {accessToken}`
- **Request Body**:

  ```json
  {
    "couponCode": "string (required)"
  }
  ```

---

## 5. Orders API (`/api/orders`)

All order routes require authentication.

#### Checkout / Create Order

- **Endpoint**: `POST /api/orders/checkout`
- **Description**: Create order from cart
- **Access**: Private
- **Headers**: `Authorization: Bearer {accessToken}`
- **Request Body**:

  ```json
  {
    "shipping_address_id": "number (required)",
    "payment_method": "string (required)",
    "notes": "string (optional)"
  }
  ```

#### Get User Orders

- **Endpoint**: `GET /api/orders`
- **Description**: Get all orders for logged-in user
- **Access**: Private
- **Headers**: `Authorization: Bearer {accessToken}`
- **Response**:

  ```json
  {
    "success": true,
    "data": [
      {
        "id": number,
        "user_id": number,
        "total_amount": "decimal",
        "status": "string",
        "created_at": "timestamp",
        "items": [ /* Order items */ ]
      }
    ]
  }
  ```

#### Get Order Statistics

- **Endpoint**: `GET /api/orders/stats`
- **Description**: Get user's order statistics
- **Access**: Private
- **Headers**: `Authorization: Bearer {accessToken}`

#### Get Order by ID

- **Endpoint**: `GET /api/orders/:id`
- **Description**: Get specific order details
- **Access**: Private
- **Headers**: `Authorization: Bearer {accessToken}`

#### Cancel Order

- **Endpoint**: `POST /api/orders/:id/cancel`
- **Description**: Cancel an order
- **Access**: Private
- **Headers**: `Authorization: Bearer {accessToken}`

---

## 6. Vendor API (`/api/vendor`)

All vendor routes require authentication and vendor/admin role.

#### Get Vendor Profile

- **Endpoint**: `GET /api/vendor/profile`
- **Description**: Get vendor profile information
- **Access**: Private (Vendor/Admin)
- **Headers**: `Authorization: Bearer {accessToken}`
- **Response**:

  ```json
  {
    "success": true,
    "data": {
      "id": number,
      "name": "string",
      "email": "string",
      "phone": "string",
      "website": "string",
      "vendorCode": "string",
      "type": "string",
      "status": "string",
      "rating": number,
      "legalName": "string",
      "logoUrl": "string",
      "contactPersons": []
    }
  }
  ```

#### Create Vendor Profile

- **Endpoint**: `POST /api/vendor/profile`
- **Description**: Create vendor profile
- **Access**: Private (Vendor/Admin)
- **Headers**: `Authorization: Bearer {accessToken}`
- **Request Body**:

  ```json
  {
    "name": "string",
    "phone": "string",
    "website": "string",
    "vendorCode": "string",
    "type": "string",
    "legalName": "string",
    "logoUrl": "string"
  }
  ```

#### Update Vendor Profile

- **Endpoint**: `PUT /api/vendor/profile`
- **Description**: Update vendor profile
- **Access**: Private (Vendor/Admin)
- **Headers**: `Authorization: Bearer {accessToken}`
- **Request Body**: Same as Create Vendor Profile

#### Get Vendor Orders

- **Endpoint**: `GET /api/vendor/orders`
- **Description**: Get all orders for vendor's products
- **Access**: Private (Vendor/Admin)
- **Headers**: `Authorization: Bearer {accessToken}`

#### Get Vendor Statistics

- **Endpoint**: `GET /api/vendor/stats`
- **Description**: Get vendor statistics (sales, orders, etc.)
- **Access**: Private (Vendor/Admin)
- **Headers**: `Authorization: Bearer {accessToken}`

---

## 7. Address API (`/api/addresses`)

All address routes require authentication.

#### Get User Addresses

- **Endpoint**: `GET /api/addresses`
- **Description**: Get all addresses for logged-in user
- **Access**: Private
- **Headers**: `Authorization: Bearer {accessToken}`

#### Create Address

- **Endpoint**: `POST /api/addresses`
- **Description**: Create a new address
- **Access**: Private
- **Headers**: `Authorization: Bearer {accessToken}`
- **Request Body**:

  ```json
  {
    "address_line1": "string (required)",
    "address_line2": "string (optional)",
    "city": "string (required)",
    "state": "string (required)",
    "postal_code": "string (required)",
    "country": "string (required)",
    "is_default": "boolean (optional)"
  }
  ```

#### Delete Address

- **Endpoint**: `DELETE /api/addresses/:id`
- **Description**: Delete an address
- **Access**: Private
- **Headers**: `Authorization: Bearer {accessToken}`

---

## 8. Admin API (`/api/admin`)

All admin routes require authentication and admin role.

### Product Management

#### Create Product (Admin)

- **Endpoint**: `POST /api/admin/products`
- **Description**: Create a new product as admin
- **Access**: Private (Admin only)
- **Headers**: `Authorization: Bearer {accessToken}`

#### Delete Product (Admin)

- **Endpoint**: `DELETE /api/admin/products/:id`
- **Description**: Delete any product
- **Access**: Private (Admin only)
- **Headers**: `Authorization: Bearer {accessToken}`

#### Get All Products (Admin)

- **Endpoint**: `GET /api/admin/products`
- **Description**: Get all products (admin view)
- **Access**: Private (Admin only)
- **Headers**: `Authorization: Bearer {accessToken}`

#### Flag Product

- **Endpoint**: `POST /api/admin/products/:id/flag`
- **Description**: Flag a product for review
- **Access**: Private (Admin only)
- **Headers**: `Authorization: Bearer {accessToken}`
- **Request Body**:

  ```json
  {
    "reason": "string (required)",
    "status": "flagged|approved|rejected"
  }
  ```

### Vendor Management

#### Add Vendor

- **Endpoint**: `POST /api/admin/vendors`
- **Description**: Create a new vendor account
- **Access**: Private (Admin only)
- **Headers**: `Authorization: Bearer {accessToken}`
- **Request Body**:

  ```json
  {
    "email": "string (required)",
    "password": "string (required)",
    "name": "string (required)",
    "profile": { /* Vendor profile data */ }
  }
  ```

#### Delete Vendor

- **Endpoint**: `DELETE /api/admin/vendors/:id`
- **Description**: Delete a vendor account
- **Access**: Private (Admin only)
- **Headers**: `Authorization: Bearer {accessToken}`

#### Get All Vendors

- **Endpoint**: `GET /api/admin/vendors`
- **Description**: Get all vendors
- **Access**: Private (Admin only)
- **Headers**: `Authorization: Bearer {accessToken}`

---

## 9. Utility Routes

#### Upload Image (Utility)

- **Endpoint**: `POST /api/upload`
- **Description**: Upload an image file to Cloudinary
- **Access**: Private (Authenticated users)
- **Headers**: `Authorization: Bearer {accessToken}`
- **Request Body**: `multipart/form-data` with `file` field
- **Response**:

  ```json
  {
    "success": true,
    "url": "http://res.cloudinary.com/...",
    "public_id": "ecommerce_products/...",
    "message": "Image uploaded successfully"
  }
  ```

---

## 10. Utility Routes

#### Health Check

- **Endpoint**: `GET /health`
- **Description**: Check API and database health
- **Access**: Public
- **Response**:

  ```json
  {
    "status": "healthy|unhealthy",
    "database": "connected|disconnected",
    "timestamp": "ISO timestamp"
  }
  ```

#### Get All Users

- **Endpoint**: `GET /users`
- **Description**: Get all users (for testing)
- **Access**: Public (should be protected in production)

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information (in development only)"
}
```

### Common HTTP Status Codes

- `200 OK`: Success
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., duplicate email)
- `500 Internal Server Error`: Server error

---

## Authentication

Most protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer {accessToken}
```

### Token Lifecycle

1. **Access Token**: Short-lived (15 minutes), used for API requests
2. **Refresh Token**: Long-lived (7 days), used to refresh access tokens

### Refreshing Tokens

When access token expires, use `/api/auth/refresh` with refresh token to get a new access token.

---

## Rate Limiting

(To be implemented)

---

## Pagination

List endpoints support pagination via query parameters:

- `limit`: Number of results per page (default: 20, max: 100)
- `offset`: Number of results to skip (default: 0)

Response includes pagination metadata:

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": number,
    "limit": number,
    "offset": number,
    "hasMore": boolean
  }
}
```

---

## Version

API Version: **1.0.0**

Last Updated: **2026-02-17**
