import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Server, Search, Filter, Download,
  CheckCircle, AlertTriangle, Wifi,
  Monitor, RefreshCw, Shield,
} from 'lucide-react';
import EndpointCard from './EndpointCard';

// ── Realistic endpoint inventory ─────────────────────────
const ENDPOINTS = [
  {
    id: 'EP-001', hostname: 'win10-victim',
    ip: '192.168.56.30', os: 'Windows', osVersion: '10 22H2',
    status: 'critical', criticality: 'high',
    department: 'Finance', wazuhAgent: true,
    agentId: '001', enrolled: '2024-01-01',
    cpu: 'Intel Core i5-8400', memory: '8 GB DDR4',
    disk: '256 GB SSD (67% used)', mac: '08:00:27:AB:CD:01',
    lastSeen: '2m ago', alertCount: 5,
    vulns: 3, patchStatus: 'Outdated',
    compliance: 'Non-compliant',
    tags: ['sysmon', 'winlogbeat', 'critical-asset', 'finance'],
  },
  {
    id: 'EP-002', hostname: 'ubuntu-webserver',
    ip: '192.168.56.40', os: 'Linux', osVersion: 'Ubuntu 22.04 LTS',
    status: 'active', criticality: 'high',
    department: 'Engineering', wazuhAgent: true,
    agentId: '002', enrolled: '2024-01-01',
    cpu: '2x vCPU', memory: '4 GB RAM',
    disk: '80 GB SSD (45% used)', mac: '08:00:27:AB:CD:02',
    lastSeen: '1m ago', alertCount: 2,
    vulns: 2, patchStatus: 'Current',
    compliance: 'Compliant',
    tags: ['apache', 'filebeat', 'web-server', 'public-facing'],
  },
  {
    id: 'EP-003', hostname: 'siem-server',
    ip: '192.168.56.10', os: 'Linux', osVersion: 'Ubuntu 22.04 LTS',
    status: 'active', criticality: 'critical',
    department: 'Security', wazuhAgent: false,
    agentId: 'manager', enrolled: '2024-01-01',
    cpu: '4x vCPU', memory: '8 GB RAM',
    disk: '200 GB SSD (38% used)', mac: '08:00:27:AB:CD:10',
    lastSeen: 'Just now', alertCount: 0,
    vulns: 0, patchStatus: 'Current',
    compliance: 'Compliant',
    tags: ['wazuh', 'thehive', 'misp', 'suricata', 'soc-platform'],
  },
  {
    id: 'EP-004', hostname: 'kali-attacker',
    ip: '192.168.56.20', os: 'Linux', osVersion: 'Kali 2024.1',
    status: 'active', criticality: 'medium',
    department: 'Security', wazuhAgent: false,
    agentId: '—', enrolled: '—',
    cpu: '2x vCPU', memory: '4 GB RAM',
    disk: '80 GB SSD (22% used)', mac: '08:00:27:AB:CD:20',
    lastSeen: '5m ago', alertCount: 0,
    vulns: 0, patchStatus: 'Current',
    compliance: 'Exempt (Security Testing)',
    tags: ['pentest', 'authorized', 'lab-only'],
  },
  {
    id: 'EP-005', hostname: 'dc01-corp',
    ip: '10.0.1.10', os: 'Windows', osVersion: 'Server 2022',
    status: 'active', criticality: 'critical',
    department: 'IT Infrastructure', wazuhAgent: true,
    agentId: '003', enrolled: '2024-01-05',
    cpu: '8x vCPU', memory: '32 GB RAM',
    disk: '500 GB SSD (55% used)', mac: '00:1A:2B:3C:4D:5E',
    lastSeen: '30s ago', alertCount: 0,
    vulns: 1, patchStatus: 'Current',
    compliance: 'Compliant',
    tags: ['domain-controller', 'active-directory', 'critical-infra'],
  },
  {
    id: 'EP-006', hostname: 'workstation-finance-01',
    ip: '10.0.2.45', os: 'Windows', osVersion: '11 23H2',
    status: 'disconnected', criticality: 'medium',
    department: 'Finance', wazuhAgent: true,
    agentId: '004', enrolled: '2024-01-10',
    cpu: 'Intel Core i7-1165G7', memory: '16 GB DDR4',
    disk: '512 GB SSD (30% used)', mac: '00:1B:2C:3D:4E:5F',
    lastSeen: '3h ago', alertCount: 0,
    vulns: 0, patchStatus: 'Current',
    compliance: 'Compliant',
    tags: ['workstation', 'finance', 'sysmon'],
  },
];

const STATUS_FILTER_OPTS = [
  { val:'all',          label:'All Endpoints' },
  { val:'active',       label:'Active'        },
  { val:'critical',     label:'Critical'      },
  { val:'disconnected', label:'Disconnected'  },
];

const CRIT_OPTS  = ['all','critical','high','medium','low'];
const CRIT_COLOR = {
  critical:'#ff2d6d', high:'#ff8c00',
  medium:'#ffd600',   low:'#00ff88',
};

export default function EndpointInventory() {
  const [search,   setSearch]   = useState('');
  const [statusF,  setStatusF]  = useState('all');
  const [critF,    setCritF]    = useState('all');
  const [deptF,    setDeptF]    = useState('all');

  const departments = ['all', ...new Set(ENDPOINTS.map(e => e.department))];

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return ENDPOINTS.filter(e => {
      if (statusF !== 'all' && e.status      !== statusF) return false;
      if (critF   !== 'all' && e.criticality !== critF)   return false;
      if (deptF   !== 'all' && e.department  !== deptF)   return false;
      if (q && !e.hostname.toLowerCase().includes(q) &&
               !e.ip.includes(q) &&
               !e.department.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [search, statusF, critF, deptF]);

  const stats = {
    total:      ENDPOINTS.length,
    active:     ENDPOINTS.filter(e => e.status === 'active').length,
    critical:   ENDPOINTS.filter(e => e.status === 'critical').length,
    wazuh:      ENDPOINTS.filter(e => e.wazuhAgent).length,
    withAlerts: ENDPOINTS.filter(e => e.alertCount > 0).length,
  };

  const exportCSV = () => {
    const hdr  = 'id,hostname,ip,os,status,criticality,department,alertCount,patchStatus';
    const rows = filtered.map(e =>
      `${e.id},${e.hostname},${e.ip},${e.os},${e.status},${e.criticality},${e.department},${e.alertCount},${e.patchStatus}`
    );
    const blob = new Blob([[hdr,...rows].join('\n')], { type:'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'endpoint_inventory.csv';
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      key="endpoint-inventory"
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
          <Server size={20} color="#00e5ff" />
          Endpoint Inventory
        </h1>
        <div style={{ fontSize:13, color:'#3d5080', marginTop:4 }}>
          Wazuh agent coverage · Asset criticality · Patch status · {ENDPOINTS.length} managed endpoints
        </div>
      </div>

      {/* Stats row */}
      <div style={{
        display:'grid', gridTemplateColumns:'repeat(5,1fr)',
        gap:10, marginBottom:22,
      }}>
        {[
          { label:'Total Endpoints', value:stats.total,      color:'#00e5ff', icon:Server        },
          { label:'Active',          value:stats.active,     color:'#00ff88', icon:CheckCircle   },
          { label:'Critical Alerts', value:stats.critical,   color:'#ff2d6d', icon:AlertTriangle },
          { label:'Wazuh Agents',    value:stats.wazuh,      color:'#ff8c00', icon:Shield        },
          { label:'With Alerts',     value:stats.withAlerts, color:'#ffd600', icon:Wifi          },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="glass-card" style={{ padding:'12px 14px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                <Icon size={13} color={s.color} />
                <div style={{
                  fontFamily:'JetBrains Mono,monospace',
                  fontSize:22, fontWeight:700, color:s.color,
                }}>{s.value}</div>
              </div>
              <div style={{ fontSize:10.5, color:'#3d5080' }}>{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Filter bar */}
      <div className="glass-card" style={{ padding:'12px 14px', marginBottom:16 }}>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
          {/* Search */}
          <div style={{ position:'relative', flex:1, minWidth:200 }}>
            <Search size={12} color="#4a6090" style={{
              position:'absolute', left:9,
              top:'50%', transform:'translateY(-50%)',
            }} />
            <input className="soc-input" value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search hostname, IP, department…"
              style={{ paddingLeft:28, height:30, fontSize:12 }}
            />
          </div>

          {/* Status filter */}
          {STATUS_FILTER_OPTS.map(opt => (
            <button key={opt.val} onClick={() => setStatusF(opt.val)} style={{
              padding:'3px 10px', borderRadius:9999, fontSize:11,
              cursor:'pointer', border:'1px solid', transition:'all 0.14s',
              background:statusF===opt.val?'rgba(0,229,255,0.12)':'rgba(255,255,255,0.04)',
              color:      statusF===opt.val?'#00e5ff':'#6b7fa3',
              borderColor:statusF===opt.val?'rgba(0,229,255,0.30)':'#1a2744',
            }}>{opt.label}</button>
          ))}

          {/* Criticality filter */}
          <div style={{ display:'flex', gap:5 }}>
            {CRIT_OPTS.map(c => (
              <button key={c} onClick={() => setCritF(c)} style={{
                padding:'3px 10px', borderRadius:9999, fontSize:11,
                cursor:'pointer', border:'1px solid', transition:'all 0.14s',
                background:critF===c?`${CRIT_COLOR[c]||'#00e5ff'}18`:'rgba(255,255,255,0.04)',
                color:      critF===c?CRIT_COLOR[c]||'#00e5ff':'#6b7fa3',
                borderColor:critF===c?`${CRIT_COLOR[c]||'#00e5ff'}40`:'#1a2744',
              }}>{c}</button>
            ))}
          </div>

          {/* Department */}
          <select value={deptF} onChange={e => setDeptF(e.target.value)} style={{
            background:'rgba(10,15,30,0.85)', border:'1px solid #1a2744',
            borderRadius:7, color:'#c8d8f0', padding:'5px 8px',
            fontSize:12, cursor:'pointer', outline:'none',
          }}>
            {departments.map(d => (
              <option key={d} value={d}>{d==='all'?'All Departments':d}</option>
            ))}
          </select>

          {/* Export */}
          <button className="btn-cyber btn-ghost"
            style={{ fontSize:12, padding:'5px 12px', marginLeft:'auto' }}
            onClick={exportCSV}>
            <Download size={13}/> Export
          </button>
        </div>
      </div>

      {/* Result count */}
      <div style={{ fontSize:12, color:'#3d5080', marginBottom:12 }}>
        Showing{' '}
        <span style={{ color:'#00e5ff', fontFamily:'JetBrains Mono,monospace' }}>
          {filtered.length}
        </span>
        {' '}of {ENDPOINTS.length} endpoints
      </div>

      {/* Endpoint cards */}
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {filtered.map((ep, i) => (
          <motion.div
            key={ep.id}
            initial={{ opacity:0, y:8 }}
            animate={{ opacity:1, y:0 }}
            transition={{ duration:0.18, delay:i*0.04 }}
          >
            <EndpointCard endpoint={ep} />
          </motion.div>
        ))}

        {filtered.length === 0 && (
          <div style={{
            textAlign:'center', padding:'48px 0', color:'#3d5080',
          }}>
            <Server size={36} style={{ opacity:0.2, margin:'0 auto 12px' }} />
            <div style={{ fontSize:14, color:'#4a6090', marginBottom:6 }}>
              No endpoints match the current filter
            </div>
            <div style={{ fontSize:12 }}>
              Try adjusting the status, criticality, or department filter
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}