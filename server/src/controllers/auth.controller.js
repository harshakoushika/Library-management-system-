import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User.model.js';
import { asyncHandler, sendSuccess, sendError } from '../utils/helpers.js';

// ─── Sign JWT ─────────────────────────────────────────────────
const signToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// ─── Validation Rules ─────────────────────────────────────────
export const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 50 }),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

export const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

// ─── Register ─────────────────────────────────────────────────
export const register = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, errors.array()[0].msg, 400);
  }

  const { name, email, password, phone, address } = req.body;

  const exists = await User.findOne({ email });
  if (exists) return sendError(res, 'Email already registered', 400);

  const user = await User.create({ name, email, password, phone, address });
  const token = signToken(user._id, user.role);

  sendSuccess(
    res,
    { token, user: user.toSafeObject() },
    'Registration successful',
    201
  );
});

// ─── Login ────────────────────────────────────────────────────
export const login = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, errors.array()[0].msg, 400);
  }

  const { email, password } = req.body;

  // Explicitly select password (it's select: false in schema)
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    return sendError(res, 'Invalid email or password', 401);
  }

  if (!user.isActive) {
    return sendError(res, 'Account suspended. Please contact admin.', 403);
  }

  const token = signToken(user._id, user.role);

  sendSuccess(res, {
    token,
    role: user.role,
    name: user.name,
    userId: user._id,
  }, 'Login successful');
});

// ─── Get Current User ─────────────────────────────────────────
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  sendSuccess(res, user.toSafeObject());
});

// ─── Update Profile ───────────────────────────────────────────
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, address } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, phone, address },
    { new: true, runValidators: true }
  );

  sendSuccess(res, user.toSafeObject(), 'Profile updated');
});

// ─── Change Password ──────────────────────────────────────────
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return sendError(res, 'Both current and new password are required', 400);
  }
  if (newPassword.length < 6) {
    return sendError(res, 'New password must be at least 6 characters', 400);
  }

  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.comparePassword(currentPassword);

  if (!isMatch) return sendError(res, 'Current password is incorrect', 400);

  user.password = newPassword;
  await user.save();

  sendSuccess(res, null, 'Password changed successfully');
});
