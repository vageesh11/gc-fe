import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { Discount, DiscountScope, TableType } from '../../types';
import {
  getDiscounts, createDiscount, updateDiscount, deleteDiscount,
} from '../../api/discounts';
import { Modal } from '../../components/Modal';
import { Spinner } from '../../components/Spinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { Badge } from '../../components/Badge';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { AlertDialog } from '../../components/AlertDialog';


type ModalMode = 'add' | 'edit' | null;

const ALL_TABLE_TYPES: TableType[] = ['pool', 'snooker', 'ps5'];

interface FormState {
  name: string;
  code: string;
  discount_type: 'percentage' | 'flat';
  discount_value: string;
  scope: DiscountScope;
  applicable_table_types: TableType[];
}

const EMPTY_FORM: FormState = {
  name: '', code: '', discount_type: 'percentage', discount_value: '',
  scope: 'session', applicable_table_types: [],
};

export function Discounts() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [hasNext, setHasNext] = useState(false);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editTarget, setEditTarget] = useState<Discount | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Discount | null>(null);
  const [alertMsg, setAlertMsg] = useState('');

  const loadInitial = useCallback(async () => {
    setLoading(true); setError(''); setPage(1);
    try {
      const res = await getDiscounts({ page: 1, limit: 20, include_inactive: showInactive || undefined });
      setDiscounts(res.data);
      setHasNext(res.pagination.has_next);
    } catch { setError('Failed to load discounts'); }
    finally { setLoading(false); }
  }, [showInactive]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasNext) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const res = await getDiscounts({ page: nextPage, limit: 20, include_inactive: showInactive || undefined });
      setDiscounts((prev) => [...prev, ...res.data]);
      setPage(nextPage);
      setHasNext(res.pagination.has_next);
    } catch {}
    finally { setLoadingMore(false); }
  }, [loadingMore, hasNext, page, showInactive]);

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

  function openAdd() {
    setForm(EMPTY_FORM); setFormError(''); setEditTarget(null); setModalMode('add');
  }

  function openEdit(d: Discount) {
    setForm({
      name: d.name,
      code: d.code ?? '',
      discount_type: d.discount_type,
      discount_value: parseFloat(d.discount_value).toString(),
      scope: d.scope,
      applicable_table_types: d.applicable_table_types ?? [],
    });
    setFormError(''); setEditTarget(d); setModalMode('edit');
  }

  async function toggleActive(d: Discount) {
    try {
      const updated = await updateDiscount(d.id, { is_active: !d.is_active });
      setDiscounts((prev) => prev.map((x) => x.id === updated.id ? updated : x));
    } catch (err: any) {
      setAlertMsg(err?.response?.data?.message ?? 'Failed to update');
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteDiscount(deleteTarget.id);
      loadInitial();
    } catch (err: any) {
      setAlertMsg(err?.response?.data?.message ?? 'Failed to delete');
    } finally { setDeleteTarget(null); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setFormError(''); setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        code: form.code.trim().toUpperCase() || undefined,
        discount_type: form.discount_type,
        discount_value: parseFloat(form.discount_value),
        scope: form.scope,
        applicable_table_types: form.applicable_table_types.length > 0 ? form.applicable_table_types : null,
      };
      if (modalMode === 'add') {
        await createDiscount(payload);
      } else if (modalMode === 'edit' && editTarget) {
        await updateDiscount(editTarget.id, payload);
      }
      loadInitial();
      setModalMode(null);
    } catch (err: any) {
      setFormError(err?.response?.data?.message ?? 'Operation failed');
    } finally { setSubmitting(false); }
  }

  const scopeLabel = (s: DiscountScope) =>
    s === 'session' ? 'Table only' : s === 'order' ? 'Snacks only' : 'Table + Snacks';

  const modalTitle = modalMode === 'add' ? 'Create Discount' : `Edit — ${editTarget?.name}`;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-mono-game text-purple-600 tracking-widest mb-1">// PROMO ENGINE</p>
          <h1 className="font-orbitron font-black text-2xl text-white tracking-wide text-glow-purple">DISCOUNTS</h1>
          <p className="text-xs text-gray-600 mt-1 tracking-wider font-mono-game">Named discount codes &amp; offers</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)}
              className="accent-purple-500 w-3.5 h-3.5" />
            <span className="text-xs text-gray-500 font-mono-game tracking-wider">Show inactive</span>
          </label>
          <button onClick={openAdd}
            className="px-5 py-2.5 text-sm font-bold tracking-widest uppercase bg-purple-600/20 border border-purple-500/60 text-purple-300 hover:bg-purple-600/40 hover:text-white transition-all glow-purple">
            + New Discount
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : error ? (
        <ErrorMessage message={error} onRetry={loadInitial} />
      ) : (
        <div className="border border-purple-900/30 bg-[#0d0d1a] overflow-hidden">
          <div className="h-[1px] bg-gradient-to-r from-purple-800 via-purple-500 to-cyan-600" />
          {discounts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-3xl mb-3">🏷️</p>
              <p className="font-orbitron text-gray-600 text-xs tracking-widest">NO DISCOUNTS CONFIGURED</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#0a0a12] border-b border-purple-900/30">
                    {['#', 'Name', 'Code', 'Type', 'Value', 'Scope', 'Status', 'Actions'].map((h, i) => (
                      <th key={i} className={`px-4 py-3 font-orbitron text-xs text-purple-600 tracking-widest uppercase ${h === 'Actions' || h === 'Value' ? 'text-right' : 'text-left'}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {discounts.map((d, idx) => (
                    <tr key={d.id} className={`border-b border-purple-900/10 transition-colors hover:bg-purple-900/10 ${idx % 2 === 0 ? '' : 'bg-[#0a0a12]/40'}`}>
                      <td className="px-4 py-3 font-mono-game text-purple-800 text-xs">#{d.id}</td>
                      <td className="px-4 py-3 font-semibold text-gray-200">{d.name}</td>
                      <td className="px-4 py-3">
                        {d.code
                          ? <span className="font-mono-game text-xs text-amber-400 border border-amber-800/40 bg-amber-900/10 px-2 py-0.5">{d.code}</span>
                          : <span className="text-gray-700 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 uppercase tracking-wider font-mono-game">{d.discount_type}</td>
                      <td className="px-4 py-3 text-right font-mono-game font-bold text-cyan-400">
                        {d.discount_type === 'percentage'
                          ? `${parseFloat(d.discount_value).toFixed(0)}%`
                          : `₹${parseFloat(d.discount_value).toFixed(2)}`}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 uppercase tracking-wider">{scopeLabel(d.scope)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={d.is_active ? 'success' : 'neutral'}>{d.is_active ? 'Active' : 'Inactive'}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => toggleActive(d)}
                            className={`px-2 py-1 text-xs font-bold tracking-widest uppercase border transition-colors ${
                              d.is_active
                                ? 'border-gray-700/40 text-gray-600 hover:border-red-800/40 hover:text-red-500'
                                : 'border-cyan-700/40 text-cyan-700 hover:bg-cyan-900/20 hover:text-cyan-300'
                            }`}>
                            {d.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button onClick={() => openEdit(d)}
                            className="px-2 py-1 text-xs font-bold tracking-widest uppercase border border-purple-700/40 text-purple-600 hover:bg-purple-900/20 hover:text-purple-300 transition-colors">
                            Edit
                          </button>
                          <button onClick={() => setDeleteTarget(d)}
                            className="px-2 py-1 text-xs font-bold tracking-widest uppercase border border-red-800/40 text-red-700 hover:bg-red-900/20 hover:text-red-400 transition-colors">
                            Del
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div ref={sentinelRef} className="flex justify-center py-4 border-t border-purple-900/20">
            {loadingMore && <Spinner size="sm" />}
            {!hasNext && discounts.length > 0 && (
              <p className="text-xs text-gray-700 font-mono-game tracking-wider">— end of results —</p>
            )}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={!!modalMode} onClose={() => setModalMode(null)} title={modalTitle}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="game-label">Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required maxLength={100} className="game-input" placeholder="e.g. Weekend 15% Off" />
          </div>
          <div>
            <label className="game-label">Code (optional)</label>
            <input type="text" value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
              maxLength={50} className="game-input" placeholder="e.g. WEEKEND15" />
            <p className="text-gray-700 text-xs font-mono-game mt-1">Leave blank for non-code discount</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="game-label">Type</label>
              <select value={form.discount_type} onChange={(e) => setForm((f) => ({ ...f, discount_type: e.target.value as 'percentage' | 'flat' }))} className="game-input">
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat (₹)</option>
              </select>
            </div>
            <div>
              <label className="game-label">{form.discount_type === 'percentage' ? 'Value (%)' : 'Value (₹)'}</label>
              <input type="number" min="0" max={form.discount_type === 'percentage' ? 100 : undefined} step="0.01"
                value={form.discount_value} onChange={(e) => setForm((f) => ({ ...f, discount_value: e.target.value }))}
                required className="game-input" placeholder={form.discount_type === 'percentage' ? '15' : '50'} />
            </div>
          </div>
          <div>
            <label className="game-label">Scope</label>
            <select value={form.scope} onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value as DiscountScope }))} className="game-input">
              <option value="session">Table only</option>
              <option value="order">Snacks only</option>
              <option value="all">Table + Snacks</option>
            </select>
          </div>
          <div>
            <label className="game-label">Applies to table types (leave blank = all tables)</label>
            <div className="flex gap-4 mt-1">
              {ALL_TABLE_TYPES.map((tt) => (
                <label key={tt} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    className="accent-purple-500 w-3.5 h-3.5"
                    checked={form.applicable_table_types.includes(tt)}
                    onChange={(e) => setForm((f) => ({
                      ...f,
                      applicable_table_types: e.target.checked
                        ? [...f.applicable_table_types, tt]
                        : f.applicable_table_types.filter((x) => x !== tt),
                    }))}
                  />
                  <span className="text-xs text-gray-400 font-mono-game uppercase tracking-wider">{tt}</span>
                </label>
              ))}
            </div>
          </div>
          {formError && <p className="text-red-400 text-xs font-mono-game border border-red-800/40 bg-red-950/20 px-3 py-2">⚠ {formError}</p>}
          <button type="submit" disabled={submitting} className="game-btn-primary">
            {submitting ? '// Saving…' : modalMode === 'add' ? '▶ Create Discount' : '▶ Save Changes'}
          </button>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} title="Delete Discount"
        message={`Permanently delete "${deleteTarget?.name}"${deleteTarget?.code ? ` (code: ${deleteTarget.code})` : ''}?`}
        variant="danger" onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />
      <AlertDialog open={!!alertMsg} message={alertMsg} onClose={() => setAlertMsg('')} />
    </div>
  );
}
