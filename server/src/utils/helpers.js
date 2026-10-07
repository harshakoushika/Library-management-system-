// ─── Async Handler ────────────────────────────────────────────
// Wraps async controllers to eliminate try/catch boilerplate
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// ─── API Response Helpers ─────────────────────────────────────
export const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

export const sendError = (res, message = 'Internal Server Error', statusCode = 500) =>
  res.status(statusCode).json({ success: false, message });

// ─── Fine Calculator ──────────────────────────────────────────
export const calculateFine = (dueDate, returnDate, finePerDay) => {
  const due = new Date(dueDate);
  const actual = returnDate ? new Date(returnDate) : new Date();
  if (actual <= due) return 0;
  const lateDays = Math.ceil((actual - due) / (1000 * 60 * 60 * 24));
  return lateDays * finePerDay;
};

// ─── Date Helpers ─────────────────────────────────────────────
export const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};
