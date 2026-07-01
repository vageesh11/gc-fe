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

export function PrintReceiptModal({ open, bill, cashAmount, onlineAmount, onClose }: PrintReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const sessionAmt  = parseFloat(bill.session_amount);
  const _ordersTotal = parseFloat(bill.orders_total); void _ordersTotal;
  const grossTotal  = parseFloat(bill.total_amount);
  const discountAmt = parseFloat(bill.discount_amount);
  const netAmount   = Math.round(parseFloat(bill.net_amount) / 5) * 5;
  const pricePerHr  = (parseFloat(bill.price_per_minute) * 60).toFixed(0);

  const paymentLine = cashAmount > 0 && onlineAmount > 0
    ? `Cash ₹${cashAmount} + Online ₹${onlineAmount}`
    : cashAmount > 0
    ? `Cash ₹${cashAmount}`
    : `Online ₹${onlineAmount}`;

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
    width: 58mm;
    padding: 4mm 3mm;
    color: #000;
    background: #fff;
  }
  .center  { text-align: center; }
  .right   { text-align: right; }
  .bold    { font-weight: bold; }
  .lg      { font-size: 14px; font-weight: bold; }
  .xl      { font-size: 17px; font-weight: bold; }
  .divider { border-top: 1px dashed #000; margin: 3mm 0; }
  .solid   { border-top: 1px solid #000; margin: 3mm 0; }
  .row     { display: flex; justify-content: space-between; margin-bottom: 1.5mm; }
  .row .label { flex: 1; }
  .row .val   { text-align: right; white-space: nowrap; margin-left: 2mm; }
  .indent  { padding-left: 3mm; }
  .small   { font-size: 9px; color: #444; }
  .total-row { font-size: 13px; font-weight: bold; }
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
          style={{ fontFamily: "'Courier New', monospace", fontSize: '11px', width: '210px',
            background: '#fff', color: '#000', padding: '8px 6px', margin: '0 auto',
            border: '1px dashed #555' }}
        >
          {/* Header */}
          <div className="center bold lg" style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '14px' }}>
            GAMING CAFÉ
          </div>
          <div style={{ textAlign: 'center', fontSize: '9px', marginBottom: '4px' }}>
            {bill.table_name} · {bill.table_type.toUpperCase()}
          </div>
          <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />

          {/* Session info */}
          <div style={{ fontSize: '10px', marginBottom: '2px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Receipt #</span><span>{bill.session_id}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Date</span><span>{fmt(bill.start_time)}</span>
            </div>
            {bill.customer_name && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Customer</span><span>{bill.customer_name}</span>
              </div>
            )}
            {bill.customer_phone && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Mobile</span><span>{bill.customer_phone}</span>
              </div>
            )}
          </div>
          <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />

          {/* Session time */}
          <div style={{ fontSize: '10px', marginBottom: '2px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Start</span><span>{fmtTime(bill.start_time)}</span>
            </div>
            {bill.end_time && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>End</span><span>{fmtTime(bill.end_time)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Duration</span><span>{bill.duration_min} min</span>
            </div>
            {bill.pauses.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Pauses</span><span>{bill.pauses.length}x</span>
              </div>
            )}
          </div>
          <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />

          {/* Table time line */}
          <div style={{ fontSize: '10px', marginBottom: '2px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Table ({bill.duration_min}min @₹{pricePerHr}/hr)</span>
              <span>₹{sessionAmt.toFixed(2)}</span>
            </div>

            {/* Orders */}
            {bill.orders.length > 0 && bill.orders.map((o) => (
              <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ paddingLeft: '2px' }}>{o.item_name} x{o.quantity}</span>
                <span>₹{parseFloat(o.subtotal).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />

          {/* Totals */}
          <div style={{ fontSize: '10px', marginBottom: '2px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Gross Total</span><span>₹{grossTotal.toFixed(2)}</span>
            </div>
            {discountAmt > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Discount
                  {bill.discount_type === 'percentage'
                    ? ` (${parseFloat(bill.discount_value).toFixed(0)}%)`
                    : bill.discount_type === 'flat'
                    ? ' (flat)'
                    : ''}
                </span>
                <span>-₹{discountAmt.toFixed(2)}</span>
              </div>
            )}
          </div>
          <div style={{ borderTop: '1px solid #000', margin: '4px 0' }} />

          {/* Net total — large */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '16px', marginBottom: '4px' }}>
            <span>TOTAL</span><span>₹{netAmount}</span>
          </div>

          {/* Payment */}
          <div style={{ fontSize: '10px', marginBottom: '2px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Payment</span><span>{paymentLine}</span>
            </div>
          </div>
          <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />

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
