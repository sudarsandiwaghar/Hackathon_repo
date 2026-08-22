import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  LogIn,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Filter,
} from 'lucide-react';
import api from '../../api/axios.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { Button } from '../../components/common/Button.tsx';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import { StatCard } from '../../components/common/StatCard.tsx';
import { DataTable, Column } from '../../components/common/DataTable.tsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.tsx';
import { AttendanceRecord } from '../../types.ts';

export const MyAttendance: React.FC = () => {
  const { employee } = useAuth();
  const { showToast } = useToast();

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [summary, setSummary] = useState({
    totalDays: 0,
    presentDays: 0,
    halfDays: 0,
    leaveDays: 0,
    absentDays: 0,
    attendanceRate: 100,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [elapsedTimer, setElapsedTimer] = useState('00:00:00');

  const fetchAttendance = async () => {
    try {
      const res = await api.get('/attendance/me');
      setRecords(res.data.records || []);
      setTodayRecord(res.data.todayRecord || null);
      if (res.data.summary) {
        setSummary(res.data.summary);
      }
    } catch (err) {
      console.error('Failed to load my attendance:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

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
      showToast({ title: 'Checked In', message: 'Work timer started.', variant: 'success' });
      fetchAttendance();
    } catch (err: any) {
      showToast({ title: 'Check-In Failed', message: err.response?.data?.error || 'Error', variant: 'error' });
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    setIsCheckingOut(true);
    try {
      const res = await api.post('/attendance/check-out');
      setTodayRecord(res.data.attendance);
      showToast({ title: 'Checked Out', message: 'Work session logged successfully.', variant: 'success' });
      fetchAttendance();
    } catch (err: any) {
      showToast({ title: 'Check-Out Failed', message: err.response?.data?.error || 'Error', variant: 'error' });
    } finally {
      setIsCheckingOut(false);
    }
  };

  const filteredRecords = records.filter((r) => {
    if (filterStatus !== 'all' && r.status.toLowerCase() !== filterStatus.toLowerCase()) return false;
    return true;
  });

  const columns: Column<AttendanceRecord>[] = [
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      render: (item) => (
        <div className="font-semibold text-gray-900">
          {new Date(item.date).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </div>
      ),
    },
    {
      key: 'checkIn',
      header: 'Check In',
      render: (item) =>
        item.checkIn ? (
          <span className="font-mono text-xs text-gray-800">
            {new Date(item.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      key: 'checkOut',
      header: 'Check Out',
      render: (item) =>
        item.checkOut ? (
          <span className="font-mono text-xs text-gray-800">
            {new Date(item.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      key: 'totalHours',
      header: 'Hours Logged',
      render: (item) =>
        item.totalHours ? (
          <span className="font-semibold text-gray-900">{item.totalHours} hrs</span>
        ) : item.checkIn && !item.checkOut ? (
          <span className="text-emerald-600 text-xs font-semibold animate-pulse">In Progress</span>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => <StatusBadge status={item.status} size="sm" />,
    },
    {
      key: 'source',
      header: 'Audit Source',
      render: (item) => (
        <span className="text-[11px] font-mono uppercase text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
          {item.source}
        </span>
      ),
    },
  ];

  if (isLoading) {
    return <LoadingSpinner message="Fetching attendance history..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header & Check-In Action */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Attendance Log</h1>
          <p className="text-xs text-gray-500 mt-1">
            Track daily work sessions, active shift timers, and automated attendance reconciliations.
          </p>
        </div>

        {/* Live Attendance Box */}
        <div className="flex items-center gap-4 bg-[#FAF7FA] p-3.5 rounded-2xl border border-gray-200">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Today's Clock</p>
            <p className="text-lg font-mono font-bold text-[#4A1F45]">
              {todayRecord?.checkIn ? (todayRecord.checkOut ? 'Day Finished' : elapsedTimer) : 'Not Started'}
            </p>
          </div>
          <div>
            {!todayRecord?.checkIn ? (
              <Button
                variant="primary"
                size="md"
                onClick={handleCheckIn}
                isLoading={isCheckingIn}
                leftIcon={<LogIn className="w-4 h-4" />}
              >
                Check In
              </Button>
            ) : !todayRecord?.checkOut ? (
              <Button
                variant="danger"
                size="md"
                onClick={handleCheckOut}
                isLoading={isCheckingOut}
                leftIcon={<LogOut className="w-4 h-4" />}
              >
                Check Out
              </Button>
            ) : (
              <div className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Completed
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Metric Summaries */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Overall Attendance"
          value={`${summary.attendanceRate}%`}
          subtitle="Past 30 days"
          icon={<TrendingUp className="w-5 h-5" />}
          accentColor="#059669"
        />
        <StatCard
          title="Days Present"
          value={summary.presentDays}
          subtitle="Full working days"
          icon={<CheckCircle2 className="w-5 h-5" />}
          accentColor="#4A1F45"
        />
        <StatCard
          title="Half-Days"
          value={summary.halfDays}
          subtitle="< 4 hrs logged"
          icon={<Clock className="w-5 h-5" />}
          accentColor="#D97706"
        />
        <StatCard
          title="Approved Leaves"
          value={summary.leaveDays}
          subtitle="Synced from leave center"
          icon={<Calendar className="w-5 h-5" />}
          accentColor="#2563EB"
        />
      </div>

      {/* Filters and Table */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Filter Status:</span>
            <div className="flex flex-wrap gap-1.5">
              {['all', 'Present', 'Half-day', 'Leave', 'Absent'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1 text-xs font-semibold rounded-xl transition-colors ${
                    filterStatus === st
                      ? 'bg-[#4A1F45] text-white'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {st.charAt(0).toUpperCase() + st.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <span className="text-xs text-gray-500 font-medium">Showing {filteredRecords.length} records</span>
        </div>

        <DataTable
          columns={columns}
          data={filteredRecords}
          keyExtractor={(item) => item._id}
          emptyTitle="No attendance records found"
          emptyDescription="There are no attendance records matching the current filter."
        />
      </div>
    </div>
  );
};
