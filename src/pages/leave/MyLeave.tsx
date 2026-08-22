import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CalendarCheck,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import api from '../../api/axios.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { Button } from '../../components/common/Button.tsx';
import { Input } from '../../components/common/Input.tsx';
import { Modal } from '../../components/common/Modal.tsx';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import { StatCard } from '../../components/common/StatCard.tsx';
import { DataTable, Column } from '../../components/common/DataTable.tsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.tsx';
import { LeaveRequest } from '../../types.ts';

export const MyLeave: React.FC = () => {
  const { employee, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [leaveBalance, setLeaveBalance] = useState({ paid: 12, sick: 8, unpaid: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    leaveType: 'Paid' as 'Paid' | 'Sick' | 'Unpaid',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: '',
  });
  const [formError, setFormError] = useState('');

  const fetchLeaves = async () => {
    try {
      const res = await api.get('/leave/me');
      setLeaves(res.data.leaves || []);
      if (res.data.leaveBalance) {
        setLeaveBalance(res.data.leaveBalance);
      }
    } catch (err) {
      console.error('Failed to load leaves:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.reason.trim()) {
      setFormError('Please provide a brief reason for your leave request.');
      return;
    }
    if (form.startDate > form.endDate) {
      setFormError('Start date cannot be after end date.');
      return;
    }

    setFormError('');
    setIsSubmitting(true);

    try {
      await api.post('/leave', form);
      showToast({
        title: 'Application Submitted',
        message: 'Your leave request has been dispatched to HR for review.',
        variant: 'success',
      });
      setIsApplyModalOpen(false);
      setForm({
        leaveType: 'Paid',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        reason: '',
      });
      fetchLeaves();
      refreshUser();
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to submit leave application.';
      setFormError(msg);
      showToast({ title: 'Application Error', message: msg, variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this pending leave request?')) return;

    try {
      await api.delete(`/leave/${id}`);
      showToast({ title: 'Leave Cancelled', message: 'Your application was withdrawn.', variant: 'info' });
      fetchLeaves();
    } catch (err: any) {
      showToast({
        title: 'Cancel Failed',
        message: err.response?.data?.error || 'Could not cancel leave.',
        variant: 'error',
      });
    }
  };

  const columns: Column<LeaveRequest>[] = [
    {
      key: 'leaveType',
      header: 'Leave Type',
      sortable: true,
      render: (item) => (
        <span className="font-semibold text-gray-900 flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-[#4A1F45]" />
          {item.leaveType} Leave
        </span>
      ),
    },
    {
      key: 'dates',
      header: 'Duration & Dates',
      render: (item) => (
        <div>
          <span className="font-semibold text-gray-900 text-xs">
            {item.startDate} to {item.endDate}
          </span>
          <p className="text-[11px] text-gray-500">{item.days} working day(s)</p>
        </div>
      ),
    },
    {
      key: 'reason',
      header: 'Reason / Remarks',
      render: (item) => (
        <div className="max-w-xs">
          <p className="text-xs text-gray-800 line-clamp-2">{item.reason}</p>
          {item.reviewComment && (
            <p className="text-[11px] text-[#6F3C68] font-medium mt-0.5 bg-[#F5EEF4] px-2 py-0.5 rounded-md inline-block">
              HR: "{item.reviewComment}"
            </p>
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
      header: 'Action',
      align: 'right',
      render: (item) =>
        item.status === 'Pending' ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCancel(item._id)}
            className="text-rose-600 hover:bg-rose-50 px-2 py-1 text-xs"
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Cancel
          </Button>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        ),
    },
  ];

  if (isLoading) {
    return <LoadingSpinner message="Loading leave balances and records..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Leave Management</h1>
          <p className="text-xs text-gray-500 mt-1">
            Apply for time off, view available leave allowances, and track managerial approval workflows.
          </p>
        </div>
        <Button
          variant="primary"
          size="lg"
          onClick={() => setIsApplyModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Apply for Leave
        </Button>
      </div>

      {/* Leave Balance Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Paid Leave Available"
          value={`${leaveBalance.paid} Days`}
          subtitle="Annual earned leaves"
          icon={<CalendarCheck className="w-5 h-5" />}
          accentColor="#059669"
        />
        <StatCard
          title="Sick Leave Available"
          value={`${leaveBalance.sick} Days`}
          subtitle="Medical & wellness leaves"
          icon={<Clock className="w-5 h-5" />}
          accentColor="#2563EB"
        />
        <StatCard
          title="Unpaid / Loss of Pay"
          value={`${leaveBalance.unpaid || 0} Days`}
          subtitle="Discretionary non-compensated"
          icon={<AlertCircle className="w-5 h-5" />}
          accentColor="#6F3C68"
        />
      </div>

      {/* Leave Application History Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">Application History</h3>
          <span className="text-xs text-gray-500">{leaves.length} total applications</span>
        </div>

        <DataTable
          columns={columns}
          data={leaves}
          keyExtractor={(item) => item._id}
          emptyTitle="No leave applications yet"
          emptyDescription="You have not submitted any leave requests. Click 'Apply for Leave' to submit your first request."
        />
      </div>

      {/* Apply Leave Modal */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title="Apply for Time Off"
        subtitle="Submit a formal leave request for HR administrator review."
        footer={
          <>
            <Button variant="outline" onClick={() => setIsApplyModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleApply}
              isLoading={isSubmitting}
            >
              Submit Application
            </Button>
          </>
        }
      >
        <form onSubmit={handleApply} className="space-y-4">
          <div className="w-full flex flex-col gap-1.5 text-left">
            <label className="block text-xs font-semibold text-gray-700">Leave Category</label>
            <select
              value={form.leaveType}
              onChange={(e) => setForm({ ...form, leaveType: e.target.value as any })}
              className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-sm text-gray-900 focus:border-[#6F3C68] focus:ring-2 focus:ring-[#6F3C68]/20 outline-none"
            >
              <option value="Paid">Paid Leave ({leaveBalance.paid} days remaining)</option>
              <option value="Sick">Sick Leave ({leaveBalance.sick} days remaining)</option>
              <option value="Unpaid">Unpaid Leave (Loss of Pay)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              required
            />
            <Input
              label="End Date"
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              required
            />
          </div>

          <div className="w-full flex flex-col gap-1.5 text-left">
            <label className="block text-xs font-semibold text-gray-700">Reason for Request</label>
            <textarea
              rows={3}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="e.g. Attending hackathon keynote and family commitments..."
              className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-sm text-gray-900 focus:border-[#6F3C68] focus:ring-2 focus:ring-[#6F3C68]/20 outline-none resize-none"
              required
            />
          </div>

          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {formError}
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
};
