import React from 'react';
import { Shield, Clock, User, AlertTriangle, CheckCircle } from 'lucide-react';

export default function SummaryTab({ caseData }) {
  const c = caseData;
  const sevColor = {4:'#ff2d6d',3:'#ff8c00',2:'#ffd600',1:'#00ff88'}[c.severity] || '#6b7fa3';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
        {[
          { label:'Severity',  value: ['','Low','Medium','High','Critical'][c.severity], color: sevColor },
          { label:'Status',    value: c.status,          color: c.status==='Resolved'?'#00ff88':'#ff8c00' },
          { label:'Priority',  value: c.priority || 'P2',color: '#ff2d6d' },
          { label:'Tasks',     value:`${c.tasks_done}/${c.tasks_total}`, color:'#00e5ff' },
        ].map(s => (
          <div key={s.label} style={{
            background:'rgba(0,229,255,0.04)',
            border:'1px solid #1a2744', borderRadius:8,
            padding:'12px 14px', textAlign:'center',
          }}>
            <div style={{ fontFamily:'JetBrains Mono,monospace',
              fontSize:20, fontWeight:700, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:10.5, color:'#3d5080', marginTop:3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div style={{
        background:'rgba(0,0,0,0.2)', border:'1px solid #1a2744',
        borderRadius:8, padding:'14px 16px',
      }}>
        <div style={{ fontSize:11.5, color:'#3d5080', marginBottom:8 }}>Case Summary</div>
        <div style={{ fontSize:13, color:'#c8d8f0', lineHeight:1.7 }}>{c.summary}</div>
      </div>

      {/* Meta grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        {[
          ['Case ID',     c.id],
          ['Assigned To', c.assigned_to || '—'],
          ['Created',     new Date(c.created_at).toLocaleString()],
          ['Updated',     new Date(c.updated_at).toLocaleString()],
        ].map(([k,v]) => (
          <div key={k} style={{
            background:'rgba(0,0,0,0.15)', border:'1px solid #1a2744',
            borderRadius:7, padding:'10px 12px',
          }}>
            <div style={{ fontSize:10.5, color:'#3d5080', marginBottom:4 }}>{k}</div>
            <div style={{ fontSize:12.5, color:'#c8d8f0',
              fontFamily:'JetBrains Mono,monospace' }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Tags */}
      {c.tags?.length > 0 && (
        <div>
          <div style={{ fontSize:11, color:'#3d5080', marginBottom:7 }}>Tags</div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {c.tags.map(t => (
              <span key={t} style={{
                fontSize:11, color:'#6b7fa3',
                background:'rgba(74,96,144,0.12)',
                border:'1px solid rgba(74,96,144,0.22)',
                borderRadius:4, padding:'2px 8px',
              }}>#{t}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}