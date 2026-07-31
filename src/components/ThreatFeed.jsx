// ============================================================
// Advanced SOC Lab — ThreatFeed.jsx
// MISP-style IOC feed + MITREHeatmap + LiveFeed
// All three are exported from this single file.
// ============================================================

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, Hash, Link, Shield, AlertTriangle,
  CheckCircle, Clock, Wifi,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// ════════════════════════════════════════════════════════════
// ThreatFeed — MISP IOC feed list
// ════════════════════════════════════════════════════════════

const TYPE_ICON = {
  ip:     <Globe  size={13} />,
  hash:   <Hash   size={13} />,
  url:    <Link   size={13} />,
  domain: <Globe  size={13} />,
};

const CONF_COLOR = (score) => {
  if (score >= 90) return '#ff2d6d';
  if (score >= 70) return '#ff8c00';
  if (score >= 50) return '#ffd600';
  return '#6b7fa3';
};

function IOCRow({ ioc, index }) {
  return (
    <motion.div
      className="glass-card"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.18, delay: index * 0.04 }}
      style={{ padding: '12px 14px' }}
      whileHover={{
        borderColor: '#243660',
        transition: { duration: 0.12 },
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Type icon */}
        <div style={{
          width: 32, height: 32,
          borderRadius: 7,
          background: 'rgba(0,229,255,0.08)',
          border: '1px solid rgba(0,229,255,0.16)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#00e5ff',
          flexShrink: 0,
        }}>
          {TYPE_ICON[ioc.type] || <Shield size={13} />}
        </div>

        {/* Value + meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 12.5,
            color: ioc.blocked ? '#6b7fa3' : '#e8f4ff',
            textDecoration: ioc.blocked ? 'line-through' : 'none',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {ioc.value}
          </div>
          <div style={{
            display: 'flex', gap: 7, marginTop: 3,
            fontSize: 11, color: '#3d5080', flexWrap: 'wrap',
            alignItems: 'center',
          }}>
            <span style={{
              background: 'rgba(74,96,144,0.16)',
              border: '1px solid rgba(74,96,144,0.22)',
              borderRadius: 3, padding: '0 5px',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 9.5, textTransform: 'uppercase',
            }}>
              {ioc.type}
            </span>
            <span>{ioc.threat_type}</span>
            {ioc.country && <><span>·</span><span>{ioc.country}</span></>}
            <span>·</span>
            <span>{ioc.source}</span>
            {ioc.total_reports != null && (
              <><span>·</span><span>{ioc.total_reports} reports</span></>
            )}
          </div>
        </div>

        {/* Confidence + status */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'flex-end', gap: 5, flexShrink: 0,
        }}>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 14, fontWeight: 700,
            color: CONF_COLOR(ioc.confidence),
          }}>
            {ioc.confidence}%
          </div>
          {ioc.blocked ? (
            <span style={{
              fontSize: 10, color: '#00ff88',
              display: 'flex', alignItems: 'center', gap: 3,
            }}>
              <CheckCircle size={10} /> Blocked
            </span>
          ) : (
            <span style={{
              fontSize: 10, color: '#ff2d6d',
              display: 'flex', alignItems: 'center', gap: 3,
            }}>
              <AlertTriangle size={10} /> Active
            </span>
          )}
        </div>
      </div>

      {/* MITRE tags */}
      {ioc.mitre?.length > 0 && (
        <div style={{ marginTop: 7, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {ioc.mitre.map(t => (
            <span key={t} className="mitre-tag">{t}</span>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export function ThreatFeed({ iocs = [], compact = false }) {
  const display = compact ? iocs.slice(0, 5) : iocs;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 6 : 10 }}>
      {display.map((ioc, i) => (
        <IOCRow key={ioc.id || i} ioc={ioc} index={i} />
      ))}
      {display.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px 0', color: '#3d5080', fontSize: 13 }}>
          <Globe size={32} style={{ opacity: 0.25, margin: '0 auto 8px' }} />
          No IOCs in feed
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// MITREHeatmap — ATT&CK technique coverage grid
// ════════════════════════════════════════════════════════════

const CELL_COLOR = (item) => {
  if (!item.covered)   return 'rgba(26,39,68,0.80)';
  if (item.count > 100) return 'rgba(255,45,109,0.72)';
  if (item.count > 10)  return 'rgba(255,140,0,0.62)';
  if (item.count > 0)   return 'rgba(255,214,0,0.52)';
  return 'rgba(0,255,136,0.28)';
};

const LEGEND = [
  { color: 'rgba(26,39,68,0.80)',    label: 'No coverage' },
  { color: 'rgba(0,255,136,0.28)',   label: 'Covered (0 alerts)' },
  { color: 'rgba(255,214,0,0.52)',   label: '1–10 alerts' },
  { color: 'rgba(255,140,0,0.62)',   label: '11–100 alerts' },
  { color: 'rgba(255,45,109,0.72)',  label: '100+ alerts' },
];

export function MITREHeatmap({ data = [] }) {
  const [tooltip, setTooltip] = useState(null);
  const tactics = [...new Set(data.map(d => d.tactic))];

  return (
    <div>
      {/* Legend */}
      <div style={{
        display: 'flex', gap: 14, marginBottom: 12, flexWrap: 'wrap',
      }}>
        {LEGEND.map(l => (
          <div key={l.label} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: 10.5, color: '#6b7fa3',
          }}>
            <div style={{
              width: 11, height: 11, borderRadius: 3,
              background: l.color,
              border: '1px solid rgba(255,255,255,0.08)',
              flexShrink: 0,
            }} />
            {l.label}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${tactics.length}, 1fr)`,
        gap: 4,
        overflowX: 'auto',
      }}>
        {/* Tactic headers */}
        {tactics.map(tactic => (
          <div key={tactic} style={{
            fontSize: 9, fontWeight: 700,
            color: '#3d5080',
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            padding: '0 3px 6px',
            textAlign: 'center',
            borderBottom: '1px solid #1a2744',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {tactic.replace(' ', '\n')}
          </div>
        ))}

        {/* Technique cells by tactic column */}
        {tactics.map(tactic => (
          <div key={tactic} style={{
            display: 'flex', flexDirection: 'column', gap: 3,
          }}>
            {data.filter(d => d.tactic === tactic).map(item => (
              <motion.div
                key={item.technique}
                className="mitre-cell"
                style={{
                  background: CELL_COLOR(item),
                  color: item.covered ? '#c8d8f0' : '#3d5080',
                  border: item.tested
                    ? '1px solid rgba(0,229,255,0.32)'
                    : '1px solid rgba(255,255,255,0.05)',
                }}
                whileHover={{ scale: 1.08 }}
                onMouseEnter={() => setTooltip(item)}
                onMouseLeave={() => setTooltip(null)}
                title={`${item.technique} — ${item.count ?? 0} alerts${item.tested ? ' (tested)' : ''}`}
              >
                <div style={{ fontSize: 9.5 }}>{item.technique}</div>
                {item.count > 0 && (
                  <div style={{ fontSize: 8.5, color: '#ff8c00', marginTop: 1 }}>
                    {item.count}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ))}
      </div>

      {/* Coverage summary */}
      <div style={{
        marginTop: 12, fontSize: 11.5, color: '#3d5080',
        display: 'flex', gap: 16,
      }}>
        <span>
          Covered:&nbsp;
          <span style={{ color: '#00e5ff', fontFamily: 'JetBrains Mono, monospace' }}>
            {data.filter(d => d.covered).length}/{data.length}
          </span>
        </span>
        <span>
          Tested:&nbsp;
          <span style={{ color: '#00ff88', fontFamily: 'JetBrains Mono, monospace' }}>
            {data.filter(d => d.tested).length}/{data.length}
          </span>
        </span>
        <span>
          Active alerts:&nbsp;
          <span style={{ color: '#ff8c00', fontFamily: 'JetBrains Mono, monospace' }}>
            {data.filter(d => d.count > 0).length}
          </span>
        </span>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// LiveFeed — scrolling real-time alert ticker
// ════════════════════════════════════════════════════════════

const SEV_DOT_COLOR = {
  critical: '#ff2d6d',
  high:     '#ff8c00',
  medium:   '#ffd600',
  low:      '#00ff88',
};

export function LiveFeed({ alerts = [] }) {
  const [items, setItems] = useState(alerts.slice(0, 6));

  // Simulate new incoming alerts every ~6 seconds
  useEffect(() => {
    if (!alerts.length) return;
    const interval = setInterval(() => {
      const random = alerts[Math.floor(Math.random() * alerts.length)];
      if (!random) return;
      const fresh = {
        ...random,
        id:        `live-${Date.now()}`,
        timestamp: new Date().toISOString(),
      };
      setItems(prev => [fresh, ...prev.slice(0, 7)]);
    }, 6000);
    return () => clearInterval(interval);
  }, [alerts]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <AnimatePresence initial={false}>
        {items.map((alert, i) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{   opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '7px 9px',
              background: i === 0
                ? 'rgba(0,229,255,0.05)'
                : 'transparent',
              borderRadius: 6,
              border: i === 0
                ? '1px solid rgba(0,229,255,0.10)'
                : '1px solid transparent',
            }}
          >
            {/* Severity dot */}
            <div style={{
              width: 7, height: 7,
              borderRadius: '50%',
              background: SEV_DOT_COLOR[alert.severity] || '#6b7fa3',
              boxShadow: `0 0 6px ${SEV_DOT_COLOR[alert.severity] || '#6b7fa3'}80`,
              flexShrink: 0,
            }} />

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 12, color: '#c8d8f0',
                overflow: 'hidden', textOverflow: 'ellipsis',
                whiteSpace: 'nowrap', lineHeight: 1.3,
              }}>
                {alert.description}
              </div>
              <div style={{
                fontSize: 10.5, color: '#3d5080', marginTop: 2,
                display: 'flex', gap: 6, alignItems: 'center',
              }}>
                <span>{alert.agent_name}</span>
                <span>·</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>

            {/* MITRE tag */}
            {alert.mitre?.[0] && (
              <span className="mitre-tag" style={{ flexShrink: 0 }}>
                {alert.mitre[0]}
              </span>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {items.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '24px 0',
          color: '#3d5080', fontSize: 12,
        }}>
          <Wifi size={28} style={{ opacity: 0.25, margin: '0 auto 7px' }} />
          Waiting for live events…
        </div>
      )}
    </div>
  );
}

// Default export — ThreatFeed as primary component
export default ThreatFeed;