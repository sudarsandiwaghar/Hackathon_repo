import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  Filter,
  Search,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Users,
  Play,
} from 'lucide-react';
import api from '../../api/axios.ts';
import { useToast } from '../../context/ToastContext.tsx';
import { Button } from '../../components/common/Button.tsx';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import { StatCard } from '../../components/common/StatCard.tsx';
import { DataTable, Column } from '../../components/common/DataTable.tsx';
import { Input } from '../../components/common/Input.tsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.tsx';
import { AttendanceRecord, Employee } from '../../types.ts';

export const AdminAttendance: React.FC = () => {
  const { showToast } = useToast();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReconciling, setIsReconciling] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const fetchAttendanceData = async () => {
    try {
      const [attRes, empRes] = await Promise.all([api.get('/attendance'), api.get('/employees')]);
      setAttendance(attRes.data || []);
      setEmployees(empRes.data || []);
    } catch (err) {
      console.error('Failed to load admin attendance:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const handleRunReconciler = async () => {
    setIsReconciling(true);
    try {
      const res = await api.post('/attendance/reconcile');
      showToast({
        title: 'Reconciliation Completed',
        message: res.data.message || 'End-of-day attendance checked and missing shifts marked Absent.',
        variant: 'success',
      });
      fetchAttendanceData();
    } catch (err: any) {
      showToast({
        title: 'Reconciler Failed',
        message: err.response?.data?.error || 'Unable to execute job.',
        variant: 'error',
      });
    } finally {
      setIsReconciling(false);
    }
  };

  // Map employee info by ID
  const empMap = new Map<string, Employee>();
  employees.forEach((e) => empMap.set(e._id, e));

  const filteredRecords = attendance.filter((rec) => {
    if (statusFilter !== 'all' && rec.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (dateFilter && rec.date !== dateFilter) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const emp = empMap.get(rec.employeeId);
      const matchName = emp ? `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(q) : false;
      const matchCode = emp ? emp.employeeCode.toLowerCase().includes(q) : false;
      const matchDept = emp ? emp.department.toLowerCase().includes(q) : false;
      if (!matchName && !matchCode && !matchDept) return false;
    }
    return true;
  });

  const presentCount = filteredRecords.filter((r) => r.status === 'Present').length;
  const halfCount = filteredRecords.filter((r) => r.status === 'Half-day').length;
  const leaveCount = filteredRecords.filter((r) => r.status === 'Leave').length;
  const absentCount = filteredRecords.filter((r) => r.status === 'Absent').length;

  const columns: Column<AttendanceRecord>[] = [
    {
      key: 'employee',
      header: 'Employee',
      render: (item) => {
        const emp = empMap.get(item.employeeId);
        return (
          <div className="flex items-center gap-3">
            <img
              src={
                emp?.photo ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  emp ? emp.firstName + ' ' + emp.lastName : 'User'
                )}&background=4A1F45&color=fff`
              }
              alt="Avatar"
              className="w-8 h-8 rounded-xl object-cover border border-gray-200"
            />
            <div>
              <span className="font-semibold text-gray-900 text-xs block">
                {emp ? `${emp.firstName} ${emp.lastName}` : item.employeeId}
              </span>
              <span className="text-[10px] text-gray-500 font-mono">{emp?.employeeCode} • {emp?.department}</span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      render: (item) => <span className="font-semibold text-xs text-gray-800">{item.date}</span>,
    },
    {
      key: 'checkIn',
      header: 'Check In',
      render: (item) =>
        item.checkIn ? (
          <span className="font-mono text-xs text-gray-700">
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
          <span className="font-mono text-xs text-gray-700">
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
          <span className="font-semibold text-xs text-gray-900">{item.totalHours} hrs</span>
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
      header: 'Source',
      render: (item) => (
        <span className="text-[10px] font-mono uppercase text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
          {item.source}
        </span>
      ),
    },
  ];

  if (isLoading) {
    return <LoadingSpinner message="Loading company attendance log..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Attendance Administration</h1>
          <p className="text-xs text-gray-500 mt-1">
            Review company shift logs, audit check-in/out timestamps, and trigger automated reconciliations.
          </p>
        </div>

        <Button
          variant="secondary"
          size="md"
          onClick={handleRunReconciler}
          isLoading={isReconciling}
          leftIcon={<Play className="w-4 h-4 text-[#4A1F45]" />}
          title="Executes the EOD Absent & Half-day reconciler job on-demand"
        >
          Run EOD Reconciler
        </Button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Present Records"
          value={presentCount}
          subtitle="Full working days"
          icon={<CheckCircle2 className="w-5 h-5" />}
          accentColor="#059669"
        />
        <StatCard
          title="Half-Day Records"
          value={halfCount}
          subtitle="< 4 hrs logged"
          icon={<Clock className="w-5 h-5" />}
          accentColor="#D97706"
        />
        <StatCard
          title="Approved Leaves"
          value={leaveCount}
          subtitle="Sync write-through"
          icon={<Calendar className="w-5 h-5" />}
          accentColor="#2563EB"
        />
        <StatCard
          title="Absent Logs"
          value={absentCount}
          subtitle="EOD non-attendance"
          icon={<AlertTriangle className="w-5 h-5" />}
          accentColor="#DC2626"
        />
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="w-full sm:w-64">
            <Input
              placeholder="Search employee, ID, or dept..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <div className="w-full sm:w-48">
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-xs text-[#4A1F45] font-semibold hover:underline self-center"
            >
              Clear Date
            </button>
          )}
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {['all', 'Present', 'Half-day', 'Leave', 'Absent'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-[#4A1F45] text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {st === 'all' ? 'All Records' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="space-y-4">
        <DataTable
          columns={columns}
          data={filteredRecords}
          keyExtractor={(item) => item._id}
          emptyTitle="No attendance records found"
          emptyDescription="No logs matching your current search or status filter."
        />
      </div>
    </div>
  );
};
