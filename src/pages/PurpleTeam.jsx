import React from 'react';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import { mockAlerts } from '../data/mockAlerts';

const TESTS = [
  { technique:'T1110.001', name:'SSH Brute Force',        rule:'100001', fired:true,  mttd:'52s'  },
  { technique:'T1110.001', name:'RDP Brute Force',        rule:'100003', fired:true,  mttd:'28s'  },
  { technique:'T1046',     name:'Nmap Network Scan',      rule:'100014', fired:true,  mttd:'9s'   },
  { technique:'T1059.001', name:'PowerShell Encoded Cmd', rule:'100005', fired:true,  mttd:'7s'   },
  { technique:'T1136.001', name:'Create Local Account',   rule:'100009', fired:true,  mttd:'12s'  },
  { technique:'T1098',     name:'Add User to Admins',     rule:'100010', fired:true,  mttd:'14s'  },
  { technique:'T1490',     name:'Shadow Copy Deletion',   rule:'100012', fired:true,  mttd:'6s'   },
  { technique:'T1003.001', name:'LSASS Access (Mimikatz)',rule:'100013', fired:true,  mttd:'4s'   },
  { technique:'T1547.001', name:'Registry Persistence',   rule:'100015', fired:true,  mttd:'11s'  },
  { technique:'T1105',     name:'Certutil Download',      rule:'100006', fired:true,  mttd:'8s'   },
  { technique:'T1190',     name:'Log4Shell Payload',      rule:'100019', fired:true,  mttd:'5s'   },
  { technique:'T1110',     name:'Honeypot Interaction',   rule:'100017', fired:true,  mttd:'3s'   },
  { technique:'T1021',     name:'Lateral Movement RDP',   rule:'—',      fired:false, mttd:'—'    },
  { technique:'T1486',     name:'File Encryption Sim',    rule:'100011', fired:false, mttd:'—'    },
];

export default function PurpleTeam() {
  const fired = TESTS.filter(t => t.fired).length;
  const rate  = Math.round(fired / TESTS.length * 100);

  return (
    <motion.div key="purple-team"
      initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
      exit={{ opacity:0 }} transition={{ duration:0.25 }}
    >
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:700, color:'#e8f4ff', margin:0,
          display:'flex', alignItems:'center', gap:10 }}>
          <Activity size={20} color="#00e5ff" /> Purple Team Exercises
        </h1>
        <div style={{ fontSize:13, color:'#3d5080', marginTop:4 }}>
          Atomic Red Team · MITRE Caldera · Detection validation
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:22 }}>
        {[
          { label:'Tests Executed', value:TESTS.length, color:'#00e5ff' },
          { label:'Alerts Fired',   value:fired,         color:'#00ff88' },
          { label:'Detection Rate', value:`${rate}%`,    color: rate>=90?'#00ff88':'#ff8c00' },
          { label:'Gaps Found',     value:TESTS.length-fired, color:'#ff2d6d' },
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
              <th style={{ width:110 }}>TECHNIQUE</th>
              <th>TEST NAME</th>
              <th style={{ width:90 }}>WAZUH RULE</th>
              <th style={{ width:100 }}>ALERT FIRED</th>
              <th style={{ width:80 }}>MTTD</th>
            </tr>
          </thead>
          <tbody>
            {TESTS.map((t, i) => (
              <motion.tr key={i}
                initial={{ opacity:0 }} animate={{ opacity:1 }}
                transition={{ delay: i * 0.025 }}>
                <td><span className="mitre-tag">{t.technique}</span></td>
                <td style={{ fontSize:13, color:'#c8d8f0' }}>{t.name}</td>
                <td><span style={{ fontFamily:'JetBrains Mono,monospace',
                  fontSize:11.5, color:'#6b7fa3' }}>{t.rule}</span></td>
                <td>
                  <span style={{ fontSize:11.5,
                    color: t.fired ? '#00ff88' : '#ff2d6d',
                    display:'flex', alignItems:'center', gap:5 }}>
                    {t.fired ? '✓ YES' : '✗ NO'}
                  </span>
                </td>
                <td><span style={{ fontFamily:'JetBrains Mono,monospace',
                  fontSize:12, color: t.mttd==='—' ? '#3d5080' : '#00e5ff' }}>
                  {t.mttd}
                </span></td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}