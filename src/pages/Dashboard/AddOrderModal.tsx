import React, { useEffect, useState } from 'react';
import type { GamingTable, ActiveTableSession, InventoryItem } from '../../types';
import { getInventory } from '../../api/inventory';
import { createOrder } from '../../api/orders';
import { Modal } from '../../components/Modal';
import { Spinner } from '../../components/Spinner';

interface AddOrderModalProps {
  open: boolean;
  table: GamingTable | null;
  session: ActiveTableSession | null;
  onClose: () => void;
  onOrderAdded: () => void;
}

export function AddOrderModal({ open, table, session, onClose, onOrderAdded }: AddOrderModalProps) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | ''>('');
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setSelectedItemId('');
    setQuantity(1);
    setLoadingItems(true);
    getInventory({ limit: 100 })
      .then(({ data }) => setItems(data.filter((i) => i.stock_quantity > 0)))
      .catch(() => setError('Failed to load inventory'))
      .finally(() => setLoadingItems(false));
  }, [open]);

  const selectedItem = items.find((i) => i.id === selectedItemId);
  const subtotal = selectedItem ? parseFloat(selectedItem.price) * quantity : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session || selectedItemId === '') return;
    setError('');
    setSubmitting(true);
    try {
      await createOrder({ session_id: session.id, item_id: selectedItemId as number, quantity });
      onOrderAdded();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Add Order — ${table?.name ?? ''}`}>
      {loadingItems ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="game-label">Item</label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(Number(e.target.value))}
              required
              className="game-input"
            >
              <option value="">— Select an item —</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} — ₹{parseFloat(item.price).toFixed(2)} (stock: {item.stock_quantity})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="game-label">Quantity</label>
            <input
              type="number"
              min={1}
              max={selectedItem?.stock_quantity ?? 999}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              required
              className="game-input"
            />
          </div>

          {selectedItem && (
            <div className="bg-[#07070f] border border-purple-900/40 px-4 py-3 text-sm">
              <div className="flex justify-between text-gray-500 text-xs uppercase tracking-wider mb-1.5">
                <span>Unit price</span>
                <span className="font-mono-game text-purple-400">₹{parseFloat(selectedItem.price).toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-800 pt-1.5">
                <span className="text-xs uppercase tracking-wider text-gray-500">Subtotal</span>
                <span className="font-mono-game font-bold text-cyan-400">₹{subtotal.toFixed(2)}</span>
              </div>
            </div>
          )}

          {error && (
            <p className="text-red-400 text-xs font-mono-game tracking-wide border border-red-800/40 bg-red-950/20 px-3 py-2">
              ⚠ {error}
            </p>
          )}

          <button type="submit" disabled={submitting || selectedItemId === ''} className="game-btn-primary">
            {submitting ? '// Placing…' : '▶ Place Order'}
          </button>
        </form>
      )}
    </Modal>
  );
}
