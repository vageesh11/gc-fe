import type { PaginationMeta } from '../types';

interface PaginationProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
}

export function Pagination({ pagination, onPageChange }: PaginationProps) {
  const { page, total_pages, total, has_prev, has_next, limit } = pagination;

  if (total_pages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  // Build page number window: show up to 5 pages around current
  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(total_pages, page + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  const btnBase = 'px-3 py-1.5 text-xs font-bold tracking-widest border transition-all';
  const btnActive = 'bg-purple-600/30 border-purple-500/70 text-purple-200';
  const btnIdle = 'border-gray-700/50 text-gray-500 hover:border-purple-700/50 hover:text-purple-400';
  const btnDisabled = 'border-gray-800/30 text-gray-700 cursor-not-allowed';

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-purple-900/20">
      {/* Record count */}
      <p className="text-xs font-mono-game text-gray-600">
        {from}–{to} <span className="text-gray-700">of</span> {total}
      </p>

      {/* Page controls */}
      <div className="flex items-center gap-1">
        {/* Prev */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!has_prev}
          className={`${btnBase} ${has_prev ? btnIdle : btnDisabled}`}
        >
          ←
        </button>

        {/* First page + ellipsis */}
        {start > 1 && (
          <>
            <button onClick={() => onPageChange(1)} className={`${btnBase} ${btnIdle}`}>1</button>
            {start > 2 && <span className="text-gray-700 text-xs px-1">…</span>}
          </>
        )}

        {/* Page numbers */}
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`${btnBase} ${p === page ? btnActive : btnIdle}`}
          >
            {p}
          </button>
        ))}

        {/* Last page + ellipsis */}
        {end < total_pages && (
          <>
            {end < total_pages - 1 && <span className="text-gray-700 text-xs px-1">…</span>}
            <button onClick={() => onPageChange(total_pages)} className={`${btnBase} ${btnIdle}`}>{total_pages}</button>
          </>
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!has_next}
          className={`${btnBase} ${has_next ? btnIdle : btnDisabled}`}
        >
          →
        </button>
      </div>
    </div>
  );
}
