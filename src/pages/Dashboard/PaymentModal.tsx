import React, { useState } from 'react';
import type { Bill } from '../../types';
import { updateSessionPayment } from '../../api/sessions';
import { Modal } from '../../components/Modal';

interface PaymentModalProps {
  open: boolean;
  sessionId: number | null;
  bill: Bill | null;
  onDone: () => void;
}

export function PaymentModal({ open, sessionId, bill, onDone }: PaymentModalProps) {
  const [cashInput, setCashInput] = useState('');
  const [onlineInput, setOnlineInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const roundedNet = bill ? Math.round(parseFloat(bill.net_amount) / 5) * 5 : 0;

  function setAllCash()   { setCashInput(roundedNet.toString()); setOnlineInput('0'); }
  function setAllOnline() { setOnlineInput(roundedNet.toString()); setCashInput('0'); }

  function handleCashChange(val: string) {
    setCashInput(val);
    const c = parseFloat(val);
    if (!isNaN(c) && c >= 0 && c <= roundedNet) setOnlineInput((roundedNet - c).toString());
    else setOnlineInput('');
  }

  function handleOnlineChange(val: string) {
    setOnlineInput(val);
    const o = parseFloat(val);
    if (!isNaN(o) && o >= 0 && o <= roundedNet) setCashInput((roundedNet - o).toString());
    else setCashInput('');
  }

  const cashVal   = parseFloat(cashInput)   || 0;
  const onlineVal = parseFloat(onlineInput) || 0;
  const bothZero  = cashVal === 0 && onlineVal === 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sessionId) return;
    if (bothZero) { setError('Enter at least one payment amount.'); return; }
    setError(''); setSubmitting(true);
    try {
      await updateSessionPayment(sessionId, { cash_amount: cashVal, online_amount: onlineVal });
      onDone();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onDone} title="// Payment">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">

        {/* Collect amount */}
        {bill && (
          <div className="flex justify-between items-center px-4 py-3 bg-purple-900/10 border border-purple-900/30">
            <span className="font-orbitron text-sm text-purple-300 tracking-widest uppercase">
              Collect
            </span>
            <span className="font-mono-game font-black text-2xl text-cyan-400">
              ₹{roundedNet}
            </span>
          </div>
        )}

        {/* Quick-fill buttons */}
        <div className="flex gap-2">
          <button type="button" onClick={setAllCash}
            className="flex-1 text-xs font-bold tracking-wider px-3 py-2 border border-emerald-800/50 text-emerald-700 hover:text-emerald-400 hover:border-emerald-600/60 transition-colors">
            All Cash
          </button>
          <button type="button" onClick={setAllOnline}
            className="flex-1 text-xs font-bold tracking-wider px-3 py-2 border border-cyan-800/50 text-cyan-700 hover:text-cyan-400 hover:border-cyan-600/60 transition-colors">
            All Online
          </button>
        </div>

        {/* Cash / Online inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="game-label">💵 Cash (₹)</label>
            <input type="number" min="0" step="1" value={cashInput}
              onChange={(e) => handleCashChange(e.target.value)}
              placeholder="0" className="game-input" />
          </div>
          <div>
            <label className="game-label">📱 Online (₹)</label>
            <input type="number" min="0" step="1" value={onlineInput}
              onChange={(e) => handleOnlineChange(e.target.value)}
              placeholder="0" className="game-input" />
          </div>
        </div>

        {error && (
          <div className="border border-red-800/40 bg-red-950/20 px-3 py-2 flex items-center gap-2">
            <span className="text-red-400">⚠</span>
            <p className="text-red-400 text-xs font-mono-game tracking-wide">{error}</p>
          </div>
        )}

        <button type="submit" disabled={submitting || bothZero}
          className="w-full py-2.5 px-4 font-orbitron text-xs font-bold tracking-widest uppercase transition-all
            disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer border
            bg-emerald-600/20 border-emerald-600/50 text-emerald-400
            hover:bg-emerald-600/40 hover:text-emerald-200">
          {submitting ? '// Saving…' : '■ Confirm Payment'}
        </button>

      </form>
    </Modal>
  );
}
