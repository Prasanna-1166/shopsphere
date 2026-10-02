const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const { signToken, attachAuthCookie, clearAuthCookie } = require('../utils/jwt');
const { sendSuccess, sendError } = require('../utils/response');
const { createAuditLog } = require('../utils/auditLogger');

/**
 * Register a new Customer
 * Note: Role is strictly forced to CUSTOMER to prevent privilege escalation.
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return sendError(res, 'Name, email, and password are required.', [], 400);
    }

    if (password.length < 6) {
      return sendError(res, 'Password must be at least 6 characters long.', [], 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return sendError(res, 'Please provide a valid email address.', [], 400);
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check existing
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return sendError(res, 'An account with this email already exists.', [], 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: 'CUSTOMER', // Strict RBAC
        status: 'ACTIVE',
        cart: {
          create: {},
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    attachAuthCookie(res, token);

    return sendSuccess(res, 'Registration successful. Welcome to ShopSphere!', { user, token }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Customer Login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 'Email and password are required.', [], 400);
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return sendError(res, 'Invalid email or password.', [], 401);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return sendError(res, 'Invalid email or password.', [], 401);
    }

    if (user.status !== 'ACTIVE') {
      return sendError(res, `Account is currently ${user.status.toLowerCase()}. Please contact support.`, [], 403);
    }

    // Ensure user has a cart
    let cart = await prisma.cart.findUnique({ where: { userId: user.id } });
    if (!cart) {
      await prisma.cart.create({ data: { userId: user.id } });
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    attachAuthCookie(res, token);

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
    };

    return sendSuccess(res, 'Logged in successfully.', { user: safeUser, token });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin Login (Strictly for ADMIN and SUPER_ADMIN)
 */
const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 'Admin credentials are required.', [], 400);
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return sendError(res, 'Invalid administrative credentials.', [], 401);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return sendError(res, 'Invalid administrative credentials.', [], 401);
    }

    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return sendError(res, 'Access denied. You do not possess administrative privileges.', [], 403);
    }

    if (user.status !== 'ACTIVE') {
      return sendError(res, 'Administrative account is inactive.', [], 403);
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    attachAuthCookie(res, token);

    // Audit Log for Admin Login
    await createAuditLog(prisma, {
      userId: user.id,
      action: 'ADMIN_LOGIN',
      entity: 'AUTH',
      entityId: user.id,
      metadata: { ip: req.ip, userAgent: req.get('user-agent') },
    });

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
    };

    return sendSuccess(res, 'Administrative login successful.', { user: safeUser, token });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout
 */
const logout = async (req, res) => {
  clearAuthCookie(res);
  return sendSuccess(res, 'Logged out successfully.');
};

/**
 * Get Current Authenticated User & Profile
 */
const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        addresses: {
          orderBy: { isDefault: 'desc' },
        },
        cart: {
          include: {
            items: {
              include: {
                product: {
                  include: { images: true },
                },
              },
            },
          },
        },
        _count: {
          select: {
            orders: true,
            wishlist: true,
          },
        },
      },
    });

    return sendSuccess(res, 'User profile fetched.', { user });
  } catch (error) {
    next(error);
  }
};

/**
 * Get CSRF Token Helper
 */
const getCsrfToken = (req, res) => {
  const token = req.cookies['shopsphere_csrf'] || null;
  return sendSuccess(res, 'CSRF token retrieved.', { csrfToken: token });
};

module.exports = {
  register,
  login,
  adminLogin,
  logout,
  getMe,
  getCsrfToken,
};
