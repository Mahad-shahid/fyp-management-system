import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function AdvisorDashboard() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [requestGroups, setRequestGroups] = useState({});
  const [members, setMembers] = useState({});
  const [documents, setDocuments] = useState({});
  const [responding, setResponding] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [groupRes, proposalRes, requestRes] = await Promise.all([
        API.get('/groups/'),
        API.get('/proposals/'),
        API.get('/supervisor-requests/pending'),
      ]);
      setGroups(groupRes.data);
      setProposals(proposalRes.data);
      setPendingRequests(requestRes.data);

      const groupDetails = {};
      await Promise.all(requestRes.data.map(async (req) => {
        try {
          const res = await API.get(`/groups/${req.group_id}`);
          groupDetails[req.group_id] = res.data;
        } catch {}
      }));
      setRequestGroups(groupDetails);

      const membersMap = {};
      const docsMap = {};
      await Promise.all(groupRes.data.map(async (group) => {
        try {
          const [membersRes, docsRes] = await Promise.all([
            API.get(`/groups/${group.id}/members`),
            API.get(`/documents/group/${group.id}`),
          ]);
          membersMap[group.id] = membersRes.data;
          docsMap[group.id] = docsRes.data;
        } catch {}
      }));
      setMembers(membersMap);
      setDocuments(docsMap);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (requestId, status) => {
    setResponding(requestId);
    try {
      await API.patch(`/supervisor-requests/${requestId}/respond`, { status });
      toast.success(status === 'accepted' ? 'Request accepted!' : 'Request declined');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to respond');
    } finally {
      setResponding(null);
    }
  };

  if (loading) return <LoadingSpinner text="Loading advisor dashboard..." />;

  const getProposalForGroup = (groupId) => proposals.find(p => p.group_id === groupId);

  const proposalStatusStyle = {
    pending:  { background: '#FEF9C3', color: '#A16207' },
    approved: { background: '#DCFCE7', color: '#15803D' },
    flagged:  { background: '#FEE2E2', color: '#B91C1C' },
    rejected: { background: '#F1F5F9', color: '#475569' },
  };

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
          Advisor Dashboard
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-light)', margin: '4px 0 0' }}>
          Welcome, {user.full_name} · IoBM FYPMS
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
        {[
          { label: 'Assigned Groups', value: groups.length, accent: false },
          { label: 'Pending Requests', value: pendingRequests.length, accent: pendingRequests.length > 0 },
          { label: 'Projects to Grade', value: proposals.filter(p => p.status === 'approved').length, accent: false },
        ].map(stat => (
          <div key={stat.label} className="stat-card" style={{
            borderTop: `3px solid ${stat.accent ? '#D97706' : 'var(--wine)'}`,
          }}>
            <div className="stat-label">{stat.label}</div>
            <div className="stat-value" style={{ color: stat.accent ? '#D97706' : 'var(--navy)' }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Pending requests */}
      {pendingRequests.length > 0 && (
        <div className="card" style={{ borderLeft: '4px solid #D97706' }}>
          <div className="card-header" style={{ background: '#FFFBEB' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: '#D97706', animation: 'pulse 2s infinite',
              }} />
              <span className="section-title" style={{ borderLeftColor: '#D97706' }}>
                Pending Supervision Requests ({pendingRequests.length})
              </span>
            </div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pendingRequests.map(req => {
              const group = requestGroups[req.group_id];
              const proposal = getProposalForGroup(req.group_id);
              return (
                <div key={req.id} style={{
                  padding: '16px', borderRadius: '10px',
                  background: '#FFFBEB', border: '1px solid #FDE68A',
                  display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px',
                }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--navy)', margin: '0 0 6px' }}>
                      {group?.group_name || `Group ${req.group_id}`}
                    </p>
                    {proposal && (
                      <>
                        <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-dark)', margin: '0 0 4px' }}>
                          {proposal.title}
                        </p>
                        <p style={{ fontSize: '12px', color: 'var(--text-mid)', margin: '0 0 8px', lineHeight: 1.5 }}
                          className="line-clamp-2">
                          {proposal.abstract.slice(0, 180)}...
                        </p>
                      </>
                    )}
                    <p style={{ fontSize: '11px', color: 'var(--text-light)', margin: 0 }}>
                      Requested: {new Date(req.requested_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                    <button
                      className="btn-primary"
                      onClick={() => handleRespond(req.id, 'accepted')}
                      disabled={responding === req.id}
                      style={{ background: '#15803D', fontSize: '13px', padding: '8px 20px' }}
                    >
                      {responding === req.id ? '...' : 'Accept'}
                    </button>
                    <button
                      className="btn-primary"
                      onClick={() => handleRespond(req.id, 'rejected')}
                      disabled={responding === req.id}
                      style={{ background: '#B91C1C', fontSize: '13px', padding: '8px 20px' }}
                    >
                      {responding === req.id ? '...' : 'Decline'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Assigned groups */}
      <div className="card">
        <div className="card-header">
          <span className="section-title">Assigned Groups ({groups.length})</span>
        </div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {groups.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--text-light)' }}>No groups assigned yet.</p>
          ) : groups.map(group => {
            const proposal = getProposalForGroup(group.id);
            const groupMembers = members[group.id] || [];
            const groupDocs = documents[group.id] || [];

            return (
              <div key={group.id} style={{
                border: '1px solid var(--border)', borderRadius: '10px',
                overflow: 'hidden',
              }}>
                {/* Group header */}
                <div style={{
                  padding: '14px 16px', background: 'var(--off-white)',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                }}>
                  <div>
                    <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--navy)', margin: '0 0 4px' }}>
                      {group.group_name}
                    </p>
                    {proposal ? (
                      <p style={{ fontSize: '13px', color: 'var(--text-mid)', margin: 0 }}>{proposal.title}</p>
                    ) : (
                      <p style={{ fontSize: '12px', color: 'var(--text-light)', margin: 0 }}>No proposal yet</p>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {proposal && (
                      <span className="badge" style={proposalStatusStyle[proposal.status]}>
                        {proposal.status}
                      </span>
                    )}
                    {proposal?.status === 'approved' && (
                      <Link to={`/advisor/grade/${group.id}`}>
                        <button className="btn-primary" style={{ fontSize: '12px', padding: '6px 14px' }}>
                          Grade
                        </button>
                      </Link>
                    )}
                  </div>
                </div>

                {/* Similarity bar */}
                {proposal?.similarity_score != null && (
                  <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ flex: 1, height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: '3px',
                        width: `${proposal.similarity_score * 100}%`,
                        background: proposal.similarity_score > 0.8 ? '#B91C1C' : proposal.similarity_score > 0.6 ? '#D97706' : '#15803D',
                      }} />
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-mid)', flexShrink: 0 }}>
                      {(proposal.similarity_score * 100).toFixed(1)}% similarity
                    </span>
                  </div>
                )}

                {/* Members + Docs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                  <div style={{ padding: '14px 16px', borderRight: '1px solid var(--border)' }}>
                    <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 10px' }}>
                      Members ({groupMembers.length})
                    </p>
                    {groupMembers.length === 0 ? (
                      <p style={{ fontSize: '12px', color: 'var(--text-light)' }}>No members</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {groupMembers.map(m => (
                          <div key={m.user_id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: '26px', height: '26px', borderRadius: '50%',
                              background: 'var(--wine-pale)', display: 'flex',
                              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}>
                              <span style={{ color: 'var(--wine)', fontSize: '11px', fontWeight: 700 }}>
                                {m.full_name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-dark)', margin: 0 }}>{m.full_name}</p>
                              <p style={{ fontSize: '11px', color: 'var(--text-light)', margin: 0 }}>{m.student_id}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '14px 16px' }}>
                    <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 10px' }}>
                      Documents ({groupDocs.length})
                    </p>
                    {groupDocs.length === 0 ? (
                      <p style={{ fontSize: '12px', color: 'var(--text-light)' }}>No documents yet</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {groupDocs.map(doc => (
                          <div key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                            <p style={{ fontSize: '12px', color: 'var(--text-mid)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                              {doc.file_name}
                            </p>
                            <span className="badge" style={docTypeColors[doc.doc_type] || { background: '#F1F5F9', color: '#475569' }}>
                              {doc.doc_type}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}