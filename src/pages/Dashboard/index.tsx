import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { GamingTable, ActiveTableSession, TableType } from '../../types';
import { getTables, deleteTable } from '../../api/tables';
import { pauseSession, resumeSession, confirmSession, cancelSession } from '../../api/sessions';
import { useSocket } from '../../hooks/useSocket';
import { TableCard } from './TableCard';
import { StartSessionModal } from './StartSessionModal';
import { EndSessionModal } from './EndSessionModal';
import { AddTableModal } from './AddTableModal';
import { AddOrderModal } from './AddOrderModal';
import { FixedSlotExpiredModal } from './FixedSlotExpiredModal';
import { FrameSessionModal } from './FrameSessionModal';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { AlertDialog } from '../../components/AlertDialog';
import { Spinner } from '../../components/Spinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { useAuth } from '../../hooks/useAuth';

type FilterType = 'all' | TableType;

interface ConfirmState {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

export function Dashboard() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [tables, setTables] = useState<GamingTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [filter, setFilter] = useState<FilterType>('all');

  const [startModal, setStartModal] = useState<{ table: GamingTable; reservedUntil?: Date } | null>(null);
  const [endModal, setEndModal] = useState<{ table: GamingTable; session: ActiveTableSession } | null>(null);
  const [showAddTable, setShowAddTable] = useState(false);
  const [orderModal, setOrderModal] = useState<{ table: GamingTable; session: ActiveTableSession } | null>(null);
  const [frameModal, setFrameModal] = useState<{ table: GamingTable; session: ActiveTableSession } | null>(null);
  const [expiredSession, setExpiredSession] = useState<{ sessionId: number; tableName: string; netAmount: string; customerName: string | null } | null>(null);

  const [confirm, setConfirm] = useState<ConfirmState>({ open: false, title: '', message: '', onConfirm: () => {} });
  const [alertMsg, setAlertMsg] = useState('');

  const loadTables = useCallback(async () => {
    setLoading(true); setError('');
    try { setTables((await getTables({ limit: 100 })).data); }
    catch { setError('Failed to load tables'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadTables(); }, [loadTables]);

  const bump = () => setRefreshSignal((n) => n + 1);

  function setTableStatus(tableId: number, status: GamingTable['status']) {
    setTables((prev) => prev.map((t) => t.id === tableId ? { ...t, status } : t));
  }

  useSocket({
    onTableStatusChanged: ({ tableId, status }) => { setTableStatus(tableId, status); bump(); },
    onSessionStarted: bump,
    onSessionEnded: bump,
    onSessionPaused: ({ tableId }) => { setTableStatus(tableId, 'PAUSED'); bump(); },
    onSessionResumed: ({ tableId }) => { setTableStatus(tableId, 'OCCUPIED'); bump(); },
    onTablePreBooked: ({ tableId }) => { setTableStatus(tableId, 'RESERVED'); bump(); },
    onTableBookingCancelled: ({ tableId }) => { setTableStatus(tableId, 'AVAILABLE'); bump(); },
    onSessionFixedSlotExpired: ({ sessionId, tableId, tableName, netAmount, customerName }) => {
      setTableStatus(tableId, 'AVAILABLE');
      bump();
      setExpiredSession({ sessionId, tableName, netAmount, customerName });
    },
  });

  function askConfirm(cfg: Omit<ConfirmState, 'open'>) {
    setConfirm({ open: true, ...cfg });
  }

  function handleEndSession(table: GamingTable, session: ActiveTableSession) {
    if (table.status === 'PAUSED') {
      setAlertMsg('Resume the session before ending it.');
      return;
    }
    if (table.status === 'RESERVED') {
      setAlertMsg('Confirm the booking first, or cancel it.');
      return;
    }
    setEndModal({ table, session });
  }

  function handlePauseSession(table: GamingTable, session: ActiveTableSession) {
    askConfirm({
      title: 'Pause Session',
      message: `Pause session on "${table.name}"? Billing clock will stop.`,
      variant: 'warning',
      onConfirm: async () => {
        setConfirm((c) => ({ ...c, open: false }));
        try {
          await pauseSession(session.id);
          setTableStatus(table.id, 'PAUSED');
          bump();
        } catch (err: any) {
          setAlertMsg(err?.response?.data?.message ?? 'Failed to pause session');
        }
      },
    });
  }

  async function handleResumeSession(table: GamingTable, session: ActiveTableSession) {
    try {
      await resumeSession(session.id);
      setTableStatus(table.id, 'OCCUPIED');
      bump();
    } catch (err: any) {
      setAlertMsg(err?.response?.data?.message ?? 'Failed to resume session');
    }
  }

  function handleConfirmBooking(table: GamingTable, session: ActiveTableSession) {
    askConfirm({
      title: 'Confirm Arrival',
      message: `${session.customer_name ?? 'Customer'} has arrived at "${table.name}"? Billing clock will start now.`,
      variant: 'info',
      onConfirm: async () => {
        setConfirm((c) => ({ ...c, open: false }));
        try {
          await confirmSession(session.id);
          setTableStatus(table.id, 'OCCUPIED');
          bump();
        } catch (err: any) {
          setAlertMsg(err?.response?.data?.message ?? 'Failed to confirm booking');
        }
      },
    });
  }

  function handleCancelBooking(table: GamingTable, session: ActiveTableSession) {
    askConfirm({
      title: 'Cancel Booking',
      message: `Cancel ${session.customer_name ? `${session.customer_name}'s` : 'the'} booking on "${table.name}"? No charge will be applied.`,
      variant: 'danger',
      onConfirm: async () => {
        setConfirm((c) => ({ ...c, open: false }));
        try {
          await cancelSession(session.id);
          setTableStatus(table.id, 'AVAILABLE');
          bump();
        } catch (err: any) {
          setAlertMsg(err?.response?.data?.message ?? 'Failed to cancel booking');
        }
      },
    });
  }

  function handleDeleteTable(table: GamingTable) {
    askConfirm({
      title: 'Delete Table',
      message: `Permanently delete "${table.name}"? This cannot be undone.`,
      variant: 'danger',
      onConfirm: async () => {
        setConfirm((c) => ({ ...c, open: false }));
        try {
          await deleteTable(table.id);
          setTables((prev) => prev.filter((t) => t.id !== table.id));
        } catch (err: any) {
          setAlertMsg(err?.response?.data?.message ?? 'Failed to delete table');
        }
      },
    });
  }

  const filtered = filter === 'all' ? tables : tables.filter((t) => t.type === filter);
  const occupiedCount = tables.filter((t) => t.status === 'OCCUPIED').length;
  const pausedCount   = tables.filter((t) => t.status === 'PAUSED').length;
  const reservedCount = tables.filter((t) => t.status === 'RESERVED').length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-mono-game text-purple-600 tracking-widest mb-1">// LIVE ARENA</p>
          <h1 className="font-orbitron font-black text-2xl text-white tracking-wide text-glow-purple">TABLES DASHBOARD</h1>
          <div className="flex items-center gap-4 mt-1 flex-wrap">
            <span className="text-sm font-mono-game text-gray-600">{tables.length} total</span>
            {occupiedCount > 0 && <span className="text-sm font-mono-game"><span className="text-red-400">{occupiedCount}</span><span className="text-gray-600"> live</span></span>}
            {pausedCount > 0 && <span className="text-sm font-mono-game"><span className="text-amber-400">{pausedCount}</span><span className="text-gray-600"> paused</span></span>}
            {reservedCount > 0 && <span className="text-sm font-mono-game"><span className="text-blue-400">{reservedCount}</span><span className="text-gray-600"> reserved</span></span>}
          </div>

          {/* SVG activity bar */}
          {tables.length > 0 && (
            <div className="mt-3 flex items-center gap-3">
              <svg width="180" height="28" viewBox="0 0 180 28" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <style>{`
                    @keyframes db-bar-grow{0%{transform:scaleY(0.2)}100%{transform:scaleY(1)}}
                    @keyframes db-blink{0%,100%{opacity:1}50%{opacity:0.3}}
                    .db-bar{transform-origin:bottom;animation:db-bar-grow 1s ease-out forwards}
                    .db-blink{animation:db-blink 1.4s ease-in-out infinite}
                  `}</style>
                </defs>
                {/* Bar chart — one bar per table, colour by status */}
                {tables.slice(0, 18).map((t, i) => {
                  const x = i * 10 + 1;
                  const h = t.status === 'OCCUPIED' ? 22 : t.status === 'PAUSED' ? 14 : t.status === 'RESERVED' ? 18 : 6;
                  const color = t.status === 'OCCUPIED' ? '#ef4444' : t.status === 'PAUSED' ? '#f59e0b' : t.status === 'RESERVED' ? '#3b82f6' : '#374151';
                  return (
                    <rect key={t.id}
                      className="db-bar"
                      x={x} y={27 - h} width="7" height={h}
                      fill={color} fillOpacity={t.status === 'AVAILABLE' ? 0.3 : 0.75}
                      rx="1"
                      style={{ animationDelay: `${i * 0.05}s` }}
                    />
                  );
                })}
                {/* Baseline */}
                <line x1="0" y1="27" x2="180" y2="27" stroke="#374151" strokeWidth="1" strokeOpacity="0.5" />
                {/* Live dot */}
                {occupiedCount > 0 && (
                  <circle className="db-blink" cx="174" cy="6" r="4" fill="#ef4444" fillOpacity="0.8" />
                )}
              </svg>
              <span className="text-xs font-mono-game text-gray-700 tracking-wider hidden sm:inline">TABLE ACTIVITY</span>
            </div>
          )}
        </div>
        <div className="flex gap-3">

          {isAdmin && (
            <button onClick={() => setShowAddTable(true)}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold tracking-widest uppercase
                bg-purple-600/20 border border-purple-500/60 text-purple-300
                hover:bg-purple-600/40 hover:text-white transition-all duration-200 glow-purple">
              + New Table
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['all', 'pool', 'snooker', 'ps5'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 text-xs font-bold tracking-widest uppercase transition-all border ${
              filter === f
                ? 'bg-purple-600/30 border-purple-500/70 text-purple-200'
                : 'border-gray-700/50 text-gray-600 hover:border-purple-700/50 hover:text-purple-400 bg-transparent'
            }`}>
            {f === 'all' ? 'All' : f === 'ps5' ? 'PS5' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : error ? (
        <ErrorMessage message={error} onRetry={loadTables} />
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">🎱</p>
          <p className="font-orbitron text-gray-600 text-sm tracking-widest">NO TABLES FOUND</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((table) => (
            <div key={table.id} className="relative group">
              <TableCard
                table={table}
                onStartSession={(t, reservedUntil) => setStartModal({ table: t, reservedUntil })}
                onEndSession={handleEndSession}
                onPauseSession={handlePauseSession}
                onResumeSession={handleResumeSession}
                onConfirmBooking={handleConfirmBooking}
                onCancelBooking={handleCancelBooking}
                onAddOrder={(t, s) => setOrderModal({ table: t, session: s })}
                onManageFrames={(t, s) => setFrameModal({ table: t, session: s })}
                onViewBill={(sessionId) => navigate(`/billing/${sessionId}`)}
                refreshSignal={refreshSignal}
              />
              {isAdmin && table.status === 'AVAILABLE' && (
                <button onClick={() => handleDeleteTable(table)} title="Delete table"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity
                    bg-[#0d0d1a] border border-red-800/50 text-red-700 hover:text-red-400 hover:border-red-600/60
                    w-6 h-6 flex items-center justify-center text-xs">
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <StartSessionModal
        open={!!startModal}
        table={startModal?.table ?? null}
        reservedUntil={startModal?.reservedUntil}
        onClose={() => setStartModal(null)}
        onStarted={() => { bump(); setStartModal(null); }}
      />
      <EndSessionModal
        open={!!endModal}
        table={endModal?.table ?? null}
        session={endModal?.session ?? null}
        onClose={() => setEndModal(null)}
        onEnded={() => {
          setTableStatus(endModal!.table.id, 'AVAILABLE');
          bump();
          setEndModal(null);
        }}
      />
      {isAdmin && (
        <AddTableModal
          open={showAddTable}
          onClose={() => setShowAddTable(false)}
          onTableAdded={(table) => { setTables((prev) => [...prev, table]); setShowAddTable(false); }}
        />
      )}
      <AddOrderModal
        open={!!orderModal}
        table={orderModal?.table ?? null}
        session={orderModal?.session ?? null}
        onClose={() => setOrderModal(null)}
        onOrderAdded={bump}
      />
      <FrameSessionModal
        open={!!frameModal}
        session={frameModal?.session ?? null}
        onClose={() => setFrameModal(null)}
      />

      <FixedSlotExpiredModal
        open={!!expiredSession}
        sessionId={expiredSession?.sessionId ?? null}
        tableName={expiredSession?.tableName ?? ''}
        customerName={expiredSession?.customerName ?? null}
        onClose={() => setExpiredSession(null)}
      />

      <ConfirmDialog
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        variant={confirm.variant}
        onConfirm={confirm.onConfirm}
        onCancel={() => setConfirm((c) => ({ ...c, open: false }))}
      />
      <AlertDialog open={!!alertMsg} message={alertMsg} onClose={() => setAlertMsg('')} />
    </div>
  );
}
