# Complete API Documentation

**Base URL:** `http://localhost:3000`

**Version:** 1.0.0  
**Last Updated:** 2026-02-02

---

## Table of Contents

1. [Authentication](#authentication)
2. [User & System](#user--system)
3. [Products](#products)
4. [Categories](#categories)
5. [Cart](#cart)
6. [Orders](#orders)
7. [Addresses](#addresses)
8. [Admin - Products](#admin---products)
9. [Admin - Vendors](#admin---vendors)
10. [Error Responses](#error-responses)

---

## Authentication

### Register User

**Endpoint:** `POST /api/auth/register`  
**Access:** Public

**Request Body:**

```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890"
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "email": "john@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "user"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "..."
  }
}
```

---

### Login

**Endpoint:** `POST /api/auth/login`  
**Access:** Public

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "userId": 1,
      "email": "john@example.com",
      "role": "user"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "..."
  }
}
```

---

### Refresh Token

**Endpoint:** `POST /api/auth/refresh`  
**Access:** Public

**Request Body:**

```json
{
  "refreshToken": "your-refresh-token"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "new-access-token"
  }
}
```

---

### Logout

**Endpoint:** `POST /api/auth/logout`  
**Access:** Private  
**Authorization:** `Bearer <token>`

**Response (200):**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### Logout All Devices

**Endpoint:** `POST /api/auth/logout-all`  
**Access:** Private  
**Authorization:** `Bearer <token>`

**Response (200):**

```json
{
  "success": true,
  "message": "Logged out from all devices successfully"
}
```

---

### Get Profile

**Endpoint:** `GET /api/auth/profile`  
**Access:** Private  
**Authorization:** `Bearer <token>`

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "user",
    "phone": "+1234567890",
    "created_at": "2026-02-02T..."
  }
}
```

---

### Get Active Sessions

**Endpoint:** `GET /api/auth/sessions`  
**Access:** Private  
**Authorization:** `Bearer <token>`

**Response (200):**

```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": 1,
        "ip_address": "192.168.1.1",
        "user_agent": "Mozilla/5.0...",
        "created_at": "2026-02-02T...",
        "last_activity": "2026-02-02T..."
      }
    ],
    "count": 1
  }
}
```

---

### Revoke Session

**Endpoint:** `DELETE /api/auth/sessions/:sessionId`  
**Access:** Private  
**Authorization:** `Bearer <token>`

**Response (200):**

```json
{
  "success": true,
  "message": "Session revoked successfully"
}
```

---

## User & System

### Health Check

**Endpoint:** `GET /health`  
**Access:** Public

**Response (200):**

```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2026-02-02T17:30:00.000Z"
}
```

---

### Get All Users

**Endpoint:** `GET /users`  
**Access:** Public

**Response (200):**

```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "id": 1,
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "user"
    }
  ]
}
```

---

## Products

### Get All Products

**Endpoint:** `GET /api/products`  
**Access:** Public

**Query Parameters:**

- `category` - Filter by category ID
- `min_price` - Minimum price
- `max_price` - Maximum price
- `search` - Search term
- `limit` - Results per page (default: 20)
- `offset` - Pagination offset

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Product Name",
      "description": "Product description",
      "price": 99.99,
      "stock": 100,
      "category_id": 1,
      "vendor_id": 2,
      "sku": "PROD-001",
      "image_url": "https://...",
      "is_active": true,
      "created_at": "2026-02-02T..."
    }
  ],
  "total": 100,
  "limit": 20,
  "offset": 0
}
```

---

### Get Product by ID

**Endpoint:** `GET /api/products/:id`  
**Access:** Public

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Product Name",
    "description": "Detailed description",
    "price": 99.99,
    "stock": 100,
    "category_id": 1,
    "vendor_id": 2,
    "sku": "PROD-001",
    "images": [...],
    "reviews_count": 5,
    "average_rating": 4.5,
    "created_at": "2026-02-02T..."
  }
}
```

---

### Get Product by Slug

**Endpoint:** `GET /api/products/slug/:slug`  
**Access:** Public

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Product Name",
    "slug": "product-name",
    "description": "..."
  }
}
```

---

### Get Product Reviews

**Endpoint:** `GET /api/products/:id/reviews`  
**Access:** Public

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "product_id": 1,
      "user_id": 2,
      "rating": 5,
      "comment": "Great product!",
      "created_at": "2026-02-02T..."
    }
  ]
}
```

---

### Get Related Products

**Endpoint:** `GET /api/products/:id/related`  
**Access:** Public

**Query Parameters:**

- `limit` - Number of related products (default: 5)

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "name": "Related Product",
      "price": 79.99
    }
  ]
}
```

---

### Create Product

**Endpoint:** `POST /api/products`  
**Access:** Private (Vendor or Admin)  
**Authorization:** `Bearer <token>`

**Request Body:**

```json
{
  "name": "New Product",
  "description": "Product description",
  "price": 99.99,
  "stock": 50,
  "category_id": 1,
  "sku": "PROD-002",
  "image_url": "https://..."
}
```

**Note:** `vendor_id` is auto-assigned for vendors

**Response (201):**

```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "id": 10,
    "name": "New Product",
    "price": 99.99
  }
}
```

---

### Update Product

**Endpoint:** `PUT /api/products/:id`  
**Access:** Private (Vendor or Admin)  
**Authorization:** `Bearer <token>`

**Request Body:**

```json
{
  "name": "Updated Product Name",
  "price": 89.99,
  "stock": 75
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {
    "id": 1,
    "name": "Updated Product Name",
    "price": 89.99
  }
}
```

---

### Delete Product

**Endpoint:** `DELETE /api/products/:id`  
**Access:** Private (Vendor or Admin)  
**Authorization:** `Bearer <token>`

**Response (200):**

```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

---

### Update Product Stock

**Endpoint:** `PATCH /api/products/:id/stock`  
**Access:** Private (Vendor or Admin)  
**Authorization:** `Bearer <token>`

**Request Body:**

```json
{
  "quantity": 25,
  "type": "add"
}
```

**Stock Types:**

- `add` - Add to current stock
- `reduce` - Subtract from stock
- `set` - Set to specific value

**Response (200):**

```json
{
  "success": true,
  "message": "Stock updated successfully",
  "data": {
    "id": 1,
    "stock": 125
  }
}
```

---

### Add Product Image

**Endpoint:** `POST /api/products/:id/images`  
**Access:** Private (Vendor or Admin)  
**Authorization:** `Bearer <token>`

**Request Body:**

```json
{
  "url": "https://example.com/image.jpg",
  "is_primary": false
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Image added successfully",
  "data": {
    "id": 1,
    "product_id": 1,
    "url": "https://..."
  }
}
```

---

### Add Product Review

**Endpoint:** `POST /api/products/:id/reviews`  
**Access:** Private  
**Authorization:** `Bearer <token>`

**Request Body:**

```json
{
  "rating": 5,
  "comment": "Excellent product!"
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Review added successfully",
  "data": {
    "id": 1,
    "product_id": 1,
    "user_id": 2,
    "rating": 5,
    "comment": "Excellent product!"
  }
}
```

---

## Categories

### Get All Categories

**Endpoint:** `GET /api/categories`  
**Access:** Public

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Electronics",
      "description": "Electronic devices and accessories",
      "slug": "electronics",
      "products_count": 50
    }
  ]
}
```

---

### Create Category

**Endpoint:** `POST /api/categories`  
**Access:** Private (Admin only)  
**Authorization:** `Bearer <token>`

**Request Body:**

```json
{
  "name": "New Category",
  "description": "Category description",
  "slug": "new-category"
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "id": 5,
    "name": "New Category",
    "slug": "new-category"
  }
}
```

---

## Cart

**Note:** All cart endpoints require authentication

### Get Cart

**Endpoint:** `GET /api/cart`  
**Access:** Private  
**Authorization:** `Bearer <token>`

**Response (200):**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "product_id": 1,
        "product_name": "Product Name",
        "quantity": 2,
        "price": 99.99,
        "subtotal": 199.98
      }
    ],
    "total": 199.98,
    "items_count": 2
  }
}
```

---

### Add to Cart

**Endpoint:** `POST /api/cart/add`  
**Access:** Private  
**Authorization:** `Bearer <token>`

**Request Body:**

```json
{
  "productId": "1",
  "quantity": 2
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Product added to cart",
  "data": {
    "product_id": 1,
    "quantity": 2
  }
}
```

---

### Reduce Quantity

**Endpoint:** `POST /api/cart/reduce`  
**Access:** Private  
**Authorization:** `Bearer <token>`

**Request Body:**

```json
{
  "productId": "1"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Quantity reduced",
  "data": {
    "product_id": 1,
    "quantity": 1
  }
}
```

---

### Update Quantity

**Endpoint:** `PUT /api/cart/update`  
**Access:** Private  
**Authorization:** `Bearer <token>`

**Request Body:**

```json
{
  "productId": "1",
  "quantity": 5
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Quantity updated",
  "data": {
    "product_id": 1,
    "quantity": 5
  }
}
```

---

### Remove from Cart

**Endpoint:** `DELETE /api/cart/remove/:productId`  
**Access:** Private  
**Authorization:** `Bearer <token>`

**Response (200):**

```json
{
  "success": true,
  "message": "Product removed from cart"
}
```

---

### Clear Cart

**Endpoint:** `DELETE /api/cart/clear`  
**Access:** Private  
**Authorization:** `Bearer <token>`

**Response (200):**

```json
{
  "success": true,
  "message": "Cart cleared"
}
```

---

### Apply Coupon

**Endpoint:** `POST /api/cart/coupon`  
**Access:** Private  
**Authorization:** `Bearer <token>`

**Request Body:**

```json
{
  "couponCode": "SAVE20"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Coupon applied successfully",
  "data": {
    "discount": 20.00,
    "new_total": 179.98
  }
}
```

---

## Orders

**Note:** All order endpoints require authentication

### Create Order (Checkout)

**Endpoint:** `POST /api/orders/checkout`  
**Access:** Private  
**Authorization:** `Bearer <token>`

**Request Body:**

```json
{
  "address_id": 1,
  "payment_method": "credit_card",
  "notes": "Please deliver before 5 PM"
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "order_id": 1,
    "total": 199.98,
    "status": "pending",
    "created_at": "2026-02-02T..."
  }
}
```

---

### Get User Orders

**Endpoint:** `GET /api/orders`  
**Access:** Private  
**Authorization:** `Bearer <token>`

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "order_number": "ORD-001",
      "total": 199.98,
      "status": "delivered",
      "created_at": "2026-01-15T...",
      "items_count": 3
    }
  ]
}
```

---

## Addresses

**Note:** All address endpoints require authentication

### Get Addresses

**Endpoint:** `GET /api/addresses`  
**Access:** Private  
**Authorization:** `Bearer <token>`

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "postal_code": "10001",
      "country": "USA",
      "is_default": true
    }
  ]
}
```

---

### Create Address

**Endpoint:** `POST /api/addresses`  
**Access:** Private  
**Authorization:** `Bearer <token>`

**Request Body:**

```json
{
  "street": "456 Oak Ave",
  "city": "Los Angeles",
  "state": "CA",
  "postal_code": "90001",
  "country": "USA",
  "is_default": false
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Address created successfully",
  "data": {
    "id": 2,
    "street": "456 Oak Ave",
    "city": "Los Angeles"
  }
}
```

---

### Delete Address

**Endpoint:** `DELETE /api/addresses/:id`  
**Access:** Private  
**Authorization:** `Bearer <token>`

**Response (200):**

```json
{
  "success": true,
  "message": "Address deleted successfully"
}
```

---

## Admin - Products

**Note:** All admin endpoints require admin role

### Create Product (Admin)

**Endpoint:** `POST /api/admin/products`  
**Access:** Admin only  
**Authorization:** `Bearer <admin-token>`

**Request Body:**

```json
{
  "name": "Admin Product",
  "description": "Created by admin",
  "price": 149.99,
  "stock": 200,
  "category_id": 1,
  "vendor_id": 2,
  "sku": "ADM-001"
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "id": 20,
    "name": "Admin Product"
  }
}
```

---

### Get All Products (Admin)

**Endpoint:** `GET /api/admin/products`  
**Access:** Admin only  
**Authorization:** `Bearer <admin-token>`

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Product",
      "price": 99.99,
      "stock": 100,
      "vendor_id": 2,
      "is_active": true,
      "flagged": false
    }
  ]
}
```

---

### Delete Product (Admin)

**Endpoint:** `DELETE /api/admin/products/:id`  
**Access:** Admin only  
**Authorization:** `Bearer <admin-token>`

**Response (200):**

```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

---

### Flag Product

**Endpoint:** `POST /api/admin/products/:id/flag`  
**Access:** Admin only  
**Authorization:** `Bearer <admin-token>`

**Request Body:**

```json
{
  "reason": "Quality issue",
  "flagged": true
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Product flagged successfully"
}
```

---

### Create Product (Alt Route)

**Endpoint:** `POST /api/admin-products`  
**Access:** Admin only  
**Authorization:** `Bearer <admin-token>`

Same as `POST /api/admin/products`

---

### Update Stock (Alt Route)

**Endpoint:** `PATCH /api/admin-products/:id/stock`  
**Access:** Admin only  
**Authorization:** `Bearer <admin-token>`

**Request Body:**

```json
{
  "quantity": 100,
  "type": "set"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Stock updated successfully",
  "data": {
    "id": 1,
    "stock": 100
  }
}
```

---

### Delete Product (Alt Route)

**Endpoint:** `DELETE /api/admin-products/:id`  
**Access:** Admin only  
**Authorization:** `Bearer <admin-token>`

Same as `DELETE /api/admin/products/:id`

---

## Admin - Vendors

### Create Vendor

**Endpoint:** `POST /api/admin/vendors`  
**Access:** Admin only  
**Authorization:** `Bearer <admin-token>`

**Request Body:**

```json
{
  "email": "vendor@store.com",
  "password": "secure123",
  "name": "John Vendor",
  "phone": "+1234567890",
  "address": "789 Business Blvd",
  "businessName": "John's Store",
  "businessDescription": "Quality products"
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Vendor created successfully",
  "data": {
    "id": 5,
    "email": "vendor@store.com",
    "role": "vendor"
  }
}
```

---

### Get All Vendors

**Endpoint:** `GET /api/admin/vendors`  
**Access:** Admin only  
**Authorization:** `Bearer <admin-token>`

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "email": "vendor@example.com",
      "name": "Vendor Name",
      "businessName": "Business",
      "phone": "+1234567890",
      "role": "vendor",
      "isActive": true,
      "productsCount": 15,
      "created_at": "2026-01-01T..."
    }
  ]
}
```

---

### Delete Vendor

**Endpoint:** `DELETE /api/admin/vendors/:id`  
**Access:** Admin only  
**Authorization:** `Bearer <admin-token>`

**Response (200):**

```json
{
  "success": true,
  "message": "Vendor deleted successfully"
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "error": "Bad Request",
  "message": "Invalid or missing parameters"
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

### 403 Forbidden

```json
{
  "success": false,
  "error": "Forbidden",
  "message": "Insufficient permissions"
}
```

### 404 Not Found

```json
{
  "success": false,
  "error": "Not Found",
  "message": "Resource not found"
}
```

### 409 Conflict

```json
{
  "success": false,
  "error": "Conflict",
  "message": "Resource already exists"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

---

## Authentication Header Format

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Rate Limiting

Currently no rate limiting is implemented. Consider implementing rate limiting for production.

---

## CORS

CORS is configured to allow requests from your frontend application.

---

## Notes

1. **Timestamps:** All timestamps are in ISO 8601 format (UTC)
2. **IDs:** All IDs are integers
3. **Prices:** Prices are decimal numbers (e.g., 99.99)
4. **Roles:** Available roles are: `user`, `vendor`, `admin`
5. **Token Expiry:** Access tokens expire after a set duration (check your backend config)

---

**Documentation Version:** 1.0.0  
**API Base URL:** <http://localhost:3000>  
**Backend Port:** 3000 (default) or from PORT environment variable
