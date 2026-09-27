const https = require("https");
const WhatsAppNotification = require("../models/WhatsAppNotification");

const TEMPLATE_ENV_BY_EVENT = {
  booking_confirmed: "WHATSAPP_TEMPLATE_BOOKING_CONFIRMED",
  booking_rejected: "WHATSAPP_TEMPLATE_BOOKING_REJECTED",
  payment_received: "WHATSAPP_TEMPLATE_RECEIPT_DOCUMENT",
  report_ready: "WHATSAPP_TEMPLATE_REPORT_DOCUMENT"
};

const normalizeWhatsAppNumber = (value) => {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `${process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || "91"}${digits}`;
  if (digits.startsWith("00")) return digits.slice(2);
  return digits;
};

const getWhatsAppStatus = () => ({
  configured: Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID),
  phoneNumberIdConfigured: Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID),
  accessTokenConfigured: Boolean(process.env.WHATSAPP_ACCESS_TOKEN),
  apiVersion: process.env.WHATSAPP_API_VERSION || "v23.0",
  defaultCountryCode: process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || "91",
  templates: Object.fromEntries(Object.entries(TEMPLATE_ENV_BY_EVENT).map(([event, key]) => [event, Boolean(process.env[key])]))
});

const saveNotification = async (entry) => {
  try { await WhatsAppNotification.create(entry); }
  catch (error) { console.error(`WhatsApp notification log failed: ${error.message}`); }
};

const requestCloudApi = (payload) => new Promise((resolve) => {
  const json = JSON.stringify(payload);
  const request = https.request({
    hostname: "graph.facebook.com",
    path: `/${process.env.WHATSAPP_API_VERSION || "v23.0"}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`, "Content-Type": "application/json", "Content-Length": Buffer.byteLength(json) },
    timeout: Number(process.env.WHATSAPP_REQUEST_TIMEOUT_MS) || 10000
  }, (response) => {
    let responseBody = "";
    response.on("data", (chunk) => { responseBody += chunk; });
    response.on("end", () => {
      let data;
      try { data = JSON.parse(responseBody); } catch { data = { raw: responseBody }; }
      resolve({ ok: response.statusCode >= 200 && response.statusCode < 300, statusCode: response.statusCode, data });
    });
  });
  request.on("timeout", () => request.destroy(new Error("WhatsApp Cloud API request timed out")));
  request.on("error", (error) => resolve({ ok: false, statusCode: 0, data: { error: { message: error.message } } }));
  request.write(json);
  request.end();
});

const buildPayload = ({ phone, body, event, parameters = [], templateName }) => {
  const selectedTemplate = templateName || process.env[TEMPLATE_ENV_BY_EVENT[event]];
  if (selectedTemplate) {
    const values = parameters.map((value) => ({ type: "text", text: String(value ?? "N/A") }));
    return { messaging_product: "whatsapp", recipient_type: "individual", to: phone, type: "template", template: { name: selectedTemplate, language: { code: process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en_US" }, ...(values.length ? { components: [{ type: "body", parameters: values }] } : {}) } };
  }
  return { messaging_product: "whatsapp", recipient_type: "individual", to: phone, type: "text", text: { preview_url: false, body } };
};

const sendWhatsAppMessage = async ({ to, body, event = "manual", parameters = [], templateName }) => {
  const phone = normalizeWhatsAppNumber(to);
  const status = getWhatsAppStatus();
  const messageType = templateName || process.env[TEMPLATE_ENV_BY_EVENT[event]] ? "template" : "text";
  if (!phone || !body) return { sent: false, skipped: true, error: "Phone number and message are required" };
  if (!status.configured) {
    await saveNotification({ phone, event, messageType, status: "SKIPPED", error: "WhatsApp credentials are not configured" });
    return { sent: false, skipped: true, error: "WhatsApp credentials are not configured" };
  }
  const result = await requestCloudApi(buildPayload({ phone, body, event, parameters, templateName }));
  const messageId = result.data?.messages?.[0]?.id || "";
  const error = result.data?.error?.message || (!result.ok ? `WhatsApp API returned HTTP ${result.statusCode}` : "");
  await saveNotification({ phone, event, messageType, status: result.ok ? "SENT" : "FAILED", messageId, error, responseStatus: result.statusCode });
  if (!result.ok) console.error(`WhatsApp notification failed: ${error}`);
  return { sent: result.ok, messageId, statusCode: result.statusCode, error: error || undefined };
};

const sendWhatsAppDocument = async ({ to, event, buffer, filename, caption, parameters = [] }) => {
  const phone = normalizeWhatsAppNumber(to);
  const templateName = process.env[event === "payment_received" ? "WHATSAPP_TEMPLATE_RECEIPT_DOCUMENT" : "WHATSAPP_TEMPLATE_REPORT_DOCUMENT"];
  const messageType = templateName ? "template" : "document";
  if (!phone || !getWhatsAppStatus().configured) return { sent: false, skipped: true, error: "WhatsApp phone or credentials missing" };
  try {
    const form = new FormData();
    form.append("messaging_product", "whatsapp");
    form.append("type", "application/pdf");
    form.append("file", new Blob([buffer], { type: "application/pdf" }), filename);
    const upload = await fetch(`https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION || "v23.0"}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/media`, {
      method: "POST", headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` }, body: form,
      signal: AbortSignal.timeout(Number(process.env.WHATSAPP_REQUEST_TIMEOUT_MS) || 10000)
    });
    const media = await upload.json();
    if (!upload.ok || !media.id) throw new Error(media.error?.message || "PDF upload failed");
    const document = { id: media.id, filename };
    const payload = { messaging_product: "whatsapp", to: phone, type: templateName ? "template" : "document" };
    if (templateName) {
      payload.template = { name: templateName, language: { code: process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en_US" }, components: [
        { type: "header", parameters: [{ type: "document", document }] },
        ...(parameters.length ? [{ type: "body", parameters: parameters.map(value => ({ type: "text", text: String(value ?? "N/A") })) }] : [])
      ] };
    } else payload.document = { ...document, caption };
    const result = await requestCloudApi(payload);
    if (!result.ok) throw new Error(result.data?.error?.message || `WhatsApp API returned HTTP ${result.statusCode}`);
    const messageId = result.data?.messages?.[0]?.id || "";
    await saveNotification({ phone, event, messageType, status: "SENT", messageId, responseStatus: result.statusCode });
    return { sent: true, messageId };
  } catch (error) {
    await saveNotification({ phone, event, messageType, status: "FAILED", error: error.message });
    console.error("WhatsApp PDF failed:", error.message);
    return { sent: false, error: error.message };
  }
};

module.exports = { sendWhatsAppMessage, sendWhatsAppDocument, normalizeWhatsAppNumber, getWhatsAppStatus };
