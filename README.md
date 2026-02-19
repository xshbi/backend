# E-Commerce Web Application 🚀

Welcome to the E-Commerce Web Application project. This specific update focuses on bridging the gap between frontend and backend, establishing a robust authentication system, and enforcing strict architectural patterns.

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
* **The specific lesson**: In our `NotificationController`, we initially faced an "Unauthorized" error because the backend expected `context.user.id` while the JWT middleware provided `context.user.userId`. This mismatch broke the frontend feature. It taught us that **data contracts between frontend and backend must be precise**.

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

As implemented in our previous push (`backend/src/middleware/auth.middleware.ts`), functionality relies on **JSON Web Tokens (JWT)**. Here is the exact flow we built:

1. **Token Creation (Login/Register)**:
    * When a user logs in, the backend verifies credentials.
    * It signs a new token using `jsonwebtoken.sign(payload, secret)`.
    * The `payload` contains non-sensitive user info: `{ userId, email, role }`.

2. **Stateless Storage**:
    * The frontend receives the token and stores it in `localStorage`.
    * **Why?** The backend does *not* keep a session in memory. This allows the backend to be scalable (stateless).

3. **The Middleware (`auth.middleware.ts`)**:
    * Every protected request sends the token in the header: `Authorization: Bearer <token>`.
    * Our middleware intercepts the request *before* the controller.
    * It runs `jwt.verify(token, secret)`.
    * **Crucial Step**: If valid, it attaches the decoded user data to the `context`.
    * `context.user = decoded;`

4. **Access Control**:
    * The controller then uses `context.user.userId` to fetch data specific to that user.
    * If the token is invalid or expired, the middleware throws a `401 Unauthorized` error immediately, stopping the request.

### ☁️ Cloudinary Integration

We integrated Cloudinary for robust image management.

* **Upload Route**: The `/api/upload` endpoint accepts `multipart/form-data`.
* **Process**:
    1. The route handler receives the file object.
    2. It converts the file buffer to a base64 string.
    3. This string is sent to Cloudinary via the SDK (`cloudinary.uploader.upload`).
    4. The secure URL is returned to the frontend.
* **Why?**: Storing images on a dedicated CDN like Cloudinary is more scalable than storing files on the local server filesystem, especially for a distributed e-commerce platform.

---

## 🚀 Getting Started

1. **Backend**:

    ```bash
    cd backend
    cd backend
    # Create a .env file and add your Cloudinary credentials:
    # CLOUDINARY_CLOUD_NAME=your_cloud_name
    # CLOUDINARY_API_KEY=your_api_key
    # CLOUDINARY_API_SECRET=your_api_secret
    bun run dev
    ```

2. **Frontend**:

    ```bash
    cd frontend
    bun run dev
    ```

3. **Explore**:
    * Visit `http://localhost:5173/register` to test the new flow.
