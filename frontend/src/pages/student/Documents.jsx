import { useEffect, useState } from 'react';
import API from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function Documents() {
  const [searchParams] = useSearchParams();
  const preSelectedType = searchParams.get('type') || 'SRS';
  const [documents, setDocuments] = useState([]);
  const [group, setGroup] = useState(null);
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState(preSelectedType);
  const [customDocType, setCustomDocType] = useState('');
  const [file, setFile] = useState(null);
  const navigate = useNavigate();

  const standardTypes = ['SRS', 'SDS', 'final'];

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { setDocType(preSelectedType); }, [preSelectedType]);

  const fetchData = async () => {
    try {
      const groupRes = await API.get('/groups/');
      const myGroup = groupRes.data[0] || null;
      setGroup(myGroup);
      const deadlineRes = await API.get('/admin/deadlines');
      setDeadlines(deadlineRes.data);
      if (myGroup) {
        const docRes = await API.get(`/documents/group/${myGroup.id}`);
        setDocuments(docRes.data);
      }
    } catch {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) { toast.error('Please select a file'); return; }
    if (!group) { toast.error('You need to be in a group first'); return; }
    const finalDocType = docType === 'other' ? customDocType.trim() : docType;
    if (!finalDocType) { toast.error('Please specify the document type'); return; }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('doc_type', finalDocType);
    formData.append('group_id', group.id);
    setUploading(true);
    try {
      await API.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Document uploaded successfully!');
      setFile(null);
      setCustomDocType('');
      e.target.reset();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const customDeadlineTypes = deadlines
    .filter(d => d.doc_type && !standardTypes.includes(d.doc_type))
    .map(d => ({ type: d.doc_type, title: d.title }))
    .filter((item, index, self) => index === self.findIndex(t => t.type === item.type));

  const docTypeColors = {
    SRS:   { background: '#DBEAFE', color: '#1D4ED8' },
    SDS:   { background: '#EDE9FE', color: '#6D28D9' },
    final: { background: '#DCFCE7', color: '#15803D' },
  };

  const typeButtons = [
    ...standardTypes.map(t => ({ key: t, label: t === 'final' ? 'Final Report' : t })),
    ...customDeadlineTypes.map(d => ({ key: d.type, label: d.title })),
    { key: 'other', label: 'Other' },
  ];

  return (
    <div className="page" style={{ maxWidth: '680px' }}>
      <button onClick={() => navigate('/student')} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: '13px', color: 'var(--text-light)', marginBottom: '16px',
      }}>
        ← Back to Dashboard
      </button>

      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--navy)', margin: '0 0 4px' }}>Documents</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-light)', margin: 0 }}>
          Upload your project documents here.
        </p>
      </div>

      {/* Upload form */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div className="card-header">
          <span className="section-title">Upload New Document</span>
        </div>
        <div className="card-body">
          <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-mid)', display: 'block', marginBottom: '8px' }}>
                Document Type
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {typeButtons.map(btn => (
                  <button
                    key={btn.key}
                    type="button"
                    onClick={() => setDocType(btn.key)}
                    style={{
                      padding: '7px 14px', borderRadius: '8px', fontSize: '13px',
                      fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
                      border: docType === btn.key ? 'none' : '1px solid var(--border)',
                      background: docType === btn.key
                        ? (btn.key === 'other' ? 'var(--navy)' : 'var(--wine)')
                        : 'var(--white)',
                      color: docType === btn.key ? 'white' : 'var(--text-mid)',
                    }}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>

              {docType === 'other' && (
                <input className="input" type="text" value={customDocType}
                  onChange={e => setCustomDocType(e.target.value)}
                  placeholder="Describe the document type e.g. Mid Report"
                  style={{ marginTop: '10px' }} required />
              )}
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-mid)', display: 'block', marginBottom: '5px' }}>
                Select File
              </label>
              <input type="file" onChange={e => setFile(e.target.files[0])}
                accept=".pdf,.doc,.docx" className="input" required />
              <p style={{ fontSize: '11px', color: 'var(--text-light)', margin: '5px 0 0' }}>
                Accepted formats: PDF, DOC, DOCX
              </p>
            </div>

            <button type="submit" disabled={uploading} className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '11px' }}>
              {uploading ? 'Uploading...' : 'Upload Document'}
            </button>
          </form>
        </div>
      </div>

      {/* Documents list */}
      <div className="card">
        <div className="card-header">
          <span className="section-title">Uploaded Documents ({documents.length})</span>
        </div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {documents.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--text-light)' }}>No documents uploaded yet.</p>
          ) : documents.map(doc => (
            <div key={doc.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 12px', background: 'var(--off-white)',
              borderRadius: '8px', border: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  background: 'var(--wine-light)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: '14px',
                }}>
                  📄
                </div>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-dark)', margin: 0 }}>
                    {doc.file_name}
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--text-light)', margin: 0 }}>
                    {new Date(doc.uploaded_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <span className="badge" style={docTypeColors[doc.doc_type] || { background: '#F1F5F9', color: '#475569' }}>
                {doc.doc_type}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}