import React from 'react';

const CONFIG = {
  critical: {
    color:  '#ff2d6d',
    bg:     'rgba(255,45,109,0.14)',
    border: 'rgba(255,45,109,0.35)',
    label:  'CRITICAL',
    dot:    true,
  },
  high: {
    color:  '#ff8c00',
    bg:     'rgba(255,140,0,0.12)',
    border: 'rgba(255,140,0,0.30)',
    label:  'HIGH',
    dot:    false,
  },
  medium: {
    color:  '#ffd600',
    bg:     'rgba(255,214,0,0.10)',
    border: 'rgba(255,214,0,0.28)',
    label:  'MEDIUM',
    dot:    false,
  },
  low: {
    color:  '#00ff88',
    bg:     'rgba(0,255,136,0.08)',
    border: 'rgba(0,255,136,0.22)',
    label:  'LOW',
    dot:    false,
  },
  minimal: {
    color:  '#6b7fa3',
    bg:     'rgba(107,127,163,0.10)',
    border: 'rgba(107,127,163,0.22)',
    label:  'MINIMAL',
    dot:    false,
  },
};

/**
 * CriticalityBadge
 * Props:
 *   level    string  'critical'|'high'|'medium'|'low'|'minimal'
 *   size     string  'sm'|'md'|'lg'   (default: 'md')
 *   showDot  bool    show pulsing dot for critical assets
 */
export default function CriticalityBadge({
  level   = 'medium',
  size    = 'md',
  showDot = true,
}) {
  const cfg = CONFIG[level] || CONFIG.medium;

  const fontSizes = { sm: 9, md: 10.5, lg: 12 };
  const paddings  = { sm: '1px 6px', md: '2px 9px', lg: '3px 12px' };

  return (
    <span style={{
      display:        'inline-flex',
      alignItems:     'center',
      gap:            5,
      background:     cfg.bg,
      color:          cfg.color,
      border:         `1px solid ${cfg.border}`,
      borderRadius:   9999,
      fontSize:       fontSizes[size],
      fontWeight:     700,
      padding:        paddings[size],
      fontFamily:     'JetBrains Mono, monospace',
      letterSpacing:  '0.06em',
      textTransform:  'uppercase',
      whiteSpace:     'nowrap',
    }}>
      {showDot && cfg.dot && (
        <span style={{
          display:      'inline-block',
          width:        6,
          height:       6,
          borderRadius: '50%',
          background:   cfg.color,
          boxShadow:    `0 0 6px ${cfg.color}`,
          flexShrink:   0,
          animation:    'ping 1.5s ease-out infinite',
        }} />
      )}
      {cfg.label}
    </span>
  );
}