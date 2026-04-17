import React, { useState, useEffect } from 'react';
import { api } from '../api';

const StatisticsChart = ({ sessions }) => {
  if (!sessions || sessions.length === 0) return null;

  const chartHeight = 240;
  const padding = 80;
  // Dynamic spacing: more candidates = tighter spacing but with scroll
  const pointGap = sessions.length > 10 ? 60 : 100;
  const chartWidth = Math.max(800, sessions.length * pointGap + padding * 2);
  const maxScore = 100;

  // Generate path points for Frequency Polygon
  const points = sessions.map((s, i) => {
    const x = padding + i * pointGap;
    const y = chartHeight - (s.overall_score / maxScore) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  // Area points
  const areaPoints = `${padding},${chartHeight} ${points} ${padding + (sessions.length - 1) * pointGap},${chartHeight}`;

  return (
    <div className="stats-container animate-fade-in">
      <div className="stats-header">PERFORMANCE ANALYTICS TREND</div>
      <div className="svg-scroll-container">
        <div className="svg-wrapper" style={{ width: chartWidth }}>
          <svg width={chartWidth} height={chartHeight + 100} viewBox={`0 0 ${chartWidth} ${chartHeight + 100}`}>
            <defs>
              <linearGradient id="polyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6D8196" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#6D8196" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Y-Axis Grid Lines */}
            {[0, 25, 50, 75, 100].map(val => (
              <g key={val}>
                <line x1={padding} y1={chartHeight - (val / maxScore) * chartHeight} x2={chartWidth - padding} y2={chartHeight - (val / maxScore) * chartHeight} stroke="rgba(109,129,150,0.12)" strokeWidth="1" strokeDasharray="4 4" />
                <text x={padding - 40} y={chartHeight - (val / maxScore) * chartHeight + 4} fill="rgba(109,129,150,0.5)" fontSize="10" fontWeight="700">{val}%</text>
              </g>
            ))}

            {/* Shaded Area */}
            <polyline points={areaPoints} fill="url(#polyGradient)" />

            {/* Polygon Line — no expensive filter */}
            <polyline points={points} fill="none" stroke="#6D8196" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

            {/* Data Points and Labels */}
            {sessions.map((s, i) => {
              const x = padding + i * pointGap;
              const y = chartHeight - (s.overall_score / maxScore) * chartHeight;
              const color = s.overall_score >= 75 ? '#ade600ff' : s.overall_score >= 50 ? '#ff9900' : '#ff4d4d';

              return (
                <g key={s.id || i} className="chart-node-group">
                  <circle cx={x} cy={y} r="5" fill="var(--surface-color)" stroke={color} strokeWidth="2" className="data-point" />
                  <text
                    x={x}
                    y={chartHeight + (i % 2 === 0 ? 40 : 65)}
                    fill="rgba(109,129,150,0.7)"
                    fontSize="9"
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    {s.candidate_name.split(' ')[0]}
                  </text>
                  <text x={x} y={y - 12} fill={color} fontSize="10" fontWeight="700" textAnchor="middle" className="score-label">
                    {s.overall_score}%
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
};

const CandidatePerformance = ({ job, onBack }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_URL || '';
    const fetchSessions = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/interviews/session/${job.id}`);
        const data = await res.json();
        if (data.sessions) {
          const sorted = data.sessions.sort((a, b) => (b.overall_score || 0) - (a.overall_score || 0));
          setSessions(sorted);
        }
      } catch (e) {
        console.error("Failed to fetch sessions", e);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, [job.id]);

  return (
    <div className="performance-view animate-fade-in">
      <div className="perf-header">
        <button className="back-btn" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          BACK
        </button>
        <div className="perf-title-wrap">
          <h2 className="perf-title">{job.title.toUpperCase()}</h2>
          <div className="perf-subtitle">SYSTEM ANALYSIS: {sessions.length} ENTRIES</div>
        </div>
      </div>

      <div className="perf-content-grid">
        <div className="perf-stats-panel glass-panel">
          <StatisticsChart sessions={sessions} />
        </div>

        <div className="perf-list-panel">
          <div className="list-header">CANDIDATE RANKING (DECREASING SCORE)</div>
          <div className="campaign-sessions-list">
            {loading ? <p>Loading Intelligence...</p> :
              sessions.length === 0 ? <p>No candidates have completed this interview yet.</p> :
                sessions.map(session => (
                  <SessionListItem key={session.id} session={session} />
                ))
            }
          </div>
        </div>
      </div>
    </div>
  );
};

const SessionListItem = ({ session }) => {
  const getCategory = (score) => {
    if (score >= 75) return { label: 'PASSED', color: '#00e676' };
    if (score >= 50) return { label: 'REVIEW', color: '#ff9900' };
    return { label: 'REJECTED', color: '#ff4d4d' };
  };
  const cat = getCategory(session.overall_score || 0);

  return (
    <div className="horizontal-session-card animate-slide-up">
      <div className="card-left">
        <div className="session-avatar-circle" style={{ background: `linear-gradient(135deg, ${cat.color}, #0a1f13)` }}>
          {session.candidate_name?.charAt(0) || "C"}
        </div>
      </div>
      <div className="card-mid">
        <div className="session-id-pill">#{String(session.id).padStart(3, '0')}</div>
        <h3 className="candidate-name-text">{session.candidate_name}</h3>
        <div className="candidate-meta-text">Session Date: {new Date(session.created_at).toLocaleDateString()}</div>
        <div className="candidate-status-text" style={{ color: cat.color }}>{cat.label}</div>
      </div>
      <div className="card-right">
        <div className="score-ring-container">
          <svg viewBox="0 0 36 36" className="score-ring-svg">
            <path fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <path fill="none" stroke={cat.color} strokeWidth="3" strokeLinecap="round" strokeDasharray={`${session.overall_score}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
          </svg>
          <div className="score-ring-text" style={{ color: cat.color }}>{session.overall_score || 0}</div>
        </div>
      </div>
    </div>
  );
};

const InterviewDashboard = ({ interviews, onRefreshInterviews, onStartTest }) => {
  const [showModal, setShowModal] = useState(false);
  const [newInterview, setNewInterview] = useState({ title: '', description: '', duration: 15 });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredInterviews = interviews.filter(i =>
    i.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const data = await api.post('/api/interviews', newInterview);
      if (data.id) {
        setShowModal(false);
        setNewInterview({ title: '', description: '', duration: 15 });
        onRefreshInterviews();
      }
    } catch (e) {
      console.error("Creation failed", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this interview campaign?")) return;
    try {
      await api.delete(`/api/interviews/${id}`);
      onRefreshInterviews();
    } catch (e) {
      console.error("Delete failed", e);
    }
  };

  const FolderBlock = ({ interview, isNew = false }) => {
    // Generate a soft color based on the title or index
    const colors = [
      { bg: 'rgba(238, 242, 255, 1)', accent: '#6366f1', text: '#4338ca' }, // Indigo
      { bg: 'rgba(240, 253, 244, 1)', accent: '#22c55e', text: '#15803d' }, // Green
      { bg: 'rgba(255, 251, 235, 1)', accent: '#f59e0b', text: '#b45309' }, // Amber
      { bg: 'rgba(254, 242, 242, 1)', accent: '#ef4444', text: '#b91c1c' }, // Red
      { bg: 'rgba(250, 245, 255, 1)', accent: '#a855f7', text: '#7e22ce' }, // Purple
    ];
    const color = isNew ? { bg: 'rgba(255, 255, 255, 0.05)', accent: '#10b981', text: '#10b981' } : colors[interview.id % colors.length];

    if (isNew) {
      return (
        <div className="folder-card new-folder animate-scale-up" onClick={() => setShowModal(true)}>
          <div className="folder-tab"></div>
          <div className="folder-body">
            <div className="create-plus">+</div>
            <div className="folder-title">NEW CAMPAIGN</div>
            <div className="folder-footer">Initialize Analysis</div>
          </div>
        </div>
      );
    }

    return (
      <div className="folder-card animate-scale-up" style={{ backgroundColor: color.bg }}>
        <div className="folder-tab" style={{ backgroundColor: color.bg }}></div>
        <div className="folder-options" onClick={(e) => { e.stopPropagation(); handleDelete(interview.id); }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </div>
        <div className="folder-body">
          <h3 className="folder-title" style={{ color: '#1e293b' }}>{interview.title.toUpperCase()}</h3>
          <div className="folder-footer">
            <div className="folder-avatars">
              <div className="avatar" style={{ backgroundColor: color.accent }}>{interview.title.charAt(0)}</div>
              <div className="avatar" style={{ backgroundColor: '#94a3b8' }}>AI</div>
            </div>
            <div className="folder-meta" style={{ color: '#64748b' }}>
              {interview.duration_minutes} MINS â€¢ AI VOICE
            </div>
          </div>
          {/* Hover Actions */}
          <div className="folder-hover-overlay">
            <button className="folder-action-btn btn-view" onClick={() => setSelectedJobId(interview.id)}>
              VIEW PERFORMANCE
            </button>
            <button className="folder-action-btn btn-launch" onClick={() => onStartTest(interview.id)}>
              LAUNCH TEST
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="interview-dashboard animate-fade-in">
      {!selectedJobId ? (
        <div className="dashboard-content-wrapper">
          <div className="top-search-bar">
            <div className="search-input-wrapper">
              <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input
                type="text"
                placeholder="Search job profiles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="search-shortcut">âŒ˜ F</div>
            </div>
          </div>

          <div className="dashboard-header">
            <div>
              <h2 className="heading-2">MY WORKFLOWS</h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>Automated Talent Intelligence Dashboard.</p>
            </div>
          </div>

          <div className="campaign-blocks-grid">
            <FolderBlock isNew={true} />
            {filteredInterviews.map((interview) => (
              <FolderBlock key={interview.id} interview={interview} />
            ))}
          </div>
        </div>
      ) : (
        <CandidatePerformance
          job={interviews.find(i => i.id === selectedJobId)}
          onBack={() => setSelectedJobId(null)}
        />
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel animate-scale-up">
            <button className="modal-close-btn" onClick={() => setShowModal(false)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <h3>Create Interview Panel</h3>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Job Title</label>
                <input
                  type="text"
                  value={newInterview.title}
                  onChange={(e) => setNewInterview({ ...newInterview, title: e.target.value })}
                  placeholder="e.g. Senior Backend Engineer"
                  required
                />
              </div>
              <div className="form-group">
                <label>Job Description & Instructions</label>
                <textarea
                  value={newInterview.description}
                  onChange={(e) => setNewInterview({ ...newInterview, description: e.target.value })}
                  placeholder="Paste JD here. Drona AI will use this to ask relevant questions."
                  required
                />
              </div>
              <div className="form-group">
                <label>Duration (Minutes)</label>
                <input
                  type="number"
                  value={newInterview.duration}
                  onChange={(e) => setNewInterview({ ...newInterview, duration: e.target.value })}
                  min="5" max="60"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Panel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .interview-dashboard { margin-top: 2rem; width: 100%; color: var(--text-primary); }
        .dashboard-content-wrapper { max-width: 1400px; margin: 0 auto; width: 100%; }

        /* Search Bar */
        .top-search-bar { margin-bottom: 3rem; display: flex; align-items: center; }
        .search-input-wrapper {
          position: relative; flex: 1; max-width: 420px;
          background: var(--surface-color);
          border: 1.5px solid var(--border-color);
          border-radius: 14px; display: flex; align-items: center;
          padding: 0.75rem 1rem; transition: all 0.3s;
          box-shadow: var(--shadow-sm);
        }
        .search-input-wrapper:focus-within {
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 4px rgba(255, 0, 119, 0.1);
        }
        .search-icon { color: var(--text-secondary); margin-right: 0.75rem; }
        .search-input-wrapper input {
          background: none; border: none; color: var(--text-primary); outline: none; flex: 1; font-size: 0.95rem;
        }
        .search-input-wrapper input::placeholder { color: var(--text-secondary); }
        .search-shortcut {
          font-size: 0.75rem; color: var(--text-secondary); font-weight: 800;
          background: var(--bg-color); padding: 2px 8px; border-radius: 6px;
          border: 1px solid var(--border-color);
        }

        .dashboard-header { margin-bottom: 2.5rem; }
        .dashboard-header p { color: var(--text-secondary); font-size: 0.9rem; }

        /* Folder Grid */
        .campaign-blocks-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 3.5rem 2.5rem;
          width: 100%; padding: 2rem 0;
        }
        @media (max-width: 1200px) { .campaign-blocks-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 768px)  { .campaign-blocks-grid { grid-template-columns: 1fr; } }

        /* Folder Card */
        .folder-card {
          width: 100%; max-width: 450px; height: 260px; position: relative;
          border-radius: 24px; border-top-left-radius: 0;
          margin: 0 auto; cursor: pointer;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          display: flex; flex-direction: column;
          box-shadow: var(--shadow-md);
        }
        .folder-tab {
          position: absolute; top: -16px; left: 0; width: 120px; height: 16px;
          border-top-left-radius: 16px; border-top-right-radius: 16px;
        }
        .folder-tab::after {
          content: ''; position: absolute; top: 0; right: -24px;
          width: 48px; height: 16px;
          background: inherit; clip-path: polygon(0 0, 0% 100%, 100% 100%);
        }
        .folder-card:hover { transform: translateY(-12px); box-shadow: var(--shadow-lg); }

        .folder-body {
          padding: 2.5rem; flex: 1; display: flex; flex-direction: column; gap: 1rem;
          position: relative; overflow: hidden; border-radius: 24px;
        }
        .folder-title {
          font-family: 'Courier New', monospace; font-size: 1.3rem; font-weight: 900;
          letter-spacing: -0.02em; line-height: 1.2; color: var(--text-primary);
        }
        .folder-options {
          position: absolute; top: 1.5rem; right: 1.5rem; z-index: 10;
          color: var(--text-secondary); transition: color 0.3s;
        }
        .folder-options:hover { color: #ef4444; }

        .folder-footer { margin-top: auto; display: flex; justify-content: space-between; align-items: center; }
        .folder-avatars { display: flex; align-items: center; }
        .avatar {
          width: 32px; height: 32px; border-radius: 50%;
          border: 2px solid var(--surface-color); margin-left: -8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.7rem; font-weight: 950; color: white;
        }
        .avatar:first-child { margin-left: 0; }
        .folder-meta { font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); }

        /* New Campaign Folder */
        .new-folder {
          border: 2px dashed var(--border-color);
          background: var(--surface-color);
          color: var(--text-secondary);
          box-shadow: none;
        }
        .new-folder .folder-title { color: var(--accent-primary); }
        .new-folder .folder-tab { border: 2px dashed var(--border-color); border-bottom: none; background: var(--surface-color); }
        .new-folder:hover { border-color: var(--accent-primary); color: var(--accent-primary); box-shadow: var(--shadow-md); }
        .create-plus { font-size: 3rem; font-weight: 300; margin-bottom: 0.5rem; color: var(--accent-primary); }
        .new-folder .folder-footer { color: var(--accent-tertiary); font-size: 0.85rem; font-weight: 600; }

        /* Hover Overlay */
        .folder-hover-overlay {
          position: absolute; inset: 0; background: rgba(10,0,16,0.88);
          backdrop-filter: blur(8px); display: flex; flex-direction: column;
          justify-content: center; align-items: center; gap: 1rem; padding: 2rem;
          opacity: 0; transition: all 0.3s; pointer-events: none; border-radius: 24px;
        }
        .folder-card:hover .folder-hover-overlay { opacity: 1; pointer-events: auto; }
        .folder-action-btn {
          width: 100%; padding: 0.8rem; border-radius: 12px; font-weight: 900;
          font-size: 0.75rem; letter-spacing: 0.1em; cursor: pointer; transition: all 0.3s;
        }
        .btn-view {
          background: rgba(255,255,255,0.12); color: white;
          border: 1px solid rgba(255,255,255,0.25);
        }
        .btn-launch {
          background: linear-gradient(135deg, #ff0077, #e87ba0);
          color: white; border: none;
          box-shadow: 0 4px 16px rgba(255,0,119,0.35);
        }
        .folder-action-btn:hover { transform: scale(1.05); }

        /* Performance View */
        .performance-view { padding-top: 1rem; }
        .perf-header {
          display: flex; justify-content: space-between; align-items: flex-end;
          margin-bottom: 3rem; border-bottom: 1px solid var(--border-color);
          padding-bottom: 2rem;
        }
        .back-btn {
          background: var(--surface-color);
          border: 1.5px solid var(--border-color);
          color: var(--text-primary);
          padding: 0.8rem 1.5rem; border-radius: 1rem; font-weight: 800;
          font-size: 0.75rem; letter-spacing: 0.1em;
          display: flex; align-items: center; gap: 0.75rem;
          cursor: pointer; transition: all 0.3s;
          box-shadow: var(--shadow-sm);
        }
        .back-btn:hover {
          border-color: var(--accent-primary); color: var(--accent-primary);
          transform: translateX(-5px); box-shadow: var(--shadow-md);
        }
        .perf-title { font-size: 2.2rem; font-weight: 950; color: var(--text-primary); margin: 0; }
        .perf-subtitle { font-size: 0.8rem; font-weight: 800; color: var(--accent-primary); letter-spacing: 0.1em; margin-top: 0.5rem; text-align: right; }

        .perf-content-grid { display: grid; grid-template-columns: 1fr 420px; gap: 3rem; align-items: start; }
        .perf-stats-panel {
          padding: 2.5rem; border-radius: 2.5rem;
          background: var(--surface-color);
          border: 1.5px solid var(--border-color);
          box-shadow: var(--shadow-md); overflow: hidden;
        }
        .stats-header {
          font-size: 0.7rem; font-weight: 900; color: var(--accent-primary);
          letter-spacing: 0.4em; margin-bottom: 3rem;
        }

        .svg-scroll-container {
          width: 100%; overflow-x: auto; padding-bottom: 2rem;
          scrollbar-width: thin; scrollbar-color: rgba(255,0,119,0.3) transparent;
        }
        .svg-scroll-container::-webkit-scrollbar { height: 4px; }
        .svg-scroll-container::-webkit-scrollbar-thumb { background: rgba(255,0,119,0.3); border-radius: 10px; }
        .svg-wrapper { min-width: 100%; }

        .data-point { transition: all 0.3s; cursor: pointer; }
        .chart-node-group:hover .data-point { r: 8; stroke-width: 4; }
        .chart-node-group:hover .score-label { font-size: 14px; opacity: 1; }
        .score-label { transition: all 0.3s; opacity: 0.85; }

        .perf-list-panel {}
        .list-header {
          font-size: 0.7rem; font-weight: 900; color: var(--text-secondary);
          letter-spacing: 0.25em; margin-bottom: 2rem;
        }
        .campaign-sessions-list { display: flex; flex-direction: column; gap: 1rem; }
        .horizontal-session-card {
          display: flex; align-items: center; gap: 1.5rem;
          background: var(--surface-color);
          border: 1.5px solid var(--border-color);
          padding: 1.25rem 1.75rem; border-radius: 1.5rem;
          transition: all 0.3s; box-shadow: var(--shadow-sm);
        }
        .horizontal-session-card:hover {
          border-color: var(--accent-primary);
          box-shadow: var(--shadow-md); transform: translateX(6px);
        }
        .session-id-pill {
          font-size: 0.65rem; font-weight: 900; letter-spacing: 0.08em;
          color: var(--text-secondary); margin-bottom: 0.25rem;
        }
        .candidate-name-text { font-size: 1rem; font-weight: 800; color: var(--text-primary); }
        .candidate-meta-text { font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.2rem; }
        .candidate-status-text { font-size: 0.7rem; font-weight: 900; letter-spacing: 0.08em; margin-top: 0.3rem; }
        .session-avatar-circle {
          width: 44px; height: 44px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: white; font-size: 1.2rem; font-weight: 900; flex-shrink: 0;
        }
        .score-ring-container { position: relative; width: 52px; height: 52px; flex-shrink: 0; }
        .score-ring-svg { width: 100%; height: 100%; transform: rotate(-90deg); }
        .score-ring-text {
          position: absolute; inset: 0; display: flex; align-items: center;
          justify-content: center; font-size: 0.85rem; font-weight: 900;
        }
        .card-left { flex-shrink: 0; }
        .card-mid { flex: 1; }
        .card-right { flex-shrink: 0; }

        /* Modal */
        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(10,0,16,0.75); backdrop-filter: blur(20px);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000; animation: modalFadeIn 0.3s ease-out;
        }
        @keyframes modalFadeIn { from { opacity: 0; } to { opacity: 1; } }
        .modal-content {
          width: 100%; max-width: 600px; padding: 4rem; border-radius: 2.5rem;
          background: var(--surface-color);
          border: 1.5px solid var(--border-color);
          box-shadow: var(--shadow-lg); position: relative;
        }
        .modal-close-btn {
          position: absolute; top: 1.5rem; right: 1.5rem;
          background: none; border: none; color: var(--text-secondary);
          cursor: pointer; transition: all 0.3s; padding: 0.5rem;
          display: flex; align-items: center; justify-content: center;
        }
        .modal-close-btn:hover { color: #ef4444; transform: rotate(90deg); }
        .modal-content h3 {
          font-size: 1.8rem; font-weight: 900; color: var(--text-primary);
          margin-bottom: 2rem; letter-spacing: -0.03em;
        }
        .form-group { margin-bottom: 1.75rem; }
        .form-group label {
          display: block; font-size: 0.72rem; font-weight: 800;
          color: var(--accent-primary); margin-bottom: 0.6rem;
          letter-spacing: 0.1em; text-transform: uppercase;
        }
        .form-group input, .form-group textarea {
          width: 100%; background: var(--bg-color);
          border: 1.5px solid var(--border-color);
          border-radius: 1rem; padding: 1rem 1.25rem;
          color: var(--text-primary); font-size: 1rem;
          transition: all 0.3s; font-family: inherit;
        }
        .form-group input::placeholder, .form-group textarea::placeholder { color: var(--text-secondary); }
        .form-group input:focus, .form-group textarea:focus {
          outline: none; border-color: var(--accent-primary);
          box-shadow: 0 0 0 4px rgba(255,0,119,0.12);
        }
        .modal-actions { display: flex; gap: 1.5rem; margin-top: 3rem; }
        .modal-actions button {
          flex: 1; padding: 1rem; border-radius: 1.25rem; font-weight: 900;
          font-size: 0.9rem; cursor: pointer; transition: all 0.3s; letter-spacing: 0.04em;
        }
        .btn-secondary {
          background: var(--bg-color); color: var(--text-secondary);
          border: 1.5px solid var(--border-color);
        }
        .btn-secondary:hover { border-color: var(--accent-primary); color: var(--accent-primary); }
        .btn-primary {
          background: linear-gradient(135deg, var(--accent-primary), var(--accent-tertiary));
          color: white; border: none;
          box-shadow: 0 8px 20px rgba(255,0,119,0.25);
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(255,0,119,0.35); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
      `}</style>
    </div>
  );
};

export default InterviewDashboard;

