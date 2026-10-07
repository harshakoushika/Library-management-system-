import mongoose from 'mongoose';
import IssuedBook from '../models/IssuedBook.model.js';
import Book from '../models/Book.model.js';
import User from '../models/User.model.js';
import { asyncHandler, sendSuccess, sendError, calculateFine, addDays } from '../utils/helpers.js';

// ─── Issue a Book ─────────────────────────────────────────────
export const issueBook = asyncHandler(async (req, res) => {
  const { bookId, numDays } = req.body;
  const userId = req.user._id;

  if (!bookId) return sendError(res, 'Book ID is required', 400);
  if (!numDays || numDays < 1 || numDays > 30) {
    return sendError(res, 'Number of days must be between 1 and 30', 400);
  }

  const book = await Book.findById(bookId);
  if (!book || !book.isActive) return sendError(res, 'Book not found', 404);
  if (book.availableCopies < 1) return sendError(res, 'No copies available for this book', 400);

  // Check if user already has this specific book
  const existing = await IssuedBook.findOne({
    user: userId,
    book: bookId,
    status: 'issued',
  });
  if (existing) return sendError(res, 'You already have this book issued', 400);

  // Atomic transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const issueDate = new Date();
    const dueDate = addDays(issueDate, Number(numDays));

    book.availableCopies -= 1;
    await book.save({ session });

    const [issued] = await IssuedBook.create(
      [
        {
          user: userId,
          book: bookId,
          issueDate,
          dueDate,
          numDays: Number(numDays),
          finePerDay: book.finePerDay,
          status: 'issued',
        },
      ],
      { session }
    );

    await User.findByIdAndUpdate(userId, { $inc: { booksIssued: 1 } }, { session });

    await session.commitTransaction();

    const populated = await IssuedBook.findById(issued._id)
      .populate('book', 'title author isbn category coverImage finePerDay')
      .populate('user', 'name email');

    sendSuccess(res, populated, 'Book issued successfully', 201);
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
});

// ─── Get User's Issued Books ──────────────────────────────────
export const getMyIssuedBooks = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const query = { user: req.user._id };
  if (status) query.status = status;

  const issues = await IssuedBook.find(query)
    .populate('book', 'title author isbn category coverImage finePerDay')
    .sort({ createdAt: -1 });

  // Update overdue status dynamically
  const now = new Date();
  const updated = issues.map((issue) => {
    const obj = issue.toObject();
    if (obj.status === 'issued' && new Date(obj.dueDate) < now) {
      obj.status = 'overdue';
      obj.currentFine = calculateFine(obj.dueDate, null, obj.finePerDay);
    }
    return obj;
  });

  sendSuccess(res, updated);
});

// ─── Get Fine for a Specific Issue ────────────────────────────
export const getFine = asyncHandler(async (req, res) => {
  const issue = await IssuedBook.findById(req.params.id);
  if (!issue) return sendError(res, 'Issue record not found', 404);

  // Only allow the owner or admin
  if (issue.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return sendError(res, 'Not authorized', 403);
  }

  const fine = calculateFine(issue.dueDate, issue.returnDate, issue.finePerDay);
  const dueDate = new Date(issue.dueDate);
  const now = new Date();
  const daysOverdue = issue.status !== 'returned' && now > dueDate
    ? Math.ceil((now - dueDate) / (1000 * 60 * 60 * 24))
    : 0;

  sendSuccess(res, {
    issueId: issue._id,
    dueDate: issue.dueDate,
    returnDate: issue.returnDate,
    daysOverdue,
    finePerDay: issue.finePerDay,
    totalFine: fine,
    finePaid: issue.finePaid,
    status: issue.status,
  });
});

// ─── Return Book (Admin) ──────────────────────────────────────
export const returnBook = asyncHandler(async (req, res) => {
  const issue = await IssuedBook.findById(req.params.id).populate('book');
  if (!issue) return sendError(res, 'Issue record not found', 404);
  if (issue.status === 'returned') return sendError(res, 'Book already returned', 400);

  const returnDate = new Date();
  const fine = calculateFine(issue.dueDate, returnDate, issue.finePerDay);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    issue.returnDate = returnDate;
    issue.fineAmount = fine;
    issue.status = 'returned';
    if (req.body.note) issue.adminNote = req.body.note;
    await issue.save({ session });

    issue.book.availableCopies += 1;
    await issue.book.save({ session });

    if (fine > 0) {
      await User.findByIdAndUpdate(
        issue.user,
        { $inc: { totalFine: fine } },
        { session }
      );
    }

    await session.commitTransaction();

    const populated = await IssuedBook.findById(issue._id)
      .populate('book', 'title author')
      .populate('user', 'name email');

    sendSuccess(res, { issue: populated, fine }, `Book returned. Fine: ₹${fine}`);
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
});

// ─── Mark Fine as Paid (Admin) ────────────────────────────────
export const markFinePaid = asyncHandler(async (req, res) => {
  const issue = await IssuedBook.findById(req.params.id);
  if (!issue) return sendError(res, 'Issue record not found', 404);
  if (issue.finePaid) return sendError(res, 'Fine already marked as paid', 400);

  issue.finePaid = true;
  await issue.save();

  // Deduct from user's totalFine
  await User.findByIdAndUpdate(issue.user, {
    $inc: { totalFine: -issue.fineAmount },
  });

  sendSuccess(res, null, `Fine of ₹${issue.fineAmount} marked as paid`);
});
