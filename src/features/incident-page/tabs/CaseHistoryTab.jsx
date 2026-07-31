import React from 'react';
import { History } from 'lucide-react';

const HISTORY = [
  { time:'2024-01-15 10:28', user:'auto_investigate', action:'Case created', detail:'Auto-created from Wazuh alert rule 100013' },
  { time:'2024-01-15 10:29', user:'analyst-chen',     action:'Priority set', detail:'P1 — Critical severity assigned' },
  { time:'2024-01-15 10:30', user:'analyst-chen',     action:'Assigned',    detail:'Assigned to analyst-chen' },
  { time:'2024-01-15 10:32', user:'analyst-chen',     action:'Observable added', detail:'IP 203.0.113.45 added as malicious IOC' },
  { time:'2024-01-15 10:35', user:'analyst-patel',    action:'Task completed', detail:'Block source IP 203.0.113.45 — done' },
  { time:'2024-01-15 11:00', user:'analyst-patel',    action:'Tag added',   detail:'Tag "ransomware" added' },
];

export default function CaseHistoryTab() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ fontSize:14, fontWeight:600, color:'#e8f4ff',
        display:'flex', alignItems:'center', gap:8 }}>
        <History size={15} color="#00e5ff" /> Case History
      </div>

      <div style={{ position:'relative', paddingLeft:20 }}>
        {/* Vertical line */}
        <div style={{
          position:'absolute', left:6, top:0, bottom:0,
          width:1, background:'linear-gradient(to bottom, #1a2744, transparent)',
        }} />

        {HISTORY.map((h, i) => (
          <div key={i} style={{
            position:'relative', marginBottom:14, paddingLeft:20,
          }}>
            {/* Dot */}
            <div style={{
              position:'absolute', left:-8, top:4,
              width:8, height:8, borderRadius:'50%',
              background:'#00e5ff', boxShadow:'0 0 6px rgba(0,229,255,0.5)',
            }} />

            <div style={{
              background:'rgba(13,21,48,0.65)', border:'1px solid #1a2744',
              borderRadius:7, padding:'10px 12px',
            }}>
              <div style={{ display:'flex', justifyContent:'space-between',
                alignItems:'center', marginBottom:5 }}>
                <span style={{ fontSize:12.5, fontWeight:600, color:'#e8f4ff' }}>
                  {h.action}
                </span>
                <span style={{ fontSize:10.5, color:'#3d5080',
                  fontFamily:'JetBrains Mono,monospace' }}>{h.time}</span>
              </div>
              <div style={{ fontSize:11.5, color:'#6b7fa3' }}>
                <span style={{ color:'#00e5ff' }}>{h.user}</span>
                {' — '}{h.detail}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}