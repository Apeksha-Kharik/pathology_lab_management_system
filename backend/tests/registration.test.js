const { test, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const User = require("../models/User");
const pending = require("../services/pendingRegistrations");

let deliveredOtp;
let emailFails;
const emailPath = require.resolve("../config/email");
require.cache[emailPath] = { id: emailPath, filename: emailPath, loaded: true, exports: {
  sendOtpEmail: async ({ otp }) => {
    deliveredOtp = otp;
    if (emailFails) throw new Error("SMTP unavailable");
  }
} };
const { register, verifyOtp, cancelRegistration } = require("../controllers/authController");
const details = { name: "Test Patient", email: "patient@example.test", password: "Password1!", phone: "9876543210", age: 25, city: "Mumbai", address: "Test address" };
let writes;
let ids;
const originalEnvironment = process.env.NODE_ENV;
beforeEach((t) => {
  process.env.NODE_ENV = "production";
  writes = [];
  ids = [];
  emailFails = false;
  t.mock.method(User, "findOne", async () => null);
  t.mock.method(User, "create", async (data) => { writes.push(data); return data; });
});
afterEach(() => {
  ids.forEach(pending.discard);
  if (originalEnvironment === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalEnvironment;
});
const call = async (handler, body) => {
  const res = { code: 200, status(code) { this.code = code; return this; }, json(data) { this.data = data; return this; } };
  await handler({ body }, res);
  if (res.data.registrationId) ids.push(res.data.registrationId);
  return res;
};

test("OTP request writes nothing; correct verification inserts a complete account only once", async () => {
  const start = await call(register, details);
  assert.equal(start.code, 201);
  assert.equal(writes.length, 0);
  const payload = { registrationId: start.data.registrationId, otp: deliveredOtp };
  const results = await Promise.all([call(verifyOtp, payload), call(verifyOtp, payload)]);
  assert.deepEqual(results.map(r => r.code).sort(), [200, 400]);
  assert.equal(writes.length, 1);
  assert.equal(writes[0].isVerified, true);
  assert.equal(writes[0].otp, undefined);
  assert.notEqual(writes[0].password, details.password);
});

test("wrong OTP consumes attempt with zero writes, even if retried with correct OTP", async () => {
  const start = await call(register, details);
  const payload = { registrationId: start.data.registrationId, otp: "wrong" };
  assert.equal((await call(verifyOtp, payload)).code, 400);
  assert.equal((await call(verifyOtp, { ...payload, otp: deliveredOtp })).code, 400);
  assert.equal(writes.length, 0);
});

test("cancelled attempt cannot create an account", async () => {
  const start = await call(register, details);
  await call(cancelRegistration, { registrationId: start.data.registrationId });
  assert.equal((await call(verifyOtp, { registrationId: start.data.registrationId, otp: deliveredOtp })).code, 400);
  assert.equal(writes.length, 0);
});

test("expired attempt cannot create an account", async (t) => {
  const start = await call(register, details);
  const future = Date.now() + 11 * 60 * 1000;
  t.mock.method(Date, "now", () => future);
  assert.equal((await call(verifyOtp, { registrationId: start.data.registrationId, otp: deliveredOtp })).code, 400);
  assert.equal(writes.length, 0);
});

test("failed email delivery does not persist registration or expose an attempt", async () => {
  emailFails = true;
  const result = await call(register, details);
  assert.equal(result.code, 503);
  assert.equal(result.data.registrationId, undefined);
  assert.equal(writes.length, 0);
});

test("invalid form never writes an account", async () => {
  assert.equal((await call(register, { ...details, age: 12 })).code, 400);
  assert.equal((await call(register, { ...details, password: "Password!" })).code, 400);
  assert.equal(writes.length, 0);
});

test("database failure consumes attempt without a partial write", async (t) => {
  const start = await call(register, details);
  t.mock.method(User, "create", async () => { throw new Error("Database unavailable"); });
  const payload = { registrationId: start.data.registrationId, otp: deliveredOtp };
  assert.equal((await call(verifyOtp, payload)).code, 500);
  assert.equal((await call(verifyOtp, payload)).code, 400);
  assert.equal(writes.length, 0);
});

test("duplicate email at commit returns conflict and never deletes existing accounts", async (t) => {
  const start = await call(register, details);
  t.mock.method(User, "create", async () => { throw Object.assign(new Error("Duplicate email"), { code: 11000 }); });
  t.mock.method(User, "deleteOne", () => assert.fail("Must not delete an existing user"));
  assert.equal((await call(verifyOtp, { registrationId: start.data.registrationId, otp: deliveredOtp })).code, 409);
  await call(cancelRegistration, { email: details.email });
  assert.equal(writes.length, 0);
});
