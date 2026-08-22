import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Download,
  Eye,
  CheckCircle2,
  FileText,
  DollarSign,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import api from '../../api/axios.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { Button } from '../../components/common/Button.tsx';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import { StatCard } from '../../components/common/StatCard.tsx';
import { Modal } from '../../components/common/Modal.tsx';
import { DataTable, Column } from '../../components/common/DataTable.tsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.tsx';
import { PayrollRecord } from '../../types.ts';

export const MyPayroll: React.FC = () => {
  const { employee } = useAuth();
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [salaryStructure, setSalaryStructure] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSlip, setSelectedSlip] = useState<PayrollRecord | null>(null);

  const fetchPayroll = async () => {
    try {
      const res = await api.get('/payroll/me');
      setPayrolls(res.data.records || []);
      setSalaryStructure(res.data.salaryStructure || null);
    } catch (err) {
      console.error('Failed to load my payroll:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
  }, []);

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

  const basic = salaryStructure?.basic || 0;
  const hra = salaryStructure?.hra || 0;
  const special = salaryStructure?.specialAllowance || 0;
  const pf = salaryStructure?.pfDeduction || 0;
  const tax = salaryStructure?.taxDeduction || 0;
  const grossSalary = basic + hra + special;
  const totalDeductions = pf + tax;
  const netPay = grossSalary - totalDeductions;

  // Chart data
  const chartData = payrolls.slice(0, 6).reverse().map((p) => ({
    period: `${monthNames[p.month]?.substring(0, 3)} ${p.year}`,
    netPay: p.netSalary,
    basic: p.basicSalary,
  }));

  const columns: Column<PayrollRecord>[] = [
    {
      key: 'period',
      header: 'Pay Period',
      render: (item) => (
        <span className="font-semibold text-gray-900 flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-[#4A1F45]" />
          {monthNames[item.month]} {item.year}
        </span>
      ),
    },
    {
      key: 'gross',
      header: 'Gross Salary',
      render: (item) => (
        <span className="text-gray-700 text-xs font-mono">
          ₹{(item.basicSalary + item.allowances.hra + item.allowances.special).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'deductions',
      header: 'Total Deductions',
      render: (item) => (
        <span className="text-rose-600 text-xs font-mono">
          -₹{(item.deductions.pf + item.deductions.tax).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'netSalary',
      header: 'Net Disbursed',
      render: (item) => (
        <span className="font-bold text-gray-900 font-mono text-sm">
          ₹{item.netSalary.toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => <StatusBadge status={item.status} size="sm" />,
    },
    {
      key: 'action',
      header: 'Payslip',
      align: 'right',
      render: (item) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setSelectedSlip(item)}
          leftIcon={<Eye className="w-3.5 h-3.5" />}
          className="text-xs px-2.5 py-1"
        >
          View Slip
        </Button>
      ),
    },
  ];

  if (isLoading) {
    return <LoadingSpinner message="Retrieving salary statements..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Payroll & Compensation</h1>
          <p className="text-xs text-gray-500 mt-1">
            Detailed monthly compensation breakdown, tax declarations, and generated salary slips.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-[#F5EEF4] text-[#4A1F45] text-xs font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#6F3C68]" />
            Direct Deposit Configured
          </span>
        </div>
      </div>

      {/* Salary Structure Breakdown Bento */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-gray-200 shadow-xs">
          <h3 className="text-base font-bold text-gray-900 mb-1">Standard Monthly Compensation Structure</h3>
          <p className="text-xs text-gray-500 mb-6">Pre-configured CTC breakdown for {employee?.designation}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Earnings */}
            <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100 space-y-3">
              <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider block">
                Monthly Earnings (Gross: ₹{grossSalary.toLocaleString('en-IN')})
              </span>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-gray-700">
                  <span>Basic Salary</span>
                  <span className="font-mono font-semibold">₹{basic.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>House Rent Allowance (HRA)</span>
                  <span className="font-mono font-semibold">₹{hra.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Special Allowance</span>
                  <span className="font-mono font-semibold">₹{special.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div className="bg-rose-50/50 rounded-2xl p-4 border border-rose-100 space-y-3">
              <span className="text-xs font-bold text-rose-900 uppercase tracking-wider block">
                Statutory Deductions (Total: ₹{totalDeductions.toLocaleString('en-IN')})
              </span>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-gray-700">
                  <span>Provident Fund (PF)</span>
                  <span className="font-mono font-semibold text-rose-700">-₹{pf.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Income Tax (TDS)</span>
                  <span className="font-mono font-semibold text-rose-700">-₹{tax.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Estimated Monthly Net Pay</span>
            <span className="text-xl font-bold font-mono text-[#4A1F45]">
              ₹{netPay.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Chart Column */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-1">Disbursement History</h3>
            <p className="text-xs text-gray-500 mb-4">Past monthly net pay trend</p>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#6B7280' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} />
                  <Tooltip
                    formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Net Disbursed']}
                    contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Bar dataKey="netPay" fill="#4A1F45" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="text-[11px] text-gray-400 pt-3 border-t border-gray-100">
            Read-only verified payroll statements.
          </div>
        </div>
      </div>

      {/* Payslips Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">Generated Payslip Archive</h3>
          <span className="text-xs text-gray-500">{payrolls.length} payslips available</span>
        </div>

        <DataTable
          columns={columns}
          data={payrolls}
          keyExtractor={(item) => item._id}
          emptyTitle="No payslips generated yet"
          emptyDescription="Your monthly payslips will appear here once finalized by HR."
        />
      </div>

      {/* Itemized Payslip Modal */}
      {selectedSlip && (
        <Modal
          isOpen={!!selectedSlip}
          onClose={() => setSelectedSlip(null)}
          title={`Salary Slip — ${monthNames[selectedSlip.month]} ${selectedSlip.year}`}
          subtitle={`Dayflow HRMS • Employee ID: ${employee?.employeeCode}`}
          maxWidth="lg"
          footer={
            <Button
              variant="primary"
              size="sm"
              onClick={() => window.print()}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Print / Save PDF
            </Button>
          }
        >
          <div className="space-y-6 text-sm">
            {/* Header info */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 text-xs">
              <div>
                <p className="text-gray-500">Employee Name</p>
                <p className="font-bold text-gray-900">{employee?.firstName} {employee?.lastName}</p>
                <p className="text-gray-500 mt-2">Designation</p>
                <p className="font-semibold text-gray-800">{employee?.designation}</p>
              </div>
              <div>
                <p className="text-gray-500">Department</p>
                <p className="font-bold text-gray-900">{employee?.department}</p>
                <p className="text-gray-500 mt-2">Payment Status</p>
                <StatusBadge status={selectedSlip.status} size="sm" />
              </div>
            </div>

            {/* Breakdown table */}
            <div className="border border-gray-200 rounded-2xl overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-100/80 font-bold text-gray-700 border-b border-gray-200">
                    <th className="p-3 text-left">Earnings</th>
                    <th className="p-3 text-right">Amount (₹)</th>
                    <th className="p-3 text-left border-l border-gray-200">Deductions</th>
                    <th className="p-3 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono">
                  <tr>
                    <td className="p-3 text-gray-800 font-sans">Basic Salary</td>
                    <td className="p-3 text-right">₹{selectedSlip.basicSalary.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-gray-800 font-sans border-l border-gray-200">Provident Fund (PF)</td>
                    <td className="p-3 text-right text-rose-600">₹{selectedSlip.deductions.pf.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-gray-800 font-sans">House Rent Allowance (HRA)</td>
                    <td className="p-3 text-right">₹{selectedSlip.allowances.hra.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-gray-800 font-sans border-l border-gray-200">Tax Deducted at Source (TDS)</td>
                    <td className="p-3 text-right text-rose-600">₹{selectedSlip.deductions.tax.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-gray-800 font-sans">Special Allowance</td>
                    <td className="p-3 text-right">₹{selectedSlip.allowances.special.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-gray-800 font-sans border-l border-gray-200">—</td>
                    <td className="p-3 text-right text-gray-400">—</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-bold text-gray-900 border-t border-gray-200">
                    <td className="p-3">Gross Earnings</td>
                    <td className="p-3 text-right font-mono">
                      ₹{(selectedSlip.basicSalary + selectedSlip.allowances.hra + selectedSlip.allowances.special).toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 border-l border-gray-200">Total Deductions</td>
                    <td className="p-3 text-right font-mono text-rose-600">
                      ₹{(selectedSlip.deductions.pf + selectedSlip.deductions.tax).toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Net Amount Box */}
            <div className="p-4 rounded-2xl bg-[#F5EEF4] border border-[#6F3C68]/30 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#4A1F45] uppercase tracking-wider">Net Payable Amount</p>
                <p className="text-[11px] text-gray-600">Disbursed via automated bank ACH transfer</p>
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
