import React from 'react';
import { motion } from 'framer-motion';
import { Radio } from 'lucide-react';

const AGENTS = [
  { name:'win10-victim',     paw:'abc123', platform:'windows', status:'trusted', last_seen:'30s ago' },
  { name:'ubuntu-webserver', paw:'def456', platform:'linux',   status:'trusted', last_seen:'45s ago' },
];

const ABILITIES = [
  { id:'1f7ff232', name:'Discovery — System Info',   tactic:'Discovery',          technique:'T1082', status:'completed' },
  { id:'2c91cee',  name:'Credential Dump (safe sim)',tactic:'Credential Access',  technique:'T1003', status:'completed' },
  { id:'8ef65c',   name:'PowerShell Encoded',        tactic:'Execution',          technique:'T1059', status:'completed' },
  { id:'9abc12',   name:'Registry Run Key',          tactic:'Persistence',        technique:'T1547', status:'completed' },
];

export default function Caldera() {
  return (
    <motion.div key="caldera"
      initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
      exit={{ opacity:0 }} transition={{ duration:0.25 }}
    >
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:700, color:'#e8f4ff', margin:0,
          display:'flex', alignItems:'center', gap:10 }}>
          <Radio size={20} color="#00e5ff" /> MITRE Caldera
        </h1>
        <div style={{ fontSize:13, color:'#3d5080', marginTop:4 }}>
          Adversary emulation server · http://192.168.56.10:8888
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        {/* Active agents */}
        <div className="glass-card" style={{ padding:'18px 20px' }}>
          <div style={{ fontSize:14, fontWeight:600, color:'#e8f4ff', marginBottom:12 }}>
            Active Agents (Sandcat)
          </div>
          {AGENTS.map(a => (
            <div key={a.paw} style={{
              display:'flex', alignItems:'center', gap:12,
              padding:'10px 12px', marginBottom:8,
              background:'rgba(0,229,255,0.04)',
              border:'1px solid rgba(0,229,255,0.12)', borderRadius:7,
            }}>
              <span className="live-dot" />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, color:'#e8f4ff', fontWeight:500 }}>{a.name}</div>
                <div style={{ fontSize:11, color:'#3d5080', marginTop:2 }}>
                  {a.platform} · paw:{a.paw} · {a.last_seen}
                </div>
              </div>
              <span style={{ fontSize:10.5, color:'#00ff88',
                background:'rgba(0,255,136,0.08)',
                border:'1px solid rgba(0,255,136,0.22)',
                borderRadius:4, padding:'1px 8px' }}>{a.status}</span>
            </div>
          ))}
        </div>

        {/* Last operation */}
        <div className="glass-card" style={{ padding:'18px 20px' }}>
          <div style={{ fontSize:14, fontWeight:600, color:'#e8f4ff', marginBottom:12 }}>
            Last Operation: SOC-Lab-Validation
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {ABILITIES.map(ab => (
              <div key={ab.id} style={{
                display:'flex', alignItems:'center', gap:10,
                padding:'9px 11px',
                background:'rgba(0,229,255,0.03)',
                border:'1px solid #1a2744', borderRadius:6,
              }}>
                <span style={{ fontSize:12,
                  color:'#00ff88' }}>✓</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12.5, color:'#c8d8f0' }}>{ab.name}</div>
                  <div style={{ fontSize:11, color:'#3d5080', marginTop:1 }}>{ab.tactic}</div>
                </div>
                <span className="mitre-tag">{ab.technique}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ padding:'16px 20px' }}>
        <div style={{ fontSize:12.5, color:'#6b7fa3', marginBottom:8 }}>Quick Start</div>
        <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11.5,
          color:'#00e5ff', background:'rgba(0,0,0,0.3)',
          border:'1px solid #1a2744', borderRadius:5, padding:'10px 14px' }}>
          python3 server.py --insecure --build
          <br />
          # Then browse to http://192.168.56.10:8888
          <br />
          # Default creds shown in console output on first run
        </div>
      </div>
    </motion.div>
  );
}