import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../api/auth';

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
    <div className="min-h-screen bg-[#0a0a0f] grid-bg flex items-center justify-center px-4">
      {/* Glow orb */}
      <div className="absolute w-96 h-96 bg-purple-900/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 border border-purple-500/50 bg-purple-600/10 mb-4 glow-purple">
            <span className="text-3xl">🎮</span>
          </div>
          <h1 className="font-orbitron font-black text-2xl text-white tracking-widest text-glow-purple">
            GAME<span className="text-purple-400">CAFÉ</span>
          </h1>
          <p className="text-xs text-purple-800 tracking-widest font-mono-game mt-1">MANAGEMENT SYSTEM</p>
        </div>

        {/* Card */}
        <div className="bg-[#0d0d1a] border border-purple-700/40 glow-purple">
          <div className="h-[2px] bg-gradient-to-r from-purple-600 to-cyan-500" />
          <div className="p-8">
            <p className="font-orbitron text-xs text-purple-600 tracking-widest mb-6 uppercase">// Operator Login</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="game-label">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoFocus
                  placeholder="admin"
                  className="game-input"
                />
              </div>

              <div>
                <label className="game-label">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="game-input"
                />
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
