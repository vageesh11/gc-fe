import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { InventoryItem } from '../../types';
import {
  getInventory, createInventoryItem, updateInventoryItem, deleteInventoryItem,
} from '../../api/inventory';
import { Modal } from '../../components/Modal';
import { Spinner } from '../../components/Spinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { Badge } from '../../components/Badge';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { AlertDialog } from '../../components/AlertDialog';

import { useAuth } from '../../hooks/useAuth';

const PAGE_LIMIT = 20;

type ModalMode = 'add' | 'edit' | 'restock' | null;
interface FormState { name: string; price: string; stock_quantity: string; }
const EMPTY_FORM: FormState = { name: '', price: '', stock_quantity: '' };

export function Inventory() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [hasNext, setHasNext] = useState(false);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editTarget, setEditTarget] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<InventoryItem | null>(null);
  const [alertMsg, setAlertMsg] = useState('');

  const loadInitial = useCallback(async () => {
    setLoading(true); setError(''); setPage(1);
    try {
      const res = await getInventory({ page: 1, limit: PAGE_LIMIT, search: search || undefined });
      setItems(res.data);
      setHasNext(res.pagination.has_next);
    } catch { setError('Failed to load inventory'); }
    finally { setLoading(false); }
  }, [search]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasNext) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const res = await getInventory({ page: nextPage, limit: PAGE_LIMIT, search: search || undefined });
      setItems((prev) => [...prev, ...res.data]);
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

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
  }

  function openAdd() { setForm(EMPTY_FORM); setFormError(''); setEditTarget(null); setModalMode('add'); }
  function openEdit(item: InventoryItem) {
    setForm({ name: item.name, price: item.price, stock_quantity: String(item.stock_quantity) });
    setFormError(''); setEditTarget(item); setModalMode('edit');
  }
  function openRestock(item: InventoryItem) {
    setForm({ ...EMPTY_FORM, stock_quantity: String(item.stock_quantity) });
    setFormError(''); setEditTarget(item); setModalMode('restock');
  }
  function closeModal() { setModalMode(null); setEditTarget(null); }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteInventoryItem(deleteTarget.id);
      loadInitial();
    } catch (err: any) {
      setAlertMsg(err?.response?.data?.message ?? 'Failed to delete item');
    } finally { setDeleteTarget(null); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setFormError(''); setSubmitting(true);
    try {
      if (modalMode === 'add') {
        await createInventoryItem({ name: form.name, price: parseFloat(form.price), stock_quantity: parseInt(form.stock_quantity, 10) });
      } else if (modalMode === 'edit' && editTarget) {
        await updateInventoryItem(editTarget.id, { name: form.name, price: parseFloat(form.price) });
      } else if (modalMode === 'restock' && editTarget) {
        await updateInventoryItem(editTarget.id, { stock_quantity: parseInt(form.stock_quantity, 10) });
      }
      closeModal();
      loadInitial();
    } catch (err: any) { setFormError(err?.response?.data?.message ?? 'Operation failed'); }
    finally { setSubmitting(false); }
  }

  const modalTitle =
    modalMode === 'add' ? 'Add Item' :
    modalMode === 'edit' ? `Edit — ${editTarget?.name}` :
    modalMode === 'restock' ? `Restock — ${editTarget?.name}` : '';

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-mono-game text-purple-600 tracking-widest mb-1">// STOCK CONTROL</p>
          <h1 className="font-orbitron font-black text-2xl text-white tracking-wide text-glow-purple">INVENTORY</h1>
          <p className="text-xs text-gray-600 mt-1 tracking-wider font-mono-game">
            {'Snacks & drinks management'}
          </p>
        </div>
        {isAdmin && (
          <button onClick={openAdd}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold tracking-widest uppercase
              bg-purple-600/20 border border-purple-500/60 text-purple-300
              hover:bg-purple-600/40 hover:text-white transition-all duration-200 glow-purple">
            + Add Item
          </button>
        )}
      </div>

      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="mb-5 flex gap-2">
        <input type="text" placeholder="Search inventory…" value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)} className="game-input" style={{ width: '18rem' }} />
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

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : error ? (
        <ErrorMessage message={error} onRetry={loadInitial} />
      ) : (
        <div className="border border-purple-900/30 bg-[#0d0d1a] overflow-hidden">
          <div className="h-[1px] bg-gradient-to-r from-purple-800 via-purple-500 to-cyan-600" />
          {items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-3xl mb-3">🧃</p>
              <p className="font-orbitron text-gray-600 text-xs tracking-widest">NO ITEMS FOUND</p>
            </div>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#0a0a12] border-b border-purple-900/30">
                    <th className="text-left px-5 py-3 font-orbitron text-xs text-purple-600 tracking-widest uppercase">Name</th>
                    <th className="text-right px-5 py-3 font-orbitron text-xs text-purple-600 tracking-widest uppercase">Price</th>
                    <th className="text-right px-5 py-3 font-orbitron text-xs text-purple-600 tracking-widest uppercase">Stock</th>
                    {isAdmin && <th className="text-right px-5 py-3 font-orbitron text-xs text-purple-600 tracking-widest uppercase">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={item.id} className={`border-b border-purple-900/10 transition-colors hover:bg-purple-900/10 ${idx % 2 === 0 ? '' : 'bg-[#0a0a12]/40'}`}>
                      <td className="px-5 py-3 font-semibold text-gray-200 tracking-wide">{item.name}</td>
                      <td className="px-5 py-3 text-right font-mono-game text-cyan-400">₹{parseFloat(item.price).toFixed(2)}</td>
                      <td className="px-5 py-3 text-right">
                        <Badge variant={item.stock_quantity === 0 ? 'danger' : item.stock_quantity < 10 ? 'warning' : 'success'}>
                          {item.stock_quantity}
                        </Badge>
                      </td>
                      {isAdmin && (
                        <td className="px-5 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => openRestock(item)}
                              className="px-3 py-1 text-xs font-bold tracking-widest uppercase border border-cyan-700/40 text-cyan-600 hover:bg-cyan-900/20 hover:text-cyan-300 transition-colors">
                              Restock
                            </button>
                            <button onClick={() => openEdit(item)}
                              className="px-3 py-1 text-xs font-bold tracking-widest uppercase border border-purple-700/40 text-purple-600 hover:bg-purple-900/20 hover:text-purple-300 transition-colors">
                              Edit
                            </button>
                            <button onClick={() => setDeleteTarget(item)}
                              className="px-3 py-1 text-xs font-bold tracking-widest uppercase border border-red-800/40 text-red-700 hover:bg-red-900/20 hover:text-red-400 transition-colors">
                              Delete
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div ref={sentinelRef} className="flex justify-center py-4 border-t border-purple-900/20">
                {loadingMore && <Spinner size="sm" />}
                {!hasNext && items.length > 0 && (
                  <p className="text-xs text-gray-700 font-mono-game tracking-wider">— end of results —</p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Modals */}
      <Modal open={!!modalMode} onClose={closeModal} title={modalTitle}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {(modalMode === 'add' || modalMode === 'edit') && (
            <>
              <div>
                <label className="game-label">Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required maxLength={150} className="game-input" />
              </div>
              <div>
                <label className="game-label">Price (₹)</label>
                <input type="number" min="0" step="0.01" value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} required className="game-input" />
              </div>
            </>
          )}
          {(modalMode === 'add' || modalMode === 'restock') && (
            <div>
              <label className="game-label">{modalMode === 'restock' ? 'New stock quantity' : 'Stock quantity'}</label>
              <input type="number" min="0" step="1" value={form.stock_quantity}
                onChange={(e) => setForm((f) => ({ ...f, stock_quantity: e.target.value }))} required className="game-input" />
            </div>
          )}
          {formError && (
            <p className="text-red-400 text-xs font-mono-game tracking-wide border border-red-800/40 bg-red-950/20 px-3 py-2">⚠ {formError}</p>
          )}
          <button type="submit" disabled={submitting} className="game-btn-primary">
            {submitting ? '// Saving…' : modalMode === 'add' ? '▶ Create Item' : '▶ Save Changes'}
          </button>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} title="Delete Item"
        message={`Permanently delete "${deleteTarget?.name}"? This cannot be undone.`}
        variant="danger" onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />
      <AlertDialog open={!!alertMsg} message={alertMsg} onClose={() => setAlertMsg('')} />
    </div>
  );
}
