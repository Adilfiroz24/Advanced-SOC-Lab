import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ChevronRight, Copy,
  Shield, User, Settings, Search,
  Lock, FileText, Zap, Globe, Hash,
} from 'lucide-react';

const ACTION_CONFIG = {
  login:          { icon: User,     color: '#00e5ff', label: 'LOGIN'         },
  logout:         { icon: User,     color: '#6b7fa3', label: 'LOGOUT'        },
  view:           { icon: Search,   color: '#6b7fa3', label: 'VIEW'          },
  create:         { icon: FileText, color: '#00ff88', label: 'CREATE'        },
  update:         { icon: Settings, color: '#ffd600', label: 'UPDATE'        },
  delete:         { icon: FileText, color: '#ff2d6d', label: 'DELETE'        },
  block:          { icon: Lock,     color: '#ff2d6d', label: 'BLOCK'         },
  unblock:        { icon: Lock,     color: '#00ff88', label: 'UNBLOCK'       },
  export:         { icon: FileText, color: '#00e5ff', label: 'EXPORT'        },
  automation:     { icon: Zap,      color: '#a855f7', label: 'AUTOMATION'    },
  configuration:  { icon: Settings, color: '#ffd600', label: 'CONFIG'        },
  search:         { icon: Search,   color: '#6b7fa3', label: 'SEARCH'        },
  escalate:       { icon: Shield,   color: '#ff8c00', label: 'ESCALATE'      },
  enrich:         { icon: Globe,    color: '#00e5ff', label: 'ENRICH'        },
  hash_verify:    { icon: Hash,     color: '#00ff88', label: 'HASH VERIFY'   },
};

const RISK_COLOR = {
  low:      '#00ff88',
  medium:   '#ffd600',
  high:     '#ff8c00',
  critical: '#ff2d6d',
};

export default function AuditLogEntry({ entry, index }) {
  const [expanded, setExpanded] = useState(false);

  const cfg   = ACTION_CONFIG[entry.action] || ACTION_CONFIG.view;
  const Icon  = cfg.icon;
  const color = cfg.color;

  const copy = (text) => navigator.clipboard?.writeText(text);

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.14, delay: index * 0.02 }}
      style={{
        borderBottom: '1px solid #1a2744',
        transition: 'background 0.12s',
      }}
    >
      {/* Main row */}
      <div
        onClick={() => setExpanded(p => !p)}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 14px', cursor: 'pointer',
        }}
        onMouseEnter={e => e.currentTarget.style.background='rgba(0,229,255,0.03)'}
        onMouseLeave={e => e.currentTarget.style.background='transparent'}
      >
        {/* Expand */}
        <div style={{ color: '#3d5080', flexShrink: 0, width: 14 }}>
          {expanded
            ? <ChevronDown  size={12} />
            : <ChevronRight size={12} />}
        </div>

        {/* Timestamp */}
        <div style={{
          width: 130, flexShrink: 0,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11, color: '#3d5080',
        }}>
          {new Date(entry.timestamp).toLocaleString()}
        </div>

        {/* Action badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          width: 130, flexShrink: 0,
        }}>
          <div style={{
            width: 22, height: 22, borderRadius: 5, flexShrink: 0,
            background: `${color}15`,
            border: `1px solid ${color}28`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={11} color={color} />
          </div>
          <span style={{
            fontSize: 10, fontWeight: 700, color,
            fontFamily: 'JetBrains Mono, monospace',
            letterSpacing: '0.05em',
          }}>
            {cfg.label}
          </span>
        </div>

        {/* User */}
        <div style={{
          width: 150, flexShrink: 0,
          fontSize: 12, color: '#c8d8f0',
          fontFamily: 'JetBrains Mono, monospace',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {entry.user}
        </div>

        {/* Description */}
        <div style={{
          flex: 1, fontSize: 12.5, color: '#c8d8f0',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {entry.description}
        </div>

        {/* Risk level */}
        {entry.riskLevel && (
          <div style={{ flexShrink: 0 }}>
            <span style={{
              fontSize: 10, fontWeight: 600,
              color: RISK_COLOR[entry.riskLevel] || '#6b7fa3',
              background: `${RISK_COLOR[entry.riskLevel] || '#6b7fa3'}15`,
              border: `1px solid ${RISK_COLOR[entry.riskLevel] || '#6b7fa3'}30`,
              borderRadius: 4, padding: '1px 7px',
              fontFamily: 'JetBrains Mono, monospace',
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              {entry.riskLevel}
            </span>
          </div>
        )}

        {/* Hash integrity icon */}
        <div style={{ flexShrink: 0, width: 20, textAlign: 'center' }}>
          {entry.hash && (
            <div title="Entry integrity verified" style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#00ff88', margin: '0 auto',
              boxShadow: '0 0 5px rgba(0,255,136,0.6)',
            }} />
          )}
        </div>
      </div>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              margin: '0 14px 10px 40px',
              padding: '12px 14px',
              background: 'rgba(0,0,0,0.25)',
              border: '1px solid #1a2744', borderRadius: 8,
            }}>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr',
                gap: '8px 24px', marginBottom: 10,
              }}>
                {[
                  ['Event ID',     entry.id],
                  ['User',         entry.user],
                  ['IP Address',   entry.ip       || '—'],
                  ['User Agent',   entry.userAgent || '—'],
                  ['Session ID',   entry.sessionId || '—'],
                  ['Resource',     entry.resource  || '—'],
                  ['Risk Level',   entry.riskLevel || '—'],
                  ['Result',       entry.result    || '—'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontSize: 9.5, color: '#3d5080', marginBottom: 2 }}>
                      {k}
                    </div>
                    <div style={{
                      fontSize: 11.5, color: '#c8d8f0',
                      fontFamily: 'JetBrains Mono, monospace',
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}>
                      <span style={{
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {v}
                      </span>
                      {v !== '—' && (
                        <button onClick={() => copy(v)} style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: '#3d5080', padding: 2, flexShrink: 0,
                        }}>
                          <Copy size={10} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Entry hash */}
              {entry.hash && (
                <div style={{
                  padding: '8px 10px',
                  background: 'rgba(0,255,136,0.05)',
                  border: '1px solid rgba(0,255,136,0.15)',
                  borderRadius: 6,
                }}>
                  <div style={{ fontSize: 9.5, color: '#3d5080', marginBottom: 3 }}>
                    SHA-256 Integrity Hash (HMAC-verified)
                  </div>
                  <div style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 11, color: '#00ff88',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <span style={{ flex: 1, wordBreak: 'break-all' }}>
                      {entry.hash}
                    </span>
                    <button onClick={() => copy(entry.hash)} style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#3d5080', padding: 2, flexShrink: 0,
                    }}>
                      <Copy size={11} />
                    </button>
                  </div>
                </div>
              )}

              {/* Metadata */}
              {entry.metadata && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 9.5, color: '#3d5080', marginBottom: 4 }}>
                    Additional Metadata
                  </div>
                  <pre style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 11, color: '#00e5ff',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid #1a2744', borderRadius: 6,
                    padding: '8px 10px', margin: 0,
                    overflow: 'auto', maxHeight: 120,
                    lineHeight: 1.6,
                  }}>
                    {JSON.stringify(entry.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}