import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import './App.css';
import Hero from './components/Hero';
import JobPanel from './components/JobPanel';
import UploadSection from './components/UploadSection';
import CandidateList from './components/CandidateList';
import WorkspaceTabs from './components/WorkspaceTabs';
import EditWorkspacePanel from './components/EditWorkspacePanel';
import TrustedBy from './components/TrustedBy';
import InterviewDashboard from './components/InterviewDashboard';
import VoicePortal from './components/VoicePortal';
import CandidateApplyForm from './components/CandidateApplyForm';
import RecruiterAuth from './components/RecruiterAuth';
import { supabase } from './supabaseClient';
import { api, setRecruiterId } from './api';

function App() {
  const [theme, setTheme] = useState('dark');
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [activeMode, setActiveMode] = useState('screening');
  const [interviewRole, setInterviewRole] = useState('recruiter');
  const [activeInterviewId, setActiveInterviewId] = useState(null);
  const [interviews, setInterviews] = useState([]);

  // ── Auth state ───────────────────────────────────────────────────────
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true); // prevent flash

  useEffect(() => {
    // Check for existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) setRecruiterId(u.id); // wire recruiter ID into all API calls
      setAuthLoading(false);
    });
    // Listen for auth changes (magic link clicks, signout, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) setRecruiterId(u.id);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };
  // ────────────────────────────────────────────────────────────────────

  // Load theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Load workspaces on initial mount or when user changes
  useEffect(() => {
    if (user) {
      fetchWorkspaces();
      fetchInterviews();
    } else {
      // Clear state when signed out
      setWorkspaces([]);
      setInterviews([]);
      setCandidates([]);
      setActiveWorkspaceId(null);
    }

    // Check for public application link (?apply=ID or ?apply_screening=ID)
    const params = new URLSearchParams(window.location.search);
    const applyId = params.get('apply');
    const screeningId = params.get('apply_screening');

    if (applyId) {
      setActiveMode('interview');
      // Direct the user straight into the Voice Portal to take the assessment
      setInterviewRole('candidate');
      setActiveInterviewId(applyId);
      // Fetch public interview data
      const API_BASE = import.meta.env.VITE_API_URL || '';
      fetch(`${API_BASE}/api/interviews/public/${applyId}`)
        .then(res => res.json())
        .then(data => {
          if (data.interview) setInterviews([data.interview]);
        });
    } else if (screeningId) {
      setActiveMode('screening_apply');
      setActiveWorkspaceId(screeningId);
      // Fetch public workspace data
      const API_BASE = import.meta.env.VITE_API_URL || '';
      fetch(`${API_BASE}/api/workspaces/public/${screeningId}`)
        .then(res => res.json())
        .then(data => {
          if (data.workspace) setWorkspaces([data.workspace]);
        });
    }
  }, [user?.id]);

  // Fetch candidates whenever active workspace changes
  useEffect(() => {
    setIsEditing(false); // Reset edit view when switching tabs
    if (activeWorkspaceId) {
      fetchHistoricalCandidates(activeWorkspaceId);
    } else {
      setCandidates([]); // Clear candidates if we are on "New Campaign" tab
    }
  }, [activeWorkspaceId]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const fetchWorkspaces = async () => {
    try {
      const data = await api.get('/api/workspaces');
      setWorkspaces(data.workspaces || []);
      if (data.workspaces && data.workspaces.length > 0 && !activeWorkspaceId) {
        setActiveWorkspaceId(data.workspaces[0].id);
      }
    } catch (e) {
      console.error("Failed to fetch workspaces", e);
    }
  };

  const fetchInterviews = async () => {
    try {
      const data = await api.get('/api/interviews');
      setInterviews(data.interviews || []);
    } catch (e) {
      console.error("Failed to fetch interviews", e);
    }
  };

  const handleStartTest = (id) => {
    setActiveInterviewId(id);
    setInterviewRole('candidate');
  };

  const fetchHistoricalCandidates = async (id) => {
    try {
      const data = await api.get(`/api/workspaces/${id}/candidates`);
      setCandidates(data.candidates || []);
    } catch (e) {
      console.error("Failed to fetch candidates", e);
    }
  };

  const handleMatchResults = (newResults) => {
    setCandidates(prev => {
      const combined = [...prev, ...newResults];
      return combined.sort((a, b) => b.overall_score - a.overall_score);
    });
  };

  const handleWorkspaceCreated = (newWorkspace) => {
    setWorkspaces(prev => [newWorkspace, ...prev]);
    setActiveWorkspaceId(newWorkspace.id);
  };

  const getActiveWorkspaceMeta = () => {
    return workspaces.find(w => w.id === activeWorkspaceId);
  };

  // ── Public apply links bypass auth gate ─────────────────────────────
  const params = new URLSearchParams(window.location.search);
  const isPublicApply = params.get('apply') || params.get('apply_screening');

  // Show full-screen loader while resolving session
  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#07080a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '32px', height: '32px', border: '2px solid rgba(255,255,227,0.1)', borderTopColor: '#0E836D', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Show auth gate for non-public routes when not logged in
  if (!user && !isPublicApply) {
    return <RecruiterAuth onAuthSuccess={(u) => setUser(u)} />;
  }

  return (
    <div className="app-wrapper">
      <Navbar
        theme={theme}
        toggleTheme={toggleTheme}
        activeMode={activeMode}
        setActiveMode={setActiveMode}
        user={user}
        onSignOut={handleSignOut}
      />

      <main className="container" style={{ paddingBottom: '6rem' }}>
        {activeMode === 'screening' ? (
          <>
            <Hero />
            <TrustedBy />

            <div className="dashboard-grid glass-panel" style={{ padding: '2.5rem', marginTop: '0' }}>

              <WorkspaceTabs
                workspaces={workspaces}
                activeWorkspaceId={activeWorkspaceId}
                onSelectWorkspace={(id) => setActiveWorkspaceId(id)}
                onNewWorkspace={() => setActiveWorkspaceId(null)}
                onDeleteWorkspace={async (id) => {
                  try {
                    await api.delete(`/api/workspaces/${id}`);
                    setWorkspaces(prev => prev.filter(w => w.id !== id));
                    if (activeWorkspaceId === id) setActiveWorkspaceId(null);
                  } catch (e) {
                    console.error("Failed to delete workspace", e);
                  }
                }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {activeWorkspaceId === null ? (
                  <>
                    <JobPanel onWorkspaceCreated={handleWorkspaceCreated} />
                    <UploadSection activeWorkspace={null} onMatchResults={handleMatchResults} />
                  </>
                ) : isEditing ? (
                  <>
                    <EditWorkspacePanel
                      workspace={getActiveWorkspaceMeta()}
                      onSave={(updatedWorkspace) => {
                        setWorkspaces(prev => prev.map(w => w.id === updatedWorkspace.id ? updatedWorkspace : w));
                        setIsEditing(false);
                      }}
                      onCancel={() => setIsEditing(false)}
                      onDelete={(id) => {
                        setWorkspaces(prev => prev.filter(w => w.id !== id));
                        setActiveWorkspaceId(null);
                        setIsEditing(false);
                      }}
                    />
                    <UploadSection
                      activeWorkspace={getActiveWorkspaceMeta()}
                      onMatchResults={handleMatchResults}
                    />
                  </>
                ) : (
                  <>
                    <div className="active-workspace-card animate-fade-in">
                      <div className="workspace-card-header">
                        <div className="status-indicator">
                          <span className="dot"></span> ACTIVE CAMPAIGN
                        </div>
                        <button onClick={() => setIsEditing(true)} className="btn-icon">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                        </button>
                      </div>

                      <h2 className="workspace-title">{getActiveWorkspaceMeta()?.title}</h2>

                      <div className="workspace-desc">
                        {getActiveWorkspaceMeta()?.description}
                      </div>

                      <div className="link-professional-wrapper animate-fade-in" style={{ marginTop: '2rem' }}>
                        <div className="link-title-row">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                          CANDIDATE APPLICATION LINK
                        </div>
                        <div className="link-professional-box">
                          <div className="link-text-content">
                            {window.location.origin}?apply_screening={activeWorkspaceId}
                          </div>
                          <button
                            className="link-professional-btn"
                            onClick={(e) => {
                              const link = `${window.location.origin}?apply_screening=${activeWorkspaceId}`;
                              navigator.clipboard.writeText(link);
                              const btn = e.currentTarget;
                              const originalText = btn.innerHTML;
                              btn.innerHTML = "<span>Copied!</span>";
                              btn.classList.add('copied');
                              setTimeout(() => {
                                btn.innerHTML = originalText;
                                btn.classList.remove('copied');
                              }, 2000);
                            }}
                          >
                            <span>Copy Link</span>
                          </button>
                        </div>
                        <p className="link-subtitle">
                          Share this link with candidates — they can apply directly and will be automatically rated in this campaign.
                        </p>
                      </div>

                      <div className="workspace-stats">
                        <div className="w-stat">
                          <span className="w-label">MINIMUM SCORE</span>
                          <span className="w-value">{getActiveWorkspaceMeta()?.min_score || 75}</span>
                        </div>
                        <div className="w-stat">
                          <span className="w-label">TARGET ROLE</span>
                          <span className="w-value">Standard</span>
                        </div>
                      </div>
                    </div>
                    <UploadSection
                      activeWorkspace={getActiveWorkspaceMeta()}
                      onMatchResults={handleMatchResults}
                    />
                  </>
                )}
              </div>

              <div style={{ marginTop: '3rem' }}>
                <CandidateList
                  candidatesData={candidates}
                  activeWorkspace={getActiveWorkspaceMeta()}
                  onClearAll={async () => {
                    if (!window.confirm("Are you sure you want to delete all candidates for this campaign?")) return;
                    try {
                      await api.delete(`/api/workspaces/${activeWorkspaceId}/candidates`);
                      setCandidates([]);
                    } catch (e) {
                      console.error("Failed to clear candidates", e);
                    }
                  }}
                />
              </div>
            </div>
          </>
        ) : activeMode === 'screening_apply' ? (
          <CandidateApplyForm
            type="screening"
            interviewId={activeWorkspaceId}
            data={workspaces}
            onBack={() => {
              setActiveMode('screening');
              window.history.replaceState({}, '', window.location.pathname);
            }}
          />
        ) : (
          <div className="interview-portal-wrapper animate-fade-in" style={{ paddingTop: '5.5rem' }}>
            {interviewRole === 'recruiter' ? (
              <InterviewDashboard
                interviews={interviews}
                onRefreshInterviews={fetchInterviews}
                onStartTest={handleStartTest}
              />
            ) : interviewRole === 'public_apply' ? (
              <CandidateApplyForm
                interviewId={activeInterviewId}
                interviews={interviews}
                onBack={() => {
                  setInterviewRole('recruiter');
                  window.history.replaceState({}, '', window.location.pathname);
                }}
              />
            ) : (
              <VoicePortal
                interviews={interviews}
                activeInterviewId={activeInterviewId}
                onBack={() => setInterviewRole('recruiter')}
              />
            )}
          </div>
        )}
      </main>

      <style>{`
        .app-wrapper {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .dashboard-grid {
          animation: slideUp 0.8s ease forwards;
          animation-delay: 0.2s;
          opacity: 0;
        }

        /* Professional Campaign Card */
        .active-workspace-card {
          background: var(--surface-color);
          border: 1.5px solid var(--border-color);
          border-radius: 1.25rem;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          height: 100%;
        }

        .dark .active-workspace-card {
          background: var(--panel-bg);
        }

        .workspace-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.65rem;
          font-weight: 800;
          color: var(--accent-primary);
          letter-spacing: 0.05em;
        }

        .status-indicator .dot {
          width: 6px;
          height: 6px;
          background: var(--accent-primary);
          border-radius: 50%;
          box-shadow: 0 0 8px var(--accent-primary);
        }

        .workspace-title {
          font-size: 1.5rem;
          margin: 0;
          color: var(--text-primary);
        }

        .workspace-desc {
          font-size: 0.95rem;
          color: var(--text-secondary);
          line-height: 1.6;
          max-height: 100px;
          overflow-y: auto;
          background: rgba(0,0,0,0.1);
          padding: 0.75rem;
          border-radius: 0.5rem;
        }

        .workspace-stats {
          display: flex;
          gap: 1.5rem;
          margin-top: auto;
        }

        .w-stat {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .w-label {
          font-size: 0.6rem;
          font-weight: 700;
          color: var(--text-secondary);
        }

        .w-value {
          font-size: 1rem;
          font-weight: 800;
          color: var(--text-primary);
        }

        .btn-icon {
          background: transparent;
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .btn-icon:hover {
          color: var(--accent-primary);
          border-color: var(--accent-primary);
        }

        @media (max-width: 768px) {
          .dashboard-grid > div:nth-child(2) {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

export default App;
