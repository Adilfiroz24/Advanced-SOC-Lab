// ============================================================
// Advanced SOC Lab — ThreatIntel.jsx
// Threat intelligence page: MISP IOC feed + MITRE coverage
// ============================================================

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Globe, Download, Filter, RefreshCw,
  Shield, AlertTriangle, CheckCircle, Hash, Link,
} from 'lucide-react';

import { ThreatFeed }  from '../components/ThreatFeed';
import MITREHeatmap    from '../components/MITREHeatmap';
import {
  mockThreatIntel,
  mitreCoverage,
  feedSummary,
} from '../data/mockThreatIntel';

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
        background:  active ? `${c}18` : 'rgba(255,255,255,0.04)',
        color:       active ? c        : '#6b7fa3',
        borderColor: active ? `${c}40` : '#1a2744',
      }}
    >
      {label}
    </button>
  );
}

// ── IOC type icon map ─────────────────────────────────────
const TYPE_ICONS = {
  ip:     <Globe  size={14} />,
  hash:   <Hash   size={14} />,
  url:    <Link   size={14} />,
  domain: <Globe  size={14} />,
};

// ── Confidence color ──────────────────────────────────────
const confColor = (score) => {
  if (score >= 90) return '#ff2d6d';
  if (score >= 70) return '#ff8c00';
  if (score >= 50) return '#ffd600';
  return '#6b7fa3';
};

// ── Stat mini-card ────────────────────────────────────────
function MiniStat({ label, value, color, icon: Icon }) {
  return (
    <div className="glass-card" style={{ padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {Icon && (
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: `${color}14`,
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
    </div>
  );
}

// ── IOC detail row ────────────────────────────────────────
function IOCDetailRow({ ioc }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      className="glass-card"
      style={{ padding: '12px 14px', cursor: 'pointer' }}
      whileHover={{ borderColor: '#243660' }}
      transition={{ duration: 0.12 }}
      onClick={() => setExpanded(p => !p)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Type icon */}
        <div style={{
          width: 32, height: 32, borderRadius: 7, flexShrink: 0,
          background: 'rgba(0,229,255,0.08)',
          border: '1px solid rgba(0,229,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#00e5ff',
        }}>
          {TYPE_ICONS[ioc.type] || <Shield size={13} />}
        </div>

        {/* Value + meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 12.5,
            color: ioc.blocked ? '#6b7fa3' : '#e8f4ff',
            textDecoration: ioc.blocked ? 'line-through' : 'none',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {ioc.value}
          </div>
          <div style={{
            display: 'flex', gap: 7, marginTop: 3,
            fontSize: 11, color: '#3d5080', flexWrap: 'wrap',
          }}>
            <span style={{
              background: 'rgba(74,96,144,0.14)',
              border: '1px solid rgba(74,96,144,0.22)',
              borderRadius: 3, padding: '0 5px',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 9.5, textTransform: 'uppercase',
            }}>
              {ioc.type}
            </span>
            <span>{ioc.threat_type}</span>
            {ioc.country && <><span>·</span><span>{ioc.country}</span></>}
            <span>·</span>
            <span>{ioc.source}</span>
            {ioc.reports != null && (
              <><span>·</span><span>{ioc.reports.toLocaleString()} reports</span></>
            )}
          </div>
        </div>

        {/* Confidence + status */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'flex-end', gap: 4, flexShrink: 0,
        }}>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 15, fontWeight: 700,
            color: confColor(ioc.confidence),
          }}>
            {ioc.confidence}%
          </div>
          {ioc.blocked ? (
            <span style={{
              fontSize: 10.5, color: '#00ff88',
              display: 'flex', alignItems: 'center', gap: 3,
            }}>
              <CheckCircle size={10} /> Blocked
            </span>
          ) : (
            <span style={{
              fontSize: 10.5, color: '#ff2d6d',
              display: 'flex', alignItems: 'center', gap: 3,
            }}>
              <AlertTriangle size={10} /> Active
            </span>
          )}
        </div>
      </div>

      {/* MITRE tags */}
      {ioc.mitre?.length > 0 && (
        <div style={{ marginTop: 7, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {ioc.mitre.map(t => (
            <span key={t} className="mitre-tag">{t}</span>
          ))}
        </div>
      )}

      {/* Expanded detail */}
      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.18 }}
          style={{ overflow: 'hidden' }}
        >
          <div style={{
            marginTop: 10,
            padding: '10px 12px',
            background: 'rgba(0,229,255,0.04)',
            border: '1px solid rgba(0,229,255,0.10)',
            borderRadius: 7,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '6px 16px',
            fontSize: 11.5,
          }}>
            {[
              ['Source',      ioc.source],
              ['Country',     ioc.country_name || ioc.country || '—'],
              ['ISP',         ioc.isp || '—'],
              ['First Seen',  new Date(ioc.first_seen).toLocaleDateString()],
              ['Last Seen',   new Date(ioc.last_seen).toLocaleDateString()],
              ['TOR Exit',    ioc.is_tor ? 'Yes' : 'No'],
            ].map(([k, v]) => (
              <div key={k}>
                <span style={{ color: '#3d5080' }}>{k}: </span>
                <span style={{ color: '#c8d8f0' }}>{v}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────
export default function ThreatIntel() {
  const [typeFilter, setTypeFilter] = useState('all');
  const [showBlocked, setShowBlocked] = useState(true);
  const [minConf, setMinConf] = useState(0);
  const [view, setView] = useState('feed'); // 'feed' | 'heatmap'

  const TYPES = ['all', 'ip', 'hash', 'url', 'domain'];

  const filtered = useMemo(() => {
    return mockThreatIntel.filter(ioc => {
      if (typeFilter !== 'all' && ioc.type !== typeFilter) return false;
      if (!showBlocked && ioc.blocked) return false;
      if (ioc.confidence < minConf) return false;
      return true;
    });
  }, [typeFilter, showBlocked, minConf]);

  // Export IOCs as JSON
  const exportJson = () => {
    const blob = new Blob(
      [JSON.stringify(filtered, null, 2)],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `soc-iocs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      key="threat-intel"
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
            <Globe size={20} color="#00e5ff" />
            Threat Intelligence
          </h1>
          <div style={{ fontSize: 13, color: '#3d5080', marginTop: 4 }}>
            MISP &nbsp;·&nbsp; AbuseIPDB &nbsp;·&nbsp; VirusTotal &nbsp;·&nbsp;
            Last updated: {new Date(feedSummary.last_updated).toLocaleTimeString()}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-cyber btn-ghost">
            <RefreshCw size={13} /> Sync Feeds
          </button>
          <button
            className="btn-cyber btn-primary"
            onClick={exportJson}
          >
            <Download size={13} /> Export IOCs
          </button>
        </div>
      </div>

      {/* ── Summary stats ─────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 12, marginBottom: 22,
      }}>
        <MiniStat
          label="Total IOCs"
          value={feedSummary.total_iocs}
          color="#00e5ff"
          icon={Shield}
        />
        <MiniStat
          label="High Confidence (≥ 80%)"
          value={feedSummary.high_confidence}
          color="#ff2d6d"
          icon={AlertTriangle}
        />
        <MiniStat
          label="Blocked"
          value={feedSummary.blocked}
          color="#00ff88"
          icon={CheckCircle}
        />
        <MiniStat
          label="Active Threats"
          value={feedSummary.active_threats}
          color="#ff8c00"
          icon={AlertTriangle}
        />
      </div>

      {/* ── View toggle ───────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: 16,
      }}>
        <Pill
          label="IOC Feed"
          active={view === 'feed'}
          onClick={() => setView('feed')}
        />
        <Pill
          label="ATT&CK Coverage"
          active={view === 'heatmap'}
          onClick={() => setView('heatmap')}
        />
      </div>

      {view === 'feed' ? (
        <>
          {/* ── Filter bar ──────────────────────────── */}
          <div className="glass-card" style={{
            padding: '12px 16px', marginBottom: 14,
          }}>
            <div style={{
              display: 'flex', gap: 14,
              alignItems: 'center', flexWrap: 'wrap',
            }}>
              <Filter size={12} color="#3d5080" />

              {/* Type filter */}
              <div style={{ display: 'flex', gap: 5 }}>
                {TYPES.map(t => (
                  <Pill
                    key={t}
                    label={t === 'all' ? 'All Types' : t.toUpperCase()}
                    active={typeFilter === t}
                    onClick={() => setTypeFilter(t)}
                  />
                ))}
              </div>

              {/* Divider */}
              <div style={{ width: 1, height: 18, background: '#1a2744' }} />

              {/* Confidence filter */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, fontSize: 12,
              }}>
                <span style={{ color: '#6b7fa3' }}>Min confidence:</span>
                {[0, 50, 70, 90].map(v => (
                  <Pill
                    key={v}
                    label={v === 0 ? 'All' : `${v}%+`}
                    active={minConf === v}
                    onClick={() => setMinConf(v)}
                  />
                ))}
              </div>

              {/* Show blocked toggle */}
              <label style={{
                display: 'flex', alignItems: 'center', gap: 7,
                fontSize: 12, color: '#6b7fa3', cursor: 'pointer',
                marginLeft: 'auto',
              }}>
                <input
                  type="checkbox"
                  checked={showBlocked}
                  onChange={e => setShowBlocked(e.target.checked)}
                  style={{ accentColor: '#00e5ff' }}
                />
                Show blocked
              </label>
            </div>
          </div>

          {/* Result count */}
          <div style={{
            marginBottom: 12, fontSize: 12, color: '#3d5080',
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            Showing {filtered.length} of {mockThreatIntel.length} IOCs
          </div>

          {/* ── IOC list ────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map((ioc, i) => (
              <motion.div
                key={ioc.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.16, delay: i * 0.03 }}
              >
                <IOCDetailRow ioc={ioc} />
              </motion.div>
            ))}
            {filtered.length === 0 && (
              <div style={{
                textAlign: 'center', padding: '48px 0', color: '#3d5080',
              }}>
                <Globe size={36} style={{ opacity: 0.22, margin: '0 auto 10px' }} />
                <div style={{ fontSize: 13 }}>No IOCs match the current filter</div>
              </div>
            )}
          </div>
        </>
      ) : (
        /* ── MITRE heatmap view ─────────────────────── */
        <div className="glass-card" style={{ padding: '20px 22px' }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{
              fontSize: 14.5, fontWeight: 600, color: '#e8f4ff',
            }}>
              ATT&CK Detection Coverage
            </div>
            <div style={{ fontSize: 11.5, color: '#3d5080', marginTop: 3 }}>
              Wazuh rules mapped to MITRE ATT&CK Enterprise v14
              &nbsp;·&nbsp; Hover cells for details
            </div>
          </div>
          <MITREHeatmap data={mitreCoverage} />
        </div>
      )}
    </motion.div>
  );
}