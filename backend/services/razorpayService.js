const https = require("https");

const requestRazorpay = ({ method = "GET", path, body }) => new Promise((resolve, reject) => {
  const json = body ? JSON.stringify(body) : "";
  const request = https.request({
    hostname: "api.razorpay.com",
    path,
    method,
    auth: `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`,
    headers: { "Content-Type": "application/json", ...(json ? { "Content-Length": Buffer.byteLength(json) } : {}) },
    timeout: 15000
  }, (response) => {
    let responseBody = "";
    response.on("data", (chunk) => { responseBody += chunk; });
    response.on("end", () => {
      let data;
      try { data = JSON.parse(responseBody); } catch { data = { raw: responseBody }; }
      if (response.statusCode >= 200 && response.statusCode < 300) return resolve(data);
      const error = new Error(data.error?.description || `Razorpay returned HTTP ${response.statusCode}`);
      error.statusCode = response.statusCode;
      reject(error);
    });
  });
  request.on("timeout", () => request.destroy(new Error("Razorpay request timed out")));
  request.on("error", reject);
  if (json) request.write(json);
  request.end();
});

const createOrder = (body) => requestRazorpay({ method: "POST", path: "/v1/orders", body });
const fetchPayment = (paymentId) => requestRazorpay({ path: `/v1/payments/${encodeURIComponent(paymentId)}` });
const isConfigured = () => Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

module.exports = { createOrder, fetchPayment, isConfigured };
