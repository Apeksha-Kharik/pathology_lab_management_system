const WhatsAppNotification = require("../models/WhatsAppNotification");
const { getWhatsAppStatus, sendWhatsAppMessage } = require("../services/whatsappService");

const getStatus = async (req, res) => {
  try {
    const recent = await WhatsAppNotification.find().sort({ createdAt: -1 }).limit(10).select("phone event messageType status messageId responseStatus error createdAt");
    res.json({ ...getWhatsAppStatus(), recent });
  } catch (error) {
    res.status(500).json({ message: "Unable to load WhatsApp integration status" });
  }
};

const sendTest = async (req, res) => {
  const phone = String(req.body.phone || "").trim();
  if (!phone) return res.status(400).json({ message: "Phone number is required" });
  const result = await sendWhatsAppMessage({ to: phone, body: req.body.message || "INDIPATH WhatsApp integration test successful.", event: "manual", templateName: req.body.templateName, parameters: Array.isArray(req.body.parameters) ? req.body.parameters : [] });
  if (!result.sent) return res.status(result.skipped ? 503 : 502).json({ message: result.error || "WhatsApp test message failed", result });
  res.json({ message: "WhatsApp test message sent successfully", result });
};

module.exports = { getStatus, sendTest };
