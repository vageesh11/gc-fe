import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../api/auth';

/* ─── Big, minimal billiards login scene ─── */
function BilliardsScene() {
  return (
    <svg
      aria-hidden="true"
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        height: '320px',
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'visible',
      }}
      viewBox="0 0 1920 320"
      preserveAspectRatio="xMidYMax meet"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="ls-g1" cx="20%" cy="50%" r="55%">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ls-g2" cx="80%" cy="50%" r="55%">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ls-shine-w" cx="32%" cy="30%" r="55%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.6" />
          <stop offset="60%" stopColor="#fff" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ls-shine-p" cx="32%" cy="30%" r="55%">
          <stop offset="0%" stopColor="#e0c0ff" stopOpacity="0.55" />
          <stop offset="60%" stopColor="#7c3aed" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ls-shine-c" cx="32%" cy="30%" r="55%">
          <stop offset="0%" stopColor="#b0f0ff" stopOpacity="0.55" />
          <stop offset="60%" stopColor="#06b6d4" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
        </radialGradient>
        <style>{`
          @keyframes ls-drift1 {
            0%,100% { transform: translate(0px,  0px); }
            35%     { transform: translate(40px, -60px); }
            70%     { transform: translate(-25px,-35px); }
          }
          @keyframes ls-drift2 {
            0%,100% { transform: translate(0px, 0px); }
            40%     { transform: translate(-45px,-50px); }
            75%     { transform: translate(30px,-28px); }
          }
          @keyframes ls-drift3 {
            0%,100% { transform: translate(0px, 0px); }
            50%     { transform: translate(25px,-70px); }
          }
          @keyframes ls-cue {
            0%,100% { opacity: 0.20; }
            50%     { opacity: 0.42; }
          }
          @keyframes ls-rack {
            0%,100% { opacity: 0.15; }
            50%     { opacity: 0.28; }
          }
          @keyframes ls-spin {
            0%   { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .ls-d1  { animation: ls-drift1 20s ease-in-out infinite; }
          .ls-d2  { animation: ls-drift2 24s ease-in-out infinite 4s; }
          .ls-d3  { animation: ls-drift3 18s ease-in-out infinite 8s; }
          .ls-cue { animation: ls-cue 7s ease-in-out infinite; }
          .ls-cue2{ animation: ls-cue 7s ease-in-out infinite 3.5s; }
          .ls-rack{ animation: ls-rack 6s ease-in-out infinite 2s; }
          .ls-spin{ animation: ls-spin 16s linear infinite; transform-origin: 36px 36px; }
        `}</style>
      </defs>

      {/* Large ambient glows */}
      <ellipse cx="20%" cy="50%" rx="700" ry="700" fill="url(#ls-g1)" />
      <ellipse cx="80%" cy="50%" rx="700" ry="700" fill="url(#ls-g2)" />

      {/* ═══ LEFT: Full pool table ═══ */}
      <g opacity="0.25">
        <rect x="-80" y="120" width="480" height="300" rx="20"
          fill="#0c1e0c" stroke="#7c3aed" strokeWidth="3.5" />
        <rect x="-52" y="148" width="424" height="244" rx="10"
          fill="#0a1f0a" />
        <rect x="-52" y="148" width="424" height="244" rx="10"
          fill="none" stroke="#5b21b6" strokeWidth="2" />
        {/* Centre line */}
        <line x1="160" y1="148" x2="160" y2="392"
          stroke="#5b21b6" strokeWidth="1.5" strokeDasharray="10 10" />
        {/* Baulk line */}
        <line x1="60" y1="148" x2="60" y2="392"
          stroke="#5b21b6" strokeWidth="1" strokeDasharray="6 12" />
        {/* D */}
        <path d="M60,240 A55,55 0 0,1 60,320"
          fill="none" stroke="#5b21b6" strokeWidth="2" />
        {/* Spot */}
        <circle cx="260" cy="270" r="6" fill="#7c3aed" />
        {/* 6 pockets */}
        {([[-52,148],[372,148],[-52,270],[372,270],[-52,392],[372,392]] as [number,number][]).map(([px,py],i) => (
          <g key={i}>
            <circle cx={px} cy={py} r="20" fill="#050505" stroke="#7c3aed" strokeWidth="2.5" />
            <circle cx={px} cy={py} r="11" fill="#000" />
          </g>
        ))}
      </g>

      {/* ─ Left: giant cue ball drifting ─ */}
      <g className="ls-d1" style={{ transformOrigin: '100px 480px' }}>
        <circle cx="100" cy="480" r="70"
          fill="#d8d8d8" fillOpacity="0.11"
          stroke="#cccccc" strokeWidth="2.5" strokeOpacity="0.28" />
        <circle cx="100" cy="480" r="70" fill="url(#ls-shine-w)" fillOpacity="0.20" />
      </g>

      {/* ─ Left: cue stick ─ */}
      <g className="ls-cue">
        <line x1="-60" y1="530" x2="88" y2="484"
          stroke="#c9a96e" strokeWidth="7" strokeOpacity="0.22" strokeLinecap="round" />
        <line x1="88" y1="484" x2="100" y2="480"
          stroke="#4a8fd9" strokeWidth="10" strokeOpacity="0.28" strokeLinecap="round" />
        <line x1="100" y1="480" x2="380" y2="410"
          stroke="#ffffff" strokeWidth="2"
          strokeOpacity="0.10" strokeDasharray="14 16" />
      </g>

      {/* ═══ RIGHT: Full pool table ═══ */}
      <g opacity="0.20">
        <rect x="1580" y="150" width="480" height="300" rx="20"
          fill="#0c1e0c" stroke="#06b6d4" strokeWidth="3.5" />
        <rect x="1608" y="178" width="424" height="244" rx="10"
          fill="#0a1f0a" />
        <rect x="1608" y="178" width="424" height="244" rx="10"
          fill="none" stroke="#0891b2" strokeWidth="2" />
        <line x1="1820" y1="178" x2="1820" y2="422"
          stroke="#0891b2" strokeWidth="1.5" strokeDasharray="10 10" />
        <circle cx="1920" cy="300" r="6" fill="#06b6d4" />
        {([[1608,178],[2032,178],[1608,300],[2032,300],[1608,422],[2032,422]] as [number,number][]).map(([px,py],i) => (
          <g key={i}>
            <circle cx={px} cy={py} r="20" fill="#050505" stroke="#06b6d4" strokeWidth="2.5" />
            <circle cx={px} cy={py} r="11" fill="#000" />
          </g>
        ))}
      </g>

      {/* ─ Right: giant purple ball ─ */}
      <g className="ls-d2" style={{ transformOrigin: '1870px 100px' }}>
        <circle cx="1870" cy="100" r="72"
          fill="#7c3aed" fillOpacity="0.10"
          stroke="#a855f7" strokeWidth="2.5" strokeOpacity="0.28" />
        <circle cx="1870" cy="100" r="72" fill="url(#ls-shine-p)" fillOpacity="0.18" />
      </g>

      {/* ─ Right: giant cyan ball ─ */}
      <g className="ls-d3" style={{ transformOrigin: '1860px 530px' }}>
        <circle cx="1860" cy="530" r="60"
          fill="#06b6d4" fillOpacity="0.09"
          stroke="#22d3ee" strokeWidth="2.5" strokeOpacity="0.25" />
        <circle cx="1860" cy="530" r="60" fill="url(#ls-shine-c)" fillOpacity="0.16" />
      </g>

      {/* ─ Right: cue stick ─ */}
      <g className="ls-cue2">
        <line x1="1960" y1="145" x2="1882" y2="104"
          stroke="#c9a96e" strokeWidth="7" strokeOpacity="0.20" strokeLinecap="round" />
        <line x1="1882" y1="104" x2="1870" y2="100"
          stroke="#4a8fd9" strokeWidth="10" strokeOpacity="0.25" strokeLinecap="round" />
        <line x1="1870" y1="100" x2="1620" y2="165"
          stroke="#ffffff" strokeWidth="2"
          strokeOpacity="0.08" strokeDasharray="14 16" />
      </g>

      {/* ═══ CENTRE-BOTTOM: large triangle rack ═══ */}
      <g className="ls-rack" style={{ transformOrigin: '960px 700px' }}>
        <polygon points="960,570 1060,740 860,740"
          fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeOpacity="0.40" />
        {([
          [960, 590, '#e8e8e8'],
          [942, 622, '#7c3aed'], [978, 622, '#06b6d4'],
          [924, 654, '#a855f7'], [960, 654, '#111111'], [996, 654, '#22d3ee'],
          [906, 686, '#7c3aed'], [942, 686, '#e8e8e8'], [978, 686, '#a855f7'], [1014,686, '#06b6d4'],
        ] as [number,number,string][]).map(([bx,by,bc],i) => (
          <g key={i}>
            <circle cx={bx} cy={by} r="16"
              fill={bc} fillOpacity="0.20"
              stroke={bc === '#111111' ? '#7c3aed' : bc}
              strokeWidth="1.5" strokeOpacity="0.38" />
            <circle cx={bx-5} cy={by-5} r="6" fill="#fff" fillOpacity="0.12" />
            {bc === '#111111' && (
              <text x={bx} y={by+6} textAnchor="middle"
                fontSize="14" fill="#fff" fillOpacity="0.22"
                fontFamily="serif" fontWeight="bold">8</text>
            )}
          </g>
        ))}
      </g>

    </svg>
  );
}

export function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = await login(username, password);
      localStorage.setItem('gc_token', data.token);
      localStorage.setItem('gc_user', JSON.stringify(data.user));
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Invalid credentials');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] grid-bg flex items-center justify-center px-4"
      style={{ position: 'relative', overflow: 'hidden' }}>

      <BilliardsScene />

      {/* Centre glow */}
      <div className="absolute w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm relative" style={{ zIndex: 1 }}>

        {/* Logo — 8-ball SVG */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
            <svg width="84" height="84" viewBox="0 0 84 84" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="logo-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="ball-hi" cx="34%" cy="28%" r="52%">
                  <stop offset="0%" stopColor="#fff" stopOpacity="0.85" />
                  <stop offset="55%" stopColor="#fff" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                </radialGradient>
                <style>{`
                  @keyframes lgo-spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
                  @keyframes lgo-pulse{0%,100%{opacity:0.55}50%{opacity:1}}
                  .lgo-ring{animation:lgo-spin 14s linear infinite;transform-origin:42px 42px}
                  .lgo-pulse{animation:lgo-pulse 3s ease-in-out infinite}
                `}</style>
              </defs>
              <circle cx="42" cy="42" r="40" fill="url(#logo-glow)" />
              {/* Spinning arc ring */}
              <g className="lgo-ring">
                <path d="M42,5 A37,37 0 0,1 79,42"
                  fill="none" stroke="#a855f7" strokeWidth="2.5" strokeOpacity="0.55" />
                <path d="M79,42 A37,37 0 0,1 42,79"
                  fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeOpacity="0.55" />
                <circle cx="79" cy="42" r="4" fill="#06b6d4" fillOpacity="0.8" />
              </g>
              {/* 8-ball body */}
              <circle cx="42" cy="42" r="34" fill="#111" />
              <circle cx="42" cy="42" r="34" stroke="#333" strokeWidth="1" fill="none" />
              {/* White circle */}
              <circle cx="42" cy="42" r="14" fill="#f0f0f0" />
              {/* "8" */}
              <text x="42" y="48" textAnchor="middle"
                fontSize="16" fontWeight="bold" fill="#111"
                fontFamily="serif">8</text>
              {/* Shine */}
              <circle cx="42" cy="42" r="34" fill="url(#ball-hi)" />
              {/* Outer ring */}
              <circle cx="42" cy="42" r="36"
                fill="none" stroke="#7c3aed" strokeWidth="2" strokeOpacity="0.65" />
            </svg>
          </div>

          <h1 className="font-orbitron font-black text-2xl text-white tracking-widest text-glow-purple">
            GAME<span className="text-purple-400">CAFÉ</span>
          </h1>
          <p className="text-xs text-purple-800 tracking-widest font-mono-game mt-1">MANAGEMENT SYSTEM</p>
        </div>

        {/* Card */}
        <div className="bg-[#0d0d1a]/90 border border-purple-700/40 glow-purple backdrop-blur-sm relative">
          <div className="h-[2px] bg-gradient-to-r from-purple-600 to-cyan-500" />
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-purple-500/60" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-500/60" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-purple-500/60" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-500/60" />

          <div className="p-8">
            <p className="font-orbitron text-xs text-purple-600 tracking-widest mb-6 uppercase">// Operator Login</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="game-label">Username</label>
                <input type="text" value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required autoFocus placeholder="admin" className="game-input" />
              </div>
              <div>
                <label className="game-label">Password</label>
                <input type="password" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required placeholder="••••••••" className="game-input" />
              </div>

              {error && (
                <div className="border border-red-800/40 bg-red-950/20 px-3 py-2 flex items-center gap-2">
                  <span className="text-red-400 text-xs">⚠</span>
                  <p className="text-red-400 text-xs font-mono-game tracking-wide">{error}</p>
                </div>
              )}

              <button type="submit" disabled={submitting} className="game-btn-primary mt-2">
                {submitting ? '// Authenticating…' : '▶ Login'}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-xs text-purple-900 font-mono-game tracking-widest mt-6">
          TOKEN EXPIRES AFTER 8 HOURS
        </p>
      </div>
    </div>
  );
}
