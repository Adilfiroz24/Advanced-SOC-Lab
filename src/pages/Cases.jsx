// ============================================================
// Advanced SOC Lab — Cases.jsx
// Incident case management page — TheHive style
// ============================================================

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  FolderOpen, Filter, Plus,
  CheckCircle, Clock, AlertCircle,
} from 'lucide-react';

import CaseList               from '../components/CaseList';
import { mockCases, caseStats } from '../data/mockCases';

// ── Filter pill ───────────────────────────────────────────
function Pill({ label, active, onClick, color }) {
  const c = color || '#00e5ff';
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 14px',
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

// ── Stat mini-card ────────────────────────────────────────
function MiniStat({ label, value, color, icon: Icon }) {
  return (
    <motion.div
      className="glass-card"
      style={{ padding: '14px 16px' }}
      whileHover={{ borderColor: '#243660' }}
      transition={{ duration: 0.13 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {Icon && (
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: `${color}15`,
            border: `1px solid ${color}28`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Icon size={15} color={color} />
          </div>
        )}
        <div>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 22, fontWeight: 700, color, lineHeight: 1,
          }}>
            {value}
          </div>
          <div style={{ fontSize: 11.5, color: '#3d5080', marginTop: 3 }}>
            {label}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Cases() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [sevFilter,    setSevFilter]    = useState('all');

  const STATUS_FILTERS = [
    { val: 'all',           label: 'All Cases'       },
    { val: 'InProgress',    label: 'In Progress'     },
    { val: 'Resolved',      label: 'Resolved'        },
    { val: 'FalsePositive', label: 'False Positive'  },
  ];

  const SEV_FILTERS = [
    { val: 'all', label: 'All',      color: '#00e5ff' },
    { val: '4',   label: 'Critical', color: '#ff2d6d' },
    { val: '3',   label: 'High',     color: '#ff8c00' },
    { val: '2',   label: 'Medium',   color: '#ffd600' },
    { val: '1',   label: 'Low',      color: '#00ff88' },
  ];

  const filtered = useMemo(() => {
    return mockCases.filter(c => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (sevFilter    !== 'all' && String(c.severity) !== sevFilter) return false;
      return true;
    });
  }, [statusFilter, sevFilter]);

  return (
    <motion.div
      key="cases"
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
            <FolderOpen size={20} color="#00e5ff" />
            Case Management
          </h1>
          <div style={{ fontSize: 13, color: '#3d5080', marginTop: 4 }}>
            TheHive 5 integration &nbsp;·&nbsp;
            Auto-created from Wazuh alerts &nbsp;·&nbsp;
            {filtered.length} cases shown
          </div>
        </div>

        {/* New case button */}
        <button
          className="btn-cyber btn-primary"
          style={{ fontSize: 12.5 }}
        >
          <Plus size={14} /> New Case
        </button>
      </div>

      {/* ── Stats row ─────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 12, marginBottom: 22,
      }}>
        <MiniStat
          label="Total Cases"
          value={caseStats.total}
          color="#00e5ff"
          icon={FolderOpen}
        />
        <MiniStat
          label="Critical / P1"
          value={caseStats.critical}
          color="#ff2d6d"
          icon={AlertCircle}
        />
        <MiniStat
          label="In Progress"
          value={caseStats.open}
          color="#ff8c00"
          icon={Clock}
        />
        <MiniStat
          label="Avg Completion"
          value={`${caseStats.avg_tasks_completion}%`}
          color="#00ff88"
          icon={CheckCircle}
        />
      </div>

      {/* ── SLA indicators ────────────────────────────── */}
      <div className="glass-card" style={{
        padding: '12px 16px', marginBottom: 16,
      }}>
        <div style={{
          display: 'flex', gap: 24,
          fontSize: 12.5, color: '#6b7fa3', flexWrap: 'wrap',
        }}>
          {[
            { label: 'P1 SLA (MTTR ≤ 60m)', passing: true,  current: '48m' },
            { label: 'P2 SLA (MTTR ≤ 240m)',passing: true,  current: '195m'},
            { label: 'P3 SLA (MTTR ≤ 480m)',passing: true,  current: '380m'},
            { label: 'False Positive Rate',  passing: true,  current: '16%' },
          ].map(sla => (
            <div key={sla.label} style={{
              display: 'flex', alignItems: 'center', gap: 7,
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: sla.passing ? '#00ff88' : '#ff2d6d',
                boxShadow: sla.passing
                  ? '0 0 6px rgba(0,255,136,0.5)'
                  : '0 0 6px rgba(255,45,109,0.5)',
                display: 'inline-block',
                flexShrink: 0,
              }} />
              <span>{sla.label}</span>
              <span style={{
                color: sla.passing ? '#00ff88' : '#ff2d6d',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 12,
                fontWeight: 600,
              }}>
                {sla.current}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Filter row ────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 10,
        alignItems: 'center', marginBottom: 16,
        flexWrap: 'wrap',
      }}>
        <Filter size={13} color="#3d5080" />

        {/* Status filters */}
        <div style={{ display: 'flex', gap: 5 }}>
          {STATUS_FILTERS.map(f => (
            <Pill
              key={f.val}
              label={f.label}
              active={statusFilter === f.val}
              onClick={() => setStatusFilter(f.val)}
            />
          ))}
        </div>

        {/* Divider */}
        <div style={{
          width: 1, height: 18,
          background: '#1a2744',
        }} />

        {/* Severity filters */}
        <div style={{ display: 'flex', gap: 5 }}>
          {SEV_FILTERS.map(f => (
            <Pill
              key={f.val}
              label={f.label}
              active={sevFilter === f.val}
              onClick={() => setSevFilter(f.val)}
              color={f.color}
            />
          ))}
        </div>

        {/* Result count */}
        <span style={{
          marginLeft: 'auto',
          fontSize: 11.5, color: '#3d5080',
          fontFamily: 'JetBrains Mono, monospace',
        }}>
          {filtered.length} / {mockCases.length} cases
        </span>
      </div>

      {/* ── Case list ─────────────────────────────────── */}
      <CaseList cases={filtered} />

      {/* Empty state */}
      {filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            textAlign: 'center', padding: '56px 0', color: '#3d5080',
          }}
        >
          <FolderOpen
            size={40}
            style={{ opacity: 0.22, margin: '0 auto 12px' }}
          />
          <div style={{ fontSize: 14, marginBottom: 6 }}>
            No cases match the current filter
          </div>
          <div style={{ fontSize: 12 }}>
            Try selecting a different status or severity
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}