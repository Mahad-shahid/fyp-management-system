import { useEffect, useState } from 'react';
import API from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function ProposalReview() {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchProposals(); }, []);

  const fetchProposals = () => {
    API.get('/proposals/')
      .then(res => setProposals(res.data))
      .catch(() => toast.error('Failed to load proposals'))
      .finally(() => setLoading(false));
  };

  const handleReview = async (proposalId, status) => {
    setSubmitting(true);
    try {
      await API.patch(`/proposals/${proposalId}/review`, { status, admin_feedback: feedback });
      toast.success(`Proposal ${status}`);
      setSelected(null);
      setFeedback('');
      fetchProposals();
    } catch {
      toast.error('Failed to update proposal');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const statusStyle = {
    pending:  { background: '#FEF9C3', color: '#A16207' },
    approved: { background: '#DCFCE7', color: '#15803D' },
    flagged:  { background: '#FEE2E2', color: '#B91C1C' },
    rejected: { background: '#F1F5F9', color: '#475569' },
  };

  const filtered = filter === 'all' ? proposals : proposals.filter(p => p.status === filter);
  const counts = { all: proposals.length };
  ['pending', 'flagged', 'approved', 'rejected'].forEach(s => {
    counts[s] = proposals.filter(p => p.status === s).length;
  });

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--navy)', margin: 0 }}>
          Proposal Review
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-light)', margin: '4px 0 0' }}>
          Review and approve student project proposals
        </p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {['all', 'pending', 'flagged', 'approved', 'rejected'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{
              padding: '7px 14px', borderRadius: '8px', fontSize: '12px',
              fontWeight: 500, cursor: 'pointer', textTransform: 'capitalize',
              transition: 'all 0.15s',
              border: filter === s ? 'none' : '1px solid var(--border)',
              background: filter === s ? 'var(--wine)' : 'var(--white)',
              color: filter === s ? 'white' : 'var(--text-mid)',
            }}>
            {s} ({counts[s]})
          </button>
        ))}
      </div>

      {/* Proposals list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filtered.length === 0 && (
          <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-light)' }}>No proposals in this category.</p>
          </div>
        )}

        {filtered.map(proposal => (
          <div key={proposal.id} className="card" style={{
            borderLeft: proposal.status === 'flagged' ? '4px solid #B91C1C' : '4px solid var(--border)',
          }}>
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--navy)', margin: 0 }}>
                      {proposal.title}
                    </p>
                    <span className="badge" style={statusStyle[proposal.status]}>
                      {proposal.status}
                    </span>
                  </div>

                  {/* Abstract — truncated with expand */}
                  <p style={{ fontSize: '13px', color: 'var(--text-mid)', lineHeight: 1.6, margin: '0 0 10px' }}>
                    {selected?.id === proposal.id
                      ? proposal.abstract
                      : proposal.abstract.slice(0, 200) + (proposal.abstract.length > 200 ? '...' : '')}
                  </p>

                  {/* Similarity bar */}
                  {proposal.similarity_score != null && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <div style={{ flex: 1, height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: '3px',
                          width: `${proposal.similarity_score * 100}%`,
                          background: proposal.similarity_score > 0.8 ? '#B91C1C' : proposal.similarity_score > 0.6 ? '#D97706' : '#15803D',
                        }} />
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--text-mid)', flexShrink: 0, fontWeight: 500 }}>
                        {(proposal.similarity_score * 100).toFixed(1)}% similarity
                      </span>
                      {proposal.similar_to_project && (
                        <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>
                          vs. "{proposal.similar_to_project}"
                        </span>
                      )}
                    </div>
                  )}

                  {proposal.admin_feedback && (
                    <div style={{ padding: '10px 12px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px' }}>
                      <p style={{ fontSize: '11px', fontWeight: 600, color: '#1D4ED8', margin: '0 0 3px' }}>Your feedback</p>
                      <p style={{ fontSize: '12px', color: '#1E40AF', margin: 0 }}>{proposal.admin_feedback}</p>
                    </div>
                  )}
                </div>

                {/* Action button */}
                <div style={{ flexShrink: 0 }}>
                  {proposal.status === 'pending' || proposal.status === 'flagged' ? (
                    <button className="btn-primary"
                      onClick={() => { setSelected(proposal); setFeedback(''); }}
                      style={{ fontSize: '12px', padding: '7px 16px' }}>
                      Review
                    </button>
                  ) : (
                    <button className="btn-ghost"
                      onClick={() => { setSelected(proposal); setFeedback(proposal.admin_feedback || ''); }}
                      style={{ fontSize: '12px', padding: '7px 16px' }}>
                      Edit
                    </button>
                  )}
                </div>
              </div>

              {/* Inline review panel */}
              {selected?.id === proposal.id && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-mid)', display: 'block', marginBottom: '6px' }}>
                    Feedback for student (optional)
                  </label>
                  <textarea
                    value={feedback}
                    onChange={e => setFeedback(e.target.value)}
                    rows={2}
                    className="input"
                    style={{ resize: 'none', marginBottom: '10px' }}
                    placeholder="e.g. The idea is interesting but too similar to a 2023 project. Please revise the scope..."
                  />
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button className="btn-primary" disabled={submitting}
                      style={{ background: '#15803D', fontSize: '13px' }}
                      onClick={() => handleReview(proposal.id, 'approved')}>
                      ✓ Approve
                    </button>
                    <button className="btn-primary" disabled={submitting}
                      style={{ background: '#D97706', fontSize: '13px' }}
                      onClick={() => handleReview(proposal.id, 'flagged')}>
                      ⚑ Flag
                    </button>
                    <button className="btn-primary" disabled={submitting}
                      style={{ background: '#B91C1C', fontSize: '13px' }}
                      onClick={() => handleReview(proposal.id, 'rejected')}>
                      ✕ Reject
                    </button>
                    <button className="btn-ghost" style={{ fontSize: '13px' }}
                      onClick={() => { setSelected(null); setFeedback(''); }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}