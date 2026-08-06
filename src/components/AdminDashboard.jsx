import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Shield, CheckCircle2, XCircle, Settings, ToggleLeft, ToggleRight, Building, Mail, UserCheck } from 'lucide-react';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  const token = localStorage.getItem('token');

  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:8000/auth/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchPermissions = async () => {
    try {
      const res = await fetch('http://localhost:8000/auth/admin/permissions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch permissions');
      const data = await res.json();
      setPermissions(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');
      await Promise.all([fetchUsers(), fetchPermissions()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleToggleApproval = async (userId, currentApprovedState) => {
    try {
      const res = await fetch(`http://localhost:8000/auth/admin/users/${userId}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ is_approved: !currentApprovedState })
      });
      if (!res.ok) throw new Error('Failed to update approval status');
      setActionMessage(t('admin.actionSuccess', 'User status updated successfully!'));
      setTimeout(() => setActionMessage(''), 3000);
      await fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await fetch(`http://localhost:8000/auth/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      if (!res.ok) throw new Error('Failed to update role');
      setActionMessage(t('admin.roleSuccess', 'User role updated successfully!'));
      setTimeout(() => setActionMessage(''), 3000);
      await fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleTogglePermission = async (role, service, currentEnabled) => {
    try {
      const res = await fetch('http://localhost:8000/auth/admin/permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          role: role,
          service: service,
          is_enabled: !currentEnabled
        })
      });
      if (!res.ok) throw new Error('Failed to update permission');
      setActionMessage(t('admin.permSuccess', 'Service visibility updated!'));
      setTimeout(() => setActionMessage(''), 3000);
      await fetchPermissions();
    } catch (err) {
      setError(err.message);
    }
  };

  const roles = ['officer', 'reviewer', 'translator'];
  const services = ['chatbot', 'dashboard', 'translation', 'review'];

  const isPermEnabled = (role, service) => {
    const perm = permissions.find(p => p.role === role && p.service === service);
    return perm ? perm.is_enabled : true;
  };

  return (
    <div className="admin-container">
      {/* Header Banner */}
      <div className="admin-header">
        <div>
          <div className="admin-badge">
            <Shield size={16} />
            <span>RBAC Control Center</span>
          </div>
          <h1 className="admin-title">{t('admin.title', 'Admin Console')}</h1>
          <p className="admin-subtitle">
            {t('admin.subtitle', 'User Management & Role-Based Access Control (RBAC)')}
          </p>
        </div>
      </div>

      {/* Action Notification */}
      {actionMessage && (
        <div className="admin-toast success">
          <CheckCircle2 size={16} />
          <span>{actionMessage}</span>
        </div>
      )}

      {error && (
        <div className="admin-toast error">
          <XCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={18} />
          <span>{t('admin.usersTab', 'User Approvals & Roles')}</span>
          <span className="tab-count">{users.length}</span>
        </button>

        <button
          className={`admin-tab-btn ${activeTab === 'permissions' ? 'active' : ''}`}
          onClick={() => setActiveTab('permissions')}
        >
          <Settings size={18} />
          <span>{t('admin.servicesTab', 'Service Visibility Matrix')}</span>
        </button>
      </div>

      {loading ? (
        <div className="admin-loading">
          <div className="spinner"></div>
          <span>Loading management data...</span>
        </div>
      ) : activeTab === 'users' ? (
        /* Users & Roles Management Tab */
        <div className="admin-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('admin.userCol', 'User Details')}</th>
                <th>{t('admin.deptCol', 'Department')}</th>
                <th>{t('admin.roleCol', 'Role')}</th>
                <th>{t('admin.statusCol', 'Approval Status')}</th>
                <th>{t('admin.actionsCol', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="user-info-cell">
                      <div className="user-avatar">{u.full_name?.charAt(0).toUpperCase() || 'U'}</div>
                      <div>
                        <div className="user-name">{u.full_name}</div>
                        <div className="user-sub">
                          <Mail size={12} /> {u.email} | <strong>ID:</strong> {u.employee_id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="dept-cell">
                      <Building size={14} />
                      <span>{u.department || 'N/A'}</span>
                    </div>
                  </td>
                  <td>
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="admin-select-role"
                    >
                      <option value="officer">{t('auth.roleOfficer', 'Officer')}</option>
                      <option value="reviewer">{t('auth.roleReviewer', 'Reviewer')}</option>
                      <option value="translator">{t('auth.roleTranslator', 'Translator')}</option>
                      <option value="admin">{t('admin.roleAdmin', 'Admin')}</option>
                    </select>
                  </td>
                  <td>
                    <span className={`status-pill ${u.is_approved ? 'approved' : 'pending'}`}>
                      {u.is_approved ? (
                        <>
                          <CheckCircle2 size={14} /> {t('admin.approved', 'Approved')}
                        </>
                      ) : (
                        <>
                          <XCircle size={14} /> {t('admin.pending', 'Pending Approval')}
                        </>
                      )}
                    </span>
                  </td>
                  <td>
                    <button
                      className={`btn-action ${u.is_approved ? 'revoke' : 'approve'}`}
                      onClick={() => handleToggleApproval(u.id, u.is_approved)}
                    >
                      {u.is_approved ? t('admin.revokeBtn', 'Revoke Access') : t('admin.approveBtn', 'Approve Access')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Service Visibility Matrix Tab */
        <div className="admin-card">
          <div className="matrix-description">
            <h3>Service Access Configuration per Role</h3>
            <p>Toggle which system services are visible and accessible to each user role in the application navbar.</p>
          </div>
          <table className="admin-table matrix-table">
            <thead>
              <tr>
                <th>{t('admin.serviceName', 'Service Name')}</th>
                {roles.map(r => (
                  <th key={r} style={{ textTransform: 'capitalize' }}>
                    {t(`auth.role${r.charAt(0).toUpperCase() + r.slice(1)}`, r)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {services.map(s => (
                <tr key={s}>
                  <td>
                    <div className="service-cell">
                      <UserCheck size={18} />
                      <span>
                        {s === 'chatbot'
                          ? t('admin.serviceChatbot', 'AI Chatbot')
                          : s === 'dashboard'
                          ? t('admin.serviceDashboard', 'Document Dashboard')
                          : s === 'translation'
                          ? t('admin.serviceTranslation', 'Translation Workspace')
                          : t('admin.serviceReview', 'Review Workspace')}
                      </span>
                    </div>
                  </td>
                  {roles.map(r => {
                    const enabled = isPermEnabled(r, s);
                    return (
                      <td key={r} className="matrix-cell">
                        <button
                          className={`perm-toggle-btn ${enabled ? 'on' : 'off'}`}
                          onClick={() => handleTogglePermission(r, s, enabled)}
                        >
                          {enabled ? (
                            <>
                              <ToggleRight size={22} color="#059669" />
                              <span className="state-label on">{t('admin.enabled', 'Enabled')}</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft size={22} color="#9ca3af" />
                              <span className="state-label off">{t('admin.disabled', 'Disabled')}</span>
                            </>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
