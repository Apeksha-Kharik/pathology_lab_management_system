const { test } = require("node:test");
const assert = require("node:assert/strict");
const { validateRequest } = require("../middleware/validateRequest");

const validate = async (body) => {
  const result = { passed: false };
  const res = {
    status(code) { result.code = code; return this; },
    json(data) { result.message = data.message; return this; }
  };
  await validateRequest({ method: "PUT", path: "/profile", originalUrl: "/profile", body }, res,
    (error) => { assert.ifError(error); result.passed = true; });
  return result;
};
const profile = { name: "Test Patient", phone: "9876543210", age: 18,
  emergencyContactName: "", emergencyContactPhone: "" };

test("phone update permits empty optional emergency contact fields", async () => {
  assert.equal((await validate(profile)).passed, true);
});
test("optional emergency fields may be omitted or cleared", async () => {
  for (const value of [undefined, null, "", "   "]) {
    assert.equal((await validate({ ...profile, emergencyContactName: value, emergencyContactPhone: value })).passed, true);
  }
});
test("required name and phone cannot be cleared", async () => {
  for (const field of ["name", "phone"]) {
    assert.equal((await validate({ ...profile, [field]: "" })).code, 400);
  }
});
test("nonempty invalid emergency contact values are rejected", async () => {
  assert.equal((await validate({ ...profile, emergencyContactName: "123" })).code, 400);
  assert.equal((await validate({ ...profile, emergencyContactPhone: "123" })).code, 400);
});
