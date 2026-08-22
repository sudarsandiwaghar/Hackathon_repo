import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Building2, Briefcase, Phone, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { Button } from '../../components/common/Button.tsx';
import { Input } from '../../components/common/Input.tsx';

export const SignUp: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: 'Engineering',
    designation: 'Associate Engineer',
    password: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [registeredResult, setRegisteredResult] = useState<{
    user: any;
    verificationUrl?: string;
  } | null>(null);

  const { signup } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setError('Please fill in all mandatory fields.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const result = await signup(formData);
      setRegisteredResult(result);
      showToast({
        title: 'Account Created',
        message: 'Your profile has been created. Please complete email verification.',
        variant: 'success',
      });
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Registration failed. Please try again.';
      setError(msg);
      showToast({ title: 'Registration Failed', message: msg, variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  if (registeredResult) {
    return (
      <div className="min-h-screen bg-[#FAF7FA] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full mx-auto bg-white p-8 rounded-3xl border border-gray-200 shadow-xl text-center">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-200">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Check Your Email</h3>
          <p className="text-xs text-gray-600 mb-6 leading-relaxed">
            We have registered your account for <strong className="text-gray-900">{formData.email}</strong>. In production, a verification link is dispatched to your inbox.
          </p>

          <div className="p-4 rounded-2xl bg-[#F5EEF4] border border-[#6F3C68]/20 text-left mb-6">
            <p className="text-xs font-bold text-[#4A1F45] mb-1">Hackathon Direct Verification Link:</p>
            <Link
              to={registeredResult.verificationUrl || `/verify-email/demo-token`}
              className="text-xs text-[#6F3C68] hover:underline font-mono break-all"
            >
              {window.location.origin}{registeredResult.verificationUrl}
            </Link>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              variant="primary"
              onClick={() => navigate(registeredResult.verificationUrl || '/dashboard')}
              className="w-full"
            >
              Proceed to Verification
            </Button>
            <Button variant="outline" onClick={() => navigate('/dashboard')} className="w-full">
              Skip to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7FA] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#4A1F45] text-white font-bold text-xl shadow-md mb-3">
            DF
          </div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Join Dayflow HRMS</h2>
          <p className="text-xs text-gray-500 mt-1">Create your employee profile and get onboarded.</p>
        </div>

        <div className="bg-white py-8 px-6 sm:px-8 shadow-xl rounded-3xl border border-gray-200/80">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="First Name"
                name="firstName"
                placeholder="Alex"
                value={formData.firstName}
                onChange={handleChange}
                leftIcon={<User className="w-4 h-4" />}
                required
              />
              <Input
                label="Last Name"
                name="lastName"
                placeholder="Chen"
                value={formData.lastName}
                onChange={handleChange}
                leftIcon={<User className="w-4 h-4" />}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Work Email"
                type="email"
                name="email"
                placeholder="alex.chen@dayflow.com"
                value={formData.email}
                onChange={handleChange}
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />
              <Input
                label="Contact Phone"
                name="phone"
                placeholder="+91 98000 12345"
                value={formData.phone}
                onChange={handleChange}
                leftIcon={<Phone className="w-4 h-4" />}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="w-full flex flex-col gap-1.5 text-left">
                <label className="block text-xs font-semibold text-gray-700">Department</label>
                <div className="relative">
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:border-[#6F3C68] focus:ring-2 focus:ring-[#6F3C68]/20 outline-none"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Product">Product</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Finance">Finance</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>
              </div>

              <Input
                label="Designation"
                name="designation"
                placeholder="Software Engineer"
                value={formData.designation}
                onChange={handleChange}
                leftIcon={<Briefcase className="w-4 h-4" />}
                required
              />
            </div>

            <Input
              label="Account Password"
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-4"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Complete Registration
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-gray-500">
            Already have an account?{' '}
            <Link to="/signin" className="font-semibold text-[#4A1F45] hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
