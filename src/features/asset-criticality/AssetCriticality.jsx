import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Search, Download, Plus,
  Server, Monitor, Database, Globe,
  Lock, AlertTriangle, ChevronDown,
  ChevronUp, Save, X, Edit2,
} from 'lucide-react';
import CriticalityBadge from './CriticalityBadge';

// ── Asset type icons ──────────────────────────────────────
const TYPE_ICONS = {
  server:    Server,
  workstation: Monitor,
  database:  Database,
  network:   Globe,
  security:  Shield,
};

// ── Initial asset list ────────────────────────────────────
const INITIAL_ASSETS = [
  {
    id: 'AST-001', name: 'dc01-corp',          type: 'server',
    ip: '10.0.1.10', os: 'Windows Server 2022',
    criticality: 'critical', owner: 'IT Infrastructure',
    description: 'Primary domain controller — Active Directory, DNS, DHCP',
    businessImpact: 'ALL users cannot authenticate if down. Revenue impact: immediate.',
    compliance: ['PCI-DSS','SOX','HIPAA'],
    rto: '15m', rpo: '0m', cvssMax: 9.8,
    tags: ['domain-controller','active-directory','pci-scope'],
    lastReviewed: '2024-01-10', reviewedBy: 'admin-kim',
    wazuhAgent: true, alertCount: 0, vulns: 1,
  },
  {
    id: 'AST-002', name: 'fin-db01',            type: 'database',
    ip: '10.0.3.20', os: 'Linux / PostgreSQL 15',
    criticality: 'critical', owner: 'Finance',
    description: 'Primary financial database — accounts, payroll, transactions',
    businessImpact: 'Financial data loss. Regulatory notification required within 72h.',
    compliance: ['PCI-DSS','SOX'],
    rto: '30m', rpo: '5m', cvssMax: 9.1,
    tags: ['pci-scope','financial-data','backup-daily'],
    lastReviewed: '2024-01-08', reviewedBy: 'admin-kim',
    wazuhAgent: true, alertCount: 0, vulns: 0,
  },
  {
    id: 'AST-003', name: 'win10-victim',         type: 'workstation',
    ip: '192.168.56.30', os: 'Windows 10 22H2',
    criticality: 'high', owner: 'Finance',
    description: 'Finance analyst workstation — compromised during incident CASE-2024-0047',
    businessImpact: 'Single-user impact. Credentials potentially stolen.',
    compliance: ['PCI-DSS'],
    rto: '4h', rpo: '24h', cvssMax: 9.8,
    tags: ['compromised','incident-active','finance','sysmon'],
    lastReviewed: '2024-01-15', reviewedBy: 'analyst-chen',
    wazuhAgent: true, alertCount: 5, vulns: 3,
  },
  {
    id: 'AST-004', name: 'ubuntu-webserver',     type: 'server',
    ip: '192.168.56.40', os: 'Ubuntu 22.04 LTS',
    criticality: 'high', owner: 'Engineering',
    description: 'Public-facing Apache web server — customer portal',
    businessImpact: 'Customer-facing downtime. Reputational risk.',
    compliance: ['PCI-DSS'],
    rto: '1h', rpo: '1h', cvssMax: 9.8,
    tags: ['public-facing','apache','pci-scope'],
    lastReviewed: '2024-01-12', reviewedBy: 'analyst-patel',
    wazuhAgent: true, alertCount: 2, vulns: 2,
  },
  {
    id: 'AST-005', name: 'siem-server',          type: 'security',
    ip: '192.168.56.10', os: 'Ubuntu 22.04 LTS',
    criticality: 'critical', owner: 'Security',
    description: 'SOC platform — Wazuh, TheHive, MISP, Suricata',
    businessImpact: 'Complete loss of security visibility if compromised.',
    compliance: ['SOX'],
    rto: '30m', rpo: '1h', cvssMax: 0,
    tags: ['soc-platform','hardened','security-critical'],
    lastReviewed: '2024-01-15', reviewedBy: 'admin-kim',
    wazuhAgent: false, alertCount: 0, vulns: 0,
  },
  {
    id: 'AST-006', name: 'core-fw-01',           type: 'network',
    ip: '192.168.56.1',  os: 'pfSense 2.7',
    criticality: 'critical', owner: 'IT Infrastructure',
    description: 'Perimeter firewall — primary network boundary control',
    businessImpact: 'All inbound/outbound traffic blocked. Complete network isolation.',
    compliance: ['PCI-DSS','SOX'],
    rto: '5m', rpo: 'N/A', cvssMax: 0,
    tags: ['perimeter','pci-scope','firewall'],
    lastReviewed: '2024-01-05', reviewedBy: 'admin-kim',
    wazuhAgent: false, alertCount: 0, vulns: 0,
  },
  {
    id: 'AST-007', name: 'workstation-hr-12',    type: 'workstation',
    ip: '10.0.2.112', os: 'Windows 11 23H2',
    criticality: 'medium', owner: 'Human Resources',
    description: 'HR analyst workstation — standard user, limited access',
    businessImpact: 'Single user impact. No critical data access.',
    compliance: ['HIPAA'],
    rto: '8h', rpo: '24h', cvssMax: 0,
    tags: ['workstation','hr','standard-user'],
    lastReviewed: '2024-01-01', reviewedBy: 'analyst-patel',
    wazuhAgent: true, alertCount: 0, vulns: 0,
  },
  {
    id: 'AST-008', name: 'dev-server-02',        type: 'server',
    ip: '10.0.4.55', os: 'Ubuntu 22.04 LTS',
    criticality: 'low', owner: 'Engineering',
    description: 'Development server — non-production environment, no PII',
    businessImpact: 'Developer productivity impact only.',
    compliance: [],
    rto: '24h', rpo: '24h', cvssMax: 0,
    tags: ['dev','non-production','low-priority'],
    lastReviewed: '2023-12-15', reviewedBy: 'analyst-patel',
    wazuhAgent: true, alertCount: 0, vulns: 0,
  },
];

const CRITICALITY_LEVELS = ['critical','high','medium','low','minimal'];
const CRIT_COLOR = {
  critical:'#ff2d6d', high:'#ff8c00', medium:'#ffd600',
  low:'#00ff88', minimal:'#6b7fa3',
};

// ── Asset detail / edit panel ─────────────────────────────
function AssetPanel({ asset, onSave, onClose }) {
  const [editing, setEditing] = useState(false);
  const [form,    setForm]    = useState({ ...asset });
  const Icon = TYPE_ICONS[form.type] || Server;

  const save = () => {
    onSave(form);
    setEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      style={{
        background:   'rgba(13,21,48,0.98)',
        border:       '1px solid #243660',
        borderRadius: 12,
        overflow:     'auto',
        maxHeight:    '82vh',
        position:     'sticky',
        top:          80,
      }}
    >
      {/* Header */}
      <div style={{
        padding:      '14px 16px',
        borderBottom: '1px solid #1a2744',
        display:      'flex',
        alignItems:   'center',
        gap:          10,
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: 8, flexShrink: 0,
          background: `${CRIT_COLOR[form.criticality]}15`,
          border:     `1px solid ${CRIT_COLOR[form.criticality]}30`,
          display:    'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={15} color={CRIT_COLOR[form.criticality]} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#e8f4ff' }}>
            {form.name}
          </div>
          <div style={{
            fontSize: 11, color: '#3d5080',
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            {form.ip}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button onClick={() => setEditing(p => !p)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#6b7fa3', padding: 4,
          }}>
            <Edit2 size={14} />
          </button>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#3d5080', padding: 4,
          }}>
            <X size={14} />
          </button>
        </div>
      </div>

      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Criticality selector (edit mode) */}
        {editing ? (
          <div>
            <div style={{ fontSize: 11, color: '#3d5080', marginBottom: 6 }}>
              Criticality Level
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {CRITICALITY_LEVELS.map(lvl => (
                <button key={lvl} onClick={() => setForm(p => ({ ...p, criticality: lvl }))}
                  style={{
                    padding: '4px 12px', borderRadius: 9999,
                    fontSize: 11, cursor: 'pointer', border: '1px solid',
                    background: form.criticality===lvl
                      ? `${CRIT_COLOR[lvl]}20` : 'rgba(255,255,255,0.04)',
                    color:      form.criticality===lvl ? CRIT_COLOR[lvl] : '#6b7fa3',
                    borderColor:form.criticality===lvl ? `${CRIT_COLOR[lvl]}40` : '#1a2744',
                    fontFamily: 'JetBrains Mono, monospace', fontWeight: 600,
                  }}>
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <CriticalityBadge level={form.criticality} size="md" />
        )}

        {/* Key details */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
        }}>
          {[
            ['ID',     form.id],
            ['Owner',  form.owner],
            ['OS',     form.os],
            ['Type',   form.type],
            ['RTO',    form.rto],
            ['RPO',    form.rpo],
          ].map(([k, v]) => (
            <div key={k} style={{
              background: 'rgba(0,0,0,0.2)',
              border: '1px solid #1a2744', borderRadius: 6,
              padding: '7px 10px',
            }}>
              <div style={{ fontSize: 9.5, color: '#3d5080', marginBottom: 2 }}>{k}</div>
              <div style={{
                fontSize: 11.5, color: '#c8d8f0',
                fontFamily: 'JetBrains Mono, monospace',
              }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Description */}
        <div>
          <div style={{ fontSize: 11, color: '#3d5080', marginBottom: 5 }}>
            Description
          </div>
          {editing ? (
            <textarea
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              rows={3}
              style={{
                width: '100%', background: 'rgba(10,15,30,0.85)',
                border: '1px solid #1a2744', borderRadius: 7,
                color: '#c8d8f0', padding: '8px 10px',
                fontSize: 12.5, fontFamily: 'Inter, sans-serif',
                resize: 'vertical', outline: 'none', boxSizing: 'border-box',
              }}
            />
          ) : (
            <div style={{
              fontSize: 12.5, color: '#c8d8f0', lineHeight: 1.6,
              background: 'rgba(0,0,0,0.15)', borderRadius: 7,
              padding: '8px 10px', border: '1px solid #1a2744',
            }}>
              {form.description}
            </div>
          )}
        </div>

        {/* Business impact */}
        <div>
          <div style={{ fontSize: 11, color: '#3d5080', marginBottom: 5 }}>
            Business Impact
          </div>
          <div style={{
            fontSize: 12.5, color: '#ff8c00', lineHeight: 1.6,
            background: 'rgba(255,140,0,0.06)',
            border: '1px solid rgba(255,140,0,0.18)',
            borderRadius: 7, padding: '8px 10px',
          }}>
            {form.businessImpact}
          </div>
        </div>

        {/* Compliance */}
        {form.compliance?.length > 0 && (
          <div>
            <div style={{ fontSize: 11, color: '#3d5080', marginBottom: 6 }}>
              Compliance Scope
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {form.compliance.map(c => (
                <span key={c} style={{
                  fontSize: 11, color: '#00e5ff',
                  background: 'rgba(0,229,255,0.08)',
                  border: '1px solid rgba(0,229,255,0.20)',
                  borderRadius: 4, padding: '2px 8px',
                  fontFamily: 'JetBrains Mono, monospace',
                }}>{c}</span>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {form.tags?.length > 0 && (
          <div>
            <div style={{ fontSize: 11, color: '#3d5080', marginBottom: 6 }}>Tags</div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {form.tags.map(t => (
                <span key={t} style={{
                  fontSize: 10, color: '#6b7fa3',
                  background: 'rgba(74,96,144,0.12)',
                  border: '1px solid rgba(74,96,144,0.22)',
                  borderRadius: 4, padding: '1px 6px',
                }}>#{t}</span>
              ))}
            </div>
          </div>
        )}

        {/* Alert / vuln counters */}
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { label:'Alerts',        value:form.alertCount, color:form.alertCount>0?'#ff2d6d':'#00ff88' },
            { label:'Vulnerabilities',value:form.vulns,     color:form.vulns>0?'#ff8c00':'#00ff88'      },
            { label:'Max CVSS',       value:form.cvssMax||0, color:form.cvssMax>=9?'#ff2d6d':form.cvssMax>=7?'#ff8c00':'#00ff88'},
          ].map(s => (
            <div key={s.label} style={{
              flex: 1, background: 'rgba(0,0,0,0.2)',
              border: '1px solid #1a2744', borderRadius: 7,
              padding: '8px 10px', textAlign: 'center',
            }}>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 18, fontWeight: 700, color: s.color,
              }}>{s.value}</div>
              <div style={{ fontSize: 10, color: '#3d5080', marginTop: 2 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Review metadata */}
        <div style={{
          fontSize: 11, color: '#3d5080',
          borderTop: '1px solid #1a2744', paddingTop: 10,
        }}>
          Last reviewed: {form.lastReviewed} by {form.reviewedBy}
        </div>

        {/* Save button (edit mode) */}
        {editing && (
          <button className="btn-cyber btn-primary"
            style={{ fontSize: 13, padding: '8px 0', width: '100%', justifyContent: 'center' }}
            onClick={save}>
            <Save size={14} /> Save Changes
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────
export default function AssetCriticality() {
  const [assets,    setAssets]    = useState(INITIAL_ASSETS);
  const [selected,  setSelected]  = useState(null);
  const [search,    setSearch]    = useState('');
  const [critFilter,setCritFilter]= useState('all');
  const [typeFilter,setTypeFilter]= useState('all');
  const [showAdd,   setShowAdd]   = useState(false);
  const [sortBy,    setSortBy]    = useState('criticality');

  const CRIT_ORDER = { critical:0, high:1, medium:2, low:3, minimal:4 };
  const types      = ['all', ...new Set(assets.map(a => a.type))];

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return assets
      .filter(a => {
        if (critFilter !== 'all' && a.criticality !== critFilter) return false;
        if (typeFilter !== 'all' && a.type !== typeFilter) return false;
        if (q && !a.name.toLowerCase().includes(q) &&
                 !a.ip.includes(q) &&
                 !a.owner.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'criticality') return CRIT_ORDER[a.criticality] - CRIT_ORDER[b.criticality];
        if (sortBy === 'alerts')      return b.alertCount - a.alertCount;
        if (sortBy === 'vulns')       return b.vulns - a.vulns;
        return a.name.localeCompare(b.name);
      });
  }, [assets, search, critFilter, typeFilter, sortBy]);

  const stats = {
    critical: assets.filter(a => a.criticality === 'critical').length,
    high:     assets.filter(a => a.criticality === 'high').length,
    alerts:   assets.reduce((s, a) => s + a.alertCount, 0),
    vulns:    assets.reduce((s, a) => s + a.vulns, 0),
  };

  const handleSave = (updated) => {
    setAssets(prev => prev.map(a => a.id === updated.id ? updated : a));
    setSelected(updated);
  };

  const exportCSV = () => {
    const hdr = 'id,name,ip,type,criticality,owner,alertCount,vulns,compliance,rto';
    const rows = filtered.map(a =>
      `${a.id},${a.name},${a.ip},${a.type},${a.criticality},${a.owner},${a.alertCount},${a.vulns},"${a.compliance.join('|')}",${a.rto}`
    );
    const blob = new Blob([[hdr,...rows].join('\n')], { type:'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a2   = document.createElement('a');
    a2.href = url; a2.download = 'asset_criticality.csv';
    a2.click(); URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      key="asset-criticality"
      initial={{ opacity:0, y:10 }}
      animate={{ opacity:1, y:0 }}
      transition={{ duration:0.25 }}
    >
      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <h1 style={{
          fontSize:22, fontWeight:700, color:'#e8f4ff',
          margin:0, display:'flex', alignItems:'center', gap:10,
        }}>
          <Shield size={20} color="#00e5ff" />
          Asset Criticality Classification
        </h1>
        <div style={{ fontSize:13, color:'#3d5080', marginTop:4 }}>
          Business impact analysis · RTO/RPO · Compliance scope · {assets.length} assets managed
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:22 }}>
        {[
          { label:'Critical Assets', value:stats.critical, color:'#ff2d6d' },
          { label:'High Priority',   value:stats.high,     color:'#ff8c00' },
          { label:'Active Alerts',   value:stats.alerts,   color:'#ffd600' },
          { label:'Open Vulns',      value:stats.vulns,    color:'#a855f7' },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ padding:'14px 16px' }}>
            <div style={{ fontFamily:'JetBrains Mono,monospace',
              fontSize:24, fontWeight:700, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11, color:'#3d5080', marginTop:3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:16 }}>

        {/* Left: asset list */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {/* Filters */}
          <div className="glass-card" style={{ padding:'12px 14px' }}>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
              <div style={{ position:'relative', flex:1, minWidth:180 }}>
                <Search size={12} color="#4a6090" style={{
                  position:'absolute', left:9,
                  top:'50%', transform:'translateY(-50%)',
                }} />
                <input className="soc-input" value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search assets…"
                  style={{ paddingLeft:28, height:30, fontSize:12 }}
                />
              </div>

              {['all','critical','high','medium','low'].map(c => (
                <button key={c} onClick={() => setCritFilter(c)} style={{
                  padding:'3px 10px', borderRadius:9999, fontSize:11,
                  cursor:'pointer', border:'1px solid', transition:'all 0.14s',
                  background:critFilter===c?`${CRIT_COLOR[c]||'#00e5ff'}18`:'rgba(255,255,255,0.04)',
                  color:      critFilter===c?CRIT_COLOR[c]||'#00e5ff':'#6b7fa3',
                  borderColor:critFilter===c?`${CRIT_COLOR[c]||'#00e5ff'}40`:'#1a2744',
                }}>{c}</button>
              ))}

              <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
                background:'rgba(10,15,30,0.85)', border:'1px solid #1a2744',
                borderRadius:7, color:'#c8d8f0', padding:'5px 8px',
                fontSize:12, cursor:'pointer', outline:'none',
              }}>
                <option value="criticality">Sort: Criticality</option>
                <option value="alerts">Sort: Alerts</option>
                <option value="vulns">Sort: Vulnerabilities</option>
                <option value="name">Sort: Name</option>
              </select>

              <button className="btn-cyber btn-ghost"
                style={{ fontSize:12, padding:'5px 10px' }}
                onClick={exportCSV}>
                <Download size={13}/>
              </button>
            </div>
          </div>

          {/* Asset rows */}
          <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
            {filtered.map((asset, i) => {
              const Icon    = TYPE_ICONS[asset.type] || Server;
              const color   = CRIT_COLOR[asset.criticality] || '#6b7fa3';
              const isSelected = selected?.id === asset.id;
              return (
                <motion.div
                  key={asset.id}
                  initial={{ opacity:0, y:6 }}
                  animate={{ opacity:1, y:0 }}
                  transition={{ duration:0.14, delay:i*0.025 }}
                  onClick={() => setSelected(isSelected ? null : asset)}
                  style={{
                    display:'flex', alignItems:'center', gap:12,
                    padding:'12px 14px', borderRadius:9, cursor:'pointer',
                    background:isSelected?`${color}08`:'rgba(13,21,48,0.65)',
                    border:`1px solid ${isSelected?color+'40':'#1a2744'}`,
                    borderLeft:`3px solid ${color}`,
                    transition:'all 0.15s',
                  }}
                >
                  <div style={{
                    width:32, height:32, borderRadius:7, flexShrink:0,
                    background:`${color}12`, border:`1px solid ${color}25`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>
                    <Icon size={14} color={color} />
                  </div>

                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                      <span style={{ fontSize:13.5, fontWeight:600, color:'#e8f4ff' }}>
                        {asset.name}
                      </span>
                      <CriticalityBadge level={asset.criticality} size="sm" />
                      {asset.alertCount > 0 && (
                        <span style={{
                          fontSize:10, fontWeight:700, color:'#ff2d6d',
                          background:'rgba(255,45,109,0.14)',
                          border:'1px solid rgba(255,45,109,0.30)',
                          borderRadius:4, padding:'0 5px',
                          fontFamily:'JetBrains Mono,monospace',
                        }}>{asset.alertCount} alerts</span>
                      )}
                    </div>
                    <div style={{ fontSize:11.5, color:'#6b7fa3' }}>
                      <span style={{
                        fontFamily:'JetBrains Mono,monospace', color:'#c8d8f0',
                      }}>{asset.ip}</span>
                      {' · '}{asset.os}
                      {' · '}{asset.owner}
                    </div>
                  </div>

                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontSize:11, color:'#3d5080', marginBottom:3 }}>
                      RTO: <span style={{
                        fontFamily:'JetBrains Mono,monospace',
                        color: asset.rto.includes('m') && parseInt(asset.rto) <= 30
                          ? '#ff2d6d' : '#c8d8f0',
                      }}>{asset.rto}</span>
                    </div>
                    {asset.compliance?.length > 0 && (
                      <div style={{ display:'flex', gap:4, justifyContent:'flex-end' }}>
                        {asset.compliance.slice(0,2).map(c => (
                          <span key={c} style={{
                            fontSize:9, color:'#00e5ff',
                            background:'rgba(0,229,255,0.07)',
                            border:'1px solid rgba(0,229,255,0.16)',
                            borderRadius:3, padding:'1px 5px',
                            fontFamily:'JetBrains Mono,monospace',
                          }}>{c}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {filtered.length === 0 && (
              <div style={{ textAlign:'center', padding:'40px 0', color:'#3d5080' }}>
                <Shield size={32} style={{ opacity:0.2, margin:'0 auto 10px' }} />
                <div style={{ fontSize:13 }}>No assets match the filter</div>
              </div>
            )}
          </div>
        </div>

        {/* Right: detail panel */}
        <div>
          <AnimatePresence mode="wait">
            {selected ? (
              <AssetPanel
                key={selected.id}
                asset={selected}
                onSave={handleSave}
                onClose={() => setSelected(null)}
              />
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity:0 }}
                animate={{ opacity:1 }}
                style={{
                  background:'rgba(13,21,48,0.5)',
                  border:'1px solid #1a2744', borderRadius:12,
                  padding:'40px 20px', textAlign:'center',
                  color:'#3d5080',
                  position:'sticky', top:80,
                }}
              >
                <Shield size={32} style={{ opacity:0.2, margin:'0 auto 12px' }} />
                <div style={{ fontSize:13 }}>
                  Select an asset to view details,<br />
                  edit criticality, and manage scope
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}