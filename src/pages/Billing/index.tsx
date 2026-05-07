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

  const ordersTotal = parseFloat(bill.orders_total);
  const sessionAmount = parseFloat(bill.session_amount);
  const totalAmount = parseFloat(bill.total_amount);
  const discountAmount = parseFloat(bill.discount_amount);
  const netAmount = parseFloat(bill.net_amount);
  const isActive = bill.status === 'ACTIVE';
  const isPaused = bill.status === 'PAUSED';
  const isLive = isActive || isPaused;

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
                {bill.table_type} · <span className="text-cyan-600">₹{parseFloat(bill.price_per_minute).toFixed(2)}/min</span>
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

        {/* Session meta */}
        <div className="px-6 py-4 border-b border-purple-900/20 grid grid-cols-2 gap-4 text-sm">
          {[
            { label: 'Session #', val: `#${bill.session_id}`, mono: true },
            { label: 'Duration', val: `${bill.duration_min} min`, mono: true },
            { label: 'Start', val: formatDate(bill.start_time), mono: false },
            { label: 'End', val: bill.end_time ? formatDate(bill.end_time) : '—', mono: false },
          ].map(({ label, val, mono }) => (
            <div key={label}>
              <p className="font-orbitron text-purple-800 text-xs tracking-widest mb-0.5">{label}</p>
              <p className={`text-gray-300 font-semibold ${mono ? 'font-mono-game' : ''}`}>{val}</p>
            </div>
          ))}
        </div>

        {/* Pauses */}
        {bill.pauses.length > 0 && (
          <div className="px-6 py-3 border-b border-purple-900/20">
            <p className="font-orbitron text-xs text-purple-800 tracking-widest mb-2 uppercase">Pause History</p>
            {bill.pauses.map((p) => (
              <div key={p.id} className="flex justify-between text-xs font-mono-game text-gray-600 py-0.5">
                <span>⏸ {formatTime(p.paused_at)}</span>
                <span>{p.resumed_at ? `▶ ${formatTime(p.resumed_at)}` : <span className="text-blue-700">Still paused</span>}</span>
              </div>
            ))}
          </div>
        )}

        {/* Orders */}
        {bill.orders.length > 0 && (
          <div className="px-6 py-4 border-b border-purple-900/20">
            <p className="font-orbitron text-xs text-purple-600 tracking-widest mb-3 uppercase">Orders</p>
            <div className="flex flex-col gap-2">
              {bill.orders.map((order) => (
                <div key={order.id} className="flex justify-between items-center text-sm py-1.5 border-b border-gray-800/40 last:border-0">
                  <div>
                    <span className="text-gray-300 font-semibold">{order.item_name}</span>
                    <span className="text-gray-600 ml-2 font-mono-game text-xs">× {order.quantity}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono-game font-bold text-cyan-400">₹{parseFloat(order.subtotal).toFixed(2)}</span>
                    <span className="text-xs text-gray-700 ml-1 font-mono-game">(₹{parseFloat(order.unit_price).toFixed(2)} ea)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Totals */}
        <div className="px-6 py-4 bg-[#0a0a12] flex flex-col gap-2 text-sm">
          <div className="flex justify-between text-gray-500">
            <span className="tracking-wider">Table time ({bill.duration_min} min)</span>
            <span className="font-mono-game">₹{sessionAmount.toFixed(2)}</span>
          </div>
          {ordersTotal > 0 && (
            <div className="flex justify-between text-gray-500">
              <span className="tracking-wider">Orders ({bill.orders.length} item{bill.orders.length !== 1 ? 's' : ''})</span>
              <span className="font-mono-game">₹{ordersTotal.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-500">
            <span className="tracking-wider">Gross total</span>
            <span className="font-mono-game">₹{totalAmount.toFixed(2)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span className="tracking-wider">
                Discount ({bill.discount_type?.replace(/_/g, ' ')}
                {bill.discount_type === 'percentage' ? ` ${parseFloat(bill.discount_value).toFixed(0)}%` : ''})
              </span>
              <span className="font-mono-game">−₹{discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="border-t border-purple-900/40 pt-3 mt-1 flex justify-between items-baseline">
            <span className="font-orbitron text-sm text-purple-300 tracking-widest">
              NET TOTAL {isLive ? <span className="text-xs text-gray-600">(est.)</span> : ''}
            </span>
            <span className="font-mono-game font-black text-2xl text-cyan-400 text-glow-cyan">
              ₹{netAmount.toFixed(2)}
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
