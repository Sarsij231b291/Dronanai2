import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

/**
 * RecruiterAuth — Ink Wash themed email-based auth gate.
 * Supports: Magic Link login | Email+Password sign-in | Sign-up
 */
const RecruiterAuth = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState('magic'); // 'magic' | 'password' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success'|'error', text }

  const showMsg = (type, text) => setMessage({ type, text });
  const clearMsg = () => setMessage(null);

  // ── Magic Link ──────────────────────────────────────────────────────
  const handleMagicLink = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true); clearMsg();
    const { error } = await supabase.auth.signInWithOtp({ email });
    setLoading(false);
    if (error) showMsg('error', error.message);
    else showMsg('success', `Magic link sent to ${email}. Check your inbox.`);
  };

  // ── Password Sign-In ────────────────────────────────────────────────
  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true); clearMsg();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) showMsg('error', error.message);
    else if (data.session) onAuthSuccess(data.session.user);
  };

  // ── Sign Up ─────────────────────────────────────────────────────────
  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true); clearMsg();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } }
    });
    setLoading(false);
    if (error) showMsg('error', error.message);
    else if (data.user && !data.session) {
      showMsg('success', 'Account created! Check your email to confirm then sign in.');
      setMode('password');
    } else if (data.session) {
      onAuthSuccess(data.session.user);
    }
  };

  const submitHandler = mode === 'magic' ? handleMagicLink : mode === 'password' ? handleSignIn : handleSignUp;

  return (
    <div className="auth-shell">
      <div className="auth-bg-glow"></div>

      <div className="auth-card animate-scale-up">
        {/* Logo */}
        <div className="auth-brand">
          <div className="auth-logo-mark">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0E836D" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span className="auth-logo-text">DRONA AI</span>
        </div>

        {/* Header */}
        <div className="auth-header">
          <h1 className="auth-title">Recruiter Portal</h1>
          <p className="auth-subtitle">Access your forensic screening engine</p>
        </div>

        {/* Tab switcher */}
        <div className="auth-tabs">
          {[
            { key: 'magic', label: 'Magic Link' },
            { key: 'password', label: 'Sign In' },
            { key: 'signup', label: 'Sign Up' },
          ].map(tab => (
            <button
              key={tab.key}
              className={`auth-tab ${mode === tab.key ? 'active' : ''}`}
              onClick={() => { setMode(tab.key); clearMsg(); }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Status message */}
        {message && (
          <div className={`auth-message ${message.type}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {message.type === 'success'
                ? <><polyline points="20 6 9 17 4 12"/></>
                : <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>}
            </svg>
            {message.text}
          </div>
        )}

        {/* Form */}
        <form onSubmit={submitHandler} className="auth-form">
          {/* Name — signup only */}
          {mode === 'signup' && (
            <div className="auth-field">
              <label>Full Name</label>
              <div className="field-wrap">
                <svg className="field-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Shubhdeep Malik" />
              </div>
            </div>
          )}

          {/* Email */}
          <div className="auth-field">
            <label>Work Email</label>
            <div className="field-wrap">
              <svg className="field-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="recruiter@company.com" required />
            </div>
          </div>

          {/* Password — sign-in / sign-up only */}
          {mode !== 'magic' && (
            <div className="auth-field">
              <label>Password</label>
              <div className="field-wrap">
                <svg className="field-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
              </div>
            </div>
          )}

          {/* Submit */}
          <button type="submit" className="auth-submit-btn" disabled={loading}>
            <div className="btn-shine"></div>
            <span className="btn-content">
              {loading ? (
                <><div className="auth-spinner"></div>Processing...</>
              ) : mode === 'magic' ? (
                <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>Send Magic Link</>
              ) : mode === 'password' ? (
                <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg>Sign In to Dashboard</>
              ) : (
                <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>Create Recruiter Account</>
              )}
            </span>
          </button>
        </form>

        {mode === 'magic' && (
          <p className="auth-hint">
            We'll email you a secure link. No password required.
          </p>
        )}

        <div className="auth-divider">
          <span>secured by</span>
          <svg width="60" height="14" viewBox="0 0 150 34" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21.5 0C9.6 0 0 9.6 0 21.5S9.6 43 21.5 43 43 33.4 43 21.5 33.4 0 21.5 0zm0 8c3.3 0 6 2.7 6 6s-2.7 6-6 6-6-2.7-6-6 2.7-6 6-6zm0 27c-5 0-9.4-2.6-12-6.5.1-4 8-6.2 12-6.2s11.9 2.2 12 6.2c-2.6 3.9-7 6.5-12 6.5z" fill="rgba(255,255,227,0.15)"/>
            <text x="52" y="22" fill="rgba(255,255,227,0.25)" fontSize="18" fontFamily="Space Grotesk, sans-serif" fontWeight="300" letterSpacing="3">SUPABASE</text>
          </svg>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;700&family=Space+Mono&display=swap');

        .auth-shell {
          min-height: 100vh;
          display: flex; align-items: center; justify-content: center;
          background: #07080a;
          font-family: 'Space Grotesk', sans-serif;
          position: relative; overflow: hidden;
          padding: 2rem 1rem;
        }
        .auth-bg-glow {
          position: absolute; top: -20%; left: 50%;
          transform: translateX(-50%);
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(14,131,109,0.06) 0%, transparent 70%);
          pointer-events: none;
        }

        /* ── Card ── */
        .auth-card {
          position: relative; z-index: 1;
          width: 100%; max-width: 440px;
          background: #0d0e11;
          border: 1px solid rgba(255,255,227,0.07);
          border-radius: 4px;
          padding: 3rem;
          box-shadow: 0 40px 80px rgba(0,0,0,0.6);
          display: flex; flex-direction: column; gap: 2rem;
        }

        /* ── Brand ── */
        .auth-brand {
          display: flex; align-items: center; gap: 0.8rem;
        }
        .auth-logo-mark {
          width: 34px; height: 34px;
          background: rgba(14,131,109,0.1);
          border: 1px solid rgba(14,131,109,0.2);
          border-radius: 4px;
          display: flex; align-items: center; justify-content: center;
        }
        .auth-logo-text {
          font-family: 'Space Mono', monospace;
          font-size: 0.75rem; letter-spacing: 0.3em;
          color: rgba(255,255,227,0.4);
        }

        /* ── Header ── */
        .auth-header { text-align: center; }
        .auth-title {
          font-size: 1.7rem; font-weight: 300;
          letter-spacing: 0.05em; text-transform: uppercase;
          color: #FFFFE3; margin: 0 0 0.4rem;
        }
        .auth-subtitle {
          font-size: 0.78rem; color: rgba(255,255,227,0.3);
          letter-spacing: 0.08em;
        }

        /* ── Tabs ── */
        .auth-tabs {
          display: flex; gap: 2px;
          background: rgba(255,255,227,0.03);
          border: 1px solid rgba(255,255,227,0.06);
          border-radius: 4px; padding: 3px;
        }
        .auth-tab {
          flex: 1; padding: 0.55rem 0;
          background: transparent; border: none;
          color: rgba(255,255,227,0.35);
          font-size: 0.72rem; font-weight: 500;
          font-family: 'Space Grotesk', sans-serif;
          letter-spacing: 0.06em; cursor: pointer;
          border-radius: 2px;
          transition: all 0.2s;
        }
        .auth-tab.active {
          background: #0E836D;
          color: #FFFFE3;
        }
        .auth-tab:not(.active):hover { color: #FFFFE3; }

        /* ── Message ── */
        .auth-message {
          display: flex; align-items: center; gap: 0.7rem;
          padding: 0.85rem 1rem;
          border-radius: 4px;
          font-size: 0.78rem; line-height: 1.5;
          font-family: 'Space Mono', monospace;
          letter-spacing: 0.03em;
        }
        .auth-message.success {
          background: rgba(14,131,109,0.08);
          border: 1px solid rgba(14,131,109,0.2);
          color: #0E836D;
        }
        .auth-message.error {
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.2);
          color: #ef4444;
        }

        /* ── Form ── */
        .auth-form { display: flex; flex-direction: column; gap: 1.4rem; }
        .auth-field { display: flex; flex-direction: column; gap: 0.6rem; }
        .auth-field label {
          font-family: 'Space Mono', monospace;
          font-size: 0.6rem; color: rgba(255,255,227,0.4);
          letter-spacing: 0.18em; text-transform: uppercase;
        }
        .field-wrap { position: relative; }
        .field-icon {
          position: absolute; left: 1rem; top: 50%;
          transform: translateY(-50%);
          color: rgba(255,255,227,0.2); pointer-events: none;
        }
        .auth-field input {
          width: 100%; box-sizing: border-box;
          background: rgba(255,255,227,0.03);
          border: 1px solid rgba(255,255,227,0.08);
          border-radius: 4px;
          padding: 0.85rem 1rem 0.85rem 2.75rem;
          color: #FFFFE3; font-size: 0.88rem;
          font-family: 'Space Grotesk', sans-serif;
          transition: border-color 0.2s, background 0.2s;
        }
        .auth-field input::placeholder { color: rgba(255,255,227,0.18); }
        .auth-field input:focus {
          border-color: #0E836D;
          background: rgba(14,131,109,0.05);
          outline: none;
          box-shadow: 0 0 0 3px rgba(14,131,109,0.1);
        }

        /* ── Submit Button ── */
        .auth-submit-btn {
          position: relative; overflow: hidden;
          background: #0E836D; color: #FFFFE3;
          border: 1px solid rgba(255,255,227,0.08);
          border-radius: 4px; padding: 1rem;
          font-size: 0.78rem; font-weight: 700;
          font-family: 'Space Grotesk', sans-serif;
          text-transform: uppercase; letter-spacing: 0.2em;
          cursor: pointer; margin-top: 0.5rem;
          transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
          box-shadow: 0 8px 24px rgba(14,131,109,0.15);
        }
        .auth-submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 32px rgba(14,131,109,0.3);
        }
        .auth-submit-btn:disabled { opacity: 0.5; cursor: wait; transform: none; }
        .btn-shine {
          position: absolute; top: 0; left: -100%;
          width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,227,0.08), transparent);
          transition: 0.6s;
        }
        .auth-submit-btn:hover .btn-shine { left: 100%; }
        .btn-content {
          position: relative; z-index: 2;
          display: flex; align-items: center; justify-content: center;
          gap: 0.65rem;
        }
        .auth-spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,227,0.2);
          border-top-color: #FFFFE3; border-radius: 50%;
          animation: authSpin 0.8s linear infinite;
        }
        @keyframes authSpin { to { transform: rotate(360deg); } }

        /* ── Hints & Divider ── */
        .auth-hint {
          text-align: center; font-size: 0.7rem;
          color: rgba(255,255,227,0.25);
          font-family: 'Space Mono', monospace;
          letter-spacing: 0.04em; line-height: 1.5;
          margin: 0;
        }
        .auth-divider {
          display: flex; align-items: center; gap: 0.75rem;
          border-top: 1px solid rgba(255,255,227,0.05);
          padding-top: 1.5rem; margin-top: 0.5rem;
          font-family: 'Space Mono', monospace;
          font-size: 0.55rem; color: rgba(255,255,227,0.2);
          letter-spacing: 0.12em;
        }

        @keyframes scale-up {
          from { opacity: 0; transform: scale(0.96) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-scale-up { animation: scale-up 0.4s cubic-bezier(0.165, 0.84, 0.44, 1) forwards; }
      `}</style>
    </div>
  );
};

export default RecruiterAuth;
