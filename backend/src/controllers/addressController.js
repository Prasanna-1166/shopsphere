const prisma = require('../config/prisma');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Get Authenticated Customer Addresses
 */
const getAddresses = async (req, res, next) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return sendSuccess(res, 'Addresses fetched successfully.', { addresses });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a New Delivery Address
 */
const createAddress = async (req, res, next) => {
  try {
    const {
      fullName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country = 'India',
      isDefault = false,
    } = req.body;

    if (!fullName || !phone || !addressLine1 || !city || !state || !postalCode) {
      return sendError(res, 'Full name, phone, address line 1, city, state, and postal code are required.', [], 400);
    }

    const existingCount = await prisma.address.count({
      where: { userId: req.user.id },
    });

    const shouldBeDefault = isDefault || existingCount === 0;

    if (shouldBeDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user.id },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        userId: req.user.id,
        fullName: fullName.trim(),
        phone: phone.trim(),
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2 ? addressLine2.trim() : null,
        city: city.trim(),
        state: state.trim(),
        postalCode: postalCode.trim(),
        country: country.trim(),
        isDefault: shouldBeDefault,
      },
    });

    return sendSuccess(res, 'Address created successfully.', { address }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update Address (IDOR protected)
 */
const updateAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      fullName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      isDefault,
    } = req.body;

    const existing = await prisma.address.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== req.user.id) {
      return sendError(res, 'Address not found.', [], 404);
    }

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user.id, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.address.update({
      where: { id },
      data: {
        ...(fullName && { fullName: fullName.trim() }),
        ...(phone && { phone: phone.trim() }),
        ...(addressLine1 && { addressLine1: addressLine1.trim() }),
        ...(addressLine2 !== undefined && { addressLine2: addressLine2 ? addressLine2.trim() : null }),
        ...(city && { city: city.trim() }),
        ...(state && { state: state.trim() }),
        ...(postalCode && { postalCode: postalCode.trim() }),
        ...(country && { country: country.trim() }),
        ...(isDefault !== undefined && { isDefault }),
      },
    });

    return sendSuccess(res, 'Address updated successfully.', { address: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Address (IDOR protected)
 */
const deleteAddress = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.address.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== req.user.id) {
      return sendError(res, 'Address not found.', [], 404);
    }

    await prisma.address.delete({
      where: { id },
    });

    // If deleted address was default, set next available address as default
    if (existing.isDefault) {
      const remaining = await prisma.address.findFirst({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
      });
      if (remaining) {
        await prisma.address.update({
          where: { id: remaining.id },
          data: { isDefault: true },
        });
      }
    }

    return sendSuccess(res, 'Address deleted successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * Set Address as Default (IDOR protected)
 */
const setDefaultAddress = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.address.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== req.user.id) {
      return sendError(res, 'Address not found.', [], 404);
    }

    await prisma.address.updateMany({
      where: { userId: req.user.id },
      data: { isDefault: false },
    });

    const updated = await prisma.address.update({
      where: { id },
      data: { isDefault: true },
    });

    return sendSuccess(res, 'Default address updated.', { address: updated });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};
