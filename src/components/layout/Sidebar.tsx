import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Clock,
  CalendarCheck,
  CreditCard,
  Users,
  UserCheck,
  Bell,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  ClipboardList,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useNotifications } from '../../context/NotificationContext.tsx';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const { user, employee } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();

  const isAdmin = user?.role === 'admin';

  const employeeNav = [
    { label: 'My Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'My Attendance', path: '/attendance/me', icon: Clock },
    { label: 'My Leaves', path: '/leave/me', icon: CalendarCheck },
    { label: 'My Payroll', path: '/payroll/me', icon: CreditCard },
    { label: 'Directory', path: '/employees', icon: Users },
    { label: 'My Profile', path: '/profile', icon: UserCheck },
    {
      label: 'Notifications',
      path: '/notifications',
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
  ];

  const adminNav = [
    { label: 'HR Overview', path: '/admin/dashboard', icon: ShieldCheck },
    { label: 'Attendance Review', path: '/admin/attendance', icon: Clock },
    { label: 'Leave Requests', path: '/admin/leaves', icon: ClipboardList },
    { label: 'Payroll Center', path: '/admin/payroll', icon: CreditCard },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 h-screen z-40 bg-[#351532] text-white flex flex-col justify-between transition-all duration-300 ease-in-out border-r border-[#4A1F45]/50 select-none ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-[#4A1F45]/60 flex items-center justify-between">
        {!isCollapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#A77BA3] to-[#6F3C68] flex items-center justify-center shadow-md font-bold text-white tracking-wider text-base">
              DF
            </div>
            <div>
              <div className="font-bold text-base tracking-tight leading-tight flex items-center gap-1.5">
                Dayflow <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#6F3C68] text-white font-medium">HRMS</span>
              </div>
              <p className="text-[11px] text-gray-300/80 font-normal">Odoo × NMIT 2026</p>
            </div>
          </div>
        ) : (
          <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-br from-[#A77BA3] to-[#6F3C68] flex items-center justify-center shadow-md font-bold text-white text-base">
            DF
          </div>
        )}

        <button
          onClick={onToggle}
          className={`p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-[#4A1F45] transition-colors ${
            isCollapsed ? 'mx-auto mt-2' : ''
          }`}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Employee / Core Navigation */}
        <div className="space-y-1">
          {!isCollapsed && (
            <div className="px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400/90 mb-2">
              Workspace
            </div>
          )}
          {employeeNav.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative ${
                  isActive
                    ? 'bg-[#4A1F45] text-white shadow-sm border border-[#6F3C68]/50'
                    : 'text-gray-300/80 hover:text-white hover:bg-[#4A1F45]/50'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-[#A77BA3]' : 'text-gray-300'}`} />
                {!isCollapsed && <span className="flex-1 truncate">{item.label}</span>}
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500 text-white ${
                      isCollapsed ? 'absolute top-1 right-2' : ''
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Admin Navigation (If Admin) */}
        {isAdmin && (
          <div className="space-y-1 pt-2 border-t border-[#4A1F45]/50">
            {!isCollapsed && (
              <div className="px-3 text-[11px] font-semibold uppercase tracking-wider text-amber-300/90 mb-2 flex items-center justify-between">
                <span>Admin Suite</span>
                <Sparkles className="w-3 h-3 text-amber-300" />
              </div>
            )}
            {adminNav.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-[#6F3C68] text-white shadow-sm font-semibold'
                      : 'text-gray-300/80 hover:text-white hover:bg-[#4A1F45]/60'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-amber-200' : 'text-amber-400/80'}`} />
                  {!isCollapsed && <span className="flex-1 truncate">{item.label}</span>}
                </NavLink>
              );
            })}
          </div>
        )}
      </div>

      {/* User Info Footer */}
      <div className="p-3 border-t border-[#4A1F45]/60 bg-[#2b1028]/60">
        {!isCollapsed ? (
          <div className="flex items-center gap-3">
            <img
              src={
                employee?.photo ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  employee?.firstName || 'User'
                )}&background=6F3C68&color=fff`
              }
              alt="Profile"
              className="w-9 h-9 rounded-xl object-cover border border-[#6F3C68]"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {employee?.firstName} {employee?.lastName}
              </p>
              <div className="flex items-center gap-1.5">
                <span
                  className={`inline-block w-1.5 h-1.5 rounded-full ${
                    user?.role === 'admin' ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                />
                <span className="text-[10px] text-gray-300 capitalize truncate">
                  {user?.role === 'admin' ? 'HR Administrator' : employee?.designation || 'Employee'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <img
              src={
                employee?.photo ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  employee?.firstName || 'User'
                )}&background=6F3C68&color=fff`
              }
              alt="Profile"
              className="w-9 h-9 rounded-xl object-cover border border-[#6F3C68]"
            />
          </div>
        )}
      </div>
    </aside>
  );
};
