import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function GradingForm() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [defenseType, setDefenseType] = useState('mid');
  const [marks, setMarks] = useState({ presentation: '', implementation: '', qa: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    API.get(`/groups/${groupId}`)
      .then(res => setGroup(res.data))
      .catch(() => toast.error('Group not found'))
      .finally(() => setLoading(false));
  }, [groupId]);

  const total = (
    (parseFloat(marks.presentation) || 0) +
    (parseFloat(marks.implementation) || 0) +
    (parseFloat(marks.qa) || 0)
  );

  const getGrade = (t) => {
    if (t >= 90) return { grade: 'A',  color: '#15803D' };
    if (t >= 85) return { grade: 'A-', color: '#15803D' };
    if (t >= 80) return { grade: 'B+', color: '#1D4ED8' };
    if (t >= 75) return { grade: 'B',  color: '#1D4ED8' };
    if (t >= 70) return { grade: 'B-', color: '#1D4ED8' };
    if (t >= 65) return { grade: 'C+', color: '#D97706' };
    if (t >= 60) return { grade: 'C',  color: '#D97706' };
    return { grade: 'F', color: '#B91C1C' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (total > 100) { toast.error('Total marks cannot exceed 100'); return; }
    setSubmitting(true);
    try {
      await API.post('/evaluations/', {
        group_id: parseInt(groupId),
        defense_type: defenseType,
        presentation_marks: parseFloat(marks.presentation),
        implementation_marks: parseFloat(marks.implementation),
        qa_marks: parseFloat(marks.qa),
      });
      toast.success('Grades submitted successfully!');
      navigate('/advisor');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit grades');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const gradeInfo = marks.presentation && marks.implementation && marks.qa
    ? getGrade(total)
    : null;

  const marksFields = [
    { key: 'presentation', label: 'Presentation Skills', max: 30 },
    { key: 'implementation', label: 'Implementation Quality', max: 40 },
    { key: 'qa', label: 'Q&A Performance', max: 30 },
  ];

  return (
    <div className="page" style={{ maxWidth: '560px' }}>
      <button onClick={() => navigate('/advisor')} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: '13px', color: 'var(--text-light)', marginBottom: '16px',
      }}>
        ← Back to Dashboard
      </button>

      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--navy)', margin: '0 0 4px' }}>
          Submit Evaluation
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-light)', margin: 0 }}>
          Group: <strong style={{ color: 'var(--text-dark)' }}>{group?.group_name}</strong>
        </p>
      </div>

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

            {/* Defense type */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-mid)', display: 'block', marginBottom: '8px' }}>
                Defense Type
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['mid', 'final'].map(type => (
                  <button key={type} type="button"
                    onClick={() => setDefenseType(type)}
                    style={{
                      flex: 1, padding: '9px', borderRadius: '8px',
                      fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                      textTransform: 'capitalize', transition: 'all 0.15s',
                      border: defenseType === type ? 'none' : '1px solid var(--border)',
                      background: defenseType === type ? 'var(--wine)' : 'var(--white)',
                      color: defenseType === type ? 'white' : 'var(--text-mid)',
                    }}
                  >
                    {type} Defense
                  </button>
                ))}
              </div>
            </div>

            {/* Mark fields */}
            {marksFields.map(({ key, label, max }) => (
              <div key={key}>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-mid)', display: 'block', marginBottom: '5px' }}>
                  {label}
                  <span style={{ fontWeight: 400, marginLeft: '4px', color: 'var(--text-light)' }}>
                    (out of {max})
                  </span>
                </label>
                <input
                  type="number" min="0" max={max} step="0.5"
                  value={marks[key]}
                  onChange={e => setMarks(prev => ({ ...prev, [key]: e.target.value }))}
                  className="input"
                  placeholder={`0 – ${max}`}
                  required
                />
              </div>
            ))}

            {/* Live total */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px', borderRadius: '10px',
              background: 'var(--wine-light)', border: '1px solid var(--wine-pale)',
            }}>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--text-mid)', margin: '0 0 2px' }}>Total Marks</p>
                <p style={{ fontSize: '36px', fontWeight: 800, color: 'var(--navy)', margin: 0, lineHeight: 1 }}>
                  {total.toFixed(1)}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-mid)', margin: '0 0 2px' }}>Grade</p>
                <p style={{
                  fontSize: '36px', fontWeight: 800, margin: 0, lineHeight: 1,
                  color: gradeInfo ? gradeInfo.color : 'var(--text-light)',
                }}>
                  {gradeInfo ? gradeInfo.grade : '—'}
                </p>
              </div>
            </div>

            <button type="submit" disabled={submitting} className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: '14px' }}>
              {submitting ? 'Submitting...' : 'Submit Evaluation'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}