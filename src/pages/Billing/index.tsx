import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Bill } from '../../types';
import { getBill } from '../../api/billing';
import { Badge } from '../../components/Badge';
import { Spinner } from '../../components/Spinner';
import { ErrorMessage } from '../../components/ErrorMessage';

const TYPE_ICONS: Record<string, string> = { pool: '🎱', snooker: '🎯', ps5: '🎮' };

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { timeStyle: 'short' });
}

export function Billing() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sessionIdNum = Number(sessionId);

  const loadBill = useCallback(async () => {
    try {
      const data = await getBill(sessionIdNum);
      setBill(data);
      if (data.status === 'CLOSED' && pollRef.current) {
        clearInterval(pollRef.current); pollRef.current = null;
      }
    } catch { setError('Session not found'); }
    finally { setLoading(false); }
  }, [sessionIdNum]);

  useEffect(() => { loadBill(); }, [loadBill]);

  useEffect(() => {
    if (!bill || bill.status === 'CLOSED') return;
    if (bill.status === 'PAUSED') return; // don't poll while paused
    pollRef.current = setInterval(loadBill, 30_000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [bill?.status, loadBill]);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  if (error || !bill) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <ErrorMessage message={error || 'Session not found'} onRetry={loadBill} />
        <button onClick={() => navigate(-1)} className="mt-4 text-xs text-purple-600 hover:text-purple-400 tracking-widest uppercase">← Back</button>
      </div>
    );
  }

  const ordersTotal   = parseFloat(bill.orders_total);
  const sessionAmount  = parseFloat(bill.session_amount);
  const _totalAmount   = parseFloat(bill.total_amount);
  void _totalAmount;
  const netAmount      = parseFloat(bill.net_amount);
  const discVal        = parseFloat(bill.discount_value || '0');
  const discScope      = bill.discount_scope ?? 'all';
  const discType       = bill.discount_type;

  function calcDisc(base: number) {
    if (!discType || discType === 'none' || base <= 0) return 0;
    return discType === 'percentage' ? Math.round(base * discVal / 100) : Math.min(discVal, base);
  }

  const tableDiscAmt  = discScope === 'session' || discScope === 'all' ? calcDisc(sessionAmount) : 0;
  const snacksDiscAmt = discScope === 'order'   || discScope === 'all' ? calcDisc(ordersTotal)   : 0;
  const tableNet      = sessionAmount - tableDiscAmt;
  const snacksNet     = ordersTotal   - snacksDiscAmt;
  const isActive = bill.status === 'ACTIVE';
  const isPaused = bill.status === 'PAUSED';
  const isLive = isActive || isPaused;

  // ── Per-booking-type detail rows ─────────────────────────────────────────
  const isFrameWise = bill.booking_type === 'frame_wise';
  const isSlotType  = bill.booking_type === 'fixed_slot' || bill.booking_type === 'pre_booking';
  const endedFrames = (bill.frames ?? []).filter((f) => f.ended_at);
  const openFrame   = (bill.frames ?? []).find((f) => !f.ended_at);
  const ratePerHr   = Math.round(parseFloat(bill.price_per_minute) * 60);

  const refEnd     = bill.end_time ?? new Date().toISOString();
  const elapsedMin = Math.max(0, Math.round((new Date(refEnd).getTime() - new Date(bill.start_time).getTime()) / 60000));
  const pauseRows  = bill.pauses.map((p) => ({
    ...p,
    mins: Math.max(0, Math.round((new Date(p.resumed_at ?? refEnd).getTime() - new Date(p.paused_at).getTime()) / 60000)),
  }));
  const totalPausedMin = pauseRows.reduce((s, p) => s + p.mins, 0);

  const detailRows: { label: string; val: string }[] = [
    { label: 'Session #', val: `#${bill.session_id}` },
  ];
  if (isSlotType) {
    if (bill.scheduled_start) detailRows.push({ label: 'Scheduled start', val: formatDate(bill.scheduled_start) });
    if (bill.booked_duration) detailRows.push({ label: 'Booked slot', val: `${bill.booked_duration} min` });
  }
  detailRows.push(
    { label: 'Start', val: formatDate(bill.start_time) },
    { label: 'End',   val: bill.end_time ? formatDate(bill.end_time) : isPaused ? 'Paused' : 'Running…' },
  );
  if (isFrameWise) {
    detailRows.push(
      { label: 'Frames played', val: `${endedFrames.length}${openFrame ? ' (+1 live)' : ''}` },
      { label: 'Frame time',    val: `${bill.duration_min} min` },
    );
  } else {
    detailRows.push({ label: 'Elapsed', val: `${elapsedMin} min` });
    if (totalPausedMin > 0) detailRows.push({ label: 'Paused', val: `${totalPausedMin} min` });
    detailRows.push({ label: 'Billable time', val: `${bill.duration_min} min` });
  }
  detailRows.push({ label: 'Rate', val: `₹${ratePerHr}/hr` });

  const statusVariant = isActive ? 'warning' : isPaused ? 'info' : 'success';
  const statusLabel = isActive ? '● Live' : isPaused ? '⏸ Paused' : '✓ Closed';

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)}
        className="mb-6 text-xs font-bold tracking-widest uppercase text-purple-700 hover:text-purple-400 transition-colors flex items-center gap-1">
        ← Back
      </button>

      <div className="border border-purple-700/40 bg-[#0d0d1a] overflow-hidden glow-purple">
        <div className="h-[2px] bg-gradient-to-r from-purple-600 to-cyan-500" />

        {/* Header */}
        <div className="px-6 py-5 border-b border-purple-900/30 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 flex items-center justify-center text-3xl bg-purple-900/20 border border-purple-700/30">
              {TYPE_ICONS[bill.table_type] ?? '🎮'}
            </div>
            <div>
              <h1 className="font-orbitron font-black text-lg text-white tracking-wide">{bill.table_name}</h1>
              <p className="text-xs text-gray-500 capitalize tracking-wider font-mono-game mt-0.5">
                {bill.table_type} · <span className="text-cyan-600">₹{Math.round(parseFloat(bill.price_per_minute) * 60)}/hr</span>
                {' · '}<span className="text-purple-600 uppercase">{bill.booking_type?.replace(/_/g, ' ')}</span>
              </p>
              {bill.customer_name && (
                <p className="text-xs text-gray-600 font-mono-game mt-1">
                  {bill.customer_name} · {bill.customer_phone}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant={statusVariant}>{statusLabel}</Badge>
            {isActive && <span className="text-xs text-gray-700 font-mono-game">auto-refresh 30s</span>}
            {isPaused && <span className="text-xs text-blue-800 font-mono-game">clock paused</span>}
          </div>
        </div>

        {/* Session details */}
        <div className="px-6 py-4 border-b border-purple-900/20">
          <p className="font-orbitron text-xs text-purple-600 tracking-widest mb-3 uppercase">// Session Details</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            {detailRows.map(({ label, val }) => (
              <div key={label}>
                <p className="text-gray-600 text-xs tracking-wider uppercase mb-0.5">{label}</p>
                <p className="text-gray-300 font-semibold font-mono-game text-xs">{val}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pauses */}
        {pauseRows.length > 0 && (
          <div className="px-6 py-4 border-b border-purple-900/20">
            <p className="font-orbitron text-xs text-purple-600 tracking-widest mb-3 uppercase">// Pause History</p>
            {pauseRows.map((p) => (
              <div key={p.id} className="flex justify-between text-xs font-mono-game text-gray-600 py-0.5">
                <span>⏸ {formatTime(p.paused_at)} → {p.resumed_at ? `▶ ${formatTime(p.resumed_at)}` : <span className="text-blue-700">still paused</span>}</span>
                <span className="text-gray-700">{p.mins} min</span>
              </div>
            ))}
            <div className="flex justify-between text-xs font-mono-game text-gray-500 pt-1.5 mt-1.5 border-t border-gray-800/40">
              <span>Total paused</span>
              <span>{totalPausedMin} min</span>
            </div>
          </div>
        )}

        {/* Frames (frame_wise sessions) */}
        {isFrameWise && (bill.frames ?? []).length > 0 && (
          <div className="px-6 py-4 border-b border-purple-900/20">
            <p className="font-orbitron text-xs text-purple-600 tracking-widest mb-3 uppercase">// Frames</p>
            <div className="flex flex-col">
              {(bill.frames ?? []).map((f, i, arr) => (
                <div key={f.id} className={`flex justify-between items-center py-2 ${i < arr.length - 1 ? 'border-b border-gray-800/30' : ''}`}>
                  <div>
                    <span className="text-gray-300 font-semibold text-sm">{f.player_name || '—'}</span>
                    <span className="text-gray-600 ml-2 font-mono-game text-xs">
                      {formatTime(f.started_at)} – {f.ended_at ? formatTime(f.ended_at) : 'now'}
                    </span>
                  </div>
                  <div className="text-right">
                    {f.ended_at ? (
                      <>
                        <span className="font-mono-game font-bold text-cyan-400">₹{Math.round(parseFloat(f.amount ?? '0'))}</span>
                        <span className="text-xs text-gray-700 ml-1 font-mono-game">({Math.ceil(Number(f.duration_min))} min)</span>
                      </>
                    ) : (
                      <span className="text-xs text-blue-700 font-mono-game">in progress</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs font-mono-game text-gray-500 pt-2 mt-1 border-t border-gray-800/40">
              <span>{endedFrames.length} frame{endedFrames.length !== 1 ? 's' : ''} · {bill.duration_min} min</span>
              <span>₹{Math.round(sessionAmount)}</span>
            </div>
          </div>
        )}

        {/* Snacks & Orders */}
        {bill.orders.length > 0 && (
          <div className="px-6 py-4 border-b border-purple-900/20">
            <p className="font-orbitron text-xs text-purple-600 tracking-widest mb-3 uppercase">// Snacks & Orders</p>
            <div className="flex flex-col">
              {bill.orders.map((order) => (
                <div key={order.id} className="flex justify-between items-center text-sm py-1.5 border-b border-gray-800/40 last:border-0">
                  <div>
                    <span className="text-gray-300 font-semibold">{order.item_name}</span>
                    <span className="text-gray-600 ml-2 font-mono-game text-xs">× {order.quantity} @ ₹{Math.round(parseFloat(order.unit_price))}</span>
                    <span className="text-gray-700 ml-2 font-mono-game text-xs">{formatTime(order.created_at)}</span>
                  </div>
                  <span className="font-mono-game font-bold text-cyan-400">₹{Math.round(parseFloat(order.subtotal))}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs font-mono-game text-gray-500 pt-2 mt-1 border-t border-gray-800/40">
              <span>{bill.orders.length} item{bill.orders.length !== 1 ? 's' : ''}</span>
              <span>₹{Math.round(ordersTotal)}</span>
            </div>
          </div>
        )}

        {/* Totals */}
        <div className="px-6 py-4 bg-[#0a0a12] flex flex-col gap-2 text-sm">

          {/* Table section */}
          <div className="flex justify-between text-gray-500">
            <span className="tracking-wider">
              {bill.booking_type === 'frame_wise'
                ? `Frames total (${endedFrames.length} frames)`
                : `Table time (${bill.duration_min} min)`}
            </span>
            <span className="font-mono-game">₹{Math.round(sessionAmount)}</span>
          </div>
          {tableDiscAmt > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span className="tracking-wider">
                Table discount ({discType === 'percentage' ? `${Math.round(discVal)}%` : `₹${Math.round(discVal)} flat`})
              </span>
              <span className="font-mono-game">−₹{Math.round(tableDiscAmt)}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-400 font-semibold border-b border-purple-900/20 pb-2">
            <span className="tracking-wider">Table subtotal</span>
            <span className="font-mono-game">₹{Math.round(tableNet)}</span>
          </div>

          {/* Snacks section */}
          {ordersTotal > 0 && (<>
            <div className="flex justify-between text-gray-500 pt-1">
              <span className="tracking-wider">Snacks / orders ({bill.orders.length} item{bill.orders.length !== 1 ? 's' : ''})</span>
              <span className="font-mono-game">₹{Math.round(ordersTotal)}</span>
            </div>
            {snacksDiscAmt > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span className="tracking-wider">
                  Snacks discount ({discType === 'percentage' ? `${Math.round(discVal)}%` : `₹${Math.round(discVal)} flat`})
                </span>
                <span className="font-mono-game">−₹{Math.round(snacksDiscAmt)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-400 font-semibold border-b border-purple-900/20 pb-2">
              <span className="tracking-wider">Snacks subtotal</span>
              <span className="font-mono-game">₹{Math.round(snacksNet)}</span>
            </div>
          </>)}

          {/* Net total */}
          <div className="pt-2 flex justify-between items-baseline">
            <span className="font-orbitron text-sm text-purple-300 tracking-widest">
              NET TOTAL {isLive ? <span className="text-xs text-gray-600">(est.)</span> : ''}
            </span>
            <span className="font-mono-game font-black text-2xl text-cyan-400 text-glow-cyan">
              ₹{Math.round(netAmount)}
            </span>
          </div>
        </div>

        {/* Actions */}
        {isLive && (
          <div className="px-6 py-4 border-t border-purple-900/20 flex justify-end">
            <button onClick={loadBill}
              className="px-4 py-2 text-xs font-bold tracking-widest uppercase border border-gray-700/40 text-gray-500 hover:text-gray-300 hover:border-gray-500/40 transition-colors">
              ↺ Refresh
            </button>
          </div>
        )}
      </div>


    </div>
  );
}
