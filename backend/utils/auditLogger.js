const AuditLog = require("../models/AuditLog");

const writeAuditLog = async ({ actor, action, entityType, entityId, details = {} }) => {
  try {
    await AuditLog.create({
      actorId: actor?._id,
      actorName: actor?.name || "",
      actorRole: actor?.role || "",
      action,
      entityType,
      entityId,
      details
    });
  } catch (error) {
    console.error("Audit log write failed:", error.message);
  }
};

module.exports = { writeAuditLog };
