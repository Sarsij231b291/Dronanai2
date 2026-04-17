import React from 'react';

const TrustedBy = () => {
  return (
    <div className="trusted-by-section">

      {/* Floating ambient icons — ink wash style */}
      <div className="floating-background">
        {[
          { top:'12%', left:'8%',  delay:'0s',   dur:'22s', size:44 },
          { top:'68%', left:'6%',  delay:'-7s',  dur:'30s', size:52 },
          { top:'20%', left:'87%', delay:'-13s', dur:'26s', size:60 },
          { top:'78%', left:'85%', delay:'-4s',  dur:'34s', size:40 },
          { top:'45%', left:'91%', delay:'-18s', dur:'38s', size:36 },
        ].map((pos, i) => (
          <div
            key={i}
            className="floating-logo"
            style={{ top: pos.top, left: pos.left, animationDelay: pos.delay, animationDuration: pos.dur }}
          >
            <svg width={pos.size} height={pos.size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              {i === 0 && <><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><line x1="2" y1="12" x2="22" y2="12"/></>}
              {i === 1 && <><rect x="3" y="3" width="8" height="8"/><rect x="13" y="3" width="8" height="8"/><rect x="3" y="13" width="8" height="8"/><rect x="13" y="13" width="8" height="8"/></>}
              {i === 2 && <><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>}
              {i === 3 && <><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></>}
              {i === 4 && <><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></>}
            </svg>
          </div>
        ))}
      </div>

      <style>{`
        .trusted-by-section {
          position: relative;
          height: 0;
          overflow: visible;
        }

        .floating-background {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
        }

        .floating-logo {
          position: absolute;
          color: var(--ink-steel);
          opacity: 0.06;
          animation-name: floatAround;
          animation-iteration-count: infinite;
          animation-timing-function: ease-in-out;
        }

        .dark .floating-logo {
          color: var(--ink-ivory);
          opacity: 0.035;
        }

        @keyframes floatAround {
          0%   { transform: translate(0px,   0px)   rotate(0deg);  }
          25%  { transform: translate(20px, -40px)  rotate(6deg);  }
          50%  { transform: translate(-15px, 15px)  rotate(-4deg); }
          75%  { transform: translate(30px,  10px)  rotate(8deg);  }
          100% { transform: translate(0px,   0px)   rotate(0deg);  }
        }
      `}</style>
    </div>
  );
};

export default TrustedBy;
