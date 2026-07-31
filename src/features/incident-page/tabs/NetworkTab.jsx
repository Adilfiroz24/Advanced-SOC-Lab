import React from 'react';
import { Network, ArrowRight } from 'lucide-react';

const CONNECTIONS = [
  { src:'192.168.56.30',dst:'203.0.113.45', port:22,   proto:'TCP', bytes:4820,  direction:'outbound', suspicious:false },
  { src:'203.0.113.45',dst:'192.168.56.30', port:4444,  proto:'TCP', bytes:98432, direction:'inbound',  suspicious:true  },
  { src:'192.168.56.40',dst:'198.51.100.99',port:1389,  proto:'TCP', bytes:1024,  direction:'outbound', suspicious:true  },
  { src:'192.168.56.30',dst:'8.8.8.8',      port:53,   proto:'UDP', bytes:128,   direction:'outbound', suspicious:false },
  { src:'203.0.113.78', dst:'192.168.56.30',port:3389,  proto:'TCP', bytes:22048, direction:'inbound',  suspicious:true  },
];

export default function NetworkTab() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <Network size={16} color="#00e5ff" />
        <span style={{ fontSize:14, fontWeight:600, color:'#e8f4ff' }}>
          Network Connections
        </span>
      </div>

      <div className="glass-card" style={{ overflow:'hidden', padding:0 }}>
        <table className="soc-table">
          <thead>
            <tr>
              <th>SOURCE</th>
              <th>DIRECTION</th>
              <th>DESTINATION</th>
              <th style={{width:60}}>PORT</th>
              <th style={{width:60}}>PROTO</th>
              <th style={{width:80}}>BYTES</th>
              <th style={{width:100}}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {CONNECTIONS.map((c, i) => (
              <tr key={i}>
                <td style={{ fontFamily:'JetBrains Mono,monospace', fontSize:12 }}>
                  {c.src}
                </td>
                <td>
                  <ArrowRight size={13}
                    color={c.direction==='inbound' ? '#ff2d6d' : '#00e5ff'} />
                </td>
                <td style={{
                  fontFamily:'JetBrains Mono,monospace', fontSize:12,
                  color: c.suspicious ? '#ff8c00' : '#c8d8f0',
                }}>
                  {c.dst}
                </td>
                <td style={{ fontFamily:'JetBrains Mono,monospace', fontSize:12, color:'#6b7fa3' }}>
                  {c.port}
                </td>
                <td style={{ fontSize:12, color:'#6b7fa3' }}>{c.proto}</td>
                <td style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11.5 }}>
                  {c.bytes.toLocaleString()}
                </td>
                <td>
                  {c.suspicious ? (
                    <span className="badge badge-critical">Suspicious</span>
                  ) : (
                    <span className="badge badge-low">Normal</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}