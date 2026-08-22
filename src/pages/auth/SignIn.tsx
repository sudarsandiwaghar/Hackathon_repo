import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, User, Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { Button } from '../../components/common/Button.tsx';
import { Input } from '../../components/common/Input.tsx';

export const SignIn: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const res = await login(email, password);
      showToast({
        title: `Welcome, ${res.employee?.firstName || 'User'}!`,
        message: 'Successfully logged in to Dayflow HRMS.',
        variant: 'success',
      });
      if (res.user.role === 'admin' && from === '/dashboard') {
        navigate('/admin/dashboard');
      } else {
        navigate(from);
      }
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Invalid email or password.';
      setError(errorMsg);
      showToast({
        title: 'Sign In Failed',
        message: errorMsg,
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#FAF7FA] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4A1F45] to-[#351532] shadow-lg mb-4 text-white font-bold text-2xl tracking-wider">
          DF
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Dayflow HRMS
        </h2>
        <p className="mt-1 text-sm text-gray-500 font-medium">
          "Every workday, perfectly aligned."
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl rounded-3xl border border-gray-200/80">
          {/* Hackathon 1-Click Demo Buttons */}
          <div className="mb-6 p-3.5 rounded-2xl bg-[#F5EEF4]/70 border border-[#A77BA3]/30">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#4A1F45] uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>1-Click Hackathon Credentials</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('hr@dayflow.com', 'Admin@123')}
                className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold bg-white text-gray-800 border border-gray-200 hover:border-[#6F3C68] hover:bg-[#F5EEF4] transition-all shadow-2xs text-left"
              >
                <Shield className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                <span className="truncate">HR Admin</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('alex.chen@dayflow.com', 'Employee@123')}
                className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold bg-white text-gray-800 border border-gray-200 hover:border-[#6F3C68] hover:bg-[#F5EEF4] transition-all shadow-2xs text-left"
              >
                <User className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span className="truncate">Employee (Alex)</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Work Email"
              type="email"
              placeholder="alex.chen@dayflow.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              className="w-full mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to Workspace
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-gray-500">
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-[#4A1F45] hover:underline">
              Create employee account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
