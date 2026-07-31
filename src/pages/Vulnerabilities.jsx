import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

const VULNS = [
  { cve:'CVE-2021-44228', host:'ubuntu-webserver', severity:'critical', cvss:10.0, desc:'Log4Shell — RCE via JNDI lookup',          status:'Patched'  },
  { cve:'CVE-2017-0144',  host:'win10-victim',     severity:'critical', cvss:9.3,  desc:'EternalBlue — SMB RCE (MS17-010)',          status:'Patched'  },
  { cve:'CVE-2023-44487', host:'ubuntu-webserver', severity:'high',     cvss:7.5,  desc:'HTTP/2 Rapid Reset DoS',                    status:'Patched'  },
  { cve:'CVE-2021-3156',  host:'ubuntu-webserver', severity:'high',     cvss:7.8,  desc:'Sudo heap overflow — local priv esc',        status:'Patched'  },
  { cve:'CVE-2022-0847',  host:'ubuntu-webserver', severity:'high',     cvss:7.8,  desc:'Dirty Pipe — Linux kernel priv esc',         status:'Patched'  },
  { cve:'CVE-2023-23397', host:'win10-victim',     severity:'critical', cvss:9.8,  desc:'Outlook NTLM credential theft',             status:'Open'     },
  { cve:'CVE-2022-30190', host:'win10-victim',     severity:'high',     cvss:7.8,  desc:'Follina MSDT RCE via Word documents',       status:'Open'     },
];

const SEV_COLOR = { critical:'#ff2d6d', high:'#ff8c00', medium:'#ffd600', low:'#00ff88' };

export default function Vulnerabilities() {
  return (
    <motion.div key="vulns"
      initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
      exit={{ opacity:0 }} transition={{ duration:0.25 }}
    >
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:700, color:'#e8f4ff', margin:0,
          display:'flex', alignItems:'center', gap:10 }}>
          <AlertTriangle size={20} color="#00e5ff" /> Vulnerability Management
        </h1>
        <div style={{ fontSize:13, color:'#3d5080', marginTop:4 }}>
          OpenVAS / Greenbone · Weekly scan schedule · Last scan: 2024-01-15
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:22 }}>
        {[
          { label:'Critical',  value:VULNS.filter(v=>v.severity==='critical').length, color:'#ff2d6d' },
          { label:'High',      value:VULNS.filter(v=>v.severity==='high').length,     color:'#ff8c00' },
          { label:'Open',      value:VULNS.filter(v=>v.status==='Open').length,       color:'#ff2d6d' },
          { label:'Patched',   value:VULNS.filter(v=>v.status==='Patched').length,    color:'#00ff88' },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ padding:'14px 16px' }}>
            <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:26,
              fontWeight:700, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11.5, color:'#3d5080', marginTop:3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="glass-card" style={{ overflow:'hidden', padding:0 }}>
        <table className="soc-table">
          <thead>
            <tr>
              <th style={{ width:140 }}>CVE</th>
              <th style={{ width:150 }}>HOST</th>
              <th style={{ width:100 }}>SEVERITY</th>
              <th style={{ width:60  }}>CVSS</th>
              <th>DESCRIPTION</th>
              <th style={{ width:90  }}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {VULNS.map((v, i) => (
              <motion.tr key={v.cve}
                initial={{ opacity:0 }} animate={{ opacity:1 }}
                transition={{ delay: i * 0.04 }}>
                <td><span style={{ fontFamily:'JetBrains Mono,monospace',
                  fontSize:11.5, color:'#00e5ff' }}>{v.cve}</span></td>
                <td style={{ fontFamily:'JetBrains Mono,monospace',
                  fontSize:11.5, color:'#6b7fa3' }}>{v.host}</td>
                <td><span className={`badge badge-${v.severity}`}>{v.severity}</span></td>
                <td><span style={{ fontFamily:'JetBrains Mono,monospace',
                  fontSize:12, color: SEV_COLOR[v.severity] }}>{v.cvss}</span></td>
                <td style={{ fontSize:12.5, color:'#c8d8f0' }}>{v.desc}</td>
                <td>
                  <span style={{ fontSize:11,
                    color: v.status==='Patched' ? '#00ff88' : '#ff2d6d',
                    background: v.status==='Patched'?'rgba(0,255,136,0.08)':'rgba(255,45,109,0.1)',
                    border:`1px solid ${v.status==='Patched'?'rgba(0,255,136,0.25)':'rgba(255,45,109,0.3)'}`,
                    borderRadius:4, padding:'1px 8px' }}>
                    {v.status}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}