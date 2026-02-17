# API Changes - Payment & Address Logic

To ensure smooth order processing, we have implemented Address Management and enforced address requirements during checkout.

## 1. Address Management

Users can now manage their delivery addresses.

### **Get Addresses**

* **Endpoint**: `GET /api/addresses`
* **Auth**: Bearer Token
* **Response**: List of addresses.

### **Add Address**

* **Endpoint**: `POST /api/addresses`
* **Auth**: Bearer Token
* **Body**:

    ```json
    {
      "fullName": "John Doe",
      "phone": "+1234567890",
      "street": "123 Main St",
      "streetNumber": "4B",
      "apartment": "Tower 1",
      "city": "Mumbai",
      "state": "Maharashtra",
      "postalCode": "400001",
      "country": "India",
      "label": "home",
      "isDefault": true
    }
    ```

* **Response**: Created address object.

### **Delete Address**

* **Endpoint**: `DELETE /api/addresses/:id`
* **Auth**: Bearer Token

## 2. Checkout & Payment

The checkout process now requires a valid shipping address.

### **Checkout (Create Order)**

* **Endpoint**: `POST /api/orders/checkout`
* **Auth**: Bearer Token
* **Body**:

    ```json
    {
      "shippingAddressId": 123, // Optional if default address exists
      "billingAddressId": 123,  // Optional
      "shippingMethod": "standard",
      "couponCode": "SAVE10",
      "notes": "Leave at door"
    }
    ```

* **Logic**:
  * If `shippingAddressId` is NOT provided, the system attempts to use the user's **default address**.
  * If NO address exists for the user, logic **fails** with `400 Bad Request` and message: *"No address found. Please add an address before processing payment."*
  * This forces the user to create an address via `POST /api/addresses` before they can complete checkout.
