# Order Management API Documentation

This document provides comprehensive documentation for all order-related endpoints, including user order management and admin order management features.

## Table of Contents

- [User Order Endpoints](#user-order-endpoints)
- [Admin Order Management](#admin-order-management)
- [Order Data Structures](#order-data-structures)
- [Examples](#examples)

---

## User Order Endpoints

### 1. Create Order (Checkout)

**Endpoint:** `POST /api/orders/checkout`  
**Authentication:** Required (JWT Token)  
**Description:** Creates a new order from the user's cart items

**Request Body:**

```json
{
  "shippingAddressId": 1,           // Optional - uses default if not provided
  "billingAddressId": 1,            // Optional - uses shipping address if not provided
  "shippingMethod": "express",       // Optional - defaults to "standard"
  "notes": "Please deliver before 5 PM",  // Optional customer notes
  "couponCode": "SAVE20"            // Optional coupon code
}
```

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "Order placed successfully",
  "data": {
    "order": {
      "id": 123,
      "order_number": "ORD-1704567890-123",
      "user_id": 5,
      "status": "pending",
      "payment_status": "pending",
      "subtotal": 1500.00,
      "tax_amount": 270.00,
      "shipping_amount": 0,
      "discount_amount": 300.00,
      "total_amount": 1470.00,
      "currency": "INR",
      "created_at": "2026-02-03T16:45:00Z"
    },
    "items": [
      {
        "id": 456,
        "order_id": 123,
        "product_id": 10,
        "product_name": "Wireless Headphones",
        "quantity": 2,
        "unit_price": 750.00,
        "total_price": 1500.00
      }
    ]
  }
}
```

---

### 2. Get User Orders

**Endpoint:** `GET /api/orders`  
**Authentication:** Required (JWT Token)  
**Description:** Retrieves all orders for the authenticated user

**Response (Success - 200):**

```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "order_number": "ORD-1704567890-123",
      "status": "delivered",
      "payment_status": "paid",
      "total_amount": 1470.00,
      "item_count": 2,
      "created_at": "2026-02-03T16:45:00Z"
    },
    {
      "id": 122,
      "order_number": "ORD-1704467890-456",
      "status": "shipped",
      "payment_status": "paid",
      "total_amount": 850.00,
      "item_count": 1,
      "created_at": "2026-02-01T10:30:00Z"
    }
  ]
}
```

---

### 3. Get Order Details

**Endpoint:** `GET /api/orders/:id`  
**Authentication:** Required (JWT Token)  
**Description:** Retrieves detailed information about a specific order including all items

**Parameters:**

- `id` (path parameter) - Order ID

**Response (Success - 200):**

```json
{
  "success": true,
  "data": {
    "id": 123,
    "order_number": "ORD-1704567890-123",
    "user_id": 5,
    "status": "delivered",
    "payment_status": "paid",
    "fulfillment_status": "fulfilled",
    "subtotal": 1500.00,
    "tax_amount": 270.00,
    "shipping_amount": 0,
    "discount_amount": 300.00,
    "total_amount": 1470.00,
    "currency": "INR",
    "shipping_name": "John Doe",
    "address_line1": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postal_code": "400001",
    "customer_notes": "Please deliver before 5 PM",
    "created_at": "2026-02-03T16:45:00Z",
    "delivered_at": "2026-02-05T14:30:00Z",
    "items": [
      {
        "id": 456,
        "order_id": 123,
        "product_id": 10,
        "product_name": "Wireless Headphones",
        "product_sku": "WH-001",
        "product_image_url": "https://example.com/headphones.jpg",
        "quantity": 2,
        "unit_price": 750.00,
        "total_price": 1500.00,
        "discount": 0,
        "tax": 270.00,
        "fulfillment_status": "fulfilled"
      }
    ],
    "statusHistory": [
      {
        "id": 1,
        "order_id": 123,
        "old_status": "shipped",
        "new_status": "delivered",
        "changed_by": 1,
        "created_at": "2026-02-05T14:30:00Z"
      }
    ]
  }
}
```

---

### 4. Get User Order Statistics

**Endpoint:** `GET /api/orders/stats`  
**Authentication:** Required (JWT Token)  
**Description:** Retrieves order statistics for the authenticated user

**Response (Success - 200):**

```json
{
  "success": true,
  "data": {
    "total_orders": 15,
    "delivered_orders": 12,
    "cancelled_orders": 2,
    "total_spent": 45670.00
  }
}
```

---

### 5. Cancel Order

**Endpoint:** `POST /api/orders/:id/cancel`  
**Authentication:** Required (JWT Token)  
**Description:** Cancels an order (only if status is pending or confirmed)

**Parameters:**

- `id` (path parameter) - Order ID

**Request Body:**

```json
{
  "reason": "Changed my mind"  // Optional cancellation reason
}
```

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "Order cancelled successfully",
  "data": {
    "id": 123,
    "status": "cancelled",
    "cancelled_at": "2026-02-03T18:00:00Z"
  }
}
```

---

## Admin Order Management

### 1. Get All Orders (Admin)

**Endpoint:** `GET /api/admin/orders`  
**Authentication:** Required (Admin JWT Token)  
**Description:** Retrieves all orders with filtering and search capabilities

**Query Parameters:**

- `status` - Filter by order status (pending, confirmed, processing, shipped, delivered, cancelled)
- `payment_status` - Filter by payment status (pending, paid, failed, refunded)
- `search` - Search by order number or user email
- `date_from` - Filter orders from this date (ISO format)
- `date_to` - Filter orders until this date (ISO format)
- `limit` - Number of results (default: 50)
- `offset` - Pagination offset (default: 0)

**Example Request:**

```
GET /api/admin/orders?status=pending&limit=20&offset=0
```

**Response (Success - 200):**

```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "order_number": "ORD-1704567890-123",
      "user_id": 5,
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "status": "pending",
      "payment_status": "pending",
      "total_amount": 1470.00,
      "created_at": "2026-02-03T16:45:00Z"
    }
  ],
  "filters": {
    "status": "pending",
    "limit": 20,
    "offset": 0
  }
}
```

---

### 2. Get Order Statistics (Admin)

**Endpoint:** `GET /api/admin/orders/statistics`  
**Authentication:** Required (Admin JWT Token)  
**Description:** Retrieves overall order statistics across all users

**Response (Success - 200):**

```json
{
  "success": true,
  "data": {
    "total_orders": 1543,
    "delivered_orders": 1205,
    "cancelled_orders": 138,
    "total_revenue": 4567890.00,
    "average_order_value": 2960.50
  }
}
```

---

### 3. Get User Orders (Admin)

**Endpoint:** `GET /api/admin/orders/user/:userId`  
**Authentication:** Required (Admin JWT Token)  
**Description:** Retrieves all orders for a specific user with their statistics

**Parameters:**

- `userId` (path parameter) - User ID

**Query Parameters:**

- `limit` - Number of results (default: 20)
- `offset` - Pagination offset (default: 0)

**Example Request:**

```
GET /api/admin/orders/user/5?limit=10&offset=0
```

**Response (Success - 200):**

```json
{
  "success": true,
  "data": {
    "userId": 5,
    "orders": [
      {
        "id": 123,
        "order_number": "ORD-1704567890-123",
        "status": "delivered",
        "payment_status": "paid",
        "total_amount": 1470.00,
        "item_count": 2,
        "created_at": "2026-02-03T16:45:00Z"
      }
    ],
    "statistics": {
      "total_orders": 15,
      "delivered_orders": 12,
      "cancelled_orders": 2,
      "total_spent": 45670.00
    }
  }
}
```

---

### 4. Update Order Status (Admin)

**Endpoint:** `PATCH /api/admin/orders/:id/status`  
**Authentication:** Required (Admin JWT Token)  
**Description:** Updates the status of an order

**Parameters:**

- `id` (path parameter) - Order ID

**Request Body:**

```json
{
  "status": "shipped",  // Required - new order status
  "notes": "Shipped via Express Delivery"  // Optional admin notes
}
```

**Valid Status Values:**

- `pending` - Order placed, awaiting confirmation
- `confirmed` - Order confirmed
- `processing` - Order is being prepared
- `shipped` - Order has been shipped
- `out_for_delivery` - Order is out for delivery
- `delivered` - Order delivered successfully
- `cancelled` - Order cancelled
- `returned` - Order returned
- `refunded` - Order refunded
- `failed` - Order failed

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "Order status updated successfully",
  "data": {
    "id": 123,
    "status": "shipped",
    "shipped_at": "2026-02-04T10:00:00Z",
    "updated_at": "2026-02-04T10:00:00Z"
  }
}
```

---

## Order Data Structures

### Order Object

```typescript
{
  id: number;
  order_number: string;           // Unique order number (e.g., "ORD-1704567890-123")
  user_id: number;
  status: string;                 // Order status
  payment_status: string;         // Payment status
  fulfillment_status: string;     // Fulfillment status
  subtotal: number;               // Order subtotal
  tax_amount: number;             // Tax amount
  shipping_amount: number;        // Shipping charges
  discount_amount: number;        // Total discount applied
  total_amount: number;           // Final total amount
  currency: string;               // Currency code (e.g., "INR", "USD")
  shipping_address_id: number;
  billing_address_id: number;
  shipping_method: string;
  tracking_number?: string;
  carrier?: string;
  coupon_code?: string;
  customer_notes?: string;
  created_at: Date;
  updated_at: Date;
  confirmed_at?: Date;
  shipped_at?: Date;
  delivered_at?: Date;
}
```

### Order Item Object

```typescript
{
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  product_image_url: string;
  quantity: number;               // Number of items ordered
  unit_price: number;             // Price per unit
  total_price: number;            // Total price (unit_price × quantity)
  discount: number;
  tax: number;
  fulfillment_status: string;     // Item fulfillment status
  created_at: Date;
}
```

---

## Examples

### Example 1: Admin Viewing What a User Ordered

**Request:**

```bash
GET /api/admin/orders/user/5
Authorization: Bearer <admin_jwt_token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "userId": 5,
    "orders": [
      {
        "id": 123,
        "order_number": "ORD-1704567890-123",
        "status": "delivered",
        "total_amount": 1470.00,
        "item_count": 2,
        "created_at": "2026-02-03T16:45:00Z"
      }
    ],
    "statistics": {
      "total_orders": 15,        // User ordered 15 times
      "delivered_orders": 12,
      "cancelled_orders": 2,
      "total_spent": 45670.00    // User spent total ₹45,670
    }
  }
}
```

### Example 2: Admin Viewing Order Details

**Request:**

```bash
GET /api/admin/orders
GET /api/orders/123  # Then get details of specific order
Authorization: Bearer <admin_jwt_token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 123,
    "order_number": "ORD-1704567890-123",
    "items": [
      {
        "product_name": "Wireless Headphones",
        "quantity": 2,              // User ordered 2 headphones
        "unit_price": 750.00,
        "total_price": 1500.00
      },
      {
        "product_name": "Phone Case",
        "quantity": 1,              // User ordered 1 phone case
        "unit_price": 350.00,
        "total_price": 350.00
      }
    ]
  }
}
```

### Example 3: Admin Managing Product Stock After Login

**Update Product Stock:**

```bash
PATCH /api/admin-products/10/stock
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "quantity": 50,
  "type": "add"    // Add 50 units to stock
}
```

**Reduce Stock:**

```bash
PATCH /api/admin-products/10/stock
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "quantity": 10,
  "type": "reduce"  // Reduce 10 units from stock
}
```

### Example 4: Complete Order Management Flow

1. **Admin checks all pending orders:**

```bash
GET /api/admin/orders?status=pending&limit=20
```

1. **Admin views order details to see what was ordered:**

```bash
GET /api/orders/123
```

1. **Admin updates order status:**

```bash
PATCH /api/admin/orders/123/status
{
  "status": "confirmed",
  "notes": "Order confirmed and being processed"
}
```

1. **Admin checks how much a specific user has ordered:**

```bash
GET /api/admin/orders/user/5
```

Response shows:

- List of all orders placed by user 5
- Total number of orders: 15
- Total amount spent: ₹45,670

---

## Error Responses

All endpoints may return the following error responses:

**401 Unauthorized:**

```json
{
  "success": false,
  "message": "User not authenticated"
}
```

**403 Forbidden:**

```json
{
  "success": false,
  "message": "Access denied"
}
```

**404 Not Found:**

```json
{
  "success": false,
  "message": "Order not found"
}
```

**500 Internal Server Error:**

```json
{
  "success": false,
  "message": "Failed to fetch orders",
  "error": "Detailed error message"
}
```

---

## Summary

This API provides comprehensive order management features:

### For Users

- Create orders from cart
- View order history
- View order details with items and quantities
- Cancel orders
- Track order statistics

### For Admins

- **View all orders** with filtering and search
- **See what users ordered** - Get detailed order information with all items and quantities
- **Track how much users ordered** - View user-specific statistics showing total orders and total spend
- **Manage product inventory** - Add or reduce product stock
- **Update order status** - Change order status and track changes
- **View overall statistics** - Monitor total revenue, orders, and averages

All endpoints require authentication, and admin endpoints require admin role verification.
