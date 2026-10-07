import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { format } from 'date-fns';

const StatCard = ({ title, value, icon, sub, color }) => (
  <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
    <div className="flex items-center justify-between mb-3">
      <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center text-xl`}>{icon}</div>
    </div>
    <div className="text-2xl font-bold text-gray-900">{value}</div>
    <div className="text-sm text-gray-500 mt-0.5">{title}</div>
    {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
  </div>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard').then(({ data }) => setStats(data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm">Library overview and quick stats</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Books"    value={stats.totalBooks}      icon="📚" color="bg-blue-50"   sub={`${stats.availableCopies}/${stats.totalCopies} copies available`} />
        <StatCard title="Active Issues"  value={stats.activeIssues}    icon="📖" color="bg-green-50"  />
        <StatCard title="Overdue"        value={stats.overdueIssues}   icon="⚠️" color="bg-red-50"    />
        <StatCard title="Total Users"    value={stats.totalUsers}      icon="👥" color="bg-purple-50" />
        <StatCard title="Unpaid Fines"   value={stats.unpaidFines}     icon="💰" color="bg-orange-50" sub={`₹${stats.totalUnpaidFineAmount} total`} />
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { to: '/admin/books',  label: 'Add Book',       icon: '➕' },
          { to: '/admin/issues', label: 'Return Book',    icon: '↩️' },
          { to: '/admin/issues?status=overdue', label: 'View Overdue', icon: '🔴' },
          { to: '/admin/users',  label: 'Manage Users',   icon: '👤' },
        ].map(({ to, label, icon }) => (
          <Link key={to} to={to}
            className="bg-white rounded-xl border border-gray-100 p-4 text-center hover:shadow-md transition-shadow">
            <div className="text-2xl mb-1">{icon}</div>
            <div className="text-sm font-medium text-gray-700">{label}</div>
          </Link>
        ))}
      </div>

      {/* Recent Issues */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Recent Issues</h2>
          <Link to="/admin/issues" className="text-sm text-blue-600 hover:underline">View all →</Link>
        </div>

        {stats.recentIssues?.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No active issues</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-50">
                  <th className="pb-2 font-medium">User</th>
                  <th className="pb-2 font-medium">Book</th>
                  <th className="pb-2 font-medium">Due Date</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.recentIssues?.map((issue) => (
                  <tr key={issue._id}>
                    <td className="py-2.5">{issue.user?.name}</td>
                    <td className="py-2.5 text-gray-600">{issue.book?.title}</td>
                    <td className="py-2.5 text-gray-600">{format(new Date(issue.dueDate), 'dd MMM yyyy')}</td>
                    <td className="py-2.5">
                      <span className={`badge ${issue.status === 'overdue' ? 'badge-red' : 'badge-blue'}`}>
                        {issue.status}
                      </span>
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
