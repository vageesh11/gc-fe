import { useEffect, useRef, useState } from 'react';
import type { Discount } from '../types';
import { getDiscounts } from '../api/discounts';

interface DiscountPickerProps {
  onSelect: (discount: Discount | null) => void;
  selected: Discount | null;
}

export function DiscountPicker({ onSelect, selected }: DiscountPickerProps) {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Load all active discounts once
  useEffect(() => {
    setLoading(true);
    getDiscounts({ limit: 100 })
      .then((res) => setDiscounts(res.data.filter((d) => d.is_active)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = discounts.filter((d) => {
    const q = query.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      (d.code ?? '').toLowerCase().includes(q)
    );
  });

  function handleSelect(d: Discount) {
    onSelect(d);
    setQuery('');
    setOpen(false);
  }

  function handleClear() {
    onSelect(null);
    setQuery('');
  }

  function discountLabel(d: Discount) {
    const val = d.discount_type === 'percentage'
      ? `${parseFloat(d.discount_value).toFixed(0)}% off`
      : `₹${parseFloat(d.discount_value).toFixed(2)} off`;
    return { name: d.name, code: d.code, val };
  }

  // If a discount is already selected, show the applied pill
  if (selected) {
    const { name, code, val } = discountLabel(selected);
    return (
      <div className="flex items-center justify-between bg-cyan-900/10 border border-cyan-700/30 px-3 py-2">
        <div>
          <p className="text-cyan-400 text-xs font-semibold tracking-wide">{name} — {val}</p>
          {code && <p className="text-gray-600 text-xs font-mono-game mt-0.5">{code}</p>}
        </div>
        <button type="button" onClick={handleClear}
          className="text-gray-600 hover:text-red-400 transition-colors text-sm ml-3 shrink-0">
          ✕
        </button>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={loading ? 'Loading…' : 'Search by name or code…'}
        className="game-input"
        autoComplete="off"
      />

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[#0f0f1e] border border-purple-700/50 shadow-2xl max-h-52 overflow-y-auto">
          <div className="h-[1px] bg-gradient-to-r from-purple-600 to-cyan-500" />
          {filtered.length === 0 ? (
            <p className="px-4 py-3 text-xs text-gray-600 font-mono-game tracking-wider">
              {query ? 'No matching discounts' : 'No active discounts'}
            </p>
          ) : (
            filtered.map((d) => {
              const { name, code, val } = discountLabel(d);
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => handleSelect(d)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-purple-900/20 transition-colors border-b border-purple-900/10 last:border-0"
                >
                  <div>
                    <p className="text-gray-200 text-xs font-semibold">{name}</p>
                    {code && (
                      <span className="font-mono-game text-xs text-amber-400 border border-amber-800/40 bg-amber-900/10 px-1.5 py-0.5 mt-0.5 inline-block">
                        {code}
                      </span>
                    )}
                  </div>
                  <span className="text-cyan-400 font-mono-game text-xs font-bold ml-3 shrink-0">{val}</span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
