/**
 * Shopping Cart Model
 * Defines types and interfaces for cart functionality
 */

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  category?: string;
  stock?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  addedAt: Date;
}

export interface Cart {
  id: string;
  userId?: string;
  items: CartItem[];
  createdAt: Date;
  updatedAt: Date;
  couponCode?: string;
  discount?: number;
}

export interface CartSummary {
  itemCount: number;
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
}

export interface CartOperationResult {
  success: boolean;
  message?: string;
  cart?: Cart;
}

export class CartModel {
  /**
   * Calculate the subtotal of all items in the cart
   */
  static calculateSubtotal(items: CartItem[]): number {
    return items.reduce((sum, item) => {
      return sum + item.product.price * item.quantity;
    }, 0);
  }

  /**
   * Calculate the total number of items in the cart
   */
  static getItemCount(items: CartItem[]): number {
    return items.reduce((count, item) => count + item.quantity, 0);
  }

  /**
   * Get a cart summary with all pricing details
   */
  static getCartSummary(
    cart: Cart,
    taxRate: number = 0,
    shippingCost: number = 0
  ): CartSummary {
    const subtotal = this.calculateSubtotal(cart.items);
    const discount = cart.discount || 0;
    const discountedSubtotal = subtotal - discount;
    const tax = discountedSubtotal * taxRate;
    const total = discountedSubtotal + tax + shippingCost;

    return {
      itemCount: this.getItemCount(cart.items),
      subtotal,
      discount,
      tax,
      shipping: shippingCost,
      total,
    };
  }

  /**
   * Find a cart item by product ID
   */
  static findCartItem(items: CartItem[], productId: string): CartItem | undefined {
    return items.find((item) => item.product.id === productId);
  }

  /**
   * Add an item to the cart or update quantity if it exists
   */
  static addItem(cart: Cart, product: Product, quantity: number = 1): Cart {
    const existingItem = this.findCartItem(cart.items, product.id);

    if (existingItem) {
      return {
        ...cart,
        items: cart.items.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        ),
        updatedAt: new Date(),
      };
    }

    return {
      ...cart,
      items: [
        ...cart.items,
        {
          product,
          quantity,
          addedAt: new Date(),
        },
      ],
      updatedAt: new Date(),
    };
  }

  /**
   * Remove an item from the cart
   */
  static removeItem(cart: Cart, productId: string): Cart {
    return {
      ...cart,
      items: cart.items.filter((item) => item.product.id !== productId),
      updatedAt: new Date(),
    };
  }

  /**
   * Update the quantity of a cart item
   */
  static updateQuantity(cart: Cart, productId: string, quantity: number): Cart {
    if (quantity <= 0) {
      return this.removeItem(cart, productId);
    }

    return {
      ...cart,
      items: cart.items.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      ),
      updatedAt: new Date(),
    };
  }

  /**
   * Clear all items from the cart
   */
  static clearCart(cart: Cart): Cart {
    return {
      ...cart,
      items: [],
      couponCode: undefined,
      discount: 0,
      updatedAt: new Date(),
    };
  }

  /**
   * Apply a discount to the cart
   */
  static applyDiscount(cart: Cart, couponCode: string, discountAmount: number): Cart {
    return {
      ...cart,
      couponCode,
      discount: discountAmount,
      updatedAt: new Date(),
    };
  }

  /**
   * Create a new empty cart
   */
  static createCart(userId?: string): Cart {
    return {
      id: this.generateCartId(),
      userId,
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Generate a unique cart ID
   */
  private static generateCartId(): string {
    return `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate if a product can be added to cart (stock check)
   */
  static canAddToCart(product: Product, requestedQuantity: number, currentQuantity: number = 0): boolean {
    if (product.stock === undefined) return true;
    return product.stock >= requestedQuantity + currentQuantity;
  }
}

export default CartModel;