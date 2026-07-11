import { useEffect, useState } from 'react';
import API from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newUser, setNewUser] = useState({
    full_name: '', email: '', password: '',
    role: 'student', student_id: '', research_interests: ''
  });

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = () => {
    API.get('/admin/users')
      .then(res => setUsers(res.data))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  };

  const handleAddUser = async (e) => {
    e.preventDefault();

    // Email domain validation
    const validDomains = ['@iobm.edu.pk', '@student.iobm.edu.pk'];
    const hasValidDomain = validDomains.some(domain => newUser.email.endsWith(domain));
    if (!hasValidDomain) {
      toast.error('Email must end with @iobm.edu.pk');
      return;
    }

    setSubmitting(true);
    try {
      await API.post('/auth/register', newUser);
      toast.success(`${newUser.full_name} added successfully!`);
      setNewUser({ full_name: '', email: '', password: '', role: 'student', student_id: '', research_interests: '' });
      setShowForm(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add user');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (userId, currentStatus) => {
    try {
      await API.patch(`/admin/users/${userId}`, { is_active: !currentStatus });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: !currentStatus } : u));
      toast.success('User status updated');
    } catch {
      toast.error('Failed to update user');
    }
  };

  const handleDeleteUser = async (userId, fullName) => {
  if (!window.confirm(`Delete ${fullName}? This will remove them from any group/advisor assignment. This cannot be undone.`)) return;
  try {
    await API.delete(`/admin/users/${userId}`);
    toast.success('User deleted');
    fetchUsers();
  } catch (err) {
    toast.error(err.response?.data?.detail || 'Failed to delete user');
  }
};

  if (loading) return <LoadingSpinner />;

  const roleStyle = {
    admin:   { background: 'var(--wine-pale)', color: 'var(--wine)' },
    advisor: { background: '#DCFCE7', color: '#15803D' },
    student: { background: '#DBEAFE', color: '#1D4ED8' },
  };

  const filtered = filter === 'all' ? users : users.filter(u => u.role === filter);
  const counts = { all: users.length };
  ['student', 'advisor', 'admin'].forEach(r => { counts[r] = users.filter(u => u.role === r).length; });

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--navy)', margin: 0 }}>Manage Users</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-light)', margin: '4px 0 0' }}>{users.length} total users</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add User'}
        </button>
      </div>

      {/* Add user form */}
      {showForm && (
        <div className="card" style={{ borderLeft: '4px solid var(--wine)' }}>
          <div className="card-header">
            <span className="section-title">Create New User</span>
          </div>
          <div className="card-body">
            <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-mid)', display: 'block', marginBottom: '5px' }}>Full Name</label>
                  <input className="input" type="text" value={newUser.full_name}
                    onChange={e => setNewUser(p => ({ ...p, full_name: e.target.value }))}
                    placeholder="e.g. Muhammad Ali" required />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-mid)', display: 'block', marginBottom: '5px' }}>Email</label>
                  <input className="input" type="email" value={newUser.email}
                    onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))}
                    placeholder="user@iobm.edu.pk" required />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-mid)', display: 'block', marginBottom: '5px' }}>Password</label>
                  <input className="input" type="text" value={newUser.password}
                    onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))}
                    placeholder="Temporary password" required />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-mid)', display: 'block', marginBottom: '5px' }}>Role</label>
                  <select className="input" value={newUser.role}
                    onChange={e => setNewUser(p => ({ ...p, role: e.target.value }))}>
                    <option value="student">Student</option>
                    <option value="advisor">Advisor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                {newUser.role === 'student' && (
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-mid)', display: 'block', marginBottom: '5px' }}>Student ID</label>
                    <input className="input" type="text" value={newUser.student_id}
                      onChange={e => setNewUser(p => ({ ...p, student_id: e.target.value }))}
                      placeholder="e.g. 20221-32618" />
                  </div>
                )}
                {newUser.role === 'advisor' && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-mid)', display: 'block', marginBottom: '5px' }}>Research Interests</label>
                    <input className="input" type="text" value={newUser.research_interests}
                      onChange={e => setNewUser(p => ({ ...p, research_interests: e.target.value }))}
                      placeholder="e.g. IoT, Machine Learning, Blockchain" />
                    <p style={{ fontSize: '11px', color: 'var(--text-light)', margin: '4px 0 0' }}>
                      Used by the AI advisor matching engine — be specific.
                    </p>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Creating...' : 'Create User'}
                </button>
                <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '6px' }}>
        {['all', 'student', 'advisor', 'admin'].map(r => (
          <button key={r} onClick={() => setFilter(r)}
            style={{
              padding: '7px 14px', borderRadius: '8px', fontSize: '12px',
              fontWeight: 500, cursor: 'pointer', textTransform: 'capitalize',
              transition: 'all 0.15s',
              border: filter === r ? 'none' : '1px solid var(--border)',
              background: filter === r ? 'var(--wine)' : 'var(--white)',
              color: filter === r ? 'white' : 'var(--text-mid)',
            }}>
            {r} ({counts[r] || 0})
          </button>
        ))}
      </div>

      {/* Users table */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              {['Name', 'Email', 'Role', 'ID / Interests', 'Status', 'Action'].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id}>
                <td style={{ fontWeight: 500 }}>{u.full_name}</td>
                <td style={{ color: 'var(--text-mid)', fontSize: '12px' }}>{u.email}</td>
                <td>
                  <span className="badge" style={roleStyle[u.role]}>
                    {u.role}
                  </span>
                </td>
                <td style={{ color: 'var(--text-light)', fontSize: '12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {u.student_id || u.research_interests?.slice(0, 35) || '—'}
                </td>
                <td>
                  <span className="badge" style={u.is_active
                    ? { background: '#DCFCE7', color: '#15803D' }
                    : { background: '#F1F5F9', color: '#475569' }}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => toggleActive(u.id, u.is_active)}
                    style={{
                      background: 'none', border: `1px solid ${u.is_active ? '#FECACA' : '#BBF7D0'}`,
                      borderRadius: '6px', padding: '4px 12px', fontSize: '12px', cursor: 'pointer',
                      color: u.is_active ? '#B91C1C' : '#15803D', transition: 'all 0.15s',
                    }}>
                    {u.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDeleteUser(u.id, u.full_name)}
                    style={{
                      background: 'none', border: '1px solid var(--border)',
                      borderRadius: '6px', padding: '4px 12px', fontSize: '12px', cursor: 'pointer',
                      color: 'var(--text-mid)', transition: 'all 0.15s',
                    }}>
                    Delete
                  </button>
               </div>
             </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}