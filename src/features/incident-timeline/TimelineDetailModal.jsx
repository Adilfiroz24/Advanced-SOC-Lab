import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Clock, AlertTriangle, Copy, ExternalLink } from 'lucide-react';

export default function TimelineDetailModal({ event, onClose }) {
  if (!event) return null;

  const severityColor = {
    critical: '#ff2d6d',
    high:     '#ff8c00',
    medium:   '#ffd600',
    low:      '#00ff88',
    info:     '#00e5ff',
  }[event.severity] || '#6b7fa3';

  const copy = (text) => navigator.clipboard?.writeText(text);

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.7)',
        zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1,    y: 0  }}
          exit={{   opacity: 0, scale: 0.94, y: 16  }}
          transition={{ duration: 0.2 }}
          onClick={e => e.stopPropagation()}
          style={{
            background: 'rgba(13,21,48,0.98)',
            border: `1px solid ${severityColor}40`,
            borderRadius: 14,
            width: '100%', maxWidth: 640,
            maxHeight: '85vh',
            overflow: 'auto',
            boxShadow: `0 0 40px ${severityColor}20`,
          }}
        >
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid #1a2744',
            display: 'flex', alignItems: 'flex-start',
            justifyContent: 'space-between', gap: 12,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <span style={{
                  fontSize: 10.5, fontWeight: 700,
                  color: severityColor,
                  background: `${severityColor}18`,
                  border: `1px solid ${severityColor}35`,
                  borderRadius: 4, padding: '1px 8px',
                  textTransform: 'uppercase', letterSpacing: '0.07em',
                  fontFamily: 'JetBrains Mono, monospace',
                }}>
                  {event.severity}
                </span>
                <span style={{
                  fontSize: 10.5, color: '#3d5080',
                  fontFamily: 'JetBrains Mono, monospace',
                }}>
                  {event.type}
                </span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#e8f4ff' }}>
                {event.title}
              </div>
            </div>
            <button onClick={onClose} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#3d5080', padding: 4, borderRadius: 6,
              transition: 'color 0.15s', flexShrink: 0,
            }}
              onMouseEnter={e => e.currentTarget.style.color = '#ff2d6d'}
              onMouseLeave={e => e.currentTarget.style.color = '#3d5080'}
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Timestamp + agent */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
            }}>
              {[
                ['Timestamp',  event.timestamp],
                ['Agent',      event.agent     || '—'],
                ['Source IP',  event.src_ip    || '—'],
                ['Rule ID',    event.rule_id   || '—'],
              ].map(([k, v]) => (
                <div key={k} style={{
                  background: 'rgba(0,229,255,0.04)',
                  border: '1px solid #1a2744', borderRadius: 8,
                  padding: '10px 12px',
                }}>
                  <div style={{ fontSize: 10.5, color: '#3d5080', marginBottom: 4 }}>{k}</div>
                  <div style={{
                    fontSize: 12.5, color: '#c8d8f0',
                    fontFamily: 'JetBrains Mono, monospace',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <span style={{ flex: 1, wordBreak: 'break-all' }}>{v}</span>
                    {v !== '—' && (
                      <button onClick={() => copy(v)} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#3d5080', padding: 2, flexShrink: 0,
                      }}>
                        <Copy size={11} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Description */}
            <div>
              <div style={{ fontSize: 11.5, color: '#3d5080', marginBottom: 6 }}>
                Description
              </div>
              <div style={{
                fontSize: 13, color: '#c8d8f0', lineHeight: 1.6,
                background: 'rgba(0,0,0,0.2)', borderRadius: 8,
                padding: '10px 12px', border: '1px solid #1a2744',
              }}>
                {event.description}
              </div>
            </div>

            {/* MITRE */}
            {event.mitre?.length > 0 && (
              <div>
                <div style={{ fontSize: 11.5, color: '#3d5080', marginBottom: 6 }}>
                  MITRE ATT&CK
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {event.mitre.map(t => (
                    <span key={t} className="mitre-tag">{t}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Raw data */}
            {event.raw && (
              <div>
                <div style={{ fontSize: 11.5, color: '#3d5080', marginBottom: 6 }}>
                  Raw Event Data
                </div>
                <pre style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 11, color: '#00e5ff',
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid #1a2744', borderRadius: 8,
                  padding: '10px 12px',
                  overflow: 'auto', maxHeight: 180,
                  margin: 0, lineHeight: 1.6,
                }}>
                  {typeof event.raw === 'object'
                    ? JSON.stringify(event.raw, null, 2)
                    : event.raw}
                </pre>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}