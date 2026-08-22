import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Bell,
  Search,
  LogOut,
  User,
  Shield,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Calendar,
  Clock as ClockIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useNotifications } from '../../context/NotificationContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import api from '../../api/axios.ts';

export const Topbar: React.FC = () => {
  const { user, employee, logout, login } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Current live date
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResetData = async () => {
    setIsResetting(true);
    try {
      await api.post('/seed/reset');
      showToast({
        title: 'Demo Data Refreshed',
        message: 'Re-seeded 8 employees, attendance, leaves, and payroll records.',
        variant: 'success',
      });
      window.location.reload();
    } catch (err) {
      showToast({
        title: 'Reset failed',
        message: 'Could not reset demo data.',
        variant: 'error',
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleQuickSwitch = async (targetRole: 'admin' | 'employee') => {
    setShowProfileMenu(false);
    try {
      if (targetRole === 'admin') {
        await login('hr@dayflow.com', 'Admin@123');
        showToast({ title: 'Switched to Admin Persona', message: 'Logged in as Divya Dharshini (HR Admin)', variant: 'info' });
        navigate('/admin/dashboard');
      } else {
        await login('alex.chen@dayflow.com', 'Employee@123');
        showToast({ title: 'Switched to Employee Persona', message: 'Logged in as Alex Chen (Senior Engineer)', variant: 'info' });
        navigate('/dashboard');
      }
    } catch (err) {
      showToast({ title: 'Switch failed', variant: 'error' });
    }
  };

  const handleLogout = () => {
    logout();
    showToast({ title: 'Signed out', message: 'Have a productive day!', variant: 'info' });
    navigate('/signin');
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-200/80 px-6 py-3 flex items-center justify-between shadow-xs">
      {/* Left: Greeting & Current Date */}
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-base font-bold text-gray-900 leading-tight">
            Hello, {employee?.firstName || 'Colleague'}
          </h2>
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span>{todayFormatted}</span>
            <span className="text-gray-300">•</span>
            <span className="px-2 py-0.5 rounded-md bg-[#F5EEF4] text-[#4A1F45] font-semibold text-[11px]">
              {user?.role === 'admin' ? 'HR Operations' : employee?.department || 'Member'}
            </span>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Reset Demo Data Pill */}
        <button
          onClick={handleResetData}
          disabled={isResetting}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all"
          title="Reset database to rich clean seed state"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin text-[#4A1F45]' : ''}`} />
          <span>Reset Demo</span>
        </button>

        {/* Notification Bell Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="relative p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors focus:outline-none"
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-3.5 border-b border-gray-100 bg-gray-50/75 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-gray-900">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-xs bg-[#4A1F45] text-white px-2 py-0.5 rounded-full font-bold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <Link
                  to="/notifications"
                  onClick={() => setShowNotifMenu(false)}
                  className="text-xs text-[#4A1F45] font-semibold hover:underline"
                >
                  View All
                </Link>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-500">
                    No notifications yet. You are all caught up!
                  </div>
                ) : (
                  notifications.slice(0, 4).map((n) => (
                    <div
                      key={n._id}
                      onClick={() => markAsRead(n._id)}
                      className={`p-3.5 hover:bg-gray-50 transition-colors cursor-pointer flex gap-3 ${
                        !n.read ? 'bg-purple-50/40' : ''
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#F5EEF4] text-[#4A1F45] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-semibold text-gray-900 truncate">{n.title}</p>
                          {!n.read && <span className="w-2 h-2 rounded-full bg-[#4A1F45] flex-shrink-0" />}
                        </div>
                        <p className="text-[11px] text-gray-600 line-clamp-2 mt-0.5 leading-snug">{n.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-gray-100 transition-colors focus:outline-none"
            aria-label="User menu"
          >
            <img
              src={
                employee?.photo ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  employee?.firstName || 'User'
                )}&background=4A1F45&color=fff`
              }
              alt="User Avatar"
              className="w-8 h-8 rounded-xl object-cover border border-gray-300"
            />
            <span className="hidden md:block text-xs font-semibold text-gray-800">
              {employee?.firstName}
            </span>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 divide-y divide-gray-100">
              <div className="p-4 bg-gray-50/75">
                <p className="text-sm font-bold text-gray-900 truncate">
                  {employee?.firstName} {employee?.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      user?.role === 'admin' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                  />
                  <span className="text-xs font-semibold text-gray-700 capitalize">
                    {user?.role === 'admin' ? 'HR Administrator' : 'Employee'}
                  </span>
                </div>
              </div>

              {/* Quick Persona Switcher for Hackathon Demo */}
              <div className="p-2 bg-[#FAF7FA]">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 px-2 py-1">
                  Quick Switch Persona
                </p>
                <button
                  onClick={() => handleQuickSwitch('admin')}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                    user?.role === 'admin' ? 'bg-[#F5EEF4] text-[#4A1F45] font-bold' : 'hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-amber-600" />
                    Admin (Divya D.)
                  </span>
                  {user?.role === 'admin' && <span className="text-[10px] text-[#4A1F45]">Active</span>}
                </button>
                <button
                  onClick={() => handleQuickSwitch('employee')}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors mt-0.5 ${
                    user?.role === 'employee' ? 'bg-[#F5EEF4] text-[#4A1F45] font-bold' : 'hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-600" />
                    Employee (Alex Chen)
                  </span>
                  {user?.role === 'employee' && <span className="text-[10px] text-[#4A1F45]">Active</span>}
                </button>
              </div>

              <div className="p-1.5">
                <Link
                  to="/profile"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <User className="w-4 h-4 text-gray-500" />
                  My Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4 text-rose-600" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
