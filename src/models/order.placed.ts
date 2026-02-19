// order.placed.ts
// Handles order confirmation logic after a successful checkout.
// All field names, ID types, status unions, and timestamp conventions
// are aligned with the rest of the models folder (order.model.ts,
// payments.models.ts, user.model.ts, address.model.ts).

// ─── Enums / Union Types ──────────────────────────────────────────────────────

/**
 * Matches the CHECK constraint in the orders table.
 * Mirrors Order['status'] from order.model.ts.
 */
export type OrderStatus =
    | 'pending'
    | 'confirmed'
    | 'processing'
    | 'packed'
    | 'shipped'
    | 'out_for_delivery'
    | 'delivered'
    | 'cancelled'
    | 'refunded';

/**
 * Matches the CHECK constraint in the payments table.
 * Mirrors Payment['payment_method'] from payments.models.ts.
 */
export type PaymentMethod = 'card' | 'upi' | 'netbanking' | 'wallet' | 'cod' | 'emi';

// ─── Interfaces ───────────────────────────────────────────────────────────────

/**
 * A single line item in a placed order.
 * Field names mirror order_items table columns and OrderItem in order.model.ts.
 */
export interface OrderPlacedItem {
    id: number;                        // order_items.id
    order_id: number;                  // order_items.order_id
    product_id?: number;               // order_items.product_id
    product_variant_id?: number;       // order_items.product_variant_id
    product_name: string;              // order_items.product_name
    product_sku?: string;              // order_items.product_sku
    product_image_url?: string;        // order_items.product_image_url
    variant_name?: string;             // order_items.variant_name
    variant_attributes?: any;          // order_items.variant_attributes (JSONB)
    unit_price: number;                // order_items.unit_price  (DECIMAL 10,2)
    quantity: number;                  // order_items.quantity
    total_price: number;               // order_items.total_price (DECIMAL 10,2)
    discount: number;                  // order_items.discount    (DECIMAL 10,2)
    tax: number;                       // order_items.tax         (DECIMAL 10,2)
    fulfillment_status: 'unfulfilled' | 'fulfilled' | 'returned' | 'cancelled';
    created_at: Date;
}

/**
 * Shipping / billing address snapshot for a placed order.
 * Field names mirror the addresses table columns and AddressModel.fromSQL()
 * in address.model.ts.
 */
export interface OrderPlacedAddress {
    id?: number;                       // addresses.id
    full_name: string;                 // addresses.full_name
    phone: string;                     // addresses.phone
    address_line1: string;             // addresses.address_line1
    address_line2?: string;            // addresses.address_line2
    city: string;                      // addresses.city
    state: string;                     // addresses.state
    postal_code: string;               // addresses.postal_code
    country: string;                   // addresses.country
}

/**
 * Payment summary for a placed order.
 * Field names mirror the payments table columns and Payment interface
 * in payments.models.ts.
 */
export interface OrderPlacedPayment {
    id?: number;                       // payments.id
    payment_method: PaymentMethod;     // payments.payment_method
    payment_gateway?: string;          // payments.payment_gateway
    transaction_id?: string;           // payments.transaction_id
    card_last4?: string;               // payment_methods.card_last4
    amount: number;                    // payments.amount          (DECIMAL 10,2)
    currency: string;                  // payments.currency        (default 'INR')
    tax_amount: number;                // payments.tax_amount      (DECIMAL 10,2)
    discount_amount: number;           // payments.discount_amount (DECIMAL 10,2)
    shipping_amount: number;           // payments.shipping_amount (DECIMAL 10,2)
    total_amount: number;              // payments.total_amount    (DECIMAL 10,2)
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'partially_refunded' | 'cancelled';
}

/**
 * Full order confirmation payload returned after a successful checkout.
 * Field names mirror the orders table columns and Order interface
 * in order.model.ts.
 */
export interface OrderConfirmation {
    // ── Identity ──────────────────────────────────────────────────────────────
    id: number;                        // orders.id
    order_number: string;              // orders.order_number
    user_id?: number;                  // orders.user_id

    // ── Status ────────────────────────────────────────────────────────────────
    status: OrderStatus;               // orders.status
    payment_status: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
    fulfillment_status: 'unfulfilled' | 'partially_fulfilled' | 'fulfilled' | 'returned';

    // ── Pricing (all DECIMAL 10,2 → number) ───────────────────────────────────
    subtotal: number;                  // orders.subtotal
    tax_amount: number;                // orders.tax_amount
    shipping_amount: number;           // orders.shipping_amount
    discount_amount: number;           // orders.discount_amount
    total_amount: number;              // orders.total_amount
    currency: string;                  // orders.currency (default 'INR')

    // ── Coupon ────────────────────────────────────────────────────────────────
    coupon_code?: string;              // orders.coupon_code
    coupon_discount: number;           // orders.coupon_discount

    // ── Addresses ─────────────────────────────────────────────────────────────
    shipping_address_id?: number;      // orders.shipping_address_id
    billing_address_id?: number;       // orders.billing_address_id
    shipping_address?: OrderPlacedAddress;
    billing_address?: OrderPlacedAddress;

    // ── Shipping ──────────────────────────────────────────────────────────────
    shipping_method?: string;          // orders.shipping_method
    tracking_number?: string;          // orders.tracking_number
    carrier?: string;                  // orders.carrier
    estimated_delivery_date?: Date;    // orders.estimated_delivery_date
    actual_delivery_date?: Date;       // orders.actual_delivery_date

    // ── Notes ─────────────────────────────────────────────────────────────────
    customer_notes?: string;           // orders.customer_notes
    internal_notes?: string;           // orders.internal_notes

    // ── Items & Payment ───────────────────────────────────────────────────────
    items: OrderPlacedItem[];
    payment?: OrderPlacedPayment;

    // ── Timestamps ────────────────────────────────────────────────────────────
    confirmed_at?: Date;               // orders.confirmed_at
    shipped_at?: Date;                 // orders.shipped_at
    delivered_at?: Date;               // orders.delivered_at
    cancelled_at?: Date;               // orders.cancelled_at
    created_at: Date;                  // orders.created_at
    updated_at: Date;                  // orders.updated_at
}

/**
 * Event emitted to analytics / CRM / message queues after order placement.
 * Uses number IDs and snake_case timestamps to match the rest of the codebase.
 */
export interface OrderPlacedEvent {
    type: 'ORDER_PLACED';
    payload: OrderConfirmation;
    user_id: number;                   // matches users.id (number, not string)
    session_id: string;
    created_at: Date;                  // snake_case, consistent with all models
}

// ─── Notification Payload ─────────────────────────────────────────────────────

/**
 * Payload for customer confirmation email / SMS.
 * Mirrors field names from OrderConfirmation so callers don't need to remap.
 */
export interface OrderNotificationPayload {
    to: string;                        // customer email
    order_number: string;
    full_name: string;                 // from shipping_address.full_name
    total_amount: number;
    currency: string;
    estimated_delivery_date?: Date;
    items: Pick<OrderPlacedItem, 'product_name' | 'quantity' | 'unit_price'>[];
}

// ─── Utility Helpers ──────────────────────────────────────────────────────────

/**
 * Generates a human-readable order number from an order ID.
 * Format: ORD-YYYYMMDD-XXXXX  (same pattern as OrderModel.generateOrderNumber)
 */
export function generateOrderNumber(orderId: number, date: Date = new Date()): string {
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const shortId = String(orderId).padStart(5, '0');
    return `ORD-${dateStr}-${shortId}`;
}

/**
 * Estimates delivery date based on shipping days, skipping weekends.
 */
export function estimateDeliveryDate(
    placed_at: Date,
    shipping_days: number = 5,
    exclude_weekends: boolean = true
): Date {
    const delivery = new Date(placed_at);
    let days_added = 0;

    while (days_added < shipping_days) {
        delivery.setDate(delivery.getDate() + 1);
        const day = delivery.getDay();
        if (!exclude_weekends || (day !== 0 && day !== 6)) {
            days_added++;
        }
    }

    return delivery;
}

/**
 * Calculates the payment summary from order items and cost inputs.
 * Mirrors the calculation logic in OrderModel.createFromCart().
 */
export function calculatePaymentSummary(params: {
    items: OrderPlacedItem[];
    shipping_amount: number;
    tax_rate: number;          // e.g. 0.18 for 18% GST
    discount_amount?: number;
    currency?: string;
    payment_method?: PaymentMethod;
    transaction_id?: string;
    card_last4?: string;
}): OrderPlacedPayment {
    const subtotal = params.items.reduce(
        (sum, item) => sum + item.unit_price * item.quantity,
        0
    );
    const discount_amount = params.discount_amount ?? 0;
    const tax_amount = parseFloat(
        ((subtotal - discount_amount) * params.tax_rate).toFixed(2)
    );
    const total_amount = parseFloat(
        (subtotal - discount_amount + tax_amount + params.shipping_amount).toFixed(2)
    );

    return {
        payment_method: params.payment_method ?? 'cod',
        transaction_id: params.transaction_id,
        card_last4: params.card_last4,
        amount: subtotal,
        currency: params.currency ?? 'INR',
        tax_amount,
        discount_amount,
        shipping_amount: params.shipping_amount,
        total_amount,
        status: 'pending',
    };
}

// ─── Core Builder ─────────────────────────────────────────────────────────────

/**
 * Builds a full OrderConfirmation object after payment success.
 * Accepts the raw DB order row shape (snake_case) so no remapping is needed.
 */
export function buildOrderConfirmation(params: {
    order: Omit<OrderConfirmation, 'items' | 'payment'>;
    items: OrderPlacedItem[];
    payment?: OrderPlacedPayment;
    shipping_address?: OrderPlacedAddress;
    billing_address?: OrderPlacedAddress;
    shipping_days?: number;
}): OrderConfirmation {
    const estimated_delivery_date =
        params.order.estimated_delivery_date ??
        estimateDeliveryDate(params.order.created_at, params.shipping_days ?? 5);

    return {
        ...params.order,
        estimated_delivery_date,
        items: params.items,
        payment: params.payment,
        shipping_address: params.shipping_address,
        billing_address: params.billing_address,
    };
}

/**
 * Creates the ORDER_PLACED event to emit to analytics, CRM, or message queue.
 */
export function createOrderPlacedEvent(
    order: OrderConfirmation,
    user_id: number,
    session_id: string
): OrderPlacedEvent {
    return {
        type: 'ORDER_PLACED',
        payload: order,
        user_id,
        session_id,
        created_at: new Date(),
    };
}

// ─── Post-Order Side Effects ──────────────────────────────────────────────────

/**
 * Builds the email/SMS notification payload for the customer.
 */
export function buildOrderNotification(
    order: OrderConfirmation,
    customer_email: string
): OrderNotificationPayload {
    return {
        to: customer_email,
        order_number: order.order_number,
        full_name: order.shipping_address?.full_name ?? '',
        total_amount: order.total_amount,
        currency: order.currency,
        estimated_delivery_date: order.estimated_delivery_date,
        items: order.items.map(({ product_name, quantity, unit_price }) => ({
            product_name,
            quantity,
            unit_price,
        })),
    };
}

/**
 * Runs post-order side effects (clear cart, send email, emit event).
 * Each task is isolated — failures are collected and returned, not thrown.
 */
export async function handlePostOrderActions(
    order: OrderConfirmation,
    options: {
        clearCart: () => Promise<void>;
        sendConfirmationEmail: (payload: OrderNotificationPayload) => Promise<void>;
        emitEvent: (event: OrderPlacedEvent) => Promise<void>;
        customer_email: string;
        user_id: number;
        session_id: string;
    }
): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];

    const tasks: Array<{ name: string; fn: () => Promise<void> }> = [
        { name: 'clear_cart', fn: options.clearCart },
        {
            name: 'send_email',
            fn: () =>
                options.sendConfirmationEmail(
                    buildOrderNotification(order, options.customer_email)
                ),
        },
        {
            name: 'emit_event',
            fn: () =>
                options.emitEvent(
                    createOrderPlacedEvent(order, options.user_id, options.session_id)
                ),
        },
    ];

    await Promise.allSettled(
        tasks.map(async (task) => {
            try {
                await task.fn();
            } catch (err) {
                errors.push(`[${task.name}] ${err instanceof Error ? err.message : String(err)}`);
            }
        })
    );

    return { success: errors.length === 0, errors };
}

// ─── Formatting Helpers ───────────────────────────────────────────────────────

/**
 * Formats a monetary amount for display (e.g. "₹1,299.00").
 * Uses 'INR' by default — consistent with currency default across all models.
 */
export function formatOrderTotal(amount: number, currency: string = 'INR'): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
    }).format(amount);
}

/**
 * Returns a user-friendly label for the order status.
 * Covers all statuses in the orders table CHECK constraint.
 */
export function getOrderStatusLabel(status: OrderStatus): string {
    const labels: Record<OrderStatus, string> = {
        pending: 'Pending',
        confirmed: 'Order Confirmed',
        processing: 'Processing',
        packed: 'Packed',
        shipped: 'Shipped',
        out_for_delivery: 'Out for Delivery',
        delivered: 'Delivered',
        cancelled: 'Cancelled',
        refunded: 'Refunded',
    };
    return labels[status];
}

/**
 * Returns a summary string for the order confirmation page / toast.
 */
export function getOrderConfirmationMessage(order: OrderConfirmation): string {
    const delivery = order.estimated_delivery_date
        ? order.estimated_delivery_date.toDateString()
        : 'soon';
    return (
        `🎉 Order ${order.order_number} placed successfully! ` +
        `Expected delivery by ${delivery}. ` +
        `Total: ${formatOrderTotal(order.total_amount, order.currency)}.`
    );
}