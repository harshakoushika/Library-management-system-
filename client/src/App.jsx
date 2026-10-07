import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { PrivateRoute, AdminRoute, GuestRoute } from './routes/ProtectedRoutes';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// User Pages
import UserLayout from './components/common/UserLayout';
import UserDashboard from './pages/user/Dashboard';
import BrowseBooks from './pages/user/BrowseBooks';
import MyBooks from './pages/user/MyBooks';
import Profile from './pages/user/Profile';

// Admin Pages
import AdminLayout from './components/common/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import ManageBooks from './pages/admin/ManageBooks';
import ManageUsers from './pages/admin/ManageUsers';
import ManageIssues from './pages/admin/ManageIssues';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <Routes>
          {/* Public / Guest routes */}
          <Route path="/login"    element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

          {/* User Panel */}
          <Route
            path="/"
            element={<PrivateRoute><UserLayout /></PrivateRoute>}
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<UserDashboard />} />
            <Route path="browse"    element={<BrowseBooks />} />
            <Route path="my-books"  element={<MyBooks />} />
            <Route path="profile"   element={<Profile />} />
          </Route>

          {/* Admin Panel */}
          <Route
            path="/admin"
            element={<AdminRoute><AdminLayout /></AdminRoute>}
          >
            <Route index element={<AdminDashboard />} />
            <Route path="books"  element={<ManageBooks />} />
            <Route path="users"  element={<ManageUsers />} />
            <Route path="issues" element={<ManageIssues />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
