import React, { useState } from 'react';
import { createTable } from '../../api/tables';
import { Modal } from '../../components/Modal';
import type { GamingTable } from '../../types';

interface AddTableModalProps {
  open: boolean;
  onClose: () => void;
  onTableAdded: (table: GamingTable) => void;
}

export function AddTableModal({ open, onClose, onTableAdded }: AddTableModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'pool' | 'snooker' | 'ps5'>('pool');
  const [price, setPrice] = useState('');
  const [wizIp, setWizIp] = useState('');
  const [wizMac, setWizMac] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const perMinute = price && !isNaN(parseFloat(price))
    ? (parseFloat(price) / 60).toFixed(2)
    : '';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const table = await createTable({
        name, type,
        price_per_hour: parseFloat(price),
        wiz_ip:  wizIp.trim()  || undefined,
        wiz_mac: wizMac.trim() || undefined,
      });
      onTableAdded(table);
      setName(''); setType('pool'); setPrice(''); setWizIp(''); setWizMac('');
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to create table');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add New Table">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="game-label">Table Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            required maxLength={100} placeholder="e.g. Pool Table 3" className="game-input" />
        </div>

        <div>
          <label className="game-label">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value as 'pool' | 'snooker' | 'ps5')} className="game-input">
            <option value="pool">🎱 Pool</option>
            <option value="snooker">🎯 Snooker</option>
            <option value="ps5">🎮 PS5</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="game-label">Price per Hour (₹)</label>
            <input
              type="number" min="0.01" step="0.01" value={price}
              onChange={(e) => setPrice(e.target.value)}
              required placeholder="e.g. 90"
              className="game-input"
            />
          </div>
          <div>
            <label className="game-label">Per Minute (auto)</label>
            <input
              type="text"
              disabled
              value={perMinute ? `₹${perMinute}` : '—'}
              className="game-input opacity-40 cursor-not-allowed"
            />
          </div>
        </div>

        {/* WiZ Smart Plug (optional) */}
        <div className="border border-purple-900/20 p-3 flex flex-col gap-3">
          <p className="text-xs text-purple-700 font-mono-game tracking-widest uppercase">// WiZ Smart Plug (optional)</p>
          <div>
            <label className="game-label">Plug IP Address</label>
            <input type="text" value={wizIp} onChange={(e) => setWizIp(e.target.value)}
              placeholder="e.g. 192.168.1.101" className="game-input" />
          </div>
          <div>
            <label className="game-label">Plug MAC Address</label>
            <input type="text" value={wizMac} onChange={(e) => setWizMac(e.target.value)}
              placeholder="e.g. AA:BB:CC:DD:EE:FF" className="game-input" />
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-xs font-mono-game tracking-wide border border-red-800/40 bg-red-950/20 px-3 py-2">
            ⚠ {error}
          </p>
        )}

        <button type="submit" disabled={submitting} className="game-btn-primary">
          {submitting ? '// Creating…' : '▶ Create Table'}
        </button>
      </form>
    </Modal>
  );
}
