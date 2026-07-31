// ============================================================
// Advanced SOC Lab — AlertTable.jsx
// Sortable, expandable alert table with severity badges
// ============================================================

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronUp, ChevronDown, Clock, Shield,
  ChevronRight, ExternalLink,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// ── Severity sort order (critical first) ──────────────────
const SEV_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

// ── Badge components ──────────────────────────────────────
function SeverityBadge({ severity }) {
  return (
    <span className={`badge badge-${severity || 'info'}`}>
      {severity || 'unknown'}
    </span>
  );
}

function StatusBadge({ status }) {
  const cls = {
    open:          'badge-open',
    investigating: 'badge-investigating',
    resolved:      'badge-resolved',
    'false-positive': 'badge-fp',
  }[status] || 'badge-info';
  return <span className={`badge ${cls}`}>{status}</span>;
}

function MitreTags({ mitre = [] }) {
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {mitre.map(t => (
        <span key={t} className="mitre-tag">{t}</span>
      ))}
    </div>
  );
}

// ── Sort header cell ──────────────────────────────────────
function SortTh({ label, col, sortKey, sortDir, onSort, style = {} }) {
  const active = sortKey === col;
  return (
    <th
      onClick={() => onSort(col)}
      style={{ ...style, cursor: 'pointer', userSelect: 'none' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {label}
        {active
          ? (sortDir === 'asc'
            ? <ChevronUp   size={11} color="#00e5ff" />
            : <ChevronDown size={11} color="#00e5ff" />)
          : <ChevronUp size={11} style={{ opacity: 0.2 }} />}
      </div>
    </th>
  );
}

// ── Expanded detail row ───────────────────────────────────
function AlertDetail({ alert }) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{   height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{ overflow: 'hidden' }}
    >
      <div style={{
        margin: '6px 0 8px 0',
        padding: '12px 14px',
        background: 'rgba(0,229,255,0.04)',
        border: '1px solid rgba(0,229,255,0.12)',
        borderRadius: 8,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '8px 20px',
        fontSize: 12,
      }}>
        {[
          ['Rule ID',    alert.rule_id,     '#00e5ff'],
          ['Rule Level', `${alert.rule_level}/15`, '#00e5ff'],
          ['Agent Name', alert.agent_name,  '#c8d8f0'],
          ['Agent IP',   alert.agent_ip,    '#c8d8f0'],
          ['Source IP',  alert.src_ip || '—', '#ff8c00'],
          ['Dest IP',    alert.dst_ip || '—', '#c8d8f0'],
          ['Tactic',     alert.mitre_tactic || '—', '#a855f7'],
          ['Hit count',  alert.count ?? 1,  '#c8d8f0'],
          ['Groups',     (alert.groups || []).slice(0,3).join(', ') || '—', '#6b7fa3'],
        ].map(([k, v, col]) => (
          <div key={k}>
            <span style={{ color: '#3d5080', marginRight: 6 }}>{k}:</span>
            <span style={{
              color: col,
              fontFamily: typeof v === 'number' || /^\d+\.\d+/.test(String(v))
                ? 'JetBrains Mono, monospace'
                : 'inherit',
              fontSize: 12,
            }}>
              {String(v)}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────
/**
 * AlertTable
 *
 * Props:
 *   alerts   array   Alert objects from mockAlerts.js
 *   compact  bool    If true, hides agent/IP columns
 */
export default function AlertTable({ alerts = [], compact = false }) {
  const [sortKey, setSortKey] = useState('timestamp');
  const [sortDir, setSortDir] = useState('desc');
  const [expanded, setExpanded] = useState(null);   // expanded row id

  // ── Sort ────────────────────────────────────────────────
  const handleSort = (col) => {
    if (sortKey === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(col); setSortDir('desc'); }
  };

  const sorted = useMemo(() => {
    return [...alerts].sort((a, b) => {
      let av = a[sortKey];
      let bv = b[sortKey];

      if (sortKey === 'severity') {
        av = SEV_ORDER[av] ?? 99;
        bv = SEV_ORDER[bv] ?? 99;
      } else if (sortKey === 'timestamp') {
        av = new Date(av).getTime();
        bv = new Date(bv).getTime();
      } else if (sortKey === 'rule_level') {
        av = Number(av);
        bv = Number(bv);
      } else {
        av = String(av ?? '').toLowerCase();
        bv = String(bv ?? '').toLowerCase();
      }

      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ?  1 : -1;
      return 0;
    });
  }, [alerts, sortKey, sortDir]);

  const toggleExpand = (id) =>
    setExpanded(prev => (prev === id ? null : id));

  const thProps = { sortKey, sortDir, onSort: handleSort };

  if (alerts.length === 0) {
    return (
      <div style={{
        textAlign: 'center', padding: '48px 0', color: '#3d5080',
      }}>
        <Shield size={36} style={{ opacity: 0.25, margin: '0 auto 10px' }} />
        <div style={{ fontSize: 13 }}>No alerts match the current filter</div>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="soc-table" style={{ tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: 106 }} />
          <col style={{ width: 115 }} />
          {!compact && <col style={{ width: 74 }} />}
          <col />
          {!compact && <col style={{ width: 130 }} />}
          {!compact && <col style={{ width: 120 }} />}
          <col style={{ width: 140 }} />
          <col style={{ width: 110 }} />
          <col style={{ width: 30 }} />
        </colgroup>

        <thead>
          <tr>
            <SortTh label="SEVERITY"    col="severity"   {...thProps} />
            <SortTh label="TIME"        col="timestamp"  {...thProps} />
            {!compact && <SortTh label="RULE"  col="rule_id"    {...thProps} />}
            <SortTh label="DESCRIPTION" col="description" {...thProps} />
            {!compact && <SortTh label="AGENT" col="agent_name" {...thProps} />}
            {!compact && <SortTh label="SRC IP" col="src_ip"   {...thProps} />}
            <SortTh label="MITRE"       col="mitre_tactic" {...thProps} />
            <SortTh label="STATUS"      col="status"     {...thProps} />
            <th />
          </tr>
        </thead>

        <tbody>
          <AnimatePresence initial={false}>
            {sorted.map((alert, i) => {
              const isOpen = expanded === alert.id;
              return (
                <React.Fragment key={alert.id}>
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.12, delay: i * 0.008 }}
                    onClick={() => toggleExpand(alert.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Severity */}
                    <td>
                      <SeverityBadge severity={alert.severity} />
                    </td>

                    {/* Timestamp */}
                    <td>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        fontSize: 11.5,
                        color: '#6b7fa3',
                        fontFamily: 'JetBrains Mono, monospace',
                        whiteSpace: 'nowrap',
                      }}>
                        <Clock size={10} />
                        {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                      </div>
                    </td>

                    {/* Rule ID */}
                    {!compact && (
                      <td>
                        <span style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: 11.5, color: '#6b7fa3',
                        }}>
                          {alert.rule_id}
                        </span>
                      </td>
                    )}

                    {/* Description */}
                    <td>
                      <div style={{
                        fontSize: 13, color: '#c8d8f0', fontWeight: 500,
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                        title={alert.description}
                      >
                        {alert.description}
                      </div>
                    </td>

                    {/* Agent */}
                    {!compact && (
                      <td>
                        <span style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: 11.5, color: '#6b7fa3',
                        }}>
                          {alert.agent_name || '—'}
                        </span>
                      </td>
                    )}

                    {/* Source IP */}
                    {!compact && (
                      <td>
                        <span style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: 11.5,
                          color: alert.src_ip ? '#ff8c00' : '#3d5080',
                        }}>
                          {alert.src_ip || '—'}
                        </span>
                      </td>
                    )}

                    {/* MITRE tags */}
                    <td>
                      <MitreTags mitre={alert.mitre || []} />
                    </td>

                    {/* Status */}
                    <td>
                      <StatusBadge status={alert.status} />
                    </td>

                    {/* Expand chevron */}
                    <td style={{ textAlign: 'center' }}>
                      <motion.div
                        animate={{ rotate: isOpen ? 90 : 0 }}
                        transition={{ duration: 0.18 }}
                        style={{ display: 'inline-flex', color: '#3d5080' }}
                      >
                        <ChevronRight size={13} />
                      </motion.div>
                    </td>
                  </motion.tr>

                  {/* Expanded detail row */}
                  {isOpen && (
                    <tr key={`${alert.id}-detail`}>
                      <td
                        colSpan={compact ? 6 : 9}
                        style={{ padding: '0 14px', borderBottom: 'none' }}
                      >
                        <AnimatePresence>
                          <AlertDetail alert={alert} />
                        </AnimatePresence>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
}