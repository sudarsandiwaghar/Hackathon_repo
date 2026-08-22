import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  CalendarCheck,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  LogIn,
  LogOut,
  Calendar,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import api from '../../api/axios.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { StatCard } from '../../components/common/StatCard.tsx';
import { Button } from '../../components/common/Button.tsx';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.tsx';
import { AttendanceRecord, LeaveRequest } from '../../types.ts';

export const EmployeeDashboard: React.FC = () => {
  const { user, employee } = useAuth();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState({
    totalDays: 0,
    presentDays: 0,
    halfDays: 0,
    leaveDays: 0,
    absentDays: 0,
    attendanceRate: 100,
  });
  const [myLeaves, setMyLeaves] = useState<LeaveRequest[]>([]);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [elapsedTimer, setElapsedTimer] = useState<string>('00:00:00');

  const fetchData = async () => {
    try {
      const [attRes, leaveRes] = await Promise.all([
        api.get('/attendance/me?limit=7'),
        api.get('/leave/me'),
      ]);

      setRecentAttendance(attRes.data.records || []);
      setTodayRecord(attRes.data.todayRecord || null);
      if (attRes.data.summary) {
        setAttendanceSummary(attRes.data.summary);
      }
      setMyLeaves(leaveRes.data.leaves || []);
    } catch (err) {
      console.error('Failed to load employee dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Live timer for active check-in
  useEffect(() => {
    if (!todayRecord?.checkIn || todayRecord.checkOut) return;

    const checkInMs = new Date(todayRecord.checkIn).getTime();

    const updateTimer = () => {
      const diffMs = Math.max(0, Date.now() - checkInMs);
      const hrs = Math.floor(diffMs / 3600000);
      const mins = Math.floor((diffMs % 3600000) / 60000);
      const secs = Math.floor((diffMs % 60000) / 1000);
      setElapsedTimer(
        `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [todayRecord]);

  const handleCheckIn = async () => {
    setIsCheckingIn(true);
    try {
      const res = await api.post('/attendance/check-in');
      setTodayRecord(res.data.attendance);
      showToast({
        title: 'Check-In Successful',
        message: 'Your shift has started. Have a great day!',
        variant: 'success',
      });
      fetchData();
    } catch (err: any) {
      showToast({
        title: 'Check-In Failed',
        message: err.response?.data?.error || 'Unable to check in.',
        variant: 'error',
      });
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    setIsCheckingOut(true);
    try {
      const res = await api.post('/attendance/check-out');
      setTodayRecord(res.data.attendance);
      showToast({
        title: 'Check-Out Complete',
        message: `Logged ${res.data.attendance.totalHours} hours today. See you tomorrow!`,
        variant: 'success',
      });
      fetchData();
    } catch (err: any) {
      showToast({
        title: 'Check-Out Failed',
        message: err.response?.data?.error || 'Unable to check out.',
        variant: 'error',
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Preparing your personalized dashboard..." />;
  }

  // Chart data for attendance donut
  const chartData = [
    { name: 'Present', value: attendanceSummary.presentDays || 10, color: '#059669' },
    { name: 'Half-day', value: attendanceSummary.halfDays || 1, color: '#D97706' },
    { name: 'Leave', value: attendanceSummary.leaveDays || 2, color: '#2563EB' },
    { name: 'Absent', value: attendanceSummary.absentDays || 0, color: '#DC2626' },
  ].filter((d) => d.value > 0);

  const totalLeaveAvailable = (employee?.leaveBalance?.paid || 0) + (employee?.leaveBalance?.sick || 0);

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-[#4A1F45] to-[#351532] text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#6F3C68] text-xs font-semibold text-white mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Employee Workspace
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome back, {employee?.firstName} {employee?.lastName}
            </h1>
            <p className="text-sm text-gray-200/90 mt-1 max-w-xl">
              {employee?.designation} • {employee?.department} (ID: {employee?.employeeCode})
            </p>
          </div>

          {/* Quick Check-In / Check-Out Widget */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
            <div className="text-center sm:text-left">
              <p className="text-xs text-gray-200 font-medium">Today's Work Log</p>
              {todayRecord?.checkIn ? (
                <div>
                  <span className="text-xl font-mono font-bold text-white tracking-wider">
                    {todayRecord.checkOut ? 'Completed' : elapsedTimer}
                  </span>
                  <p className="text-[11px] text-emerald-300 mt-0.5">
                    In: {new Date(todayRecord.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {todayRecord.checkOut && ` • Out: ${new Date(todayRecord.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                  </p>
                </div>
              ) : (
                <span className="text-sm font-semibold text-gray-300">Not Checked In Yet</span>
              )}
            </div>

            <div>
              {!todayRecord?.checkIn ? (
                <Button
                  variant="secondary"
                  size="md"
                  onClick={handleCheckIn}
                  isLoading={isCheckingIn}
                  leftIcon={<LogIn className="w-4 h-4 text-[#4A1F45]" />}
                  className="bg-white text-[#4A1F45] hover:bg-gray-100 font-bold shadow-md"
                >
                  Check In Now
                </Button>
              ) : !todayRecord?.checkOut ? (
                <Button
                  variant="danger"
                  size="md"
                  onClick={handleCheckOut}
                  isLoading={isCheckingOut}
                  leftIcon={<LogOut className="w-4 h-4" />}
                  className="shadow-md"
                >
                  Check Out
                </Button>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  Day Completed ({todayRecord.totalHours} hrs)
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Primary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Attendance Rate"
          value={`${attendanceSummary.attendanceRate}%`}
          subtitle={`${attendanceSummary.presentDays} of ${attendanceSummary.totalDays} days present`}
          icon={<TrendingUp className="w-5 h-5" />}
          accentColor="#059669"
          trend={{ value: 'Healthy', isPositive: true }}
        />
        <StatCard
          title="Leave Balance"
          value={`${totalLeaveAvailable} Days`}
          subtitle={`${employee?.leaveBalance?.paid || 0} Paid • ${employee?.leaveBalance?.sick || 0} Sick`}
          icon={<CalendarCheck className="w-5 h-5" />}
          accentColor="#4A1F45"
        />
        <StatCard
          title="Base Salary"
          value={`₹${(employee?.salary?.basic || 0).toLocaleString('en-IN')}`}
          subtitle={`Net: ₹${(
            (employee?.salary?.basic || 0) +
            (employee?.salary?.hra || 0) +
            (employee?.salary?.specialAllowance || 0) -
            (employee?.salary?.pfDeduction || 0) -
            (employee?.salary?.taxDeduction || 0)
          ).toLocaleString('en-IN')}`}
          icon={<CreditCard className="w-5 h-5" />}
          accentColor="#6F3C68"
        />
        <StatCard
          title="Today's Status"
          value={todayRecord?.status || 'Pending In'}
          subtitle={todayRecord?.checkIn ? `Checked in today` : 'Awaiting check-in'}
          icon={<Clock className="w-5 h-5" />}
          accentColor="#2563EB"
          badge={todayRecord?.status === 'Present' ? 'Active' : undefined}
        />
      </div>

      {/* Main Grid: Attendance & Leave Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Attendance List */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-gray-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">Recent Attendance Log</h3>
                <p className="text-xs text-gray-500">Your latest work sessions and recorded statuses</p>
              </div>
              <Link
                to="/attendance/me"
                className="text-xs font-semibold text-[#4A1F45] hover:underline inline-flex items-center gap-1"
              >
                Full History <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-gray-100 overflow-hidden">
              {recentAttendance.length === 0 ? (
                <p className="text-xs text-gray-500 py-6 text-center">No recent records found.</p>
              ) : (
                recentAttendance.slice(0, 5).map((rec) => (
                  <div key={rec._id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-xs flex-shrink-0">
                        {new Date(rec.date).toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {new Date(rec.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                        <p className="text-xs text-gray-500">
                          {rec.checkIn
                            ? `In: ${new Date(rec.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                            : 'No In Log'}
                          {rec.checkOut &&
                            ` • Out: ${new Date(rec.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                          {rec.totalHours ? ` (${rec.totalHours} hrs)` : ''}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={rec.status} />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Automated EOD Reconciled</span>
            <Link to="/attendance/me" className="font-semibold text-[#4A1F45]">
              View Monthly Calendar
            </Link>
          </div>
        </div>

        {/* Right Column: Attendance Ratio Chart & Upcoming Leaves */}
        <div className="space-y-6">
          {/* Donut Chart */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs">
            <h3 className="text-base font-bold text-gray-900 mb-1">Attendance Breakdown</h3>
            <p className="text-xs text-gray-500 mb-4">Past 14 recorded working days</p>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`${val} days`, 'Count']}
                    contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Leave Actions */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-gray-900">Leave Applications</h3>
              <Link to="/leave/me" className="text-xs font-semibold text-[#4A1F45] hover:underline">
                Manage
              </Link>
            </div>

            {myLeaves.length === 0 ? (
              <p className="text-xs text-gray-500 py-3">No active leave requests.</p>
            ) : (
              <div className="space-y-2.5 mb-4">
                {myLeaves.slice(0, 2).map((l) => (
                  <div key={l._id} className="p-3 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-900">
                        {l.leaveType} Leave ({l.days} days)
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {l.startDate} to {l.endDate}
                      </p>
                    </div>
                    <StatusBadge status={l.status} size="sm" />
                  </div>
                ))}
              </div>
            )}

            <Link to="/leave/me">
              <Button variant="primary" size="sm" className="w-full" leftIcon={<Calendar className="w-3.5 h-3.5" />}>
                Apply for Leave
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
