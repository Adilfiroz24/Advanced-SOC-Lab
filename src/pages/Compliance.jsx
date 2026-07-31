import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';

const CONTROLS = [
  { req:'REQ-10.2.1.4', standard:'PCI-DSS v4.0', desc:'Log invalid auth attempts',       rules:'100001-100004', status:'met'     },
  { req:'REQ-10.2.1.2', standard:'PCI-DSS v4.0', desc:'Log all admin/root actions',       rules:'100009,100010', status:'met'     },
  { req:'REQ-10.4.1',   standard:'PCI-DSS v4.0', desc:'Daily automated log review',       rules:'auto_investigate.py', status:'met' },
  { req:'REQ-11.4.1',   standard:'PCI-DSS v4.0', desc:'IDS/IPS in place',                 rules:'Suricata SIDs', status:'met'     },
  { req:'REQ-11.3.2',   standard:'PCI-DSS v4.0', desc:'Annual penetration test',          rules:'Purple team docs', status:'partial'},
  { req:'§164.308(a)(6)','standard':'HIPAA',      desc:'Security incident procedures',    rules:'TheHive playbooks', status:'met'  },
  { req:'§164.312(b)',   'standard':'HIPAA',      desc:'Audit controls',                  rules:'Wazuh + Sysmon',  status:'met'    },
  { req:'§164.312(d)',   'standard':'HIPAA',      desc:'Authentication controls',         rules:'100001-100004',   status:'met'    },
];

export default function Compliance() {
  const met     = CONTROLS.filter(c => c.status === 'met').length;
  const partial = CONTROLS.filter(c => c.status === 'partial').length;

  return (
    <motion.div key="compliance"
      initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
      exit={{ opacity:0 }} transition={{ duration:0.25 }}
    >
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:700, color:'#e8f4ff', margin:0,
          display:'flex', alignItems:'center', gap:10 }}>
          <ShieldCheck size={20} color="#00e5ff" /> Compliance Reporting
        </h1>
        <div style={{ fontSize:13, color:'#3d5080', marginTop:4 }}>
          PCI-DSS v4.0 · HIPAA Security Rule · NIST CSF 2.0
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:22 }}>
        {[
          { label:'Controls Mapped', value:CONTROLS.length, color:'#00e5ff' },
          { label:'Met',             value:met,              color:'#00ff88' },
          { label:'Partial / Open',  value:partial,          color:'#ff8c00' },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ padding:'14px 16px' }}>
            <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:26,
              fontWeight:700, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11.5, color:'#3d5080', marginTop:3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="glass-card" style={{ overflow:'hidden', padding:0 }}>
        <table className="soc-table">
          <thead>
            <tr>
              <th style={{ width:130 }}>REQUIREMENT</th>
              <th style={{ width:110 }}>STANDARD</th>
              <th>DESCRIPTION</th>
              <th style={{ width:160 }}>SOC CONTROL</th>
              <th style={{ width:90  }}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {CONTROLS.map((c, i) => (
              <motion.tr key={c.req}
                initial={{ opacity:0 }} animate={{ opacity:1 }}
                transition={{ delay: i * 0.03 }}>
                <td><span style={{ fontFamily:'JetBrains Mono,monospace',
                  fontSize:11, color:'#00e5ff' }}>{c.req}</span></td>
                <td><span style={{ fontSize:11.5, color:'#6b7fa3' }}>{c.standard}</span></td>
                <td style={{ fontSize:12.5, color:'#c8d8f0' }}>{c.desc}</td>
                <td><span style={{ fontFamily:'JetBrains Mono,monospace',
                  fontSize:11, color:'#6b7fa3' }}>{c.rules}</span></td>
                <td>
                  <span style={{ fontSize:11,
                    color: c.status==='met'?'#00ff88':c.status==='partial'?'#ff8c00':'#ff2d6d',
                    background: c.status==='met'?'rgba(0,255,136,0.08)':'rgba(255,140,0,0.08)',
                    border:`1px solid ${c.status==='met'?'rgba(0,255,136,0.25)':'rgba(255,140,0,0.25)'}`,
                    borderRadius:4, padding:'1px 8px', textTransform:'uppercase' }}>
                    {c.status}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}