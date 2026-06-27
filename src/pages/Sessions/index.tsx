import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Session, ActiveTableSession, GamingTable as GT } from '../../types';
import { getSessions, updateSessionPayment, type SessionFilters } from '../../api/sessions';
import { getTables } from '../../api/tables';
import { Badge } from '../../components/Badge';
import { Spinner } from '../../components/Spinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { DatePicker } from '../../components/DatePicker';
import { Modal } from '../../components/Modal';
import { EndSessionModal } from '../Dashboard/EndSessionModal';
import { useAuth } from '../../hooks/useAuth';

const PAGE_LIMIT = 20;

function formatDuration(mins?: number) {
  if (mins === undefined || mins === null) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h === 0 ? `${m}m` : `${h}h ${m}m`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
}

function statusBadgeVariant(status: string): 'warning' | 'info' | 'danger' | 'neutral' {
  if (status === 'active') return 'warning';
  if (status === 'paused') return 'warning';
  if (status === 'reserved') return 'info';
  if (status === 'cancelled') return 'danger';
  return 'neutral';
}

function statusLabel(status: string) {
  if (status === 'active') return '● Live';
  if (status === 'paused') return '⏸ Paused';
  if (status === 'reserved') return '🔵 Reserved';
  if (status === 'cancelled') return '✕ Cancelled';
  return 'Closed';
}

// Convert a Session row into the shape EndSessionModal expects
function sessionToActiveSession(s: Session): ActiveTableSession {
  return {
    id: s.id,
    table_id: s.table_id,
    status: s.status as any,
    booking_type: s.booking_type ?? 'pay_as_you_go',
    start_time: s.start_time,
    table_name: s.table_name ?? '',
    table_type: s.table_type ?? 'pool',
    price_per_minute: s.price_per_minute ?? '0',
    customer_name: s.customer_name,
    customer_phone: s.customer_phone,
    duration_min: s.duration ?? null,
    session_amount: s.session_amount ?? null,
  };
}

function sessionToTable(s: Session, tables: GT[]): GT {
  return tables.find((t) => t.id === s.table_id) ?? {
    id: s.table_id,
    name: s.table_name ?? `Table ${s.table_id}`,
    type: s.table_type ?? 'pool',
    status: 'OCCUPIED',
    price_per_minute: s.price_per_minute ?? '0',
    price_per_hour: '0',
    created_at: '',
    updated_at: '',
  };
}

type PaymentMode = 'cash' | 'online' | 'split';

export function Sessions() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [tables, setTables] = useState<GT[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const sentinelRef = useRef<HTMLDivElement>(null);

  // End session modal state
  const [endModalSession, setEndModalSession] = useState<Session | null>(null);

  // Edit payment modal state
  const [paymentTarget, setPaymentTarget] = useState<Session | null>(null);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [cashAmt, setCashAmt] = useState('');
  const [onlineAmt, setOnlineAmt] = useState('');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  const [statusFilter, setStatusFilter] = useState<'' | 'active' | 'paused' | 'reserved' | 'closed'>('');
  const [tableFilter, setTableFilter] = useState<number | ''>('');
  const [dateFilterDate, setDateFilterDate] = useState<Date | null>(null);
  const dateFilter = dateFilterDate ? dateFilterDate.toISOString().slice(0, 10) : '';

  const buildFilters = useCallback((p: number): SessionFilters => {
    const f: SessionFilters = { limit: PAGE_LIMIT, page: p };
    if (statusFilter) f.status = statusFilter as any;
    if (tableFilter !== '') f.table_id = tableFilter as number;
    if (dateFilter) f.date = dateFilter;
    return f;
  }, [statusFilter, tableFilter, dateFilter]);

  const loadInitial = useCallback(async () => {
    setLoading(true); setError(''); setPage(1);
    try {
      const res = await getSessions(buildFilters(1));
      setSessions(res.data);
      setTotal(res.pagination.total);
      setHasNext(res.pagination.has_next);
    } catch { setError('Failed to load sessions'); }
    finally { setLoading(false); }
  }, [buildFilters]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasNext) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const res = await getSessions(buildFilters(nextPage));
      setSessions((prev) => [...prev, ...res.data]);
      setPage(nextPage);
      setHasNext(res.pagination.has_next);
    } catch {}
    finally { setLoadingMore(false); }
  }, [loadingMore, hasNext, page, buildFilters]);

  useEffect(() => { getTables({ limit: 100 }).then((r) => setTables(r.data)).catch(() => {}); }, []);
  useEffect(() => { loadInitial(); }, [loadInitial]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const obs = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { rootMargin: '200px' }
    );
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [loadMore]);

  function clearFilters() { setStatusFilter(''); setTableFilter(''); setDateFilterDate(null); }
  const hasFilters = statusFilter !== '' || tableFilter !== '' || dateFilter !== '';

  const isLive = (s: Session) => s.status === 'active' || s.status === 'paused';

  function openPaymentEdit(s: Session) {
    const cash = parseFloat(s.net_amount ?? '0');
    const pm = s.payment_method;
    const mode: PaymentMode = pm === 'online' ? 'online' : pm === 'split' ? 'split' : 'cash';
    setPaymentTarget(s);
    setPaymentMode(mode);
    if (mode === 'cash') { setCashAmt(s.net_amount ?? ''); setOnlineAmt('0'); }
    else if (mode === 'online') { setCashAmt('0'); setOnlineAmt(s.net_amount ?? ''); }
    else { setCashAmt(''); setOnlineAmt(''); }
    setPaymentError('');
  }

  function closePaymentEdit() {
    setPaymentTarget(null);
    setCashAmt('');
    setOnlineAmt('');
    setPaymentError('');
  }

  async function handlePaymentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!paymentTarget) return;
    setPaymentError(''); setPaymentSubmitting(true);
    try {
      const netAmount = parseFloat(paymentTarget.net_amount ?? '0');
      let cash = 0, online = 0;
      if (paymentMode === 'cash') {
        cash = netAmount; online = 0;
      } else if (paymentMode === 'online') {
        cash = 0; online = netAmount;
      } else {
        cash = parseFloat(cashAmt) || 0;
        online = parseFloat(onlineAmt) || 0;
      }
      const updated = await updateSessionPayment(paymentTarget.id, {
        cash_amount: cash,
        online_amount: online,
      });
      setSessions((prev) => prev.map((s) =>
        s.id === updated.id
          ? { ...s, cash_amount: updated.cash_amount, online_amount: updated.online_amount, payment_method: updated.payment_method }
          : s
      ));
      closePaymentEdit();
    } catch (err: any) {
      setPaymentError(err?.response?.data?.message ?? 'Failed to update payment');
    } finally {
      setPaymentSubmitting(false);
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-mono-game text-purple-600 tracking-widest mb-1">// MATCH HISTORY</p>
        <h1 className="font-orbitron font-black text-2xl text-white tracking-wide text-glow-purple">SESSION LOG</h1>
        <p className="text-xs text-gray-600 mt-1 tracking-wider font-mono-game">
          {total > 0 ? `${total} sessions` : 'All sessions — active, paused, reserved and closed'}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-[#0d0d1a] border border-purple-900/30 p-4 mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="game-label">Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="game-input" style={{ width: 'auto' }}>
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="reserved">Reserved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div>
          <label className="game-label">Table</label>
          <select value={tableFilter} onChange={(e) => setTableFilter(e.target.value === '' ? '' : Number(e.target.value))} className="game-input" style={{ width: 'auto' }}>
            <option value="">All tables</option>
            {tables.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div style={{ width: '160px' }}>
          <label className="game-label">Date</label>
          <DatePicker value={dateFilterDate} onChange={setDateFilterDate} placeholder="Pick a date…" />
        </div>
        {hasFilters && (
          <button onClick={clearFilters}
            className="px-3 py-2 text-xs font-bold tracking-widest uppercase border border-gray-700/40 text-gray-600 hover:text-gray-300 hover:border-gray-500/40 transition-colors">
            ✕ Clear
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : error ? (
        <ErrorMessage message={error} onRetry={loadInitial} />
      ) : (
        <div className="border border-purple-900/30 bg-[#0d0d1a] overflow-hidden">
          <div className="h-[1px] bg-gradient-to-r from-purple-800 via-purple-500 to-cyan-600" />
          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-3xl mb-3">📋</p>
              <p className="font-orbitron text-gray-600 text-xs tracking-widest">NO SESSIONS FOUND</p>
              {hasFilters && (
                <button onClick={clearFilters} className="mt-3 text-xs text-purple-600 hover:text-purple-400 tracking-wider uppercase underline">
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#0a0a12] border-b border-purple-900/30">
                      {['#', 'Customer', 'Table', 'Start', 'Duration', 'Net Total', 'Status', ''].map((h, i) => (
                        <th key={i} className={`px-4 py-3 font-orbitron text-xs text-purple-600 tracking-widest uppercase ${
                          h === '' || h === 'Net Total' || h === 'Duration' ? 'text-right' : h === 'Status' ? 'text-center' : 'text-left'
                        }`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s, idx) => (
                      <tr key={s.id}
                        className={`border-b border-purple-900/10 cursor-pointer transition-colors hover:bg-purple-900/10 ${idx % 2 === 0 ? '' : 'bg-[#0a0a12]/40'}`}
                        onClick={() => navigate(`/billing/${s.id}`)}>
                        <td className="px-4 py-3 font-mono-game text-purple-800 text-xs">#{s.id}</td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-200 text-xs tracking-wide">{s.customer_name ?? '—'}</div>
                          <div className="text-xs text-gray-600 font-mono-game">{s.customer_phone ?? ''}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-300 text-xs">{s.table_name ?? `Table ${s.table_id}`}</div>
                          <div className="text-xs text-gray-600 capitalize tracking-widest font-mono-game">{s.table_type}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-500 font-mono-game text-xs">{formatDate(s.start_time)}</td>
                        <td className="px-4 py-3 text-right font-mono-game text-gray-400 text-xs">{formatDuration(s.duration)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="font-mono-game font-bold text-cyan-400">
                            {s.net_amount ? `₹${parseFloat(s.net_amount).toFixed(2)}` : '—'}
                          </div>
                          {s.discount_amount && parseFloat(s.discount_amount) > 0 && (
                            <div className="text-xs text-emerald-600 font-mono-game">
                              −₹{parseFloat(s.discount_amount).toFixed(2)} disc.
                            </div>
                          )}
                          {s.payment_method && (
                            <div className="text-xs text-gray-600 font-mono-game uppercase">
                              {s.payment_method === 'cash' ? '💵 Cash' : s.payment_method === 'online' ? '📱 Online' : '💵📱 Split'}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={statusBadgeVariant(s.status)}>{statusLabel(s.status)}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex flex-col gap-1 items-end">
                            {isLive(s) && (
                              <button
                                onClick={() => setEndModalSession(s)}
                                className="text-xs font-bold tracking-widest uppercase text-red-700 hover:text-red-400 transition-colors whitespace-nowrap">
                                ■ End →
                              </button>
                            )}
                            {isAdmin && s.status === 'ended' && (
                              <button
                                onClick={() => openPaymentEdit(s)}
                                className="text-xs font-bold tracking-widest uppercase text-cyan-700 hover:text-cyan-400 transition-colors whitespace-nowrap">
                                ✎ Payment
                              </button>
                            )}
                            <button onClick={() => navigate(`/billing/${s.id}`)}
                              className="text-xs font-bold tracking-widest uppercase text-purple-700 hover:text-purple-400 transition-colors">
                              Bill →
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Sentinel + loading indicator */}
              <div ref={sentinelRef} className="flex justify-center py-4 border-t border-purple-900/20">
                {loadingMore && <Spinner size="sm" />}
                {!hasNext && sessions.length > 0 && (
                  <p className="text-xs text-gray-700 font-mono-game tracking-wider">— end of results —</p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* End Session Modal */}
      <EndSessionModal
        open={!!endModalSession}
        table={endModalSession ? sessionToTable(endModalSession, tables) : null}
        session={endModalSession ? sessionToActiveSession(endModalSession) : null}
        onClose={() => setEndModalSession(null)}
        onEnded={() => {
          setEndModalSession(null);
          loadInitial();
        }}
      />

      {/* Edit Payment Modal (admin only, closed sessions) */}
      <Modal
        open={!!paymentTarget}
        onClose={closePaymentEdit}
        title={`Edit Payment — Session #${paymentTarget?.id}`}
      >
        <form onSubmit={handlePaymentSubmit} className="flex flex-col gap-5">
          <div>
            <label className="game-label">Net Amount</label>
            <p className="font-mono-game font-bold text-cyan-400 text-lg">
              ₹{paymentTarget?.net_amount ? Math.round(parseFloat(paymentTarget.net_amount)) : 0}
            </p>
          </div>

          <div>
            <label className="game-label">Payment Method</label>
            <div className="flex gap-3 mt-1">
              {(['cash', 'online', 'split'] as PaymentMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMode(m)}
                  className={`px-4 py-2 text-xs font-bold tracking-widest uppercase border transition-colors ${
                    paymentMode === m
                      ? 'border-cyan-500 text-cyan-300 bg-cyan-900/20'
                      : 'border-gray-700/40 text-gray-600 hover:text-gray-300 hover:border-gray-500/40'
                  }`}
                >
                  {m === 'cash' ? '💵 Cash' : m === 'online' ? '📱 Online' : '💵📱 Split'}
                </button>
              ))}
            </div>
          </div>

          {paymentMode === 'split' && (
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="game-label">Cash Amount (₹)</label>
                <input
                  type="number" min="0" step="0.01"
                  value={cashAmt}
                  onChange={(e) => setCashAmt(e.target.value)}
                  required className="game-input" placeholder="0.00"
                />
              </div>
              <div className="flex-1">
                <label className="game-label">Online Amount (₹)</label>
                <input
                  type="number" min="0" step="0.01"
                  value={onlineAmt}
                  onChange={(e) => setOnlineAmt(e.target.value)}
                  required className="game-input" placeholder="0.00"
                />
              </div>
            </div>
          )}

          {paymentError && (
            <div className="border border-red-800/40 bg-red-950/20 px-3 py-2 flex items-center gap-2">
              <span className="text-red-400">⚠</span>
              <p className="text-red-400 text-xs font-mono-game tracking-wide">{paymentError}</p>
            </div>
          )}

          <button type="submit" disabled={paymentSubmitting} className="game-btn-primary">
            {paymentSubmitting ? '// Saving…' : '▶ Save Payment'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
