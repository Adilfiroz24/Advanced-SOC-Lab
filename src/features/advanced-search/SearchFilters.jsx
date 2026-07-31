import React from 'react';
import { SlidersHorizontal, X } from 'lucide-react';

const SEVERITY_OPTS  = ['critical','high','medium','low'];
const STATUS_OPTS    = ['open','investigating','resolved','false-positive'];
const SOURCE_OPTS    = ['wazuh','suricata','sysmon','cowrie','misp','virustotal'];
const MITRE_OPTS     = [
  'T1110.001','T1003.001','T1059.001','T1136.001',
  'T1098','T1490','T1046','T1190','T1047','T1105',
];

export default function SearchFilters({ filters, onChange, onReset }) {
  const set = (key, val) => onChange({ ...filters, [key]: val });
  const toggle = (key, val) => {
    const arr = filters[key] || [];
    onChange({
      ...filters,
      [key]: arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val],
    });
  };

  const hasActive = Object.values(filters).some(v =>
    Array.isArray(v) ? v.length > 0 : !!v
  );

  const Pill = ({ group, value, label }) => {
    const active = (filters[group] || []).includes(value);
    return (
      <button onClick={() => toggle(group, value)} style={{
        padding: '3px 10px', borderRadius: 9999,
        fontSize: 11, cursor: 'pointer', border: '1px solid',
        transition: 'all 0.14s',
        background: active ? 'rgba(0,229,255,0.14)' : 'rgba(255,255,255,0.04)',
        color:      active ? '#00e5ff'               : '#6b7fa3',
        borderColor:active ? 'rgba(0,229,255,0.32)'  : '#1a2744',
      }}>
        {label || value}
      </button>
    );
  };

  return (
    <div style={{
      background: 'rgba(13,21,48,0.85)',
      border: '1px solid #1a2744', borderRadius: 10,
      padding: '16px 18px',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 14,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
          fontSize: 13, fontWeight: 600, color: '#e8f4ff',
        }}>
          <SlidersHorizontal size={14} color="#00e5ff" />
          Filter Options
        </div>
        {hasActive && (
          <button onClick={onReset} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#6b7fa3', fontSize: 12,
            display: 'flex', alignItems: 'center', gap: 5,
          }}
            onMouseEnter={e => e.currentTarget.style.color='#ff2d6d'}
            onMouseLeave={e => e.currentTarget.style.color='#6b7fa3'}
          >
            <X size={12} /> Reset all
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Date range */}
        <div>
          <div style={{ fontSize: 11, color: '#3d5080', marginBottom: 7,
            fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em',
            fontFamily: 'JetBrains Mono, monospace' }}>
            Time Range
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['15m','1h','6h','24h','7d','30d'].map(t => (
              <button key={t} onClick={() => set('timeRange', t)} style={{
                padding: '3px 10px', borderRadius: 9999, fontSize: 11,
                cursor: 'pointer', border: '1px solid', transition: 'all 0.14s',
                background: filters.timeRange===t ? 'rgba(0,229,255,0.14)' : 'rgba(255,255,255,0.04)',
                color:      filters.timeRange===t ? '#00e5ff'               : '#6b7fa3',
                borderColor:filters.timeRange===t ? 'rgba(0,229,255,0.32)'  : '#1a2744',
              }}>Last {t}</button>
            ))}
          </div>
        </div>

        {/* Severity */}
        <div>
          <div style={{ fontSize: 11, color: '#3d5080', marginBottom: 7,
            fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em',
            fontFamily: 'JetBrains Mono, monospace' }}>
            Severity
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {SEVERITY_OPTS.map(s => (
              <Pill key={s} group="severity" value={s} />
            ))}
          </div>
        </div>

        {/* Status */}
        <div>
          <div style={{ fontSize: 11, color: '#3d5080', marginBottom: 7,
            fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em',
            fontFamily: 'JetBrains Mono, monospace' }}>
            Status
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {STATUS_OPTS.map(s => <Pill key={s} group="status" value={s} />)}
          </div>
        </div>

        {/* Source */}
        <div>
          <div style={{ fontSize: 11, color: '#3d5080', marginBottom: 7,
            fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em',
            fontFamily: 'JetBrains Mono, monospace' }}>
            Data Source
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {SOURCE_OPTS.map(s => <Pill key={s} group="source" value={s} />)}
          </div>
        </div>

        {/* MITRE */}
        <div>
          <div style={{ fontSize: 11, color: '#3d5080', marginBottom: 7,
            fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em',
            fontFamily: 'JetBrains Mono, monospace' }}>
            MITRE Technique
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {MITRE_OPTS.map(t => <Pill key={t} group="mitre" value={t} />)}
          </div>
        </div>

        {/* Agent */}
        <div>
          <div style={{ fontSize: 11, color: '#3d5080', marginBottom: 7,
            fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em',
            fontFamily: 'JetBrains Mono, monospace' }}>
            Agent / Host
          </div>
          <input className="soc-input"
            value={filters.agent || ''}
            onChange={e => set('agent', e.target.value)}
            placeholder="Filter by agent name or IP…"
            style={{ height: 30, fontSize: 12 }}
          />
        </div>

        {/* Rule ID */}
        <div>
          <div style={{ fontSize: 11, color: '#3d5080', marginBottom: 7,
            fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em',
            fontFamily: 'JetBrains Mono, monospace' }}>
            Rule ID
          </div>
          <input className="soc-input"
            value={filters.ruleId || ''}
            onChange={e => set('ruleId', e.target.value)}
            placeholder="e.g. 100001 or 100001-100020"
            style={{ height: 30, fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}
          />
        </div>
      </div>
    </div>
  );
}