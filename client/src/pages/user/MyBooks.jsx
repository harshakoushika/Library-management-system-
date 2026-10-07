import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { format, formatDistanceToNow } from 'date-fns';

const statusBadge = (status) => {
  const map = {
    issued:   'badge-blue',
    returned: 'badge-green',
    overdue:  'badge-red',
  };
  return <span className={map[status] || 'badge-gray'}>{status.toUpperCase()}</span>;
};

function IssueCard({ issue }) {
  const isOverdue = issue.status === 'overdue';
  const isReturned = issue.status === 'returned';
  const fine = issue.currentFine || issue.fineAmount || 0;

  return (
    <div className={`card border-l-4 ${isOverdue ? 'border-red-500' : isReturned ? 'border-green-500' : 'border-blue-500'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900">{issue.book?.title}</h3>
            {statusBadge(issue.status)}
          </div>
          <p className="text-sm text-gray-500 mb-3">by {issue.book?.author} · {issue.book?.isbn}</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <div className="text-xs text-gray-400">Issue Date</div>
              <div className="font-medium">{format(new Date(issue.issueDate), 'dd MMM yyyy')}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Due Date</div>
              <div className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                {format(new Date(issue.dueDate), 'dd MMM yyyy')}
              </div>
            </div>
            {isReturned && (
              <div>
                <div className="text-xs text-gray-400">Returned On</div>
                <div className="font-medium text-green-600">
                  {format(new Date(issue.returnDate), 'dd MMM yyyy')}
                </div>
              </div>
            )}
            {!isReturned && (
              <div>
                <div className="text-xs text-gray-400">{isOverdue ? 'Overdue by' : 'Due in'}</div>
                <div className={`font-medium ${isOverdue ? 'text-red-600' : 'text-blue-600'}`}>
                  {formatDistanceToNow(new Date(issue.dueDate), { addSuffix: true })}
                </div>
              </div>
            )}
            <div>
              <div className="text-xs text-gray-400">Fine</div>
              <div className={`font-bold ${fine > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {fine > 0 ? `₹${fine}` : '₹0'}
                {fine > 0 && issue.finePaid && <span className="ml-1 text-xs text-green-600">(Paid)</span>}
              </div>
            </div>
          </div>

          {isOverdue && (
            <div className="mt-3 p-3 bg-red-50 rounded-lg text-sm text-red-700 flex items-start gap-2">
              <span>⚠️</span>
              <span>
                This book is overdue! Fine of <strong>₹{issue.finePerDay}/day</strong> is being charged.
                Please return the book as soon as possible or contact the admin.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MyBooks() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/issues/my').then(({ data }) => setIssues(data.data)).finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? issues : issues.filter((i) => i.status === filter);

  const overdueCount = issues.filter((i) => i.status === 'overdue').length;
  const activeCount  = issues.filter((i) => i.status === 'issued').length;
  const totalFine    = issues.reduce((sum, i) => sum + (i.currentFine || i.fineAmount || 0), 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">My Books</h1>
      <p className="text-gray-500 text-sm mb-6">Your complete book issuing history</p>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-600">{activeCount}</div>
          <div className="text-xs text-gray-500 mt-1">Active</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
          <div className="text-xs text-gray-500 mt-1">Overdue</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-orange-600">₹{totalFine}</div>
          <div className="text-xs text-gray-500 mt-1">Total Fine</div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {['all', 'issued', 'overdue', 'returned'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
              filter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">📚</div>
          <p>No {filter === 'all' ? '' : filter} books found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((issue) => <IssueCard key={issue._id} issue={issue} />)}
        </div>
      )}
    </div>
  );
}
