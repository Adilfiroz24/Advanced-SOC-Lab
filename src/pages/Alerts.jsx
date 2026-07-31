// ============================================================
// Advanced SOC Lab — Alerts.jsx
// Full alert management page with filters and sort
// ============================================================

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Bell, Filter, Download, RefreshCw,
  Search, ChevronDown,
} from 'lucide-react';

import AlertTable             from '../components/AlertTable';
import StatsCard              from '../components/StatsCard';
import { mockAlerts, alertStats } from '../data/mockAlerts';

// ── Filter pill button ─────────────────────────────────────
function Pill({ label, active, onClick, color }) {
  const c = color || '#00e5ff';
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 12px',
        borderRadius: 9999,
        fontSize: 12,
        fontWeight: 500,
        cursor: 'pointer',
        border: '1px solid',
        outline: 'none',
        transition: 'all 0.14s',
        background: active ? `${c}18` : 'rgba(255,255,255,0.04)',
        color:      active ? c      : '#6b7fa3',
        borderColor: active ? `${c}40` : '#1a2744',
      }}
    >
      {label}
    </button>
  );
}

export default function Alerts() {
  const [sevFilter,  setSevFilter]  = useState('all');
  const [statFilter, setStatFilter] = useState('all');
  const [search,     setSearch]     = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const SEV_COLORS = {
    critical: '#ff2d6d',
    high:     '#ff8c00',
    medium:   '#ffd600',
    low:      '#00ff88',
  };

  // ── Filtered result ──────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return mockAlerts.filter(a => {
      if (sevFilter  !== 'all' && a.severity !== sevFilter)  return false;
      if (statFilter !== 'all' && a.status   !== statFilter) return false;
      if (q) {
        const haystack = [
          a.description, a.src_ip, a.agent_name,
          a.rule_id, ...(a.mitre || []),
        ].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [sevFilter, statFilter, search]);

  // ── Export CSV ───────────────────────────────────────────
  const exportCsv = () => {
    const header = 'id,timestamp,severity,rule_id,description,agent_name,src_ip,status,mitre';
    const rows = filtered.map(a =>
      [
        a.id, a.timestamp, a.severity, a.rule_id,
        `"${a.description}"`, a.agent_name,
        a.src_ip || '', a.status,
        (a.mitre || []).join('|'),
      ].join(',')
    );
    const csv  = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `soc-alerts-${Date.now()}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      key="alerts"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28 }}
    >
      {/* ── Page header ───────────────────────────────── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: 24,
      }}>
        <div>
          <h1 style={{
            fontSize: 22, fontWeight: 700, color: '#e8f4ff',
            margin: 0, display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <Bell size={20} color="#00e5ff" />
            Alert Management
          </h1>
          <div style={{ fontSize: 13, color: '#3d5080', marginTop: 4 }}>
            {filtered.length} of {mockAlerts.length} alerts &nbsp;·&nbsp;
            Wazuh rule engine &nbsp;·&nbsp; MITRE ATT&CK mapped
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn-cyber btn-ghost"
            onClick={() => setRefreshKey(k => k + 1)}
          >
            <RefreshCw size={13} /> Refresh
          </button>
          <button
            className="btn-cyber"
            onClick={exportCsv}
            style={{
              background: 'rgba(0,255,136,0.10)',
              color: '#00ff88',
              border: '1px solid rgba(0,255,136,0.25)',
              padding: '7px 14px',
            }}
          >
            <Download size={13} /> Export CSV
          </button>
        </div>
      </div>

      {/* ── Summary stat cards ────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: 10, marginBottom: 22,
      }}>
        {[
          { label: 'Total',      value: alertStats.total,       color: '#00e5ff' },
          { label: 'Critical',   value: alertStats.critical,    color: '#ff2d6d' },
          { label: 'High',       value: alertStats.high,        color: '#ff8c00' },
          { label: 'Medium',     value: alertStats.medium,      color: '#ffd600' },
          { label: 'Open',       value: alertStats.open,        color: '#ff2d6d' },
          { label: 'Resolved',   value: alertStats.resolved,    color: '#00ff88' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            className="glass-card"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            style={{ padding: '12px 14px', textAlign: 'center' }}
          >
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 24, fontWeight: 700,
              color: s.color,
            }}>
              {s.value}
            </div>
            <div style={{ fontSize: 11, color: '#3d5080', marginTop: 3 }}>
              {s.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Filter bar ────────────────────────────────── */}
      <div className="glass-card" style={{
        padding: '12px 16px', marginBottom: 14,
      }}>
        <div style={{
          display: 'flex', gap: 14,
          alignItems: 'center', flexWrap: 'wrap',
        }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={12} color="#4a6090" style={{
              position: 'absolute', left: 9,
              top: '50%', transform: 'translateY(-50%)',
              pointerEvents: 'none',
            }} />
            <input
              className="soc-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search description, IP, rule ID, MITRE…"
              style={{ paddingLeft: 28, height: 32, fontSize: 12.5 }}
            />
          </div>

          {/* Severity pills */}
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            <Filter size={12} color="#3d5080" />
            {['all', 'critical', 'high', 'medium', 'low'].map(s => (
              <Pill
                key={s}
                label={s === 'all' ? 'All' : s}
                active={sevFilter === s}
                onClick={() => setSevFilter(s)}
                color={SEV_COLORS[s] || '#00e5ff'}
              />
            ))}
          </div>

          {/* Status pills */}
          <div style={{ display: 'flex', gap: 5 }}>
            {['all', 'open', 'investigating', 'resolved'].map(s => (
              <Pill
                key={s}
                label={s === 'all' ? 'All Status' : s}
                active={statFilter === s}
                onClick={() => setStatFilter(s)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Alert table ───────────────────────────────── */}
      <div className="glass-card" style={{ overflow: 'hidden', padding: 0 }}>
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid #1a2744',
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: 12, color: '#3d5080' }}>
            Showing <strong style={{ color: '#c8d8f0' }}>{filtered.length}</strong> of{' '}
            <strong style={{ color: '#c8d8f0' }}>{mockAlerts.length}</strong> alerts
          </span>
          <span style={{
            fontSize: 11, color: '#3d5080',
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            Click row to expand details
          </span>
        </div>
        <AlertTable key={refreshKey} alerts={filtered} />
      </div>
    </motion.div>
  );
}