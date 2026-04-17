import React, { useState } from 'react';
import { api } from '../api';

const JobPanel = ({ onWorkspaceCreated }) => {
  const [jobTitle, setJobTitle] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [minScore, setMinScore] = useState(75);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!jobDesc || !jobTitle) {
      alert("Please enter a job title and description first.");
      return;
    }
    setIsCreating(true);
    try {
      const data = await api.post('/api/workspaces', {
        title: jobTitle.trim(),
        description: jobDesc,
        min_score: parseInt(minScore, 10)
      });
      if (data.id || data.workspace_id) {
        onWorkspaceCreated({
          id: data.id || data.workspace_id,
          title: data.title,
          description: data.description,
          min_score: data.min_score
        });
        setJobDesc('');
        setJobTitle('');
      }
    } catch (e) {
      alert("Failed to connect to backend Database.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="job-panel animate-slide-up">
      <h2 className="heading-3 job-heading">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        Create New Hiring Campaign
      </h2>
      
      <div className="input-group">
        <label>Job Title</label>
        <input 
          type="text" 
          list="job-titles"
          placeholder="Select an option or type manually..."
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          className="styled-input"
        />
        <datalist id="job-titles">
          <option value="Senior Software Engineer - Frontend" />
          <option value="Senior Backend Engineer" />
          <option value="Junior ML Engineer" />
          <option value="Senior ML Engineer" />
          <option value="Full Stack Developer" />
          <option value="DevOps Engineer" />
          <option value="Data Scientist" />
        </datalist>
      </div>

      <div className="input-group">
        <label>Job Description & Minimum Requirements</label>
        <textarea 
          value={jobDesc} 
          onChange={(e) => setJobDesc(e.target.value)} 
          className="styled-input styled-textarea"
          rows="5"
          placeholder="Paste the target job description here..."
        ></textarea>
      </div>

      <div className="input-group">
        <label style={{display: 'flex', justifyContent: 'space-between'}}>
          Target Minimum Score 
          <span style={{color: 'var(--accent-primary)', fontWeight: 'bold'}}>{minScore}</span>
        </label>
        <input 
          type="range" 
          min="50" 
          max="100" 
          step="5"
          value={minScore} 
          onChange={(e) => setMinScore(e.target.value)} 
          className="styled-range"
        />
        <span style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>
          Any AI score below this strict threshold will be automatically discarded as REJECT.
        </span>
      </div>

      <button className="btn-secondary update-btn" onClick={handleCreate} disabled={isCreating}>
        {isCreating ? "Saving..." : "Create Campaign Workspace"}
      </button>

      <style>{`
        .job-panel {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          background: var(--panel-bg);
          padding: 1.5rem;
          border-radius: 1rem;
          border: 1px solid var(--border-color);
        }

        .job-heading {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--success-color);
          margin-bottom: 0.5rem;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .input-group label {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .styled-input {
          background: var(--surface-color);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          font-family: inherit;
          font-size: 0.95rem;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .styled-input:focus {
          outline: none;
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
        }

        .styled-textarea {
          resize: vertical;
          line-height: 1.5;
        }

        .update-btn {
          margin-top: auto;
          align-self: flex-start;
        }
      `}</style>
    </div>
  );
};

export default JobPanel;
