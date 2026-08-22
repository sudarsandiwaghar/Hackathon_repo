import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Mail, Phone, Building2, Briefcase } from 'lucide-react';
import api from '../../../api/axios';
import './EmployeeDirectory.css';

const EmployeeDirectory = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  
  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        let url = '/employees?';
        if (debouncedSearch) url += `search=${debouncedSearch}&`;
        if (department) url += `department=${department}`;
        
        const response = await api.get(url);
        setEmployees(response.data.data);
        setError(null);
      } catch (err) {
        setError('Failed to load employee directory.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [debouncedSearch, department]);

  const departments = ['Engineering', 'HR', 'Marketing', 'Finance', 'Operations'];

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <div className="directory-page animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Directory</h1>
          <p className="page-subtitle">Find and connect with your team members.</p>
        </div>
      </div>

      <div className="directory-controls">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="filter-wrapper">
          <Filter size={18} className="filter-icon" />
          <select
            className="filter-select"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map(dep => (
              <option key={dep} value={dep}>{dep}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="auth-alert auth-alert-error" style={{ marginBottom: 'var(--space-6)' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="directory-grid">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} className="card skeleton-card">
              <div className="skeleton skeleton-circle" style={{ width: 80, height: 80, margin: '0 auto var(--space-4)' }}></div>
              <div className="skeleton skeleton-heading" style={{ margin: '0 auto var(--space-2)' }}></div>
              <div className="skeleton skeleton-text" style={{ width: '40%', margin: '0 auto var(--space-4)' }}></div>
            </div>
          ))}
        </div>
      ) : employees.length === 0 ? (
        <div className="empty-state card">
          <Users size={48} className="empty-icon" />
          <h3>No employees found</h3>
          <p>Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="directory-grid">
          {employees.map((emp, index) => (
            <div 
              key={emp._id} 
              className="card employee-card card-interactive stagger-item"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="employee-card-header">
                {emp.profilePhoto ? (
                  <img src={emp.profilePhoto} alt={`${emp.firstName} ${emp.lastName}`} className="employee-avatar" />
                ) : (
                  <div className="employee-avatar-placeholder">
                    {getInitials(emp.firstName, emp.lastName)}
                  </div>
                )}
                
                <h3 className="employee-name">{emp.firstName} {emp.lastName}</h3>
                <span className="employee-designation">{emp.designation}</span>
                
                <span className={`status-badge employee-status`} data-status={emp.status}>
                  {emp.status}
                </span>
              </div>
              
              <div className="employee-card-body">
                <div className="employee-detail">
                  <Building2 size={16} className="detail-icon" />
                  <span>{emp.department}</span>
                </div>
                {emp.email && (
                  <div className="employee-detail">
                    <Mail size={16} className="detail-icon" />
                    <a href={`mailto:${emp.email}`} className="detail-link">{emp.email}</a>
                  </div>
                )}
                {emp.phone && (
                  <div className="employee-detail">
                    <Phone size={16} className="detail-icon" />
                    <a href={`tel:${emp.phone}`} className="detail-link">{emp.phone}</a>
                  </div>
                )}
              </div>
              
              <div className="employee-card-footer">
                <Link to={`/profile/${emp._id}`} className="btn btn-primary btn-full">
                  View Profile
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmployeeDirectory;
