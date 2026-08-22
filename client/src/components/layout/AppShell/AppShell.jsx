import { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import {
  Users,
  LayoutDashboard,
  CalendarCheck,
  PlaneTakeoff,
  Wallet,
  Bell,
  LogOut,
  Menu,
  X,
  Settings,
  ChevronDown
} from 'lucide-react';
import './AppShell.css';

const AppShell = () => {
  const { user, employee, signout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleProfileMenu = () => setIsProfileMenuOpen(!isProfileMenuOpen);

  const handleSignOut = () => {
    signout();
    navigate('/signin');
  };

  const navLinks = [
    { to: isAdmin ? '/admin/dashboard' : '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/directory', icon: Users, label: 'Directory' },
    { to: '/attendance', icon: CalendarCheck, label: 'Attendance' },
    { to: '/leave', icon: PlaneTakeoff, label: 'Leave' },
    { to: '/payroll', icon: Wallet, label: 'Payroll' },
  ];

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <div className="app-shell">
      {/* ─── Sidebar ─── */}
      <aside className={`sidebar ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/dashboard" className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <CalendarCheck size={20} color="white" />
            </div>
            <span>Dayflow</span>
          </Link>
          <button className="sidebar-close-btn" onClick={toggleSidebar}>
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'active' : ''}`
                }
                onClick={() => setIsSidebarOpen(false)}
              >
                <Icon size={20} className="sidebar-link-icon" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-link" onClick={handleSignOut}>
            <LogOut size={20} className="sidebar-link-icon" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ─── Main Content Area ─── */}
      <div className="main-wrapper">
        {/* ─── Topbar ─── */}
        <header className="topbar">
          <button className="mobile-menu-btn" onClick={toggleSidebar}>
            <Menu size={24} />
          </button>

          <div className="topbar-right">
            <button className="notification-btn">
              <Bell size={20} />
              <span className="notification-badge"></span>
            </button>

            <div className="profile-menu-wrapper">
              <button className="profile-btn" onClick={toggleProfileMenu}>
                {employee?.profilePhoto ? (
                  <img
                    src={employee.profilePhoto}
                    alt="Profile"
                    className="profile-avatar-img"
                  />
                ) : (
                  <div className="profile-avatar">
                    {getInitials(employee?.firstName, employee?.lastName) || 'U'}
                  </div>
                )}
                <div className="profile-info">
                  <span className="profile-name">
                    {employee?.firstName} {employee?.lastName}
                  </span>
                  <span className="profile-role">{user?.role}</span>
                </div>
                <ChevronDown size={16} className="profile-chevron" />
              </button>

              {isProfileMenuOpen && (
                <div className="profile-dropdown animate-scale-in">
                  <div className="dropdown-header">
                    <strong>{employee?.firstName} {employee?.lastName}</strong>
                    <span>{employee?.email}</span>
                  </div>
                  <Link
                    to="/profile"
                    className="dropdown-item"
                    onClick={() => setIsProfileMenuOpen(false)}
                  >
                    <Settings size={16} />
                    <span>My Profile</span>
                  </Link>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item text-error" onClick={handleSignOut}>
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ─── Page Content ─── */}
        <main className="main-content">
          <Outlet />
        </main>
      </div>

      {/* ─── Mobile Overlay ─── */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={toggleSidebar}></div>
      )}
    </div>
  );
};

export default AppShell;
