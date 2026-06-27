import React, { useEffect, useState } from 'react';
import type { ActiveTableSession, SessionFrame } from '../../types';
import { getFrames, startFrame, endFrame } from '../../api/frames';
import { Modal } from '../../components/Modal';

interface Props {
  open: boolean;
  session: ActiveTableSession | null;
  onClose: () => void;
}

export function FrameSessionModal({ open, session, onClose }: Props) {
  const [frames, setFrames]           = useState<SessionFrame[]>([]);
  const [playerName, setPlayerName]   = useState('');
  const [loading, setLoading]         = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState('');

  const activeFrame = frames.find(f => !f.ended_at) ?? null;

  async function loadFrames() {
    if (!session) return;
    setLoading(true);
    try { setFrames(await getFrames(session.id)); }
    catch { setError('Failed to load frames'); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (open && session) { setError(''); setPlayerName(''); loadFrames(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, session?.id]);

  async function handleStartFrame(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !playerName.trim()) return;
    setError(''); setSubmitting(true);
    try {
      await startFrame(session.id, playerName.trim());
      setPlayerName('');
      await loadFrames();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to start frame');
    } finally { setSubmitting(false); }
  }

  async function handleEndFrame(frameId: number) {
    setError(''); setSubmitting(true);
    try {
      await endFrame(frameId);
      await loadFrames();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to end frame');
    } finally { setSubmitting(false); }
  }

  const completedFrames = frames.filter(f => f.ended_at);
  const totalAmount = completedFrames.reduce((sum, f) => sum + parseFloat(f.amount ?? '0'), 0);

  function fmt(dt: string) {
    return new Date(dt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  return (
    <Modal open={open} onClose={onClose} title={`Frames — ${session?.table_name ?? ''}`}>
      <div className="flex flex-col gap-5">

        {/* Active frame indicator */}
        {activeFrame && (
          <div className="border border-red-700/60 bg-red-950/20 px-4 py-3 flex items-center justify-between">
            <div>
              <p className="font-orbitron text-xs text-red-500 tracking-widest uppercase mb-0.5">● Frame Running</p>
              <p className="text-white font-semibold text-sm">{activeFrame.player_name}</p>
              <p className="text-gray-500 text-xs font-mono-game">Since {fmt(activeFrame.started_at)}</p>
            </div>
            <button
              disabled={submitting}
              onClick={() => handleEndFrame(activeFrame.id)}
              className="px-4 py-2 font-orbitron text-xs font-bold tracking-widest uppercase border
                bg-red-600/20 border-red-600/50 text-red-400 hover:bg-red-600/40 hover:text-red-200
                disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              ■ End Frame
            </button>
          </div>
        )}

        {/* Start new frame */}
        {!activeFrame && (
          <form onSubmit={handleStartFrame} className="flex gap-2">
            <input
              type="text"
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              placeholder="Player name…"
              maxLength={150}
              required
              className="game-input flex-1"
            />
            <button
              type="submit"
              disabled={submitting || !playerName.trim()}
              className="px-4 py-2 font-orbitron text-xs font-bold tracking-widest uppercase border
                bg-emerald-600/20 border-emerald-600/50 text-emerald-400 hover:bg-emerald-600/40
                disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap">
              + Start Frame
            </button>
          </form>
        )}

        {error && (
          <p className="text-red-400 text-xs font-mono-game border border-red-800/40 bg-red-950/20 px-3 py-2">⚠ {error}</p>
        )}

        {/* Completed frames list */}
        {loading ? (
          <p className="text-gray-600 text-xs text-center font-mono-game">Loading…</p>
        ) : completedFrames.length > 0 ? (
          <div className="border border-purple-900/30">
            <div className="px-4 py-2 border-b border-purple-900/30 flex justify-between items-center">
              <span className="font-orbitron text-xs text-purple-600 tracking-widest uppercase">// Frames Log</span>
              <span className="font-mono-game text-xs text-gray-500">{completedFrames.length} frame{completedFrames.length !== 1 ? 's' : ''}</span>
            </div>
            {completedFrames.map((f, i) => (
              <div key={f.id} className={`px-4 py-2.5 flex items-center justify-between ${i < completedFrames.length - 1 ? 'border-b border-purple-900/20' : ''}`}>
                <div>
                  <p className="text-gray-200 text-xs font-semibold">{f.player_name}</p>
                  <p className="text-gray-600 text-xs font-mono-game">
                    {fmt(f.started_at)} → {f.ended_at ? fmt(f.ended_at) : '—'}
                    {f.duration_min != null && <span className="ml-2 text-purple-700">({Math.ceil(Number(f.duration_min))} min)</span>}
                  </p>
                </div>
                <span className="font-mono-game font-bold text-sm text-cyan-400">
                  ₹{Math.round(parseFloat(f.amount ?? '0'))}
                </span>
              </div>
            ))}
            <div className="px-4 py-2.5 border-t border-purple-900/30 flex justify-between bg-purple-900/5">
              <span className="font-orbitron text-xs text-purple-400 tracking-widest uppercase">Total</span>
              <span className="font-mono-game font-black text-base text-cyan-400">₹{Math.round(totalAmount)}</span>
            </div>
          </div>
        ) : (
          <p className="text-gray-700 text-xs text-center font-mono-game py-2">No completed frames yet.</p>
        )}

        <button onClick={onClose}
          className="w-full py-2 font-orbitron text-xs font-bold tracking-widest uppercase border
            border-gray-700/50 text-gray-500 hover:text-gray-300 hover:border-gray-600/60 transition-colors">
          Close
        </button>
      </div>
    </Modal>
  );
}
