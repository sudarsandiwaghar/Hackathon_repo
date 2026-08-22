import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/guards/ProtectedRoute';
import RoleGuard from './components/guards/RoleGuard';
import SignIn from './pages/auth/SignIn';
import SignUp from './pages/auth/SignUp';
import VerifyEmail from './pages/auth/VerifyEmail';

// Placeholder components for future phases
const DashboardPlaceholder = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    flexDirection: 'column',
    gap: '16px',
    background: 'var(--color-bg-app)',
  }}>
    <h1 style={{ color: 'var(--color-brand)' }}>🎉 Welcome to Dayflow!</h1>
    <p style={{ color: 'var(--color-text-muted)' }}>
      You're authenticated. Dashboard coming in Phase 2.
    </p>
    <LogoutButton />
  </div>
);

const AdminPlaceholder = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    flexDirection: 'column',
    gap: '16px',
    background: 'var(--color-bg-app)',
  }}>
    <h1 style={{ color: 'var(--color-brand)' }}>🔧 Admin Dashboard</h1>
    <p style={{ color: 'var(--color-text-muted)' }}>
      Admin panel coming in Phase 2.
    </p>
    <LogoutButton />
  </div>
);

const LogoutButton = () => {
  const { signout } = useAuth();
  return (
    <button
      onClick={signout}
      style={{
        padding: '10px 24px',
        background: 'var(--color-brand)',
        color: 'white',
        border: 'none',
        borderRadius: 'var(--radius-button)',
        cursor: 'pointer',
        fontWeight: 600,
        fontSize: '14px',
      }}
    >
      Sign Out
    </button>
  );
};

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

      {/* ─── Employee Protected Routes ─── */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPlaceholder />
          </ProtectedRoute>
        }
      />

      {/* ─── Admin Protected Routes ─── */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute>
            <RoleGuard roles={['admin']}>
              <AdminPlaceholder />
            </RoleGuard>
          </ProtectedRoute>
        }
      />

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
