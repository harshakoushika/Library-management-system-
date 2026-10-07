import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const navLinks = [
  { to: '/admin',        label: 'Dashboard', icon: '📊', end: true },
  { to: '/admin/books',  label: 'Books',     icon: '📚' },
  { to: '/admin/users',  label: 'Users',     icon: '👥' },
  { to: '/admin/issues', label: 'Issues',    icon: '📋' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col fixed h-full z-40 hidden md:flex">
        <div className="px-6 py-5 border-b border-gray-700">
          <div className="text-xl font-bold">📚 LibraryMS</div>
          <div className="text-xs text-gray-400 mt-1">Admin Panel</div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navLinks.map(({ to, label, icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`
              }
            >
              <span className="text-base">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-gray-700">
          <div className="text-xs text-gray-400 mb-1">{user?.name}</div>
          <div className="text-xs text-gray-500 mb-3">{user?.email}</div>
          <button onClick={handleLogout}
            className="w-full text-left text-xs text-gray-400 hover:text-white transition-colors">
            → Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-gray-900 text-white z-40 px-4 py-3 flex items-center justify-between">
        <span className="font-bold">📚 Admin Panel</span>
        <button onClick={handleLogout} className="text-xs text-gray-300">Logout</button>
      </div>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 text-white z-40 flex">
        {navLinks.map(({ to, label, icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2 text-xs transition-colors ${
                isActive ? 'text-blue-400' : 'text-gray-400'
              }`
            }
          >
            <span className="text-lg">{icon}</span>
            {label}
          </NavLink>
        ))}
      </div>

      {/* Main content */}
      <main className="md:ml-64 flex-1 p-6 mt-14 md:mt-0 mb-16 md:mb-0">
        <Outlet />
      </main>
    </div>
  );
}
