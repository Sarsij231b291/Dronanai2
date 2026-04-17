import React from 'react';

const WorkspaceTabs = ({ workspaces, activeWorkspaceId, onSelectWorkspace, onNewWorkspace, onDeleteWorkspace }) => {
  return (
    <div className="workspace-tabs-container">
      <div className="tabs-scroll">
        <button 
          className={`workspace-tab new-tab ${!activeWorkspaceId ? 'active' : ''}`}
          onClick={onNewWorkspace}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          New Campaign
        </button>
        
        {workspaces.map(w => (
          <div
            key={w.id}
            className={`workspace-tab-wrapper ${activeWorkspaceId === w.id ? 'active' : ''}`}
          >
            <button
              className={`workspace-tab ${activeWorkspaceId === w.id ? 'active' : ''}`}
              onClick={() => onSelectWorkspace(w.id)}
            >
              {w.title}
            </button>
            <button
              className="tab-close-btn"
              title="Remove campaign"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteWorkspace && onDeleteWorkspace(w.id);
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <style>{`
        .workspace-tabs-container {
          margin-bottom: 2rem;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 0px;
        }

        .tabs-scroll {
          display: flex;
          gap: 0.5rem;
          overflow-x: auto;
          scrollbar-width: none; /* Firefox */
        }
        
        .tabs-scroll::-webkit-scrollbar { 
          display: none; /* Chrome */
        }

        .workspace-tab {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          padding: 0.75rem 1.25rem;
          font-family: inherit;
          font-weight: 500;
          font-size: 0.9rem;
          border-bottom: 3px solid transparent;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .workspace-tab:hover {
          color: var(--text-primary);
          background: rgba(255,255,255,0.03);
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
        }

        .workspace-tab.active {
          color: var(--accent-primary);
          border-bottom-color: var(--accent-primary);
        }

        .workspace-tab-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .workspace-tab-wrapper .tab-close-btn {
          display: none;
          position: absolute;
          right: -4px;
          top: 4px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: none;
          background: var(--danger-color);
          color: white;
          font-size: 0.85rem;
          line-height: 1;
          cursor: pointer;
          align-items: center;
          justify-content: center;
          padding: 0;
          transition: all 0.2s;
          z-index: 10;
        }

        .workspace-tab-wrapper:hover .tab-close-btn {
          display: flex;
        }

        .tab-close-btn:hover {
          background: #cc0000;
          transform: scale(1.15);
        }

        .new-tab {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          color: var(--success-color);
        }
        
        .new-tab:hover {
          color: var(--success-color);
        }
        
        .new-tab.active {
          color: var(--success-color);
          border-bottom-color: var(--success-color);
        }
      `}</style>
    </div>
  );
};

export default WorkspaceTabs;
