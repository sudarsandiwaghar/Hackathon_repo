import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Eye,
  EyeOff,
  UserPlus,
  Clock,
  CheckCircle,
  Users,
  Shield,
  BarChart3,
} from 'lucide-react';
import './Auth.css';

const SignUp = () => {
  const navigate = useNavigate();
  const { signup, error, clearError } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: 'Engineering',
    designation: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [successInfo, setSuccessInfo] = useState(null);

  const validateForm = () => {
    const errors = {};

    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Must be at least 8 characters';
    } else if (!/[A-Z]/.test(formData.password)) {
      errors.password = 'Must contain an uppercase letter';
    } else if (!/[0-9]/.test(formData.password)) {
      errors.password = 'Must contain a number';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
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
    const result = await signup({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
      department: formData.department,
      designation: formData.designation || 'Employee',
    });
    setLoading(false);

    if (result.success) {
      setSuccessInfo({
        verificationUrl: result.verificationUrl,
        email: formData.email,
      });
    }
  };

  // ─── Success: "Verify your email" state ─────────────────
  if (successInfo) {
    return (
      <div className="verify-page">
        <div className="card verify-card">
          <div className="verify-icon verify-icon-success">
            <CheckCircle size={36} />
          </div>
          <h2>Check your email</h2>
          <p>
            We've sent a verification link to{' '}
            <strong>{successInfo.email}</strong>. Please verify your email
            to access all features.
          </p>

          <div className="auth-alert auth-alert-info" style={{ textAlign: 'left', marginBottom: 'var(--space-6)' }}>
            <span>
              <strong>Dev mode:</strong> Since email sending is not wired yet,
              use this link to verify:
              <br />
              <code style={{ fontSize: '11px', wordBreak: 'break-all' }}>
                {successInfo.verificationUrl}
              </code>
            </span>
          </div>

          <button
            className="btn btn-primary btn-full"
            onClick={() => navigate('/dashboard')}
          >
            Continue to Dashboard
          </button>

          <div className="auth-footer">
            <Link to="/signin">Back to Sign In</Link>
          </div>
        </div>
      </div>
    );
  }

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

          <h1>Start your journey with Dayflow</h1>
          <p>Join thousands of teams managing HR effortlessly.</p>

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
            <h2>Create your account</h2>
            <p>Fill in your details to get started with Dayflow</p>
          </div>

          {error && (
            <div className="auth-alert auth-alert-error" role="alert">
              <span>{error}</span>
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="signup-firstname">
                  First name
                </label>
                <input
                  id="signup-firstname"
                  type="text"
                  name="firstName"
                  className={`form-input ${fieldErrors.firstName ? 'input-error' : ''}`}
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleChange}
                  autoFocus
                />
                {fieldErrors.firstName && (
                  <span className="form-error">{fieldErrors.firstName}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="signup-lastname">
                  Last name
                </label>
                <input
                  id="signup-lastname"
                  type="text"
                  name="lastName"
                  className={`form-input ${fieldErrors.lastName ? 'input-error' : ''}`}
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleChange}
                />
                {fieldErrors.lastName && (
                  <span className="form-error">{fieldErrors.lastName}</span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="signup-email">
                Email address
              </label>
              <input
                id="signup-email"
                type="email"
                name="email"
                className={`form-input ${fieldErrors.email ? 'input-error' : ''}`}
                placeholder="you@company.com"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
              />
              {fieldErrors.email && (
                <span className="form-error">{fieldErrors.email}</span>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="signup-department">
                  Department
                </label>
                <select
                  id="signup-department"
                  name="department"
                  className="form-select"
                  value={formData.department}
                  onChange={handleChange}
                >
                  <option value="Engineering">Engineering</option>
                  <option value="HR">HR</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Finance">Finance</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="signup-designation">
                  Designation
                </label>
                <input
                  id="signup-designation"
                  type="text"
                  name="designation"
                  className="form-input"
                  placeholder="e.g. Developer"
                  value={formData.designation}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="signup-password">
                Password
              </label>
              <div className="password-input-wrapper">
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className={`form-input ${fieldErrors.password ? 'input-error' : ''}`}
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
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
              <span className="form-helper">
                At least 8 characters, one uppercase letter, one number
              </span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="signup-confirm">
                Confirm password
              </label>
              <input
                id="signup-confirm"
                type="password"
                name="confirmPassword"
                className={`form-input ${fieldErrors.confirmPassword ? 'input-error' : ''}`}
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
              />
              {fieldErrors.confirmPassword && (
                <span className="form-error">{fieldErrors.confirmPassword}</span>
              )}
            </div>

            <button
              type="submit"
              className={`btn btn-primary btn-full ${loading ? 'btn-loading' : ''}`}
              disabled={loading}
            >
              {loading && <span className="btn-spinner" />}
              <span className="btn-text">
                <UserPlus size={18} />
                Create Account
              </span>
            </button>
          </form>

          <div className="auth-footer">
            Already have an account?{' '}
            <Link to="/signin">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
