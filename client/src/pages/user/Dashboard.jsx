import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { format } from 'date-fns';

const StatCard = ({ title, value, icon, color }) => (
  <div className={`card ${color}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
      <span className="text-4xl">{icon}</span>
    </div>
  </div>
);

const statusBadge = (status) => {
  const map = { issued: 'badge-blue', returned: 'badge-green', overdue: 'badge-red' };
  return <span className={map[status] || 'badge-gray'}>{status}</span>;
};

export default function UserDashboard() {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/issues/my').then(({ data }) => setIssues(data.data)).finally(() => setLoading(false));
  }, []);

  const activeCount   = issues.filter((i) => i.status === 'issued' || i.status === 'overdue').length;
  const overdueCount  = issues.filter((i) => i.status === 'overdue').length;
  const returnedCount = issues.filter((i) => i.status === 'returned').length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}! 👋</h1>
        <p className="text-gray-500 text-sm mt-1">Here's your library activity at a glance.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Active Issues" value={activeCount}  icon="📖" color="" />
        <StatCard title="Overdue"       value={overdueCount} icon="⚠️" color="" />
        <StatCard title="Returned"      value={returnedCount} icon="✅" color="" />
        <StatCard title="Total Fine"    value={`₹${user?.totalFine || 0}`} icon="💰" color="" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Link to="/browse" className="card hover:shadow-md transition-shadow flex items-center gap-4 cursor-pointer group">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">🔍</div>
          <div>
            <div className="font-semibold text-gray-900 group-hover:text-blue-700">Browse Books</div>
            <div className="text-sm text-gray-500">Find and issue new books</div>
          </div>
        </Link>
        <Link to="/my-books" className="card hover:shadow-md transition-shadow flex items-center gap-4 cursor-pointer group">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">📋</div>
          <div>
            <div className="font-semibold text-gray-900 group-hover:text-blue-700">My Books</div>
            <div className="text-sm text-gray-500">View issued books & fines</div>
          </div>
        </Link>
      </div>

      {/* Recent Issues */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Recent Activity</h2>
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading...</div>
        ) : issues.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <div className="text-4xl mb-2">📚</div>
            <p>No books issued yet. <Link to="/browse" className="text-blue-600">Browse books</Link></p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-100">
                  <th className="pb-2 text-gray-500 font-medium">Book</th>
                  <th className="pb-2 text-gray-500 font-medium">Due Date</th>
                  <th className="pb-2 text-gray-500 font-medium">Status</th>
                  <th className="pb-2 text-gray-500 font-medium text-right">Fine</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {issues.slice(0, 5).map((issue) => (
                  <tr key={issue._id}>
                    <td className="py-3 font-medium text-gray-800">{issue.book?.title}</td>
                    <td className="py-3 text-gray-600">{format(new Date(issue.dueDate), 'dd MMM yyyy')}</td>
                    <td className="py-3">{statusBadge(issue.status)}</td>
                    <td className="py-3 text-right font-medium text-red-600">
                      {issue.currentFine > 0 ? `₹${issue.currentFine}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
