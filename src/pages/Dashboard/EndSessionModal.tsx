import React, { useEffect, useState } from 'react';
import type { GamingTable, ActiveTableSession, Discount, Bill } from '../../types';
import { endSession } from '../../api/sessions';
import { getBill } from '../../api/billing';
import { Modal } from '../../components/Modal';
import { DiscountPicker } from '../../components/DiscountPicker';
import { Spinner } from '../../components/Spinner';
import { PrintReceiptModal } from './PrintReceiptModal';
import { PaymentModal } from './PaymentModal';

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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Step tracking: 'form' → 'print' → 'payment'
  const [step, setStep] = useState<'form' | 'print' | 'payment'>('form');
  const [closedBill, setClosedBill] = useState<Bill | null>(null);
  const [closedSessionId, setClosedSessionId] = useState<number | null>(null);

  useEffect(() => {
    if (!open || !session) return;
    setSelectedDiscount(null);
    setError('');
    setBill(null);
    setStep('form');
    setClosedBill(null);
    setClosedSessionId(null);
    setLoadingBill(true);
    getBill(session.id)
      .then(setBill)
      .catch(() => {})
      .finally(() => setLoadingBill(false));
  }, [open, session]);

  const gross        = bill ? parseFloat(bill.total_amount)   : 0;
  const sessionAmt   = bill ? parseFloat(bill.session_amount) : 0;
  const ordersAmt    = bill ? parseFloat(bill.orders_total)   : 0;

  let discountAmount = 0;
  if (selectedDiscount && gross > 0) {
    const val   = parseFloat(selectedDiscount.discount_value);
    const scope = selectedDiscount.scope ?? 'all';
    // base = what the discount actually applies to
    const base  = scope === 'session' ? sessionAmt
                : scope === 'order'   ? ordersAmt
                : gross;
    discountAmount = selectedDiscount.discount_type === 'percentage'
      ? base * val / 100
      : Math.min(val, base);
  }
  const rawNet    = gross - discountAmount;
  const roundedNet = Math.round(rawNet / 5) * 5;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    setError(''); setSubmitting(true);
    try {
      const payload: Parameters<typeof endSession>[0] = {
        session_id: session.id,
        cash_amount: 0,
        online_amount: 0,
      };
      if (selectedDiscount) {
        payload.discount_type = selectedDiscount.discount_type;
        payload.discount_value = parseFloat(selectedDiscount.discount_value);
      }
      await endSession(payload);

      // Fetch the closed bill for print
      try {
        const closed = await getBill(session.id);
        setClosedBill(closed);
      } catch { /* bill fetch optional */ }

      setClosedSessionId(session.id);
      onClose(); // close the end-session modal
      setStep('print'); // open print modal
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to end session');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* Step 1 — Bill preview + discount */}
      <Modal open={open} onClose={onClose} title={`End Session — ${table?.name ?? ''}`}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {loadingBill ? (
            <div className="flex justify-center py-6"><Spinner /></div>
          ) : bill ? (
            <>
              {/* Bill Preview header */}
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
                {bill.booking_type === 'frame_wise' && bill.frames && bill.frames.filter(f => f.ended_at).length > 0 ? (
                  bill.frames.filter(f => f.ended_at).map((f, i) => (
                    <div key={f.id} className={`flex justify-between px-4 py-2 ${i < bill.frames!.filter(x=>x.ended_at).length - 1 ? 'border-b border-purple-900/10' : ''}` }>
                      <span className="text-gray-500 text-xs">
                        {f.player_name}
                        <span className="text-gray-700 ml-1">({Math.ceil(Number(f.duration_min))} min)</span>
                      </span>
                      <span className="font-mono-game text-gray-400 text-xs">₹{Math.round(parseFloat(f.amount ?? '0'))}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex justify-between px-4 py-2.5 border-b border-purple-900/20">
                    <span className="text-gray-500 text-xs tracking-wider uppercase">
                      Table time ({bill.duration_min} min × ₹{Math.round(parseFloat(bill.price_per_minute) * 60)}/hr)
                    </span>
                    <span className="font-mono-game text-gray-300 text-xs">₹{Math.round(parseFloat(bill.session_amount))}</span>
                  </div>
                )}
                {bill.orders.map((o) => (
                  <div key={o.id} className="flex justify-between px-4 py-2 border-b border-purple-900/10">
                    <span className="text-gray-500 text-xs">
                      {o.item_name} × {o.quantity}
                      <span className="text-gray-700 ml-1">(₹{Math.round(parseFloat(o.unit_price))} ea)</span>
                    </span>
                    <span className="font-mono-game text-gray-400 text-xs">₹{Math.round(parseFloat(o.subtotal))}</span>
                  </div>
                ))}
                <div className="flex justify-between px-4 py-2.5 border-t border-purple-900/30 bg-purple-900/5">
                  <span className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Gross Total</span>
                  <span className="font-mono-game text-gray-200 text-sm font-bold">₹{Math.round(gross)}</span>
                </div>
              </div>

              {/* Discount */}
              <div className="border border-purple-900/30 p-4 flex flex-col gap-3">
                <p className="font-orbitron text-xs text-purple-600 tracking-widest uppercase">// Discount (optional)</p>
                <DiscountPicker selected={selectedDiscount} onSelect={setSelectedDiscount} tableType={session?.table_type} />
              </div>

              {/* Final totals */}
              <div className="border border-purple-900/30 bg-[#07070f]">
                <div className="flex justify-between px-4 py-2.5 border-b border-purple-900/20">
                  <span className="text-gray-500 text-xs uppercase tracking-wider">Gross Total</span>
                  <span className="font-mono-game text-gray-400 text-xs">₹{Math.round(gross)}</span>
                </div>
                {discountAmount > 0 ? (
                  <div className="flex justify-between px-4 py-2.5 border-b border-purple-900/20">
                    <span className="text-emerald-600 text-xs uppercase tracking-wider">
                      Discount ({selectedDiscount!.discount_type === 'percentage'
                        ? `${Math.round(parseFloat(selectedDiscount!.discount_value))}%`
                        : `₹${Math.round(parseFloat(selectedDiscount!.discount_value))} flat`})
                    </span>
                    <span className="font-mono-game text-emerald-500 text-xs">− ₹{Math.round(discountAmount)}</span>
                  </div>
                ) : (
                  <div className="flex justify-between px-4 py-2.5 border-b border-purple-900/20">
                    <span className="text-gray-700 text-xs uppercase tracking-wider">Discount</span>
                    <span className="font-mono-game text-gray-700 text-xs">—</span>
                  </div>
                )}
                {rawNet !== roundedNet && (
                  <div className="flex justify-between px-4 py-2 border-b border-purple-900/10">
                    <span className="text-gray-600 text-xs uppercase tracking-wider">Exact</span>
                    <span className="font-mono-game text-gray-600 text-xs">₹{Math.round(rawNet)}</span>
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
                  <DiscountPicker selected={selectedDiscount} onSelect={setSelectedDiscount} tableType={session?.table_type} />
                </div>
              </div>
            )
          )}

          {error && (
            <div className="border border-red-800/40 bg-red-950/20 px-3 py-2 flex items-center gap-2">
              <span className="text-red-400">⚠</span>
              <p className="text-red-400 text-xs font-mono-game tracking-wide">{error}</p>
            </div>
          )}

          <button type="submit" disabled={submitting || loadingBill}
            className="w-full py-2.5 px-4 font-orbitron text-xs font-bold tracking-widest uppercase transition-all
              disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed border
              bg-red-600/20 border-red-600/50 text-red-400 hover:bg-red-600/40 hover:text-red-200">
            {submitting ? '// Ending…' : '■ End Session & Bill'}
          </button>
        </form>
      </Modal>

      {/* Step 2 — Print receipt */}
      {closedBill && (
        <PrintReceiptModal
          open={step === 'print'}
          bill={closedBill}
          cashAmount={0}
          onlineAmount={0}
          onClose={() => setStep('payment')}
        />
      )}

      {/* Step 3 — Payment */}
      <PaymentModal
        open={step === 'payment'}
        sessionId={closedSessionId}
        bill={closedBill}
        onDone={() => {
          setStep('form');
          setClosedBill(null);
          setClosedSessionId(null);
          onEnded();
        }}
      />
    </>
  );
}
