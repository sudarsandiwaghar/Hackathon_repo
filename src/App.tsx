import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.tsx';
import { ToastProvider } from './context/ToastContext.tsx';
import { NotificationProvider } from './context/NotificationContext.tsx';

// Layout & Guards
import { AppLayout } from './components/layout/AppLayout.tsx';
import { ProtectedRoute } from './components/guards/ProtectedRoute.tsx';
import { RoleGuard } from './components/guards/RoleGuard.tsx';

// Auth Pages
import { SignIn } from './pages/auth/SignIn.tsx';
import { SignUp } from './pages/auth/SignUp.tsx';
import { VerifyEmail } from './pages/auth/VerifyEmail.tsx';

// Employee Pages
import { EmployeeDashboard } from './pages/dashboard/EmployeeDashboard.tsx';
import { MyAttendance } from './pages/attendance/MyAttendance.tsx';
import { MyLeave } from './pages/leave/MyLeave.tsx';
import { MyPayroll } from './pages/payroll/MyPayroll.tsx';
import { EmployeeDirectory } from './pages/employees/EmployeeDirectory.tsx';
import { EmployeeProfile } from './pages/employees/EmployeeProfile.tsx';
import { NotificationCenter } from './pages/notifications/NotificationCenter.tsx';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard.tsx';
import { AdminAttendance } from './pages/admin/AdminAttendance.tsx';
import { AdminLeaveApprovals } from './pages/admin/AdminLeaveApprovals.tsx';
import { AdminPayroll } from './pages/admin/AdminPayroll.tsx';

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <NotificationProvider>
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/signin" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/verify-email/:token" element={<VerifyEmail />} />

              {/* Protected Workspace Routes */}
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                {/* Employee / Core Routes */}
                <Route path="/dashboard" element={<EmployeeDashboard />} />
                <Route path="/attendance/me" element={<MyAttendance />} />
                <Route path="/leave/me" element={<MyLeave />} />
                <Route path="/payroll/me" element={<MyPayroll />} />
                <Route path="/employees" element={<EmployeeDirectory />} />
                <Route path="/profile" element={<EmployeeProfile />} />
                <Route path="/notifications" element={<NotificationCenter />} />

                {/* Admin Only Routes */}
                <Route
                  path="/admin/dashboard"
                  element={
                    <RoleGuard roles={['admin']}>
                      <AdminDashboard />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/admin/attendance"
                  element={
                    <RoleGuard roles={['admin']}>
                      <AdminAttendance />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/admin/leaves"
                  element={
                    <RoleGuard roles={['admin']}>
                      <AdminLeaveApprovals />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/admin/payroll"
                  element={
                    <RoleGuard roles={['admin']}>
                      <AdminPayroll />
                    </RoleGuard>
                  }
                />
              </Route>

              {/* Default redirects */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </NotificationProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
