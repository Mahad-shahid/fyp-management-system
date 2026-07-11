import { useEffect, useState } from 'react';
import API from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function GroupsOverview() {
  const [groups, setGroups] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [ungroupedStudents, setUngroupedStudents] = useState([]);
  const [members, setMembers] = useState({});
  const [proposals, setProposals] = useState({});
  const [documents, setDocuments] = useState({});
  const [loading, setLoading] = useState(true);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [newGroup, setNewGroup] = useState({ group_name: '', member_ids: [] });
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [deletingGroupId, setDeletingGroupId] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [groupsRes, usersRes, ungroupedRes] = await Promise.all([
        API.get('/groups/'),
        API.get('/admin/users'),
        API.get('/admin/ungrouped-students'),
      ]);
      setGroups(groupsRes.data);
      setAllUsers(usersRes.data);
      setUngroupedStudents(ungroupedRes.data);

      const membersMap = {};
      const documentsMap = {};
      await Promise.all(
        groupsRes.data.map(async (group) => {
          try {
            const [membersRes, docsRes] = await Promise.all([
              API.get(`/groups/${group.id}/members`),
              API.get(`/documents/group/${group.id}`),
            ]);
            membersMap[group.id] = membersRes.data;
            documentsMap[group.id] = docsRes.data;
          } catch {}
        })
      );

      const proposalsMap = {};
      const proposalsRes = await API.get('/proposals/');
      proposalsRes.data.forEach(p => { proposalsMap[p.group_id] = p; });

      setMembers(membersMap);
      setProposals(proposalsMap);
      setDocuments(documentsMap);
    } catch {
      toast.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (newGroup.member_ids.length === 0) { toast.error('Select at least one member'); return; }
    setCreatingGroup(true);
    try {
      await API.post('/groups/', { group_name: newGroup.group_name, member_ids: newGroup.member_ids });
      toast.success('Group created!');
      setNewGroup({ group_name: '', member_ids: [] });
      setStudentSearch('');
      setShowCreateGroup(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create group');
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleDeleteGroup = async (groupId, groupName) => {
    if (!window.confirm(`Delete "${groupName}"? This removes all members, proposals, documents and evaluations for this group. This cannot be undone.`)) return;
    setDeletingGroupId(groupId);
    try {
      await API.delete(`/groups/${groupId}`);
      toast.success('Group deleted');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete group');
    } finally {
      setDeletingGroupId(null);
    }
  };

  const toggleMember = (studentId) => {
    setNewGroup(prev => {
      const exists = prev.member_ids.includes(studentId);
      return {
        ...prev,
        member_ids: exists
          ? prev.member_ids.filter(id => id !== studentId)
          : [...prev.member_ids, studentId],
      };
    });
  };

  const handleDownload = async (docId, fileName) => {
    try {
      const response = await API.get(`/documents/download/${docId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download file');
    }
  };

  const getAdvisorName = (advisorId) => {
    const advisor = allUsers.find(u => u.id === advisorId);
    return advisor ? advisor.full_name : null;
  };

  if (loading) return <LoadingSpinner />;

  const groupStatusStyle = {
    forming:   { background: '#FEF9C3', color: '#A16207' },
    active:    { background: '#DCFCE7', color: '#15803D' },
    completed: { background: '#F1F5F9', color: '#475569' },
  };

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

  const standardTypes = ['SRS', 'SDS', 'final'];

  // Filter students by search — matches name OR student_id
  const filteredStudents = ungroupedStudents.filter(s => {
    const q = studentSearch.toLowerCase();
    return (
      s.full_name.toLowerCase().includes(q) ||
      (s.student_id || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--navy)', margin: 0 }}>Groups Overview</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-light)', margin: '4px 0 0' }}>
            {groups.length} group{groups.length !== 1 ? 's' : ''} this batch
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreateGroup(!showCreateGroup)}>
          {showCreateGroup ? 'Cancel' : '+ Create Group'}
        </button>
      </div>

      {/* Create group form */}
      {showCreateGroup && (
        <div className="card" style={{ borderLeft: '4px solid var(--wine)' }}>
          <div className="card-header">
            <span className="section-title">Create New Group</span>
          </div>
          <div className="card-body">
            <form onSubmit={handleCreateGroup} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-mid)', display: 'block', marginBottom: '5px' }}>
                  Group Name
                </label>
                <input className="input" type="text" value={newGroup.group_name}
                  onChange={e => setNewGroup(p => ({ ...p, group_name: e.target.value }))}
                  placeholder="e.g. Team Alpha" required />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-mid)', display: 'block', marginBottom: '6px' }}>
                  Select Members
                </label>

                {/* Search bar */}
                <input
                  className="input"
                  type="text"
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                  placeholder="Search by name or student ID..."
                  style={{ marginBottom: '8px' }}
                />

                <div style={{
                  border: '1px solid var(--border)', borderRadius: '8px',
                  padding: '8px', maxHeight: '240px', overflowY: 'auto',
                  display: 'flex', flexDirection: 'column', gap: '2px',
                }}>
                  {filteredStudents.length === 0 ? (
                    <p style={{ fontSize: '13px', color: 'var(--text-light)', padding: '8px' }}>
                      {ungroupedStudents.length === 0
                        ? 'No ungrouped active students available.'
                        : 'No students match your search.'}
                    </p>
                  ) : filteredStudents.map(student => (
                    <label key={student.id} style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '8px 10px', borderRadius: '6px', cursor: 'pointer',
                      background: newGroup.member_ids.includes(student.id) ? 'var(--wine-light)' : 'transparent',
                    }}>
                      <input
                        type="checkbox"
                        checked={newGroup.member_ids.includes(student.id)}
                        onChange={() => toggleMember(student.id)}
                      />
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-dark)', margin: 0 }}>
                          {student.full_name}
                        </p>
                        <p style={{ fontSize: '11px', color: 'var(--text-light)', margin: 0 }}>
                          {student.email} · ID: {student.student_id || '—'}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-light)', margin: '5px 0 0' }}>
                  {newGroup.member_ids.length} member{newGroup.member_ids.length !== 1 ? 's' : ''} selected
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" disabled={creatingGroup} className="btn-primary">
                  {creatingGroup ? 'Creating...' : 'Create Group'}
                </button>
                <button type="button" className="btn-ghost" onClick={() => setShowCreateGroup(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Groups list */}
      {groups.length === 0 ? (
        <div style={{
          background: 'var(--white)', border: '2px dashed var(--border)',
          borderRadius: '14px', padding: '48px', textAlign: 'center',
        }}>
          <p style={{ fontSize: '13px', color: 'var(--text-light)' }}>No groups formed yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {groups.map(group => {
            const groupMembers = members[group.id] || [];
            const proposal = proposals[group.id];
            const advisorName = getAdvisorName(group.advisor_id);

            return (
              <div key={group.id} className="card">
                <div className="card-body">
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div>
                      <button onClick={() => setSelectedGroup(group.id)} style={{
                        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                        fontSize: '16px', fontWeight: 700, color: 'var(--wine)',
                      }}>
                        {group.group_name}
                      </button>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                        <span className="badge" style={groupStatusStyle[group.status] || { background: '#F1F5F9', color: '#475569' }}>
                          {group.status}
                        </span>
                        {proposal && (
                          <span className="badge" style={proposalStatusStyle[proposal.status]}>
                            Proposal: {proposal.status}
                          </span>
                        )}
                        {!proposal && (
                          <span className="badge" style={{ background: '#F1F5F9', color: '#94A3B8' }}>No proposal</span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                      <button className="btn-secondary" style={{ fontSize: '12px', padding: '6px 14px' }}
                        onClick={() => setSelectedGroup(group.id)}>
                        View Details
                      </button>
                      <button
                        onClick={() => handleDeleteGroup(group.id, group.group_name)}
                        disabled={deletingGroupId === group.id}
                        style={{
                          background: 'none', border: '1px solid #FECACA', color: '#B91C1C',
                          borderRadius: '8px', padding: '5px 14px', fontSize: '12px', cursor: 'pointer',
                        }}>
                        {deletingGroupId === group.id ? 'Deleting...' : 'Delete Group'}
                      </button>
                    </div>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 4px' }}>
                      Supervisor
                    </p>
                    {advisorName ? (
                      <p style={{ fontSize: '13px', color: 'var(--text-dark)', margin: 0 }}>
                        {advisorName}
                        <span style={{ marginLeft: '8px', fontSize: '11px', color: '#15803D', fontWeight: 500 }}>✓ Assigned</span>
                      </p>
                    ) : (
                      <p style={{ fontSize: '13px', color: 'var(--text-light)', fontStyle: 'italic', margin: 0 }}>Not assigned yet</p>
                    )}
                  </div>

                  <div>
                    <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 6px' }}>
                      Members
                    </p>
                    {groupMembers.length === 0 ? (
                      <p style={{ fontSize: '12px', color: 'var(--text-light)' }}>No members</p>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {groupMembers.map(m => (
                          <div key={m.user_id} style={{
                            display: 'flex', alignItems: 'center', gap: '7px',
                            background: 'var(--off-white)', border: '1px solid var(--border)',
                            borderRadius: '8px', padding: '6px 10px',
                          }}>
                            <div style={{
                              width: '22px', height: '22px', borderRadius: '50%',
                              background: 'var(--wine-pale)', display: 'flex',
                              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}>
                              <span style={{ color: 'var(--wine)', fontSize: '10px', fontWeight: 700 }}>
                                {m.full_name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-dark)', margin: 0 }}>{m.full_name}</p>
                              <p style={{ fontSize: '10px', color: 'var(--text-light)', margin: 0 }}>{m.student_id}</p>
                            </div>
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
      )}

      {/* Detail Modal — unchanged from before */}
      {selectedGroup && (() => {
        const group = groups.find(g => g.id === selectedGroup);
        const groupMembers = members[selectedGroup] || [];
        const proposal = proposals[selectedGroup];
        const groupDocs = documents[selectedGroup] || [];
        const advisor = allUsers.find(u => u.id === group?.advisor_id);

        return (
          <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setSelectedGroup(null); }}>
            <div className="modal">
              <div className="modal-header">
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--navy)', margin: 0 }}>
                    {group?.group_name}
                  </h2>
                  <span className="badge" style={{ ...groupStatusStyle[group?.status], marginTop: '4px', display: 'inline-flex' }}>
                    {group?.status}
                  </span>
                </div>
                <button onClick={() => setSelectedGroup(null)} style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: 'var(--off-white)', border: 'none', cursor: 'pointer',
                  fontSize: '18px', color: 'var(--text-mid)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}>×</button>
              </div>

              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                <div style={{ background: 'var(--off-white)', borderRadius: '10px', padding: '14px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 10px' }}>
                    Supervisor
                  </p>
                  {advisor ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '38px', height: '38px', borderRadius: '50%',
                        background: '#DCFCE7', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', flexShrink: 0,
                      }}>
                        <span style={{ color: '#15803D', fontWeight: 700 }}>{advisor.full_name.charAt(0)}</span>
                      </div>
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-dark)', margin: 0 }}>{advisor.full_name}</p>
                        {advisor.research_interests && (
                          <p style={{ fontSize: '12px', color: 'var(--text-mid)', margin: '2px 0' }}>{advisor.research_interests}</p>
                        )}
                        <p style={{ fontSize: '11px', color: '#15803D', fontWeight: 500, margin: 0 }}>✓ Active supervision</p>
                      </div>
                    </div>
                  ) : (
                    <p style={{ fontSize: '13px', color: 'var(--text-light)', fontStyle: 'italic', margin: 0 }}>Not assigned yet</p>
                  )}
                </div>

                <div style={{ background: 'var(--off-white)', borderRadius: '10px', padding: '14px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 10px' }}>
                    Members ({groupMembers.length})
                  </p>
                  {groupMembers.length === 0 ? (
                    <p style={{ fontSize: '13px', color: 'var(--text-light)', margin: 0 }}>No members</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {groupMembers.map(m => (
                        <div key={m.user_id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '30px', height: '30px', borderRadius: '50%',
                            background: 'var(--wine-pale)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>
                            <span style={{ color: 'var(--wine)', fontSize: '12px', fontWeight: 700 }}>
                              {m.full_name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-dark)', margin: 0 }}>{m.full_name}</p>
                            <p style={{ fontSize: '11px', color: 'var(--text-light)', margin: 0 }}>{m.student_id} · {m.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ background: 'var(--off-white)', borderRadius: '10px', padding: '14px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 10px' }}>
                    Proposal
                  </p>
                  {proposal ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-dark)', margin: 0 }}>{proposal.title}</p>
                        <span className="badge" style={{ ...proposalStatusStyle[proposal.status], flexShrink: 0 }}>
                          {proposal.status}
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-mid)', lineHeight: 1.6, margin: 0 }}>{proposal.abstract}</p>
                      {proposal.similarity_score != null && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ flex: 1, height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
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
                      {proposal.admin_feedback && (
                        <div style={{ padding: '10px 12px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px' }}>
                          <p style={{ fontSize: '11px', fontWeight: 600, color: '#1D4ED8', margin: '0 0 3px' }}>Your feedback</p>
                          <p style={{ fontSize: '12px', color: '#1E40AF', margin: 0 }}>{proposal.admin_feedback}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p style={{ fontSize: '13px', color: 'var(--text-light)', fontStyle: 'italic', margin: 0 }}>No proposal submitted yet</p>
                  )}
                </div>

                <div style={{ background: 'var(--off-white)', borderRadius: '10px', padding: '14px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 10px' }}>
                    Submission Progress
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {standardTypes.map(docType => {
                      const doc = groupDocs.find(d => d.doc_type === docType);
                      return (
                        <div key={docType} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <p style={{ fontSize: '13px', color: 'var(--text-mid)', margin: 0 }}>
                            {docType === 'final' ? 'Final Report' : docType}
                          </p>
                          <span className="badge" style={doc
                            ? { background: '#DCFCE7', color: '#15803D' }
                            : { background: '#F1F5F9', color: '#94A3B8' }}>
                            {doc ? '✓ Uploaded' : 'Not uploaded'}
                          </span>
                        </div>
                      );
                    })}
                    {groupDocs.filter(d => !standardTypes.includes(d.doc_type)).map(doc => (
                      <div key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <p style={{ fontSize: '13px', color: 'var(--text-mid)', margin: 0 }}>{doc.doc_type}</p>
                        <span className="badge" style={{ background: '#DCFCE7', color: '#15803D' }}>✓ Uploaded</span>
                      </div>
                    ))}
                  </div>
                </div>

                {groupDocs.length > 0 && (
                  <div style={{ background: 'var(--off-white)', borderRadius: '10px', padding: '14px' }}>
                    <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 10px' }}>
                      Uploaded Documents ({groupDocs.length})
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {groupDocs.map(doc => (
                        <div key={doc.id} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '8px 10px', background: 'var(--white)',
                          borderRadius: '8px', border: '1px solid var(--border)',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: '14px', flexShrink: 0 }}>📄</span>
                            <div style={{ minWidth: 0 }}>
                              <button onClick={() => handleDownload(doc.id, doc.file_name)} style={{
                                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                                fontSize: '12px', fontWeight: 500, color: 'var(--wine)',
                                textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap', maxWidth: '280px', display: 'block',
                              }}>
                                {doc.file_name}
                              </button>
                              <p style={{ fontSize: '11px', color: 'var(--text-light)', margin: 0 }}>
                                {new Date(doc.uploaded_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                            <span className="badge" style={docTypeColors[doc.doc_type] || { background: '#F1F5F9', color: '#475569' }}>
                              {doc.doc_type}
                            </span>
                            <button onClick={() => handleDownload(doc.id, doc.file_name)} style={{
                              background: 'var(--off-white)', border: '1px solid var(--border)',
                              borderRadius: '6px', padding: '3px 10px', fontSize: '12px',
                              cursor: 'pointer', color: 'var(--text-mid)',
                            }}>↓</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}