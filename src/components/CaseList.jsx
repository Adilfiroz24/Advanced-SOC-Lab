// ============================================================
// Advanced SOC Lab — CaseList.jsx
// TheHive-style case cards with task progress and MITRE tags
// ============================================================

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderOpen, User, Clock, CheckCircle,
  AlertCircle, Activity, ChevronDown, ChevronUp,
  Shield, Eye, ExternalLink,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// ── Severity config ───────────────────────────────────────
const SEV = {
  4: { label: 'Critical', color: '#ff2d6d', bg: 'rgba(255,45,109,0.12)', border: 'rgba(255,45,109,0.30)', left: '#ff2d6d' },
  3: { label: 'High',     color: '#ff8c00', bg: 'rgba(255,140,0,0.12)',  border: 'rgba(255,140,0,0.28)',  left: '#ff8c00' },
  2: { label: 'Medium',   color: '#ffd600', bg: 'rgba(255,214,0,0.10)', border: 'rgba(255,214,0,0.28)',  left: '#ffd600' },
  1: { label: 'Low',      color: '#00ff88', bg: 'rgba(0,255,136,0.08)', border: 'rgba(0,255,136,0.22)',  left: '#00ff88' },
};

// ── Status icon map ───────────────────────────────────────
const STATUS_ICON = {
  InProgress:    <Activity    size={13} color="#ff8c00" />,
  Resolved:      <CheckCircle size={13} color="#00ff88" />,
  New:           <AlertCircle size={13} color="#ff2d6d" />,
  FalsePositive: <CheckCircle size={13} color="#6b7fa3" />,
};

// ── Observable pill ───────────────────────────────────────
function ObsPill({ obs }) {
  const typeColor = {
    ip:     '#ff8c00',
    hash:   '#a855f7',
    url:    '#00e5ff',
    domain: '#ffd600',
    process:'#6b7fa3',
  }[obs.type] || '#6b7fa3';

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: `${typeColor}10`,
      border: `1px solid ${typeColor}28`,
      borderRadius: 5,
      padding: '2px 8px',
      fontSize: 10.5,
      fontFamily: 'JetBrains Mono, monospace',
    }}>
      <span style={{ color: typeColor, textTransform: 'uppercase', fontSize: 9 }}>
        {obs.type}
      </span>
      <span style={{ color: '#c8d8f0', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {obs.value}
      </span>
      {obs.ioc && obs.score != null && (
        <span style={{
          color: obs.score >= 80 ? '#ff2d6d' : obs.score >= 50 ? '#ff8c00' : '#6b7fa3',
          fontSize: 9.5, fontWeight: 700,
        }}>
          {obs.score}%
        </span>
      )}
    </div>
  );
}

// ── Single case card ──────────────────────────────────────
function CaseCard({ caseItem, index }) {
  const [expanded, setExpanded] = useState(false);
  const sev      = SEV[caseItem.severity] || SEV[2];
  const progress = Math.round((caseItem.tasks_done / caseItem.tasks_total) * 100) || 0;

  return (
    <motion.div
      className="glass-card"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, delay: index * 0.055 }}
      style={{
        padding: '14px 16px',
        borderLeft: `3px solid ${sev.left}`,
        cursor: 'pointer',
      }}
      whileHover={{
        boxShadow: `0 0 18px ${sev.color}18`,
        transition: { duration: 0.15 },
      }}
      onClick={() => setExpanded(prev => !prev)}
    >
      {/* ── Header ───────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', gap: 10,
        marginBottom: 8,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* ID + severity + priority */}
          <div style={{
            display: 'flex', alignItems: 'center',
            gap: 7, marginBottom: 5, flexWrap: 'wrap',
          }}>
            <span style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 10.5,
              color: sev.color,
              background: sev.bg,
              border: `1px solid ${sev.border}`,
              borderRadius: 4,
              padding: '1px 7px',
            }}>
              {caseItem.id}
            </span>
            <span style={{
              fontSize: 10.5, fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: sev.color,
            }}>
              {sev.label}
            </span>
            {caseItem.priority && (
              <span style={{
                fontSize: 10.5,
                background: 'rgba(0,229,255,0.08)',
                color: '#00e5ff',
                border: '1px solid rgba(0,229,255,0.20)',
                borderRadius: 4,
                padding: '1px 7px',
              }}>
                {caseItem.priority}
              </span>
            )}
          </div>

          {/* Title */}
          <div style={{
            fontSize: 14, fontWeight: 600,
            color: '#e8f4ff', marginBottom: 4,
            lineHeight: 1.35,
          }}>
            {caseItem.title}
          </div>

          {/* Summary */}
          <div style={{
            fontSize: 12, color: '#6b7fa3', lineHeight: 1.5,
          }}>
            {caseItem.summary
              ? caseItem.summary.slice(0, expanded ? undefined : 110) +
                (!expanded && caseItem.summary.length > 110 ? '…' : '')
              : ''}
          </div>
        </div>

        {/* Status + expand toggle */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'flex-end', gap: 8, flexShrink: 0,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            {STATUS_ICON[caseItem.status]}
            <span style={{ fontSize: 11.5, color: '#6b7fa3' }}>
              {caseItem.status}
            </span>
          </div>
          <div style={{ color: '#3d5080' }}>
            {expanded
              ? <ChevronUp   size={14} />
              : <ChevronDown size={14} />}
          </div>
        </div>
      </div>

      {/* ── MITRE tags ───────────────────────────────── */}
      {(caseItem.mitre?.length > 0) && (
        <div style={{
          display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10,
        }}>
          {caseItem.mitre.map(t => (
            <span key={t} className="mitre-tag">{t}</span>
          ))}
        </div>
      )}

      {/* ── Task progress + meta ─────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Progress bar */}
        <div style={{ flex: 1 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            marginBottom: 4,
          }}>
            <span style={{ fontSize: 10.5, color: '#3d5080' }}>
              Tasks
            </span>
            <span style={{
              fontSize: 10.5,
              fontFamily: 'JetBrains Mono, monospace',
              color: '#6b7fa3',
            }}>
              {caseItem.tasks_done}/{caseItem.tasks_total}
            </span>
          </div>
          <div className="progress-bar">
            <motion.div
              className="progress-fill"
              style={{
                background: progress === 100 ? '#00ff88' : sev.color,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, delay: index * 0.06 }}
            />
          </div>
        </div>

        {/* Assignee */}
        {caseItem.assigned_to && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 11.5, color: '#3d5080', flexShrink: 0,
          }}>
            <User size={11} />
            {caseItem.assigned_to}
          </div>
        )}

        {/* Created time */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 11.5, color: '#3d5080', flexShrink: 0,
        }}>
          <Clock size={11} />
          {formatDistanceToNow(new Date(caseItem.created_at), { addSuffix: true })}
        </div>
      </div>

      {/* ── Expanded: observables + tags ─────────────── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{   height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            {caseItem.observables?.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{
                  fontSize: 10.5, color: '#3d5080',
                  fontWeight: 600, letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: 7,
                  fontFamily: 'JetBrains Mono, monospace',
                }}>
                  Observables / IOCs
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {caseItem.observables.map((obs, i) => (
                    <ObsPill key={i} obs={obs} />
                  ))}
                </div>
              </div>
            )}

            {caseItem.tags?.length > 0 && (
              <div style={{
                marginTop: 10, display: 'flex',
                gap: 5, flexWrap: 'wrap',
              }}>
                {caseItem.tags.map(tag => (
                  <span key={tag} style={{
                    fontSize: 10,
                    color: '#4a6090',
                    background: 'rgba(74,96,144,0.12)',
                    border: '1px solid rgba(74,96,144,0.22)',
                    borderRadius: 4,
                    padding: '1px 7px',
                  }}>
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main list ─────────────────────────────────────────────
export default function CaseList({ cases = [] }) {
  if (cases.length === 0) {
    return (
      <div style={{
        textAlign: 'center', padding: '48px 0', color: '#3d5080',
      }}>
        <FolderOpen size={36} style={{ opacity: 0.25, margin: '0 auto 10px' }} />
        <div style={{ fontSize: 13 }}>No cases found</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {cases.map((c, i) => (
        <CaseCard key={c.id} caseItem={c} index={i} />
      ))}
    </div>
  );
}