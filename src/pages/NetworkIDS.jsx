import React from 'react';
import { motion } from 'framer-motion';
import { Network, Activity, Shield, AlertTriangle } from 'lucide-react';

const SURICATA_RULES = [
  { sid:'9000001', desc:'Nmap SYN Scan Detected',           proto:'TCP', mitre:'T1046',     hits:1243 },
  { sid:'9000002', desc:'Hydra SSH Brute Force',            proto:'TCP', mitre:'T1110.001', hits:47   },
  { sid:'9000003', desc:'Meterpreter Reverse Shell :4444',  proto:'TCP', mitre:'T1071.001', hits:3    },
  { sid:'9000004', desc:'RDP Brute Force Attempt',          proto:'TCP', mitre:'T1110.001', hits:12   },
  { sid:'9000005', desc:'Potential DNS Tunneling',          proto:'DNS', mitre:'T1048.001', hits:0    },
  { sid:'9000006', desc:'EternalBlue SMB Exploit Pattern',  proto:'TCP', mitre:'T1210',     hits:1    },
  { sid:'9000007', desc:'ICMP Flood',                       proto:'ICMP',mitre:'T1498',     hits:0    },
];

const RECENT_ALERTS = [
  { time:'2m ago',   src:'192.168.56.20', dst:'192.168.56.0/24', sig:'Nmap SYN Scan',            sev:'medium'   },
  { time:'8m ago',   src:'203.0.113.45',  dst:'192.168.56.40',   sig:'SSH Brute Force',           sev:'high'     },
  { time:'62m ago',  src:'198.51.100.23', dst:'192.168.56.10',   sig:'Meterpreter Port 4444',    sev:'critical' },
  { time:'90m ago',  src:'192.168.56.20', dst:'192.168.56.30',   sig:'RDP Brute Force Attempt',  sev:'high'     },
];

export default function NetworkIDS() {
  return (
    <motion.div key="network-ids"
      initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
      exit={{ opacity:0 }} transition={{ duration:0.25 }}
    >
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:700, color:'#e8f4ff', margin:0,
          display:'flex', alignItems:'center', gap:10 }}>
          <Network size={20} color="#00e5ff" /> Network IDS/IPS
        </h1>
        <div style={{ fontSize:13, color:'#3d5080', marginTop:4 }}>
          Suricata 7.0 · Emerging Threats Open + custom rules · EVE JSON → Wazuh
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:22 }}>
        {[
          { label:'Custom Rules',    value:7,    color:'#00e5ff', icon:Shield       },
          { label:'Total Alerts',    value:1306, color:'#ff8c00', icon:AlertTriangle },
          { label:'Rules Firing',    value:5,    color:'#ffd600', icon:Activity      },
          { label:'Blocked Threats', value:3,    color:'#ff2d6d', icon:Shield        },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ padding:'14px 16px' }}>
            <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:26,
              fontWeight:700, color:s.color, marginBottom:4 }}>{s.value}</div>
            <div style={{ fontSize:11.5, color:'#3d5080' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        {/* Custom rules */}
        <div className="glass-card" style={{ padding:'18px 20px' }}>
          <div style={{ fontSize:14, fontWeight:600, color:'#e8f4ff', marginBottom:14 }}>
            Custom Suricata Rules
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {SURICATA_RULES.map(r => (
              <div key={r.sid} style={{
                display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'8px 10px',
                background: r.hits > 0 ? 'rgba(0,229,255,0.04)' : 'transparent',
                borderRadius:7, border:'1px solid',
                borderColor: r.hits > 0 ? 'rgba(0,229,255,0.12)' : '#1a2744',
              }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12.5, color:'#c8d8f0',
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {r.desc}
                  </div>
                  <div style={{ display:'flex', gap:8, marginTop:3, fontSize:10.5, color:'#3d5080' }}>
                    <span style={{ fontFamily:'JetBrains Mono,monospace' }}>SID:{r.sid}</span>
                    <span>{r.proto}</span>
                    <span className="mitre-tag">{r.mitre}</span>
                  </div>
                </div>
                <div style={{
                  fontFamily:'JetBrains Mono,monospace', fontSize:13, fontWeight:700,
                  color: r.hits > 100 ? '#ff2d6d' : r.hits > 0 ? '#ff8c00' : '#3d5080',
                  flexShrink:0, marginLeft:12,
                }}>
                  {r.hits.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent detections */}
        <div className="glass-card" style={{ padding:'18px 20px' }}>
          <div style={{ fontSize:14, fontWeight:600, color:'#e8f4ff', marginBottom:14 }}>
            Recent Network Alerts
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {RECENT_ALERTS.map((a, i) => (
              <div key={i} className="glass-card" style={{ padding:'10px 12px',
                borderLeft:`3px solid ${
                  a.sev==='critical'?'#ff2d6d':a.sev==='high'?'#ff8c00':'#ffd600'}` }}>
                <div style={{ fontSize:12.5, color:'#c8d8f0', fontWeight:500 }}>{a.sig}</div>
                <div style={{ display:'flex', gap:10, marginTop:4, fontSize:11, color:'#3d5080' }}>
                  <span style={{ fontFamily:'JetBrains Mono,monospace', color:'#ff8c00' }}>
                    {a.src}
                  </span>
                  <span>→</span>
                  <span style={{ fontFamily:'JetBrains Mono,monospace' }}>{a.dst}</span>
                  <span style={{ marginLeft:'auto' }}>{a.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Suricata status */}
      <div className="glass-card" style={{ padding:'16px 20px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span className="live-dot" />
          <span style={{ fontSize:13, color:'#00ff88', fontWeight:600 }}>
            Suricata is running
          </span>
          <span style={{ fontSize:12, color:'#3d5080', marginLeft:8 }}>
            Interface: eth1 · Mode: IDS/IPS inline · Log: /var/log/suricata/eve.json
          </span>
        </div>
      </div>
    </motion.div>
  );
}