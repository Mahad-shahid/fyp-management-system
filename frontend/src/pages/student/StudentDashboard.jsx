import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [proposal, setProposal] = useState(null);
  const [deadlines, setDeadlines] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [supervisorRequests, setSupervisorRequests] = useState([]);
  const [advisor, setAdvisor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [groupRes, deadlineRes] = await Promise.all([
        API.get('/groups/'),
        API.get('/admin/deadlines'),
      ]);
      const myGroup = groupRes.data[0] || null;
      setGroup(myGroup);
      setDeadlines(deadlineRes.data);

      if (myGroup) {
        const [proposalRes, membersRes, docsRes, requestsRes] = await Promise.all([
          API.get('/proposals/'),
          API.get(`/groups/${myGroup.id}/members`),
          API.get(`/documents/group/${myGroup.id}`),
          API.get('/supervisor-requests/my-status'),
        ]);
        setProposal(proposalRes.data[0] || null);
        setMembers(membersRes.data);
        setDocuments(docsRes.data);
        setSupervisorRequests(requestsRes.data);

        if (myGroup.advisor_id) {
          try {
            const advisorRes = await API.get(`/users/${myGroup.advisor_id}`);
            setAdvisor(advisorRes.data);
          } catch {}
        }
      }
    } catch {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };


  if (loading) return <LoadingSpinner text="Loading your dashboard..." />;

  const getDocStatus = (docType) => {
    const deadline = deadlines.find(d => d.doc_type === docType);
    const doc = documents.find(d => d.doc_type === docType);
    if (!doc) return { uploaded: false, onTime: null, deadline };
    const onTime = deadline ? new Date(doc.uploaded_at) <= new Date(deadline.due_date) : true;
    return { uploaded: true, onTime, deadline, doc };
  };

  const latestRequest = supervisorRequests[0] || null;

  const proposalStatusStyle = {
    pending:  { background: '#FEF9C3', color: '#A16207' },
    approved: { background: '#DCFCE7', color: '#15803D' },
    flagged:  { background: '#FEE2E2', color: '#B91C1C' },
    rejected: { background: '#F1F5F9', color: '#475569' },
  };

  const reqStatusStyle = {
    pending:  { background: '#FEF9C3', color: '#A16207' },
    accepted: { background: '#DCFCE7', color: '#15803D' },
    rejected: { background: '#FEE2E2', color: '#B91C1C' },
  };

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Page header */}
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--navy)', margin: 0 }}>
          Welcome back, {user.full_name}
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-light)', margin: '4px 0 0' }}>
          Student Dashboard · IoBM Final Year Project Management System
        </p>
      </div>

      {/* ── NO GROUP ── */}
      {!group && (
        <div style={{
          background: 'var(--white)', border: '2px dashed var(--border)',
          borderRadius: '14px', padding: '48px 32px', textAlign: 'center',
        }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '14px',
            background: 'var(--wine-light)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
          }}>
            <span style={{ fontSize: '22px' }}>👥</span>
          </div>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--navy)', margin: '0 0 6px' }}>
            You're not in a group yet
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-light)', margin: '0 0 20px' }}>
            Your coordinator will assign you to a project group. Please check back later or contact the admin office.
          </p>
        </div>
      )}

      {/* ── HAS GROUP ── */}
      {group && (
        <>
          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <div className="stat-card" style={{ borderTop: '3px solid var(--wine)' }}>
              <div className="stat-label">Your Group</div>
              <div className="stat-value" style={{ fontSize: '20px' }}>{group.group_name}</div>
              <div className="stat-sub" style={{ textTransform: 'capitalize' }}>{group.status}</div>
            </div>
            <div className="stat-card" style={{ borderTop: '3px solid var(--wine)' }}>
              <div className="stat-label">Proposal</div>
              <div className="stat-value" style={{ fontSize: '16px', marginTop: '4px' }}>
                {proposal ? proposal.title : 'Not submitted'}
              </div>
              {proposal && (
                <span className="badge" style={{ marginTop: '6px', ...proposalStatusStyle[proposal.status] }}>
                  {proposal.status}
                </span>
              )}
            </div>
          </div>

          {/* Members + Supervisor */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>

            {/* Members */}
            <div className="card">
              <div className="card-header">
                <span className="section-title">Group Members</span>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {members.length === 0 ? (
                  <p style={{ fontSize: '13px', color: 'var(--text-light)' }}>No members found.</p>
                ) : members.map(m => (
                  <div key={m.user_id} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '8px 10px', background: 'var(--off-white)',
                    borderRadius: '8px',
                  }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      background: 'var(--wine-pale)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <span style={{ color: 'var(--wine)', fontSize: '13px', fontWeight: 700 }}>
                        {m.full_name.charAt(0)}
                      </span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-dark)', margin: 0 }}>{m.full_name}</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-light)', margin: 0 }}>{m.student_id}</p>
                    </div>
                    {m.user_id === user.user_id && (
                      <span className="badge badge-wine">You</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Supervisor */}
            <div className="card">
              <div className="card-header">
                <span className="section-title">Supervisor</span>
              </div>
              <div className="card-body">

                {/* Assigned */}
                {group.advisor_id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '12px', background: '#F0FDF4',
                      border: '1px solid #BBF7D0', borderRadius: '10px',
                    }}>
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '50%',
                        background: '#DCFCE7', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <span style={{ color: '#15803D', fontWeight: 700, fontSize: '15px' }}>
                          {advisor ? advisor.full_name.charAt(0) : '?'}
                        </span>
                      </div>
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-dark)', margin: 0 }}>
                          {advisor ? advisor.full_name : 'Supervisor Assigned'}
                        </p>
                        {advisor?.research_interests && (
                          <p style={{ fontSize: '11px', color: 'var(--text-mid)', margin: '2px 0 0', lineHeight: 1.4 }}>
                            {advisor.research_interests}
                          </p>
                        )}
                        <p style={{ fontSize: '11px', color: '#15803D', fontWeight: 500, margin: '4px 0 0' }}>
                          ✓ Active supervision
                        </p>
                      </div>
                    </div>
                    {advisor?.email && (
                      <p style={{ fontSize: '12px', color: 'var(--text-light)' }}>
                        Contact:{' '}
                        <a href={`mailto:${advisor.email}`} style={{ color: 'var(--wine)' }}>
                          {advisor.email}
                        </a>
                      </p>
                    )}
                  </div>

                ) : !proposal ? (
                  <div style={{ padding: '14px', background: 'var(--off-white)', borderRadius: '8px' }}>
                    <p style={{ fontSize: '13px', color: 'var(--text-mid)', margin: 0 }}>Supervisor not assigned yet</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-light)', margin: '4px 0 0' }}>Submit your proposal first</p>
                  </div>

                ) : proposal.status !== 'approved' ? (
                  <div style={{ padding: '14px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px' }}>
                    <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-dark)', margin: 0 }}>
                      Supervisor not assigned yet
                    </p>
                    <p style={{ fontSize: '12px', color: '#92400E', margin: '4px 0 0' }}>
                      Proposal is <strong style={{ textTransform: 'capitalize' }}>{proposal.status}</strong> — supervisor selection opens once approved
                    </p>
                  </div>

                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {latestRequest && (
                      <div style={{
                        padding: '12px',
                        background: latestRequest.status === 'accepted' ? '#F0FDF4' : latestRequest.status === 'rejected' ? '#FEF2F2' : '#FFFBEB',
                        border: `1px solid ${latestRequest.status === 'accepted' ? '#BBF7D0' : latestRequest.status === 'rejected' ? '#FECACA' : '#FDE68A'}`,
                        borderRadius: '8px',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-dark)', margin: 0 }}>Request Status</p>
                          <span className="badge" style={reqStatusStyle[latestRequest.status]}>{latestRequest.status}</span>
                        </div>
                        {latestRequest.status === 'pending' && (
                          <p style={{ fontSize: '12px', color: 'var(--text-light)', margin: '6px 0 0' }}>Waiting for advisor to respond...</p>
                        )}
                        {latestRequest.status === 'rejected' && (
                          <p style={{ fontSize: '12px', color: '#B91C1C', margin: '6px 0 0' }}>Advisor declined. You can select another.</p>
                        )}
                      </div>
                    )}
                    {(!latestRequest || latestRequest.status === 'rejected') && (
                      <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}
                        onClick={() => navigate('/student/select-supervisor')}>
                        {latestRequest?.status === 'rejected' ? 'Choose Another Supervisor' : 'Select Supervisor'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Proposal */}
          <div className="card">
            <div className="card-header">
              <span className="section-title">Project Proposal</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                {!proposal && (
                  <Link to="/student/proposal"><button className="btn-primary">Submit Proposal</button></Link>
                )}
                {proposal?.status === 'rejected' && (
                  <Link to="/student/proposal?resubmit=true">
                    <button className="btn-primary" style={{ background: '#B91C1C' }}>Resubmit Proposal</button>
                  </Link>
                )}
              </div>
            </div>
            <div className="card-body">
              {proposal ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <p style={{ fontSize: '11px', color: 'var(--text-light)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Title</p>
                    <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--navy)', margin: 0 }}>{proposal.title}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: 'var(--text-light)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Abstract</p>
                    <p style={{ fontSize: '13px', color: 'var(--text-mid)', lineHeight: 1.6, margin: 0 }}>{proposal.abstract}</p>
                  </div>
                  {proposal.resubmission_count > 0 && (
                    <p style={{ fontSize: '11px', color: 'var(--text-light)' }}>Resubmission #{proposal.resubmission_count}</p>
                  )}
                  {proposal.admin_feedback && (
                    <div style={{ padding: '12px 14px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px' }}>
                      <p style={{ fontSize: '11px', fontWeight: 600, color: '#1D4ED8', marginBottom: '4px' }}>Coordinator Feedback</p>
                      <p style={{ fontSize: '13px', color: '#1E40AF', margin: 0 }}>{proposal.admin_feedback}</p>
                    </div>
                  )}
                  {proposal.similarity_score > 0.6
                    && proposal.status !== 'approved'
                    && proposal.status !== 'rejected' && (
                    <div style={{
                      padding: '12px 14px',
                      background: proposal.similarity_score > 0.8 ? '#FEF2F2' : '#FFFBEB',
                      border: `1px solid ${proposal.similarity_score > 0.8 ? '#FECACA' : '#FDE68A'}`,
                      borderRadius: '8px',
                    }}>
                      <p style={{ fontSize: '12px', fontWeight: 600, color: proposal.similarity_score > 0.8 ? '#B91C1C' : '#92400E', margin: '0 0 3px' }}>
                        {proposal.similarity_score > 0.8 ? '⚠ High similarity — under review' : '⚡ Moderate similarity detected'}
                      </p>
                      <p style={{ fontSize: '12px', color: 'var(--text-mid)', margin: 0 }}>
                        Most similar to: "{proposal.similar_to_project}"
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p style={{ fontSize: '13px', color: 'var(--text-light)', margin: 0 }}>No proposal submitted yet.</p>
                  <div style={{ padding: '12px 14px', background: 'var(--wine-light)', border: '1px solid var(--wine-pale)', borderRadius: '8px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--wine)', margin: '0 0 3px' }}>💡 Tip: Preview before submitting</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-mid)', margin: 0 }}>
                      Use the proposal form to check your AI similarity score before final submission.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submission Progress */}
          <div className="card">
            <div className="card-header">
              <span className="section-title">Submission Progress</span>
              {proposal && (
                <Link to="/student/documents">
                  <button className="btn-secondary" style={{ fontSize: '12px', padding: '6px 14px' }}>
                    Upload Documents
                  </button>
                </Link>
              )}
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {['SRS', 'SDS', 'final'].map(docType => {
                const { uploaded, onTime, deadline } = getDocStatus(docType);
                return (
                  <div key={docType} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', background: 'var(--off-white)',
                    borderRadius: '8px', border: '1px solid var(--border)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '30px', height: '30px', borderRadius: '8px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '13px', fontWeight: 600,
                        background: uploaded ? (onTime ? '#DCFCE7' : '#FEE2E2') : '#E2E8F0',
                        color: uploaded ? (onTime ? '#15803D' : '#B91C1C') : '#94A3B8',
                      }}>
                        {uploaded ? (onTime ? '✓' : '!') : '○'}
                      </div>
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-dark)', margin: 0 }}>
                          {docType === 'final' ? 'Final Report' : docType}
                        </p>
                        {deadline && (
                          <p style={{ fontSize: '11px', color: 'var(--text-light)', margin: 0 }}>
                            Due: {new Date(deadline.due_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="badge" style={
                      uploaded
                        ? (onTime ? { background: '#DCFCE7', color: '#15803D' } : { background: '#FEE2E2', color: '#B91C1C' })
                        : { background: '#F1F5F9', color: '#94A3B8' }
                    }>
                      {uploaded ? (onTime ? 'Submitted on time' : 'Submitted late') : 'Not submitted'}
                    </span>
                  </div>
                );
              })}

              {/* Custom deadline rows */}
              {deadlines
                .filter(d => d.doc_type && !['SRS', 'SDS', 'final'].includes(d.doc_type))
                .map(deadline => {
                  const doc = documents.find(d => d.doc_type === deadline.doc_type);
                  const uploaded = !!doc;
                  const onTime = uploaded ? new Date(doc.uploaded_at) <= new Date(deadline.due_date) : null;
                  return (
                    <div key={deadline.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px', background: 'var(--wine-light)',
                      borderRadius: '8px', border: '1px solid var(--wine-pale)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '30px', height: '30px', borderRadius: '8px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '13px', fontWeight: 600,
                          background: uploaded ? (onTime ? '#DCFCE7' : '#FEE2E2') : '#F3D9D9',
                          color: uploaded ? (onTime ? '#15803D' : '#B91C1C') : 'var(--wine)',
                        }}>
                          {uploaded ? (onTime ? '✓' : '!') : '○'}
                        </div>
                        <div>
                          <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-dark)', margin: 0 }}>
                            {deadline.title}
                          </p>
                          <p style={{ fontSize: '11px', color: 'var(--text-light)', margin: 0 }}>
                            Due: {new Date(deadline.due_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {uploaded ? (
                        <span className="badge" style={onTime ? { background: '#DCFCE7', color: '#15803D' } : { background: '#FEE2E2', color: '#B91C1C' }}>
                          {onTime ? 'Submitted on time' : 'Submitted late'}
                        </span>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>Not submitted</span>
                          {proposal && (
                            <Link to={`/student/documents?type=${encodeURIComponent(deadline.doc_type)}`}>
                              <button className="btn-primary" style={{ fontSize: '11px', padding: '4px 10px' }}>
                                Upload
                              </button>
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              }
            </div>
          </div>

          {/* Deadlines */}
          <div className="card">
            <div className="card-header">
              <span className="section-title">Upcoming Deadlines</span>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {deadlines.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--text-light)' }}>No deadlines set yet.</p>
              ) : deadlines.map(d => {
                const daysLeft = Math.ceil((new Date(d.due_date) - new Date()) / (1000 * 60 * 60 * 24));
                const isUrgent = daysLeft <= 3 && daysLeft > 0;
                const isOverdue = daysLeft <= 0;
                const uploadedDoc = d.doc_type ? documents.find(doc => doc.doc_type === d.doc_type) : null;
                const submittedOnTime = uploadedDoc ? new Date(uploadedDoc.uploaded_at) <= new Date(d.due_date) : null;

                return (
                  <div key={d.id} style={{
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                    gap: '12px', padding: '12px 14px', borderRadius: '8px',
                    border: `1px solid ${isOverdue ? '#FECACA' : isUrgent ? '#FDE68A' : 'var(--border)'}`,
                    background: isOverdue ? '#FEF2F2' : isUrgent ? '#FFFBEB' : 'var(--off-white)',
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-dark)', margin: 0 }}>{d.title}</p>
                        {d.doc_type && (
                          <span className="badge badge-wine">{d.doc_type} required</span>
                        )}
                      </div>
                      {d.description && (
                        <p style={{ fontSize: '12px', color: 'var(--text-light)', margin: '3px 0 0' }}>{d.description}</p>
                      )}
                      <p style={{ fontSize: '11px', color: 'var(--text-light)', margin: '3px 0 0' }}>
                        {new Date(d.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                      <p style={{
                        fontSize: '12px', fontWeight: 500, margin: 0,
                        color: isOverdue ? '#B91C1C' : isUrgent ? '#92400E' : '#15803D',
                      }}>
                        {isOverdue ? 'Overdue' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}
                      </p>
                      {d.doc_type && proposal && (
                        uploadedDoc ? (
                          <span className="badge" style={submittedOnTime ? { background: '#DCFCE7', color: '#15803D' } : { background: '#FEE2E2', color: '#B91C1C' }}>
                            {submittedOnTime ? '✓ Submitted on time' : '✓ Submitted late'}
                          </span>
                        ) : !isOverdue ? (
                          <Link to={`/student/documents?type=${encodeURIComponent(d.doc_type)}`}>
                            <button className="btn-primary" style={{ fontSize: '11px', padding: '5px 12px' }}>
                              Upload {d.doc_type}
                            </button>
                          </Link>
                        ) : null
                      )}
                      {d.doc_type && !proposal && (
                        <p style={{ fontSize: '11px', color: 'var(--text-light)', fontStyle: 'italic' }}>Submit proposal first</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
