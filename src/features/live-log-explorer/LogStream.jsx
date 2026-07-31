import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Colour rules for log lines ────────────────────────────
function classify(line) {
  const l = line.toLowerCase();
  if (l.includes('error') || l.includes('critical') || l.includes('alert'))
    return { color: '#ff2d6d', label: 'ERROR' };
  if (l.includes('warn') || l.includes('failed') || l.includes('denied'))
    return { color: '#ff8c00', label: 'WARN' };
  if (l.includes('sysmon') || l.includes('eventid') || l.includes('rule'))
    return { color: '#ffd600', label: 'RULE' };
  if (l.includes('suricata') || l.includes('alert') || l.includes('sid'))
    return { color: '#a855f7', label: 'NET' };
  if (l.includes('thehive') || l.includes('case') || l.includes('auto_inv'))
    return { color: '#00e5ff', label: 'SOAR' };
  if (l.includes('cowrie') || l.includes('honeypot'))
    return { color: '#ff2d6d', label: 'HONEY' };
  return { color: '#6b7fa3', label: 'INFO' };
}

export default function LogStream({ logs, highlight, paused, maxVisible = 200 }) {
  const containerRef = useRef(null);
  const autoScroll   = useRef(true);

  // ── Auto-scroll to bottom when new logs arrive ────────
  useEffect(() => {
    if (!paused && autoScroll.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs, paused]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    autoScroll.current = scrollHeight - scrollTop - clientHeight < 40;
  };

  const visible = logs.slice(-maxVisible);
  const q       = highlight?.toLowerCase().trim();

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{
        background:  'rgba(4,8,18,0.96)',
        border:      '1px solid #1a2744',
        borderRadius: 8,
        padding:     '8px 0',
        fontFamily:  'JetBrains Mono, monospace',
        fontSize:    11.5,
        lineHeight:  1.65,
        overflowY:   'auto',
        overflowX:   'auto',
        height:      460,
        position:    'relative',
      }}
    >
      {visible.length === 0 && (
        <div style={{
          textAlign:  'center', padding: '40px 0',
          color:      '#3d5080', fontSize: 12,
        }}>
          Waiting for log events…
        </div>
      )}

      {visible.map((line, i) => {
        const { color, label } = classify(line.text || line);
        const text   = line.text || line;
        const ts     = line.ts   || '';
        const isNew  = i >= visible.length - 3;
        const isMatch = q && text.toLowerCase().includes(q);

        return (
          <motion.div
            key={line.id || i}
            initial={isNew ? { opacity: 0, x: -4 } : false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.15 }}
            style={{
              display:    'flex',
              gap:        8,
              padding:    '1.5px 12px',
              background: isMatch
                ? 'rgba(255,214,0,0.08)'
                : isNew
                  ? 'rgba(0,229,255,0.03)'
                  : 'transparent',
              borderLeft: isMatch
                ? '2px solid #ffd600'
                : '2px solid transparent',
              transition: 'background 0.2s',
            }}
          >
            {/* Line number */}
            <span style={{
              color:       '#243660',
              minWidth:    32,
              textAlign:   'right',
              userSelect:  'none',
              flexShrink:  0,
            }}>
              {i + 1}
            </span>

            {/* Timestamp */}
            {ts && (
              <span style={{ color: '#3d5080', flexShrink: 0 }}>{ts}</span>
            )}

            {/* Level badge */}
            <span style={{
              color,
              background:  `${color}15`,
              border:      `1px solid ${color}25`,
              borderRadius: 3,
              padding:     '0 5px',
              fontSize:    9.5,
              fontWeight:  700,
              flexShrink:  0,
              alignSelf:   'center',
              letterSpacing:'0.05em',
            }}>
              {label}
            </span>

            {/* Log text with highlight */}
            <span style={{
              color: '#c8d8f0',
              flex:  1,
              whiteSpace: 'pre',
            }}>
              {q
                ? text.split(new RegExp(`(${q})`, 'gi')).map((part, pi) =>
                    part.toLowerCase() === q
                      ? <mark key={pi} style={{
                          background: 'rgba(255,214,0,0.35)',
                          color:      '#e8f4ff',
                          borderRadius: 2,
                        }}>{part}</mark>
                      : part
                  )
                : text
              }
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}