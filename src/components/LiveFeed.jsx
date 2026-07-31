// ============================================================
// Advanced SOC Lab — LiveFeed.jsx
// Scrolling real-time alert ticker with animated entries
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, Clock } from 'lucide-react';

// ── Severity configuration ────────────────────────────────
const SEV_CONFIG = {
  critical: {
    dot:   '#ff2d6d',
    glow:  'rgba(255,45,109,0.55)',
    label: 'CRIT',
    bg:    'rgba(255,45,109,0.07)',
  },
  high: {
    dot:   '#ff8c00',
    glow:  'rgba(255,140,0,0.45)',
    label: 'HIGH',
    bg:    'rgba(255,140,0,0.05)',
  },
  medium: {
    dot:   '#ffd600',
    glow:  'rgba(255,214,0,0.40)',
    label: 'MED',
    bg:    'rgba(255,214,0,0.04)',
  },
  low: {
    dot:   '#00ff88',
    glow:  'rgba(0,255,136,0.40)',
    label: 'LOW',
    bg:    'transparent',
  },
};

// ── Single feed item ──────────────────────────────────────
function FeedItem({ alert, isLatest, index }) {
  const sev = SEV_CONFIG[alert.severity] || SEV_CONFIG.low;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20, height: 0 }}
      animate={{ opacity: 1, x: 0, height: 'auto' }}
      exit={{   opacity: 0, x: -20, height: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 9,
        padding: '8px 10px',
        borderRadius: 7,
        background: isLatest ? sev.bg : 'transparent',
        border: isLatest
          ? `1px solid ${sev.dot}20`
          : '1px solid transparent',
        transition: 'background 0.3s',
        overflow: 'hidden',
      }}
    >
      {/* Severity dot */}
      <div style={{ paddingTop: 3, flexShrink: 0 }}>
        <div style={{
          width: 7, height: 7,
          borderRadius: '50%',
          background: sev.dot,
          boxShadow: isLatest ? `0 0 7px ${sev.glow}` : 'none',
          transition: 'box-shadow 0.4s',
        }} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Description */}
        <div style={{
          fontSize: 12.5,
          color: isLatest ? '#e8f4ff' : '#c8d8f0',
          fontWeight: isLatest ? 500 : 400,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          lineHeight: 1.35,
        }}>
          {alert.description}
        </div>

        {/* Meta row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          marginTop: 3,
          fontSize: 10.5,
          color: '#3d5080',
          flexWrap: 'wrap',
        }}>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 9.5,
            color: sev.dot,
            background: `${sev.dot}18`,
            border: `1px solid ${sev.dot}30`,
            borderRadius: 3,
            padding: '0 5px',
          }}>
            {sev.label}
          </span>

          <span
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              color: '#4a6090',
            }}
          >
            {alert.agent_name || 'unknown'}
          </span>

          {alert.src_ip && (
            <>
              <span>·</span>
              <span style={{
                fontFamily: 'JetBrains Mono, monospace',
                color: '#ff8c00',
              }}>
                {alert.src_ip}
              </span>
            </>
          )}

          <span>·</span>

          <span style={{
            display: 'flex', alignItems: 'center', gap: 3,
          }}>
            <Clock size={9} />
            {new Date(alert.timestamp).toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* MITRE tag */}
      {alert.mitre?.[0] && (
        <span style={{
          flexShrink: 0,
          fontSize: 9.5,
          fontFamily: 'JetBrains Mono, monospace',
          color: '#a855f7',
          background: 'rgba(123,47,255,0.12)',
          border: '1px solid rgba(123,47,255,0.25)',
          borderRadius: 4,
          padding: '2px 6px',
          alignSelf: 'center',
          whiteSpace: 'nowrap',
        }}>
          {alert.mitre[0]}
        </span>
      )}
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────
/**
 * LiveFeed
 *
 * Props:
 *   alerts      array   Source alerts (from mockAlerts.js)
 *   maxItems    number  Max items shown (default: 8)
 *   autoScroll  bool    Simulate new incoming alerts (default: true)
 *   interval    number  New alert interval in ms (default: 6000)
 */
export default function LiveFeed({
  alerts      = [],
  maxItems    = 8,
  autoScroll  = true,
  interval    = 6000,
}) {
  const [items, setItems]     = useState([]);
  const [paused, setPaused]   = useState(false);
  const [count, setCount]     = useState(0);
  const pausedRef             = useRef(false);

  // Initialise with most recent alerts
  useEffect(() => {
    if (alerts.length > 0) {
      setItems(
        [...alerts]
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, maxItems)
      );
      setCount(alerts.length);
    }
  }, [alerts, maxItems]);

  // Simulate new incoming alerts
  useEffect(() => {
    if (!autoScroll || alerts.length === 0) return;

    const timer = setInterval(() => {
      if (pausedRef.current) return;

      const src   = alerts[Math.floor(Math.random() * alerts.length)];
      const fresh = {
        ...src,
        id:        `live-${Date.now()}`,
        timestamp: new Date().toISOString(),
      };

      setItems(prev => [fresh, ...prev].slice(0, maxItems));
      setCount(c => c + 1);
    }, interval);

    return () => clearInterval(timer);
  }, [alerts, autoScroll, interval, maxItems]);

  // Sync pausedRef so the interval callback reads current value
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  if (alerts.length === 0) {
    return (
      <div style={{
        textAlign: 'center', padding: '32px 0', color: '#3d5080',
      }}>
        <WifiOff size={30} style={{ opacity: 0.25, margin: '0 auto 8px' }} />
        <div style={{ fontSize: 12.5 }}>No live alerts</div>
      </div>
    );
  }

  return (
    <div>
      {/* ── Feed header ───────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
        }}>
          {paused ? (
            <WifiOff size={13} color="#6b7fa3" />
          ) : (
            <Wifi size={13} color="#00e5ff" />
          )}
          <span style={{
            fontSize: 11.5, color: '#6b7fa3',
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            {paused ? 'PAUSED' : 'LIVE'}
          </span>

          {!paused && (
            <motion.div
              style={{
                width: 6, height: 6, borderRadius: '50%',
                background: '#00e5ff',
              }}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
          )}
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{
            fontSize: 10.5, color: '#3d5080',
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            {count} total
          </span>
          <button
            onClick={() => setPaused(p => !p)}
            style={{
              background: paused
                ? 'rgba(0,229,255,0.10)'
                : 'rgba(255,255,255,0.05)',
              border: `1px solid ${paused ? 'rgba(0,229,255,0.25)' : '#1a2744'}`,
              borderRadius: 5,
              color: paused ? '#00e5ff' : '#6b7fa3',
              fontSize: 10.5,
              padding: '3px 9px',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              transition: 'all 0.15s',
            }}
          >
            {paused ? 'Resume' : 'Pause'}
          </button>
        </div>
      </div>

      {/* ── Alert items ───────────────────────────────── */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 4,
      }}>
        <AnimatePresence initial={false} mode="popLayout">
          {items.map((alert, i) => (
            <FeedItem
              key={alert.id}
              alert={alert}
              isLatest={i === 0}
              index={i}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}