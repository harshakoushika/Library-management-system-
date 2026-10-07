import Book from '../models/Book.model.js';
import { asyncHandler, sendSuccess, sendError } from '../utils/helpers.js';

// ─── Get All Books (public, paginated, searchable) ────────────
export const getBooks = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 12,
    search = '',
    category = '',
    available = '',
  } = req.query;

  const query = { isActive: true };

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { author: { $regex: search, $options: 'i' } },
      { isbn: { $regex: search, $options: 'i' } },
    ];
  }

  if (category) query.category = category;
  if (available === 'true') query.availableCopies = { $gt: 0 };

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Book.countDocuments(query);
  const books = await Book.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  sendSuccess(res, {
    books,
    pagination: {
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      limit: Number(limit),
    },
  });
});

// ─── Get Single Book ──────────────────────────────────────────
export const getBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book || !book.isActive) return sendError(res, 'Book not found', 404);
  sendSuccess(res, book);
});

// ─── Get All Categories ───────────────────────────────────────
export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Book.distinct('category', { isActive: true });
  sendSuccess(res, categories.sort());
});

// ─── Add Book (Admin) ─────────────────────────────────────────
export const addBook = asyncHandler(async (req, res) => {
  const {
    title, author, isbn, category, description,
    coverImage, publisher, publishedYear, totalCopies, finePerDay,
  } = req.body;

  if (!title || !author || !isbn || !category || !totalCopies) {
    return sendError(res, 'Title, author, ISBN, category, and total copies are required', 400);
  }

  const existing = await Book.findOne({ isbn });
  if (existing) return sendError(res, 'A book with this ISBN already exists', 400);

  const book = await Book.create({
    title, author, isbn, category, description,
    coverImage, publisher, publishedYear,
    totalCopies: Number(totalCopies),
    availableCopies: Number(totalCopies),
    finePerDay: Number(finePerDay) || 5,
  });

  sendSuccess(res, book, 'Book added successfully', 201);
});

// ─── Update Book (Admin) ──────────────────────────────────────
export const updateBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) return sendError(res, 'Book not found', 404);

  const {
    title, author, isbn, category, description,
    coverImage, publisher, publishedYear, totalCopies, finePerDay, isActive,
  } = req.body;

  // If totalCopies changed, adjust availableCopies proportionally
  if (totalCopies !== undefined && Number(totalCopies) !== book.totalCopies) {
    const issuedCount = book.totalCopies - book.availableCopies;
    const newTotal = Number(totalCopies);
    if (newTotal < issuedCount) {
      return sendError(
        res,
        `Cannot reduce total copies below currently issued count (${issuedCount})`,
        400
      );
    }
    book.availableCopies = newTotal - issuedCount;
    book.totalCopies = newTotal;
  }

  if (title !== undefined) book.title = title;
  if (author !== undefined) book.author = author;
  if (isbn !== undefined) book.isbn = isbn;
  if (category !== undefined) book.category = category;
  if (description !== undefined) book.description = description;
  if (coverImage !== undefined) book.coverImage = coverImage;
  if (publisher !== undefined) book.publisher = publisher;
  if (publishedYear !== undefined) book.publishedYear = publishedYear;
  if (finePerDay !== undefined) book.finePerDay = Number(finePerDay);
  if (isActive !== undefined) book.isActive = isActive;

  await book.save();
  sendSuccess(res, book, 'Book updated successfully');
});

// ─── Delete Book (Admin — soft delete) ───────────────────────
export const deleteBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) return sendError(res, 'Book not found', 404);

  if (book.availableCopies < book.totalCopies) {
    return sendError(res, 'Cannot delete book with active issued copies', 400);
  }

  book.isActive = false;
  await book.save();

  sendSuccess(res, null, 'Book deleted successfully');
});
