import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { Mail, Phone, Building2, Briefcase, Calendar, MapPin, Upload, Camera, Save, X } from 'lucide-react';
import api from '../../../api/axios';
import './EmployeeProfile.css';

const EmployeeProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, employee: currentEmployee } = useAuth();
  
  // If no ID is passed, assume viewing own profile
  const profileId = id || currentEmployee?._id;
  const isOwnProfile = currentEmployee?._id === profileId;
  const isAdmin = user?.role === 'admin';
  const canEdit = isOwnProfile || isAdmin;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        // If viewing own profile without ID in URL, we could just use context,
        // but fetching ensures fresh data and consistent UI for admin vs self view.
        const response = await api.get(`/employees/${profileId}`);
        setProfile(response.data.data);
        setFormData(response.data.data);
        setError(null);
      } catch (err) {
        setError('Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };

    if (profileId) {
      fetchProfile();
    }
  }, [profileId]);

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel edit - reset form data
      setFormData(profile);
      setPhotoFile(null);
      setPhotoPreview(null);
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoClick = () => {
    if (isEditing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const data = new FormData();
      
      // Append standard fields based on permissions
      if (isAdmin) {
        // Admin can update everything
        ['firstName', 'lastName', 'department', 'designation', 'phone', 'address', 'employmentType', 'salary', 'status'].forEach(key => {
          if (formData[key] !== undefined) data.append(key, formData[key]);
        });
      } else if (isOwnProfile) {
        // Employee can only update limited fields
        ['phone', 'address'].forEach(key => {
          if (formData[key] !== undefined) data.append(key, formData[key]);
        });
      }

      // Append photo if changed
      if (photoFile) {
        data.append('profilePhoto', photoFile);
      }

      const endpoint = isOwnProfile ? '/employees/me' : `/employees/${profileId}`;
      const response = await api.put(endpoint, data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setProfile(response.data.data);
      setFormData(response.data.data);
      setIsEditing(false);
      setPhotoFile(null);
      
      // Note: Ideally we'd update AuthContext if isOwnProfile is true, 
      // but for simplicity it will refresh on next full load or we could expose an updateContext method.

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="skeleton" style={{ height: 200, width: '100%', borderRadius: 'var(--radius-card)', marginBottom: 'var(--space-6)' }}></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="profile-page">
        <div className="auth-alert auth-alert-error">{error || 'Profile not found'}</div>
        <button className="btn" onClick={() => navigate('/directory')}>Back to Directory</button>
      </div>
    );
  }

  const getInitials = () => `${profile.firstName?.[0] || ''}${profile.lastName?.[0] || ''}`.toUpperCase();
  const currentPhoto = photoPreview || profile.profilePhoto;

  return (
    <div className="profile-page animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">{isOwnProfile ? 'My Profile' : 'Employee Profile'}</h1>
          <p className="page-subtitle">Manage personal information and settings.</p>
        </div>
        {canEdit && !isEditing && (
          <button className="btn btn-primary" onClick={handleEditToggle}>
            Edit Profile
          </button>
        )}
      </div>

      {error && (
        <div className="auth-alert auth-alert-error" style={{ marginBottom: 'var(--space-6)' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="profile-content">
        {/* ─── Header Card ─── */}
        <div className="card profile-header-card">
          <div className="profile-cover"></div>
          
          <div className="profile-avatar-section">
            <div 
              className={`profile-avatar-large ${isEditing ? 'editable' : ''}`}
              onClick={handlePhotoClick}
            >
              {currentPhoto ? (
                <img src={currentPhoto} alt="Profile" className="avatar-image" />
              ) : (
                <div className="avatar-placeholder">{getInitials()}</div>
              )}
              
              {isEditing && (
                <div className="avatar-edit-overlay">
                  <Camera size={24} color="white" />
                </div>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoChange}
            />

            <div className="profile-title-section">
              {isEditing && isAdmin ? (
                <div className="form-row">
                  <input type="text" name="firstName" className="form-input" value={formData.firstName || ''} onChange={handleInputChange} />
                  <input type="text" name="lastName" className="form-input" value={formData.lastName || ''} onChange={handleInputChange} />
                </div>
              ) : (
                <h2>{profile.firstName} {profile.lastName}</h2>
              )}
              
              {isEditing && isAdmin ? (
                <input type="text" name="designation" className="form-input" value={formData.designation || ''} onChange={handleInputChange} style={{ marginTop: '8px' }} />
              ) : (
                <p className="designation">{profile.designation}</p>
              )}
              
              <div className="status-tags">
                {isEditing && isAdmin ? (
                  <select name="status" className="form-select" value={formData.status || ''} onChange={handleInputChange}>
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Terminated">Terminated</option>
                  </select>
                ) : (
                  <span className="status-badge" data-status={profile.status}>{profile.status}</span>
                )}
                <span className="status-badge" data-status="info">{profile.department}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Details Grid ─── */}
        <div className="profile-details-grid">
          {/* Contact Info */}
          <div className="card">
            <h3 className="card-title">Contact Information</h3>
            <div className="details-list">
              <div className="detail-row">
                <div className="detail-icon-wrap"><Mail size={16} /></div>
                <div className="detail-content">
                  <span className="detail-label">Email</span>
                  <span className="detail-value">{profile.user?.email || profile.email}</span>
                </div>
              </div>
              
              <div className="detail-row">
                <div className="detail-icon-wrap"><Phone size={16} /></div>
                <div className="detail-content">
                  <span className="detail-label">Phone</span>
                  {isEditing && canEdit ? (
                    <input type="tel" name="phone" className="form-input" value={formData.phone || ''} onChange={handleInputChange} />
                  ) : (
                    <span className="detail-value">{profile.phone || 'Not provided'}</span>
                  )}
                </div>
              </div>

              <div className="detail-row">
                <div className="detail-icon-wrap"><MapPin size={16} /></div>
                <div className="detail-content">
                  <span className="detail-label">Address</span>
                  {isEditing && canEdit ? (
                    <textarea name="address" className="form-input" value={formData.address || ''} onChange={handleInputChange} rows="2" style={{ height: 'auto' }} />
                  ) : (
                    <span className="detail-value">{profile.address || 'Not provided'}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Work Info */}
          <div className="card">
            <h3 className="card-title">Work Information</h3>
            <div className="details-list">
              <div className="detail-row">
                <div className="detail-icon-wrap"><Building2 size={16} /></div>
                <div className="detail-content">
                  <span className="detail-label">Department</span>
                  {isEditing && isAdmin ? (
                    <select name="department" className="form-select" value={formData.department || ''} onChange={handleInputChange}>
                      <option value="Engineering">Engineering</option>
                      <option value="HR">HR</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Finance">Finance</option>
                      <option value="Operations">Operations</option>
                    </select>
                  ) : (
                    <span className="detail-value">{profile.department}</span>
                  )}
                </div>
              </div>

              <div className="detail-row">
                <div className="detail-icon-wrap"><Briefcase size={16} /></div>
                <div className="detail-content">
                  <span className="detail-label">Employment Type</span>
                  {isEditing && isAdmin ? (
                    <select name="employmentType" className="form-select" value={formData.employmentType || ''} onChange={handleInputChange}>
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                    </select>
                  ) : (
                    <span className="detail-value">{profile.employmentType}</span>
                  )}
                </div>
              </div>

              <div className="detail-row">
                <div className="detail-icon-wrap"><Calendar size={16} /></div>
                <div className="detail-content">
                  <span className="detail-label">Date Joined</span>
                  <span className="detail-value">
                    {profile.dateJoined ? new Date(profile.dateJoined).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
              
              {isAdmin && (
                <div className="detail-row">
                  <div className="detail-icon-wrap"><Wallet size={16} /></div>
                  <div className="detail-content">
                    <span className="detail-label">Base Salary</span>
                    {isEditing ? (
                      <input type="number" name="salary" className="form-input" value={formData.salary || ''} onChange={handleInputChange} />
                    ) : (
                      <span className="detail-value">${profile.salary?.toLocaleString() || '0'}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── Action Buttons ─── */}
        {isEditing && (
          <div className="form-actions sticky-bottom">
            <button type="button" className="btn" onClick={handleEditToggle} disabled={saving}>
              <X size={18} /> Cancel
            </button>
            <button type="submit" className={`btn btn-primary ${saving ? 'btn-loading' : ''}`} disabled={saving}>
              {saving && <span className="btn-spinner" />}
              <span className="btn-text">
                <Save size={18} /> Save Changes
              </span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default EmployeeProfile;
