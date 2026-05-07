import { useCallback, useEffect, useState } from 'react';
import type { ReportData } from '../../types';
import {
  getDailyReport, downloadDailyExcel,
  getWeeklyReport, downloadWeeklyExcel,
  getMonthlyReport, downloadMonthlyExcel,
} from '../../api/reports';
import { DatePicker } from '../../components/DatePicker';
import { Spinner } from '../../components/Spinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { AlertDialog } from '../../components/AlertDialog';

type ReportMode = 'daily' | 'weekly' | 'monthly';

function fmt(val: string | number) {
  return `₹${parseFloat(String(val)).toFixed(2)}`;
}
function fmtHours(h: number) {
  return `${h.toFixed(2)}h`;
}

// Monday of the week containing a date
function getWeekStart(date: Date): string {
  const d = new Date(date);
  const diff = d.getDay() === 0 ? -6 : 1 - d.getDay();
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

// "YYYY-MM" of a date
function getMonth(date: Date): string {
  return date.toISOString().slice(0, 7);
}

const TYPE_COLORS: Record<string, string> = {
  pool: 'text-cyan-400', snooker: 'text-purple-400', ps5: 'text-violet-400',
};

export function Reports() {
  const [mode, setMode] = useState<ReportMode>('daily');
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');

  // Daily
  const [dailyDate, setDailyDate] = useState<Date>(new Date());

  // Weekly
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));

  // Monthly
  const [month, setMonth] = useState(() => getMonth(new Date()));

  const loadReport = useCallback(async () => {
    setLoading(true); setError(''); setReport(null);
    try {
      if (mode === 'daily') {
        setReport(await getDailyReport(dailyDate.toISOString().slice(0, 10)));
      } else if (mode === 'weekly') {
        setReport(await getWeeklyReport(weekStart));
      } else {
        setReport(await getMonthlyReport(month));
      }
    } catch { setError('Failed to load report'); }
    finally { setLoading(false); }
  }, [mode, dailyDate, weekStart, month]);

  useEffect(() => { loadReport(); }, [loadReport]);

  async function handleDownload() {
    setDownloading(true);
    try {
      if (mode === 'daily')   await downloadDailyExcel(dailyDate.toISOString().slice(0, 10));
      if (mode === 'weekly')  await downloadWeeklyExcel(weekStart);
      if (mode === 'monthly') await downloadMonthlyExcel(month);
    } catch { setAlertMsg('Failed to download report'); }
    finally { setDownloading(false); }
  }

  // Weekly navigation
  function shiftWeek(dir: -1 | 1) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + dir * 7);
    setWeekStart(d.toISOString().slice(0, 10));
  }

  // Monthly navigation
  function shiftMonth(dir: -1 | 1) {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 1 + dir, 1);
    setMonth(getMonth(d));
  }

  const modeLabels: Record<ReportMode, string> = {
    daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly',
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-mono-game text-purple-600 tracking-widest mb-1">// ANALYTICS</p>
          <h1 className="font-orbitron font-black text-2xl text-white tracking-wide text-glow-purple">
            {modeLabels[mode].toUpperCase()} REPORT
          </h1>
          {report && (
            <p className="text-xs text-gray-500 mt-1 font-mono-game">{report.period_label}</p>
          )}
        </div>
        <button onClick={handleDownload} disabled={downloading || !report}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold tracking-widest uppercase
            bg-cyan-600/10 border border-cyan-600/40 text-cyan-400
            hover:bg-cyan-600/20 hover:text-cyan-200 disabled:opacity-30 transition-all">
          {downloading ? '// Exporting…' : '↓ Export Excel'}
        </button>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-0 mb-6 border border-purple-900/30 w-fit">
        {(['daily', 'weekly', 'monthly'] as ReportMode[]).map((m) => (
          <button key={m} onClick={() => setMode(m)}
            className={`px-5 py-2.5 text-xs font-bold tracking-widest uppercase transition-all ${
              mode === m
                ? 'bg-purple-600/30 text-purple-200 border-r border-purple-700/40'
                : 'text-gray-600 hover:text-purple-400 hover:bg-purple-900/10 border-r border-purple-900/20 last:border-r-0'
            }`}>
            {modeLabels[m]}
          </button>
        ))}
      </div>

      {/* Period selector */}
      <div className="bg-[#0d0d1a] border border-purple-900/30 p-4 mb-6 flex items-center gap-4">

        {/* Daily — date picker */}
        {mode === 'daily' && (
          <>
            <button onClick={() => { const d = new Date(dailyDate); d.setDate(d.getDate() - 1); setDailyDate(d); }}
              className="px-3 py-1.5 text-xs font-bold tracking-widest border border-gray-700/50 text-gray-500 hover:text-purple-400 hover:border-purple-700/50 transition-colors">
              ← Prev
            </button>
            <div className="flex-1 flex justify-center">
              <div style={{ width: '180px' }}>
                <DatePicker value={dailyDate} onChange={(d) => d && setDailyDate(d)} placeholder="Pick a date…" />
              </div>
            </div>
            <button onClick={() => { const d = new Date(dailyDate); d.setDate(d.getDate() + 1); setDailyDate(d); }}
              className="px-3 py-1.5 text-xs font-bold tracking-widest border border-gray-700/50 text-gray-500 hover:text-purple-400 hover:border-purple-700/50 transition-colors">
              Next →
            </button>
          </>
        )}

        {/* Weekly — prev/next */}
        {mode === 'weekly' && (
          <>
            <button onClick={() => shiftWeek(-1)}
              className="px-3 py-1.5 text-xs font-bold tracking-widest border border-gray-700/50 text-gray-500 hover:text-purple-400 hover:border-purple-700/50 transition-colors">
              ← Prev
            </button>
            <div className="flex-1 text-center">
              <p className="font-orbitron text-sm text-white tracking-widest">
                {report ? report.period_label : weekStart}
              </p>
              <p className="text-xs text-purple-700 font-mono-game mt-0.5 tracking-wider">Mon — Sun</p>
            </div>
            <button onClick={() => shiftWeek(1)}
              className="px-3 py-1.5 text-xs font-bold tracking-widest border border-gray-700/50 text-gray-500 hover:text-purple-400 hover:border-purple-700/50 transition-colors">
              Next →
            </button>
          </>
        )}

        {/* Monthly — prev/next */}
        {mode === 'monthly' && (
          <>
            <button onClick={() => shiftMonth(-1)}
              className="px-3 py-1.5 text-xs font-bold tracking-widest border border-gray-700/50 text-gray-500 hover:text-purple-400 hover:border-purple-700/50 transition-colors">
              ← Prev
            </button>
            <div className="flex-1 text-center">
              <p className="font-orbitron text-sm text-white tracking-widest">
                {report
                  ? report.period_label
                  : new Date(month + '-01').toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </p>
              <p className="text-xs text-purple-700 font-mono-game mt-0.5 tracking-wider">Full Month</p>
            </div>
            <button onClick={() => shiftMonth(1)}
              className="px-3 py-1.5 text-xs font-bold tracking-widest border border-gray-700/50 text-gray-500 hover:text-purple-400 hover:border-purple-700/50 transition-colors">
              Next →
            </button>
          </>
        )}

        <button onClick={loadReport} disabled={loading}
          className="px-3 py-1.5 text-xs font-bold tracking-widest border border-purple-800/40 text-purple-700 hover:text-purple-400 transition-colors">
          ↺
        </button>
      </div>

      {/* Report content */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : error ? (
        <ErrorMessage message={error} onRetry={loadReport} />
      ) : !report ? null : (
        <div className="flex flex-col gap-6">

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { label: 'Net Revenue',    value: fmt(report.summary.total_revenue),   highlight: true },
              { label: 'Sessions',       value: String(report.summary.total_sessions) },
              { label: 'Billable Hours', value: fmtHours(report.summary.total_hours) },
              { label: 'Table Revenue',  value: fmt(report.summary.table_revenue) },
              { label: 'Orders Revenue', value: fmt(report.summary.orders_revenue) },
              { label: 'Discounts',      value: fmt(report.summary.total_discounts) },
              { label: 'Pay-As-You-Go',  value: String(report.summary.payg_count) },
              { label: 'Fixed Slot',     value: String(report.summary.fixed_count) },
              { label: 'Pre-Booking',    value: String(report.summary.prebook_count) },
              { label: 'Total Minutes',  value: `${report.summary.total_minutes}m` },
            ].map(({ label, value, highlight }) => (
              <div key={label} className={`bg-[#0d0d1a] border p-4 ${highlight ? 'border-cyan-700/50 glow-cyan' : 'border-purple-900/30'}`}>
                <p className="font-orbitron text-xs text-purple-700 tracking-widest mb-2 uppercase">{label}</p>
                <p className={`font-mono-game font-black text-xl ${highlight ? 'text-cyan-400' : 'text-gray-200'}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Payment breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#0d0d1a] border border-emerald-800/40 p-4">
              <p className="font-orbitron text-xs text-emerald-800 tracking-widest mb-2 uppercase">💵 Cash Sessions</p>
              <p className="font-mono-game font-black text-xl text-emerald-400">{report.summary.cash_count ?? 0}</p>
            </div>
            <div className="bg-[#0d0d1a] border border-emerald-800/40 p-4">
              <p className="font-orbitron text-xs text-emerald-800 tracking-widest mb-2 uppercase">💵 Cash Revenue</p>
              <p className="font-mono-game font-black text-xl text-emerald-400">{fmt(report.summary.cash_revenue ?? '0')}</p>
            </div>
            <div className="bg-[#0d0d1a] border border-cyan-800/40 p-4">
              <p className="font-orbitron text-xs text-cyan-800 tracking-widest mb-2 uppercase">📱 Online Sessions</p>
              <p className="font-mono-game font-black text-xl text-cyan-400">{report.summary.online_count ?? 0}</p>
            </div>
            <div className="bg-[#0d0d1a] border border-cyan-800/40 p-4">
              <p className="font-orbitron text-xs text-cyan-800 tracking-widest mb-2 uppercase">📱 Online Revenue</p>
              <p className="font-mono-game font-black text-xl text-cyan-400">{fmt(report.summary.online_revenue ?? '0')}</p>
            </div>
            {(report.summary.split_count ?? 0) > 0 && (
              <div className="bg-[#0d0d1a] border border-purple-800/40 p-4">
                <p className="font-orbitron text-xs text-purple-800 tracking-widest mb-2 uppercase">🔁 Split Sessions</p>
                <p className="font-mono-game font-black text-xl text-purple-400">{report.summary.split_count}</p>
              </div>
            )}
          </div>

          {/* Table breakdown */}
          {report.table_breakdown.length > 0 && (
            <div className="border border-purple-900/30 bg-[#0d0d1a] overflow-hidden">
              <div className="h-[1px] bg-gradient-to-r from-purple-800 via-purple-500 to-cyan-600" />
              <div className="px-5 py-3 border-b border-purple-900/20">
                <p className="font-orbitron text-xs text-purple-600 tracking-widest uppercase">Table Breakdown</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#0a0a12] border-b border-purple-900/20">
                      {['Table', 'Type', 'Sessions', 'Hours', 'Revenue'].map((h, i) => (
                        <th key={i} className={`px-5 py-3 font-orbitron text-xs text-purple-600 tracking-widest uppercase ${i >= 2 ? 'text-right' : 'text-left'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {report.table_breakdown.map((row, idx) => (
                      <tr key={idx} className={`border-b border-purple-900/10 hover:bg-purple-900/10 transition-colors ${idx % 2 === 0 ? '' : 'bg-[#0a0a12]/40'}`}>
                        <td className="px-5 py-3 font-semibold text-gray-200">{row.table_name}</td>
                        <td className={`px-5 py-3 text-xs font-semibold uppercase tracking-widest ${TYPE_COLORS[row.table_type] ?? 'text-gray-400'}`}>{row.table_type}</td>
                        <td className="px-5 py-3 text-right font-mono-game text-gray-400">{row.sessions}</td>
                        <td className="px-5 py-3 text-right font-mono-game text-gray-400">{fmtHours(row.total_hours)}</td>
                        <td className="px-5 py-3 text-right font-mono-game font-bold text-cyan-400">{fmt(row.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Top items */}
          {report.top_items.length > 0 && (
            <div className="border border-purple-900/30 bg-[#0d0d1a] overflow-hidden">
              <div className="h-[1px] bg-gradient-to-r from-purple-800 via-purple-500 to-cyan-600" />
              <div className="px-5 py-3 border-b border-purple-900/20">
                <p className="font-orbitron text-xs text-purple-600 tracking-widest uppercase">Top Selling Items</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#0a0a12] border-b border-purple-900/20">
                      {['Item', 'Qty Sold', 'Revenue'].map((h, i) => (
                        <th key={i} className={`px-5 py-3 font-orbitron text-xs text-purple-600 tracking-widest uppercase ${i > 0 ? 'text-right' : 'text-left'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {report.top_items.map((item, idx) => (
                      <tr key={idx} className={`border-b border-purple-900/10 hover:bg-purple-900/10 transition-colors ${idx % 2 === 0 ? '' : 'bg-[#0a0a12]/40'}`}>
                        <td className="px-5 py-3 font-semibold text-gray-200">{item.item_name}</td>
                        <td className="px-5 py-3 text-right font-mono-game text-amber-400">{item.total_qty}</td>
                        <td className="px-5 py-3 text-right font-mono-game font-bold text-cyan-400">{fmt(item.total_revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Session log */}
          {report.sessions.length > 0 && (
            <div className="border border-purple-900/30 bg-[#0d0d1a] overflow-hidden">
              <div className="h-[1px] bg-gradient-to-r from-purple-800 via-purple-500 to-cyan-600" />
              <div className="px-5 py-3 border-b border-purple-900/20 flex justify-between items-center">
                <p className="font-orbitron text-xs text-purple-600 tracking-widest uppercase">Session Log</p>
                <p className="font-mono-game text-xs text-gray-700">{report.sessions.length} sessions</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#0a0a12] border-b border-purple-900/20">
                      {['#', 'Customer', 'Table', 'Start', 'Dur.', 'Type', 'Payment', 'Gross', 'Disc.', 'Net'].map((h, i) => (
                        <th key={i} className={`px-3 py-3 font-orbitron text-xs text-purple-600 tracking-widest uppercase ${i >= 4 ? 'text-right' : 'text-left'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {report.sessions.map((s, idx) => (
                      <tr key={s.session_id} className={`border-b border-purple-900/10 hover:bg-purple-900/10 transition-colors ${idx % 2 === 0 ? '' : 'bg-[#0a0a12]/40'}`}>
                        <td className="px-3 py-2 font-mono-game text-purple-800 text-xs">#{s.session_id}</td>
                        <td className="px-3 py-2 text-gray-300 text-xs">{s.customer_name ?? '—'}</td>
                        <td className="px-3 py-2 text-gray-400 text-xs">{s.table_name}</td>
                        <td className="px-3 py-2 font-mono-game text-gray-600 text-xs">
                          {new Date(s.start_time).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="px-3 py-2 text-right font-mono-game text-gray-500 text-xs">{s.duration_min ?? '—'}m</td>
                        <td className="px-3 py-2 text-right font-mono-game text-gray-600 text-xs uppercase">
                          {s.booking_type === 'pay_as_you_go' ? 'PAYG' : s.booking_type === 'fixed_slot' ? 'Fixed' : 'Pre'}
                        </td>
                        <td className="px-3 py-2 text-right font-mono-game text-xs">
                          {s.payment_method === 'cash'
                            ? <span className="text-emerald-600">💵</span>
                            : s.payment_method === 'online'
                            ? <span className="text-cyan-600">📱</span>
                            : <span className="text-gray-700">—</span>}
                        </td>
                        <td className="px-3 py-2 text-right font-mono-game text-gray-400 text-xs">
                          {s.total_amount ? fmt(s.total_amount) : '—'}
                        </td>
                        <td className="px-3 py-2 text-right font-mono-game text-emerald-800 text-xs">
                          {s.discount_amount && parseFloat(s.discount_amount) > 0 ? `-${fmt(s.discount_amount)}` : '—'}
                        </td>
                        <td className="px-3 py-2 text-right font-mono-game font-bold text-cyan-400 text-xs">
                          {s.net_amount ? fmt(s.net_amount) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      <AlertDialog open={!!alertMsg} message={alertMsg} onClose={() => setAlertMsg('')} />
    </div>
  );
}
