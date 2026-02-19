
import { Context } from 'elysia';
import { NotificationModel } from '../models/notification.model';

export class NotificationController {
    static async getNotifications(context: Context) {
        // @ts-ignore
        const userId = context.user?.userId;
        if (!userId) {
            return { success: false, message: "Unauthorized" };
        }

        // @ts-ignore
        const { limit, offset, unread_only } = context.query;

        const notifications = await NotificationModel.getForUser(
            userId,
            Number(limit) || 20,
            Number(offset) || 0,
            unread_only === 'true'
        );

        return {
            success: true,
            data: notifications
        };
    }

    static async getUnreadCount(context: Context) {
        // @ts-ignore
        const userId = context.user?.userId;
        if (!userId) {
            return { success: false, message: "Unauthorized" };
        }
        const count = await NotificationModel.getUnreadCount(userId);
        return {
            success: true,
            data: { count }
        };
    }

    static async markAsRead(context: Context) {
        // @ts-ignore
        const userId = context.user?.userId;
        if (!userId) {
            return { success: false, message: "Unauthorized" };
        }
        // @ts-ignore
        const id = Number(context.params.id);

        const success = await NotificationModel.markAsRead(id, userId);
        if (!success) {
            return {
                success: false,
                message: 'Notification not found'
            };
        }

        return {
            success: true,
            message: 'Notification marked as read'
        };
    }
}
