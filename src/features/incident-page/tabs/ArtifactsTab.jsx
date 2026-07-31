import React from 'react';
import { FileText, Download, Hash } from 'lucide-react';

const ARTIFACTS = [
  { name:'lsass.dmp',            type:'Memory Dump', size:'45 MB', hash:'5f1d8aa8…', acquired:'2024-01-15 10:24' },
  { name:'powershell_history.txt',type:'Log File',   size:'12 KB', hash:'3e4b7c91…', acquired:'2024-01-15 10:25' },
  { name:'registry_export.reg',  type:'Registry',   size:'8 KB',  hash:'9a2f5d1c…', acquired:'2024-01-15 10:26' },
  { name:'prefetch_files.zip',   type:'Prefetch',   size:'2.3 MB',hash:'7b8e3f4d…', acquired:'2024-01-15 10:27' },
  { name:'network_capture.pcap', type:'PCAP',       size:'18 MB', hash:'1c4d9e2f…', acquired:'2024-01-15 10:28' },
];

export default function ArtifactsTab() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ fontSize:14, fontWeight:600, color:'#e8f4ff' }}>
          Collected Artifacts
        </div>
        <span style={{
          fontFamily:'JetBrains Mono,monospace', fontSize:11, color:'#00e5ff',
          background:'rgba(0,229,255,0.08)', border:'1px solid rgba(0,229,255,0.20)',
          borderRadius:4, padding:'2px 8px',
        }}>{ARTIFACTS.length} files</span>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {ARTIFACTS.map(a => (
          <div key={a.name} style={{
            display:'flex', alignItems:'center', gap:12,
            padding:'12px 14px', background:'rgba(13,21,48,0.65)',
            border:'1px solid #1a2744', borderRadius:8,
          }}>
            <FileText size={16} color="#00e5ff" style={{ flexShrink:0 }} />
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, color:'#e8f4ff', fontWeight:500 }}>{a.name}</div>
              <div style={{ display:'flex', gap:10, marginTop:3, fontSize:11, color:'#3d5080' }}>
                <span>{a.type}</span>
                <span>·</span>
                <span>{a.size}</span>
                <span>·</span>
                <span style={{ fontFamily:'JetBrains Mono,monospace' }}>
                  {a.hash}
                </span>
              </div>
            </div>
            <div style={{ fontSize:11, color:'#3d5080', flexShrink:0 }}>
              {a.acquired}
            </div>
            <button style={{
              background:'rgba(0,229,255,0.08)',
              border:'1px solid rgba(0,229,255,0.20)',
              borderRadius:6, padding:'5px 10px',
              color:'#00e5ff', cursor:'pointer', fontSize:11,
              display:'flex', alignItems:'center', gap:5,
            }}>
              <Download size={11} /> Download
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}