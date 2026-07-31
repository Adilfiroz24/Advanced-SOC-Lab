import React from 'react';
import { motion } from 'framer-motion';
import { Zap, CheckCircle, Clock, FolderOpen } from 'lucide-react';

const PLAYBOOKS = [
  { name:'SSH Brute Force Response',      trigger:'Rule 100001 (level 10+)', steps:['Enrich src IP (AbuseIPDB)','Create TheHive case','Block IP if score > 50%','Notify Slack'], status:'active' },
  { name:'Credential Dumping Response',   trigger:'Rule 100013 (level 15)',   steps:['Create P1 TheHive case','Isolate host via Wazuh AR','Reset credentials','Page on-call'], status:'active' },
  { name:'Ransomware Pre-Attack',         trigger:'Rule 100012 (level 15)',   steps:['EMERGENCY alert','Isolate endpoint','Preserve forensic image','Notify CISO'],   status:'active' },
  { name:'Honeypot Interaction',          trigger:'Rule 100017 (level 14)',   steps:['Log attacker session','Block attacker IP','Submit IOCs to MISP','Create case'],  status:'active' },
];

const RECENT_ACTIONS = [
  { action:'Block IP 203.0.113.45',       tool:'block_ip.py',      time:'8m ago',  result:'success' },
  { action:'TheHive case CASE-2024-0047', tool:'auto_investigate',  time:'2m ago',  result:'success' },
  { action:'AbuseIPDB enrich 198.51.100.23',tool:'abuseipdb',      time:'62m ago', result:'success' },
  { action:'Slack P1 notification',       tool:'cortex_responders', time:'2m ago',  result:'success' },
];

export default function SOAR() {
  return (
    <motion.div key="soar"
      initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
      exit={{ opacity:0 }} transition={{ duration:0.25 }}
    >
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:700, color:'#e8f4ff', margin:0,
          display:'flex', alignItems:'center', gap:10 }}>
          <Zap size={20} color="#00e5ff" /> SOAR / TheHive
        </h1>
        <div style={{ fontSize:13, color:'#3d5080', marginTop:4 }}>
          TheHive 5 + Cortex 3 · auto_investigate.py · block_ip.py
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:22 }}>
        {[
          { label:'Active Playbooks',  value:4,  color:'#00e5ff' },
          { label:'Actions (24h)',     value:8,  color:'#00ff88' },
          { label:'Cases Auto-Created',value:5,  color:'#ff8c00' },
          { label:'IPs Auto-Blocked',  value:3,  color:'#ff2d6d' },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ padding:'14px 16px' }}>
            <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:26,
              fontWeight:700, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11.5, color:'#3d5080', marginTop:3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {/* Playbooks */}
        <div>
          <div style={{ fontSize:14, fontWeight:600, color:'#e8f4ff', marginBottom:12 }}>
            Response Playbooks
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {PLAYBOOKS.map((p, i) => (
              <motion.div key={p.name} className="glass-card"
                style={{ padding:'14px 16px' }}
                initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }}
                transition={{ delay: i * 0.07 }}>
                <div style={{ display:'flex', justifyContent:'space-between',
                  alignItems:'center', marginBottom:8 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'#e8f4ff' }}>
                    {p.name}
                  </div>
                  <span style={{ fontSize:10.5, color:'#00ff88',
                    background:'rgba(0,255,136,0.08)',
                    border:'1px solid rgba(0,255,136,0.22)',
                    borderRadius:4, padding:'1px 7px' }}>active</span>
                </div>
                <div style={{ fontSize:11, color:'#3d5080', marginBottom:8 }}>
                  Trigger: {p.trigger}
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  {p.steps.map((step, j) => (
                    <div key={j} style={{ display:'flex', alignItems:'center',
                      gap:7, fontSize:11.5, color:'#6b7fa3' }}>
                      <CheckCircle size={10} color="#00e5ff" />
                      {step}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recent actions */}
        <div>
          <div style={{ fontSize:14, fontWeight:600, color:'#e8f4ff', marginBottom:12 }}>
            Recent Automation Actions
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {RECENT_ACTIONS.map((a, i) => (
              <div key={i} className="glass-card" style={{ padding:'12px 14px' }}>
                <div style={{ fontSize:12.5, color:'#c8d8f0' }}>{a.action}</div>
                <div style={{ display:'flex', justifyContent:'space-between',
                  marginTop:5, fontSize:11, color:'#3d5080' }}>
                  <span style={{ fontFamily:'JetBrains Mono,monospace', color:'#6b7fa3' }}>
                    {a.tool}
                  </span>
                  <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                    <span>{a.time}</span>
                    <span style={{ color:'#00ff88' }}>✓ {a.result}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}