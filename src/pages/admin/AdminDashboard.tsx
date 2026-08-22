import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Clock,
  ClipboardList,
  CreditCard,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Building2,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import api from '../../api/axios.ts';
import { useToast } from '../../context/ToastContext.tsx';
import { StatCard } from '../../components/common/StatCard.tsx';
import { Button } from '../../components/common/Button.tsx';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.tsx';
import { LeaveRequest, AttendanceRecord, Employee } from '../../types.ts';

export const AdminDashboard: React.FC = () => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    pendingLeaves: 0,
    attendanceRateToday: 0,
    totalMonthlyPayroll: 0,
  });
  const [pendingLeaveList, setPendingLeaveList] = useState<LeaveRequest[]>([]);
  const [deptDistribution, setDeptDistribution] = useState<{ name: string; count: number }[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([]);

  const fetchAdminData = async () => {
    try {
      const [empRes, attRes, leaveRes, payRes] = await Promise.all([
        api.get('/employees'),
        api.get('/attendance'),
        api.get('/leave?status=Pending'),
        api.get('/payroll'),
      ]);

      const allEmployees: Employee[] = Array.isArray(empRes.data) ? empRes.data : [];
      const allAttendance: AttendanceRecord[] = Array.isArray(attRes.data) ? attRes.data : [];
      const pendingLeaves: LeaveRequest[] = Array.isArray(leaveRes.data) ? leaveRes.data : [];
      const allPayrolls: any[] = payRes.data?.records || (Array.isArray(payRes.data) ? payRes.data : []);

      // Today string
      const todayStr = new Date().toISOString().split('T')[0];
      const todayRecords = allAttendance.filter((r) => r.date === todayStr);

      const presentCount = todayRecords.filter((r) => r.status === 'Present').length;
      const rate = allEmployees.length > 0 ? Math.round((presentCount / allEmployees.length) * 100) : 0;

      // Dept distribution
      const deptMap: Record<string, number> = {};
      allEmployees.forEach((emp) => {
        if (emp?.department) {
          deptMap[emp.department] = (deptMap[emp.department] || 0) + 1;
        }
      });
      const deptData = Object.keys(deptMap).map((k) => ({ name: k, count: deptMap[k] }));

      // Total payroll
      const currentMonthPay = allPayrolls.reduce((sum: number, p: any) => sum + (p?.netSalary || 0), 0);

      setStats({
        totalEmployees: allEmployees.length,
        presentToday: presentCount,
        pendingLeaves: pendingLeaves.length,
        attendanceRateToday: rate,
        totalMonthlyPayroll: currentMonthPay,
      });

      setPendingLeaveList(pendingLeaves.slice(0, 4));
      setDeptDistribution(deptData);
      setTodayAttendance(todayRecords);
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleQuickApprove = async (id: string) => {
    try {
      await api.put(`/leave/${id}/status`, { status: 'Approved', reviewComment: 'Approved via Admin Quick Panel' });
      showToast({ title: 'Leave Approved', message: 'Attendance records automatically synced.', variant: 'success' });
      fetchAdminData();
    } catch (err: any) {
      showToast({ title: 'Approval Failed', message: err.response?.data?.error || 'Error', variant: 'error' });
    }
  };

  const handleQuickReject = async (id: string) => {
    try {
      await api.put(`/leave/${id}/status`, { status: 'Rejected', reviewComment: 'Declined by HR administrator.' });
      showToast({ title: 'Leave Rejected', message: 'Application status updated.', variant: 'info' });
      fetchAdminData();
    } catch (err: any) {
      showToast({ title: 'Rejection Failed', message: err.response?.data?.error || 'Error', variant: 'error' });
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Aggregating company-wide HR metrics..." />;
  }

  const COLORS = ['#4A1F45', '#6F3C68', '#A77BA3', '#059669', '#2563EB', '#D97706'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#351532] to-[#4A1F45] text-white rounded-3xl p-6 sm:p-8 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#6F3C68] text-xs font-semibold text-white mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
            Executive HR Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">HR Operations Center</h1>
          <p className="text-sm text-gray-200 mt-1 max-w-xl">
            Real-time workforce attendance tracking, leave adjudication, and automated payroll operations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/admin/attendance">
            <Button variant="secondary" size="md" className="bg-white text-[#4A1F45] hover:bg-gray-100 font-bold">
              Review Attendance
            </Button>
          </Link>
          <Link to="/admin/payroll">
            <Button variant="primary" size="md" className="bg-[#6F3C68] hover:bg-[#A77BA3]">
              Run Payroll
            </Button>
          </Link>
        </div>
      </div>

      {/* Primary KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Headcount"
          value={stats.totalEmployees}
          subtitle="Across 6 active departments"
          icon={<Users className="w-5 h-5" />}
          accentColor="#4A1F45"
        />
        <StatCard
          title="Today's Attendance"
          value={`${stats.attendanceRateToday}%`}
          subtitle={`${stats.presentToday} checked in today`}
          icon={<Clock className="w-5 h-5" />}
          accentColor="#059669"
        />
        <StatCard
          title="Pending Approvals"
          value={stats.pendingLeaves}
          subtitle="Requires HR adjudication"
          icon={<ClipboardList className="w-5 h-5" />}
          accentColor="#D97706"
          badge={stats.pendingLeaves > 0 ? 'Action Needed' : undefined}
        />
        <StatCard
          title="Monthly Payroll Run"
          value={`₹${stats.totalMonthlyPayroll.toLocaleString('en-IN')}`}
          subtitle="Disbursed this cycle"
          icon={<CreditCard className="w-5 h-5" />}
          accentColor="#2563EB"
        />
      </div>

      {/* Analytics & Pending Approvals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Distribution Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">Headcount by Department</h3>
              <p className="text-xs text-gray-500">Distribution across operational units</p>
            </div>
            <Link to="/employees" className="text-xs font-semibold text-[#4A1F45] hover:underline">
              View Directory →
            </Link>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
                <Tooltip
                  formatter={(val: any) => [`${val} Members`, 'Staff Count']}
                  contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#4A1F45" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pending Leave Requests Quick Action Box */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-gray-900">Pending Leave Queue</h3>
              <Link to="/admin/leaves" className="text-xs font-semibold text-[#4A1F45] hover:underline">
                View All ({stats.pendingLeaves})
              </Link>
            </div>

            {pendingLeaveList.length === 0 ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs text-gray-600 font-semibold">Queue is Clean</p>
                <p className="text-[11px] text-gray-400">All submitted leaves have been adjudicated.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingLeaveList.map((item) => (
                  <div key={item._id} className="p-3 rounded-2xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-gray-900">
                        {item.leaveType} Leave ({item.days}d)
                      </span>
                      <span className="text-[10px] text-gray-500">{item.startDate}</span>
                    </div>
                    <p className="text-[11px] text-gray-600 line-clamp-1 mb-2">"{item.reason}"</p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleQuickApprove(item._id)}
                        className="w-full py-1 text-xs"
                      >
                        Approve
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleQuickReject(item._id)}
                        className="w-full py-1 text-xs text-rose-600 hover:bg-rose-50"
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-gray-100 text-[11px] text-gray-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Approvals write-through directly to Attendance.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
