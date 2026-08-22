import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Edit2,
  CheckCircle2,
  UserCheck,
} from 'lucide-react';
import api from '../../api/axios.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { Button } from '../../components/common/Button.tsx';
import { Input } from '../../components/common/Input.tsx';
import { Modal } from '../../components/common/Modal.tsx';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import { DataTable, Column } from '../../components/common/DataTable.tsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.tsx';
import { Employee } from '../../types.ts';

export const EmployeeDirectory: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isAdmin = user?.role === 'admin';

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');

  // Admin Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // New Employee Form state
  const [newEmpForm, setNewEmpForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: 'Engineering' as const,
    designation: '',
    joiningDate: new Date().toISOString().split('T')[0],
    basicSalary: 65000,
  });

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees');
      setEmployees(res.data || []);
    } catch (err) {
      console.error('Failed to load employee directory:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.post('/employees', {
        firstName: newEmpForm.firstName,
        lastName: newEmpForm.lastName,
        email: newEmpForm.email,
        phone: newEmpForm.phone,
        department: newEmpForm.department,
        designation: newEmpForm.designation,
        joiningDate: newEmpForm.joiningDate,
        salary: {
          basic: Number(newEmpForm.basicSalary),
          hra: Math.round(Number(newEmpForm.basicSalary) * 0.4),
          specialAllowance: Math.round(Number(newEmpForm.basicSalary) * 0.25),
          pfDeduction: Math.round(Number(newEmpForm.basicSalary) * 0.12),
          taxDeduction: Math.round(Number(newEmpForm.basicSalary) * 0.1),
        },
      });
      showToast({ title: 'Employee Added', message: 'New employee registered successfully.', variant: 'success' });
      setIsAddModalOpen(false);
      fetchEmployees();
    } catch (err: any) {
      showToast({
        title: 'Creation Failed',
        message: err.response?.data?.error || 'Failed to add employee.',
        variant: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmp) return;
    setIsSaving(true);
    try {
      await api.put(`/employees/${editingEmp._id}`, editingEmp);
      showToast({ title: 'Updated', message: 'Employee record successfully updated.', variant: 'success' });
      setIsEditModalOpen(false);
      fetchEmployees();
    } catch (err: any) {
      showToast({
        title: 'Update Failed',
        message: err.response?.data?.error || 'Could not update record.',
        variant: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const departments = ['all', 'Engineering', 'Product', 'Marketing', 'Finance', 'Human Resources', 'Operations'];

  const filteredEmployees = employees.filter((emp) => {
    if (selectedDept !== 'all' && emp.department !== selectedDept) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(q);
      const matchEmail = emp.email.toLowerCase().includes(q);
      const matchCode = emp.employeeCode.toLowerCase().includes(q);
      const matchDesig = emp.designation.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchCode && !matchDesig) return false;
    }
    return true;
  });

  const columns: Column<Employee>[] = [
    {
      key: 'employee',
      header: 'Employee Details',
      render: (item) => (
        <div className="flex items-center gap-3">
          <img
            src={
              item.photo ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                item.firstName + ' ' + item.lastName
              )}&background=4A1F45&color=fff`
            }
            alt={item.firstName}
            className="w-10 h-10 rounded-xl object-cover border border-gray-200"
          />
          <div>
            <span className="font-bold text-gray-900 leading-tight block">
              {item.firstName} {item.lastName}
            </span>
            <span className="text-[11px] font-mono text-gray-500">{item.employeeCode}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'department',
      header: 'Department & Role',
      render: (item) => (
        <div>
          <span className="font-semibold text-gray-800 text-xs block">{item.designation}</span>
          <span className="text-[11px] text-gray-500">{item.department}</span>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact Info',
      render: (item) => (
        <div className="text-xs space-y-0.5">
          <div className="flex items-center gap-1.5 text-gray-700">
            <Mail className="w-3.5 h-3.5 text-gray-400" />
            <span>{item.email}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-500">
            <Phone className="w-3.5 h-3.5 text-gray-400" />
            <span>{item.phone}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => <StatusBadge status={item.status} size="sm" />,
    },
    ...(isAdmin
      ? [
          {
            key: 'salary',
            header: 'Base CTC',
            render: (item: Employee) => (
              <span className="font-mono text-xs font-semibold text-gray-900">
                ₹{item.salary ? (item.salary.basic * 12).toLocaleString('en-IN') + '/yr' : '—'}
              </span>
            ),
          },
          {
            key: 'actions',
            header: 'Actions',
            align: 'right' as const,
            render: (item: Employee) => (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditingEmp(item);
                  setIsEditModalOpen(true);
                }}
                leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                className="text-xs text-gray-700"
              >
                Edit
              </Button>
            ),
          },
        ]
      : []),
  ];

  if (isLoading) {
    return <LoadingSpinner message="Loading employee directory..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Employee Directory</h1>
          <p className="text-xs text-gray-500 mt-1">
            {isAdmin
              ? 'Comprehensive administrative staff roster, role management, and compensation controls.'
              : 'Browse colleagues across engineering, product, marketing, finance, and operations.'}
          </p>
        </div>

        {isAdmin && (
          <Button
            variant="primary"
            size="lg"
            onClick={() => setIsAddModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add New Employee
          </Button>
        )}
      </div>

      {/* Search and Department Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Search */}
        <div className="w-full md:w-80">
          <Input
            placeholder="Search by name, role, ID, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        {/* Department Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedDept === dept
                  ? 'bg-[#4A1F45] text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {dept === 'all' ? 'All Departments' : dept}
            </button>
          ))}
        </div>
      </div>

      {/* Directory Table */}
      <div className="space-y-4">
        <DataTable
          columns={columns}
          data={filteredEmployees}
          keyExtractor={(item) => item._id}
          emptyTitle="No employees found"
          emptyDescription="No colleagues matched your search or department filter."
        />
      </div>

      {/* Admin Add Employee Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Onboard New Employee"
          subtitle="Add an employee profile and generate secure system credentials."
          maxWidth="lg"
          footer={
            <>
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleAddEmployee} isLoading={isSaving}>
                Save & Onboard
              </Button>
            </>
          }
        >
          <form onSubmit={handleAddEmployee} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                value={newEmpForm.firstName}
                onChange={(e) => setNewEmpForm({ ...newEmpForm, firstName: e.target.value })}
                required
              />
              <Input
                label="Last Name"
                value={newEmpForm.lastName}
                onChange={(e) => setNewEmpForm({ ...newEmpForm, lastName: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Work Email"
                type="email"
                value={newEmpForm.email}
                onChange={(e) => setNewEmpForm({ ...newEmpForm, email: e.target.value })}
                required
              />
              <Input
                label="Phone Number"
                value={newEmpForm.phone}
                onChange={(e) => setNewEmpForm({ ...newEmpForm, phone: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="w-full flex flex-col gap-1.5 text-left">
                <label className="block text-xs font-semibold text-gray-700">Department</label>
                <select
                  value={newEmpForm.department}
                  onChange={(e) => setNewEmpForm({ ...newEmpForm, department: e.target.value as any })}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-sm text-gray-900 focus:border-[#6F3C68] focus:ring-2 focus:ring-[#6F3C68]/20 outline-none"
                >
                  {departments
                    .filter((d) => d !== 'all')
                    .map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                </select>
              </div>
              <Input
                label="Designation"
                value={newEmpForm.designation}
                onChange={(e) => setNewEmpForm({ ...newEmpForm, designation: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Joining Date"
                type="date"
                value={newEmpForm.joiningDate}
                onChange={(e) => setNewEmpForm({ ...newEmpForm, joiningDate: e.target.value })}
                required
              />
              <Input
                label="Monthly Basic Salary (₹)"
                type="number"
                value={newEmpForm.basicSalary}
                onChange={(e) => setNewEmpForm({ ...newEmpForm, basicSalary: Number(e.target.value) })}
                required
              />
            </div>
          </form>
        </Modal>
      )}

      {/* Admin Edit Employee Modal */}
      {isEditModalOpen && editingEmp && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Edit Employee — ${editingEmp.firstName} ${editingEmp.lastName}`}
          subtitle={`Employee Code: ${editingEmp.employeeCode}`}
          maxWidth="lg"
          footer={
            <>
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleUpdateEmployee} isLoading={isSaving}>
                Save Changes
              </Button>
            </>
          }
        >
          <form onSubmit={handleUpdateEmployee} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                value={editingEmp.firstName}
                onChange={(e) => setEditingEmp({ ...editingEmp, firstName: e.target.value })}
                required
              />
              <Input
                label="Last Name"
                value={editingEmp.lastName}
                onChange={(e) => setEditingEmp({ ...editingEmp, lastName: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Phone"
                value={editingEmp.phone}
                onChange={(e) => setEditingEmp({ ...editingEmp, phone: e.target.value })}
              />
              <div className="w-full flex flex-col gap-1.5 text-left">
                <label className="block text-xs font-semibold text-gray-700">Status</label>
                <select
                  value={editingEmp.status}
                  onChange={(e) => setEditingEmp({ ...editingEmp, status: e.target.value as any })}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-sm text-gray-900 focus:border-[#6F3C68] outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="w-full flex flex-col gap-1.5 text-left">
                <label className="block text-xs font-semibold text-gray-700">Department</label>
                <select
                  value={editingEmp.department}
                  onChange={(e) => setEditingEmp({ ...editingEmp, department: e.target.value as any })}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-sm text-gray-900 focus:border-[#6F3C68] outline-none"
                >
                  {departments
                    .filter((d) => d !== 'all')
                    .map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                </select>
              </div>
              <Input
                label="Designation"
                value={editingEmp.designation}
                onChange={(e) => setEditingEmp({ ...editingEmp, designation: e.target.value })}
                required
              />
            </div>
            {editingEmp.salary && (
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200">
                <p className="text-xs font-bold text-gray-800 mb-2">Compensation Structure</p>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Basic (₹/mo)"
                    type="number"
                    value={editingEmp.salary.basic}
                    onChange={(e) =>
                      setEditingEmp({
                        ...editingEmp,
                        salary: { ...editingEmp.salary!, basic: Number(e.target.value) },
                      })
                    }
                  />
                  <Input
                    label="Special Allowance (₹/mo)"
                    type="number"
                    value={editingEmp.salary.specialAllowance}
                    onChange={(e) =>
                      setEditingEmp({
                        ...editingEmp,
                        salary: { ...editingEmp.salary!, specialAllowance: Number(e.target.value) },
                      })
                    }
                  />
                </div>
              </div>
            )}
          </form>
        </Modal>
      )}
    </div>
  );
};
