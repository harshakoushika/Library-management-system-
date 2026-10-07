import mongoose from 'mongoose';

const issuedBookSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'Book is required'],
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    returnDate: {
      type: Date,
      default: null,
    },
    numDays: {
      type: Number,
      required: [true, 'Number of days is required'],
      min: [1, 'Minimum 1 day'],
      max: [30, 'Maximum 30 days'],
    },
    finePerDay: {
      type: Number,
      required: true,
      min: 0,
    },
    fineAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    finePaid: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['issued', 'returned', 'overdue'],
      default: 'issued',
    },
    adminNote: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Prevent same user from issuing same book twice (active) ──
issuedBookSchema.index(
  { user: 1, book: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'issued' },
  }
);

// ─── Index for fast admin queries ────────────────────────────
issuedBookSchema.index({ status: 1 });
issuedBookSchema.index({ dueDate: 1, status: 1 });

// ─── Virtual: days overdue ───────────────────────────────────
issuedBookSchema.virtual('daysOverdue').get(function () {
  if (this.status === 'returned') return 0;
  const now = new Date();
  const due = new Date(this.dueDate);
  if (now <= due) return 0;
  return Math.ceil((now - due) / (1000 * 60 * 60 * 24));
});

// ─── Virtual: current fine ───────────────────────────────────
issuedBookSchema.virtual('currentFine').get(function () {
  if (this.status === 'returned') return this.fineAmount;
  return this.daysOverdue * this.finePerDay;
});

export default mongoose.model('IssuedBook', issuedBookSchema);
