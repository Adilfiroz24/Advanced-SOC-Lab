import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, CheckCircle, AlertTriangle, Search } from 'lucide-react';

const RULES = [
  { id:'100001', level:10, sev:'high',     mitre:'T1110.001', desc:'SSH brute force — 10+ failures in 60s',                group:'auth_failed'    },
  { id:'100002', level:10, sev:'high',     mitre:'T1110',     desc:'Windows auth brute force (EventID 4625)',               group:'windows'        },
  { id:'100003', level:10, sev:'high',     mitre:'T1110.001', desc:'RDP brute force — 5+ failures in 30s',                 group:'rdp'            },
  { id:'100004', level:12, sev:'high',     mitre:'T1110',     desc:'Account locked out (EventID 4740)',                     group:'account_mgmt'   },
  { id:'100005', level:12, sev:'high',     mitre:'T1059.001', desc:'PowerShell encoded command execution',                  group:'powershell'     },
  { id:'100006', level:13, sev:'high',     mitre:'T1105',     desc:'Certutil LOLBin — URL cache download',                 group:'lolbin'         },
  { id:'100007', level:12, sev:'high',     mitre:'T1218.005', desc:'Mshta.exe execution (HTA script)',                     group:'lolbin'         },
  { id:'100008', level:12, sev:'high',     mitre:'T1047',     desc:'WMIC remote process creation',                         group:'lateral_move'   },
  { id:'100009', level:14, sev:'critical', mitre:'T1136.001', desc:'New local user account created (EventID 4720)',         group:'account_mgmt'   },
  { id:'100010', level:14, sev:'critical', mitre:'T1098',     desc:'User added to Administrators (EventID 4732)',           group:'priv_esc'       },
  { id:'100011', level:15, sev:'critical', mitre:'T1486',     desc:'Mass file modification — ransomware indicator',         group:'ransomware'     },
  { id:'100012', level:15, sev:'critical', mitre:'T1490',     desc:'Shadow copy deletion (vssadmin)',                       group:'ransomware'     },
  { id:'100013', level:15, sev:'critical', mitre:'T1003.001', desc:'LSASS memory access — Mimikatz pattern',               group:'cred_access'    },
  { id:'100014', level:8,  sev:'medium',   mitre:'T1046',     desc:'Network scan detected via Suricata',                   group:'network'        },
  { id:'100015', level:11, sev:'medium',   mitre:'T1547.001', desc:'Registry Run key modified',                            group:'persistence'    },
  { id:'100016', level:11, sev:'medium',   mitre:'T1048.001', desc:'DNS tunneling — high query volume',                    group:'exfil'          },
  { id:'100017', level:14, sev:'critical', mitre:'T1110',     desc:'Cowrie honeypot interaction',                          group:'honeypot'       },
  { id:'100018', level:12, sev:'high',     mitre:'T1548.003', desc:'Root shell obtained via sudo',                         group:'priv_esc'       },
  { id:'100019', level:15, sev:'critical', mitre:'T1190',     desc:'Log4Shell JNDI payload in HTTP header',                group:'exploit'        },
  { id:'100020', level:10, sev:'high',     mitre:'T1190',     desc:'SQL injection pattern in web logs',                    group:'web_attack'     },
];

const SEV_COLOR = { critical:'#ff2d6d', high:'#ff8c00', medium:'#ffd600', low:'#00ff88' };

export default function DetectionRules() {
  const [search, setSearch] = useState('');
  const filtered = RULES.filter(r =>
    !search || r.desc.toLowerCase().includes(search.toLowerCase()) ||
    r.mitre.toLowerCase().includes(search.toLowerCase()) ||
    r.id.includes(search)
  );

  return (
    <motion.div key="detection-rules"
      initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
      exit={{ opacity:0 }} transition={{ duration:0.25 }}
    >
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:700, color:'#e8f4ff', margin:0,
          display:'flex', alignItems:'center', gap:10 }}>
          <Shield size={20} color="#00e5ff" /> Detection Rules
        </h1>
        <div style={{ fontSize:13, color:'#3d5080', marginTop:4 }}>
          20 custom Wazuh rules · MITRE ATT&CK mapped · local_rules.xml
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:22 }}>
        {[
          { label:'Total Rules',    value:20,                                            color:'#00e5ff' },
          { label:'Critical (15)',  value:RULES.filter(r=>r.level===15).length,          color:'#ff2d6d' },
          { label:'High (10-14)',   value:RULES.filter(r=>r.level>=10&&r.level<15).length, color:'#ff8c00'},
          { label:'Medium (8-9)',   value:RULES.filter(r=>r.level<10).length,            color:'#ffd600' },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ padding:'14px 16px' }}>
            <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:24,
              fontWeight:700, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11.5, color:'#3d5080', marginTop:3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ position:'relative', marginBottom:14 }}>
        <Search size={13} color="#4a6090" style={{
          position:'absolute', left:10, top:'50%', transform:'translateY(-50%)',
        }} />
        <input className="soc-input" value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search rule ID, description, MITRE technique…"
          style={{ paddingLeft:30 }}
        />
      </div>

      {/* Rules table */}
      <div className="glass-card" style={{ overflow:'hidden', padding:0 }}>
        <table className="soc-table">
          <thead>
            <tr>
              <th style={{ width:90  }}>RULE ID</th>
              <th style={{ width:60  }}>LEVEL</th>
              <th style={{ width:100 }}>SEVERITY</th>
              <th style={{ width:110 }}>MITRE</th>
              <th>DESCRIPTION</th>
              <th style={{ width:130 }}>GROUP</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <motion.tr key={r.id}
                initial={{ opacity:0 }} animate={{ opacity:1 }}
                transition={{ delay: i * 0.02 }}
              >
                <td><span style={{ fontFamily:'JetBrains Mono,monospace',
                  fontSize:11.5, color:'#00e5ff' }}>{r.id}</span></td>
                <td><span style={{ fontFamily:'JetBrains Mono,monospace',
                  fontSize:12, color: r.level >= 15 ? '#ff2d6d'
                    : r.level >= 12 ? '#ff8c00' : '#ffd600' }}>
                  {r.level}/15
                </span></td>
                <td><span className={`badge badge-${r.sev}`}>{r.sev}</span></td>
                <td><span className="mitre-tag">{r.mitre}</span></td>
                <td style={{ fontSize:13, color:'#c8d8f0' }}>{r.desc}</td>
                <td><span style={{ fontSize:11, color:'#6b7fa3',
                  fontFamily:'JetBrains Mono,monospace' }}>{r.group}</span></td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}