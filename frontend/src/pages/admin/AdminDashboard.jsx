import { useEffect, useState } from 'react';
import API from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newDeadline, setNewDeadline] = useState({ title: '', due_date: '', description: '', doc_type: '' });
  const [addingDeadline, setAddingDeadline] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [analyticsRes, deadlineRes] = await Promise.all([
        API.get('/admin/analytics'),
        API.get('/admin/deadlines'),
      ]);
      setAnalytics(analyticsRes.data);
      setDeadlines(deadlineRes.data);
    } catch {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDeadline = async (e) => {
    e.preventDefault();
    setAddingDeadline(true);
    try {
      const payload = {
        ...newDeadline,
        doc_type: newDeadline.doc_type === '__other__' ? newDeadline.title.trim() : newDeadline.doc_type
      };
      await API.post('/admin/deadlines', payload);
      toast.success('Deadline added!');
      setNewDeadline({ title: '', due_date: '', description: '', doc_type: '' });
      fetchData();
    } catch {
      toast.error('Failed to add deadline');
    } finally {
      setAddingDeadline(false);
    }
  };

  const handleEditDeadline = async (id) => {
    try {
      await API.patch(`/admin/deadlines/${id}`, editData);
      toast.success('Deadline updated!');
      setEditingId(null);
      fetchData();
    } catch {
      toast.error('Failed to update deadline');
    }
  };

  const handleDeleteDeadline = async (id) => {
    try {
      await API.delete(`/admin/deadlines/${id}`);
      toast.success('Deadline deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete deadline');
    }
  };

  if (loading) return <LoadingSpinner text="Loading admin dashboard..." />;

  const proposalData = [
    { name: 'Approved', value: analytics.proposals_approved, color: '#15803D' },
    { name: 'Pending',  value: analytics.proposals_pending,  color: '#D97706' },
    { name: 'Flagged',  value: analytics.proposals_flagged,  color: '#B91C1C' },
  ].filter(d => d.value > 0);

  const userBarData = [
    { name: 'Students', count: analytics.total_students },
    { name: 'Advisors', count: analytics.total_advisors },
    { name: 'Groups',   count: analytics.total_groups },
  ];

  const docTypeColors = {
    SRS:   { background: '#DBEAFE', color: '#1D4ED8' },
    SDS:   { background: '#EDE9FE', color: '#6D28D9' },
    final: { background: '#DCFCE7', color: '#15803D' },
  };

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--navy)', margin: 0 }}>
          Admin Dashboard
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-light)', margin: '4px 0 0' }}>
          FYPMS Control Panel · IoBM CS Department
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        {[
          { label: 'Total Groups',    value: analytics.total_groups },
          { label: 'Total Proposals', value: analytics.total_proposals },
          { label: 'Total Students',  value: analytics.total_students },
          { label: 'Total Advisors',  value: analytics.total_advisors },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ borderTop: '3px solid var(--wine)' }}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <div className="card">
          <div className="card-header">
            <span className="section-title">Proposal Status</span>
          </div>
          <div className="card-body">
            {proposalData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={proposalData} cx="50%" cy="50%" outerRadius={70}
                    dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {proposalData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-light)' }}>No proposals yet</p>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="section-title">System Overview</span>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={userBarData}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'var(--wine-light)' }} />
                <Bar dataKey="count" fill="var(--wine)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Deadlines */}
      <div className="card">
        <div className="card-header">
          <span className="section-title">Deadlines</span>
        </div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Add deadline form */}
          <form onSubmit={handleAddDeadline} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', display: 'block', marginBottom: '5px' }}>
                  Title
                </label>
                <input className="input" type="text" placeholder="e.g. SRS Submission"
                  value={newDeadline.title}
                  onChange={e => setNewDeadline(p => ({ ...p, title: e.target.value }))} required />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', display: 'block', marginBottom: '5px' }}>
                  Due Date
                </label>
                <input className="input" type="datetime-local"
                  value={newDeadline.due_date}
                  onChange={e => setNewDeadline(p => ({ ...p, due_date: e.target.value }))} required />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', display: 'block', marginBottom: '5px' }}>
                  Description
                </label>
                <input className="input" type="text" placeholder="Brief description"
                  value={newDeadline.description}
                  onChange={e => setNewDeadline(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', display: 'block', marginBottom: '5px' }}>
                  Document Upload Required?
                </label>
                <select className="input" value={newDeadline.doc_type}
                  onChange={e => setNewDeadline(p => ({ ...p, doc_type: e.target.value }))}>
                  <option value="">No upload required</option>
                  <option value="SRS">SRS Document</option>
                  <option value="SDS">SDS Document</option>
                  <option value="final">Final Report</option>
                  <option value="__other__">Other (uses deadline title)</option>
                </select>
              </div>
            </div>
            <div>
              <button type="submit" disabled={addingDeadline} className="btn-primary">
                {addingDeadline ? 'Adding...' : '+ Add Deadline'}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div style={{ height: '1px', background: 'var(--border)' }} />

          {/* Deadlines list */}
          {deadlines.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--text-light)' }}>No deadlines set yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {deadlines.map(d => {
                const daysLeft = Math.ceil((new Date(d.due_date) - new Date()) / (1000 * 60 * 60 * 24));
                const isEditing = editingId === d.id;

                return (
                  <div key={d.id} style={{
                    padding: '12px 14px', borderRadius: '8px',
                    border: '1px solid var(--border)', background: 'var(--off-white)',
                  }}>
                    {isEditing ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <input className="input" defaultValue={d.title}
                          onChange={e => setEditData(p => ({ ...p, title: e.target.value }))} />
                        <input className="input" type="datetime-local"
                          defaultValue={d.due_date?.slice(0, 16)}
                          onChange={e => setEditData(p => ({ ...p, due_date: e.target.value }))} />
                        <input className="input" defaultValue={d.description}
                          placeholder="Description"
                          onChange={e => setEditData(p => ({ ...p, description: e.target.value }))} />
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn-primary" style={{ fontSize: '12px', padding: '6px 14px' }}
                            onClick={() => handleEditDeadline(d.id)}>
                            Save
                          </button>
                          <button className="btn-ghost" style={{ fontSize: '12px', padding: '6px 14px' }}
                            onClick={() => setEditingId(null)}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                            <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-dark)', margin: 0 }}>{d.title}</p>
                            {d.doc_type && (
                              <span className="badge" style={docTypeColors[d.doc_type] || { background: 'var(--wine-pale)', color: 'var(--wine)' }}>
                                {d.doc_type}
                              </span>
                            )}
                          </div>
                          {d.description && (
                            <p style={{ fontSize: '12px', color: 'var(--text-light)', margin: 0 }}>{d.description}</p>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: '12px', color: 'var(--text-light)', margin: 0 }}>
                              {new Date(d.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                            <p style={{
                              fontSize: '11px', fontWeight: 500, margin: 0,
                              color: daysLeft <= 0 ? '#B91C1C' : daysLeft <= 7 ? '#D97706' : '#15803D',
                            }}>
                              {daysLeft <= 0 ? 'Overdue' : `${daysLeft} days left`}
                            </p>
                          </div>
                          <button className="btn-ghost" style={{ fontSize: '11px', padding: '5px 10px' }}
                            onClick={() => { setEditingId(d.id); setEditData({ title: d.title, due_date: d.due_date, description: d.description, doc_type: d.doc_type }); }}>
                            Edit
                          </button>
                          <button onClick={() => handleDeleteDeadline(d.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#B91C1C', fontSize: '18px', padding: '0 4px' }}>
                            ×
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}