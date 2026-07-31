import React from 'react';
import { motion } from 'framer-motion';
import { Eye } from 'lucide-react';

const EVENTS = [
  { id:1,  desc:'Process Creation',              enabled:true,  count:847,  coverage:'LOLBins, malicious scripts'   },
  { id:3,  desc:'Network Connection',            enabled:true,  count:1243, coverage:'Unusual outbound ports'        },
  { id:5,  desc:'Process Terminated',            enabled:true,  count:234,  coverage:'Security tool termination'     },
  { id:7,  desc:'Image Loaded (DLL)',             enabled:true,  count:0,    coverage:'Unsigned DLL loading'          },
  { id:8,  desc:'CreateRemoteThread',             enabled:true,  count:2,    coverage:'Process injection'             },
  { id:10, desc:'ProcessAccess (LSASS)',          enabled:true,  count:1,    coverage:'Credential dumping'            },
  { id:11, desc:'File Created',                   enabled:true,  count:423,  coverage:'Dropper activity'              },
  { id:12, desc:'Registry Object Added/Deleted', enabled:true,  count:56,   coverage:'Persistence mechanisms'        },
  { id:13, desc:'Registry Value Set',            enabled:true,  count:89,   coverage:'Run key modification'          },
  { id:22, desc:'DNS Query',                     enabled:true,  count:3421, coverage:'C2 beaconing, DNS tunneling'   },
];

export default function Sysmon() {
  return (
    <motion.div key="sysmon"
      initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
      exit={{ opacity:0 }} transition={{ duration:0.25 }}
    >
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:700, color:'#e8f4ff', margin:0,
          display:'flex', alignItems:'center', gap:10 }}>
          <Eye size={20} color="#00e5ff" /> Sysmon Events
        </h1>
        <div style={{ fontSize:13, color:'#3d5080', marginTop:4 }}>
          Sysmon 15.x · win10-victim (192.168.56.30) · Config: sysmon_config.xml
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:22 }}>
        {[
          { label:'Event Types Monitored', value:10,                           color:'#00e5ff' },
          { label:'Events (24h)',           value:EVENTS.reduce((s,e)=>s+e.count,0).toLocaleString(), color:'#ff8c00' },
          { label:'Critical Events',        value:EVENTS.filter(e=>e.count>0&&e.id===10).length, color:'#ff2d6d' },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ padding:'14px 16px' }}>
            <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:26,
              fontWeight:700, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11.5, color:'#3d5080', marginTop:3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="glass-card" style={{ overflow:'hidden', padding:0 }}>
        <div style={{ padding:'12px 16px', borderBottom:'1px solid #1a2744',
          fontSize:13, fontWeight:600, color:'#e8f4ff' }}>
          Monitored Event IDs
        </div>
        <table className="soc-table">
          <thead>
            <tr>
              <th style={{ width:80 }}>EVENT ID</th>
              <th>DESCRIPTION</th>
              <th style={{ width:80  }}>STATUS</th>
              <th style={{ width:100 }}>EVENTS (24h)</th>
              <th>COVERAGE</th>
            </tr>
          </thead>
          <tbody>
            {EVENTS.map((e, i) => (
              <motion.tr key={e.id}
                initial={{ opacity:0 }} animate={{ opacity:1 }}
                transition={{ delay: i * 0.03 }}>
                <td><span style={{ fontFamily:'JetBrains Mono,monospace',
                  color:'#00e5ff', fontSize:13 }}>{e.id}</span></td>
                <td style={{ fontSize:13, color:'#c8d8f0' }}>{e.desc}</td>
                <td>
                  <span style={{ fontSize:11, color: e.enabled ? '#00ff88' : '#ff2d6d',
                    background: e.enabled ? 'rgba(0,255,136,0.1)' : 'rgba(255,45,109,0.1)',
                    border:`1px solid ${e.enabled?'rgba(0,255,136,0.25)':'rgba(255,45,109,0.25)'}`,
                    borderRadius:4, padding:'1px 7px' }}>
                    {e.enabled ? 'Active' : 'Off'}
                  </span>
                </td>
                <td><span style={{ fontFamily:'JetBrains Mono,monospace',
                  color: e.count > 0 ? '#ff8c00' : '#3d5080' }}>
                  {e.count.toLocaleString()}
                </span></td>
                <td style={{ fontSize:11.5, color:'#6b7fa3' }}>{e.coverage}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}