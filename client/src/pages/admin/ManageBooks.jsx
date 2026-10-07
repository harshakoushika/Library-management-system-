import { useEffect, useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  title: '', author: '', isbn: '', category: '',
  description: '', publisher: '', publishedYear: '',
  totalCopies: '', finePerDay: '5',
};

function BookModal({ book, onClose, onSave }) {
  const [form, setForm] = useState(book || EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const isEdit = !!book?._id;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/books/${book._id}`, form);
        toast.success('Book updated!');
      } else {
        await api.post('/books', form);
        toast.success('Book added!');
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold">{isEdit ? 'Edit Book' : 'Add New Book'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Title *</label>
            <input name="title" value={form.title} onChange={handleChange} className="input" required />
          </div>
          <div>
            <label className="label">Author *</label>
            <input name="author" value={form.author} onChange={handleChange} className="input" required />
          </div>
          <div>
            <label className="label">ISBN *</label>
            <input name="isbn" value={form.isbn} onChange={handleChange} className="input" required />
          </div>
          <div>
            <label className="label">Category *</label>
            <input name="category" value={form.category} onChange={handleChange} className="input" required />
          </div>
          <div>
            <label className="label">Publisher</label>
            <input name="publisher" value={form.publisher} onChange={handleChange} className="input" />
          </div>
          <div>
            <label className="label">Published Year</label>
            <input type="number" name="publishedYear" value={form.publishedYear} onChange={handleChange} className="input" min="1000" max={new Date().getFullYear()} />
          </div>
          <div>
            <label className="label">Fine Per Day (₹) *</label>
            <input type="number" name="finePerDay" value={form.finePerDay} onChange={handleChange} className="input" min="0" required />
          </div>
          <div className="col-span-2">
            <label className="label">Total Copies *</label>
            <input type="number" name="totalCopies" value={form.totalCopies} onChange={handleChange} className="input" min="1" required />
          </div>
          <div className="col-span-2">
            <label className="label">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} className="input resize-none" rows={3} />
          </div>

          <div className="col-span-2 flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : isEdit ? 'Update Book' : 'Add Book'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ManageBooks() {
  const [books, setBooks]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [modalBook, setModalBook]   = useState(undefined); // undefined = closed, null = new, obj = edit
  const [page, setPage]             = useState(1);
  const [pagination, setPagination] = useState({});

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/books', { params: { search, page, limit: 15 } });
      setBooks(data.data.books);
      setPagination(data.data.pagination);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => { fetchBooks(); }, [search, page]);

  const handleDelete = async (book) => {
    if (!confirm(`Delete "${book.title}"?`)) return;
    try {
      await api.delete(`/books/${book._id}`);
      toast.success('Book deleted');
      fetchBooks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manage Books</h1>
        <button onClick={() => setModalBook(null)} className="btn-primary">+ Add Book</button>
      </div>

      <input
        type="text"
        placeholder="Search books..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="input max-w-xs mb-5"
      />

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500 border-b border-gray-100">
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Author</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium text-center">Copies</th>
                <th className="px-4 py-3 font-medium text-center">Fine/day</th>
                <th className="px-4 py-3 font-medium text-center">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={7} className="py-12 text-center text-gray-400">Loading...</td></tr>
              ) : books.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-gray-400">No books found</td></tr>
              ) : books.map((book) => (
                <tr key={book._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">{book.title}</td>
                  <td className="px-4 py-3 text-gray-600">{book.author}</td>
                  <td className="px-4 py-3"><span className="badge-blue">{book.category}</span></td>
                  <td className="px-4 py-3 text-center">
                    <span className={book.availableCopies === 0 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                      {book.availableCopies}
                    </span>
                    <span className="text-gray-400">/{book.totalCopies}</span>
                  </td>
                  <td className="px-4 py-3 text-center text-orange-600">₹{book.finePerDay}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={book.isActive ? 'badge-green' : 'badge-gray'}>
                      {book.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setModalBook(book)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">Edit</button>
                      <button onClick={() => handleDelete(book)} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-sm text-gray-500">Total: {pagination.total} books</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="btn-secondary text-xs px-3 py-1.5">← Prev</button>
              <span className="text-sm text-gray-600 flex items-center">Page {page}/{pagination.pages}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page === pagination.pages} className="btn-secondary text-xs px-3 py-1.5">Next →</button>
            </div>
          </div>
        )}
      </div>

      {modalBook !== undefined && (
        <BookModal
          book={modalBook}
          onClose={() => setModalBook(undefined)}
          onSave={() => { setModalBook(undefined); fetchBooks(); }}
        />
      )}
    </div>
  );
}
