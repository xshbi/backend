# API Quick Reference

## Authentication & User

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | User login |
| POST | `/api/auth/refresh` | Public | Refresh access token |
| POST | `/api/auth/logout` | Private | Logout current session |
| POST | `/api/auth/logout-all` | Private | Logout all sessions |
| GET | `/api/auth/profile` | Private | Get user profile |
| GET | `/api/auth/sessions` | Private | Get active sessions |
| DELETE | `/api/auth/sessions/:sessionId` | Private | Revoke session |
| GET | `/health` | Public | Health check |
| GET | `/users` | Public | Get all users |

## Products

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/products` | Public | Get all products (with filters) |
| GET | `/api/products/:id` | Public | Get product by ID |
| GET | `/api/products/slug/:slug` | Public | Get product by slug |
| GET | `/api/products/:id/reviews` | Public | Get product reviews |
| GET | `/api/products/:id/related` | Public | Get related products |
| POST | `/api/products` | Vendor/Admin | Create product |
| PUT | `/api/products/:id` | Vendor/Admin | Update product |
| DELETE | `/api/products/:id` | Vendor/Admin | Delete product |
| PATCH | `/api/products/:id/stock` | Vendor/Admin | Update stock |
| POST | `/api/products/:id/images` | Vendor/Admin | Add product image |
| POST | `/api/products/:id/reviews` | Private | Add review |

## Categories

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/categories` | Public | Get all categories |
| POST | `/api/categories` | Admin | Create category |

## Cart

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/cart` | Private | Get user cart |
| POST | `/api/cart/add` | Private | Add to cart |
| POST | `/api/cart/reduce` | Private | Reduce quantity by 1 |
| PUT | `/api/cart/update` | Private | Update quantity |
| DELETE | `/api/cart/remove/:productId` | Private | Remove from cart |
| DELETE | `/api/cart/clear` | Private | Clear entire cart |
| POST | `/api/cart/coupon` | Private | Apply coupon code |

## Orders

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/orders/checkout` | Private | Create order |
| GET | `/api/orders` | Private | Get user orders |

## Addresses

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/addresses` | Private | Get user addresses |
| POST | `/api/addresses` | Private | Create address |
| DELETE | `/api/addresses/:id` | Private | Delete address |

## Admin - Products

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/admin/products` | Admin | Create product |
| GET | `/api/admin/products` | Admin | Get all products |
| DELETE | `/api/admin/products/:id` | Admin | Delete product |
| POST | `/api/admin/products/:id/flag` | Admin | Flag/unflag product |
| POST | `/api/admin-products` | Admin | Create product (alt) |
| PATCH | `/api/admin-products/:id/stock` | Admin | Update stock (alt) |
| DELETE | `/api/admin-products/:id` | Admin | Delete product (alt) |

## Admin - Vendors

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/admin/vendors` | Admin | Create vendor |
| GET | `/api/admin/vendors` | Admin | Get all vendors |
| DELETE | `/api/admin/vendors/:id` | Admin | Delete vendor |

---

## Access Levels

- **Public** - No authentication required
- **Private** - Requires JWT token (any logged-in user)
- **Vendor/Admin** - Requires vendor or admin role
- **Admin** - Requires admin role only

## Base URL

```
http://localhost:3000
```

## Authentication Header

```
Authorization: Bearer <your-jwt-token>
```

---

**Total Endpoints:** 50+
