import { useEffect, useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function ManageUsers() {
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [page, setPage]             = useState(1);
  const [pagination, setPagination] = useState({});

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/users', { params: { search, page, limit: 15, role: 'user' } });
      setUsers(data.data.users);
      setPagination(data.data.pagination);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => { fetchUsers(); }, [search, page]);

  const handleToggle = async (user) => {
    try {
      const { data } = await api.patch(`/admin/users/${user._id}/toggle`);
      toast.success(data.message);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
        <span className="text-sm text-gray-500">Total: {pagination.total || 0} users</span>
      </div>

      <input
        type="text"
        placeholder="Search by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="input max-w-xs mb-5"
      />

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500 border-b border-gray-100">
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium text-center">Books Issued</th>
                <th className="px-4 py-3 font-medium text-center">Total Fine</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium text-center">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={7} className="py-12 text-center text-gray-400">Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-gray-400">No users found</td></tr>
              ) : users.map((user) => (
                <tr key={user._id} className={`hover:bg-gray-50 ${!user.isActive ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">
                        {user.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-xs text-gray-400">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{user.phone || '—'}</td>
                  <td className="px-4 py-3 text-center font-medium">{user.booksIssued || 0}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={user.totalFine > 0 ? 'text-red-600 font-bold' : 'text-gray-400'}>
                      {user.totalFine > 0 ? `₹${user.totalFine}` : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{format(new Date(user.createdAt), 'dd MMM yyyy')}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={user.isActive ? 'badge-green' : 'badge-red'}>
                      {user.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleToggle(user)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-medium ${
                        user.isActive
                          ? 'bg-red-50 text-red-700 hover:bg-red-100'
                          : 'bg-green-50 text-green-700 hover:bg-green-100'
                      }`}
                    >
                      {user.isActive ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-sm text-gray-500">Total: {pagination.total} users</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="btn-secondary text-xs px-3 py-1.5">← Prev</button>
              <span className="text-sm text-gray-600 flex items-center">Page {page}/{pagination.pages}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page === pagination.pages} className="btn-secondary text-xs px-3 py-1.5">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
