import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import api from '../../api/axios.ts';
import { Button } from '../../components/common/Button.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

export const VerifyEmail: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const { showToast } = useToast();
  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function verify() {
      if (!token) {
        setStatus('error');
        setMessage('Missing email verification token.');
        return;
      }

      try {
        const res = await api.get(`/auth/verify-email/${token}`);
        setStatus('success');
        setMessage(res.data.message || 'Email verified successfully!');
        await refreshUser();
        showToast({
          title: 'Email Verified',
          message: 'Your account is now fully active.',
          variant: 'success',
        });
      } catch (err: any) {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Verification link is invalid or has expired.');
      }
    }

    verify();
  }, [token, refreshUser, showToast]);

  return (
    <div className="min-h-screen bg-[#FAF7FA] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto bg-white p-8 rounded-3xl border border-gray-200 shadow-xl text-center">
        {status === 'loading' && (
          <div className="py-8">
            <Loader2 className="w-10 h-10 text-[#4A1F45] animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900">Verifying Your Email...</h3>
            <p className="text-xs text-gray-500 mt-1">Please wait while we validate your credentials.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-4">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Email Successfully Verified!</h3>
            <p className="text-xs text-gray-600 mb-6 leading-relaxed">{message}</p>
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={() => navigate('/dashboard')}
            >
              Continue to Dayflow
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="py-4">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-200">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Verification Failed</h3>
            <p className="text-xs text-rose-600 mb-6 leading-relaxed">{message}</p>
            <div className="flex flex-col gap-2">
              <Button variant="primary" onClick={() => navigate('/dashboard')} className="w-full">
                Go to Workspace
              </Button>
              <Link to="/signin" className="text-xs text-[#4A1F45] font-semibold hover:underline mt-2">
                Back to Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
