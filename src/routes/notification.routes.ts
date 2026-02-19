
import { Elysia } from 'elysia';
import { NotificationController } from '../controller/notification.controller';
import { jwtMiddleware, type AuthContext } from '../middleware/jwt.middleware';

export const notificationRoutes = new Elysia({ prefix: '/api/notifications' })
    .onBeforeHandle(jwtMiddleware)
    .get('/', (context) => NotificationController.getNotifications(context as unknown as AuthContext))
    .get('/unread-count', (context) => NotificationController.getUnreadCount(context as unknown as AuthContext))
    .patch('/:id/read', (context) => NotificationController.markAsRead(context as unknown as AuthContext));
