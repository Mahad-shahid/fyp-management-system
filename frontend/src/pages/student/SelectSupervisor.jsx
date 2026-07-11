import { useEffect, useState } from 'react';
import API from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function SelectSupervisor() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/supervisor-requests/suggestions')
      .then(res => setSuggestions(res.data.suggestions || []))
      .catch(err => setError(err.response?.data?.detail || 'Failed to load suggestions'))
      .finally(() => setLoading(false));
  }, []);

  const sendRequest = async (advisorId, advisorName) => {
    setSending(advisorId);
    try {
      await API.post('/supervisor-requests/', { advisor_id: advisorId });
      toast.success(`Request sent to ${advisorName}!`);
      navigate('/student');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to send request');
    } finally {
      setSending(null);
    }
  };

  if (loading) return <LoadingSpinner text="Loading supervisor suggestions..." />;

  if (error) return (
    <div className="page" style={{ maxWidth: '520px' }}>
      <button onClick={() => navigate('/student')} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: '13px', color: 'var(--text-light)', marginBottom: '16px',
      }}>
        ← Back
      </button>
      <div style={{
        background: '#FFFBEB', border: '1px solid #FDE68A',
        borderRadius: '14px', padding: '32px', textAlign: 'center',
      }}>
        <p style={{ fontSize: '32px', margin: '0 0 12px' }}>⏳</p>
        <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-dark)', margin: '0 0 8px' }}>
          {error.includes('already assigned') ? 'Supervisor Already Assigned' : 'Not Available Yet'}
        </p>
        <p style={{ fontSize: '13px', color: 'var(--text-mid)', margin: '0 0 20px' }}>
          {error.includes('already assigned')
            ? 'Your group already has a supervisor assigned.'
            : 'Your proposal must be approved before selecting a supervisor.'}
        </p>
        <button className="btn-primary" onClick={() => navigate('/student')}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );

  return (
    <div className="page" style={{ maxWidth: '680px' }}>
      <button onClick={() => navigate('/student')} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: '13px', color: 'var(--text-light)', marginBottom: '16px',
      }}>
        ← Back to Dashboard
      </button>

      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--navy)', margin: '0 0 4px' }}>
          Select a Supervisor
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-light)', margin: 0 }}>
          Ranked by AI compatibility with your project proposal. Send a request to your preferred supervisor.
        </p>
      </div>

      {suggestions.length === 0 ? (
        <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-light)' }}>No advisors available at this time.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {suggestions.map((s, i) => (
            <div key={s.advisor_id} className="card" style={{
              borderLeft: i === 0 ? '4px solid var(--wine)' : '4px solid var(--border)',
            }}>
              <div className="card-body" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1 }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '50%',
                    background: i === 0 ? 'var(--wine-pale)' : 'var(--off-white)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, fontSize: '16px', fontWeight: 700,
                    color: i === 0 ? 'var(--wine)' : 'var(--text-mid)',
                  }}>
                    {s.full_name.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--navy)', margin: 0 }}>
                        {s.full_name}
                      </p>
                      {i === 0 && (
                        <span className="badge badge-wine">Best match</span>
                      )}
                    </div>
                    {s.research_interests && (
                      <p style={{ fontSize: '12px', color: 'var(--text-mid)', margin: '0 0 8px' }}>
                        {s.research_interests}
                      </p>
                    )}
                    {s.matched_keywords?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {s.matched_keywords.map(kw => (
                          <span key={kw} style={{
                            background: '#DCFCE7', color: '#15803D',
                            fontSize: '11px', padding: '2px 8px', borderRadius: '99px', fontWeight: 500,
                          }}>
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{
                    fontSize: '26px', fontWeight: 800, margin: '0 0 2px',
                    color: s.compatibility_score > 50 ? '#15803D' : s.compatibility_score > 20 ? '#92400E' : 'var(--text-light)',
                  }}>
                    {s.compatibility_score}%
                  </p>
                  <p style={{ fontSize: '10px', color: 'var(--text-light)', margin: '0 0 4px' }}>match</p>
                  {/* Slots remaining */}
                  <p style={{ fontSize: '11px', color: s.slots_remaining === 1 ? '#D97706' : '#15803D', margin: '0 0 8px', fontWeight: 500 }}>
                    {s.slots_remaining} slot{s.slots_remaining !== 1 ? 's' : ''} available
                  </p>
                  <button
                    className="btn-primary"
                    onClick={() => sendRequest(s.advisor_id, s.full_name)}
                    disabled={sending === s.advisor_id}
                    style={{ fontSize: '12px', padding: '7px 16px' }}
                  >
                    {sending === s.advisor_id ? 'Sending...' : 'Send Request'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}