const https = require("https");

const normalizeWhatsAppNumber = (value) => {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `${process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || "91"}${digits}`;
  return digits;
};

const isConfigured = () => Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);

const sendWhatsAppMessage = async ({ to, body }) => {
  const phone = normalizeWhatsAppNumber(to);
  if (!phone || !body || !isConfigured()) {
    if (!isConfigured()) {
      console.log("WhatsApp notification skipped: missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID");
    }
    return { skipped: true };
  }

  const version = process.env.WHATSAPP_API_VERSION || "v20.0";
  const payload = JSON.stringify({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: phone,
    type: "text",
    text: {
      preview_url: false,
      body
    }
  });

  const options = {
    hostname: "graph.facebook.com",
    path: `/${version}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(payload)
    }
  };

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let responseBody = "";
      res.on("data", (chunk) => {
        responseBody += chunk;
      });
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ sent: true, response: responseBody });
          return;
        }
        console.log(`WhatsApp notification failed: ${res.statusCode} ${responseBody}`);
        resolve({ sent: false, error: responseBody });
      });
    });

    req.on("error", (error) => {
      console.log(`WhatsApp notification failed: ${error.message}`);
      resolve({ sent: false, error: error.message });
    });

    req.write(payload);
    req.end();
  });
};

module.exports = { sendWhatsAppMessage, normalizeWhatsAppNumber };
