// ============================================================
// Advanced SOC Lab — StatsCard.jsx
// Glassmorphism stat card with Framer Motion animated counter
// ============================================================

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// ── Animated count-up hook ────────────────────────────────
function useCountUp(target, duration = 1100, enabled = true) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled) { setCount(target); return; }
    if (target === 0) { setCount(0); return; }

    let startTime  = null;
    let frameId;
    const startVal = 0;

    const easeOut = (t) => 1 - Math.pow(1 - t, 3);

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed  = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const current  = Math.round(startVal + (target - startVal) * easeOut(progress));
      setCount(current);
      if (progress < 1) frameId = requestAnimationFrame(step);
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [target, duration, enabled]);

  return count;
}

// ── Trend indicator ───────────────────────────────────────
function TrendBadge({ trend, trendValue }) {
  if (!trendValue) return null;

  const cfg = {
    up:      { Icon: TrendingUp,   color: '#ff2d6d', bg: 'rgba(255,45,109,0.12)',  border: 'rgba(255,45,109,0.30)' },
    down:    { Icon: TrendingDown, color: '#00ff88', bg: 'rgba(0,255,136,0.10)',   border: 'rgba(0,255,136,0.25)' },
    neutral: { Icon: Minus,        color: '#6b7fa3', bg: 'rgba(107,127,163,0.12)', border: 'rgba(107,127,163,0.25)' },
  };
  const { Icon, color, bg, border } = cfg[trend] || cfg.neutral;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 4,
      fontSize: 11, color,
      background: bg,
      border: `1px solid ${border}`,
      borderRadius: 6,
      padding: '3px 7px',
      flexShrink: 0,
    }}>
      <Icon size={10} />
      {trendValue}
    </div>
  );
}

/**
 * StatsCard — glassmorphism metric card
 *
 * Props:
 *   title       string   Card label
 *   value       number   Target number for the counter
 *   suffix      string   Optional suffix, e.g. "m", "%"
 *   icon        Component Lucide icon
 *   color       string   Accent hex color (default: #00e5ff)
 *   trend       string   'up' | 'down' | 'neutral'
 *   trendValue  string   Trend label, e.g. "+3 vs yesterday"
 *   alert       bool     If true: red pulsing border
 *   delay       number   Framer Motion entrance delay (seconds)
 *   subtitle    string   Optional sub-label below title
 */
export default function StatsCard({
  title,
  value       = 0,
  suffix      = '',
  icon: Icon,
  color       = '#00e5ff',
  trend       = 'neutral',
  trendValue  = '',
  alert       = false,
  delay       = 0,
  subtitle    = '',
}) {
  const count = useCountUp(value);

  const accentColor  = alert ? '#ff2d6d' : color;
  const borderColor  = alert
    ? 'rgba(255,45,109,0.35)'
    : 'rgba(26,39,68,1)';
  const glowShadow   = alert
    ? '0 0 20px rgba(255,45,109,0.18)'
    : 'none';

  return (
    <motion.div
      className="glass-card"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, delay, ease: 'easeOut' }}
      style={{
        padding: '18px 20px',
        borderColor,
        boxShadow: glowShadow,
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
      }}
      whileHover={{
        borderColor: alert
          ? 'rgba(255,45,109,0.55)'
          : 'rgba(36,54,96,1)',
        transition: { duration: 0.15 },
      }}
    >
      {/* Background radial accent */}
      <div style={{
        position: 'absolute',
        top: -24, right: -24,
        width: 90, height: 90,
        borderRadius: '50%',
        background: accentColor,
        opacity: 0.055,
        filter: 'blur(22px)',
        pointerEvents: 'none',
      }} />

      {/* ── Header row ─────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 14,
      }}>
        {/* Icon box */}
        <div style={{
          width: 38, height: 38,
          borderRadius: 9,
          background: `${accentColor}18`,
          border: `1px solid ${accentColor}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {Icon && <Icon size={17} color={accentColor} />}
        </div>

        {/* Trend badge */}
        <TrendBadge trend={trend} trendValue={trendValue} />
      </div>

      {/* ── Counter ────────────────────────────────── */}
      <motion.div
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 30,
          fontWeight: 700,
          color: accentColor,
          lineHeight: 1,
          marginBottom: 6,
          textShadow: `0 0 14px ${accentColor}45`,
        }}
        key={value}                   // re-trigger animation on value change
        initial={{ opacity: 0.6 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {count.toLocaleString()}{suffix}
      </motion.div>

      {/* ── Title ──────────────────────────────────── */}
      <div style={{
        fontSize: 12.5,
        color: '#6b7fa3',
        fontWeight: 500,
        lineHeight: 1.3,
      }}>
        {title}
      </div>

      {/* Optional subtitle */}
      {subtitle && (
        <div style={{
          fontSize: 11,
          color: '#3d5080',
          marginTop: 3,
        }}>
          {subtitle}
        </div>
      )}

      {/* Alert pulsing bottom bar */}
      {alert && (
        <motion.div
          style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            height: 2,
            background: 'linear-gradient(90deg, transparent, #ff2d6d, transparent)',
          }}
          animate={{ opacity: [0.35, 1, 0.35] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
    </motion.div>
  );
}