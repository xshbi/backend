# E-Commerce Web Application 🚀

Welcome to the E-Commerce Web Application project. This specific update focuses on bridging the gap between frontend and backend, establishing a robust authentication system, and enforcing strict architectural patterns.

## 🏗️ Backend Structure: Roles & Architecture

The backend is architected to support a multi-role ecosystem (Customer, Vendor, Admin) from a single unified API. Here is how each role is structured and handled:

### 👤 **Customers**

* **Role Definition**: Users with `role = 'customer'` in the `users` table.
* **Structure**:
  * **Cart & Checkout**: Managed via `CartController` which syncs temporary cart data (Redis/Memory) with persistent storage (PostgreSQL).
  * **Orders**: Customers generate `orders` linked to their `user_id`.
  * **Access**: Restricted to their own data via `jwtMiddleware`.
* **Key Modules**: `routes/cart.routes.ts`, `routes/order.routes.ts`, `routes/user.routes.ts`.

### 🏪 **Vendors**

* **Role Definition**: Users with `role = 'vendor'` in the `users` table.
* **Structure**:
  * **Product Ownership**: Products in the `products` table have a `vendor_id` foreign key linking to the vendor's user ID.
  * **Dashboard**: `VendorController` aggregates sales data, low stock alerts, and order notifications specific to the vendor's products.
  * **Asset Management**: Vendors use the restricted `/api/upload` endpoint to push product images to Cloudinary.
* **Key Modules**: `routes/vendor.routes.ts`, `routes/product.routes.ts`, `routes/upload.routes.ts`.

### 🛡️ **Admins**

* **Role Definition**: Users with `role = 'admin'`.
* **Structure**:
  * **Global Oversight**: Admins have unrestricted access to all tables (`users`, `orders`, `products`).
  * **Security**: Secured by strict `requireAdmin` middleware checks on all `/api/admin/*` routes.
  * **Platform Management**: Capabilities to ban users, approve refund requests, and manage global categories/coupons.
* **Key Modules**: `routes/admin.routes.ts`, `routes/admin.product.routes.ts`, `routes/admin.order.routes.ts`.

---

## 🌟 What's New?

We have successfully implemented a series of critical enhancements to synchronize the frontend with the backend and improve the overall user experience:

* **User Registration**: A fully functional registration page (`/register`) that integrates with the backend to create new users and automatically logs them in.
* **Enhanced Cart Flow**: A toast notification system now provides immediate feedback for all cart operations (add, update, remove), replacing silent failures or basic alerts.
* **Protected Routes**: A security layer `ProtectedRoute.tsx` that guards sensitive routes (like `/vendor/dashboard` or `/cart`), redirecting unauthenticated users to login.
* **Global Error Handling**: An `ErrorBoundary` component that catches app-crashing errors and displays a user-friendly recovery UI instead of a white screen.
* **API Documentation**: Comprehensive documentation (`API_DOCUMENTATION.md`) for all backend endpoints to ensuring the frontend consumes them correctly.
* **Vendor Improvements**: Fixed duplicate code in product management and resolved "blank screen" issues by correcting environment variable handling in Vite (`import.meta.env`).
* **Cloudinary Image Upload**: Implemented a dedicated API route (`/api/upload`) for handling image uploads directly to Cloudinary, ensuring scalable and secure asset management.

---

## 🧠 Project Learnings & Insights

Building this project has highlighted several critical software engineering principles:

### 1. How Frontend Features Affect the Backend

We learned that a "simple" frontend feature often dictates backend requirements.

* **Example**: Implementing the "Unread Notifications" badge on the frontend required the backend `NotificationController` to correctly extract the authenticated user's ID.
* **The Lesson**: In our `NotificationController`, we initially faced an "Unauthorized" error because the backend expected `context.user.id` while the JWT middleware provided `context.user.userId`. This mismatch broke the frontend feature. It taught us that **data contracts between frontend and backend must be precise**.

### 2. How Models Affect the "Making"

The database models are the blueprint of the application.

* Defining `NotificationModel` or `OrderModel` strictly defines what data *can* exist.
* If we forget a field in the model (like `isRead` in notifications), the frontend literally cannot implement the "mark as read" feature.
* **Lesson**: The model functions as the "law" of the application. Changes in feature requirements must start with the Model, then move to the Controller, and finally the View (Frontend).

### 3. The Criticality of System Design & Planning

We realized that jumping straight into coding causes "integration hell."

* Before this update, we had mismatched API URLs and undefined env variables causing blank screens.
* **Planning**: By creating `API_DOCUMENTATION.md` *before* fixing functionality, we saved hours of debugging.
* **System Design**: Understanding that we need a "Toast Provider" (Global State) rather than local alerts in every component is a system design decision that cleans up the code significantly.

---

## 🛠️ Technical Deep Dive

### Module System

The project follows a strict Modular Architecture to keep code maintainable:

* **Routes** (`/routes`): Define the entry points (e.g., `/api/auth/login`).
* **Controllers** (`/controller`): Handle the business logic (validating input, calling models).
* **Models** (`/models`): Interact directly with the database.
* **Middleware**: Intercepts requests for cross-cutting concerns (Auth, Logging).

This separation ensured that when we fixed the Vendor Dashboard, we only had to touch the Controller, without breaking the Route definitions.

### 🔐 JWT Authentication (Explained)

As implemented in `backend/src/middleware/auth.middleware.ts`, functionality relies on JSON Web Tokens (JWT).

1. **Token Creation**: Login/Register signs a token with `jsonwebtoken.sign(payload, secret)` containing `{ userId, email, role }`.
2. **Stateless Storage**: Frontend stores token in `localStorage`. Backend remains stateless.
3. **The Middleware**: Intercepts requests, runs `jwt.verify()`, and attaches `decoded` user data to `context.user`.
4. **Access Control**: Controllers use `context.user.userId` to secure data access.

### ☁️ Cloudinary Integration

* **Upload Route**: `/api/upload` accepts `multipart/form-data`.
* **Process**: Converts file buffer to base64 → Sends to Cloudinary SDK → Returns secure URL.
* **Benefit**: Scalable, CDN-backed image delivery for the e-commerce platform.

---

## 🗄️ Database as the Backbone

Use this project as a case study: **the database schema is the contract.**

* **`users` Table**: Defines Auth (Role, Lockout logic).
* **`sessions` Table**: Controls Token Lifecycle (Cascade delete, Expiry).
* **Constraints**: `UNIQUE` emails, `NOT NULL` fields prevents silent data corruption.

---

## 🚀 Getting Started

### 1. Backend Setup

```bash
cd backend
# Create a .env file and add your Cloudinary credentials:
# CLOUDINARY_CLOUD_NAME=doofus-lab
# CLOUDINARY_API_KEY=your_api_key
# CLOUDINARY_API_SECRET=your_api_secret
# DB_HOST=localhost ...
bun run dev
```

### 2. Frontend Setup

```bash
cd frontend
bun run dev
```

### 3. Explore

Visit `http://localhost:5173/register` to test the new flow.

---

## 📝 Prerequisites & License

* **Runtime**: [Bun](https://bun.sh)
* **Database**: PostgreSQL
* **License**: MIT

**Built with ❤️ using Bun, Elysia, and PostgreSQL**
