import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, LogIn, Shield, Users, BarChart3, Clock } from 'lucide-react';
import './Auth.css';

const SignIn = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signin, error, clearError } = useAuth();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const from = location.state?.from?.pathname || '/dashboard';

  const validateForm = () => {
    const errors = {};
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }
    if (!formData.password) {
      errors.password = 'Password is required';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (error) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    const result = await signin(formData.email, formData.password);
    setLoading(false);

    if (result.success) {
      // Redirect based on role
      if (result.user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    }
  };

  return (
    <div className="auth-page">
      {/* ─── Left Panel: Brand Hero ─── */}
      <div className="auth-hero">
        <div className="auth-hero-content">
          <div className="auth-logo">
            <div className="auth-logo-icon">
              <Clock size={24} color="white" />
            </div>
            <span className="auth-logo-text">Dayflow</span>
          </div>

          <h1>Every workday, perfectly aligned.</h1>
          <p>
            Streamline your HR operations with a platform built for modern teams.
          </p>

          <div className="auth-features">
            <div className="auth-feature-item">
              <div className="auth-feature-icon">
                <Users size={18} />
              </div>
              <span>Complete employee management & directory</span>
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-icon">
                <Clock size={18} />
              </div>
              <span>Attendance tracking with smart insights</span>
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-icon">
                <Shield size={18} />
              </div>
              <span>Leave management with approval workflows</span>
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-icon">
                <BarChart3 size={18} />
              </div>
              <span>Payroll processing & analytics</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Right Panel: Form ─── */}
      <div className="auth-form-panel">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h2>Welcome back</h2>
            <p>Sign in to your Dayflow account to continue</p>
          </div>

          {error && (
            <div className="auth-alert auth-alert-error" role="alert">
              <span>{error}</span>
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="signin-email">
                Email address
              </label>
              <input
                id="signin-email"
                type="email"
                name="email"
                className={`form-input ${fieldErrors.email ? 'input-error' : ''}`}
                placeholder="you@company.com"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                autoFocus
              />
              {fieldErrors.email && (
                <span className="form-error">{fieldErrors.email}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="signin-password">
                Password
              </label>
              <div className="password-input-wrapper">
                <input
                  id="signin-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className={`form-input ${fieldErrors.password ? 'input-error' : ''}`}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {fieldErrors.password && (
                <span className="form-error">{fieldErrors.password}</span>
              )}
            </div>

            <button
              type="submit"
              className={`btn btn-primary btn-full ${loading ? 'btn-loading' : ''}`}
              disabled={loading}
            >
              {loading && <span className="btn-spinner" />}
              <span className="btn-text">
                <LogIn size={18} />
                Sign In
              </span>
            </button>
          </form>

          <div className="auth-footer">
            Don't have an account?{' '}
            <Link to="/signup">Create one</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
