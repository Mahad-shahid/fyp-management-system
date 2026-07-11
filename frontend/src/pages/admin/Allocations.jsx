import { useEffect, useState } from 'react';
import API from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function Allocations() {
  const [groups, setGroups] = useState([]);
  const [suggestions, setSuggestions] = useState({});
  const [loadingSuggestions, setLoadingSuggestions] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/groups/').then(res => setGroups(res.data))
      .catch(() => toast.error('Failed to load groups'))
      .finally(() => setLoading(false));
  }, []);

  const fetchSuggestions = async (groupId) => {
    setLoadingSuggestions(p => ({ ...p, [groupId]: true }));
    try {
      const res = await API.get(`/ai/suggest-advisors/${groupId}`);
      setSuggestions(p => ({ ...p, [groupId]: res.data.suggestions }));
    } catch (err) {
      toast.error(err.response?.data?.detail || 'No proposal found for this group');
    } finally {
      setLoadingSuggestions(p => ({ ...p, [groupId]: false }));
    }
  };

  const assignAdvisor = async (groupId, advisorId, advisorName) => {
    try {
      await API.patch(`/groups/${groupId}/assign-advisor`, { advisor_id: advisorId });
      toast.success(`${advisorName} assigned successfully!`);
      setGroups(prev => prev.map(g =>
        g.id === groupId ? { ...g, advisor_id: advisorId } : g
      ));
    } catch {
      toast.error('Assignment failed');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Advisor Allocations</h1>
        <p className="text-gray-500 text-sm mt-1">
          Use AI suggestions to match groups with the most compatible advisor.
        </p>
      </div>

      <div className="space-y-4">
        {groups.map(group => (
          <div key={group.id} className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-semibold text-gray-800">{group.group_name}</p>
                <p className="text-xs text-gray-500 mt-0.5 capitalize">
                  Status: {group.status} · {group.advisor_id ? '✓ Advisor assigned' : 'No advisor yet'}
                </p>
              </div>
              <button
                onClick={() => fetchSuggestions(group.id)}
                disabled={loadingSuggestions[group.id]}
                className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
              >
                {loadingSuggestions[group.id] ? 'Analysing...' : '✦ AI Suggest'}
              </button>
            </div>

            {suggestions[group.id] && (
              <div className="space-y-2 mt-3">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                  AI Recommendations — ranked by compatibility
                </p>
                {suggestions[group.id].map((s, i) => (
                  <div key={s.advisor_id} className={`flex items-center justify-between p-3 rounded-lg border ${i === 0 ? 'border-blue-200 bg-blue-50' : 'border-gray-100 bg-gray-50'}`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-800">{s.full_name}</p>
                        {i === 0 && (
                          <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                            Best match
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{s.research_interests}</p>
                      {s.matched_keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {s.matched_keywords.map(kw => (
                            <span key={kw} className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className={`text-xl font-bold ${s.compatibility_score > 50 ? 'text-green-600' : s.compatibility_score > 20 ? 'text-yellow-600' : 'text-gray-400'}`}>
                        {s.compatibility_score}%
                      </p>
                      <button
                        onClick={() => assignAdvisor(group.id, s.advisor_id, s.full_name)}
                        className="text-xs border border-blue-300 text-blue-600 px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors mt-1"
                      >
                        Assign
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}