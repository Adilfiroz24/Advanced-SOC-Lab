import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ExternalLink } from 'lucide-react';

const REFS = [
  { cat:'Documentation', items:[
    { name:'Wazuh Documentation',          url:'https://documentation.wazuh.com' },
    { name:'Wazuh API Reference',          url:'https://documentation.wazuh.com/current/user-manual/api/reference.html' },
    { name:'TheHive API Docs',             url:'https://docs.strangebee.com/thehive/api-docs/' },
    { name:'MISP Documentation',           url:'https://www.misp-project.org/documentation/' },
    { name:'Suricata Docs',                url:'https://suricata.readthedocs.io' },
  ]},
  { cat:'MITRE Resources', items:[
    { name:'MITRE ATT&CK Enterprise',      url:'https://attack.mitre.org' },
    { name:'ATT&CK Navigator',             url:'https://mitre-attack.github.io/attack-navigator/' },
    { name:'MITRE Caldera',                url:'https://caldera.readthedocs.io' },
    { name:'Atomic Red Team',              url:'https://github.com/redcanaryco/atomic-red-team' },
  ]},
  { cat:'Threat Intelligence', items:[
    { name:'AbuseIPDB',                    url:'https://www.abuseipdb.com' },
    { name:'VirusTotal',                   url:'https://www.virustotal.com' },
    { name:'AlienVault OTX',              url:'https://otx.alienvault.com' },
    { name:'Sigma Rules (SigmaHQ)',        url:'https://github.com/SigmaHQ/sigma' },
  ]},
  { cat:'Compliance', items:[
    { name:'PCI-DSS v4.0',                url:'https://www.pcisecuritystandards.org' },
    { name:'HIPAA Security Rule',          url:'https://www.hhs.gov/hipaa/for-professionals/security' },
    { name:'NIST CSF 2.0',               url:'https://www.nist.gov/cyberframework' },
  ]},
];

export default function References() {
  return (
    <motion.div key="references"
      initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
      exit={{ opacity:0 }} transition={{ duration:0.25 }}
    >
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:700, color:'#e8f4ff', margin:0,
          display:'flex', alignItems:'center', gap:10 }}>
          <BookOpen size={20} color="#00e5ff" /> References & Appendices
        </h1>
        <div style={{ fontSize:13, color:'#3d5080', marginTop:4 }}>
          Documentation, APIs, compliance frameworks, and community resources
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {REFS.map(section => (
          <div key={section.cat} className="glass-card" style={{ padding:'18px 20px' }}>
            <div style={{ fontSize:14, fontWeight:600, color:'#e8f4ff', marginBottom:14 }}>
              {section.cat}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {section.items.map(item => (
                <a key={item.name} href={item.url} target="_blank" rel="noopener noreferrer"
                  style={{
                    display:'flex', alignItems:'center', gap:8,
                    padding:'9px 12px',
                    background:'rgba(0,229,255,0.04)',
                    border:'1px solid rgba(0,229,255,0.10)',
                    borderRadius:7, textDecoration:'none',
                    transition:'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(0,229,255,0.09)';
                    e.currentTarget.style.borderColor = 'rgba(0,229,255,0.25)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(0,229,255,0.04)';
                    e.currentTarget.style.borderColor = 'rgba(0,229,255,0.10)';
                  }}
                >
                  <span style={{ flex:1, fontSize:13, color:'#c8d8f0' }}>{item.name}</span>
                  <ExternalLink size={12} color="#3d5080" />
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}