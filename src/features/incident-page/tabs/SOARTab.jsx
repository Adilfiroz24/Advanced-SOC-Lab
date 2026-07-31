import React, { useState } from 'react';
import { Zap, CheckCircle, Clock, Play } from 'lucide-react';

const ACTIONS = [
  { id:1, action:'Block IP 203.0.113.45',        tool:'block_ip.py',       time:'2024-01-15 10:32', status:'success' },
  { id:2, action:'AbuseIPDB enrich 203.0.113.45',tool:'abuseipdb_enrichment',time:'2024-01-15 10:31',status:'success' },
  { id:3, action:'TheHive case P1 created',       tool:'auto_investigate',  time:'2024-01-15 10:30', status:'success' },
  { id:4, action:'Slack P1 notification sent',    tool:'cortex_responders', time:'2024-01-15 10:30', status:'success' },
  { id:5, action:'Block IP 203.0.113.78',         tool:'block_ip.py',       time:'2024-01-15 10:35', status:'pending' },
];

const PLAYBOOKS = [
  'SSH Brute Force Response',
  'Credential Dumping Response',
  'Ransomware Pre-Attack',
];

export default function SOARTab() {
  const [running, setRunning] = useState(null);

  const run = (pb) => {
    setRunning(pb);
    setTimeout(() => setRunning(null), 2000);
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ fontSize:14, fontWeight:600, color:'#e8f4ff',
        display:'flex', alignItems:'center', gap:8 }}>
        <Zap size={15} color="#00e5ff" /> SOAR Automation
      </div>

      {/* Manual playbook trigger */}
      <div style={{
        background:'rgba(0,229,255,0.04)', border:'1px solid rgba(0,229,255,0.15)',
        borderRadius:8, padding:'14px 16px',
      }}>
        <div style={{ fontSize:12, color:'#6b7fa3', marginBottom:10 }}>
          Run Playbook
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {PLAYBOOKS.map(pb => (
            <button key={pb}
              onClick={() => run(pb)}
              disabled={!!running}
              style={{
                background: running===pb ? 'rgba(0,255,136,0.10)' : 'rgba(0,229,255,0.07)',
                border:`1px solid ${running===pb ? 'rgba(0,255,136,0.25)' : 'rgba(0,229,255,0.18)'}`,
                borderRadius:7, padding:'9px 12px', cursor:'pointer',
                color: running===pb ? '#00ff88' : '#c8d8f0',
                fontSize:12.5, textAlign:'left',
                display:'flex', alignItems:'center', gap:8,
                transition:'all 0.15s',
              }}
            >
              <Play size={12} color={running===pb ? '#00ff88' : '#00e5ff'} />
              {pb}
              {running===pb && (
                <span style={{ marginLeft:'auto', fontSize:11, color:'#00ff88' }}>Running…</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Action log */}
      <div>
        <div style={{ fontSize:12, color:'#3d5080', marginBottom:10,
          fontWeight:600, letterSpacing:'0.07em', textTransform:'uppercase',
          fontFamily:'JetBrains Mono,monospace' }}>
          Automation Log
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
          {ACTIONS.map(a => (
            <div key={a.id} style={{
              display:'flex', alignItems:'center', gap:10,
              padding:'10px 12px', background:'rgba(13,21,48,0.65)',
              border:'1px solid #1a2744', borderRadius:7,
            }}>
              {a.status==='success'
                ? <CheckCircle size={13} color="#00ff88" />
                : <Clock       size={13} color="#ff8c00" />
              }
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12.5, color:'#c8d8f0' }}>{a.action}</div>
                <div style={{ fontSize:11, color:'#3d5080', marginTop:2 }}>
                  {a.tool} · {a.time}
                </div>
              </div>
              <span style={{
                fontSize:10.5,
                color: a.status==='success' ? '#00ff88' : '#ff8c00',
              }}>
                {a.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}