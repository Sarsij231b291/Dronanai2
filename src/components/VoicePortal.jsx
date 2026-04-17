import React, { useState, useEffect } from 'react';
import VoiceRoom from './VoiceRoom';

const VoicePortal = ({ interviews, activeInterviewId, onBack }) => {
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [resume, setResume] = useState(null);
  const [candidateName, setCandidateName] = useState('');
  const [sessionConfig, setSessionConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (activeInterviewId) {
      const interview = interviews.find(i => i.id === activeInterviewId);
      if (interview) setSelectedInterview(interview);
    }
  }, [activeInterviewId, interviews]);

  const handleStart = async (e) => {
    e.preventDefault();
    if (!resume || !selectedInterview) return;

    const vapiKey = "289d874b-633b-406d-b025-ffcf92db4c21";
    if (!vapiKey || vapiKey.includes("YOUR_VAPI_PUBLIC_KEY")) {
      alert("Vapi Public Key is not set. Please check your .env file.");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('resume', resume);
    formData.append('interview_id', selectedInterview.id);
    formData.append('candidate_name', candidateName);

    const API_BASE = import.meta.env.VITE_API_URL || '';
    try {
      const res = await fetch(`${API_BASE}/api/interviews/config`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setSessionConfig({ ...data, candidate_name: candidateName });
      } else {
        alert(data.error);
      }
    } catch (e) {
      console.error("Session failed", e);
      alert("Backend connection failed. Is the Flask server running?");
    } finally {
      setIsLoading(false);
    }
  };

  if (sessionConfig) {
    return <VoiceRoom sessionData={sessionConfig} onFinish={() => setSessionConfig(null)} />;
  }

  return (
    <div className="voice-portal animate-fade-in">
      <div className="stage-container">

        <div className="portal-header">
          <button className="back-link-btn" onClick={onBack}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            Return to Dashboard
          </button>
        </div>

        <div className="glass-stage animate-scale-up">

          {/* ── Header ── */}
          <div className="stage-top">
            <div className="brand-mark">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0E836D" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
              </svg>
            </div>
            <h2 className="stage-title">Candidate Entrance</h2>
            <p className="stage-subtitle">Step into your future with Drona AI Voice Interview.</p>
          </div>

          {/* ── Position Card ── */}
          {selectedInterview && activeInterviewId && (
            <div className="interview-focus-card">
              <div className="focus-label">TARGET POSITION</div>
              <h3 className="focus-title">{selectedInterview.title}</h3>
              <div className="focus-meta">
                <span>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                  {selectedInterview.duration_minutes} Mins
                </span>
                <span>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                  AI Voice
                </span>
              </div>
            </div>
          )}

          {/* ── Form ── */}
          <form onSubmit={handleStart} className="stage-form">

            <div className="input-block">
              <label>What is your full name?</label>
              <div className="input-wrapper">
                <svg className="input-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                <input
                  type="text"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  placeholder="e.g. Shubhdeep Malik"
                  required
                />
              </div>
            </div>

            {!activeInterviewId && (
              <div className="input-block">
                <label>Select Interview Category</label>
                <div className="input-wrapper">
                  <svg className="input-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>
                  <select
                    value={selectedInterview?.id || ''}
                    onChange={(e) => setSelectedInterview(interviews.find(i => i.id === parseInt(e.target.value)))}
                    required
                  >
                    <option value="">Choose your role...</option>
                    {interviews.map(i => <option key={i.id} value={i.id}>{i.title}</option>)}
                  </select>
                </div>
              </div>
            )}

            <div className="upload-section">
              <label className="upload-label">Professional Resume (PDF)</label>
              <input type="file" id="resume-upload" accept=".pdf" onChange={(e) => setResume(e.target.files[0])} style={{ display: 'none' }} />
              <label htmlFor="resume-upload" className={`stage-dropzone ${resume ? 'has-file' : ''}`}>
                <div className="drop-icon">
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                </div>
                <div className="drop-text">
                  <strong>{resume ? resume.name : 'Click to upload resume'}</strong>
                  <span>{resume ? 'Successfully attached' : 'PDF files only · max 5MB'}</span>
                </div>
              </label>
            </div>

            <button type="submit" className="launch-btn" disabled={isLoading}>
              <div className="launch-btn-shine"></div>
              <span className="btn-content">
                {isLoading ? (
                  <><div className="btn-spinner"></div>Preparing AI Agent...</>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                    Analyze &amp; Launch Interview
                  </>
                )}
              </span>
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;700;900&family=Space+Mono&display=swap');

        .voice-portal {
          display: flex; justify-content: center;
          padding: 4rem 1rem;
          min-height: calc(100vh - 100px);
          font-family: 'Space Grotesk', sans-serif;
        }
        .stage-container {
          width: 100%; max-width: 520px;
          display: flex; flex-direction: column; gap: 1.5rem;
        }
        .portal-header { display: flex; justify-content: flex-start; }

        /* Card */
        .glass-stage {
          background: #0d0e11;
          border: 1px solid rgba(255,255,227,0.06);
          border-radius: 4px;
          padding: 3rem;
          box-shadow: 0 40px 80px rgba(0,0,0,0.6);
        }

        /* Header */
        .stage-top { text-align: center; margin-bottom: 2.5rem; }
        .brand-mark {
          width: 36px; height: 36px;
          background: rgba(14,131,109,0.1);
          border: 1px solid rgba(14,131,109,0.2);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 1.5rem;
          animation: vp-pulse 2.5s ease-in-out infinite;
        }
        @keyframes vp-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(14,131,109,0.3); }
          50%      { box-shadow: 0 0 0 8px rgba(14,131,109,0); }
        }
        .stage-title {
          font-size: 1.85rem; font-weight: 300;
          letter-spacing: 0.06em; text-transform: uppercase;
          color: #FFFFE3; margin: 0 0 0.5rem;
        }
        .stage-subtitle {
          font-size: 0.78rem; color: rgba(255,255,227,0.35);
          letter-spacing: 0.08em; font-weight: 400;
        }

        /* Position Card */
        .interview-focus-card {
          background: rgba(14,131,109,0.05);
          border: 1px solid rgba(14,131,109,0.15);
          border-radius: 4px;
          padding: 1.2rem 1.5rem;
          margin-bottom: 2.5rem;
        }
        .focus-label {
          font-family: 'Space Mono', monospace;
          font-size: 0.55rem; color: #0E836D;
          letter-spacing: 0.2em; margin-bottom: 0.55rem;
        }
        .focus-title {
          font-size: 1.1rem; font-weight: 500;
          color: #FFFFE3; margin: 0 0 0.75rem;
          letter-spacing: 0.02em;
        }
        .focus-meta {
          display: flex; gap: 1.5rem;
          font-family: 'Space Mono', monospace;
          font-size: 0.62rem; color: rgba(255,255,227,0.35);
          letter-spacing: 0.05em;
        }
        .focus-meta span { display: flex; align-items: center; gap: 0.45rem; }

        /* Form */
        .stage-form { display: flex; flex-direction: column; gap: 1.75rem; }
        .input-block label, .upload-label {
          display: block;
          font-family: 'Space Mono', monospace;
          font-size: 0.62rem; font-weight: 400;
          color: rgba(255,255,227,0.45);
          letter-spacing: 0.15em; text-transform: uppercase;
          margin-bottom: 0.7rem;
        }
        .input-wrapper { position: relative; }
        .input-icon {
          position: absolute; left: 1rem; top: 50%;
          transform: translateY(-50%);
          color: rgba(255,255,227,0.2); pointer-events: none;
        }
        .input-wrapper input, .input-wrapper select {
          width: 100%; box-sizing: border-box;
          background: rgba(255,255,227,0.03);
          border: 1px solid rgba(255,255,227,0.08);
          border-radius: 4px;
          padding: 0.85rem 1rem 0.85rem 2.75rem;
          color: #FFFFE3; font-size: 0.88rem;
          font-family: 'Space Grotesk', sans-serif;
          transition: border-color 0.2s, background 0.2s;
        }
        .input-wrapper input::placeholder { color: rgba(255,255,227,0.18); }
        .input-wrapper input:focus, .input-wrapper select:focus {
          border-color: #0E836D;
          background: rgba(14,131,109,0.05);
          outline: none;
          box-shadow: 0 0 0 3px rgba(14,131,109,0.1);
        }
        .input-wrapper select option { background: #0d0e11; color: #FFFFE3; }

        /* Upload Zone */
        .stage-dropzone {
          border: 1px dashed rgba(255,255,227,0.1);
          border-radius: 4px;
          padding: 1.3rem 1.5rem;
          display: flex; align-items: center; gap: 1.25rem;
          cursor: pointer; transition: all 0.3s;
        }
        .stage-dropzone:hover {
          border-color: rgba(14,131,109,0.4);
          background: rgba(14,131,109,0.04);
        }
        .stage-dropzone.has-file {
          border-color: rgba(14,131,109,0.3);
          border-style: solid;
          background: rgba(14,131,109,0.05);
        }
        .drop-icon {
          width: 40px; height: 40px; flex-shrink: 0;
          background: rgba(255,255,227,0.03);
          border: 1px solid rgba(255,255,227,0.07);
          border-radius: 4px;
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,227,0.25);
        }
        .has-file .drop-icon {
          color: #0E836D;
          background: rgba(14,131,109,0.1);
          border-color: rgba(14,131,109,0.2);
        }
        .drop-text { display: flex; flex-direction: column; gap: 0.3rem; }
        .drop-text strong {
          font-size: 0.83rem; font-weight: 500;
          color: #FFFFE3; word-break: break-all;
        }
        .drop-text span {
          font-size: 0.68rem;
          font-family: 'Space Mono', monospace;
          color: rgba(255,255,227,0.28);
          letter-spacing: 0.04em;
        }
        .has-file .drop-text span { color: #0E836D; }

        /* Launch Button */
        .launch-btn {
          position: relative; overflow: hidden;
          background: #0E836D; color: #FFFFE3;
          border: 1px solid rgba(255,255,227,0.08);
          border-radius: 4px; padding: 1.05rem;
          font-size: 0.78rem; font-weight: 700;
          font-family: 'Space Grotesk', sans-serif;
          text-transform: uppercase; letter-spacing: 0.22em;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
          box-shadow: 0 8px 24px rgba(14,131,109,0.15);
        }
        .launch-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 32px rgba(14,131,109,0.3);
        }
        .launch-btn:active  { transform: translateY(0); }
        .launch-btn:disabled { opacity: 0.5; cursor: wait; transform: none; }
        .launch-btn-shine {
          position: absolute; top: 0; left: -100%;
          width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,227,0.08), transparent);
          transition: 0.6s;
        }
        .launch-btn:hover .launch-btn-shine { left: 100%; }
        .btn-content {
          position: relative; z-index: 2;
          display: flex; align-items: center; justify-content: center;
          gap: 0.7rem;
        }
        .btn-spinner {
          width: 15px; height: 15px;
          border: 2px solid rgba(255,255,227,0.2);
          border-top-color: #FFFFE3;
          border-radius: 50%;
          animation: vp-spin 0.8s linear infinite;
        }

        /* Back Button */
        .back-link-btn {
          display: flex; align-items: center; gap: 0.6rem;
          background: transparent; border: none;
          color: rgba(255,255,227,0.3);
          font-size: 0.68rem; font-weight: 400;
          font-family: 'Space Mono', monospace;
          letter-spacing: 0.12em; text-transform: uppercase;
          cursor: pointer; transition: all 0.2s;
        }
        .back-link-btn:hover { color: #FFFFE3; transform: translateX(-4px); }

        @keyframes vp-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default VoicePortal;
