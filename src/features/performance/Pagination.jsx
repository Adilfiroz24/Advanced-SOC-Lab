import React from 'react';
import {
  ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight,
} from 'lucide-react';

/**
 * Pagination
 *
 * Props:
 *   total      number   Total item count
 *   pageSize   number   Items per page
 *   page       number   Current page (1-indexed)
 *   onChange   fn       (newPage) => void
 *   showSizes  bool     Show per-page selector
 *   onSizeChange fn     (newSize) => void
 *   pageSizes  array    Available page size options
 */
export default function Pagination({
  total       = 0,
  pageSize    = 25,
  page        = 1,
  onChange,
  showSizes   = true,
  onSizeChange,
  pageSizes   = [10, 25, 50, 100],
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start      = Math.min((page - 1) * pageSize + 1, total);
  const end        = Math.min(page * pageSize, total);

  const go = (p) => {
    const clamped = Math.max(1, Math.min(totalPages, p));
    if (clamped !== page) onChange?.(clamped);
  };

  // Build visible page numbers with ellipsis
  const pages = [];
  const delta = 2;
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 || i === totalPages ||
      (i >= page - delta && i <= page + delta)
    ) {
      pages.push(i);
    } else if (
      i === page - delta - 1 || i === page + delta + 1
    ) {
      pages.push('…');
    }
  }

  const btnBase = {
    display:    'flex', alignItems:'center', justifyContent:'center',
    width:      30, height:30, borderRadius:7, cursor:'pointer',
    border:     '1px solid', fontSize:12.5, transition:'all 0.13s',
    fontFamily: 'JetBrains Mono, monospace',
  };

  const btn = (active, disabled) => ({
    ...btnBase,
    background:  active
      ? 'rgba(0,229,255,0.16)'
      : 'rgba(255,255,255,0.04)',
    color:       disabled ? '#243660' : active ? '#00e5ff' : '#6b7fa3',
    borderColor: active
      ? 'rgba(0,229,255,0.35)'
      : '#1a2744',
    cursor:      disabled ? 'not-allowed' : 'pointer',
    pointerEvents: disabled ? 'none' : 'auto',
  });

  if (total === 0) return null;

  return (
    <div style={{
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'space-between',
      gap:            12,
      flexWrap:       'wrap',
      padding:        '10px 0',
    }}>
      {/* Item count */}
      <div style={{ fontSize:12, color:'#6b7fa3' }}>
        Showing{' '}
        <span style={{
          color:'#00e5ff', fontFamily:'JetBrains Mono,monospace',
        }}>
          {start}–{end}
        </span>
        {' '}of{' '}
        <span style={{
          color:'#00e5ff', fontFamily:'JetBrains Mono,monospace',
        }}>
          {total.toLocaleString()}
        </span>
      </div>

      {/* Navigation */}
      <div style={{ display:'flex', alignItems:'center', gap:4 }}>
        {/* First */}
        <button style={btn(false, page===1)} onClick={() => go(1)}>
          <ChevronsLeft size={13}/>
        </button>
        {/* Prev */}
        <button style={btn(false, page===1)} onClick={() => go(page-1)}>
          <ChevronLeft size={13}/>
        </button>

        {/* Page numbers */}
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} style={{
              ...btnBase, cursor:'default',
              color:'#3d5080', background:'transparent',
              border:'1px solid transparent',
            }}>…</span>
          ) : (
            <button key={p} style={btn(p===page, false)} onClick={() => go(p)}>
              {p}
            </button>
          )
        )}

        {/* Next */}
        <button style={btn(false, page===totalPages)} onClick={() => go(page+1)}>
          <ChevronRight size={13}/>
        </button>
        {/* Last */}
        <button style={btn(false, page===totalPages)} onClick={() => go(totalPages)}>
          <ChevronsRight size={13}/>
        </button>
      </div>

      {/* Page size selector */}
      {showSizes && onSizeChange && (
        <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:12 }}>
          <span style={{ color:'#6b7fa3' }}>Per page:</span>
          {pageSizes.map(s => (
            <button key={s} onClick={() => onSizeChange(s)} style={{
              ...btnBase, width:'auto', padding:'0 8px',
              background: pageSize===s ? 'rgba(0,229,255,0.14)' : 'rgba(255,255,255,0.04)',
              color:      pageSize===s ? '#00e5ff'               : '#6b7fa3',
              borderColor:pageSize===s ? 'rgba(0,229,255,0.30)'  : '#1a2744',
            }}>{s}</button>
          ))}
        </div>
      )}
    </div>
  );
}