import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Terminal, AlertTriangle, ChevronRight,
  ChevronDown, Shield, Clock, Hash, User,
  Copy, ExternalLink,
} from 'lucide-react';

export default function ProcessNode({ node, depth = 0, isLast = false }) {
  const [expanded,  setExpanded]  = useState(depth < 2);
  const [showDetail,setShowDetail] = useState(false);

  const hasChildren = node.children?.length > 0;
  const isSuspicious = node.suspicious;

  const borderColor = isSuspicious ? '#ff2d6d' : '#1a2744';
  const bgColor     = isSuspicious
    ? 'rgba(255,45,109,0.06)'
    : depth === 0
      ? 'rgba(0,229,255,0.04)'
      : 'rgba(13,21,48,0.60)';
  const nameColor   = isSuspicious ? '#ff2d6d' : '#e8f4ff';

  const copy = (text) => navigator.clipboard?.writeText(text);

  return (
    <div style={{ position: 'relative' }}>
      {/* Connector lines */}
      {depth > 0 && (
        <>
          {/* Horizontal connector */}
          <div style={{
            position: 'absolute',
            left: -16, top: 20,
            width: 16, height: 1,
            background: '#1a2744',
          }} />
          {/* Vertical connector (not for last child) */}
          {!isLast && (
            <div style={{
              position: 'absolute',
              left: -16, top: 20,
              width: 1,
              height: '100%',
              background: '#1a2744',
            }} />
          )}
        </>
      )}

      {/* Node card */}
      <motion.div
        initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.18, delay: depth * 0.04 }}
        style={{ marginBottom: 6 }}
      >
        <div
          style={{
            display: 'flex', alignItems: 'flex-start', gap: 8,
            background: bgColor,
            border: `1px solid ${borderColor}`,
            borderLeft: isSuspicious
              ? `3px solid #ff2d6d`
              : `3px solid ${depth === 0 ? '#00e5ff' : '#243660'}`,
            borderRadius: 8, padding: '9px 12px',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onClick={() => {
            if (hasChildren) setExpanded(p => !p);
            setShowDetail(p => !p);
          }}
        >
          {/* Expand toggle */}
          <div style={{ color: '#3d5080', flexShrink: 0, marginTop: 2, width: 14 }}>
            {hasChildren
              ? (expanded
                  ? <ChevronDown  size={13} />
                  : <ChevronRight size={13} />)
              : null
            }
          </div>

          {/* Icon */}
          {isSuspicious
            ? <AlertTriangle size={13} color="#ff2d6d"
                style={{ flexShrink: 0, marginTop: 2 }} />
            : <Terminal size={13} color={depth === 0 ? '#00e5ff' : '#6b7fa3'}
                style={{ flexShrink: 0, marginTop: 2 }} />
          }

          {/* Process info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Name + PID */}
            <div style={{
              display: 'flex', alignItems: 'center',
              gap: 8, flexWrap: 'wrap',
            }}>
              <span style={{
                fontSize: 13, fontWeight: 600,
                color: nameColor,
                fontFamily: 'JetBrains Mono, monospace',
              }}>
                {node.name}
              </span>
              <span style={{
                fontSize: 10.5, color: '#3d5080',
                fontFamily: 'JetBrains Mono, monospace',
              }}>
                PID: {node.pid}
              </span>
              {node.ppid && (
                <span style={{
                  fontSize: 10, color: '#243660',
                  fontFamily: 'JetBrains Mono, monospace',
                }}>
                  PPID: {node.ppid}
                </span>
              )}
              {isSuspicious && (
                <span style={{
                  fontSize: 9.5, fontWeight: 700,
                  color: '#ff2d6d',
                  background: 'rgba(255,45,109,0.12)',
                  border: '1px solid rgba(255,45,109,0.28)',
                  borderRadius: 4, padding: '1px 6px',
                  letterSpacing: '0.05em',
                }}>
                  SUSPICIOUS
                </span>
              )}
              {node.integrity && (
                <span style={{
                  fontSize: 9.5, color: '#6b7fa3',
                  background: 'rgba(107,127,163,0.10)',
                  border: '1px solid rgba(107,127,163,0.20)',
                  borderRadius: 4, padding: '1px 6px',
                }}>
                  {node.integrity}
                </span>
              )}
            </div>

            {/* Command line */}
            {node.cmd && (
              <div style={{
                fontSize: 11, color: '#6b7fa3', marginTop: 3,
                fontFamily: 'JetBrains Mono, monospace',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {node.cmd}
              </div>
            )}

            {/* Expanded detail */}
            <AnimatePresence>
              {showDetail && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{
                    marginTop: 10,
                    padding: '10px 12px',
                    background: 'rgba(0,0,0,0.25)',
                    border: '1px solid #1a2744', borderRadius: 7,
                    display: 'grid', gridTemplateColumns: '1fr 1fr',
                    gap: '6px 16px',
                  }}>
                    {[
                      ['User',       node.user       || '—'],
                      ['Start Time', node.startTime  || '—'],
                      ['Image Path', node.path       || '—'],
                      ['SHA256',     node.hash
                        ? node.hash.slice(0,16) + '…'
                        : '—'],
                      ['MITRE',      (node.mitre || []).join(', ') || '—'],
                      ['Rule',       node.rule || '—'],
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
                            whiteSpace: 'nowrap', maxWidth: 180,
                          }}>
                            {v}
                          </span>
                          {v !== '—' && (
                            <button onClick={(e) => { e.stopPropagation(); copy(v); }}
                              style={{
                                background: 'none', border: 'none',
                                cursor: 'pointer', color: '#3d5080',
                                padding: 2, flexShrink: 0,
                              }}>
                              <Copy size={10} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: timing */}
          {node.startTime && (
            <div style={{
              fontSize: 10, color: '#3d5080', flexShrink: 0,
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <Clock size={9} />
              {node.startTime}
            </div>
          )}
        </div>
      </motion.div>

      {/* Children */}
      <AnimatePresence>
        {hasChildren && expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              overflow: 'hidden',
              marginLeft: 24,
              paddingLeft: 16,
              borderLeft: '1px solid #1a2744',
              position: 'relative',
            }}
          >
            {node.children.map((child, i) => (
              <ProcessNode
                key={child.pid}
                node={child}
                depth={depth + 1}
                isLast={i === node.children.length - 1}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}