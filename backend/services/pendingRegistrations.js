const { randomBytes } = require("crypto");

// Deliberately non-persistent: unfinished registrations never enter MongoDB.
// A server restart discards pending attempts; deployments with multiple workers
// must route a registration and its verification to the same worker.
const pending = new Map();
const lifetime = 10 * 60 * 1000;

const discard = (id) => {
  const entry = pending.get(id);
  if (entry) clearTimeout(entry.timer);
  return pending.delete(id);
};

const create = (details, otp) => {
  if (pending.size >= 1000) throw new Error("Too many pending registrations");
  const id = randomBytes(32).toString("hex");
  const timer = setTimeout(() => discard(id), lifetime);
  timer.unref();
  pending.set(id, { details, otp, expiresAt: Date.now() + lifetime, timer });
  return id;
};

// Consume synchronously before any database operation to prevent double submits.
const take = (id) => {
  const entry = pending.get(id);
  discard(id);
  return entry && entry.expiresAt > Date.now() ? entry : null;
};

module.exports = { create, take, discard };
