import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Search,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import api from '../../api/axios.ts';
import { useToast } from '../../context/ToastContext.tsx';
import { Button } from '../../components/common/Button.tsx';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import { StatCard } from '../../components/common/StatCard.tsx';
import { Modal } from '../../components/common/Modal.tsx';
import { Input } from '../../components/common/Input.tsx';
import { DataTable, Column } from '../../components/common/DataTable.tsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.tsx';
import { LeaveRequest, Employee } from '../../types.ts';

export const AdminLeaveApprovals: React.FC = () => {
  const { showToast } = useToast();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Action Modal State
  const [actionLeave, setActionLeave] = useState<LeaveRequest | null>(null);
  const [actionType, setActionType] = useState<'Approved' | 'Rejected'>('Approved');
  const [reviewComment, setReviewComment] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchLeaveData = async () => {
    try {
      const [leaveRes, empRes] = await Promise.all([api.get('/leave'), api.get('/employees')]);
      setLeaves(leaveRes.data || []);
      setEmployees(empRes.data || []);
    } catch (err) {
      console.error('Failed to load leave requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveData();
  }, []);

  const empMap = new Map<string, Employee>();
  employees.forEach((e) => empMap.set(e._id, e));

  const handleOpenActionModal = (item: LeaveRequest, type: 'Approved' | 'Rejected') => {
    setActionLeave(item);
    setActionType(type);
    setReviewComment(type === 'Approved' ? 'Approved by HR Operations.' : 'Unable to approve due to team schedule overlap.');
  };

  const handleProcessLeave = async () => {
    if (!actionLeave) return;
    setIsProcessing(true);
    try {
      await api.put(`/leave/${actionLeave._id}/status`, {
        status: actionType,
        reviewComment,
      });
      showToast({
        title: `Leave ${actionType}`,
        message:
          actionType === 'Approved'
            ? 'Leave approved and written through to attendance.'
            : 'Leave application marked as rejected.',
        variant: actionType === 'Approved' ? 'success' : 'info',
      });
      setActionLeave(null);
      fetchLeaveData();
    } catch (err: any) {
      showToast({
        title: 'Action Failed',
        message: err.response?.data?.error || 'Failed to update leave status.',
        variant: 'error',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredLeaves = leaves.filter((l) => {
    if (statusFilter !== 'all' && l.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const emp = empMap.get(l.employeeId);
      const matchName = emp ? `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(q) : false;
      const matchReason = l.reason.toLowerCase().includes(q);
      const matchType = l.leaveType.toLowerCase().includes(q);
      if (!matchName && !matchReason && !matchType) return false;
    }
    return true;
  });

  const pendingCount = leaves.filter((l) => l.status === 'Pending').length;
  const approvedCount = leaves.filter((l) => l.status === 'Approved').length;
  const rejectedCount = leaves.filter((l) => l.status === 'Rejected').length;

  const columns: Column<LeaveRequest>[] = [
    {
      key: 'employee',
      header: 'Applicant',
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
              <span className="font-bold text-gray-900 text-xs block">
                {emp ? `${emp.firstName} ${emp.lastName}` : item.employeeId}
              </span>
              <span className="text-[10px] text-gray-500 font-mono">{emp?.department} • {emp?.employeeCode}</span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'type',
      header: 'Type & Days',
      sortable: true,
      render: (item) => (
        <div>
          <span className="font-semibold text-xs text-gray-900 block">{item.leaveType} Leave</span>
          <span className="text-[11px] text-gray-500">{item.days} working day(s)</span>
        </div>
      ),
    },
    {
      key: 'period',
      header: 'Date Range',
      render: (item) => (
        <span className="text-xs text-gray-800 font-mono">
          {item.startDate} → {item.endDate}
        </span>
      ),
    },
    {
      key: 'reason',
      header: 'Reason / Remarks',
      render: (item) => (
        <div className="max-w-xs">
          <p className="text-xs text-gray-700 line-clamp-2">{item.reason}</p>
          {item.reviewComment && (
            <p className="text-[10px] text-[#6F3C68] font-medium mt-0.5">Admin: "{item.reviewComment}"</p>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => <StatusBadge status={item.status} size="sm" />,
    },
    {
      key: 'actions',
      header: 'Adjudication',
      align: 'right',
      render: (item) =>
        item.status === 'Pending' ? (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenActionModal(item, 'Approved')}
              className="text-xs px-2.5 py-1"
            >
              Approve
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenActionModal(item, 'Rejected')}
              className="text-xs text-rose-600 hover:bg-rose-50 px-2 py-1"
            >
              Decline
            </Button>
          </div>
        ) : (
          <span className="text-xs text-gray-400">Finalized</span>
        ),
    },
  ];

  if (isLoading) {
    return <LoadingSpinner message="Loading leave adjudication queue..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Leave Adjudication Center</h1>
          <p className="text-xs text-gray-500 mt-1">
            Review and adjudicate employee time-off requests with automated attendance write-through.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#F5EEF4] text-[#4A1F45] text-xs font-semibold">
          <Sparkles className="w-4 h-4 text-[#6F3C68]" />
          <span>Write-Through Attendance Sync Active</span>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Pending In Review"
          value={pendingCount}
          subtitle="Awaiting administrative action"
          icon={<Clock className="w-5 h-5" />}
          accentColor="#D97706"
          badge={pendingCount > 0 ? 'Queue Active' : undefined}
        />
        <StatCard
          title="Approved Requests"
          value={approvedCount}
          subtitle="Synced with attendance rosters"
          icon={<CheckCircle2 className="w-5 h-5" />}
          accentColor="#059669"
        />
        <StatCard
          title="Declined Requests"
          value={rejectedCount}
          subtitle="Non-sanctioned applications"
          icon={<XCircle className="w-5 h-5" />}
          accentColor="#DC2626"
        />
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="w-full md:w-80">
          <Input
            placeholder="Search by employee name, reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {['all', 'Pending', 'Approved', 'Rejected'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-[#4A1F45] text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {st === 'all' ? 'All Applications' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="space-y-4">
        <DataTable
          columns={columns}
          data={filteredLeaves}
          keyExtractor={(item) => item._id}
          emptyTitle="No leave applications found"
          emptyDescription="No applications matched your search or status filter."
        />
      </div>

      {/* Action Decision Modal */}
      {actionLeave && (
        <Modal
          isOpen={!!actionLeave}
          onClose={() => setActionLeave(null)}
          title={`${actionType === 'Approved' ? 'Approve' : 'Reject'} Leave Request`}
          subtitle={`Applicant: ${empMap.get(actionLeave.employeeId)?.firstName} ${
            empMap.get(actionLeave.employeeId)?.lastName
          } (${actionLeave.days} days)`}
          footer={
            <>
              <Button variant="outline" onClick={() => setActionLeave(null)}>
                Cancel
              </Button>
              <Button
                variant={actionType === 'Approved' ? 'primary' : 'danger'}
                onClick={handleProcessLeave}
                isLoading={isProcessing}
              >
                Confirm {actionType}
              </Button>
            </>
          }
        >
          <div className="space-y-4 text-sm">
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Leave Category:</span>
                <span className="font-bold text-gray-900">{actionLeave.leaveType} Leave</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Requested Dates:</span>
                <span className="font-mono text-gray-900">
                  {actionLeave.startDate} to {actionLeave.endDate} ({actionLeave.days} working days)
                </span>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <p className="text-gray-500 mb-0.5">Applicant Note:</p>
                <p className="text-gray-900 font-medium italic">"{actionLeave.reason}"</p>
              </div>
            </div>

            {actionType === 'Approved' && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>
                  Confirming approval will instantly sync {actionLeave.days} 'Leave' records into Attendance.
                </span>
              </div>
            )}

            <div className="w-full flex flex-col gap-1.5 text-left">
              <label className="block text-xs font-semibold text-gray-700">HR Review Feedback</label>
              <textarea
                rows={3}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-sm text-gray-900 focus:border-[#6F3C68] outline-none resize-none"
                placeholder="Add optional note or justification visible to the employee..."
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
