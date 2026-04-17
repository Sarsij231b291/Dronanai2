import React, { useState } from 'react';

const EditWorkspacePanel = ({ workspace, onSave, onCancel, onDelete }) => {
  const [jobTitle, setJobTitle] = useState(workspace.title);
  const [jobDesc, setJobDesc] = useState(workspace.description);
  const [minScore, setMinScore] = useState(workspace.min_score || 75);
  const [isSaving, setIsSaving] = useState(false);

  const handleUpdate = async () => {
    if (!jobDesc || !jobTitle) {
      alert("Please enter a job title and description first.");
      return;
    }

    setIsSaving(true);
    try {
      const API_BASE = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${API_BASE}/api/workspaces/${workspace.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: jobTitle.trim(),
          description: jobDesc,
          min_score: parseInt(minScore, 10)
        })
      });

      if (response.ok) {
        onSave({
          id: workspace.id,
          title: jobTitle.trim(),
          description: jobDesc,
          min_score: parseInt(minScore, 10)
        });
      } else {
        alert("Failed to save changes.");
      }
    } catch (e) {
      alert("Failed to connect to backend Database.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to permanently delete the campaign "${workspace.title}" and ALL of its candidate data?`)) {
      try {
        const API_BASE = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${API_BASE}/api/workspaces/${workspace.id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          onDelete(workspace.id);
        } else {
          alert("Failed to delete campaign.");
        }
      } catch (e) {
        alert("Failed to connect to backend Database.");
      }
    }
  };

  return (
    <div className="job-panel animate-slide-up" style={{ border: '1px solid var(--accent-primary)', boxShadow: '0 0 15px rgba(99, 102, 241, 0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h2 className="heading-3 job-heading" style={{ color: 'var(--accent-primary)', margin: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.5rem' }}>
            <path d="M12 20h9"></path>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
          </svg>
          Edit Campaign
        </h2>
        <button onClick={handleDelete} title="Delete Campaign" style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>

      <div className="input-group">
        <label>Job Title</label>
        <input
          type="text"
          list="job-titles"
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
        ></textarea>
      </div>

      <div className="input-group">
        <label style={{ display: 'flex', justifyContent: 'space-between' }}>
          Target Minimum Score
          <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>{minScore}</span>
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
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto' }}>
        <button className="btn-primary" onClick={handleUpdate} disabled={isSaving} style={{ flex: 1 }}>
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
        <button className="btn-secondary" onClick={onCancel} disabled={isSaving} style={{ flex: 1 }}>
          Cancel
        </button>
      </div>

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
          width: 100%;
          box-sizing: border-box;
        }

        .styled-input:focus {
          outline: none;
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
        }

        .styled-textarea {
          resize: vertical;
          line-height: 1.5;
          width: 100%;
        }
        
        .styled-range {
          width: 100%;
          accent-color: var(--accent-primary);
        }
      `}</style>
    </div>
  );
};

export default EditWorkspacePanel;
