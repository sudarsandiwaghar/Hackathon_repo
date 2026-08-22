import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Play,
  CheckCircle2,
  Calendar,
  DollarSign,
  Download,
  Eye,
  FileText,
  Building2,
  Users,
} from 'lucide-react';
import api from '../../api/axios.ts';
import { useToast } from '../../context/ToastContext.tsx';
import { Button } from '../../components/common/Button.tsx';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import { StatCard } from '../../components/common/StatCard.tsx';
import { Modal } from '../../components/common/Modal.tsx';
import { DataTable, Column } from '../../components/common/DataTable.tsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.tsx';
import { PayrollRecord, Employee } from '../../types.ts';

export const AdminPayroll: React.FC = () => {
  const { showToast } = useToast();
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Run Payroll Form Modal
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const [targetMonth, setTargetMonth] = useState(new Date().getMonth() + 1);
  const [targetYear, setTargetYear] = useState(new Date().getFullYear());
  const [isRunning, setIsRunning] = useState(false);

  // Slip preview modal
  const [selectedSlip, setSelectedSlip] = useState<PayrollRecord | null>(null);

  const fetchPayrollData = async () => {
    try {
      const [payRes, empRes] = await Promise.all([api.get('/payroll'), api.get('/employees')]);
      const records = payRes.data?.records || (Array.isArray(payRes.data) ? payRes.data : []);
      setPayrolls(records);
      setEmployees(Array.isArray(empRes.data) ? empRes.data : []);
    } catch (err) {
      console.error('Failed to load admin payroll:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrollData();
  }, []);

  const empMap = new Map<string, Employee>();
  employees.forEach((e) => empMap.set(e._id, e));

  const monthNames = [
    '',
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const handleGeneratePayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRunning(true);
    try {
      const res = await api.post('/payroll/generate', {
        month: Number(targetMonth),
        year: Number(targetYear),
      });
      const processedCount = res.data.generatedCount ?? res.data.count ?? 0;
      showToast({
        title: 'Payroll Generated',
        message: `Processed ${processedCount} employee pay statements for ${monthNames[targetMonth]} ${targetYear}.`,
        variant: 'success',
      });
      setIsRunModalOpen(false);
      fetchPayrollData();
    } catch (err: any) {
      showToast({
        title: 'Generation Failed',
        message: err.response?.data?.error || 'Unable to generate pay cycle.',
        variant: 'error',
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: 'Draft' | 'Processed' | 'Paid') => {
    try {
      await api.put(`/payroll/${id}/status`, { status });
      showToast({
        title: 'Status Updated',
        message: `Payroll record marked as ${status}.`,
        variant: 'success',
      });
      fetchPayrollData();
    } catch (err: any) {
      showToast({
        title: 'Update Failed',
        message: err.response?.data?.error || 'Unable to update status.',
        variant: 'error',
      });
    }
  };

  const totalDisbursed = payrolls.reduce((acc, p) => acc + p.netSalary, 0);
  const totalTaxDeductions = payrolls.reduce((acc, p) => acc + (p.deductions.tax || 0), 0);
  const totalPF = payrolls.reduce((acc, p) => acc + (p.deductions.pf || 0), 0);

  const columns: Column<PayrollRecord>[] = [
    {
      key: 'employee',
      header: 'Employee Details',
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
      key: 'period',
      header: 'Cycle',
      render: (item) => (
        <span className="font-semibold text-xs text-gray-800">
          {monthNames[item.month]} {item.year}
        </span>
      ),
    },
    {
      key: 'gross',
      header: 'Gross Salary',
      render: (item) => (
        <span className="text-xs font-mono text-gray-700">
          ₹{(item.basicSalary + item.allowances.hra + item.allowances.special).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'deductions',
      header: 'Deductions (PF+Tax)',
      render: (item) => (
        <span className="text-xs font-mono text-rose-600">
          -₹{(item.deductions.pf + item.deductions.tax).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'netSalary',
      header: 'Net Payable',
      render: (item) => (
        <span className="font-bold font-mono text-sm text-gray-900">
          ₹{item.netSalary.toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Disbursement Status',
      render: (item) => (
        <select
          value={item.status}
          onChange={(e) => handleUpdateStatus(item._id, e.target.value as any)}
          className="text-xs font-semibold bg-white border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-[#4A1F45]"
        >
          <option value="Draft">Draft</option>
          <option value="Processed">Processed</option>
          <option value="Paid">Paid</option>
        </select>
      ),
    },
    {
      key: 'actions',
      header: 'Slip',
      align: 'right',
      render: (item) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setSelectedSlip(item)}
          leftIcon={<Eye className="w-3.5 h-3.5" />}
          className="text-xs px-2.5 py-1"
        >
          View
        </Button>
      ),
    },
  ];

  if (isLoading) {
    return <LoadingSpinner message="Calculating company payroll statements..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Payroll Operations</h1>
          <p className="text-xs text-gray-500 mt-1">
            Execute monthly compensation runs, declare tax deductions, and publish employee salary slips.
          </p>
        </div>

        <Button
          variant="primary"
          size="lg"
          onClick={() => setIsRunModalOpen(true)}
          leftIcon={<Play className="w-4 h-4" />}
        >
          Generate Pay Cycle
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Net Disbursed"
          value={`₹${totalDisbursed.toLocaleString('en-IN')}`}
          subtitle="All generated pay runs"
          icon={<CreditCard className="w-5 h-5" />}
          accentColor="#4A1F45"
        />
        <StatCard
          title="Total Income Tax (TDS)"
          value={`₹${totalTaxDeductions.toLocaleString('en-IN')}`}
          subtitle="Tax remitted to govt"
          icon={<DollarSign className="w-5 h-5" />}
          accentColor="#D97706"
        />
        <StatCard
          title="Provident Fund (PF)"
          value={`₹${totalPF.toLocaleString('en-IN')}`}
          subtitle="Retirement corpus funds"
          icon={<Building2 className="w-5 h-5" />}
          accentColor="#059669"
        />
      </div>

      {/* Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">Compensation Records</h3>
          <span className="text-xs text-gray-500">{payrolls.length} statements generated</span>
        </div>

        <DataTable
          columns={columns}
          data={payrolls}
          keyExtractor={(item) => item._id}
          emptyTitle="No payroll records generated yet"
          emptyDescription="Click 'Generate Pay Cycle' to process salary calculations for all active employees."
        />
      </div>

      {/* Generate Pay Cycle Modal */}
      {isRunModalOpen && (
        <Modal
          isOpen={isRunModalOpen}
          onClose={() => setIsRunModalOpen(false)}
          title="Generate Monthly Pay Cycle"
          subtitle="Automatically calculates CTC earnings, PF, and tax deductions for all active staff."
          footer={
            <>
              <Button variant="outline" onClick={() => setIsRunModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleGeneratePayroll} isLoading={isRunning}>
                Execute Payroll
              </Button>
            </>
          }
        >
          <form onSubmit={handleGeneratePayroll} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="w-full flex flex-col gap-1.5 text-left">
                <label className="block text-xs font-semibold text-gray-700">Month</label>
                <select
                  value={targetMonth}
                  onChange={(e) => setTargetMonth(Number(e.target.value))}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-sm text-gray-900 focus:border-[#6F3C68] outline-none"
                >
                  {monthNames.map(
                    (name, idx) =>
                      idx > 0 && (
                        <option key={idx} value={idx}>
                          {name}
                        </option>
                      )
                  )}
                </select>
              </div>

              <div className="w-full flex flex-col gap-1.5 text-left">
                <label className="block text-xs font-semibold text-gray-700">Year</label>
                <select
                  value={targetYear}
                  onChange={(e) => setTargetYear(Number(e.target.value))}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-sm text-gray-900 focus:border-[#6F3C68] outline-none"
                >
                  <option value={2026}>2026</option>
                  <option value={2025}>2025</option>
                </select>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
              <Building2 className="w-5 h-5 flex-shrink-0 text-amber-600" />
              <span>
                This will batch generate itemized salary records for <strong>{employees.length} active employees</strong>.
              </span>
            </div>
          </form>
        </Modal>
      )}

      {/* Payslip View Modal */}
      {selectedSlip && (
        <Modal
          isOpen={!!selectedSlip}
          onClose={() => setSelectedSlip(null)}
          title={`Administrative Payslip Audit — ${monthNames[selectedSlip.month]} ${selectedSlip.year}`}
          subtitle={`Employee: ${empMap.get(selectedSlip.employeeId)?.firstName} ${
            empMap.get(selectedSlip.employeeId)?.lastName
          } (${empMap.get(selectedSlip.employeeId)?.employeeCode})`}
          maxWidth="lg"
          footer={
            <Button
              variant="primary"
              size="sm"
              onClick={() => window.print()}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Print Statement
            </Button>
          }
        >
          <div className="space-y-6 text-sm">
            <div className="border border-gray-200 rounded-2xl overflow-hidden text-xs">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 font-bold text-gray-700 border-b border-gray-200">
                    <th className="p-3 text-left">Earnings</th>
                    <th className="p-3 text-right">Amount (₹)</th>
                    <th className="p-3 text-left border-l border-gray-200">Deductions</th>
                    <th className="p-3 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono">
                  <tr>
                    <td className="p-3 text-gray-800 font-sans">Basic</td>
                    <td className="p-3 text-right">₹{selectedSlip.basicSalary.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-gray-800 font-sans border-l border-gray-200">PF</td>
                    <td className="p-3 text-right text-rose-600">₹{selectedSlip.deductions.pf.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-gray-800 font-sans">HRA</td>
                    <td className="p-3 text-right">₹{selectedSlip.allowances.hra.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-gray-800 font-sans border-l border-gray-200">Tax (TDS)</td>
                    <td className="p-3 text-right text-rose-600">₹{selectedSlip.deductions.tax.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-gray-800 font-sans">Special Allowance</td>
                    <td className="p-3 text-right">₹{selectedSlip.allowances.special.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-gray-800 font-sans border-l border-gray-200">—</td>
                    <td className="p-3 text-right text-gray-400">—</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-4 rounded-2xl bg-[#F5EEF4] border border-[#6F3C68]/30 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#4A1F45]">Net Disbursed Amount</p>
                <p className="text-[11px] text-gray-600">Calculated after statutory tax and PF deductions</p>
              </div>
              <p className="text-2xl font-bold font-mono text-[#4A1F45]">
                ₹{selectedSlip.netSalary.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
