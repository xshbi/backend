# API Changes - Flagging Feature

## 3. Product Flagging (Admin Only)

Admins can now flag products for moderation purposes. Flagging a product immediately sets its status to suspended (`is_active = false`).

### **Flag Product**

* **Endpoint**: `POST /api/admin/products/:id/flag`
* **Auth**: Bearer Token (Admin)
* **Body**:

    ```json
    {
      "reason": "Inappropriate content"
    }
    ```

* **Response**: `200 OK`

### **Changes to Product Schema**

* Added `is_flagged` (boolean, default false)
* Added `flag_reason` (text, nullable)
