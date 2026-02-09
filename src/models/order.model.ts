// db/schema.ts (Order Tables)
import { sql } from './schema';

// Create orders table
export const createOrdersTable = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      order_number VARCHAR(50) UNIQUE NOT NULL,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      
      -- Order status
      status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
        'pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 
        'delivered', 'cancelled', 'returned', 'refunded', 'failed'
      )),
      payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN (
        'pending', 'paid', 'failed', 'refunded', 'partially_refunded'
      )),
      fulfillment_status VARCHAR(50) DEFAULT 'unfulfilled' CHECK (fulfillment_status IN (
        'unfulfilled', 'partially_fulfilled', 'fulfilled', 'returned'
      )),
      
      -- Pricing
      subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
      tax_amount DECIMAL(10, 2) DEFAULT 0 CHECK (tax_amount >= 0),
      shipping_amount DECIMAL(10, 2) DEFAULT 0 CHECK (shipping_amount >= 0),
      discount_amount DECIMAL(10, 2) DEFAULT 0 CHECK (discount_amount >= 0),
      total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
      currency VARCHAR(3) DEFAULT 'INR',
      
      -- Shipping details
      shipping_address_id INTEGER REFERENCES addresses(id) ON DELETE SET NULL,
      billing_address_id INTEGER REFERENCES addresses(id) ON DELETE SET NULL,
      shipping_method VARCHAR(50),
      tracking_number VARCHAR(100),
      carrier VARCHAR(100),
      estimated_delivery_date DATE,
      actual_delivery_date DATE,
      
      -- Discount/Coupon
      coupon_code VARCHAR(50),
      coupon_discount DECIMAL(10, 2) DEFAULT 0,
      
      -- Additional info
      notes TEXT,
      customer_notes TEXT,
      internal_notes TEXT,
      metadata JSONB,
      
      -- Cancellation
      cancelled_at TIMESTAMP,
      cancelled_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      cancellation_reason TEXT,
      
      -- Timestamps
      confirmed_at TIMESTAMP,
      shipped_at TIMESTAMP,
      delivered_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
    CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
  `;
};

// Create order items table
export const createOrderItemsTable = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
      product_variant_id INTEGER REFERENCES product_variants(id) ON DELETE SET NULL,
      
      -- Product snapshot (in case product is deleted/modified)
      product_name VARCHAR(255) NOT NULL,
      product_sku VARCHAR(100),
      product_image_url TEXT,
      
      -- Variant details
      variant_name VARCHAR(100),
      variant_attributes JSONB,
      
      -- Pricing
      unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      total_price DECIMAL(10, 2) NOT NULL CHECK (total_price >= 0),
      discount DECIMAL(10, 2) DEFAULT 0 CHECK (discount >= 0),
      tax DECIMAL(10, 2) DEFAULT 0 CHECK (tax >= 0),
      
      -- Fulfillment
      fulfillment_status VARCHAR(50) DEFAULT 'unfulfilled' CHECK (fulfillment_status IN (
        'unfulfilled', 'fulfilled', 'returned', 'cancelled'
      )),
      
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
  `;
};

// Create order status history table
export const createOrderStatusHistoryTable = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS order_status_history (
      id SERIAL PRIMARY KEY,
      order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
      old_status VARCHAR(50),
      new_status VARCHAR(50) NOT NULL,
      changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_status_history_order_id ON order_status_history(order_id);
  `;
};

// Create shipments table
export const createShipmentsTable = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS shipments (
      id SERIAL PRIMARY KEY,
      order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
      tracking_number VARCHAR(100) UNIQUE NOT NULL,
      carrier VARCHAR(100) NOT NULL,
      service_type VARCHAR(100),
      
      status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
        'pending', 'picked_up', 'in_transit', 'out_for_delivery', 
        'delivered', 'failed', 'returned'
      )),
      
      -- Tracking events
      last_tracking_update TIMESTAMP,
      tracking_events JSONB,
      
      -- Shipping details
      weight DECIMAL(10, 2),
      weight_unit VARCHAR(10) DEFAULT 'kg',
      dimensions JSONB,
      
      -- Dates
      shipped_at TIMESTAMP,
      estimated_delivery TIMESTAMP,
      actual_delivery TIMESTAMP,
      
      metadata JSONB,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON shipments(order_id);
    CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON shipments(tracking_number);
  `;
};

// Create returns table
export const createReturnsTable = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS order_returns (
      id SERIAL PRIMARY KEY,
      order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      return_number VARCHAR(50) UNIQUE NOT NULL,
      
      reason VARCHAR(50) CHECK (reason IN (
        'defective', 'wrong_item', 'not_as_described', 
        'damaged', 'changed_mind', 'other'
      )),
      reason_description TEXT,
      
      status VARCHAR(50) DEFAULT 'requested' CHECK (status IN (
        'requested', 'approved', 'rejected', 'picked_up', 
        'received', 'inspected', 'refunded', 'completed'
      )),
      
      -- Return details
      return_method VARCHAR(50),
      pickup_address_id INTEGER REFERENCES addresses(id) ON DELETE SET NULL,
      tracking_number VARCHAR(100),
      
      -- Financial
      refund_amount DECIMAL(10, 2) CHECK (refund_amount >= 0),
      restocking_fee DECIMAL(10, 2) DEFAULT 0,
      
      -- Images/proof
      images JSONB,
      
      -- Admin notes
      admin_notes TEXT,
      
      -- Timestamps
      requested_at TIMESTAMP DEFAULT NOW(),
      approved_at TIMESTAMP,
      received_at TIMESTAMP,
      completed_at TIMESTAMP,
      
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_returns_order_id ON order_returns(order_id);
    CREATE INDEX IF NOT EXISTS idx_returns_user_id ON order_returns(user_id);
    CREATE INDEX IF NOT EXISTS idx_returns_status ON order_returns(status);
  `;
};

// Create return items table
export const createReturnItemsTable = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS return_items (
      id SERIAL PRIMARY KEY,
      return_id INTEGER REFERENCES order_returns(id) ON DELETE CASCADE,
      order_item_id INTEGER REFERENCES order_items(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      reason TEXT,
      condition VARCHAR(50) CHECK (condition IN ('unopened', 'used', 'defective', 'damaged')),
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_return_items_return_id ON return_items(return_id);
  `;
};

// Create coupons table
export const createCouponsTable = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS coupons (
      id SERIAL PRIMARY KEY,
      code VARCHAR(50) UNIQUE NOT NULL,
      description TEXT,
      
      type VARCHAR(50) NOT NULL CHECK (type IN ('percentage', 'fixed_amount', 'free_shipping')),
      value DECIMAL(10, 2) NOT NULL CHECK (value >= 0),
      
      -- Conditions
      min_purchase_amount DECIMAL(10, 2),
      max_discount_amount DECIMAL(10, 2),
      usage_limit INTEGER,
      usage_limit_per_user INTEGER,
      times_used INTEGER DEFAULT 0,
      
      -- Validity
      valid_from TIMESTAMP,
      valid_until TIMESTAMP,
      is_active BOOLEAN DEFAULT TRUE,
      
      -- Restrictions
      applicable_products JSONB,
      applicable_categories JSONB,
      excluded_products JSONB,
      
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
  `;
};

// Create coupon usage table
export const createCouponUsageTable = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS coupon_usage (
      id SERIAL PRIMARY KEY,
      coupon_id INTEGER REFERENCES coupons(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
      discount_amount DECIMAL(10, 2) NOT NULL,
      used_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon_id ON coupon_usage(coupon_id);
    CREATE INDEX IF NOT EXISTS idx_coupon_usage_user_id ON coupon_usage(user_id);
  `;
};

// models/Order.ts
import { sql } from '../db/schema';

export interface Order {
  id: number;
  order_number: string;
  user_id?: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'returned' | 'refunded' | 'failed';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
  fulfillment_status: 'unfulfilled' | 'partially_fulfilled' | 'fulfilled' | 'returned';
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  shipping_address_id?: number;
  billing_address_id?: number;
  shipping_method?: string;
  tracking_number?: string;
  carrier?: string;
  estimated_delivery_date?: Date;
  actual_delivery_date?: Date;
  coupon_code?: string;
  coupon_discount: number;
  notes?: string;
  customer_notes?: string;
  internal_notes?: string;
  metadata?: any;
  cancelled_at?: Date;
  cancelled_by?: number;
  cancellation_reason?: string;
  confirmed_at?: Date;
  shipped_at?: Date;
  delivered_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id?: number;
  product_variant_id?: number;
  product_name: string;
  product_sku?: string;
  product_image_url?: string;
  variant_name?: string;
  variant_attributes?: any;
  unit_price: number;
  quantity: number;
  total_price: number;
  discount: number;
  tax: number;
  fulfillment_status: 'unfulfilled' | 'fulfilled' | 'returned' | 'cancelled';
  created_at: Date;
}

export class OrderModel {
  // Generate order number
  static generateOrderNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${timestamp}-${random}`;
  }

  // Create order from cart
  static async createFromCart(orderData: {
    user_id: number;
    shipping_address_id: number;
    billing_address_id: number;
    shipping_method?: string;
    customer_notes?: string;
    coupon_code?: string;
  }) {
    // Get cart items
    const cartItems = await sql`
      SELECT c.*, p.name, p.price, p.sku, p.stock_quantity,
             (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = TRUE LIMIT 1) as image_url
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ${orderData.user_id}
    `;

    if (cartItems.length === 0) {
      throw new Error('Cart is empty');
    }

    // Calculate totals
    let subtotal = 0;
    let discount = 0;

    for (const item of cartItems) {
      if (item.stock_quantity < item.quantity) {
        throw new Error(`Insufficient stock for ${item.name}`);
      }
      subtotal += item.price * item.quantity;
    }

    // Apply coupon if provided
    if (orderData.coupon_code) {
      const couponDiscount = await this.applyCoupon(orderData.coupon_code, orderData.user_id, subtotal);
      discount = couponDiscount;
    }

    const tax_amount = (subtotal - discount) * 0.18; // 18% GST (example)
    const shipping_amount = subtotal >= 500 ? 0 : 50; // Free shipping above 500
    const total_amount = subtotal - discount + tax_amount + shipping_amount;

    // Create order
    const order_number = this.generateOrderNumber();

    const [order] = await sql`
      INSERT INTO orders (
        order_number,
        user_id,
        shipping_address_id,
        billing_address_id,
        shipping_method,
        customer_notes,
        coupon_code,
        coupon_discount,
        subtotal,
        tax_amount,
        shipping_amount,
        discount_amount,
        total_amount,
        status,
        payment_status
      )
      VALUES (
        ${order_number},
        ${orderData.user_id},
        ${orderData.shipping_address_id},
        ${orderData.billing_address_id},
        ${orderData.shipping_method || 'standard'},
        ${orderData.customer_notes || null},
        ${orderData.coupon_code || null},
        ${discount},
        ${subtotal},
        ${tax_amount},
        ${shipping_amount},
        ${discount},
        ${total_amount},
        'pending',
        'pending'
      )
      RETURNING *
    `;

    // Create order items
    const orderItems = [];
    for (const item of cartItems) {
      const [orderItem] = await sql`
        INSERT INTO order_items (
          order_id,
          product_id,
          product_name,
          product_sku,
          product_image_url,
          variant_attributes,
          unit_price,
          quantity,
          total_price
        )
        VALUES (
          ${order.id},
          ${item.product_id},
          ${item.name},
          ${item.sku},
          ${item.image_url},
          ${item.variant_size || item.variant_color ? JSON.stringify({ size: item.variant_size, color: item.variant_color }) : null},
          ${item.price},
          ${item.quantity},
          ${item.price * item.quantity}
        )
        RETURNING *
      `;
      orderItems.push(orderItem);

      // Update product stock
      await sql`
        UPDATE products 
        SET stock_quantity = stock_quantity - ${item.quantity}
        WHERE id = ${item.product_id}
      `;
    }

    // Clear cart
    await sql`
      DELETE FROM cart WHERE user_id = ${orderData.user_id}
    `;

    // Record coupon usage
    if (orderData.coupon_code && discount > 0) {
      const [coupon] = await sql`
        SELECT id FROM coupons WHERE code = ${orderData.coupon_code}
      `;
      
      if (coupon) {
        await sql`
          INSERT INTO coupon_usage (coupon_id, user_id, order_id, discount_amount)
          VALUES (${coupon.id}, ${orderData.user_id}, ${order.id}, ${discount})
        `;

        await sql`
          UPDATE coupons SET times_used = times_used + 1 WHERE id = ${coupon.id}
        `;
      }
    }

    return { order, items: orderItems };
  }

  // Get order by ID with full details
  static async findById(orderId: number) {
    const [order] = await sql`
      SELECT o.*,
             sa.full_name as shipping_name, sa.address_line1, sa.city, sa.state, sa.postal_code,
             u.first_name, u.last_name, u.email, u.phone
      FROM orders o
      LEFT JOIN addresses sa ON o.shipping_address_id = sa.id
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ${orderId}
    `;

    if (!order) return null;

    const items = await sql`
      SELECT * FROM order_items WHERE order_id = ${orderId}
    `;

    const statusHistory = await sql`
      SELECT * FROM order_status_history WHERE order_id = ${orderId} ORDER BY created_at DESC
    `;

    return { ...order, items, statusHistory };
  }

  // Get order by order number
  static async findByOrderNumber(orderNumber: string) {
    const [order] = await sql`
      SELECT * FROM orders WHERE order_number = ${orderNumber}
    `;

    if (!order) return null;
    return this.findById(order.id);
  }

  // Get user orders
  static async getUserOrders(userId: number, limit: number = 20, offset: number = 0) {
    const orders = await sql`
      SELECT o.*, COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = ${userId}
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    return orders;
  }

  // Get all orders (admin)
  static async getAllOrders(filters: {
    status?: string;
    payment_status?: string;
    search?: string;
    date_from?: Date;
    date_to?: Date;
    limit?: number;
    offset?: number;
  } = {}) {
    const { status, payment_status, search, date_from, date_to, limit = 50, offset = 0 } = filters;

    let query = sql`
      SELECT o.*, u.email, u.first_name, u.last_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `;

    if (status) {
      query = sql`${query} AND o.status = ${status}`;
    }

    if (payment_status) {
      query = sql`${query} AND o.payment_status = ${payment_status}`;
    }

    if (search) {
      query = sql`${query} AND (o.order_number ILIKE ${'%' + search + '%'} OR u.email ILIKE ${'%' + search + '%'})`;
    }

    if (date_from) {
      query = sql`${query} AND o.created_at >= ${date_from}`;
    }

    if (date_to) {
      query = sql`${query} AND o.created_at <= ${date_to}`;
    }

    query = sql`${query} ORDER BY o.created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    return await query;
  }

  // Update order status
  static async updateStatus(
    orderId: number, 
    newStatus: Order['status'], 
    changedBy?: number,
    notes?: string
  ) {
    const [currentOrder] = await sql`
      SELECT status FROM orders WHERE id = ${orderId}
    `;

    if (!currentOrder) throw new Error('Order not found');

    const updateData: any = { status: newStatus, updated_at: new Date() };

    if (newStatus === 'confirmed') {
      updateData.confirmed_at = new Date();
    } else if (newStatus === 'shipped') {
      updateData.shipped_at = new Date();
    } else if (newStatus === 'delivered') {
      updateData.delivered_at = new Date();
      updateData.actual_delivery_date = new Date();
      updateData.fulfillment_status = 'fulfilled';
    } else if (newStatus === 'cancelled') {
      updateData.cancelled_at = new Date();
      updateData.cancelled_by = changedBy;
    }

    const [order] = await sql`
      UPDATE orders 
      SET ${sql(updateData)}
      WHERE id = ${orderId}
      RETURNING *
    `;

    // Record status change
    await sql`
      INSERT INTO order_status_history (order_id, old_status, new_status, changed_by, notes)
      VALUES (${orderId}, ${currentOrder.status}, ${newStatus}, ${changedBy || null}, ${notes || null})
    `;

    return order;
  }

  // Cancel order
  static async cancel(orderId: number, userId: number, reason?: string) {
    const [order] = await sql`
      SELECT * FROM orders WHERE id = ${orderId} AND user_id = ${userId}
    `;

    if (!order) throw new Error('Order not found');

    if (!['pending', 'confirmed'].includes(order.status)) {
      throw new Error('Order cannot be cancelled');
    }

    // Restore stock
    const items = await sql`
      SELECT product_id, quantity FROM order_items WHERE order_id = ${orderId}
    `;

    for (const item of items) {
      await sql`
        UPDATE products 
        SET stock_quantity = stock_quantity + ${item.quantity}
        WHERE id = ${item.product_id}
      `;
    }

    return await this.updateStatus(orderId, 'cancelled', userId, reason);
  }

  // Apply coupon
  static async applyCoupon(code: string, userId: number, subtotal: number): Promise<number> {
    const [coupon] = await sql`
      SELECT * FROM coupons 
      WHERE code = ${code} 
        AND is_active = TRUE
        AND (valid_from IS NULL OR valid_from <= NOW())
        AND (valid_until IS NULL OR valid_until >= NOW())
    `;

    if (!coupon) throw new Error('Invalid or expired coupon');

    // Check usage limits
    if (coupon.usage_limit && coupon.times_used >= coupon.usage_limit) {
      throw new Error('Coupon usage limit reached');
    }

    if (coupon.usage_limit_per_user) {
      const [usage] = await sql`
        SELECT COUNT(*) as count FROM coupon_usage 
        WHERE coupon_id = ${coupon.id} AND user_id = ${userId}
      `;
      
      if (parseInt(usage.count) >= coupon.usage_limit_per_user) {
        throw new Error('You have already used this coupon');
      }
    }

    // Check minimum purchase
    if (coupon.min_purchase_amount && subtotal < coupon.min_purchase_amount) {
      throw new Error(`Minimum purchase amount is ${coupon.min_purchase_amount}`);
    }

    // Calculate discount
    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = (subtotal * coupon.value) / 100;
    } else if (coupon.type === 'fixed_amount') {
      discount = coupon.value;
    }

    // Apply max discount limit
    if (coupon.max_discount_amount && discount > coupon.max_discount_amount) {
      discount = coupon.max_discount_amount;
    }

    return discount;
  }

  // Get order statistics
  static async getStats(userId?: number) {
    let query;
    
    if (userId) {
      query = sql`
        SELECT 
          COUNT(*) as total_orders,
          COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
          COALESCE(SUM(total_amount), 0) as total_spent
        FROM orders
        WHERE user_id = ${userId}
      `;
    } else {
      query = sql`
        SELECT 
          COUNT(*) as total_orders,
          COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
          COALESCE(SUM(total_amount), 0) as total_revenue,
          COALESCE(AVG(total_amount), 0) as average_order_value
        FROM orders
      `;
    }

    const [stats] = await query;
    return stats;
  }
}