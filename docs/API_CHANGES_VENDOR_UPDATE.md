# API Changes - Vendor Management Update

This document details the changes made to the API to support Vendor management by Admins and Product management by Vendors.

## 1. Vendor Management (Admin Only)

These routes are protected and require `Admin` role.

### **Add Vendor**

Creates a new User account with role `vendor` and a linked Vendor Profile.

* **Endpoint**: `POST /api/admin/vendors`
* **Auth**: Bearer Token (Admin)
* **Body**:

    ```json
    {
      "first_name": "John",
      "last_name": "Doe",
      "email": "vendor@example.com",
      "password": "securepassword123",
      "phone": "+1234567890",
      "vendorCode": "V-001",
      "name": "Acme Supplies",
      "type": "SUPPLIER",
      "billingAddress": {
        "street": "123 Market St",
        "city": "New York",
        "state": "NY",
        "postalCode": "10001",
        "country": "USA"
      }
      // ... other vendor fields (shippingAddress, contactPersons, etc.)
    }
    ```

* **Response**: `201 Created`

### **Delete Vendor**

Deletes the Vendor Profile and the associated User account.

* **Endpoint**: `DELETE /api/admin/vendors/:id`
* **Auth**: Bearer Token (Admin)
* **Params**: `id` (Vendor ID)
* **Response**: `200 OK`

### **Get All Vendors**

Retrieves a list of all vendors.

* **Endpoint**: `GET /api/admin/vendors`
* **Auth**: Bearer Token (Admin)
* **Response**: `200 OK`

---

## 2. Product Management (Vendor & Admin)

The permission level for Product Management routes has been updated to allow both `Admin` and `Vendor` roles.

### **Create Product**

* **Endpoint**: `POST /api/products`
* **Auth**: Bearer Token (Admin or Vendor)
* **Logic**:
  * If the user is a **Vendor**, the `vendor_id` field is automatically set to the logged-in user's ID.
  * Admin can specify `vendor_id`.

### **Update Product**

* **Endpoint**: `PUT /api/products/:id`
* **Auth**: Bearer Token (Admin or Vendor)

### **Delete Product**

* **Endpoint**: `DELETE /api/products/:id`
* **Auth**: Bearer Token (Admin or Vendor)

### **Update Stock**

* **Endpoint**: `PATCH /api/products/:id/stock`
* **Auth**: Bearer Token (Admin or Vendor)

### **Add Product Image**

* **Endpoint**: `POST /api/products/:id/images`
* **Auth**: Bearer Token (Admin or Vendor)
