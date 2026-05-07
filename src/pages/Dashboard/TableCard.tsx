import { useEffect, useState, useCallback } from 'react';
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
  onViewBill: (sessionId: number) => void;
  refreshSignal?: number;
}

export function TableCard({
  table, onStartSession, onEndSession, onPauseSession, onResumeSession,
  onConfirmBooking, onCancelBooking, onAddOrder, onViewBill, refreshSignal,
}: TableCardProps) {
  const [session, setSession] = useState<ActiveTableSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(false);

  const accent = TYPE_ACCENT[table.type] ?? TYPE_ACCENT.pool;
  const isOccupied = table.status === 'OCCUPIED';
  const isPaused = table.status === 'PAUSED';
  const isReserved = table.status === 'RESERVED';
  const isActive = isOccupied || isPaused || isReserved;

  const fetchSession = useCallback(async () => {
    if (table.status === 'AVAILABLE') { setSession(null); return; }
    setLoadingSession(true);
    try { setSession(await getTableActiveSession(table.id)); }
    catch { setSession(null); }
    finally { setLoadingSession(false); }
  }, [table.id, table.status]);

  useEffect(() => { fetchSession(); }, [fetchSession, refreshSignal]);

  // Only poll while actively billing (not paused, not reserved)
  useEffect(() => {
    if (!isOccupied) return;
    const id = setInterval(fetchSession, 30_000);
    return () => clearInterval(id);
  }, [isOccupied, fetchSession]);

  // Card border colour by status
  const cardBorder = isOccupied
    ? 'border-red-500/60 shadow-lg shadow-red-900/20'
    : isPaused
    ? 'border-amber-500/50 shadow-lg shadow-amber-900/20'
    : isReserved
    ? 'border-blue-500/60 shadow-lg shadow-blue-900/20'
    : `${accent.border} hover:shadow-lg`;

  // Corner accent colour
  const cornerColor = isOccupied
    ? 'border-red-400'
    : isPaused
    ? 'border-amber-400'
    : isReserved
    ? 'border-blue-400'
    : accent.text.replace('text-', 'border-');

  // Pulse colour
  const pulseColor = isOccupied ? 'bg-red-400' : isPaused ? 'bg-amber-400' : 'bg-blue-400';

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
              {/* Customer name always shown for reserved */}
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
                /* Reserved — show scheduled time */
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
                /* Active/Paused — show billing */
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
                  {isPaused && (
                    <div className="text-xs text-amber-700 font-mono-game mt-1 tracking-wider">⏸ CLOCK PAUSED</div>
                  )}
                  {isOccupied && (
                    <div className="text-xs text-gray-600 font-mono-game mt-1">
                      SINCE {new Date(session.start_time).toLocaleTimeString()}
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
          /* Reserved actions */
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
          /* Occupied / Paused actions */
          <>
            {session && isOccupied && (
              <button onClick={() => onAddOrder(table, session)}
                className="w-full py-2 px-4 text-xs font-bold tracking-widest uppercase transition-all
                  bg-cyan-500/10 border border-cyan-600/40 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-200">
                + Add Order
              </button>
            )}
            {session && (
              <button onClick={() => onViewBill(session.id)}
                className="w-full py-2 px-4 text-xs font-bold tracking-widest uppercase transition-all
                  bg-gray-700/20 border border-gray-600/30 text-gray-400 hover:bg-gray-700/40 hover:text-gray-200">
                ◎ View Bill
              </button>
            )}
            {session && isOccupied && (
              <button onClick={() => onPauseSession(table, session)}
                className="w-full py-2 px-4 text-xs font-bold tracking-widest uppercase transition-all
                  bg-amber-600/10 border border-amber-600/40 text-amber-400 hover:bg-amber-600/20 hover:text-amber-200">
                ⏸ Pause
              </button>
            )}
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
