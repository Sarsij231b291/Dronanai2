import React, { useState, useEffect } from 'react';

const Navbar = ({ theme, toggleTheme, activeMode, setActiveMode, user, onSignOut }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-content">
        {/* Logo */}
        <div className="logo-section">
          <div className="logo-mark-wrap">
            <svg className="logo-mark" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="2" width="28" height="28" rx="8" stroke="currentColor" strokeWidth="2"/>
              <path d="M10 16h12M16 10l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="logo-text-wrap">
            <span className="logo-text">DRONA</span>
            <span className="logo-sub">AI</span>
          </div>
        </div>

        {/* Portal Switcher */}
        <div className="portal-switcher">
          <button
            className={`portal-btn ${activeMode === 'screening' ? 'active' : ''}`}
            onClick={() => setActiveMode('screening')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            Screening
          </button>
          <button
            className={`portal-btn ${activeMode === 'interview' ? 'active' : ''}`}
            onClick={() => setActiveMode('interview')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
            Interview
          </button>
        </div>

        {/* Actions */}
        <div className="nav-actions">
          <div className="nav-status-pill">
            <span className="status-dot" />
            <span>LLM Online</span>
          </div>
          {user && (
            <div className="nav-user-chip">
              <div className="nav-user-avatar">
                {(user.email || user.user_metadata?.full_name || 'R')[0].toUpperCase()}
              </div>
              <span className="nav-user-email">
                {user.user_metadata?.full_name || user.email?.split('@')[0]}
              </span>
              <button className="nav-signout-btn" onClick={onSignOut} title="Sign out">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
                </svg>
              </button>
            </div>
          )}
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle Theme">
            {theme === 'dark' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      <style>{`
        .navbar {
          position: fixed;
          top: 1.2rem;
          left: 50%;
          transform: translateX(-50%);
          width: calc(100% - 4rem);
          max-width: 1160px;
          z-index: 1000;
          background: var(--glass-bg);
          backdrop-filter: blur(24px) saturate(1.4);
          -webkit-backdrop-filter: blur(24px) saturate(1.4);
          border: 1px solid var(--glass-border);
          border-radius: 1rem;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: var(--shadow-sm);
        }

        .navbar.scrolled {
          box-shadow: var(--shadow-md);
          background: var(--glass-bg);
          top: 0.75rem;
        }

        .nav-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 3.75rem;
          padding: 0 1.5rem;
        }

        /* Logo */
        .logo-section {
          display: flex;
          align-items: center;
          gap: 0.65rem;
        }

        .logo-mark-wrap {
          width: 34px;
          height: 34px;
          background: var(--ink-charcoal);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--ink-ivory);
          flex-shrink: 0;
          transition: transform 0.3s;
        }

        .dark .logo-mark-wrap {
          background: var(--ink-ivory);
          color: var(--ink-charcoal);
        }

        .logo-mark-wrap:hover { transform: rotate(-8deg) scale(1.05); }

        .logo-mark { width: 18px; height: 18px; }

        .logo-text-wrap {
          display: flex;
          align-items: baseline;
          gap: 0.25rem;
        }

        .logo-text {
          font-family: var(--font-heading);
          font-size: 1.05rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: var(--text-primary);
        }

        .logo-sub {
          font-family: var(--font-mono);
          font-size: 0.65rem;
          font-weight: 700;
          color: var(--ink-steel);
          border: 1px solid var(--border-color);
          padding: 1px 5px;
          border-radius: 4px;
          letter-spacing: 0.06em;
        }

        /* Portal Switcher */
        .portal-switcher {
          display: flex;
          background: rgba(74, 74, 74, 0.06);
          padding: 0.2rem;
          border-radius: 0.75rem;
          border: 1px solid var(--border-color);
          gap: 0.2rem;
        }

        .dark .portal-switcher {
          background: rgba(255, 255, 227, 0.04);
        }

        .portal-btn {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.45rem 1rem;
          border-radius: 0.55rem;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-family: var(--font-heading);
          font-size: 0.82rem;
          font-weight: 500;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          letter-spacing: 0.01em;
        }

        .portal-btn.active {
          background: var(--ink-charcoal);
          color: var(--ink-ivory);
          box-shadow: 0 2px 8px rgba(74, 74, 74, 0.2);
        }

        .dark .portal-btn.active {
          background: var(--ink-ivory);
          color: var(--ink-charcoal);
        }

        .portal-btn:not(.active):hover {
          background: rgba(74, 74, 74, 0.07);
          color: var(--text-primary);
        }

        /* Nav Actions */
        .nav-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        /* User Chip */
        .nav-user-chip {
          display: flex; align-items: center; gap: 0.5rem;
          background: rgba(14,131,109,0.08);
          border: 1px solid rgba(14,131,109,0.2);
          border-radius: 999px;
          padding: 0.25rem 0.6rem 0.25rem 0.25rem;
        }
        .nav-user-avatar {
          width: 22px; height: 22px; border-radius: 50%;
          background: #0E836D;
          color: #FFFFE3;
          font-size: 0.65rem; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Space Grotesk', sans-serif;
          flex-shrink: 0;
        }
        .nav-user-email {
          font-family: var(--font-mono);
          font-size: 0.6rem; color: rgba(255,255,227,0.6);
          letter-spacing: 0.04em; max-width: 120px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .nav-signout-btn {
          background: transparent; border: none;
          color: rgba(255,255,227,0.3);
          cursor: pointer; padding: 2px;
          display: flex; align-items: center;
          transition: color 0.2s;
        }
        .nav-signout-btn:hover { color: #ef4444; }

        .nav-status-pill {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          font-family: var(--font-mono);
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: var(--ink-steel);
          border: 1px solid var(--border-color);
          padding: 0.3rem 0.75rem;
          border-radius: 999px;
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--success-color);
          animation: pulse 2s infinite;
        }

        .theme-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          width: 36px;
          height: 36px;
          border-radius: 0.65rem;
          transition: all 0.2s ease;
        }

        .theme-toggle svg {
          width: 16px;
          height: 16px;
        }

        .theme-toggle:hover {
          background: var(--surface-color);
          border-color: var(--ink-steel);
          color: var(--ink-steel);
        }

        @media (max-width: 768px) {
          .portal-switcher { display: none; }
          .nav-status-pill { display: none; }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
