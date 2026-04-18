import React, { useState, useEffect, useMemo, useRef } from 'react';
import Vapi from '@vapi-ai/web';
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';

const VoiceRoom = ({ sessionData, onFinish }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const lastTranscriptRef = useRef("");

  // Initialize Vapi inside useMemo with safety
  const vapi = useMemo(() => {
    try {
      const key = "289d874b-633b-406d-b025-ffcf92db4c21";
      console.log("DEBUG: VoiceRoom initializing with key:", key);

      if (!key || key.includes("YOUR_VAPI_PUBLIC_KEY")) {
        console.warn("Vapi Public Key is missing or using placeholder.");
        return null;
      }
      console.log("pass done")
      const VapiClass = Vapi.default || Vapi;
      const V = new VapiClass(key);
      console.log(V);
      return V;
    } catch (err) {
      console.error("Vapi Initialization Failed:", err);
      return null;
    }
  }, []);

  const [isCalling, setIsCalling] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(sessionData?.duration ? sessionData.duration * 60 : 600);
  const [isFinished, setIsFinished] = useState(false);
  const [activeSpeech, setActiveSpeech] = useState(0);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [transcript, setTranscript] = useState([]);
  const [faceModel, setFaceModel] = useState(null);
  const [isCheckingFace, setIsCheckingFace] = useState(false);
  const [faceError, setFaceError] = useState(null);

  // Load Face Model
  useEffect(() => {
    const loadModel = async () => {
      try {
        await tf.ready();
        const model = await blazeface.load();
        setFaceModel(model);
      } catch (e) {
        console.error("Failed to load face detection model", e);
      }
    };
    loadModel();
  }, []);

  // Camera Access
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    };

    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCall = async (vapiObj) => {
    console.log("DEBUG: Initiate clicked. VapiObj exists:", !!vapiObj);

    if (!faceModel) {
      console.warn("DEBUG: Face model not ready");
      alert("AI face detection model is still loading. Please wait a few seconds and try again.");
      return;
    }

    if (!vapiObj) {
      console.error("DEBUG: Vapi object is null");
      alert("Voice service (Vapi) is not initialized. Check your API key.");
      return;
    }

    setIsCheckingFace(true);
    setFaceError(null);

    try {
      console.log("DEBUG: Starting face detection scan...");
      if (videoRef.current) {
        // Wait until the video has valid dimensions (prevents WebGL 0x0 texture error)
        const video = videoRef.current;
        if (!video.videoWidth || !video.videoHeight || video.readyState < 2) {
          console.warn("DEBUG: Video not ready yet, waiting...");
          await new Promise((resolve) => {
            const onReady = () => { video.removeEventListener('loadeddata', onReady); resolve(); };
            video.addEventListener('loadeddata', onReady);
            // Fallback timeout in case it's already loaded but readyState is stale
            setTimeout(resolve, 2000);
          });
        }

        // Double-check dimensions after waiting
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          const faces = await faceModel.estimateFaces(video, false);
          console.log("DEBUG: Scan complete. Faces detected:", faces.length);

          if (faces.length > 1) {
            setFaceError(`Multiple faces detected (${faces.length})! Please ensure you are alone in the frame.`);
            setIsCheckingFace(false);
            return;
          }
        } else {
          console.warn("DEBUG: Skipping face check — camera not producing frames yet");
        }
      }

      console.log("DEBUG: Preparing Vapi configuration...");
      setIsConnecting(true);

      if (isCalling) {
        try { vapiObj.stop(); } catch (e) { }
      }

      const assistantConfig = {
        name: "Drona AI Interviewer",
        firstMessage: `Hello, I am Drona AI. I have reviewed your resume, ${sessionData?.candidate_name || ''}, and I'm ready to begin the interview. Shall we start?`,
        model: {
          provider: "openai",
          model: "gpt-3.5-turbo",
          messages: [{ role: "system", content: sessionData.system_prompt }]
        }
      };

      console.log("DEBUG: Calling vapi.start()...");
      await vapiObj.start(assistantConfig);
      console.log("DEBUG: vapi.start() executed successfully.");

    } catch (err) {
      console.error("DEBUG: Critical error in startCall:", err);
      alert("AI Service Error: " + (err.message || "Failed to initiate session."));
      setIsConnecting(false);
    } finally {
      setIsCheckingFace(false);
    }
  };

  const endCall = () => {
    if (vapi) vapi.stop();
  };

  const handleFinishSession = async (finalTranscript) => {
    setIsEvaluating(true);
    try {
      const API_BASE = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${API_BASE}/api/interviews/session/${sessionData.session_id}/finish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: finalTranscript })
      });
      const data = await res.json();
      setEvaluationResult(data);
    } catch (err) {
      console.error("Evaluation failed", err);
    } finally {
      setIsEvaluating(false);
    }
  };

  useEffect(() => {
    let timer;
    if (isCalling && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && !isFinished) {
      endCall();
    }
    return () => clearInterval(timer);
  }, [isCalling, timeLeft, isFinished]);

  useEffect(() => {
    if (!vapi) return;

    vapi.on("call-start", () => {
      setIsCalling(true);
      setIsConnecting(false);
    });
    vapi.on("call-end", () => {
      setIsCalling(false);
      setIsConnecting(false);
      setIsFinished(true);
      // When call ends, we have the full transcript locally
      // Note: transcript state might not be updated in time for the sync call, 
      // so we use a functional update or a ref if needed. 
      // But Vapi provides the transcript in messages.
    });

    vapi.on("message", (message) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const content = message.transcript.trim();
        // Duplicate check to prevent the "double sentence" bug
        if (content !== lastTranscriptRef.current) {
          setTranscript(prev => [...prev, { role: message.role, content: content }]);
          lastTranscriptRef.current = content;
        }
      }
    });

    vapi.on("speech-start", () => setActiveSpeech(1));
    vapi.on("speech-end", () => setActiveSpeech(0));
    vapi.on("error", (e) => {
      setIsConnecting(false);
      console.warn("VAPI lifecycle event (error channel):", e);

      let errorMsg = "An unexpected connection error occurred.";
      if (typeof e === 'string') errorMsg = e;
      else if (e?.message) errorMsg = e.message;
      else if (e?.error?.message) errorMsg = typeof e.error.message === 'object'
        ? (e.error.message.msg || JSON.stringify(e.error.message))
        : e.error.message;

      // These are normal Vapi lifecycle events — NOT real errors.
      // Suppress them silently so they don't interrupt the user.
      const SILENT_EVENTS = [
        "meeting has ended",
        "call ended",
        "room was deleted",
        "exiting meeting",
        "session ended",
        "disconnected",
      ];
      const isKnownLifecycle = SILENT_EVENTS.some(phrase =>
        errorMsg.toLowerCase().includes(phrase)
      );
      if (isKnownLifecycle) {
        console.log("Vapi lifecycle event suppressed (not a real error):", errorMsg);
        return; // ← swallow silently, no alert
      }

      if (errorMsg.includes("no-room")) {
        errorMsg = "The AI Interview room could not be initialized. This is usually a temporary issue. Please wait 5 seconds and try again.";
      }

      alert("AI Service Alert: " + errorMsg);
    });


    return () => vapi.removeAllListeners();
  }, [vapi]);

  // Trigger evaluation when finished
  useEffect(() => {
    if (isFinished && transcript.length > 0 && !evaluationResult && !isEvaluating) {
      handleFinishSession(transcript);
    }
  }, [isFinished, transcript]);

  // Auto-scroll transcript
  useEffect(() => {
    const box = document.getElementById("transcript-box");
    if (box) box.scrollTop = box.scrollHeight;
  }, [transcript]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isEvaluating) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        fontFamily: "'DM Sans', system-ui, sans-serif",
        background: '#1c1c1c',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: '3.5rem', overflow: 'hidden'
      }}>
        {/* Dot Grid Background — matches the system's --grid-dot pattern */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: 'radial-gradient(circle, rgba(203,203,203,0.12) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
        }} />

        {/* Ambient ivory glow — soft, not neon */}
        <div style={{
          position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)',
          width: '500px', height: '500px',
          background: 'radial-gradient(ellipse, rgba(255,255,227,0.04) 0%, transparent 65%)',
          pointerEvents: 'none', zIndex: 0
        }} />

        {/* Central Scanner — using ink-wash steel tones */}
        <div style={{ position: 'relative', width: '180px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
          {/* Outer ring */}
          <div style={{
            position: 'absolute', inset: 0,
            border: '1px solid rgba(109,129,150,0.15)',
            borderTopColor: 'rgba(109,129,150,0.6)',
            borderRadius: '50%',
            animation: 'iwSpin 5s linear infinite'
          }} />
          {/* Middle ring */}
          <div style={{
            position: 'absolute', inset: '22px',
            border: '1px solid rgba(109,129,150,0.08)',
            borderLeftColor: 'rgba(203,203,203,0.35)',
            borderRadius: '50%',
            animation: 'iwSpin 8s linear reverse infinite'
          }} />
          {/* Inner ring */}
          <div style={{
            position: 'absolute', inset: '44px',
            border: '1px solid rgba(74,74,74,0.2)',
            borderBottomColor: 'rgba(109,129,150,0.4)',
            borderRadius: '50%',
            animation: 'iwSpin 3.5s linear infinite'
          }} />

          {/* Square core — Drona's geometric style */}
          <div style={{
            width: '64px', height: '64px',
            background: 'rgba(255,255,227,0.04)',
            border: '1px solid rgba(203,203,203,0.2)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'iwCorePulse 4s ease-in-out infinite',
            zIndex: 2
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,227,0.7)" strokeWidth="1.5" strokeLinecap="round">
              <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
            </svg>
          </div>

          {/* Scanning line */}
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', overflow: 'hidden', zIndex: 3 }}>
            <div style={{
              position: 'absolute', left: 0, width: '100%', height: '1.5px',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,227,0.5), transparent)',
              animation: 'iwBeam 2.8s ease-in-out infinite'
            }} />
          </div>
        </div>

        {/* Text content */}
        <div style={{ zIndex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
          {/* Mono tag — matches system's Space Mono usage */}
          <span style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase',
            color: 'rgba(109,129,150,0.8)',
            border: '1px solid rgba(109,129,150,0.2)',
            padding: '0.35rem 1rem', borderRadius: '2px',
            background: 'rgba(109,129,150,0.06)',
            animation: 'iwBlink 3s ease-in-out infinite'
          }}>
            Processing Session Data
          </span>

          {/* Heading — Space Grotesk, system style */}
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '2.2rem', fontWeight: 700, margin: 0,
            color: '#FFFFE3', letterSpacing: '-0.02em', lineHeight: 1.15
          }}>
            Forensic<br />
            <span style={{ color: 'rgba(203,203,203,0.5)', fontWeight: 400 }}>Analysis</span>
          </h1>

          {/* Step list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start', marginTop: '0.5rem' }}>
            {[
              { label: 'Processing session transcript', done: true },
              { label: 'Evaluating response quality', done: true },
              { label: 'Generating competency score', done: false },
            ].map((step, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '0.9rem',
                animation: `iwStepIn 0.4s ease forwards ${i * 0.3}s`, opacity: 0
              }}>
                <div style={{
                  width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
                  background: step.done ? '#FFFFE3' : 'rgba(109,129,150,0.3)',
                  boxShadow: step.done ? '0 0 8px rgba(255,255,227,0.5)' : 'none',
                }} />
                <span style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '0.85rem', fontWeight: step.done ? 500 : 400,
                  color: step.done ? 'rgba(255,255,227,0.8)' : 'rgba(109,129,150,0.5)',
                  letterSpacing: '0.01em'
                }}>{step.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ width: '320px', maxWidth: '85vw', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.7rem' }}>
          <div style={{ width: '100%', height: '2px', background: 'rgba(74,74,74,0.4)', borderRadius: '1px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(90deg, rgba(109,129,150,0.4), #FFFFE3, rgba(109,129,150,0.4))',
              animation: 'iwProgress 2.5s ease-in-out infinite'
            }} />
          </div>
          <span style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '0.55rem', fontWeight: 400, letterSpacing: '0.2em',
            color: 'rgba(109,129,150,0.5)', textTransform: 'uppercase'
          }}>
            Synthesizing output...
          </span>
        </div>

        <style>{`
          @keyframes iwSpin { to { transform: rotate(360deg); } }
          @keyframes iwBeam { 0% { top: 5%; opacity: 0; } 40% { opacity: 1; } 100% { top: 95%; opacity: 0; } }
          @keyframes iwCorePulse { 0%,100% { opacity: 0.7; } 50% { opacity: 1; box-shadow: 0 0 20px rgba(255,255,227,0.06); } }
          @keyframes iwProgress { 0% { width: 0%; margin-left: 0; } 50% { width: 60%; margin-left: 20%; } 100% { width: 0%; margin-left: 100%; } }
          @keyframes iwBlink { 0%,100% { opacity: 0.8; } 50% { opacity: 0.4; } }
          @keyframes iwStepIn { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
        `}</style>
      </div>
    );
  }



  if (evaluationResult) {
    const score = evaluationResult.overall_score || 0;
    const scoreColor = score >= 75 ? '#0E836D' : score >= 50 ? '#b07d30' : '#8b3a3a';
    const scoreLabel = score >= 75 ? 'Strong Candidate' : score >= 50 ? 'Needs Review' : 'Not Recommended';

    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: '#1c1c1c', overflowY: 'auto',
        fontFamily: "'DM Sans', system-ui, sans-serif",
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '1rem'
      }}>
        {/* Dot grid bg */}
        <div style={{
          position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle, rgba(203,203,203,0.06) 1px, transparent 1px)',
          backgroundSize: '30px 30px'
        }} />

        <div style={{
          position: 'relative', zIndex: 1,
          width: '100%', maxWidth: '520px',
          display: 'flex', flexDirection: 'column', gap: '0.75rem',
          animation: 'iwFadeUp 0.5s ease forwards'
        }}>
          {/* Header status tag */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <span style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase',
              color: 'rgba(109,129,150,0.7)', border: '1px solid rgba(109,129,150,0.2)',
              padding: '0.25rem 0.9rem', borderRadius: '2px', background: 'rgba(109,129,150,0.06)'
            }}>
              ✦ Session Complete ✦
            </span>
          </div>

          {/* Title */}
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '1.7rem', fontWeight: 700, color: '#FFFFE3',
            letterSpacing: '-0.03em', lineHeight: 1.1, textAlign: 'center', margin: 0
          }}>
            Forensic Summary
          </h1>

          {/* Candidate + Score card */}
          <div style={{
            background: 'rgba(42,42,42,0.6)', border: '1px solid rgba(203,203,203,0.1)',
            borderRadius: '12px', padding: '1rem 1.2rem',
            display: 'flex', alignItems: 'center', gap: '1rem',
            backdropFilter: 'blur(12px)'
          }}>
            {/* Avatar */}
            <div style={{
              width: '48px', height: '48px', borderRadius: '10px', flexShrink: 0,
              background: 'rgba(74,74,74,0.5)', border: '1px solid rgba(203,203,203,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '1.3rem', fontWeight: 700, color: '#FFFFE3'
            }}>
              {sessionData?.candidate_name?.charAt(0)?.toUpperCase() || 'C'}
            </div>

            {/* Name + session */}
            <div style={{ flex: 1 }}>
              <h3 style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '1rem', fontWeight: 600, color: '#FFFFE3', margin: '0 0 0.15rem'
              }}>
                {sessionData?.candidate_name || 'Candidate'}
              </h3>
              <span style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '0.55rem', letterSpacing: '0.12em', color: 'rgba(109,129,150,0.6)',
                textTransform: 'uppercase'
              }}>
                Session #{sessionData?.session_id}
              </span>
            </div>

            {/* Score ring */}
            <div style={{ position: 'relative', width: '76px', height: '76px', flexShrink: 0 }}>
              <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                <path fill="none" stroke="rgba(203,203,203,0.08)" strokeWidth="3"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path fill="none" stroke={scoreColor} strokeWidth="3" strokeLinecap="round"
                  strokeDasharray={`${score}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  style={{ filter: `drop-shadow(0 0 6px ${scoreColor}80)`, transition: 'stroke-dasharray 1.5s ease' }} />
              </svg>
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '1px'
              }}>
                <span style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '1.25rem', fontWeight: 700, color: scoreColor, lineHeight: 1
                }}>{score}</span>
                <span style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '0.4rem', color: 'rgba(203,203,203,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase'
                }}>Score</span>
              </div>
            </div>
          </div>

          {/* Verdict chip */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            background: 'rgba(42,42,42,0.4)', border: `1px solid ${scoreColor}40`,
            borderRadius: '8px', padding: '0.6rem 1rem'
          }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: scoreColor, boxShadow: `0 0 8px ${scoreColor}`, flexShrink: 0 }} />
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.82rem', fontWeight: 600, color: '#FFFFE3' }}>
              {scoreLabel}
            </span>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', color: 'rgba(203,203,203,0.5)', marginLeft: 'auto' }}>
              AI Verdict
            </span>
          </div>

          {/* Feedback card */}
          <div style={{
            background: 'rgba(42,42,42,0.5)', border: '1px solid rgba(203,203,203,0.1)',
            borderRadius: '12px', padding: '1.2rem', backdropFilter: 'blur(12px)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(109,129,150,0.7)" strokeWidth="2">
                <path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
              </svg>
              <span style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.18em',
                color: 'rgba(109,129,150,0.7)', textTransform: 'uppercase'
              }}>
                AI Forensic Evaluation
              </span>
            </div>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.85rem', lineHeight: 1.7, color: 'rgba(255,255,227,0.75)',
              margin: 0
            }}>
              {evaluationResult.feedback || 'Evaluation completed successfully.'}
            </p>
          </div>

          {/* CTA */}
          <button
            onClick={onFinish}
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              background: '#FFFFE3', color: '#1c1c1c',
              border: 'none', borderRadius: '8px',
              padding: '0.75rem 1.5rem', fontSize: '0.85rem', fontWeight: 700,
              cursor: 'pointer', letterSpacing: '0.02em',
              transition: 'all 0.2s ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              width: '100%'
            }}
            onMouseEnter={e => { e.target.style.background = '#f0f0d0'; e.target.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.target.style.background = '#FFFFE3'; e.target.style.transform = 'translateY(0)'; }}
          >
            Return to Dashboard
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <style>{`
          @keyframes iwFadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
      </div>
    );
  }

  return (
    <div className="vr-room animate-fade-in">
      {/* Header */}
      <div className="vr-header">
        <div className="vr-logo">
          <div className="vr-logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
          </div>
          <span>Drona AI Interview</span>
        </div>
        <div className="vr-status-pill">
          {isCalling ? 'SESSION LIVE' : isEvaluating ? 'EVALUATING...' : 'READY'}
        </div>
        {!isEvaluating && (
          <div className="vr-timer-wrap">
            <span className="vr-timer-text">{formatTime(timeLeft)}</span>
          </div>
        )}
      </div>

      <div className="vr-main-layout">
        {isEvaluating ? (
          <div className="evaluation-premium animate-fade-in">
            <div className="neural-grid"></div>
            <div className="eval-premium-content">
              {/* Central Hexagon Scanner */}
              <div className="neural-scanner-wrap">
                <div className="neural-orbit orbit-1"></div>
                <div className="neural-orbit orbit-2"></div>
                <div className="neural-orbit orbit-3"></div>
                <div className="neural-hexagon">
                  <div className="hex-inner">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0E836D" strokeWidth="1.5">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </div>
                </div>
                {/* Scanning Beam */}
                <div className="scanning-beam"></div>
              </div>

              <div className="eval-status-group">
                <h2 className="eval-main-title">AI Forensic Synthesis</h2>
                <div className="eval-step-tracker">
                  <div className="eval-step active">
                    <div className="step-dot"></div>
                    <span className="step-label">Processing Digital Footprint</span>
                  </div>
                  <div className="eval-step processing">
                    <div className="step-dot"></div>
                    <span className="step-label">Cross-Referencing Behavioral Patterns</span>
                  </div>
                  <div className="eval-step">
                    <div className="step-dot"></div>
                    <span className="step-label">Calculating Technical Competency Index</span>
                  </div>
                </div>
              </div>

              <div className="eval-progress-container">
                <div className="eval-progress-bar">
                  <div className="eval-progress-fill"></div>
                </div>
                <div className="eval-percentage">SYNCHRONIZING RESULTS...</div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="vr-visuals-col">
              <div className="vr-grid">
                <div className={`vr-card vr-ai-card ${activeSpeech ? 'speaking' : ''}`}>
                  <div className="vr-ai-avatar">
                    <div className="vr-robot-wrap">
                      <svg className={`vr-robot ${activeSpeech ? 'speaking' : ''}`} viewBox="0 0 200 200" width="280" height="280">
                        <defs>
                          <radialGradient id="bodyGradient" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#ffffff" />
                            <stop offset="100%" stopColor="#cbd5e1" />
                          </radialGradient>
                          <linearGradient id="visorGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#1e293b" />
                            <stop offset="100%" stopColor="#0f172a" />
                          </linearGradient>
                          <clipPath id="visorClip">
                            <rect x="58" y="55" width="84" height="40" rx="18" />
                          </clipPath>
                        </defs>

                        {/* Shadow */}
                        <ellipse cx="100" cy="190" rx="60" ry="10" fill="rgba(0,0,0,0.15)" className="robot-shadow" />

                        <g className="robot-float">
                          {/* Torso - Oval from below */}
                          <path d="M55 95 Q100 80 145 95 Q165 130 150 160 Q130 185 100 185 Q70 185 50 160 Q35 130 55 95 Z" fill="url(#bodyGradient)" />

                          {/* Body Shine/Highlight */}
                          <path d="M65 105 Q100 95 135 105" stroke="rgba(255,255,255,0.4)" strokeWidth="4" fill="none" strokeLinecap="round" />
                          <ellipse cx="100" cy="140" rx="25" ry="30" fill="rgba(255,255,255,0.05)" />

                          <path d="M75 165 Q100 175 125 165" stroke="rgba(0,0,0,0.06)" strokeWidth="3" fill="none" strokeLinecap="round" />

                          {/* Arms - Tucked closer to body for integrated feel */}
                          <g className="robot-arms">
                            <g className="arm-l-wrap">
                              <rect x="37" y="118" width="18" height="42" rx="9" fill="url(#bodyGradient)" className="arm-l" />
                            </g>
                            <g className="arm-r-wrap">
                              <rect x="145" y="118" width="18" height="42" rx="9" fill="url(#bodyGradient)" className="arm-r" />
                            </g>
                          </g>

                          {/* Head - Removed top bump */}
                          <g className="robot-head">
                            <circle cx="58" cy="75" r="11" fill="#e2e8f0" />
                            <circle cx="142" cy="75" r="11" fill="#e2e8f0" />

                            <rect x="50" y="48" width="100" height="65" rx="32" fill="url(#bodyGradient)" />
                            <rect x="58" y="55" width="84" height="40" rx="18" fill="url(#visorGradient)" />

                            <g clipPath="url(#visorClip)">
                              <g className="robot-face-elements">
                                <g className="robot-eyes">
                                  <path d="M78 72 Q85 68 92 72" stroke="#22d3ee" strokeWidth="4" fill="none" strokeLinecap="round" className="eye-l" />
                                  <path d="M108 72 Q115 68 122 72" stroke="#22d3ee" strokeWidth="4" fill="none" strokeLinecap="round" className="eye-r" />
                                </g>
                                <path d="M92 88 Q100 93 108 88" stroke="#22d3ee" strokeWidth="3" fill="none" strokeLinecap="round" className="robot-mouth" />
                              </g>
                            </g>
                          </g>
                        </g>
                      </svg>
                    </div>
                  </div>
                  <div className="vr-card-label">DRONA AI</div>
                </div>

                <div className="vr-card vr-cam-card">
                  <video ref={videoRef} autoPlay playsInline muted className="vr-video" />
                  <div className="vr-card-label">{sessionData?.candidate_name || 'YOU'}</div>
                  {!isCalling && (
                    <div className="vr-cam-overlay">
                      <span className="vr-cam-ready">CAMERA READY</span>
                    </div>
                  )}
                </div>
              </div>

              {!isCalling && !isEvaluating && (
                <div className="vr-launch-bar animate-slide-up">
                  <button className="vr-launch-btn-premium" onClick={() => startCall(vapi)} disabled={isConnecting || isCheckingFace || !faceModel}>
                    <div className="btn-shine"></div>
                    <div className="btn-content">
                      {isCheckingFace ? (
                        <div className="btn-loader"></div>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L5.32 8.35" /></svg>
                      )}
                      <span>
                        {isCheckingFace ? 'ANALYZING BIOMETRICS...' :
                          isConnecting ? 'ESTABLISHING SECURE LINK...' :
                            'INITIATE FORENSIC INTERVIEW'}
                      </span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <div className="vr-chat-col">
              <div className="vr-transcript">
                <div className="vr-transcript-bar">
                  <span className="vr-transcript-title">TRANSCRIPT</span>
                  <span className="vr-transcript-count">{transcript.length}</span>
                </div>
                <div className="vr-transcript-body" id="transcript-box">
                  {console.log(transcript, "transcript ")}
                  {transcript.length === 0 && <div className="vr-transcript-empty">Waiting for session...</div>}
                  {transcript.map((msg, idx) => (
                    <div key={idx} className={`chat-bubble-wrap ${msg.role === 'assistant' ? 'ai' : 'user'}`}>
                      <div className="chat-bubble">
                        <div className="bubble-role">{msg.role === 'assistant' ? 'DRONA AI' : 'YOU'}</div>
                        <div className="bubble-content">{msg.content}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {isCalling && !isEvaluating && (
        <div className="vr-bottom-bar animate-slide-up">
          <div className="bar-section left">
            <button className="bar-btn"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg></button>
          </div>
          <div className="bar-section center">
            <button className="bar-btn"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path></svg></button>
            <button className="bar-btn active"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg></button>
          </div>
          <div className="bar-section right">
            <button className="end-session-btn" onClick={endCall}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L5.32 8.35" /><line x1="23" y1="1" x2="1" y2="23" /></svg>
            </button>
          </div>
        </div>
      )}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');

        .vr-room {
          max-width: 1400px; margin: 1rem auto; padding: 0;
          display: flex; flex-direction: column; 
          background: #0a0b0d; border-radius: 1.5rem;
          height: 92vh; border: 1px solid rgba(255,255,255,0.05);
          position: relative; overflow: hidden;
          font-family: 'Outfit', sans-serif; color: white;
        }
        
        .vr-header { 
          display: flex; align-items: center; justify-content: space-between; 
          padding: 1.2rem 2.5rem; background: #0a0b0d;
          border-bottom: 1px solid rgba(255,255,227,0.05); z-index: 100;
        }
        .vr-logo { display: flex !important; flex-direction: row !important; align-items: center !important; gap: 1rem; font-size: 0.9rem; font-weight: 400; font-family: 'Space Grotesk', sans-serif; text-transform: uppercase; letter-spacing: 0.2em; color: #FFFFE3; }
        .vr-logo span { opacity: 0.8; }
        .vr-logo-icon { width: 36px; height: 36px; background: #0E836D; border-radius: 4px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 20px rgba(14,131,109,0.2); }
        .vr-status-pill { font-size: 0.6rem; font-weight: 900; color: #0E836D; background: rgba(14,131,109,0.05); padding: 0.4rem 1.2rem; border-radius: 2px; border: 1px solid rgba(14,131,109,0.2); text-transform: uppercase; letter-spacing: 0.2em; }
        .vr-timer-text { font-size: 0.9rem; font-weight: 300; color: #FFFFE3; opacity: 0.4; font-family: 'Space Mono', monospace; }

        .vr-main-layout { display: flex; flex: 1; min-height: 0; width: 100%; position: relative; }
        .vr-visuals-col { flex: 1; display: flex; flex-direction: column; position: relative; padding: 1.5rem; background: #07080a; }
        
        .vr-grid { 
          display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; flex: 1; 
          align-content: center; width: 100%; height: 100%;
        }
        
        .vr-card { 
          display: block !important; position: relative !important;
          aspect-ratio: 4/5; border-radius: 0.5rem; background: #111214; 
          overflow: hidden; border: 1px solid rgba(255,255,227,0.05);
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        }
        
        .vr-card-label { 
          position: absolute !important; bottom: 1.5rem !important; left: 1.5rem !important; 
          display: flex !important; flex-direction: row !important; align-items: center !important; 
          gap: 0.8rem !important; background: rgba(10, 11, 13, 0.9) !important; 
          backdrop-filter: blur(10px) !important; padding: 0.5rem 1.2rem !important; 
          border-radius: 2px !important; font-size: 0.65rem !important; 
          font-weight: 900 !important; color: #FFFFE3 !important; 
          border: 1px solid rgba(255,255,227,0.1) !important; z-index: 60 !important; 
          width: fit-content !important; height: auto !important; 
          white-space: nowrap !important; text-transform: uppercase; letter-spacing: 0.15em;
        }

        .vr-video { width: 100%; height: 100%; object-fit: cover; transform: scaleX(-1); display: block; }
        .vr-ai-avatar { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle at center, #1a1c20, #0d0e12); }
        .vr-robot-wrap { position: relative; width: 300px; height: 300px; display: flex; align-items: center; justify-content: center; transform: translateY(-10px); }
        
        /* Controlled Robotics Animations */
        .robot-float { animation: robotFloat 4s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite; }
        .robot-head { transform: none !important; }
        .robot-face-elements { animation: faceSync 15s ease-in-out infinite; }
        
        .arm-l-wrap { animation: armFloatL 6s ease-in-out infinite; transform-origin: 50px 115px; }
        .arm-r-wrap { animation: armFloatR 6s ease-in-out infinite; transform-origin: 150px 115px; }
        .arm-l { animation: armSwayL 6s ease-in-out infinite; transform-origin: top center; }
        .arm-r { animation: armSwayR 6s ease-in-out infinite; transform-origin: top center; }
        
        .robot-shadow { animation: shadowPulse 4s ease-in-out infinite; transform-origin: center; opacity: 0.3; }
        .eye-l, .eye-r { animation: eyeBlink 5s infinite; transform-origin: center; }
        
        /* Speaking State */
        .vr-robot.speaking .robot-mouth { 
          animation: mouthTalk 0.4s infinite alternate; 
          stroke-width: 5; stroke: #22d3ee;
          filter: drop-shadow(0 0 6px rgba(34, 211, 238, 0.8));
        }
        .vr-robot.speaking .robot-eyes path { stroke: #00f5a0; filter: drop-shadow(0 0 8px #00f5a0); }

        @keyframes robotFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        @keyframes headTurn {
          0%, 100% { transform: rotate(0) translate(0, 0); }
          25% { transform: rotate(5deg) translate(12px, 2px); }
          75% { transform: rotate(-5deg) translate(-12px, 2px); }
        }
        @keyframes faceSync {
          0%, 10%, 100% { transform: translate(0, 0); }
          20% { transform: translate(12px, 1px); } /* Gaze right */
          30%, 50% { transform: translate(0, 0); }
          60% { transform: translate(-12px, 1px); } /* Gaze left */
          70%, 80% { transform: translate(0, 0); }
          85% { transform: translate(0, -3px); } /* Laugh/Smile bounce */
          95% { transform: translate(0, 0); }
        }
        @keyframes armFloatL {
          0%, 100% { transform: translateY(0) rotate(0); }
          50% { transform: translateY(-5px) rotate(-1.5deg); }
        }
        @keyframes armFloatR {
          0%, 100% { transform: translateY(0) rotate(0); }
          50% { transform: translateY(-5px) rotate(1.5deg); }
        }
        @keyframes armSwayL {
          0%, 100% { transform: translateX(0) rotate(-1deg); }
          50% { transform: translateX(-2px) rotate(1deg); }
        }
        @keyframes armSwayR {
          0%, 100% { transform: translateX(0) rotate(1deg); }
          50% { transform: translateX(2px) rotate(-1deg); }
        }
        @keyframes eyeBlink {
          0%, 94%, 100% { transform: scaleY(1); opacity: 1; }
          96% { transform: scaleY(0.1); opacity: 0.3; }
        }
        @keyframes mouthTalk {
          from { d: path("M92 88 Q100 93 108 88"); }
          to { d: path("M88 88 Q100 102 112 88"); }
        }
        @keyframes shadowPulse {
          0%, 100% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(0.65); opacity: 0.1; }
        }

        .vr-launch-bar {
          display: flex !important; align-items: center !important; justify-content: center !important;
          padding: 1.5rem 0; z-index: 100; width: 100%;
        }
        .vr-launch-btn-premium {
          position: relative; overflow: hidden;
          background: #0E836D; color: #FFFFE3; border: none; padding: 1.2rem 4rem; 
          border-radius: 4px; font-size: 0.85rem; font-weight: 900; cursor: pointer;
          box-shadow: 0 10px 30px rgba(14,131,109,0.2); transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
          text-transform: uppercase; letter-spacing: 0.25em; font-family: 'Space Grotesk', sans-serif;
          border: 1px solid rgba(255,255,227,0.1);
        }
        .vr-launch-btn-premium .btn-content { position: relative; z-index: 2; display: flex; align-items: center; gap: 1rem; }
        .vr-launch-btn-premium:hover { transform: translateY(-2px); box-shadow: 0 15px 40px rgba(14,131,109,0.4); border-color: #0E836D; }
        .vr-launch-btn-premium:active { transform: translateY(0); }
        .vr-launch-btn-premium:disabled { opacity: 0.7; cursor: wait; filter: grayscale(0.2); }
        
        .btn-loader {
          width: 18px; height: 18px; border: 2px solid rgba(255,255,227,0.2);
          border-top-color: #FFFFE3; border-radius: 50%;
          animation: btnSpin 0.8s linear infinite;
        }
        @keyframes btnSpin { to { transform: rotate(360deg); } }
        
        .vr-launch-btn-premium::after {
          content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,227,0.1), transparent);
          transition: 0.6s;
        }
        .vr-launch-btn-premium:hover::after { left: 100%; }

        .vr-chat-col { width: 380px; background: #0d0e12; border-left: 1px solid rgba(255,255,255,0.05); display: flex; flex-direction: column; }
        .vr-transcript { height: 100%; display: flex; flex-direction: column; padding: 1.5rem; }
        .vr-transcript-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; opacity: 0.6; }
        .vr-transcript-title { font-size: 0.75rem; font-weight: 900; letter-spacing: 0.1em; }
        .vr-transcript-count { background: rgba(14,131,109,0.1); color: #0E836D; padding: 2px 10px; border-radius: 8px; font-size: 0.7rem; font-weight: 800; }
        .vr-transcript-body { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 1.2rem; }
        
        .chat-bubble-wrap { display: flex; width: 100%; }
        .chat-bubble-wrap.ai { justify-content: flex-start; }
        .chat-bubble-wrap.user { justify-content: flex-end; }
        .chat-bubble { max-width: 85%; padding: 1rem; border-radius: 1.2rem; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); }
        .bubble-role { font-size: 0.6rem; font-weight: 900; color: #0E836D; margin-bottom: 0.3rem; text-transform: uppercase; }
        .bubble-content { font-size: 0.9rem; color: rgba(255,255,255,0.85); line-height: 1.5; }

        .vr-bottom-bar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1.2rem 2.5rem; background: rgba(255,255,255,0.02); border-top: 1px solid rgba(255,255,255,0.05);
          z-index: 150; backdrop-filter: blur(10px);
        }
        .bar-section { display: flex; align-items: center; gap: 1.2rem; }
        .bar-btn {
          width: 48px; height: 48px; border-radius: 0.8rem; background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08); color: white; display: flex;
          align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s;
        }
        .bar-btn:hover { background: rgba(255,255,227,0.08); border-color: #0E836D; }
        .bar-btn.active { color: #0E836D; border-color: rgba(14,131,109,0.3); }
        .end-session-btn {
          width: 50px; height: 50px; border-radius: 50%; background: #8b3a3a;
          border: none; display: flex; align-items: center; justify-content: center; cursor: pointer;
        }

        .vr-cam-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.5); }
        .vr-cam-ready { font-size: 0.75rem; font-weight: 800; color: #0E836D; letter-spacing: 0.1em; }

        @keyframes ringPulse { 0% { transform: scale(1); opacity: 0.5; } 100% { transform: scale(1.3); opacity: 0; } }
      `}</style>
    </div>
  );
};

export default VoiceRoom;
