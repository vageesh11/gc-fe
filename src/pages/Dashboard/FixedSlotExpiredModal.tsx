import React, { useEffect, useState } from 'react';
import type { Bill } from '../../types';
import { getBill } from '../../api/billing';
import { updateSessionPayment } from '../../api/sessions';
import { Modal } from '../../components/Modal';
import { Spinner } from '../../components/Spinner';

interface FixedSlotExpiredModalProps {
  open: boolean;
  sessionId: number | null;
  tableName: string;
  customerName: string | null;
  onClose: () => void;
}

type PaymentMode = 'cash' | 'online' | 'split';

export function FixedSlotExpiredModal({
  open, sessionId, tableName, customerName, onClose,
}: FixedSlotExpiredModalProps) {
  const [bill, setBill] = useState<Bill | null>(null);
  const [loadingBill, setLoadingBill] = useState(false);

  const [mode, setMode] = useState<PaymentMode>('cash');
  const [cashInput, setCashInput] = useState('');
  const [onlineInput, setOnlineInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open || !sessionId) return;
    setMode('cash');
    setCashInput('');
    setOnlineInput('');
    setError('');
    setDone(false);
    setBill(null);
    setLoadingBill(true);
    getBill(sessionId)
      .then(setBill)
      .catch(() => setError('Could not load bill.'))
      .finally(() => setLoadingBill(false));
  }, [open, sessionId]);

  const netAmount = bill ? Math.round(parseFloat(bill.net_amount) / 5) * 5 : 0;

  function handleCashChange(val: string) {
    setCashInput(val);
    const c = parseFloat(val);
    if (!isNaN(c) && c >= 0 && c <= netAmount) setOnlineInput((netAmount - c).toFixed(0));
    else setOnlineInput('');
  }

  function handleOnlineChange(val: string) {
    setOnlineInput(val);
    const o = parseFloat(val);
    if (!isNaN(o) && o >= 0 && o <= netAmount) setCashInput((netAmount - o).toFixed(0));
    else setCashInput('');
  }

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault();
    if (!sessionId) return;
    setError(''); setSubmitting(true);
    try {
      let cash = 0, online = 0;
      if (mode === 'cash')        { cash = netAmount; online = 0; }
      else if (mode === 'online') { cash = 0; online = netAmount; }
      else { cash = parseFloat(cashInput) || 0; online = parseFloat(onlineInput) || 0; }

      await updateSessionPayment(sessionId, { cash_amount: cash, online_amount: online });
      setDone(true);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to record payment.');
    } finally {
      setSubmitting(false);
    }
  }

  function handlePrint() {
    if (!sessionId) return;
    window.open(`/billing/${sessionId}`, '_blank');
  }

  return (
    <Modal open={open} onClose={onClose} title={`⏱ Time's Up — ${tableName}`}>
      <div className="flex flex-col gap-5">

        {/* Expiry banner */}
        <div className="border border-amber-700/40 bg-amber-950/20 px-4 py-3">
          <p className="font-orbitron text-xs text-amber-400 tracking-widest uppercase">
            // Fixed Slot Expired
          </p>
          {customerName && (
            <p className="text-gray-300 text-sm mt-1">
              Customer: <span className="font-semibold text-white">{customerName}</span>
            </p>
          )}
        </div>

        {loadingBill ? (
          <div className="flex justify-center py-6"><Spinner /></div>
        ) : bill ? (
          <>
            {/* Bill summary */}
            <div className="border border-purple-900/30 bg-[#07070f]">
              <div className="flex justify-between px-4 py-2.5 border-b border-purple-900/20">
                <span className="text-gray-500 text-xs uppercase tracking-wider">
                  Table time ({bill.duration_min} min × ₹{(parseFloat(bill.price_per_minute) * 60).toFixed(0)}/hr)
                </span>
                <span className="font-mono-game text-gray-300 text-xs">₹{parseFloat(bill.session_amount).toFixed(2)}</span>
              </div>
              {bill.orders.map((o) => (
                <div key={o.id} className="flex justify-between px-4 py-2 border-b border-purple-900/10">
                  <span className="text-gray-500 text-xs">{o.item_name} × {o.quantity}</span>
                  <span className="font-mono-game text-gray-400 text-xs">₹{parseFloat(o.subtotal).toFixed(2)}</span>
                </div>
              ))}
              {parseFloat(bill.discount_amount) > 0 && (
                <div className="flex justify-between px-4 py-2 border-b border-purple-900/10">
                  <span className="text-emerald-600 text-xs uppercase tracking-wider">Discount</span>
                  <span className="font-mono-game text-emerald-500 text-xs">− ₹{parseFloat(bill.discount_amount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between px-4 py-3 bg-purple-900/10">
                <span className="font-orbitron text-sm text-purple-300 tracking-widest uppercase">Collect</span>
                <span className="font-mono-game font-black text-xl text-cyan-400">₹{netAmount}</span>
              </div>
            </div>

            {/* Print button */}
            <button
              type="button"
              onClick={handlePrint}
              className="w-full py-2 px-4 text-xs font-bold tracking-widest uppercase border
                border-gray-600/40 text-gray-400 hover:bg-gray-700/20 hover:text-gray-200 transition-colors">
              🖨 Print / View Bill
            </button>

            {/* Payment section */}
            {!done ? (
              <form onSubmit={handlePayment} className="flex flex-col gap-4">
                <div className="border border-purple-900/30 p-4 flex flex-col gap-3">
                  <p className="font-orbitron text-xs text-purple-600 tracking-widest uppercase">// Record Payment</p>

                  <div className="flex gap-2">
                    {(['cash', 'online', 'split'] as PaymentMode[]).map((m) => (
                      <button key={m} type="button" onClick={() => setMode(m)}
                        className={`flex-1 py-2 text-xs font-bold tracking-widest uppercase border transition-colors ${
                          mode === m
                            ? 'border-cyan-500 text-cyan-300 bg-cyan-900/20'
                            : 'border-gray-700/40 text-gray-600 hover:text-gray-300'
                        }`}>
                        {m === 'cash' ? '💵 Cash' : m === 'online' ? '📱 Online' : '💵📱 Split'}
                      </button>
                    ))}
                  </div>

                  {mode === 'split' && (
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="game-label">Cash ₹</label>
                        <input type="number" min="0" step="1" value={cashInput}
                          onChange={(e) => handleCashChange(e.target.value)}
                          required className="game-input" placeholder="0" />
                      </div>
                      <div className="flex-1">
                        <label className="game-label">Online ₹</label>
                        <input type="number" min="0" step="1" value={onlineInput}
                          onChange={(e) => handleOnlineChange(e.target.value)}
                          required className="game-input" placeholder="0" />
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="border border-red-800/40 bg-red-950/20 px-3 py-2">
                      <p className="text-red-400 text-xs font-mono-game">⚠ {error}</p>
                    </div>
                  )}

                  <button type="submit" disabled={submitting}
                    className="w-full py-2.5 px-4 font-orbitron text-xs font-bold tracking-widest uppercase
                      bg-cyan-600/20 border border-cyan-500/60 text-cyan-300
                      hover:bg-cyan-600/40 hover:text-white transition-all disabled:opacity-40">
                    {submitting ? '// Saving…' : '▶ Confirm Payment'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="border border-emerald-800/40 bg-emerald-950/20 px-4 py-3 flex flex-col gap-3 items-center">
                <p className="text-emerald-400 font-orbitron text-xs tracking-widest uppercase">✔ Payment Recorded</p>
                <button onClick={onClose}
                  className="px-6 py-2 text-xs font-bold tracking-widest uppercase border border-gray-600/40
                    text-gray-400 hover:text-gray-200 hover:border-gray-500/40 transition-colors">
                  Close
                </button>
              </div>
            )}
          </>
        ) : (
          !loadingBill && (
            <div className="border border-red-800/40 px-4 py-3">
              <p className="text-red-400 text-xs font-mono-game">{error || 'Failed to load bill.'}</p>
            </div>
          )
        )}
      </div>
    </Modal>
  );
}
