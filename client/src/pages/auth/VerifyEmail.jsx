import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import api from '../../api/axios';
import './Auth.css';

const VerifyEmail = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await api.get(`/auth/verify-email/${token}`);
        setStatus('success');
        setMessage(response.data.message || 'Email verified successfully!');
      } catch (err) {
        setStatus('error');
        setMessage(
          err.response?.data?.message ||
            'Verification failed. The link may be invalid or expired.'
        );
      }
    };

    if (token) {
      verifyEmail();
    } else {
      setStatus('error');
      setMessage('No verification token provided.');
    }
  }, [token]);

  const iconMap = {
    loading: (
      <div className="verify-icon verify-icon-loading">
        <Loader size={36} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    ),
    success: (
      <div className="verify-icon verify-icon-success">
        <CheckCircle size={36} />
      </div>
    ),
    error: (
      <div className="verify-icon verify-icon-error">
        <XCircle size={36} />
      </div>
    ),
  };

  const titleMap = {
    loading: 'Verifying your email...',
    success: 'Email Verified!',
    error: 'Verification Failed',
  };

  return (
    <div className="verify-page">
      <div className="card verify-card">
        {iconMap[status]}
        <h2>{titleMap[status]}</h2>
        <p>{message || 'Please wait while we verify your email address.'}</p>

        {status === 'success' && (
          <Link to="/signin" className="btn btn-primary btn-full">
            Continue to Sign In
          </Link>
        )}

        {status === 'error' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Link to="/signin" className="btn btn-primary btn-full">
              Back to Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
