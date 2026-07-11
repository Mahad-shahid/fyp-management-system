import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import API from '../../api/axios';
import toast from 'react-hot-toast';

export default function ProposalForm() {
  const [searchParams] = useSearchParams();
  const isResubmit = searchParams.get('resubmit') === 'true';
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewResult, setPreviewResult] = useState(null);
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  const handlePreview = async () => {
    if (abstract.split(' ').filter(Boolean).length < 20) {
      toast.error('Write at least 20 words for an accurate preview');
      return;
    }
    setPreviewing(true);
    try {
      const res = await API.post('/ai/preview-duplicate', { abstract });
      setPreviewResult(res.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Preview failed');
    } finally {
      setPreviewing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (abstract.split(' ').filter(Boolean).length < 30) {
      toast.error('Abstract must be at least 30 words');
      return;
    }
    setLoading(true);
    try {
      const res = isResubmit
        ? await API.put('/proposals/resubmit', { title, abstract })
        : await API.post('/proposals/', { title, abstract });
      toast.success(isResubmit ? 'Proposal resubmitted!' : 'Proposal submitted!');
      setResult(res.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    const score = result.similarity_score * 100;
    const isDuplicate = result.status === 'flagged';
    return (
      <div className="page" style={{ maxWidth: '560px' }}>
        <div style={{
          background: 'var(--white)', borderRadius: '16px',
          border: `2px solid ${isDuplicate ? '#FECACA' : '#BBF7D0'}`,
          padding: '32px', textAlign: 'center',
          boxShadow: 'var(--shadow-md)',
        }}>
          <div style={{
            fontSize: '52px', fontWeight: 800,
            color: isDuplicate ? '#B91C1C' : '#15803D', marginBottom: '4px',
          }}>
            {score.toFixed(1)}%
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-mid)', margin: '0 0 4px' }}>Similarity Score</p>
          <p style={{
            fontSize: '16px', fontWeight: 600, margin: '0 0 20px',
            color: isDuplicate ? '#B91C1C' : '#15803D',
          }}>
            {isDuplicate ? '⚠ Flagged for Review' : '✓ Proposal Submitted'}
          </p>

          {result.similar_to_project && (
            <div style={{
              background: 'var(--off-white)', borderRadius: '10px',
              padding: '14px', marginBottom: '16px', textAlign: 'left',
            }}>
              <p style={{ fontSize: '11px', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 4px' }}>
                Most Similar Past Project
              </p>
              <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-dark)', margin: 0 }}>
                "{result.similar_to_project}"
              </p>
            </div>
          )}

          <p style={{ fontSize: '13px', color: 'var(--text-mid)', marginBottom: '20px' }}>
            {isDuplicate
              ? 'Flagged due to high similarity. The coordinator will review it before proceeding.'
              : 'Submitted successfully and pending coordinator approval.'}
          </p>

          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px' }}
            onClick={() => navigate('/student')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ maxWidth: '640px' }}>
      <button onClick={() => navigate('/student')} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: '13px', color: 'var(--text-light)', marginBottom: '16px',
        display: 'flex', alignItems: 'center', gap: '4px',
      }}>
        ← Back to Dashboard
      </button>

      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--navy)', margin: '0 0 4px' }}>
          {isResubmit ? 'Resubmit Proposal' : 'Submit Project Proposal'}
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-light)', margin: 0 }}>
          {isResubmit
            ? 'Update your proposal. The AI will re-check similarity on submission.'
            : 'Preview your similarity score before submitting to avoid flagging.'}
        </p>
      </div>

      <div className="card">
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-mid)', display: 'block', marginBottom: '5px' }}>
              Project Title
            </label>
            <input className="input" type="text" value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Smart Home Automation using IoT" required />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-mid)', display: 'block', marginBottom: '5px' }}>
              Abstract
              <span style={{ color: 'var(--text-light)', fontWeight: 400, marginLeft: '6px' }}>
                ({abstract.split(' ').filter(Boolean).length} words)
              </span>
            </label>
            <textarea className="input" value={abstract}
              onChange={e => { setAbstract(e.target.value); setPreviewResult(null); }}
              rows={7} style={{ resize: 'none' }}
              placeholder="Describe your project idea in detail..." required />
          </div>

          {/* Preview button */}
          <button type="button" onClick={handlePreview} disabled={previewing}
            className="btn-secondary" style={{ width: '100%', justifyContent: 'center', padding: '10px' }}>
            {previewing ? 'Checking similarity...' : '🔍 Preview Similarity Score (before submitting)'}
          </button>

          {/* Preview result */}
          {previewResult && (
            <div style={{
              padding: '14px 16px', borderRadius: '10px',
              background: previewResult.is_duplicate ? '#FEF2F2' : '#F0FDF4',
              border: `1px solid ${previewResult.is_duplicate ? '#FECACA' : '#BBF7D0'}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-dark)', margin: 0 }}>Preview Result</p>
                <span style={{
                  fontSize: '20px', fontWeight: 700,
                  color: previewResult.is_duplicate ? '#B91C1C' : '#15803D',
                }}>
                  {(previewResult.similarity_score * 100).toFixed(1)}%
                </span>
              </div>
              {previewResult.similar_to_project && (
                <p style={{ fontSize: '12px', color: 'var(--text-mid)', margin: '0 0 4px' }}>
                  Similar to: "{previewResult.similar_to_project}"
                </p>
              )}
              <p style={{
                fontSize: '12px', fontWeight: 500, margin: 0,
                color: previewResult.is_duplicate ? '#B91C1C' : '#15803D',
              }}>
                {previewResult.is_duplicate
                  ? '⚠ High similarity — consider revising your abstract before submitting'
                  : '✓ Looks good — you can safely submit'}
              </p>
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading}
            className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: '14px' }}>
            {loading
              ? (isResubmit ? 'Resubmitting...' : 'Submitting...')
              : (isResubmit ? 'Resubmit Proposal' : 'Submit Proposal')}
          </button>
        </div>
      </div>
    </div>
  );
}