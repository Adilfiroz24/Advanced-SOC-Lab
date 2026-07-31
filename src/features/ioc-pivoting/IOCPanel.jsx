import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, Hash, Link, Search, Filter,
  AlertTriangle, CheckCircle, SlidersHorizontal,
} from 'lucide-react';
import IOCDetail from './IOCDetail';
import { mockThreatIntel } from '../../data/mockThreatIntel';

const TYPE_ICONS = {
  ip:     Globe,
  hash:   Hash,
  url:    Link,
  domain: Globe,
};

const confColor = (s) =>
  s >= 90 ? '#ff2d6d' : s >= 70 ? '#ff8c00' : s >= 50 ? '#ffd600' : '#6b7fa3';

export default function IOCPanel({ onPivot }) {
  const [search,     setSearch]     = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [minConf,    setMinConf]    = useState(0);
  const [selected,   setSelected]   = useState(null);

  const iocs = mockThreatIntel || [];

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return iocs.filter(ioc => {
      if (typeFilter !== 'all' && ioc.type !== typeFilter) return false;
      if (ioc.confidence < minConf) return false;
      if (q && !ioc.value.toLowerCase().includes(q) &&
               !ioc.threat_type?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [iocs, typeFilter, minConf, search]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 14, height: '100%' }}>

      {/* ── Left: IOC list ──────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Filters */}
        <div style={{
          display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center',
        }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 140 }}>
            <Search size={12} color="#4a6090" style={{
              position: 'absolute', left: 9,
              top: '50%', transform: 'translateY(-50%)',
              pointerEvents: 'none',
            }} />
            <input className="soc-input" value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search IOCs…"
              style={{ paddingLeft: 28, height: 30, fontSize: 12 }}
            />
          </div>

          {['all','ip','hash','url','domain'].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)} style={{
              padding: '3px 10px', borderRadius: 9999, fontSize: 11,
              cursor: 'pointer', border: '1px solid',
              background: typeFilter===t ? 'rgba(0,229,255,0.12)' : 'rgba(255,255,255,0.04)',
              color:      typeFilter===t ? '#00e5ff'               : '#6b7fa3',
              borderColor:typeFilter===t ? 'rgba(0,229,255,0.30)'  : '#1a2744',
            }}>{t === 'all' ? 'All' : t.toUpperCase()}</button>
          ))}

          <select
            value={minConf}
            onChange={e => setMinConf(Number(e.target.value))}
            style={{
              background: 'rgba(10,15,30,0.85)',
              border: '1px solid #1a2744', borderRadius: 7,
              color: '#c8d8f0', padding: '4px 8px',
              fontSize: 11.5, cursor: 'pointer', outline: 'none',
            }}
          >
            {[0,50,70,90].map(v => (
              <option key={v} value={v}>
                {v === 0 ? 'All confidence' : `≥ ${v}%`}
              </option>
            ))}
          </select>
        </div>

        {/* IOC rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>
          <AnimatePresence>
            {filtered.map((ioc, i) => {
              const Icon = TYPE_ICONS[ioc.type] || Globe;
              const isSelected = selected?.id === ioc.id;
              return (
                <motion.div
                  key={ioc.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.14, delay: i * 0.025 }}
                  onClick={() => setSelected(isSelected ? null : ioc)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                    background: isSelected
                      ? 'rgba(0,229,255,0.08)'
                      : 'rgba(13,21,48,0.65)',
                    border: `1px solid ${isSelected
                      ? 'rgba(0,229,255,0.28)'
                      : '#1a2744'}`,
                    transition: 'all 0.15s',
                  }}
                >
                  {/* Type icon */}
                  <div style={{
                    width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                    background: 'rgba(0,229,255,0.07)',
                    border: '1px solid rgba(0,229,255,0.14)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={12} color="#00e5ff" />
                  </div>

                  {/* Value + meta */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 12, color: ioc.blocked ? '#6b7fa3' : '#e8f4ff',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      textDecoration: ioc.blocked ? 'line-through' : 'none',
                    }}>
                      {ioc.value}
                    </div>
                    <div style={{ fontSize: 10.5, color: '#3d5080', marginTop: 2 }}>
                      {ioc.threat_type}
                      {ioc.country ? ` · ${ioc.country}` : ''}
                    </div>
                  </div>

                  {/* Confidence */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 13, fontWeight: 700,
                      color: confColor(ioc.confidence),
                    }}>
                      {ioc.confidence}%
                    </div>
                    {ioc.blocked ? (
                      <div style={{ fontSize: 9.5, color: '#00ff88', marginTop: 2 }}>
                        blocked
                      </div>
                    ) : (
                      <div style={{ fontSize: 9.5, color: '#ff2d6d', marginTop: 2 }}>
                        active
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#3d5080', fontSize: 13 }}>
              No IOCs match the current filter
            </div>
          )}
        </div>
      </div>

      {/* ── Right: IOC detail ────────────────────────── */}
      <div>
        <AnimatePresence mode="wait">
          {selected ? (
            <IOCDetail
              key={selected.id}
              ioc={selected}
              onClose={() => setSelected(null)}
              onPivot={onPivot}
            />
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                background: 'rgba(13,21,48,0.5)',
                border: '1px solid #1a2744', borderRadius: 12,
                padding: '32px 20px', textAlign: 'center',
                color: '#3d5080',
              }}
            >
              <Globe size={28} style={{ opacity: 0.3, margin: '0 auto 10px' }} />
              <div style={{ fontSize: 12.5 }}>
                Select an IOC to<br />see details and pivot options
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}