// Export middleware functions for easier imports
export { authMiddleware as jwtMiddleware } from "./auth.middleware";
export { optionalAuthMiddleware } from "./auth.middleware";
export { requireRole, requireAdmin, requireVendorOrAdmin } from "./auth.middleware";
export type { JWTPayload, AuthContext } from "./auth.middleware";
