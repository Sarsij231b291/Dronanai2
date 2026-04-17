import React, { useEffect, useRef } from 'react';

const Hero = () => {
  const orbRef = useRef(null);

  // Subtle mouse parallax on orbs
  useEffect(() => {
    const handleMouse = (e) => {
      if (!orbRef.current) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 24;
      const y = (e.clientY / window.innerHeight - 0.5) * 24;
      orbRef.current.style.transform = `translate(${x}px, ${y}px)`;
    };
    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, []);

  return (
    <section className="hero-section">

      {/* Background Orbs */}
      <div className="hero-orbs" ref={orbRef}>
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* Content */}
      <div className="hero-inner">

        {/* Left: Headline + Strip */}
        <div className="hero-left animate-fade-in">
          <div className="hero-eyebrow">
            <span className="eyebrow-dot" />
            <span>AI-Powered Blind Recruitment</span>
          </div>

          <h1 className="hero-headline">
            <span className="line-reveal" style={{ animationDelay: '0.1s' }}>Find Your</span>
            <span className="line-reveal line-accent" style={{ animationDelay: '0.25s' }}>Champions.</span>
            <span className="line-reveal line-sub" style={{ animationDelay: '0.4s' }}>Eliminate Bias.</span>
          </h1>

          {/* AI Stats Strip */}
          <div className="hero-stats animate-slide-up" style={{ animationDelay: '0.6s' }}>
            <div className="stat-item">
              <span className="stat-num">12.8K</span>
              <span className="stat-lbl">Resumes Ranked</span>
            </div>
            <div className="stat-sep" />
            <div className="stat-item">
              <span className="stat-num">99.2%</span>
              <span className="stat-lbl">Bias Eliminated</span>
            </div>
            <div className="stat-sep" />
            <div className="stat-item">
              <span className="stat-num">&lt;8s</span>
              <span className="stat-lbl">Per Resume</span>
            </div>
            <div className="stat-sep" />
            <div className="stat-item">
              <span className="stat-live-dot" />
              <span className="stat-lbl" style={{ fontWeight: 700 }}>LLM Online</span>
            </div>
          </div>
        </div>

        {/* Right: Flow Visualization */}
        <div className="hero-right animate-slide-right" style={{ animationDelay: '0.3s' }}>
          <div className="flow-card">

            {/* Header bar */}
            <div className="flow-card-header">
              <div className="flow-dots">
                <span /><span /><span />
              </div>
              <span className="flow-card-title">DRONA PIPELINE</span>
              <span className="flow-badge">LIVE</span>
            </div>

            {/* Pipeline nodes */}
            <div className="pipeline">
              {/* Node 1 */}
              <div className="pipeline-step">
                <div className="pipe-icon pipe-doc">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                </div>
                <div className="pipe-text">
                  <span className="pipe-name">Resume Intake</span>
                  <span className="pipe-sub">PDF / DOCX</span>
                </div>
                <div className="pipe-status status-done">✓</div>
              </div>

              <div className="pipe-connector">
                <div className="pipe-dot" style={{ animationDelay: '0s' }} />
                <div className="pipe-dot" style={{ animationDelay: '0.3s' }} />
                <div className="pipe-dot" style={{ animationDelay: '0.6s' }} />
              </div>

              {/* Node 2 — LLM Brain */}
              <div className="pipeline-step pipe-center">
                <div className="pipe-icon pipe-ai pulse-anim">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="4" y="4" width="16" height="16" rx="2"/>
                    <rect x="9" y="9" width="6" height="6"/>
                    <line x1="9" y1="1" x2="9" y2="4"/>
                    <line x1="15" y1="1" x2="15" y2="4"/>
                    <line x1="9" y1="20" x2="9" y2="23"/>
                    <line x1="15" y1="20" x2="15" y2="23"/>
                    <line x1="20" y1="9" x2="23" y2="9"/>
                    <line x1="20" y1="14" x2="23" y2="14"/>
                    <line x1="1" y1="9" x2="4" y2="9"/>
                    <line x1="1" y1="14" x2="4" y2="14"/>
                  </svg>
                </div>
                <div className="pipe-text">
                  <span className="pipe-name pipe-ai-label">LLM Brain</span>
                  <span className="pipe-sub">Semantic Analysis</span>
                </div>
                <div className="pipe-status status-live">●</div>
              </div>

              <div className="pipe-connector pipe-connector-right">
                <div className="pipe-dot pipe-dot-green" style={{ animationDelay: '0.1s' }} />
                <div className="pipe-dot pipe-dot-green" style={{ animationDelay: '0.4s' }} />
                <div className="pipe-dot pipe-dot-green" style={{ animationDelay: '0.7s' }} />
              </div>

              {/* Node 3 */}
              <div className="pipeline-step">
                <div className="pipe-icon pipe-result">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <div className="pipe-text">
                  <span className="pipe-name">Ranked Output</span>
                  <span className="pipe-sub">Bias-Free</span>
                </div>
                <div className="pipe-status status-done">✓</div>
              </div>
            </div>

            {/* Live ticker */}
            <div className="flow-ticker">
              <span className="ticker-label">LAST PROCESSED</span>
              <span className="ticker-val">Senior ML Engineer · Score 94 · SHORTLIST</span>
            </div>

          </div>
        </div>
      </div>

      <style>{`
        .hero-section {
          padding: 8rem 2rem 4rem;
          max-width: 1200px;
          margin: 0 auto;
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
        }

        /* Orbs */
        .hero-orbs {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          transition: transform 0.6s ease-out;
        }

        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.35;
        }

        .orb-1 {
          width: 380px;
          height: 380px;
          background: radial-gradient(circle, #6D8196, transparent);
          top: 10%;
          right: 5%;
          animation: orb-drift 14s ease-in-out infinite;
        }

        .orb-2 {
          width: 260px;
          height: 260px;
          background: radial-gradient(circle, #CBCBCB, transparent);
          bottom: 15%;
          left: 10%;
          animation: orb-drift 18s ease-in-out infinite reverse;
        }

        .orb-3 {
          width: 180px;
          height: 180px;
          background: radial-gradient(circle, #4A4A4A, transparent);
          top: 50%;
          left: 50%;
          animation: orb-drift 22s ease-in-out infinite;
          opacity: 0.15;
        }

        .dark .orb-1 { opacity: 0.25; }
        .dark .orb-2 { opacity: 0.2; }

        /* Hero Layout */
        .hero-inner {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 5rem;
          align-items: center;
          position: relative;
          z-index: 1;
          width: 100%;
        }

        @media (max-width: 900px) {
          .hero-inner { grid-template-columns: 1fr; gap: 3rem; }
          .hero-section { padding-top: 7rem; }
        }

        /* Left side */
        .hero-left { display: flex; flex-direction: column; gap: 2rem; }

        .hero-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          font-family: var(--font-mono);
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--ink-steel);
          border: 1px solid var(--border-color);
          padding: 0.3rem 0.9rem;
          border-radius: 999px;
          width: fit-content;
          background: var(--surface-color);
        }

        .eyebrow-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--ink-steel);
          animation: pulse 2s infinite;
        }

        /* Headline */
        .hero-headline {
          display: flex;
          flex-direction: column;
          font-family: var(--font-heading);
          font-size: clamp(3rem, 6vw, 5rem);
          font-weight: 700;
          line-height: 1;
          letter-spacing: -0.05em;
          gap: 0.1em;
        }

        .line-reveal {
          display: block;
          color: var(--text-primary);
          opacity: 0;
          animation: slideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .line-accent {
          color: var(--ink-steel);
          position: relative;
        }

        .line-accent::after {
          content: '';
          position: absolute;
          bottom: 4px;
          left: 0;
          right: 0;
          height: 4px;
          background: var(--ink-gray);
          border-radius: 2px;
          transform: scaleX(0);
          transform-origin: left;
          animation: inkReveal 0.8s 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .line-sub {
          color: var(--ink-gray);
          font-size: 0.65em;
          font-weight: 400;
          letter-spacing: -0.02em;
        }

        /* Stats Strip */
        .hero-stats {
          display: flex;
          align-items: center;
          gap: 0;
          background: var(--surface-color);
          border: 1px solid var(--border-color);
          border-radius: 1rem;
          padding: 1rem 1.5rem;
          width: fit-content;
          box-shadow: var(--shadow-sm);
          flex-wrap: wrap;
          row-gap: 0.5rem;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0 1.2rem;
          gap: 0.15rem;
        }

        .stat-num {
          font-family: var(--font-heading);
          font-size: 1.3rem;
          font-weight: 700;
          color: var(--ink-charcoal);
          letter-spacing: -0.04em;
        }

        .dark .stat-num { color: var(--ink-ivory); }

        .stat-lbl {
          font-family: var(--font-mono);
          font-size: 0.58rem;
          font-weight: 700;
          color: var(--text-secondary);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .stat-sep {
          width: 1px;
          height: 28px;
          background: var(--border-color);
          flex-shrink: 0;
        }

        .stat-live-dot {
          display: block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--success-color);
          margin-bottom: 0.2rem;
          animation: pulse 1.4s ease-in-out infinite;
        }

        /* ——— Flow Card (Right Side) ——— */
        .flow-card {
          background: var(--surface-color);
          border: 1.5px solid var(--border-color);
          border-radius: 1.5rem;
          padding: 1.75rem;
          box-shadow: var(--shadow-md);
          transition: box-shadow 0.4s;
          animation: floatY 6s ease-in-out infinite;
        }

        .flow-card:hover {
          box-shadow: var(--shadow-lg);
        }

        .flow-card-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.75rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border-color);
        }

        .flow-dots {
          display: flex;
          gap: 5px;
        }
        .flow-dots span {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--border-color);
        }
        .flow-dots span:nth-child(1) { background: #ff6b6b; }
        .flow-dots span:nth-child(2) { background: #ffd93d; }
        .flow-dots span:nth-child(3) { background: #6bcb77; }

        .flow-card-title {
          flex: 1;
          font-family: var(--font-mono);
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          color: var(--text-secondary);
        }

        .flow-badge {
          font-family: var(--font-mono);
          font-size: 0.58rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: var(--success-color);
          border: 1px solid var(--success-color);
          padding: 2px 8px;
          border-radius: 999px;
          animation: pulse 2s infinite;
        }

        /* Pipeline */
        .pipeline {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
          margin-bottom: 1.75rem;
        }

        .pipeline-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.6rem;
          width: 100px;
        }

        .pipe-connector {
          flex: 1;
          height: 2px;
          background: var(--border-color);
          position: relative;
          min-width: 32px;
        }

        .pipe-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--ink-steel);
          opacity: 0;
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          left: 0;
          animation: moveData 1.8s linear infinite;
        }

        .pipe-dot-green {
          background: var(--success-color);
        }

        @keyframes moveData {
          0%   { left: 0%;   opacity: 0; }
          15%  { opacity: 1; }
          85%  { opacity: 1; }
          100% { left: 100%; opacity: 0; }
        }

        .pipe-icon {
          width: 52px;
          height: 52px;
          border-radius: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--panel-bg);
          border: 1.5px solid var(--border-color);
          color: var(--text-secondary);
          transition: all 0.3s;
          flex-shrink: 0;
        }

        .pipe-doc  { border-color: rgba(109,129,150,0.3); }
        .pipe-result { border-color: rgba(74,124,89,0.3);  color: var(--success-color); }

        .pipe-ai {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          border: 2px solid var(--ink-steel);
          color: var(--ink-steel);
          background: var(--surface-color);
          box-shadow: 0 0 0 6px rgba(109,129,150,0.08);
        }

        .pulse-anim {
          animation: aiPulse 2.5s ease-in-out infinite;
        }

        @keyframes aiPulse {
          0%, 100% { box-shadow: 0 0 0 6px rgba(109,129,150,0.08), 0 0 0 0 rgba(109,129,150,0.2); }
          50%       { box-shadow: 0 0 0 10px rgba(109,129,150,0.05), 0 0 20px rgba(109,129,150,0.15); }
        }

        .pipe-text {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.15rem;
          text-align: center;
        }

        .pipe-name {
          font-family: var(--font-heading);
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .pipe-ai-label { color: var(--ink-steel); }

        .pipe-sub {
          font-family: var(--font-mono);
          font-size: 0.58rem;
          color: var(--text-secondary);
          letter-spacing: 0.04em;
        }

        .pipe-status {
          font-size: 0.6rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 999px;
          font-family: var(--font-mono);
        }

        .status-done {
          color: var(--success-color);
          background: rgba(74,124,89,0.1);
          border: 1px solid rgba(74,124,89,0.2);
        }

        .status-live {
          color: var(--ink-steel);
          background: rgba(109,129,150,0.1);
          border: 1px solid rgba(109,129,150,0.2);
          animation: pulse 1.4s infinite;
        }

        /* Ticker */
        .flow-ticker {
          background: var(--panel-bg);
          border: 1px solid var(--border-color);
          border-radius: 0.75rem;
          padding: 0.75rem 1rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          overflow: hidden;
        }

        .ticker-label {
          font-family: var(--font-mono);
          font-size: 0.58rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: var(--text-secondary);
          white-space: nowrap;
          flex-shrink: 0;
        }

        .ticker-val {
          font-family: var(--font-mono);
          font-size: 0.68rem;
          color: var(--ink-steel);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        @media (max-width: 768px) {
          .hero-stats { padding: 0.75rem 1rem; }
          .stat-item { padding: 0 0.75rem; }
        }
      `}</style>
    </section>
  );
};

export default Hero;
