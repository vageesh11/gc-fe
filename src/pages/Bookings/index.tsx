import React, { useCallback, useEffect, useState } from 'react';
import type { Booking, Customer, GamingTable } from '../../types';
import { getBookings, createBooking, confirmBooking, cancelBooking, type BookingFilters } from '../../api/bookings';
import { getCustomers } from '../../api/customers';
import { getTables } from '../../api/tables';
import { Modal } from '../../components/Modal';
import { Spinner } from '../../components/Spinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { Badge } from '../../components/Badge';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { AlertDialog } from '../../components/AlertDialog';

const PAGE_SIZE = 20;

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
}

function statusVariant(s: string): 'warning' | 'success' | 'danger' | 'neutral' | 'info' {
  if (s === 'pending') return 'warning';
  if (s === 'confirmed') return 'success';
  if (s === 'cancelled') return 'danger';
  return 'neutral';
}

export function Bookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tables, setTables] = useState<GamingTable[]>([]);
  const [createForm, setCreateForm] = useState({ customer_id: '', table_id: '', scheduled_start: '', booked_duration: '', notes: '' });
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  const [confirmTarget, setConfirmTarget] = useState<Booking | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [alertMsg, setAlertMsg] = useState('');

  const buildFilters = useCallback((): BookingFilters => {
    const f: BookingFilters = { limit: PAGE_SIZE, offset };
    if (statusFilter) f.status = statusFilter;
    if (dateFilter) f.date = dateFilter;
    return f;
  }, [statusFilter, dateFilter, offset]);

  const loadBookings = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await getBookings(buildFilters());
      setBookings((prev) => offset === 0 ? data : [...prev, ...data]);
      setHasMore(data.length === PAGE_SIZE);
    } catch { setError('Failed to load bookings'); }
    finally { setLoading(false); }
  }, [buildFilters, offset]);

  useEffect(() => { setOffset(0); }, [statusFilter, dateFilter]);
  useEffect(() => { loadBookings(); }, [loadBookings]);

  async function openCreate() {
    try {
      const [cr, tr] = await Promise.all([getCustomers({ limit: 100 }), getTables({ limit: 100 })]);
      const c = cr.data; const t = tr.data;
      setCustomers(c); setTables(t);
    } catch {}
    setCreateForm({ customer_id: '', table_id: '', scheduled_start: '', booked_duration: '', notes: '' });
    setCreateError('');
    setShowCreateModal(true);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setCreateError(''); setCreating(true);
    try {
      const b = await createBooking({
        customer_id: Number(createForm.customer_id),
        table_id: Number(createForm.table_id),
        scheduled_start: new Date(createForm.scheduled_start).toISOString(),
        booked_duration: parseInt(createForm.booked_duration),
        notes: createForm.notes || undefined,
      });
      setBookings((prev) => [b, ...prev]);
      setShowCreateModal(false);
    } catch (err: any) { setCreateError(err?.response?.data?.message ?? 'Failed to create booking'); }
    finally { setCreating(false); }
  }

  async function doConfirm() {
    if (!confirmTarget) return;
    try {
      await confirmBooking(confirmTarget.id);
      setBookings((prev) => prev.map((b) => b.id === confirmTarget.id ? { ...b, status: 'confirmed' as const } : b));
    } catch (err: any) { setAlertMsg(err?.response?.data?.message ?? 'Failed to confirm booking'); }
    finally { setConfirmTarget(null); }
  }

  async function doCancel() {
    if (!cancelTarget) return;
    try {
      await cancelBooking(cancelTarget.id);
      setBookings((prev) => prev.map((b) => b.id === cancelTarget.id ? { ...b, status: 'cancelled' as const } : b));
    } catch (err: any) { setAlertMsg(err?.response?.data?.message ?? 'Failed to cancel booking'); }
    finally { setCancelTarget(null); }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-mono-game text-purple-600 tracking-widest mb-1">// ADVANCE RESERVATIONS</p>
          <h1 className="font-orbitron font-black text-2xl text-white tracking-wide text-glow-purple">BOOKINGS</h1>
        </div>
        <button onClick={openCreate}
          className="px-5 py-2.5 text-sm font-bold tracking-widest uppercase bg-purple-600/20 border border-purple-500/60 text-purple-300 hover:bg-purple-600/40 hover:text-white transition-all glow-purple">
          + New Booking
        </button>
      </div>

      {/* Filters */}
      <div className="bg-[#0d0d1a] border border-purple-900/30 p-4 mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="game-label">Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="game-input" style={{ width: 'auto' }}>
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div>
          <label className="game-label">Date</label>
          <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="game-input" style={{ width: 'auto' }} />
        </div>
        {(statusFilter || dateFilter) && (
          <button onClick={() => { setStatusFilter(''); setDateFilter(''); }}
            className="px-3 py-2 text-xs font-bold tracking-widest uppercase border border-gray-700/40 text-gray-600 hover:text-gray-300 transition-colors">
            ✕ Clear
          </button>
        )}
      </div>

      {/* Table */}
      {loading && offset === 0 ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : error ? (
        <ErrorMessage message={error} onRetry={loadBookings} />
      ) : (
        <div className="border border-purple-900/30 bg-[#0d0d1a] overflow-hidden">
          <div className="h-[1px] bg-gradient-to-r from-purple-800 via-purple-500 to-cyan-600" />
          {bookings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-3xl mb-3">📅</p>
              <p className="font-orbitron text-gray-600 text-xs tracking-widest">NO BOOKINGS FOUND</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#0a0a12] border-b border-purple-900/30">
                      {['#', 'Customer', 'Table', 'Scheduled', 'Duration', 'Status', 'Actions'].map((h, i) => (
                        <th key={i} className={`px-4 py-3 font-orbitron text-xs text-purple-600 tracking-widest uppercase ${h === 'Actions' ? 'text-right' : 'text-left'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b, idx) => (
                      <tr key={b.id} className={`border-b border-purple-900/10 transition-colors hover:bg-purple-900/10 ${idx % 2 === 0 ? '' : 'bg-[#0a0a12]/40'}`}>
                        <td className="px-4 py-3 font-mono-game text-purple-800 text-xs">#{b.id}</td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-200 text-xs">{b.customer_name ?? `ID ${b.customer_id}`}</div>
                          <div className="text-xs text-gray-600 font-mono-game">{b.customer_phone ?? ''}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-300 text-xs">{b.table_name ?? `Table ${b.table_id}`}</div>
                          <div className="text-xs text-gray-600 capitalize font-mono-game">{b.table_type ?? ''}</div>
                        </td>
                        <td className="px-4 py-3 font-mono-game text-xs text-gray-500">{formatDate(b.scheduled_start)}</td>
                        <td className="px-4 py-3 font-mono-game text-xs text-amber-400">{b.booked_duration}m</td>
                        <td className="px-4 py-3"><Badge variant={statusVariant(b.status)}>{b.status}</Badge></td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            {b.status === 'pending' && (
                              <button onClick={() => setConfirmTarget(b)}
                                className="px-3 py-1 text-xs font-bold tracking-widest uppercase border border-cyan-700/40 text-cyan-600 hover:bg-cyan-900/20 hover:text-cyan-300 transition-colors">
                                Confirm
                              </button>
                            )}
                            {(b.status === 'pending' || b.status === 'confirmed') && (
                              <button onClick={() => setCancelTarget(b)}
                                className="px-3 py-1 text-xs font-bold tracking-widest uppercase border border-red-800/40 text-red-700 hover:bg-red-900/20 hover:text-red-400 transition-colors">
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {hasMore && (
                <div className="flex justify-center py-4 border-t border-purple-900/20">
                  <button onClick={() => setOffset((o) => o + PAGE_SIZE)} disabled={loading}
                    className="px-6 py-2 text-xs font-bold tracking-widest uppercase border border-purple-800/40 text-purple-600 hover:bg-purple-900/20 hover:text-purple-300 disabled:opacity-30 transition-colors">
                    {loading ? <Spinner size="sm" /> : '▼ Load More'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Create Booking Modal */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="New Advance Booking">
        <form onSubmit={handleCreate} className="flex flex-col gap-5">
          <div>
            <label className="game-label">Customer</label>
            <select value={createForm.customer_id} onChange={(e) => setCreateForm((f) => ({ ...f, customer_id: e.target.value }))} required className="game-input">
              <option value="">— Select customer —</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
            </select>
          </div>
          <div>
            <label className="game-label">Table</label>
            <select value={createForm.table_id} onChange={(e) => setCreateForm((f) => ({ ...f, table_id: e.target.value }))} required className="game-input">
              <option value="">— Select table —</option>
              {tables.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.type})</option>)}
            </select>
          </div>
          <div>
            <label className="game-label">Scheduled Start</label>
            <input type="datetime-local" value={createForm.scheduled_start} onChange={(e) => setCreateForm((f) => ({ ...f, scheduled_start: e.target.value }))} required className="game-input" />
          </div>
          <div>
            <label className="game-label">Duration (minutes)</label>
            <input type="number" min="1" value={createForm.booked_duration} onChange={(e) => setCreateForm((f) => ({ ...f, booked_duration: e.target.value }))} required className="game-input" placeholder="e.g. 60" />
          </div>
          <div>
            <label className="game-label">Notes (optional)</label>
            <input type="text" maxLength={500} value={createForm.notes} onChange={(e) => setCreateForm((f) => ({ ...f, notes: e.target.value }))} className="game-input" placeholder="e.g. Birthday party" />
          </div>
          {createError && <p className="text-red-400 text-xs font-mono-game border border-red-800/40 bg-red-950/20 px-3 py-2">⚠ {createError}</p>}
          <button type="submit" disabled={creating} className="game-btn-primary">{creating ? '// Creating…' : '▶ Create Booking'}</button>
        </form>
      </Modal>

      <ConfirmDialog open={!!confirmTarget} title="Confirm Booking"
        message={`Confirm booking #${confirmTarget?.id} for ${confirmTarget?.customer_name}? This will start a live session on ${confirmTarget?.table_name}.`}
        variant="info" confirmLabel="Confirm & Start Session"
        onConfirm={doConfirm} onCancel={() => setConfirmTarget(null)} />

      <ConfirmDialog open={!!cancelTarget} title="Cancel Booking"
        message={`Cancel booking #${cancelTarget?.id} for ${cancelTarget?.customer_name}?`}
        variant="danger" confirmLabel="Cancel Booking"
        onConfirm={doCancel} onCancel={() => setCancelTarget(null)} />

      <AlertDialog open={!!alertMsg} message={alertMsg} onClose={() => setAlertMsg('')} />
    </div>
  );
}
