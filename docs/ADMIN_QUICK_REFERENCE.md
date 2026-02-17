# Quick Reference: Admin Order & Product Management

## Admin Product Stock Management

### Add Stock to Product

```bash
PATCH /api/admin-products/:id/stock
Authorization: Bearer <admin_token>

{
  "quantity": 50,
  "type": "add"
}
```

### Reduce Stock from Product

```bash
PATCH /api/admin-products/:id/stock
Authorization: Bearer <admin_token>

{
  "quantity": 10,
  "type": "reduce"
}
```

### Set Stock to Exact Amount

```bash
PATCH /api/admin-products/:id/stock
Authorization: Bearer <admin_token>

{
  "quantity": 100,
  "type": "set"
}
```

---

## View User Orders & Quantities

### See All Orders

```bash
GET /api/admin/orders
Authorization: Bearer <admin_token>

# Filter by status
GET /api/admin/orders?status=pending

# Search by order number or email
GET /api/admin/orders?search=john@example.com

# Filter by date range
GET /api/admin/orders?date_from=2026-01-01&date_to=2026-02-03
```

### See What a Specific User Ordered

```bash
GET /api/admin/orders/user/:userId
Authorization: Bearer <admin_token>

# Example
GET /api/admin/orders/user/5
```

**Response includes:**

- All orders placed by the user
- Total number of orders
- Total amount spent
- Number of delivered/cancelled orders

### See Order Details (Items & Quantities)

```bash
GET /api/orders/:orderId
Authorization: Bearer <admin_token>

# Example
GET /api/orders/123
```

**Response includes:**

- Order summary (total, tax, shipping, discount)
- **Items list** with:
  - Product name
  - Product SKU
  - **Quantity ordered**
  - Unit price
  - Total price per item
- Order status history
- Customer information
- Shipping details

---

## Update Order Status

```bash
PATCH /api/admin/orders/:id/status
Authorization: Bearer <admin_token>

{
  "status": "shipped",
  "notes": "Optional admin notes"
}
```

**Available Statuses:**

- `pending` - Order placed
- `confirmed` - Order confirmed
- `processing` - Being prepared
- `shipped` - Shipped
- `out_for_delivery` - Out for delivery
- `delivered` - Delivered
- `cancelled` - Cancelled
- `returned` - Returned
- `refunded` - Refunded

---

## Order Statistics

### Overall Statistics

```bash
GET /api/admin/orders/statistics
Authorization: Bearer <admin_token>
```

**Returns:**

- Total orders
- Delivered orders
- Cancelled orders
- Total revenue
- Average order value

### User-Specific Statistics

```bash
GET /api/admin/orders/user/:userId
Authorization: Bearer <admin_token>
```

**Returns:**

- User's total orders
- User's total spent
- User's delivered orders
- User's cancelled orders

---

## Common Use Cases

### 1. Check what a user has ordered

```bash
# Step 1: Get user's orders
GET /api/admin/orders/user/5

# Step 2: Get specific order details to see items and quantities
GET /api/orders/123
```

### 2. Update inventory after receiving stock

```bash
# Add 100 units to product ID 10
PATCH /api/admin-products/10/stock
{
  "quantity": 100,
  "type": "add"
}
```

### 3. Process an order

```bash
# Step 1: Confirm order
PATCH /api/admin/orders/123/status
{
  "status": "confirmed",
  "notes": "Payment verified"
}

# Step 2: Mark as shipped
PATCH /api/admin/orders/123/status
{
  "status": "shipped",
  "notes": "Tracking: ABC123456"
}

# Step 3: Mark as delivered
PATCH /api/admin/orders/123/status
{
  "status": "delivered"
}
```

### 4. Find all pending orders

```bash
GET /api/admin/orders?status=pending&limit=50
```

### 5. Search for user's orders

```bash
GET /api/admin/orders?search=user@example.com
```

---

## Key Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin-products/:id/stock` | PATCH | Add/reduce/set product stock |
| `/api/admin/orders` | GET | View all orders with filters |
| `/api/admin/orders/user/:userId` | GET | View user's orders & statistics |
| `/api/orders/:id` | GET | View order details with items |
| `/api/admin/orders/:id/status` | PATCH | Update order status |
| `/api/admin/orders/statistics` | GET | View overall order statistics |

---

## Authentication

All endpoints require admin authentication. Include JWT token in header:

```
Authorization: Bearer <your_admin_jwt_token>
```

To get admin token:

```bash
POST /api/auth/login
{
  "email": "admin@example.com",
  "password": "your_password"
}
```

Save the returned token and use it in subsequent requests.
