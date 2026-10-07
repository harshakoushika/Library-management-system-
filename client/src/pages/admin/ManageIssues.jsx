import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const statusBadge = (status) => {
  const map = { issued: 'badge-blue', returned: 'badge-green', overdue: 'badge-red' };
  return <span className={map[status] || 'badge-gray'}>{status}</span>;
};

export default function ManageIssues() {
  const [searchParams] = useSearchParams();
  const [issues, setIssues]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [status, setStatus]         = useState(searchParams.get('status') || '');
  const [page, setPage]             = useState(1);
  const [pagination, setPagination] = useState({});
  const [returning, setReturning]   = useState(null);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/issues', { params: { status, page, limit: 15 } });
      setIssues(data.data.issues);
      setPagination(data.data.pagination);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setPage(1); }, [status]);
  useEffect(() => { fetchIssues(); }, [status, page]);

  const handleReturn = async (issue) => {
    setReturning(issue._id);
    try {
      const { data } = await api.patch(`/issues/${issue._id}/return`);
      toast.success(data.message);
      fetchIssues();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Return failed');
    } finally {
      setReturning(null);
    }
  };

  const handlePayFine = async (issue) => {
    try {
      await api.patch(`/issues/${issue._id}/pay-fine`);
      toast.success('Fine marked as paid!');
      fetchIssues();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manage Issues</h1>
        <div className="flex gap-2">
          {['', 'issued', 'overdue', 'returned'].map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${
                status === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500 border-b border-gray-100">
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Book</th>
                <th className="px-4 py-3 font-medium">Issue Date</th>
                <th className="px-4 py-3 font-medium">Due Date</th>
                <th className="px-4 py-3 font-medium text-center">Status</th>
                <th className="px-4 py-3 font-medium text-right">Fine</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={7} className="py-12 text-center text-gray-400">Loading...</td></tr>
              ) : issues.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-gray-400">No records found</td></tr>
              ) : issues.map((issue) => {
                const now = new Date();
                const dueDate = new Date(issue.dueDate);
                const isCurrentlyOverdue = issue.status !== 'returned' && now > dueDate;
                const daysLate = isCurrentlyOverdue ? Math.ceil((now - dueDate) / (1000 * 60 * 60 * 24)) : 0;
                const currentFine = isCurrentlyOverdue ? daysLate * issue.finePerDay : (issue.fineAmount || 0);

                return (
                  <tr key={issue._id} className={`hover:bg-gray-50 ${isCurrentlyOverdue ? 'bg-red-50/30' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{issue.user?.name}</div>
                      <div className="text-xs text-gray-400">{issue.user?.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 max-w-[150px] truncate">{issue.book?.title}</div>
                      <div className="text-xs text-gray-400">{issue.book?.isbn}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{format(new Date(issue.issueDate), 'dd MMM yyyy')}</td>
                    <td className={`px-4 py-3 font-medium ${isCurrentlyOverdue ? 'text-red-600' : 'text-gray-600'}`}>
                      {format(dueDate, 'dd MMM yyyy')}
                      {isCurrentlyOverdue && <div className="text-xs text-red-500">{daysLate}d overdue</div>}
                    </td>
                    <td className="px-4 py-3 text-center">{statusBadge(isCurrentlyOverdue ? 'overdue' : issue.status)}</td>
                    <td className="px-4 py-3 text-right">
                      {currentFine > 0 ? (
                        <div>
                          <div className={`font-bold ${issue.finePaid ? 'text-green-600 line-through' : 'text-red-600'}`}>₹{currentFine}</div>
                          {issue.finePaid && <div className="text-xs text-green-600">Paid</div>}
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {issue.status !== 'returned' && (
                          <button
                            onClick={() => handleReturn(issue)}
                            disabled={returning === issue._id}
                            className="text-xs bg-green-50 text-green-700 hover:bg-green-100 px-2.5 py-1 rounded-lg font-medium"
                          >
                            {returning === issue._id ? '...' : 'Return'}
                          </button>
                        )}
                        {issue.status === 'returned' && issue.fineAmount > 0 && !issue.finePaid && (
                          <button
                            onClick={() => handlePayFine(issue)}
                            className="text-xs bg-orange-50 text-orange-700 hover:bg-orange-100 px-2.5 py-1 rounded-lg font-medium"
                          >
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-sm text-gray-500">Total: {pagination.total} records</span>
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
