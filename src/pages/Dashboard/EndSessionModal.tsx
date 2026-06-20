import React, { useEffect, useState } from 'react';
import type { GamingTable, ActiveTableSession, Discount, Bill } from '../../types';
import { endSession } from '../../api/sessions';
import { getBill } from '../../api/billing';
import { Modal } from '../../components/Modal';
import { DiscountPicker } from '../../components/DiscountPicker';
import { Spinner } from '../../components/Spinner';
import { PrintReceiptModal } from './PrintReceiptModal';

interface EndSessionModalProps {
  open: boolean;
  table: GamingTable | null;
  session: ActiveTableSession | null;
  onClose: () => void;
  onEnded: () => void;
}

export function EndSessionModal({ open, table, session, onClose, onEnded }: EndSessionModalProps) {
  const [bill, setBill] = useState<Bill | null>(null);
  const [loadingBill, setLoadingBill] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);
  const [cashInput, setCashInput] = useState('');
  const [onlineInput, setOnlineInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPrint, setShowPrint] = useState(false);
  const [finalBill, setFinalBill] = useState<Bill | null>(null);
  const [finalCash, setFinalCash] = useState(0);
  const [finalOnline, setFinalOnline] = useState(0);

  useEffect(() => {
    if (!open || !session) return;
    setSelectedDiscount(null);
    setCashInput(''); setOnlineInput('');
    setError('');
    setBill(null);
    setLoadingBill(true);
    getBill(session.id)
      .then(setBill)
      .catch(() => {})
      .finally(() => setLoadingBill(false));
  }, [open, session]);

  // Raw net from bill + discount selection
  const gross = bill ? parseFloat(bill.total_amount) : 0;
  let discountAmount = 0;
  if (selectedDiscount && gross > 0) {
    const val = parseFloat(selectedDiscount.discount_value);
    discountAmount = selectedDiscount.discount_type === 'percentage'
      ? parseFloat((gross * val / 100).toFixed(2))
      : Math.min(val, gross);
  }
  const rawNet = gross - discountAmount;
  // Rounded to nearest ₹5 — this is what staff should collect (server rounds too)
  const roundedNet = Math.round(rawNet / 5) * 5;

  const cashVal = parseFloat(cashInput) || 0;
  const onlineVal = parseFloat(onlineInput) || 0;
  const splitTotal = parseFloat((cashVal + onlineVal).toFixed(2));
  const bothZero = cashVal === 0 && onlineVal === 0;

  // Quick-fill with rounded amount
  function setAllCash()   { setCashInput(roundedNet.toString()); setOnlineInput('0'); }
  function setAllOnline()  { setOnlineInput(roundedNet.toString()); setCashInput('0'); }

  // Auto-fill the other field as remainder from roundedNet
  function handleCashChange(val: string) {
    setCashInput(val);
    const c = parseFloat(val);
    if (!isNaN(c) && c >= 0 && c <= roundedNet) {
      setOnlineInput((roundedNet - c).toString());
    } else {
      setOnlineInput('');
    }
  }

  function handleOnlineChange(val: string) {
    setOnlineInput(val);
    const o = parseFloat(val);
    if (!isNaN(o) && o >= 0 && o <= roundedNet) {
      setCashInput((roundedNet - o).toString());
    } else {
      setCashInput('');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    if (bothZero) { setError('Enter at least one payment amount.'); return; }
    setError(''); setSubmitting(true);
    try {
      const payload: Parameters<typeof endSession>[0] = {
        session_id: session.id,
        cash_amount: cashVal,
        online_amount: onlineVal,
      };
      if (selectedDiscount) {
        payload.discount_type = selectedDiscount.discount_type;
        payload.discount_value = parseFloat(selectedDiscount.discount_value);
      }
      await endSession(payload);
      // Fetch the final closed bill for the receipt
      try {
        const closed = await getBill(session.id);
        setFinalBill(closed);
        setFinalCash(cashVal);
        setFinalOnline(onlineVal);
        setShowPrint(true);
      } catch { /* print is optional — proceed even if bill fetch fails */ }
      onEnded();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to end session');
    } finally {
      setSubmitting(false);
    }
  }

  // Derive payment label for submit button
  const paymentLabel = cashVal > 0 && onlineVal > 0
    ? `💵₹${cashVal.toFixed(0)} + 📱₹${onlineVal.toFixed(0)}`
    : cashVal > 0
    ? `💵 Cash ₹${cashVal.toFixed(0)}`
    : onlineVal > 0
    ? `📱 Online ₹${onlineVal.toFixed(0)}`
    : '';

  return (
    <>
    <Modal open={open} onClose={onClose} title={`End Session — ${table?.name ?? ''}`}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">

        {loadingBill ? (
          <div className="flex justify-center py-6"><Spinner /></div>
        ) : bill ? (
          <>
            {/* Customer & session info */}
            <div className="bg-[#07070f] border border-purple-900/30 px-4 py-3 flex flex-col gap-1.5">
              <p className="font-orbitron text-xs text-purple-600 tracking-widest uppercase mb-1">// Bill Preview</p>
              {bill.customer_name && (
                <div className="flex justify-between">
                  <span className="text-gray-500 text-xs tracking-wider uppercase">Customer</span>
                  <span className="text-gray-200 font-semibold text-xs">{bill.customer_name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500 text-xs tracking-wider uppercase">Duration</span>
                <span className="font-mono-game text-gray-300 text-xs">{bill.duration_min} min</span>
              </div>
            </div>

            {/* Line items */}
            <div className="border border-purple-900/30 bg-[#07070f]">
              <div className="flex justify-between px-4 py-2.5 border-b border-purple-900/20">
                <span className="text-gray-500 text-xs tracking-wider uppercase">
                  Table time ({bill.duration_min} min × ₹{(parseFloat(bill.price_per_minute) * 60).toFixed(0)}/hr)
                </span>
                <span className="font-mono-game text-gray-300 text-xs">₹{parseFloat(bill.session_amount).toFixed(2)}</span>
              </div>
              {bill.orders.map((o) => (
                <div key={o.id} className="flex justify-between px-4 py-2 border-b border-purple-900/10">
                  <span className="text-gray-500 text-xs">
                    {o.item_name} × {o.quantity}
                    <span className="text-gray-700 ml-1">(₹{parseFloat(o.unit_price).toFixed(2)} ea)</span>
                  </span>
                  <span className="font-mono-game text-gray-400 text-xs">₹{parseFloat(o.subtotal).toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between px-4 py-2.5 border-t border-purple-900/30 bg-purple-900/5">
                <span className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Gross Total</span>
                <span className="font-mono-game text-gray-200 text-sm font-bold">₹{gross.toFixed(2)}</span>
              </div>
            </div>

            {/* Discount */}
            <div className="border border-purple-900/30 p-4 flex flex-col gap-3">
              <p className="font-orbitron text-xs text-purple-600 tracking-widest uppercase">// Discount (optional)</p>
              <DiscountPicker selected={selectedDiscount} onSelect={setSelectedDiscount} />
            </div>

            {/* Final total */}
            <div className="border border-purple-900/30 bg-[#07070f]">
              <div className="flex justify-between px-4 py-2.5 border-b border-purple-900/20">
                <span className="text-gray-500 text-xs uppercase tracking-wider">Gross Total</span>
                <span className="font-mono-game text-gray-400 text-xs">₹{gross.toFixed(2)}</span>
              </div>
              {discountAmount > 0 ? (
                <div className="flex justify-between px-4 py-2.5 border-b border-purple-900/20">
                  <span className="text-emerald-600 text-xs uppercase tracking-wider">
                    Discount ({selectedDiscount!.discount_type === 'percentage'
                      ? `${parseFloat(selectedDiscount!.discount_value).toFixed(0)}%`
                      : `₹${parseFloat(selectedDiscount!.discount_value).toFixed(2)} flat`})
                  </span>
                  <span className="font-mono-game text-emerald-500 text-xs">− ₹{discountAmount.toFixed(2)}</span>
                </div>
              ) : (
                <div className="flex justify-between px-4 py-2.5 border-b border-purple-900/20">
                  <span className="text-gray-700 text-xs uppercase tracking-wider">Discount</span>
                  <span className="font-mono-game text-gray-700 text-xs">—</span>
                </div>
              )}
              {/* Show both raw and rounded */}
              {rawNet !== roundedNet && (
                <div className="flex justify-between px-4 py-2 border-b border-purple-900/10">
                  <span className="text-gray-600 text-xs uppercase tracking-wider">Exact</span>
                  <span className="font-mono-game text-gray-600 text-xs">₹{rawNet.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between px-4 py-3 bg-purple-900/10">
                <span className="font-orbitron text-sm text-purple-300 tracking-widest uppercase">
                  Collect {rawNet !== roundedNet && <span className="text-purple-600 text-xs">(rounded)</span>}
                </span>
                <span className="font-mono-game font-black text-xl text-cyan-400 text-glow-cyan">
                  ₹{roundedNet}
                </span>
              </div>
            </div>
          </>
        ) : (
          session && (
            <div className="bg-[#07070f] border border-red-900/30 px-4 py-3 flex flex-col gap-2.5">
              <p className="font-orbitron text-xs text-red-600 tracking-widest uppercase mb-1">// Session Summary</p>
              {session.customer_name && (
                <div className="flex justify-between">
                  <span className="text-gray-500 text-xs tracking-wider uppercase">Customer</span>
                  <span className="text-gray-200 font-semibold text-xs">{session.customer_name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500 text-xs tracking-wider uppercase">Duration</span>
                <span className="font-mono-game text-amber-300">{session.duration_min ?? 0} min</span>
              </div>
              <div className="border border-purple-900/30 p-3 mt-1">
                <p className="font-orbitron text-xs text-purple-600 tracking-widest uppercase mb-2">// Discount (optional)</p>
                <DiscountPicker selected={selectedDiscount} onSelect={setSelectedDiscount} />
              </div>
            </div>
          )
        )}

        {/* Split payment */}
        <div className="border border-purple-900/30 p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="font-orbitron text-xs text-purple-600 tracking-widest uppercase">// Payment</p>
            <div className="flex gap-2">
              <button type="button" onClick={setAllCash}
                className="text-xs font-bold tracking-wider px-2 py-1 border border-emerald-800/40 text-emerald-700 hover:text-emerald-400 hover:border-emerald-600/50 transition-colors">
                All Cash
              </button>
              <button type="button" onClick={setAllOnline}
                className="text-xs font-bold tracking-wider px-2 py-1 border border-cyan-800/40 text-cyan-700 hover:text-cyan-400 hover:border-cyan-600/50 transition-colors">
                All Online
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="game-label">💵 Cash (₹)</label>
              <input
                type="number" min="0" step="1"
                value={cashInput}
                onChange={(e) => handleCashChange(e.target.value)}
                placeholder="0"
                className="game-input"
              />
            </div>
            <div>
              <label className="game-label">📱 Online (₹)</label>
              <input
                type="number" min="0" step="1"
                value={onlineInput}
                onChange={(e) => handleOnlineChange(e.target.value)}
                placeholder="0"
                className="game-input"
              />
            </div>
          </div>

          {/* Running total — informational only */}
          {splitTotal > 0 && (
            <div className="flex justify-between px-3 py-2 border border-purple-900/20 text-xs font-mono-game text-gray-500">
              <span className="tracking-wider">Total entered</span>
              <span className="font-bold text-gray-400">₹{splitTotal.toFixed(0)}</span>
            </div>
          )}
        </div>

        {error && (
          <div className="border border-red-800/40 bg-red-950/20 px-3 py-2 flex items-center gap-2">
            <span className="text-red-400">⚠</span>
            <p className="text-red-400 text-xs font-mono-game tracking-wide">{error}</p>
          </div>
        )}

        <button type="submit" disabled={submitting || loadingBill || bothZero}
          className="w-full py-2.5 px-4 font-orbitron text-xs font-bold tracking-widest uppercase transition-all disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed border bg-red-600/20 border-red-600/50 text-red-400 hover:bg-red-600/40 hover:text-red-200">
          {submitting
            ? '// Ending…'
            : paymentLabel
            ? `■ End & Collect ${paymentLabel}`
            : '■ End Session & Bill'}
        </button>
      </form>
    </Modal>

    {/* Print receipt — opens automatically after session ends */}
    {finalBill && (
      <PrintReceiptModal
        open={showPrint}
        bill={finalBill}
        cashAmount={finalCash}
        onlineAmount={finalOnline}
        onClose={() => { setShowPrint(false); setFinalBill(null); }}
      />
    )}
  </>
  );
}
