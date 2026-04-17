import React, { useState, useEffect } from 'react';
import { api } from '../api';

const CandidateList = ({ candidatesData, activeWorkspace, onClearAll }) => {
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [localCandidates, setLocalCandidates] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    setLocalCandidates(candidatesData || []);
  }, [candidatesData]);

  if (!localCandidates || localCandidates.length === 0) {
    return (
      <div className="empty-state animate-fade-in" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1rem', opacity: 0.5 }}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
        <p>No candidates analyzed yet. Upload resumes to see intelligent matching results.</p>
      </div>
    );
  }

  const toggleExpand = (uniqueKey) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(uniqueKey)) { next.delete(uniqueKey); } else { next.add(uniqueKey); }
      return next;
    });
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await api.patch(`/api/candidates/${id}/recommendation`, { recommendation: newStatus });
      setLocalCandidates(prev =>
        prev.map(c => c.id === id ? { ...c, recommendation: newStatus } : c)
      );
    } catch (e) {
      console.error("Failed to update status:", e);
      alert("Failed to update candidate status.");
    }
  };

  const handleInvite = async () => {
    const shortlisted = localCandidates.filter(c => c.recommendation === 'SHORTLIST');
    if (shortlisted.length === 0) {
      alert("No shortlisted candidates to invite.");
      return;
    }

    let link = '';
    if (activeWorkspace && activeWorkspace.interview_id) {
      link = `${window.location.origin}?apply=${activeWorkspace.interview_id}`;
    } else {
      link = prompt("Enter the mock interview link to send to candidates:", `${window.location.origin}?apply=123`);
      if (!link) return;
    }

    // Use the actual email from the database (either captured from form or extracted from resume).
    // If somehow missing, fallback to a placeholder.
    const emails = shortlisted.map(c => {
      if (c.candidate?.email) {
        return c.candidate.email;
      }
      const namePart = (c.candidate?.name || "candidate").split(' ')[0].toLowerCase();
      return `${namePart}@example.com`;
    });

    const confirmed = window.confirm(`Send invitations to ${emails.length} candidates?\n\nInterview Link: ${link}\n\nSending to: \n${emails.join('\n')}`);
    if (!confirmed) return;

    setIsInviting(true);
    const API_BASE = import.meta.env.VITE_API_URL || '';
    try {
      const response = await fetch(`${API_BASE}/api/candidates/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails, interview_link: link })
      });
      const data = await response.json();
      if (data.sent > 0) {
        alert(`Successfully sent ${data.sent} of ${data.total} invitations!`);
      } else {
        const errorDetails = data.errors && data.errors.length > 0 ? data.errors[0] : "";
        alert(`Failed to send emails.\n\nServer Error:\n${errorDetails}`);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to send invitations.");
    } finally {
      setIsInviting(false);
    }
  };

  const filteredCandidates = localCandidates.filter(c =>
    activeTab === 'ALL' ? true : c.recommendation === activeTab
  );

  return (
    <div className="candidates-container animate-fade-in" style={{ animationDelay: '0.3s' }}>
      <div className="candidates-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h2 className="heading-2">System Ranked Matches</h2>
          <div className="tabs-container" style={{ marginLeft: '2rem' }}>
            {['ALL', 'SHORTLIST', 'REVIEW', 'REJECT'].map(tab => (
              <button
                key={tab}
                className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          {activeTab === 'SHORTLIST' && (
            <button className="btn-primary" onClick={handleInvite} disabled={isInviting} style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
              {isInviting ? "Sending..." : "Send Mock Interview Links"}
            </button>
          )}

          {localCandidates.length > 0 && onClearAll && (
            <button
              className="btn-secondary"
              onClick={onClearAll}
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              title="Delete all analyzed resumes for this campaign"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18"></path>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              Clear All
            </button>
          )}
        </div>
      </div>

      <div className="candidates-grid">
        {filteredCandidates.map((result, index) => {
          const uniqueKey = result.id !== undefined && result.id !== null ? result.id : `idx-${index}`;
          const isExpanded = expandedIds.has(uniqueKey);
          return (
            <div className={`candidate-card ${isExpanded ? 'expanded' : ''}`} key={uniqueKey} style={{ animationDelay: `${0.1 + index * 0.05}s` }}>

              {/* Header section with Score */}
              <div className="card-header">
                <div className="avatar">
                  {result.candidate?.name?.charAt(0) || "U"}
                </div>
                <div className="info">
                  <h3>{result.candidate?.name || "Unknown Candidate"}</h3>
                  <p>{result.candidate?.role || "Applicant"} • {result.candidate?.experience_years || "?"} yrs exp</p>
                  <div style={{ marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      fontSize: '0.75rem', fontWeight: 'bold',
                      color: result.recommendation === "SHORTLIST" ? 'var(--success-color)' : result.recommendation === "REVIEW" ? 'var(--warning-color)' : 'var(--text-secondary)'
                    }}>
                      {result.recommendation}
                    </span>
                  </div>
                </div>
                <div className="score-container">
                  <div className="circular-progress" style={{ '--progress': `${result.overall_score}%` }}>
                    <span>{result.overall_score}</span>
                  </div>
                </div>
              </div>

              {/* Basic AI Findings (Always Visible) */}
              <div className="card-body">
                <div className="metrics-row">
                  <span className="metric"><small>Tech Fit:</small> {result.match_details?.technical_fit || "N/A"}</span>
                  <span className="metric"><small>Exp Fit:</small> {result.match_details?.experience_fit || "N/A"}</span>
                </div>

                {/* Detailed Findings (Conditional) */}
                {isExpanded && (
                  <div className="expanded-details animate-fade-in">
                    <div className="findings">
                      <strong>Top Strengths:</strong>
                      <ul>
                        {(result.top_strengths || []).map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>

                    {result.skill_gaps && result.skill_gaps.length > 0 && (
                      <div className="findings gap-findings">
                        <strong>Skill Gaps:</strong>
                        <ul>
                          {result.skill_gaps.map((g, i) => <li key={i}>{g}</li>)}
                        </ul>
                      </div>
                    )}

                    {result.red_flags && result.red_flags.length > 0 && (
                      <div className="red-flags-section">
                        <div className="red-flags-header">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                            <line x1="12" y1="9" x2="12" y2="13"></line>
                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                          </svg>
                          <strong>RED FLAGS</strong>
                        </div>
                        <div className="red-flags-list">
                          {result.red_flags.map((flag, i) => (
                            <div className="red-flag-pill" key={i}>{flag}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="bias-indicator">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  {result.bias_check || "Objective Evaluation Applied"}
                </div>
              </div>

              <div className="card-actions">
                <select
                  className="status-dropdown"
                  value={result.recommendation}
                  onChange={(e) => handleUpdateStatus(result.id, e.target.value)}
                >
                  <option value="SHORTLIST">Shortlist</option>
                  <option value="REVIEW">Review</option>
                  <option value="REJECT">Reject</option>
                </select>

                <button
                  className={`btn-primary view-btn ${isExpanded ? 'active' : ''}`}
                  onClick={() => toggleExpand(uniqueKey)}
                >
                  {isExpanded ? 'Hide Full Report' : 'View Full Report'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .candidates-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .candidates-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 1rem;
        }

        .tabs-container {
          display: flex;
          background: rgba(255, 255, 255, 0.03);
          padding: 0.25rem;
          border-radius: 0.75rem;
          border: 1px solid var(--border-color);
        }

        .tab-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          padding: 0.4rem 1rem;
          border-radius: 0.5rem;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tab-btn:hover {
          color: white;
        }

        .tab-btn.active {
          background: var(--surface-color);
          color: var(--accent-primary);
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }

        .candidates-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
          align-items: start;
        }

        .candidate-card {
          background: var(--surface-color);
          border: 1px solid var(--border-color);
          border-radius: 1.25rem;
          padding: 1.5rem;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          animation: slideUp 0.6s ease forwards;
          opacity: 0;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          box-sizing: border-box;
        }

        .candidate-card.expanded {
          border-color: var(--accent-primary);
          box-shadow: 0 10px 30px rgba(99, 102, 241, 0.1);
        }

        .candidate-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-md);
          border-color: var(--accent-primary);
        }

        .card-header {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          flex-shrink: 0;
        }

        .avatar {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          font-weight: 700;
          flex-shrink: 0;
        }

        .info {
          flex: 1;
          min-width: 0;
        }

        .info h3 {
          font-size: 1rem;
          color: var(--text-primary);
          margin-bottom: 0.2rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .info p {
          font-size: 0.8rem;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .score-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex-shrink: 0;
        }

        .card-body {
          background: var(--bg-color);
          border: 1px solid var(--border-color);
          border-radius: 1rem;
          padding: 1rem 1.25rem;
          font-size: 0.875rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          transition: all 0.3s ease;
          flex: 1;
          min-height: 0;
          overflow: hidden;
        }

        .dark .card-body {
          background: rgba(15, 23, 42, 0.4);
          border-color: rgba(255, 255, 255, 0.05);
        }

        .metrics-row {
          display: flex;
          justify-content: space-between;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 0.75rem;
          flex-shrink: 0;
        }

        .metric {
          font-weight: bold;
          color: var(--accent-primary);
        }
        
        .metric small {
          color: var(--text-secondary);
          font-weight: normal;
          margin-right: 0.25rem;
        }

        .bias-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--success-color);
          font-weight: 500;
          font-size: 0.75rem;
          flex-shrink: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .expanded-details {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 1rem;
          overflow-y: auto;
        }

        .findings strong {
          color: var(--text-primary);
          display: block;
          margin-bottom: 0.25rem;
        }

        .findings ul {
          margin: 0;
          padding-left: 1.2rem;
          color: var(--text-secondary);
        }
        
        .gap-findings strong {
          color: #fbbf24;
        }

        .red-flags-section {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .red-flags-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #f87171;
          font-size: 0.75rem;
          letter-spacing: 0.05em;
        }

        .red-flag-pill {
          background: rgba(248, 113, 113, 0.1);
          border: 1px solid rgba(248, 113, 113, 0.2);
          color: #fca5a5;
          padding: 0.6rem 1rem;
          border-radius: 0.75rem;
          font-size: 0.8rem;
          line-height: 1.4;
        }

        .card-actions {
          display: flex;
          gap: 0.75rem;
          flex-shrink: 0;
          margin-top: auto;
          padding-top: 0.5rem;
        }

        .status-dropdown {
          background: var(--bg-color);
          color: var(--text-primary);
          border: 1px solid var(--border-color);
          border-radius: 0.75rem;
          padding: 0 1rem;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          outline: none;
        }
        
        .status-dropdown:focus {
          border-color: var(--accent-primary);
        }

        .view-btn {
          flex: 1;
          padding: 0.75rem;
          font-size: 0.9rem;
          border-radius: 0.75rem;
          transition: all 0.3s;
        }

        .view-btn.active {
          background: var(--bg-color);
          border: 1px solid var(--accent-primary);
          color: var(--accent-primary);
        }
      `}</style>
    </div>
  );
};

export default CandidateList;
;

