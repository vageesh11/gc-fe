import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { Customer, CustomerSession } from '../../types';
import { getCustomers, getCustomerSessions, updateCustomer } from '../../api/customers';
import { Modal } from '../../components/Modal';
import { Spinner } from '../../components/Spinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { Badge } from '../../components/Badge';
import { useAuth } from '../../hooks/useAuth';

const PAGE_LIMIT = 20;

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
}

export function Customers() {
  const { isAdmin } = useAuth();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [hasNext, setHasNext] = useState(false);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [historyTarget, setHistoryTarget] = useState<Customer | null>(null);
  const [history, setHistory] = useState<CustomerSession[]>([]);
  const [historyHasNext, setHistoryHasNext] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLoadingMore, setHistoryLoadingMore] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const historySentinelRef = useRef<HTMLDivElement | null>(null);

  // Edit modal state
  const [editTarget, setEditTarget] = useState<Customer | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');

  const loadInitial = useCallback(async () => {
    setLoading(true); setError(''); setPage(1);
    try {
      const res = await getCustomers({ page: 1, limit: PAGE_LIMIT, search: search || undefined });
      setCustomers(res.data);
      setHasNext(res.pagination.has_next);
    } catch { setError('Failed to load customers'); }
    finally { setLoading(false); }
  }, [search]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasNext) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const res = await getCustomers({ page: nextPage, limit: PAGE_LIMIT, search: search || undefined });
      setCustomers((prev) => [...prev, ...res.data]);
      setPage(nextPage);
      setHasNext(res.pagination.has_next);
    } catch {}
    finally { setLoadingMore(false); }
  }, [loadingMore, hasNext, page, search]);

  useEffect(() => { loadInitial(); }, [loadInitial]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const obs = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { rootMargin: '200px' }
    );
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [loadMore]);

  async function openHistory(c: Customer) {
    setHistoryTarget(c);
    setHistoryPage(1);
    setHistoryHasNext(false);
    setLoadingHistory(true);
    try {
      const res = await getCustomerSessions(c.id, { page: 1, limit: 10 });
      setHistory(res.data);
      setHistoryHasNext(res.pagination.has_next);
    } catch { setHistory([]); }
    finally { setLoadingHistory(false); }
  }

  async function loadMoreHistory() {
    if (!historyTarget || historyLoadingMore || !historyHasNext) return;
    setHistoryLoadingMore(true);
    const nextPage = historyPage + 1;
    try {
      const res = await getCustomerSessions(historyTarget.id, { page: nextPage, limit: 10 });
      setHistory((prev) => [...prev, ...res.data]);
      setHistoryPage(nextPage);
      setHistoryHasNext(res.pagination.has_next);
    } catch {}
    finally { setHistoryLoadingMore(false); }
  }

  function openEdit(c: Customer) {
    setEditTarget(c);
    setEditName(c.name);
    setEditPhone(c.phone);
    setEditError('');
  }

  function closeEdit() {
    setEditTarget(null);
    setEditName('');
    setEditPhone('');
    setEditError('');
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    setEditError(''); setEditSubmitting(true);
    try {
      const updated = await updateCustomer(editTarget.id, { name: editName, phone: editPhone });
      setCustomers((prev) => prev.map((c) => c.id === updated.id ? updated : c));
      closeEdit();
    } catch (err: any) {
      setEditError(err?.response?.data?.message ?? 'Failed to update customer');
    } finally {
      setEditSubmitting(false);
    }
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-mono-game text-purple-600 tracking-widest mb-1">// PLAYER DATABASE</p>
        <h1 className="font-orbitron font-black text-2xl text-white tracking-wide text-glow-purple">CUSTOMERS</h1>
        <p className="text-xs text-gray-600 mt-1 tracking-wider font-mono-game">
          {'Registered players'}
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="mb-5 flex gap-2">
        <input type="text" placeholder="Search by name or phone…" value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)} className="game-input" style={{ width: '20rem' }} />
        <button type="submit"
          className="px-4 py-2 text-xs font-bold tracking-widest uppercase border border-purple-700/40 text-purple-500 hover:text-purple-300 hover:border-purple-500/60 transition-colors">
          Search
        </button>
        {search && (
          <button type="button" onClick={() => { setSearch(''); setSearchInput(''); }}
            className="px-3 py-2 text-xs font-bold tracking-widest uppercase border border-gray-700/40 text-gray-600 hover:text-gray-300 transition-colors">
            ✕
          </button>
        )}
      </form>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : error ? (
        <ErrorMessage message={error} onRetry={loadInitial} />
      ) : (
        <div className="border border-purple-900/30 bg-[#0d0d1a] overflow-hidden">
          <div className="h-[1px] bg-gradient-to-r from-purple-800 via-purple-500 to-cyan-600" />
          {customers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-3xl mb-3">👤</p>
              <p className="font-orbitron text-gray-600 text-xs tracking-widest">NO CUSTOMERS FOUND</p>
            </div>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#0a0a12] border-b border-purple-900/30">
                    {['#', 'Name', 'Phone', 'Since', ''].map((h, i) => (
                      <th key={i} className={`px-5 py-3 font-orbitron text-xs text-purple-600 tracking-widest uppercase ${h === '' ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c, idx) => (
                    <tr key={c.id} className={`border-b border-purple-900/10 hover:bg-purple-900/10 transition-colors ${idx % 2 === 0 ? '' : 'bg-[#0a0a12]/40'}`}>
                      <td className="px-5 py-3 font-mono-game text-purple-800 text-xs">#{c.id}</td>
                      <td className="px-5 py-3 font-semibold text-gray-200">{c.name}</td>
                      <td className="px-5 py-3 font-mono-game text-cyan-600 text-xs">{c.phone}</td>
                      <td className="px-5 py-3 font-mono-game text-gray-600 text-xs">{formatDate(c.created_at)}</td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isAdmin && (
                            <button onClick={() => openEdit(c)}
                              className="px-3 py-1 text-xs font-bold tracking-widest uppercase border border-cyan-800/40 text-cyan-700 hover:bg-cyan-900/20 hover:text-cyan-400 transition-colors">
                              Edit
                            </button>
                          )}
                          <button onClick={() => openHistory(c)}
                            className="px-3 py-1 text-xs font-bold tracking-widest uppercase border border-purple-700/40 text-purple-600 hover:bg-purple-900/20 hover:text-purple-300 transition-colors">
                            History
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div ref={sentinelRef} className="flex justify-center py-4 border-t border-purple-900/20">
                {loadingMore && <Spinner size="sm" />}
                {!hasNext && customers.length > 0 && (
                  <p className="text-xs text-gray-700 font-mono-game tracking-wider">— end of results —</p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Edit Customer Modal (admin only) */}
      <Modal open={!!editTarget} onClose={closeEdit} title={`Edit Customer — #${editTarget?.id}`}>
        <form onSubmit={handleEditSubmit} className="flex flex-col gap-5">
          <div>
            <label className="game-label">Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required maxLength={150}
              placeholder="Customer name"
              className="game-input"
            />
          </div>
          <div>
            <label className="game-label">Phone (10 digits)</label>
            <input
              type="text"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              required pattern="[6-9][0-9]{9}"
              placeholder="9876543210"
              className="game-input"
            />
          </div>

          {editError && (
            <div className="border border-red-800/40 bg-red-950/20 px-3 py-2 flex items-center gap-2">
              <span className="text-red-400">⚠</span>
              <p className="text-red-400 text-xs font-mono-game tracking-wide">{editError}</p>
            </div>
          )}

          <button type="submit" disabled={editSubmitting} className="game-btn-primary">
            {editSubmitting ? '// Saving…' : '▶ Save Changes'}
          </button>
        </form>
      </Modal>

      {/* Session History Modal */}
      <Modal open={!!historyTarget} onClose={() => { setHistoryTarget(null); setHistory([]); }} title={`Session History — ${historyTarget?.name}`}>
        {loadingHistory ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : history.length === 0 ? (
          <p className="text-gray-600 text-sm text-center py-6 font-mono-game tracking-wider">NO SESSIONS YET</p>
        ) : (
          <div className="flex flex-col gap-2">
            {history.map((s) => (
              <div key={s.id} className="bg-[#07070f] border border-purple-900/30 px-4 py-3 text-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-semibold text-gray-200">{s.table_name}</span>
                    <span className="text-gray-600 text-xs ml-2 capitalize font-mono-game">{s.table_type}</span>
                  </div>
                  <Badge variant={s.status === 'ended' ? 'neutral' : s.status === 'active' ? 'warning' : 'info'}>
                    {s.status}
                  </Badge>
                </div>
                <div className="flex justify-between mt-2 text-xs font-mono-game text-gray-600">
                  <span>{new Date(s.start_time).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}</span>
                  {s.net_amount && <span className="text-cyan-500 font-bold">₹{parseFloat(s.net_amount).toFixed(2)}</span>}
                </div>
              </div>
            ))}
            <div ref={historySentinelRef} className="flex justify-center py-2">
              {historyLoadingMore && <Spinner size="sm" />}
              {!historyHasNext && history.length > 0 && (
                <p className="text-xs text-gray-700 font-mono-game">— end —</p>
              )}
              {historyHasNext && !historyLoadingMore && (
                <button onClick={loadMoreHistory}
                  className="text-xs text-purple-700 hover:text-purple-400 font-mono-game tracking-wider transition-colors">
                  Load more
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
