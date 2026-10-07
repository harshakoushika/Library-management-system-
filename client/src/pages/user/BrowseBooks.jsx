import { useEffect, useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { addDays, format } from 'date-fns';

// ─── Issue Modal ──────────────────────────────────────────────
function IssueModal({ book, onClose, onSuccess }) {
  const [numDays, setNumDays] = useState(7);
  const [loading, setLoading] = useState(false);

  const issueDate  = new Date();
  const returnDate = addDays(issueDate, numDays);

  const handleIssue = async () => {
    setLoading(true);
    try {
      await api.post('/issues', { bookId: book._id, numDays });
      toast.success('Book issued successfully!');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to issue book');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in slide-in-from-bottom">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Issue Book</h2>
            <p className="text-gray-500 text-sm mt-0.5">{book.title}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Available Copies</span>
            <span className="font-medium text-green-600">{book.availableCopies}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Fine Rate</span>
            <span className="font-medium text-orange-600">₹{book.finePerDay}/day (if late)</span>
          </div>
        </div>

        <div className="mb-4">
          <label className="label">Number of Days (1–30)</label>
          <input
            type="number"
            min={1}
            max={30}
            value={numDays}
            onChange={(e) => setNumDays(Math.min(30, Math.max(1, Number(e.target.value))))}
            className="input"
          />
          <input
            type="range"
            min={1}
            max={30}
            value={numDays}
            onChange={(e) => setNumDays(Number(e.target.value))}
            className="w-full mt-2 accent-blue-600"
          />
        </div>

        {/* Summary */}
        <div className="bg-blue-50 rounded-xl p-4 space-y-2 text-sm mb-6">
          <div className="flex justify-between">
            <span className="text-gray-600">Issue Date</span>
            <strong>{format(issueDate, 'dd MMM yyyy')}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Return By</span>
            <strong className="text-blue-700">{format(returnDate, 'dd MMM yyyy')}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Duration</span>
            <strong>{numDays} day{numDays > 1 ? 's' : ''}</strong>
          </div>
          <div className="border-t border-blue-100 pt-2 flex justify-between">
            <span className="text-gray-600">Late Fine (if overdue)</span>
            <strong className="text-red-600">₹{book.finePerDay}/day</strong>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleIssue} disabled={loading} className="btn-primary flex-1">
            {loading ? 'Issuing...' : 'Confirm Issue'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Book Card ────────────────────────────────────────────────
function BookCard({ book, onIssue }) {
  return (
    <div className="card hover:shadow-md transition-shadow flex flex-col">
      <div className="w-full h-40 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-lg mb-4 flex items-center justify-center text-5xl">
        📘
      </div>
      <div className="flex-1">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">{book.title}</h3>
          <span className={`badge shrink-0 ${book.availableCopies > 0 ? 'badge-green' : 'badge-red'}`}>
            {book.availableCopies > 0 ? 'Available' : 'Unavailable'}
          </span>
        </div>
        <p className="text-xs text-gray-500 mb-1">by {book.author}</p>
        <p className="text-xs text-blue-600 mb-3">{book.category}</p>
        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <span>Copies: {book.availableCopies}/{book.totalCopies}</span>
          <span className="text-orange-600">₹{book.finePerDay}/day fine</span>
        </div>
      </div>
      <button
        onClick={() => onIssue(book)}
        disabled={book.availableCopies === 0}
        className="btn-primary w-full text-sm py-2"
      >
        {book.availableCopies > 0 ? 'Issue Book' : 'Not Available'}
      </button>
    </div>
  );
}

// ─── Browse Books Page ────────────────────────────────────────
export default function BrowseBooks() {
  const [books, setBooks]         = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [category, setCategory]   = useState('');
  const [available, setAvailable] = useState(false);
  const [page, setPage]           = useState(1);
  const [pagination, setPagination] = useState({});

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/books', {
        params: { search, category, available: available || undefined, page, limit: 12 },
      });
      setBooks(data.data.books);
      setPagination(data.data.pagination);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get('/books/categories').then(({ data }) => setCategories(data.data));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, category, available]);

  useEffect(() => {
    fetchBooks();
  }, [search, category, available, page]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Browse Books</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Search title, author, ISBN..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input max-w-xs"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="input max-w-[160px]"
        >
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={available}
            onChange={(e) => setAvailable(e.target.checked)}
            className="accent-blue-600"
          />
          Available only
        </label>
      </div>

      {/* Book Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="w-full h-40 bg-gray-200 rounded-lg mb-4" />
              <div className="h-4 bg-gray-200 rounded mb-2" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : books.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">🔍</div>
          <p>No books found matching your search.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {books.map((book) => (
              <BookCard key={book._id} book={book} onIssue={setSelectedBook} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="btn-secondary px-3 py-1.5 text-sm">← Prev</button>
              <span className="text-sm text-gray-600">Page {page} of {pagination.pages}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page === pagination.pages} className="btn-secondary px-3 py-1.5 text-sm">Next →</button>
            </div>
          )}
        </>
      )}

      {/* Issue Modal */}
      {selectedBook && (
        <IssueModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onSuccess={() => { setSelectedBook(null); fetchBooks(); }}
        />
      )}
    </div>
  );
}
