import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    author: {
      type: String,
      required: [true, 'Author is required'],
      trim: true,
      maxlength: [100, 'Author name cannot exceed 100 characters'],
    },
    isbn: {
      type: String,
      required: [true, 'ISBN is required'],
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    coverImage: {
      type: String,
      default: '',
    },
    publisher: {
      type: String,
      default: '',
      trim: true,
    },
    publishedYear: {
      type: Number,
      min: [1000, 'Invalid year'],
      max: [new Date().getFullYear(), 'Published year cannot be in the future'],
    },
    totalCopies: {
      type: Number,
      required: [true, 'Total copies is required'],
      min: [0, 'Total copies cannot be negative'],
    },
    availableCopies: {
      type: Number,
      required: [true, 'Available copies is required'],
      min: [0, 'Available copies cannot be negative'],
    },
    finePerDay: {
      type: Number,
      default: 5,
      min: [0, 'Fine cannot be negative'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtual: availability status ────────────────────────────
bookSchema.virtual('isAvailable').get(function () {
  return this.availableCopies > 0 && this.isActive;
});

// ─── Indexes for search performance ──────────────────────────
bookSchema.index({ title: 'text', author: 'text', category: 'text' });
bookSchema.index({ category: 1 });
bookSchema.index({ isActive: 1, availableCopies: 1 });

export default mongoose.model('Book', bookSchema);
