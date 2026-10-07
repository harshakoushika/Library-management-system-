import User from '../models/User.model.js';
import Book from '../models/Book.model.js';
import IssuedBook from '../models/IssuedBook.model.js';
import { asyncHandler, sendSuccess, sendError } from '../utils/helpers.js';

// ─── Dashboard Stats ──────────────────────────────────────────
export const getDashboard = asyncHandler(async (req, res) => {
  const [
    totalBooks,
    totalUsers,
    activeIssues,
    overdueIssues,
    unpaidFines,
    recentIssues,
  ] = await Promise.all([
    Book.countDocuments({ isActive: true }),
    User.countDocuments({ role: 'user' }),
    IssuedBook.countDocuments({ status: 'issued' }),
    IssuedBook.countDocuments({ status: 'overdue' }),
    IssuedBook.countDocuments({ finePaid: false, fineAmount: { $gt: 0 } }),
    IssuedBook.find({ status: { $in: ['issued', 'overdue'] } })
      .populate('user', 'name email')
      .populate('book', 'title author')
      .sort({ createdAt: -1 })
      .limit(5),
  ]);

  const copiesAgg = await Book.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: null,
        totalCopies: { $sum: '$totalCopies' },
        availableCopies: { $sum: '$availableCopies' },
      },
    },
  ]);

  const totalFinesAgg = await IssuedBook.aggregate([
    { $match: { finePaid: false, fineAmount: { $gt: 0 } } },
    { $group: { _id: null, total: { $sum: '$fineAmount' } } },
  ]);

  sendSuccess(res, {
    totalBooks,
    totalUsers,
    activeIssues,
    overdueIssues,
    unpaidFines,
    totalCopies: copiesAgg[0]?.totalCopies || 0,
    availableCopies: copiesAgg[0]?.availableCopies || 0,
    totalUnpaidFineAmount: totalFinesAgg[0]?.total || 0,
    recentIssues,
  });
});

// ─── Get All Users ────────────────────────────────────────────
export const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search = '', role = '' } = req.query;

  const query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }
  if (role) query.role = role;

  const skip = (Number(page) - 1) * Number(limit);
  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  sendSuccess(res, {
    users,
    pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
  });
});

// ─── Get Single User ──────────────────────────────────────────
export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return sendError(res, 'User not found', 404);

  const issuedBooks = await IssuedBook.find({ user: user._id })
    .populate('book', 'title author isbn')
    .sort({ createdAt: -1 })
    .limit(10);

  sendSuccess(res, { user, issuedBooks });
});

// ─── Toggle User Active Status ────────────────────────────────
export const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return sendError(res, 'User not found', 404);
  if (user.role === 'admin') return sendError(res, 'Cannot modify admin account', 400);

  user.isActive = !user.isActive;
  await user.save();

  sendSuccess(res, user, `User ${user.isActive ? 'activated' : 'suspended'} successfully`);
});

// ─── Get All Issued Books ─────────────────────────────────────
export const getAllIssues = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status = '' } = req.query;

  const query = {};
  if (status) query.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const total = await IssuedBook.countDocuments(query);
  const issues = await IssuedBook.find(query)
    .populate('user', 'name email phone')
    .populate('book', 'title author isbn coverImage')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  sendSuccess(res, {
    issues,
    pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
  });
});

// ─── Get Overdue Books ────────────────────────────────────────
export const getOverdueBooks = asyncHandler(async (req, res) => {
  const now = new Date();

  // Auto-mark overdue
  await IssuedBook.updateMany(
    { status: 'issued', dueDate: { $lt: now } },
    { $set: { status: 'overdue' } }
  );

  const overdue = await IssuedBook.find({ status: 'overdue' })
    .populate('user', 'name email phone')
    .populate('book', 'title author isbn')
    .sort({ dueDate: 1 });

  sendSuccess(res, overdue);
});

// ─── Get Unpaid Fines ─────────────────────────────────────────
export const getUnpaidFines = asyncHandler(async (req, res) => {
  const fines = await IssuedBook.find({
    finePaid: false,
    fineAmount: { $gt: 0 },
  })
    .populate('user', 'name email totalFine')
    .populate('book', 'title author')
    .sort({ fineAmount: -1 });

  sendSuccess(res, fines);
});
