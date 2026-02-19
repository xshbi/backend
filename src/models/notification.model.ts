
import { sql } from '../db/schema';

export interface Notification {
    id: number;
    recipient_id: number;
    type: string;
    title: string;
    message: string;
    reference_type?: string;
    reference_id?: number;
    is_read: boolean;
    created_at: Date;
}

// Create notifications table
export const createNotificationsTable = async () => {
    await sql`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      recipient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL, -- 'new_order', 'order_status', 'system', etc.
      title VARCHAR(255) NOT NULL,
      message TEXT,
      reference_type VARCHAR(50), -- 'order', 'product', etc.
      reference_id INTEGER,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
    await sql`CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC)`;
};

export class NotificationModel {
    // Create notification
    static async create(data: {
        recipient_id: number;
        type: string;
        title: string;
        message?: string;
        reference_type?: string;
        reference_id?: number;
    }): Promise<Notification> {
        const [row] = await sql`
      INSERT INTO notifications ${sql(data)}
      RETURNING *
    `;
        return row as Notification;
    }

    // Get notifications for user
    static async getForUser(userId: number, limit: number = 20, offset: number = 0, unreadOnly: boolean = false): Promise<Notification[]> {
        let query = sql`
      SELECT * FROM notifications 
      WHERE recipient_id = ${userId}
    `;

        if (unreadOnly) {
            query = sql`${query} AND is_read = FALSE`;
        }

        query = sql`${query} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

        const rows = await query;
        return rows as Notification[];
    }

    // Get unread count
    static async getUnreadCount(userId: number): Promise<number> {
        const results = await sql`
      SELECT COUNT(*) as count FROM notifications 
      WHERE recipient_id = ${userId} AND is_read = FALSE
    `;
        return parseInt(results[0]?.count || '0');
    }

    // Mark as read
    static async markAsRead(id: number, userId: number): Promise<boolean> {
        const result = await sql`
      UPDATE notifications 
      SET is_read = TRUE 
      WHERE id = ${id} AND recipient_id = ${userId}
    `;
        return result.count > 0;
    }

    // Mark all as read
    static async markAllAsRead(userId: number): Promise<void> {
        await sql`
      UPDATE notifications 
      SET is_read = TRUE 
      WHERE recipient_id = ${userId} AND is_read = FALSE
    `;
    }

    // Delete notification
    static async delete(id: number, userId: number): Promise<boolean> {
        const result = await sql`
      DELETE FROM notifications 
      WHERE id = ${id} AND recipient_id = ${userId}
    `;
        return result.count > 0;
    }
}
