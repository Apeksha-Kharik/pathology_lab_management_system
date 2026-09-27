const mongoose = require("mongoose");

const whatsAppNotificationSchema = new mongoose.Schema({
  phone: { type: String, required: true, index: true },
  event: { type: String, required: true, index: true },
  messageType: { type: String, enum: ["text", "template", "document"], required: true },
  status: { type: String, enum: ["SENT", "FAILED", "SKIPPED"], required: true, index: true },
  messageId: { type: String, default: "" },
  responseStatus: { type: Number, default: 0 },
  error: { type: String, default: "" }
}, { timestamps: true });

module.exports = mongoose.model("WhatsAppNotification", whatsAppNotificationSchema);
