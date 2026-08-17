import { useRef } from 'react';
import type { Bill } from '../../types';
import { Modal } from '../../components/Modal';

interface PrintReceiptModalProps {
  open: boolean;
  bill: Bill;
  cashAmount: number;
  onlineAmount: number;
  onClose: () => void;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

const BOOKING_LABELS: Record<string, string> = {
  pay_as_you_go: 'PAY AS YOU GO',
  fixed_slot: 'FIXED SLOT',
  pre_booking: 'PRE BOOKING',
  frame_wise: 'FRAME WISE',
};

// Shared inline-style shorthands (58mm receipt, inline styles survive innerHTML copy)
const row: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', marginBottom: '2px' };
const lbl: React.CSSProperties = { flex: 1 };
const val: React.CSSProperties = { textAlign: 'right', whiteSpace: 'nowrap', marginLeft: '4px' };
const divider: React.CSSProperties = { borderTop: '1px dashed #000', margin: '5px 0' };
const solid: React.CSSProperties = { borderTop: '1px solid #000', margin: '5px 0' };
const sectionHead: React.CSSProperties = { fontWeight: 'bold', fontSize: '10px', marginBottom: '2px' };
const sub: React.CSSProperties = { fontSize: '9px', color: '#333', paddingLeft: '4px' };

export function PrintReceiptModal({ open, bill, cashAmount, onlineAmount, onClose }: PrintReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const sessionAmt  = parseFloat(bill.session_amount);
  const ordersTotal = parseFloat(bill.orders_total);
  const grossTotal  = parseFloat(bill.total_amount);
  const discountAmt = parseFloat(bill.discount_amount);
  const netAmount   = Math.round(parseFloat(bill.net_amount) / 5) * 5;
  const pricePerHr  = (parseFloat(bill.price_per_minute) * 60).toFixed(0);

  const isFrameWise = bill.booking_type === 'frame_wise';
  const isSlotType  = bill.booking_type === 'fixed_slot' || bill.booking_type === 'pre_booking';
  const endedFrames = (bill.frames ?? []).filter((f) => f.ended_at);

  // Total paused minutes (open pause counts until session end)
  const refEnd = bill.end_time ?? new Date().toISOString();
  const totalPausedMin = bill.pauses.reduce((sum, p) => {
    const to = p.resumed_at ?? refEnd;
    return sum + Math.max(0, Math.round((new Date(to).getTime() - new Date(p.paused_at).getTime()) / 60000));
  }, 0);

  const paymentLine = cashAmount > 0 && onlineAmount > 0
    ? `Cash ₹${cashAmount} + Online ₹${onlineAmount}`
    : cashAmount > 0
    ? `Cash ₹${cashAmount}`
    : `Online ₹${onlineAmount}`;

  // ── Discount breakdown per section ──────────────────────────────────────
  const discVal   = parseFloat(bill.discount_value || '0');
  const discScope = bill.discount_scope ?? 'all';
  const discType  = bill.discount_type;
  const isPctDisc = discType === 'percentage';

  function calcDisc(base: number) {
    if (!discType || discType === 'none' || base <= 0) return 0;
    return isPctDisc ? Math.round(base * discVal / 100) : Math.min(discVal, base);
  }

  // Section-level discounts. Flat/pass with scope 'all' can't be attributed to
  // one section, so it stays a single bill-level line in the totals area.
  const tableDiscAmt  = discountAmt > 0 && (discScope === 'session' || (discScope === 'all' && isPctDisc)) ? calcDisc(sessionAmt)  : 0;
  const snacksDiscAmt = discountAmt > 0 && (discScope === 'order'   || (discScope === 'all' && isPctDisc)) ? calcDisc(ordersTotal) : 0;
  const billLevelDisc = discountAmt > 0 && !isPctDisc && discScope === 'all';

  const discShort = isPctDisc ? `${discVal.toFixed(0)}%` : discType === 'flat' ? 'flat' : discType === 'pass' ? 'pass' : '';

  function handlePrint() {
    const receiptHtml = receiptRef.current?.innerHTML ?? '';
    const win = window.open('', '_blank', 'width=300,height=600');
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>Receipt</title>
<style>
  @page {
    size: 58mm auto;
    margin: 0;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 11px;
    font-weight: bold;
    width: 58mm;
    padding: 4mm 3mm;
    color: #000;
    background: #fff;
  }
</style>
</head>
<body>
${receiptHtml}
<script>window.onload = function(){ window.print(); window.close(); }</script>
</body>
</html>`);
    win.document.close();
  }

  return (
    <Modal open={open} onClose={onClose} title="Print Bill">
      <div className="flex flex-col gap-4">

        {/* Receipt preview — styled to mimic 58mm paper */}
        <div
          ref={receiptRef}
          style={{ fontFamily: "'Courier New', monospace", fontSize: '11px', fontWeight: 'bold', width: '210px',
            background: '#fff', color: '#000', padding: '8px 6px', margin: '0 auto',
            border: '1px dashed #555' }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '14px' }}>
            BENGALURU SNOOKER CLUB
          </div>
          <div style={{ textAlign: 'center', fontSize: '9px', marginBottom: '2px' }}>
            {bill.table_name} · {bill.table_type.toUpperCase()}
          </div>
          <div style={{ textAlign: 'center', fontSize: '9px', marginBottom: '4px' }}>
            {BOOKING_LABELS[bill.booking_type] ?? bill.booking_type}
          </div>
          <div style={divider} />

          {/* Session info */}
          <div style={{ fontSize: '10px' }}>
            <div style={row}><span style={lbl}>Receipt #</span><span style={val}>{bill.session_id}</span></div>
            <div style={row}><span style={lbl}>Date</span><span style={val}>{fmt(bill.start_time)}</span></div>
            {bill.customer_name && (
              <div style={row}><span style={lbl}>Customer</span><span style={val}>{bill.customer_name}</span></div>
            )}
            {bill.customer_phone && (
              <div style={row}><span style={lbl}>Mobile</span><span style={val}>{bill.customer_phone}</span></div>
            )}
          </div>
          <div style={divider} />

          {/* Session time details */}
          <div style={{ fontSize: '10px' }}>
            {isSlotType && bill.scheduled_start && (
              <div style={row}><span style={lbl}>Scheduled</span><span style={val}>{fmtTime(bill.scheduled_start)}</span></div>
            )}
            {isSlotType && bill.booked_duration != null && (
              <div style={row}><span style={lbl}>Slot booked</span><span style={val}>{bill.booked_duration} min</span></div>
            )}
            <div style={row}><span style={lbl}>Start</span><span style={val}>{fmtTime(bill.start_time)}</span></div>
            {bill.end_time && (
              <div style={row}><span style={lbl}>End</span><span style={val}>{fmtTime(bill.end_time)}</span></div>
            )}
            {totalPausedMin > 0 && (
              <div style={row}><span style={lbl}>Paused ({bill.pauses.length}x)</span><span style={val}>{totalPausedMin} min</span></div>
            )}
            {isFrameWise ? (
              <div style={row}><span style={lbl}>Frames played</span><span style={val}>{endedFrames.length} · {bill.duration_min} min</span></div>
            ) : (
              <>
                <div style={row}><span style={lbl}>Billable time</span><span style={val}>{bill.duration_min} min</span></div>
                <div style={row}><span style={lbl}>Rate</span><span style={val}>₹{pricePerHr}/hr</span></div>
              </>
            )}
          </div>
          <div style={divider} />

          {/* Charges — table time OR frames */}
          <div style={{ fontSize: '10px' }}>
            {isFrameWise ? (
              <>
                <div style={sectionHead}>FRAMES ({endedFrames.length})</div>
                {endedFrames.map((f) => (
                  <div key={f.id} style={{ marginBottom: '2px' }}>
                    <div style={row}>
                      <span style={lbl}>{f.player_name || 'Player'}</span>
                      <span style={val}>₹{parseFloat(f.amount ?? '0').toFixed(2)}</span>
                    </div>
                    <div style={sub}>
                      {fmtTime(f.started_at)} - {fmtTime(f.ended_at!)} · {Math.ceil(Number(f.duration_min))} min
                    </div>
                  </div>
                ))}
                <div style={{ ...row, fontWeight: 'bold', borderTop: '1px dotted #000', paddingTop: '2px', marginTop: '2px' }}>
                  <span style={lbl}>Frames Total</span>
                  <span style={val}>₹{sessionAmt.toFixed(2)}</span>
                </div>
                {tableDiscAmt > 0 && (
                  <>
                    <div style={row}>
                      <span style={lbl}>Discount {discShort}</span>
                      <span style={val}>-₹{tableDiscAmt.toFixed(2)}</span>
                    </div>
                    <div style={{ ...row, fontWeight: 'bold' }}>
                      <span style={lbl}>Frames Subtotal</span>
                      <span style={val}>₹{(sessionAmt - tableDiscAmt).toFixed(2)}</span>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <div style={sectionHead}>TABLE TIME</div>
                <div style={row}>
                  <span style={lbl}>{bill.duration_min} min @ ₹{pricePerHr}/hr</span>
                  <span style={val}>₹{sessionAmt.toFixed(2)}</span>
                </div>
                {tableDiscAmt > 0 && (
                  <>
                    <div style={row}>
                      <span style={lbl}>Discount {discShort}</span>
                      <span style={val}>-₹{tableDiscAmt.toFixed(2)}</span>
                    </div>
                    <div style={{ ...row, fontWeight: 'bold' }}>
                      <span style={lbl}>Table Subtotal</span>
                      <span style={val}>₹{(sessionAmt - tableDiscAmt).toFixed(2)}</span>
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* Snacks & orders */}
          {bill.orders.length > 0 && (
            <>
              <div style={divider} />
              <div style={{ fontSize: '10px' }}>
                <div style={sectionHead}>SNACKS & ORDERS</div>
                {bill.orders.map((o) => (
                  <div key={o.id} style={{ marginBottom: '2px' }}>
                    <div style={row}>
                      <span style={lbl}>{o.item_name} x{o.quantity}</span>
                      <span style={val}>₹{parseFloat(o.subtotal).toFixed(2)}</span>
                    </div>
                    <div style={sub}>@ ₹{parseFloat(o.unit_price).toFixed(0)} each · {fmtTime(o.created_at)}</div>
                  </div>
                ))}
                <div style={{ ...row, fontWeight: 'bold', borderTop: '1px dotted #000', paddingTop: '2px', marginTop: '2px' }}>
                  <span style={lbl}>Snacks Total</span>
                  <span style={val}>₹{ordersTotal.toFixed(2)}</span>
                </div>
                {snacksDiscAmt > 0 && (
                  <>
                    <div style={row}>
                      <span style={lbl}>Discount {discShort}</span>
                      <span style={val}>-₹{snacksDiscAmt.toFixed(2)}</span>
                    </div>
                    <div style={{ ...row, fontWeight: 'bold' }}>
                      <span style={lbl}>Snacks Subtotal</span>
                      <span style={val}>₹{(ordersTotal - snacksDiscAmt).toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
          <div style={divider} />

          {/* Totals */}
          <div style={{ fontSize: '10px' }}>
            <div style={row}><span style={lbl}>Gross Total</span><span style={val}>₹{grossTotal.toFixed(2)}</span></div>
            {billLevelDisc && (
              <div style={row}>
                <span style={lbl}>Discount {discShort} (whole bill)</span>
                <span style={val}>-₹{discountAmt.toFixed(2)}</span>
              </div>
            )}
            {discountAmt > 0 && !billLevelDisc && (
              <div style={row}>
                <span style={lbl}>Total Discount</span>
                <span style={val}>-₹{discountAmt.toFixed(2)}</span>
              </div>
            )}
          </div>
          <div style={solid} />

          {/* Net total — large */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '16px', marginBottom: '4px' }}>
            <span>TOTAL</span><span>₹{netAmount}</span>
          </div>

          {/* Payment */}
          <div style={{ fontSize: '10px' }}>
            <div style={row}><span style={lbl}>Payment</span><span style={val}>{paymentLine}</span></div>
          </div>
          <div style={divider} />

          {/* Footer */}
          <div style={{ textAlign: 'center', fontSize: '9px', marginTop: '4px' }}>
            Thank you for visiting!
          </div>
          <div style={{ textAlign: 'center', fontSize: '9px' }}>
            See you again :)
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 px-4 font-orbitron text-xs font-bold tracking-widest uppercase
              bg-cyan-600/20 border border-cyan-500/60 text-cyan-300
              hover:bg-cyan-600/40 hover:text-white transition-all"
          >
            🖨 Print Receipt
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold tracking-widest uppercase
              border border-gray-700/40 text-gray-500
              hover:text-gray-300 hover:border-gray-500/40 transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </Modal>
  );
}
