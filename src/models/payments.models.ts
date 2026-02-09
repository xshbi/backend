// db/schema.ts (Payment Tables)
import { sql } from './schema';

// Create payment methods table
export const createPaymentMethodsTable = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS payment_methods (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL CHECK (type IN ('card', 'upi', 'netbanking', 'wallet', 'cod')),
      provider VARCHAR(50),
      is_default BOOLEAN DEFAULT FALSE,
      
      -- Card details (encrypted/tokenized)
      card_last4 VARCHAR(4),
      card_brand VARCHAR(50),
      card_exp_month INTEGER,
      card_exp_year INTEGER,
      card_holder_name VARCHAR(200),
      
      -- UPI details
      upi_id VARCHAR(100),
      
      -- Wallet details
      wallet_provider VARCHAR(50),
      wallet_id VARCHAR(100),
      
      -- Bank details
      bank_name VARCHAR(100),
      account_last4 VARCHAR(4),
      
      -- Gateway tokens
      payment_token TEXT,
      gateway_customer_id VARCHAR(255),
      
      is_verified BOOLEAN DEFAULT FALSE,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
  `;
};

// Create payments table
export const createPaymentsTable = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS payments (
      id SERIAL PRIMARY KEY,
      order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      payment_method_id INTEGER REFERENCES payment_methods(id) ON DELETE SET NULL,
      
      -- Payment details
      payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('card', 'upi', 'netbanking', 'wallet', 'cod', 'emi')),
      payment_gateway VARCHAR(50) NOT NULL CHECK (payment_gateway IN ('razorpay', 'stripe', 'paytm', 'phonepe', 'cod')),
      
      -- Amount details
      amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
      currency VARCHAR(3) DEFAULT 'INR',
      tax_amount DECIMAL(10, 2) DEFAULT 0,
      discount_amount DECIMAL(10, 2) DEFAULT 0,
      shipping_amount DECIMAL(10, 2) DEFAULT 0,
      total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
      
      -- Payment status
      status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded', 'cancelled')),
      
      -- Gateway details
      transaction_id VARCHAR(255) UNIQUE,
      gateway_order_id VARCHAR(255),
      gateway_payment_id VARCHAR(255),
      gateway_signature VARCHAR(500),
      
      -- Additional info
      payment_details JSONB,
      metadata JSONB,
      
      -- Timestamps
      initiated_at TIMESTAMP DEFAULT NOW(),
      completed_at TIMESTAMP,
      failed_at TIMESTAMP,
      
      -- Error handling
      error_code VARCHAR(100),
      error_message TEXT,
      retry_count INTEGER DEFAULT 0,
      
      -- IP and device info
      ip_address INET,
      user_agent TEXT,
      
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
    CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
    CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
    CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);
    CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);
  `;
};

// Create refunds table
export const createRefundsTable = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS refunds (
      id SERIAL PRIMARY KEY,
      payment_id INTEGER REFERENCES payments(id) ON DELETE CASCADE,
      order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      
      amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
      currency VARCHAR(3) DEFAULT 'INR',
      
      reason VARCHAR(50) CHECK (reason IN ('customer_request', 'order_cancelled', 'defective_product', 'not_delivered', 'other')),
      reason_description TEXT,
      
      status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'rejected')),
      
      -- Gateway details
      refund_id VARCHAR(255) UNIQUE,
      gateway_refund_id VARCHAR(255),
      
      -- Timestamps
      initiated_at TIMESTAMP DEFAULT NOW(),
      completed_at TIMESTAMP,
      
      metadata JSONB,
      
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_refunds_payment_id ON refunds(payment_id);
    CREATE INDEX IF NOT EXISTS idx_refunds_order_id ON refunds(order_id);
    CREATE INDEX IF NOT EXISTS idx_refunds_user_id ON refunds(user_id);
    CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);
  `;
};

// Create payment webhooks table (for gateway callbacks)
export const createPaymentWebhooksTable = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS payment_webhooks (
      id SERIAL PRIMARY KEY,
      gateway VARCHAR(50) NOT NULL,
      event_type VARCHAR(100) NOT NULL,
      payload JSONB NOT NULL,
      signature VARCHAR(500),
      processed BOOLEAN DEFAULT FALSE,
      processed_at TIMESTAMP,
      error_message TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_payment_webhooks_processed ON payment_webhooks(processed);
    CREATE INDEX IF NOT EXISTS idx_payment_webhooks_created_at ON payment_webhooks(created_at DESC);
  `;
};

// models/Payment.ts
import { sql } from '../db/schema';

export interface Payment {
  id: number;
  order_id: number;
  user_id?: number;
  payment_method_id?: number;
  payment_method: 'card' | 'upi' | 'netbanking' | 'wallet' | 'cod' | 'emi';
  payment_gateway: 'razorpay' | 'stripe' | 'paytm' | 'phonepe' | 'cod';
  amount: number;
  currency: string;
  tax_amount: number;
  discount_amount: number;
  shipping_amount: number;
  total_amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'partially_refunded' | 'cancelled';
  transaction_id?: string;
  gateway_order_id?: string;
  gateway_payment_id?: string;
  gateway_signature?: string;
  payment_details?: any;
  metadata?: any;
  initiated_at: Date;
  completed_at?: Date;
  failed_at?: Date;
  error_code?: string;
  error_message?: string;
  retry_count: number;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
  updated_at: Date;
}

export interface PaymentMethod {
  id: number;
  user_id: number;
  type: 'card' | 'upi' | 'netbanking' | 'wallet' | 'cod';
  provider?: string;
  is_default: boolean;
  card_last4?: string;
  card_brand?: string;
  card_exp_month?: number;
  card_exp_year?: number;
  card_holder_name?: string;
  upi_id?: string;
  wallet_provider?: string;
  wallet_id?: string;
  bank_name?: string;
  account_last4?: string;
  payment_token?: string;
  gateway_customer_id?: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Refund {
  id: number;
  payment_id: number;
  order_id: number;
  user_id?: number;
  amount: number;
  currency: string;
  reason: 'customer_request' | 'order_cancelled' | 'defective_product' | 'not_delivered' | 'other';
  reason_description?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'rejected';
  refund_id?: string;
  gateway_refund_id?: string;
  initiated_at: Date;
  completed_at?: Date;
  metadata?: any;
  created_at: Date;
  updated_at: Date;
}

export class PaymentModel {
  // Create payment
  static async create(paymentData: {
    order_id: number;
    user_id?: number;
    payment_method: string;
    payment_gateway: string;
    amount: number;
    total_amount: number;
    currency?: string;
    tax_amount?: number;
    discount_amount?: number;
    shipping_amount?: number;
    ip_address?: string;
    user_agent?: string;
  }): Promise<Payment> {
    const [payment] = await sql`
      INSERT INTO payments ${sql(paymentData)}
      RETURNING *
    `;
    return payment;
  }

  // Find payment by ID
  static async findById(id: number): Promise<Payment | null> {
    const [payment] = await sql`
      SELECT * FROM payments WHERE id = ${id}
    `;
    return payment || null;
  }

  // Find payment by order ID
  static async findByOrderId(orderId: number): Promise<Payment | null> {
    const [payment] = await sql`
      SELECT * FROM payments WHERE order_id = ${orderId} ORDER BY created_at DESC LIMIT 1
    `;
    return payment || null;
  }

  // Find payment by transaction ID
  static async findByTransactionId(transactionId: string): Promise<Payment | null> {
    const [payment] = await sql`
      SELECT * FROM payments WHERE transaction_id = ${transactionId}
    `;
    return payment || null;
  }

  // Update payment status
  static async updateStatus(
    id: number, 
    status: Payment['status'],
    additionalData?: {
      gateway_payment_id?: string;
      gateway_signature?: string;
      transaction_id?: string;
      error_code?: string;
      error_message?: string;
    }
  ): Promise<Payment | null> {
    const updateData: any = { 
      status, 
      updated_at: new Date(),
      ...additionalData
    };

    if (status === 'completed') {
      updateData.completed_at = new Date();
    } else if (status === 'failed') {
      updateData.failed_at = new Date();
    }

    const [payment] = await sql`
      UPDATE payments 
      SET ${sql(updateData)}
      WHERE id = ${id}
      RETURNING *
    `;
    return payment || null;
  }

  // Initiate Razorpay payment
  static async initiateRazorpay(orderId: number, amount: number, currency: string = 'INR') {
    const razorpayOrderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const [payment] = await sql`
      UPDATE payments 
      SET 
        gateway_order_id = ${razorpayOrderId},
        status = 'processing',
        updated_at = NOW()
      WHERE order_id = ${orderId}
      RETURNING *
    `;

    return {
      razorpay_order_id: razorpayOrderId,
      amount: amount * 100, // Razorpay expects amount in paise
      currency,
      payment
    };
  }

  // Verify Razorpay payment
  static async verifyRazorpay(
    paymentId: number,
    razorpayPaymentId: string,
    razorpayOrderId: string,
    razorpaySignature: string
  ): Promise<boolean> {
    // In production, verify signature using crypto
    // const expectedSignature = crypto
    //   .createHmac('sha256', RAZORPAY_KEY_SECRET)
    //   .update(razorpayOrderId + '|' + razorpayPaymentId)
    //   .digest('hex');

    // For now, update payment as completed
    await this.updateStatus(paymentId, 'completed', {
      gateway_payment_id: razorpayPaymentId,
      gateway_signature: razorpaySignature,
      transaction_id: razorpayPaymentId
    });

    return true;
  }

  // Get user payment history
  static async getUserPayments(userId: number, limit: number = 20, offset: number = 0) {
    const payments = await sql`
      SELECT p.*, o.order_number
      FROM payments p
      LEFT JOIN orders o ON p.order_id = o.id
      WHERE p.user_id = ${userId}
      ORDER BY p.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    return payments;
  }

  // Get payment statistics
  static async getStats(userId?: number) {
    let query;
    
    if (userId) {
      query = sql`
        SELECT 
          COUNT(*) as total_payments,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_payments,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_payments,
          COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END), 0) as total_amount_paid
        FROM payments
        WHERE user_id = ${userId}
      `;
    } else {
      query = sql`
        SELECT 
          COUNT(*) as total_payments,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_payments,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_payments,
          COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END), 0) as total_amount_paid
        FROM payments
      `;
    }

    const [stats] = await query;
    return stats;
  }

  // Retry failed payment
  static async retry(paymentId: number): Promise<Payment | null> {
    const [payment] = await sql`
      UPDATE payments 
      SET 
        status = 'pending',
        retry_count = retry_count + 1,
        updated_at = NOW()
      WHERE id = ${paymentId} AND status = 'failed'
      RETURNING *
    `;
    return payment || null;
  }
}

// Payment Method Model
export class PaymentMethodModel {
  // Add payment method
  static async create(methodData: {
    user_id: number;
    type: PaymentMethod['type'];
    provider?: string;
    card_last4?: string;
    card_brand?: string;
    card_exp_month?: number;
    card_exp_year?: number;
    card_holder_name?: string;
    upi_id?: string;
    wallet_provider?: string;
    payment_token?: string;
    gateway_customer_id?: string;
  }): Promise<PaymentMethod> {
    const [method] = await sql`
      INSERT INTO payment_methods ${sql(methodData)}
      RETURNING *
    `;
    return method;
  }

  // Get user payment methods
  static async getUserMethods(userId: number) {
    const methods = await sql`
      SELECT * FROM payment_methods 
      WHERE user_id = ${userId} AND is_active = TRUE
      ORDER BY is_default DESC, created_at DESC
    `;
    return methods;
  }

  // Set default payment method
  static async setDefault(userId: number, methodId: number): Promise<boolean> {
    await sql`
      UPDATE payment_methods SET is_default = FALSE WHERE user_id = ${userId}
    `;
    
    const result = await sql`
      UPDATE payment_methods 
      SET is_default = TRUE, updated_at = NOW()
      WHERE id = ${methodId} AND user_id = ${userId}
    `;
    
    return result.count > 0;
  }

  // Delete payment method
  static async delete(userId: number, methodId: number): Promise<boolean> {
    const result = await sql`
      UPDATE payment_methods 
      SET is_active = FALSE, updated_at = NOW()
      WHERE id = ${methodId} AND user_id = ${userId}
    `;
    return result.count > 0;
  }
}

// Refund Model
export class RefundModel {
  // Create refund
  static async create(refundData: {
    payment_id: number;
    order_id: number;
    user_id?: number;
    amount: number;
    currency?: string;
    reason: Refund['reason'];
    reason_description?: string;
  }): Promise<Refund> {
    const refundId = `refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const [refund] = await sql`
      INSERT INTO refunds ${sql({ ...refundData, refund_id: refundId })}
      RETURNING *
    `;
    return refund;
  }

  // Process refund
  static async process(refundId: number, gatewayRefundId?: string): Promise<Refund | null> {
    const [refund] = await sql`
      UPDATE refunds 
      SET 
        status = 'completed',
        gateway_refund_id = ${gatewayRefundId || null},
        completed_at = NOW(),
        updated_at = NOW()
      WHERE id = ${refundId}
      RETURNING *
    `;

    if (refund) {
      // Update payment status to refunded
      await sql`
        UPDATE payments 
        SET status = 'refunded', updated_at = NOW()
        WHERE id = ${refund.payment_id}
      `;
    }

    return refund || null;
  }

  // Get refund by ID
  static async findById(id: number): Promise<Refund | null> {
    const [refund] = await sql`
      SELECT * FROM refunds WHERE id = ${id}
    `;
    return refund || null;
  }

  // Get refunds by order
  static async getByOrderId(orderId: number) {
    const refunds = await sql`
      SELECT * FROM refunds WHERE order_id = ${orderId} ORDER BY created_at DESC
    `;
    return refunds;
  }

  // Get user refunds
  static async getUserRefunds(userId: number, limit: number = 20, offset: number = 0) {
    const refunds = await sql`
      SELECT r.*, o.order_number, p.transaction_id
      FROM refunds r
      LEFT JOIN orders o ON r.order_id = o.id
      LEFT JOIN payments p ON r.payment_id = p.id
      WHERE r.user_id = ${userId}
      ORDER BY r.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    return refunds;
  }
}

// Webhook Model
export class PaymentWebhookModel {
  static async create(webhookData: {
    gateway: string;
    event_type: string;
    payload: any;
    signature?: string;
  }) {
    const [webhook] = await sql`
      INSERT INTO payment_webhooks ${sql(webhookData)}
      RETURNING *
    `;
    return webhook;
  }

  static async markProcessed(id: number, errorMessage?: string) {
    await sql`
      UPDATE payment_webhooks 
      SET 
        processed = TRUE,
        processed_at = NOW(),
        error_message = ${errorMessage || null}
      WHERE id = ${id}
    `;
  }

  static async getUnprocessed(limit: number = 100) {
    const webhooks = await sql`
      SELECT * FROM payment_webhooks 
      WHERE processed = FALSE
      ORDER BY created_at ASC
      LIMIT ${limit}
    `;
    return webhooks;
  }
}