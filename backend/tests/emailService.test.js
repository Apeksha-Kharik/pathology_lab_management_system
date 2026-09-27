const { test, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const nodemailer = require("nodemailer");
const realCreateTransport = nodemailer.createTransport.bind(nodemailer);
const { sendEmail, sendOtpEmail } = require("../services/emailService");
let response;
let outgoing;
let original;
beforeEach((t) => {
  original = { EMAIL_USER: process.env.EMAIL_USER, EMAIL_PASS: process.env.EMAIL_PASS, EMAIL_FROM: process.env.EMAIL_FROM };
  process.env.EMAIL_USER = "sender@example.test";
  process.env.EMAIL_PASS = "test-only";
  process.env.EMAIL_FROM = "sender@example.test";
  response = { accepted: ["recipient@example.test"], rejected: [], messageId: "test-message" };
  t.mock.method(nodemailer, "createTransport", () => ({ sendMail: async (message) => {
    outgoing = message;
    if (response instanceof Error) throw response;
    return response;
  } }));
});
afterEach(() => {
  for (const [key, value] of Object.entries(original)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});
const message = { to: "recipient@example.test", subject: "Verification", otp: "123456" };
test("OTP is included in both email formats; SMTP acceptance returns message ID", async () => {
  const result = await sendOtpEmail(message);
  assert.equal(result.sent, true);
  assert.equal(result.messageId, "test-message");
  assert.equal(outgoing.to, message.to);
  assert.match(outgoing.text, /123456/);
  assert.match(outgoing.html, /123456/);
});
test("empty SMTP acceptance is not reported as successful", async () => {
  response = { accepted: [], rejected: [] };
  await assert.rejects(sendOtpEmail(message), /Unable to send OTP/);
});
test("partial recipient rejection is reported as unsuccessful", async () => {
  response.rejected = ["other@example.test"];
  assert.equal((await sendEmail(message)).sent, false);
});
test("SMTP authentication failure rejects OTP delivery", async () => {
  response = Object.assign(new Error("Authentication failed"), { code: "EAUTH", responseCode: 535 });
  await assert.rejects(sendOtpEmail(message), { code: "EAUTH", responseCode: 535 });
});

test("real mail composer addresses the intended recipient and includes the OTP", async (t) => {
  const transport = realCreateTransport({ streamTransport: true, buffer: true });
  let composed;
  t.mock.method(nodemailer, "createTransport", () => ({ sendMail: async (payload) => {
    composed = await transport.sendMail(payload);
    return { ...composed, accepted: composed.envelope.to, rejected: [] };
  } }));
  await sendOtpEmail(message);
  assert.deepEqual(composed.envelope.to, [message.to]);
  const mime = composed.message.toString();
  assert.match(mime, /Content-Type: multipart\/alternative/);
  assert.match(mime, /Your OTP is 123456/);
  assert.match(mime, /<h1>123456<\/h1>/);
});
test("missing credentials cannot report OTP success", async () => {
  delete process.env.EMAIL_PASS;
  await assert.rejects(sendOtpEmail(message), /not configured/);
});
