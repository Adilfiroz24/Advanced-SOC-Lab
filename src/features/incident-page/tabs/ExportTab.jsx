import React, { useState } from 'react';
import { Download, FileText, Code, Table } from 'lucide-react';

const EXPORT_FORMATS = [
  { id:'pdf',  icon:FileText, label:'PDF Report',    desc:'Full incident report with timeline and evidence' },
  { id:'json', icon:Code,     label:'JSON Export',   desc:'Machine-readable case data for SIEM/SOAR integration' },
  { id:'csv',  icon:Table,    label:'CSV Export',    desc:'Alert and IOC data for spreadsheet analysis' },
  { id:'stix', icon:Code,     label:'STIX 2.1',      desc:'Structured threat intelligence for sharing' },
];

export default function ExportTab({ caseData }) {
  const [exporting, setExporting] = useState(null);
  const [done,      setDone]      = useState([]);

  const doExport = (id) => {
    setExporting(id);
    setTimeout(() => {
      // Simulate download
      if (id === 'json') {
        const blob = new Blob([JSON.stringify(caseData, null, 2)], { type:'application/json' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url; a.download = `${caseData.id}.json`;
        a.click(); URL.revokeObjectURL(url);
      }
      setExporting(null);
      setDone(p => [...p, id]);
    }, 1000);
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ fontSize:14, fontWeight:600, color:'#e8f4ff',
        display:'flex', alignItems:'center', gap:8 }}>
        <Download size={15} color="#00e5ff" /> Export Case
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        {EXPORT_FORMATS.map(fmt => {
          const Icon     = fmt.icon;
          const isExporting = exporting === fmt.id;
          const isDone   = done.includes(fmt.id);
          return (
            <button key={fmt.id}
              onClick={() => !isExporting && doExport(fmt.id)}
              style={{
                background: isDone
                  ? 'rgba(0,255,136,0.07)'
                  : 'rgba(0,229,255,0.05)',
                border: `1px solid ${isDone
                  ? 'rgba(0,255,136,0.22)'
                  : 'rgba(0,229,255,0.15)'}`,
                borderRadius:10, padding:'16px 18px',
                cursor:'pointer', textAlign:'left',
                transition:'all 0.15s',
              }}
              onMouseEnter={e => !isDone && (e.currentTarget.style.background='rgba(0,229,255,0.10)')}
              onMouseLeave={e => !isDone && (e.currentTarget.style.background='rgba(0,229,255,0.05)')}
            >
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                <Icon size={16} color={isDone ? '#00ff88' : '#00e5ff'} />
                <span style={{ fontSize:13.5, fontWeight:600,
                  color: isDone ? '#00ff88' : '#e8f4ff' }}>
                  {fmt.label}
                </span>
              </div>
              <div style={{ fontSize:11.5, color:'#6b7fa3', lineHeight:1.5 }}>
                {fmt.desc}
              </div>
              {isExporting && (
                <div style={{ fontSize:11, color:'#ff8c00', marginTop:8 }}>
                  Preparing…
                </div>
              )}
              {isDone && (
                <div style={{ fontSize:11, color:'#00ff88', marginTop:8 }}>
                  ✓ Downloaded
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}