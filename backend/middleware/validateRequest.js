const Booking = require("../models/Booking");
const NAME = /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^\d{10}$/;
const fail = (res, message) => res.status(400).json({ message });
const clean = (value) => String(value ?? "").trim();

const validateRequest = async (req, res, next) => {
  try {
    if (!["POST", "PUT", "PATCH"].includes(req.method)) return next();
    const body = req.body || {};

    for (const field of ["name", "patientName", "emergencyContactName"]) {
      if (body[field] !== undefined && (!clean(body[field]) || !NAME.test(clean(body[field])))) return fail(res, "Name may contain only letters and spaces");
    }
    if (body.email !== undefined && (!clean(body.email) || !EMAIL.test(clean(body.email)))) return fail(res, "Enter a valid email address");
    for (const field of ["phone", "mobile", "emergencyContactPhone"]) {
      if (body[field] !== undefined && (!clean(body[field]) || !PHONE.test(clean(body[field])))) return fail(res, "Mobile number must contain exactly 10 digits");
    }
    if (body.age !== undefined) {
      const age = Number(body.age);
      if (!Number.isInteger(age) || age < 1 || age > 120) return fail(res, "Age must be a whole number between 1 and 120");
    }
    for (const field of ["price", "testPrice"]) {
      if (body[field] !== undefined && (!Number.isFinite(Number(body[field])) || Number(body[field]) <= 0)) return fail(res, "Price must be a positive number");
    }
    for (const field of ["quantity", "inventoryQuantity", "stock", "availableQuantity"]) {
      if (body[field] !== undefined && (!Number.isFinite(Number(body[field])) || Number(body[field]) < 0)) return fail(res, "Inventory quantity cannot be negative");
    }
    if (body.bookingDate !== undefined) {
      const selected = /^\d{4}-\d{2}-\d{2}$/.test(String(body.bookingDate)) ? new Date(`${body.bookingDate}T00:00:00`) : new Date("invalid");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (Number.isNaN(selected.getTime()) || selected < today) return fail(res, "Booking date must be today or a future date");
    }
    const password = body.newPassword ?? ((req.path.includes("register") || req.path.includes("reset-password") || req.path.includes("/users")) ? body.password : undefined);
    if (password !== undefined) {
      const value = String(password);
      if (value.length < 8) return fail(res, "Password must be at least 8 characters");
      if (!/[A-Z]/.test(value) || !/[a-z]/.test(value) || !/\d/.test(value) || !/[^A-Za-z0-9]/.test(value)) return fail(res, "Password must include uppercase, lowercase, number and special characters");
    }
    if (body.results !== undefined) {
      if (!Array.isArray(body.results) || !body.results.length) return fail(res, "At least one test result is required");
      for (const row of body.results) {
        if (!clean(row?.parameter) || row?.value === undefined || clean(row.value) === "") return fail(res, "Every result requires a parameter and value");
        const type = String(row.dataType || row.type || "text").toLowerCase();
        if (["number", "numeric", "decimal", "integer"].includes(type)) {
          const value = Number(row.value);
          if (!Number.isFinite(value) || (type === "integer" && !Number.isInteger(value))) return fail(res, `${clean(row.parameter)} must be a valid numeric value`);
        }
      }
    }
    const payment = req.originalUrl.match(/^\/api\/receptionist\/bookings\/([^/]+)\/payment/);
    if (payment && body.amount !== undefined) {
      const booking = await Booking.findById(payment[1]).select("amount");
      if (booking && (!Number.isFinite(Number(body.amount)) || Math.abs(Number(body.amount) - Number(booking.amount)) > 0.009)) return fail(res, `Payment amount must exactly match the bill amount of ${booking.amount}`);
    }
    return next();
  } catch (error) {
    return next(error);
  }
};
module.exports = { validateRequest };
