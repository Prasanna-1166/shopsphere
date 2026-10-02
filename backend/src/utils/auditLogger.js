/**
 * ShopSphere — Audit Logger Utility
 * Safe for both PostgreSQL (JSON) and SQLite (String)
 */

const createAuditLog = async (prisma, { userId, action, entity, entityId, metadata }) => {
  try {
    const formattedMetadata = metadata && typeof metadata === 'object' 
      ? JSON.stringify(metadata) 
      : (metadata || null);

    return await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        entity,
        entityId: entityId ? String(entityId) : null,
        metadata: formattedMetadata,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error.message);
    return null;
  }
};

module.exports = {
  createAuditLog,
};
