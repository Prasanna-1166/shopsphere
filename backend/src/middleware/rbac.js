const { sendError } = require('../utils/response');

/**
 * Role-Based Access Control (RBAC) Middleware
 * Restricts route access to specified roles
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required.', [], 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(res, 'Access denied. You do not have permission to perform this action.', [], 403);
    }

    next();
  };
};

const requireAdmin = requireRole('ADMIN', 'SUPER_ADMIN');
const requireSuperAdmin = requireRole('SUPER_ADMIN');

module.exports = {
  requireRole,
  requireAdmin,
  requireSuperAdmin,
};
