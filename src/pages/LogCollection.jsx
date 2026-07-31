import React from 'react';
import { motion } from 'framer-motion';
import { FileText, CheckCircle } from 'lucide-react';

const SOURCES = [
  { agent:'ubuntu-webserver', ip:'192.168.56.40', type:'Filebeat + Wazuh Agent', logs:['syslog','auth.log','apache2/access.log'], status:'active', eps:24 },
  { agent:'win10-victim',     ip:'192.168.56.30', type:'Winlogbeat + Sysmon',    logs:['Security','System','Sysmon Operational'], status:'active', eps:47 },
  { agent:'cowrie-honeypot',  ip:'192.168.56.10', type:'JSON localfile',          logs:['cowrie.json'],                           status:'active', eps:2  },
  { agent:'suricata-nsm',     ip:'192.168.56.10', type:'EVE JSON localfile',      logs:['eve.json'],                              status:'active', eps:180},
];

export default function LogCollection() {
  return (
    <motion.div key="log-collection"
      initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
      exit={{ opacity:0 }} transition={{ duration:0.25 }}
    >
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:700, color:'#e8f4ff', margin:0,
          display:'flex', alignItems:'center', gap:10 }}>
          <FileText size={20} color="#00e5ff" /> Log Collection
        </h1>
        <div style={{ fontSize:13, color:'#3d5080', marginTop:4 }}>
          Filebeat · Winlogbeat · Sysmon · Wazuh Agents · 4 active sources
        </div>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {SOURCES.map((s, i) => (
          <motion.div key={s.agent} className="glass-card"
            style={{ padding:'16px 18px', borderLeft:`3px solid #00e5ff` }}
            initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }}
            transition={{ delay: i * 0.07 }}
          >
            <div style={{ display:'flex', alignItems:'flex-start',
              justifyContent:'space-between', marginBottom:10 }}>
              <div>
                <div style={{ fontSize:14, fontWeight:600, color:'#e8f4ff' }}>
                  {s.agent}
                </div>
                <div style={{ fontSize:12, color:'#3d5080', marginTop:2 }}>
                  {s.ip} · {s.type}
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontFamily:'JetBrains Mono,monospace',
                  fontSize:12, color:'#ff8c00' }}>
                  {s.eps} EPS
                </span>
                <span style={{ fontSize:11, color:'#00ff88',
                  background:'rgba(0,255,136,0.08)',
                  border:'1px solid rgba(0,255,136,0.22)',
                  borderRadius:4, padding:'2px 8px' }}>
                  {s.status}
                </span>
              </div>
            </div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {s.logs.map(l => (
                <span key={l} style={{
                  fontSize:11, fontFamily:'JetBrains Mono,monospace',
                  color:'#6b7fa3', background:'rgba(74,96,144,0.12)',
                  border:'1px solid rgba(74,96,144,0.22)',
                  borderRadius:4, padding:'2px 8px',
                }}>{l}</span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}