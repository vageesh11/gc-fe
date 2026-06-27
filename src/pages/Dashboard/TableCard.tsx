import { useEffect, useState, useCallback, useRef } from 'react';
import type { GamingTable, ActiveTableSession } from '../../types';
import { getTableActiveSession } from '../../api/tables';
import { Badge } from '../../components/Badge';
import { Spinner } from '../../components/Spinner';

const TYPE_ICONS: Record<string, string> = { pool: '🎱', snooker: '🎯', ps5: '🎮' };
const TYPE_LABEL: Record<string, string> = { pool: 'Pool', snooker: 'Snooker', ps5: 'PS5' };

const TYPE_ACCENT: Record<string, { border: string; text: string; bg: string }> = {
  pool:    { border: 'border-cyan-600/50',   text: 'text-cyan-400',   bg: 'bg-cyan-500/10' },
  snooker: { border: 'border-purple-600/50', text: 'text-purple-400', bg: 'bg-purple-500/10' },
  ps5:     { border: 'border-violet-500/50', text: 'text-violet-400', bg: 'bg-violet-500/10' },
};

interface TableCardProps {
  table: GamingTable;
  onStartSession: (table: GamingTable) => void;
  onEndSession: (table: GamingTable, session: ActiveTableSession) => void;
  onPauseSession: (table: GamingTable, session: ActiveTableSession) => void;
  onResumeSession: (table: GamingTable, session: ActiveTableSession) => void;
  onConfirmBooking: (table: GamingTable, session: ActiveTableSession) => void;
  onCancelBooking: (table: GamingTable, session: ActiveTableSession) => void;
  onAddOrder: (table: GamingTable, session: ActiveTableSession) => void;
  onManageFrames: (table: GamingTable, session: ActiveTableSession) => void;
  onViewBill: (sessionId: number) => void;
  refreshSignal?: number;
}

/**
 * Live countdown for fixed_slot sessions.
 * - Active: ticks every second from last-known billable elapsed (duration_min from poll).
 * - Paused: frozen — no ticker, remaining is stable until resumed.
 */
function useFixedSlotCountdown(
  session: ActiveTableSession | null,
  isPaused: boolean
): number | null {
  const [remainingSecs, setRemainingSecs] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Clear any existing ticker
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }

    if (!session || session.booking_type !== 'fixed_slot' || !session.booked_duration) {
      setRemainingSecs(null);
      return;
    }

    const totalSecs     = session.booked_duration * 60;
    const elapsedSecs   = (session.duration_min ?? 0) * 60; // billable elapsed at last poll
    const pollTimestamp = Date.now();

    const calc = () => {
      if (isPaused) return Math.max(totalSecs - elapsedSecs, 0);
      const secsSincePoll = Math.floor((Date.now() - pollTimestamp) / 1000);
      return Math.max(totalSecs - elapsedSecs - secsSincePoll, 0);
    };

    setRemainingSecs(calc());

    if (!isPaused) {
      intervalRef.current = setInterval(() => setRemainingSecs(calc()), 1000);
    }

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  // Re-run when session id, elapsed minutes, or pause state changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id, session?.duration_min, isPaused]);

  return remainingSecs;
}

function fmtCountdown(secs: number): string {
  if (secs <= 0) return '00:00';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function TableCard({
  table, onStartSession, onEndSession, onPauseSession, onResumeSession,
  onConfirmBooking, onCancelBooking, onAddOrder, onManageFrames, onViewBill, refreshSignal,
}: TableCardProps) {
  const [session, setSession] = useState<ActiveTableSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(false);

  const accent = TYPE_ACCENT[table.type] ?? TYPE_ACCENT.pool;
  const isOccupied = table.status === 'OCCUPIED';
  const isPaused   = table.status === 'PAUSED';
  const isReserved = table.status === 'RESERVED';
  const isActive   = isOccupied || isPaused || isReserved;

  const isFixedSlot   = session?.booking_type === 'fixed_slot';
  const remainingSecs = useFixedSlotCountdown(session, isPaused);
  const isExpiring    = remainingSecs !== null && remainingSecs <= 300 && remainingSecs > 0; // last 5 min
  const isOvertime    = remainingSecs !== null && remainingSecs === 0;

  const fetchSession = useCallback(async () => {
    if (table.status === 'AVAILABLE') { setSession(null); return; }
    setLoadingSession(true);
    try { setSession(await getTableActiveSession(table.id)); }
    catch { setSession(null); }
    finally { setLoadingSession(false); }
  }, [table.id, table.status]);

  useEffect(() => { fetchSession(); }, [fetchSession, refreshSignal]);

  // Poll every 30s while actively billing; poll every 10s in last 5 min to stay fresh
  useEffect(() => {
    if (!isOccupied) return;
    const interval = isExpiring ? 10_000 : 30_000;
    const id = setInterval(fetchSession, interval);
    return () => clearInterval(id);
  }, [isOccupied, isExpiring, fetchSession]);

  // Card border colour by status
  const cardBorder = isOccupied
    ? isExpiring
      ? 'border-orange-500/70 shadow-lg shadow-orange-900/30'
      : 'border-red-500/60 shadow-lg shadow-red-900/20'
    : isPaused
    ? 'border-amber-500/50 shadow-lg shadow-amber-900/20'
    : isReserved
    ? 'border-blue-500/60 shadow-lg shadow-blue-900/20'
    : `${accent.border} hover:shadow-lg`;

  const cornerColor = isOccupied
    ? isExpiring ? 'border-orange-400' : 'border-red-400'
    : isPaused   ? 'border-amber-400'
    : isReserved ? 'border-blue-400'
    : accent.text.replace('text-', 'border-');

  const pulseColor = isOccupied
    ? isExpiring ? 'bg-orange-400' : 'bg-red-400'
    : isPaused   ? 'bg-amber-400'
    : 'bg-blue-400';

  return (
    <div className={`relative flex flex-col gap-4 p-5 border transition-all duration-300 bg-[#0d0d1a] ${cardBorder}`}>
      {/* Corner accents */}
      {(['top-0 left-0 border-t-2 border-l-2', 'top-0 right-0 border-t-2 border-r-2',
        'bottom-0 left-0 border-b-2 border-l-2', 'bottom-0 right-0 border-b-2 border-r-2'] as const).map((cls) => (
        <span key={cls} className={`absolute w-3 h-3 ${cls} ${cornerColor}`} />
      ))}

      {/* Status pulse */}
      {isActive && (
        <span className="absolute top-3 right-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${pulseColor}`} />
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${pulseColor}`} />
          </span>
        </span>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 flex items-center justify-center text-xl ${accent.bg} border ${accent.border}`}>
            {TYPE_ICONS[table.type]}
          </div>
          <div>
            <h3 className="font-orbitron font-bold text-white text-sm tracking-wide leading-tight">{table.name}</h3>
            <span className={`text-xs font-semibold tracking-widest uppercase ${accent.text}`}>{TYPE_LABEL[table.type]}</span>
          </div>
        </div>
        <Badge variant={isOccupied ? 'danger' : isPaused ? 'warning' : isReserved ? 'info' : 'success'}>
          {isOccupied ? '● Live' : isPaused ? '⏸ Paused' : isReserved ? '🔵 Reserved' : 'Open'}
        </Badge>
      </div>

      {/* Price */}
      <div className="flex items-baseline gap-1 border-b border-gray-800 pb-3">
        <span className={`font-mono-game font-medium text-lg ${accent.text}`}>₹{parseFloat(table.price_per_hour).toFixed(0)}</span>
        <span className="text-gray-600 text-xs tracking-wider">/ HR</span>
      </div>

      {/* Session info */}
      {isActive && (
        <div className={`border p-3 text-sm bg-[#0a0a12] ${
          isReserved ? 'border-blue-900/40' : isPaused ? 'border-amber-900/40' : 'border-red-900/30'
        }`}>
          {loadingSession ? (
            <div className="flex justify-center py-2"><Spinner size="sm" /></div>
          ) : session ? (
            <div className="flex flex-col gap-2">
              {session.customer_name && (
                <div className="flex justify-between">
                  <span className="text-gray-500 text-xs tracking-wider uppercase">Customer</span>
                  <span className={`font-semibold text-xs ${isReserved ? 'text-blue-300' : 'text-gray-200'}`}>
                    {session.customer_name}
                  </span>
                </div>
              )}
              {session.customer_phone && (
                <div className="flex justify-between">
                  <span className="text-gray-500 text-xs tracking-wider uppercase">Phone</span>
                  <span className="font-mono-game text-xs text-gray-500">{session.customer_phone}</span>
                </div>
              )}

              {isReserved ? (
                <>
                  {session.scheduled_start && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-xs tracking-wider uppercase">Scheduled</span>
                      <span className="font-mono-game text-xs text-blue-400">
                        {new Date(session.scheduled_start).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                  )}
                  {session.booked_duration && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-xs tracking-wider uppercase">Duration</span>
                      <span className="font-mono-game text-xs text-blue-400">{session.booked_duration} min</span>
                    </div>
                  )}
                  <div className="text-xs text-blue-800 font-mono-game mt-1 tracking-wider">AWAITING ARRIVAL</div>
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-xs tracking-wider uppercase">Duration</span>
                    <span className={`font-mono-game font-semibold ${isPaused ? 'text-amber-300' : 'text-red-300'}`}>
                      {session.duration_min ?? 0} min
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-xs tracking-wider uppercase">Table cost</span>
                    <span className={`font-mono-game font-semibold ${isPaused ? 'text-amber-300' : 'text-red-300'}`}>
                      ₹{parseFloat(session.session_amount ?? '0').toFixed(2)}
                    </span>
                  </div>

                  {/* ── Fixed-slot countdown ── */}
                  {isFixedSlot && remainingSecs !== null && (
                    <div className={`mt-1 border px-3 py-2 flex items-center justify-between ${
                      isPaused
                        ? 'border-amber-800/40 bg-amber-950/20'
                        : isExpiring
                        ? 'border-orange-700/50 bg-orange-950/20'
                        : 'border-purple-900/40 bg-[#07070f]'
                    }`}>
                      <span className="text-xs uppercase tracking-wider font-mono-game text-gray-500">
                        {isPaused ? 'Remaining (paused)' : 'Time left'}
                      </span>
                      <span className={`font-mono-game font-black text-lg tabular-nums ${
                        isPaused
                          ? 'text-amber-400'
                          : isExpiring
                          ? 'text-orange-400 animate-pulse'
                          : 'text-cyan-400'
                      }`}>
                        {fmtCountdown(remainingSecs)}
                      </span>
                    </div>
                  )}

                  {isPaused && (
                    <div className="text-xs text-amber-700 font-mono-game mt-1 tracking-wider">⏸ CLOCK PAUSED</div>
                  )}
                  {isOccupied && !isFixedSlot && (
                    <div className="text-xs text-gray-600 font-mono-game mt-1">
                      SINCE {new Date(session.start_time).toLocaleTimeString()}
                    </div>
                  )}
                  {isExpiring && isOccupied && (
                    <div className="text-xs text-orange-600 font-mono-game mt-1 tracking-wider animate-pulse">
                      ⚠ SLOT ENDING SOON
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <p className="text-gray-600 text-xs text-center tracking-wider">LOADING SESSION…</p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2 mt-auto">
        {table.status === 'AVAILABLE' ? (
          <button onClick={() => onStartSession(table)}
            className="w-full py-2.5 px-4 text-sm font-bold tracking-widest uppercase transition-all duration-200
              bg-purple-600/20 border border-purple-500/60 text-purple-300 hover:bg-purple-600/40 hover:text-white">
            ▶ Start Session
          </button>
        ) : isReserved ? (
          <>
            <button onClick={() => session && onConfirmBooking(table, session)}
              disabled={!session}
              className="w-full py-2.5 px-4 text-sm font-bold tracking-widest uppercase transition-all duration-200
                bg-blue-600/20 border border-blue-500/60 text-blue-300 hover:bg-blue-600/40 hover:text-white disabled:opacity-30">
              ✓ Confirm Arrival
            </button>
            <button onClick={() => session && onCancelBooking(table, session)}
              disabled={!session}
              className="w-full py-2 px-4 text-xs font-bold tracking-widest uppercase transition-all
                bg-gray-700/20 border border-gray-600/30 text-gray-500 hover:bg-red-900/20 hover:border-red-800/40 hover:text-red-400 disabled:opacity-30">
              ✕ Cancel Booking
            </button>
          </>
        ) : (
          <>
            {session && isOccupied && session.booking_type === 'frame_wise' && (
              <button onClick={() => onManageFrames(table, session)}
                className="w-full py-2 px-4 text-xs font-bold tracking-widest uppercase transition-all
                  bg-emerald-600/10 border border-emerald-600/40 text-emerald-400 hover:bg-emerald-600/20 hover:text-emerald-200">
                🎱 Manage Frames
              </button>
            )}
            {session && isOccupied && (
              <button onClick={() => onAddOrder(table, session)}
                className="w-full py-2 px-4 text-xs font-bold tracking-widest uppercase transition-all
                  bg-cyan-500/10 border border-cyan-600/40 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-200">
                + Add Order
              </button>
            )}

            {/* Pause — available for all session types including fixed_slot */}
            {session && isOccupied && (
              <button onClick={() => onPauseSession(table, session)}
                className="w-full py-2 px-4 text-xs font-bold tracking-widest uppercase transition-all
                  bg-amber-600/10 border border-amber-600/40 text-amber-400 hover:bg-amber-600/20 hover:text-amber-200">
                ⏸ Pause
              </button>
            )}
            {/* Resume — freezes countdown until pressed */}
            {session && isPaused && (
              <button onClick={() => onResumeSession(table, session)}
                className="w-full py-2 px-4 text-xs font-bold tracking-widest uppercase transition-all
                  bg-cyan-600/10 border border-cyan-600/40 text-cyan-400 hover:bg-cyan-600/20 hover:text-cyan-200">
                ▶ Resume
              </button>
            )}
            <button onClick={() => session && onEndSession(table, session)} disabled={!session}
              className="w-full py-2.5 px-4 text-sm font-bold tracking-widest uppercase transition-all
                bg-red-600/20 border border-red-600/50 text-red-400 hover:bg-red-600/40 hover:text-red-200 disabled:opacity-30 disabled:cursor-not-allowed">
              ■ End Session
            </button>
          </>
        )}
      </div>
    </div>
  );
}
