import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/guards/ProtectedRoute';
import RoleGuard from './components/guards/RoleGuard';
import AppShell from './components/layout/AppShell/AppShell';

// Auth Pages
import SignIn from './pages/auth/SignIn';
import SignUp from './pages/auth/SignUp';
import VerifyEmail from './pages/auth/VerifyEmail';

// Phase 2 Pages
import EmployeeDirectory from './pages/directory/EmployeeDirectory';
import EmployeeProfile from './pages/profile/EmployeeProfile';

// Phase 3 Pages
import MyLeave from './pages/leave/MyLeave';
import LeaveAdmin from './pages/leave/LeaveAdmin';

// Phase 4 Pages
import MyAttendance from './pages/attendance/MyAttendance';
import AttendanceAdmin from './pages/attendance/AttendanceAdmin';

// Placeholder components for future phases
const DashboardPlaceholder = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    flexDirection: 'column',
    gap: '16px',
    background: 'var(--color-bg-app)',
  }}>
    <h1 style={{ color: 'var(--color-brand)' }}>🎉 Welcome to Dayflow!</h1>
    <p style={{ color: 'var(--color-text-muted)' }}>
      You're authenticated. Full Dashboard coming in Phase 3.
    </p>
  </div>
);

const AdminPlaceholder = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    flexDirection: 'column',
    gap: '16px',
    background: 'var(--color-bg-app)',
  }}>
    <h1 style={{ color: 'var(--color-brand)' }}>🔧 Admin Dashboard</h1>
    <p style={{ color: 'var(--color-text-muted)' }}>
      Admin panel coming in Phase 3.
    </p>
  </div>
);

const App = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      {/* ─── Public Routes ─── */}
      <Route
        path="/signin"
        element={
          isAuthenticated ? (
            <Navigate to={user?.role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />
          ) : (
            <SignIn />
          )
        }
      />
      <Route
        path="/signup"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <SignUp />
          )
        }
      />
      <Route path="/verify-email/:token" element={<VerifyEmail />} />

      {/* ─── Protected Routes (Wrapped in AppShell) ─── */}
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        {/* General Routes */}
        <Route path="/dashboard" element={<DashboardPlaceholder />} />
        <Route path="/directory" element={<EmployeeDirectory />} />
        <Route path="/profile" element={<EmployeeProfile />} />
        <Route path="/profile/:id" element={<EmployeeProfile />} />
        <Route path="/leave" element={<MyLeave />} />
        <Route path="/attendance" element={<MyAttendance />} />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <RoleGuard roles={['admin']}>
              <AdminPlaceholder />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/leave"
          element={
            <RoleGuard roles={['admin', 'hr']}>
              <LeaveAdmin />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/attendance"
          element={
            <RoleGuard roles={['admin', 'hr']}>
              <AttendanceAdmin />
            </RoleGuard>
          }
        />
      </Route>

      {/* ─── Catch-all ─── */}
      <Route
        path="*"
        element={
          <Navigate to={isAuthenticated ? '/dashboard' : '/signin'} replace />
        }
      />
    </Routes>
  );
};

export default App;
