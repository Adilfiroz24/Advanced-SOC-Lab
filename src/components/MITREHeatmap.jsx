// ============================================================
// Advanced SOC Lab — MITREHeatmap.jsx
// ATT&CK technique coverage matrix with tooltips and legend
// ============================================================

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Target, CheckCircle, AlertCircle } from 'lucide-react';

// ── Color mapping by alert count ─────────────────────────
const getCellColor = (item) => {
  if (!item.covered)     return { bg: 'rgba(22,32,58,0.85)',    text: '#2a3a5c', border: 'rgba(255,255,255,0.04)' };
  if (item.count > 100)  return { bg: 'rgba(255,45,109,0.72)',  text: '#ffe0e8', border: 'rgba(255,45,109,0.50)' };
  if (item.count > 10)   return { bg: 'rgba(255,140,0,0.62)',   text: '#ffe8cc', border: 'rgba(255,140,0,0.42)'  };
  if (item.count > 0)    return { bg: 'rgba(255,214,0,0.50)',   text: '#fff8cc', border: 'rgba(255,214,0,0.36)'  };
  return                        { bg: 'rgba(0,255,136,0.22)',   text: '#ccffe8', border: 'rgba(0,255,136,0.30)'  };
};

// ── Tooltip ───────────────────────────────────────────────
function Tooltip({ item, x, y }) {
  if (!item) return null;
  const sev = item.count > 100 ? 'Critical'
    : item.count > 10 ? 'High'
    : item.count > 0  ? 'Medium'
    : item.covered    ? 'Covered'
    : 'No coverage';

  const sevColor = {
    Critical: '#ff2d6d', High: '#ff8c00',
    Medium: '#ffd600', Covered: '#00ff88', 'No coverage': '#3d5080',
  }[sev];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={{ duration: 0.12 }}
        style={{
          position: 'fixed',
          left: Math.min(x + 14, window.innerWidth - 220),
          top:  Math.min(y + 14, window.innerHeight - 160),
          zIndex: 1000,
          background: 'rgba(10,15,30,0.98)',
          border: '1px solid #243660',
          borderRadius: 9,
          padding: '10px 14px',
          minWidth: 190,
          boxShadow: '0 8px 28px rgba(0,0,0,0.55)',
          pointerEvents: 'none',
        }}
      >
        {/* Technique ID + tactic */}
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 13, fontWeight: 700,
          color: '#00e5ff', marginBottom: 4,
        }}>
          {item.technique}
        </div>
        <div style={{ fontSize: 11, color: '#6b7fa3', marginBottom: 8 }}>
          {item.tactic}
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
            <span style={{ color: '#3d5080' }}>Status</span>
            <span style={{ color: sevColor, fontWeight: 600 }}>{sev}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
            <span style={{ color: '#3d5080' }}>Alert count</span>
            <span style={{
              color: '#c8d8f0',
              fontFamily: 'JetBrains Mono, monospace',
            }}>
              {item.count ?? 0}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
            <span style={{ color: '#3d5080' }}>Tested</span>
            <span style={{ color: item.tested ? '#00ff88' : '#3d5080' }}>
              {item.tested ? '✓ Yes' : '✗ No'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
            <span style={{ color: '#3d5080' }}>Covered</span>
            <span style={{ color: item.covered ? '#00e5ff' : '#3d5080' }}>
              {item.covered ? '✓ Yes' : '✗ No'}
            </span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Legend ────────────────────────────────────────────────
const LEGEND = [
  { color: 'rgba(22,32,58,0.85)',    label: 'No coverage' },
  { color: 'rgba(0,255,136,0.22)',   label: 'Covered (0 alerts)' },
  { color: 'rgba(255,214,0,0.50)',   label: '1–10 alerts' },
  { color: 'rgba(255,140,0,0.62)',   label: '11–100 alerts' },
  { color: 'rgba(255,45,109,0.72)',  label: '100+ alerts' },
];

// ── Main component ────────────────────────────────────────
/**
 * MITREHeatmap
 *
 * Props:
 *   data   array   Array of { tactic, technique, covered, tested, count }
 *                  from mockThreatIntel.js → mitreCoverage
 */
export default function MITREHeatmap({ data = [] }) {
  const [tooltip, setTooltip] = useState(null);  // { item, x, y }

  const tactics = [...new Set(data.map(d => d.tactic))];

  // Coverage stats for summary bar
  const covered = data.filter(d => d.covered).length;
  const tested  = data.filter(d => d.tested).length;
  const active  = data.filter(d => d.count > 0).length;
  const total   = data.length;
  const pct     = total > 0 ? Math.round((covered / total) * 100) : 0;

  if (total === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0', color: '#3d5080' }}>
        <Target size={32} style={{ opacity: 0.25, margin: '0 auto 8px' }} />
        <div style={{ fontSize: 13 }}>No MITRE data available</div>
      </div>
    );
  }

  return (
    <div>
      {/* ── Coverage summary bar ──────────────────────── */}
      <div style={{
        display: 'flex', gap: 20, marginBottom: 14,
        flexWrap: 'wrap', alignItems: 'center',
      }}>
        {[
          { label: 'Coverage',      value: `${covered}/${total}`, sub: `${pct}%`,  color: '#00e5ff' },
          { label: 'Tested',        value: `${tested}/${total}`,  sub: '',          color: '#00ff88' },
          { label: 'Active alerts', value: `${active}`,           sub: 'techniques',color: '#ff8c00' },
        ].map(stat => (
          <div key={stat.label} style={{
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 16, fontWeight: 700,
              color: stat.color,
            }}>
              {stat.value}
              {stat.sub && (
                <span style={{ fontSize: 11, color: '#6b7fa3', marginLeft: 4 }}>
                  {stat.sub}
                </span>
              )}
            </div>
            <div style={{ fontSize: 10.5, color: '#3d5080' }}>
              {stat.label}
            </div>
          </div>
        ))}

        {/* Coverage progress bar */}
        <div style={{ flex: 1, minWidth: 120 }}>
          <div className="progress-bar" style={{ height: 5 }}>
            <motion.div
              className="progress-fill"
              style={{ background: 'linear-gradient(90deg, #00e5ff, #7b2fff)' }}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* ── Legend ────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 12, marginBottom: 12,
        flexWrap: 'wrap',
      }}>
        {LEGEND.map(l => (
          <div key={l.label} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: 10.5, color: '#6b7fa3',
          }}>
            <div style={{
              width: 11, height: 11, borderRadius: 3,
              background: l.color,
              border: '1px solid rgba(255,255,255,0.07)',
              flexShrink: 0,
            }} />
            {l.label}
          </div>
        ))}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          fontSize: 10.5, color: '#6b7fa3',
        }}>
          <div style={{
            width: 11, height: 11, borderRadius: 3,
            background: 'transparent',
            border: '1px solid rgba(0,229,255,0.45)',
            flexShrink: 0,
          }} />
          Tested (border)
        </div>
      </div>

      {/* ── Heatmap grid ──────────────────────────────── */}
      <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${tactics.length}, minmax(72px, 1fr))`,
          gap: 5,
          minWidth: tactics.length * 80,
        }}>
          {/* Tactic column headers */}
          {tactics.map(tactic => (
            <div key={tactic} style={{
              fontSize: 9, fontWeight: 700,
              color: '#3d5080',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              padding: '0 2px 6px',
              textAlign: 'center',
              borderBottom: '1px solid #1a2744',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {tactic}
            </div>
          ))}

          {/* Technique cells — one column per tactic */}
          {tactics.map(tactic => {
            const cells = data.filter(d => d.tactic === tactic);
            return (
              <div key={tactic} style={{
                display: 'flex', flexDirection: 'column', gap: 3,
              }}>
                {cells.map(item => {
                  const { bg, text, border } = getCellColor(item);
                  return (
                    <motion.div
                      key={item.technique}
                      style={{
                        background: bg,
                        color: text,
                        border: item.tested
                          ? '1px solid rgba(0,229,255,0.40)'
                          : `1px solid ${border}`,
                        borderRadius: 5,
                        padding: '5px 5px',
                        fontSize: 9.5,
                        fontFamily: 'JetBrains Mono, monospace',
                        textAlign: 'center',
                        cursor: 'pointer',
                        lineHeight: 1.3,
                        userSelect: 'none',
                        position: 'relative',
                      }}
                      whileHover={{ scale: 1.08, zIndex: 10 }}
                      transition={{ duration: 0.13 }}
                      onMouseEnter={(e) => setTooltip({
                        item,
                        x: e.clientX,
                        y: e.clientY,
                      })}
                      onMouseLeave={() => setTooltip(null)}
                      onMouseMove={(e) => setTooltip(prev =>
                        prev ? { ...prev, x: e.clientX, y: e.clientY } : null
                      )}
                    >
                      {/* Technique ID */}
                      <div>{item.technique}</div>

                      {/* Alert count (only if > 0) */}
                      {item.count > 0 && (
                        <div style={{
                          fontSize: 8.5,
                          color: item.count > 100 ? '#fff' : '#ff8c00',
                          fontWeight: 700,
                          marginTop: 1,
                        }}>
                          {item.count > 999 ? '999+' : item.count}
                        </div>
                      )}

                      {/* Tested indicator dot */}
                      {item.tested && (
                        <div style={{
                          position: 'absolute',
                          top: 3, right: 3,
                          width: 4, height: 4,
                          borderRadius: '50%',
                          background: '#00e5ff',
                          boxShadow: '0 0 4px #00e5ff',
                        }} />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating tooltip */}
      {tooltip && (
        <Tooltip item={tooltip.item} x={tooltip.x} y={tooltip.y} />
      )}
    </div>
  );
}