import React from 'react';
import { motion } from 'framer-motion';
import { Target } from 'lucide-react';

const TACTIC_MAP = {
  'T1110.001': 'Credential Access',
  'T1003.001': 'Credential Access',
  'T1059.001': 'Execution',
  'T1136.001': 'Persistence',
  'T1098':     'Privilege Escalation',
  'T1490':     'Impact',
  'T1046':     'Discovery',
  'T1190':     'Initial Access',
};

export default function MITRETab({ caseData }) {
  const techniques = [
    ...(caseData.mitre || []),
    ...(caseData.observables?.flatMap(o => o.mitre || []) || []),
  ].filter((v, i, a) => a.indexOf(v) === i);

  const byTactic = techniques.reduce((acc, t) => {
    const tac = TACTIC_MAP[t] || 'Other';
    if (!acc[tac]) acc[tac] = [];
    acc[tac].push(t);
    return acc;
  }, {});

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <Target size={16} color="#00e5ff" />
        <span style={{ fontSize:14, fontWeight:600, color:'#e8f4ff' }}>
          MITRE ATT&CK Techniques
        </span>
        <span style={{
          fontFamily:'JetBrains Mono,monospace', fontSize:11,
          color:'#00e5ff', background:'rgba(0,229,255,0.10)',
          border:'1px solid rgba(0,229,255,0.22)',
          borderRadius:4, padding:'1px 7px',
        }}>{techniques.length} identified</span>
      </div>

      {Object.entries(byTactic).map(([tactic, techs]) => (
        <div key={tactic} className="glass-card" style={{ padding:'14px 16px' }}>
          <div style={{ fontSize:12, color:'#a855f7', fontWeight:600, marginBottom:10 }}>
            {tactic}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {techs.map(t => (
              <motion.div key={t}
                initial={{ opacity:0, x:-6 }}
                animate={{ opacity:1, x:0 }}
                style={{
                  display:'flex', alignItems:'center', gap:10,
                  padding:'10px 12px',
                  background:'rgba(168,85,247,0.06)',
                  border:'1px solid rgba(168,85,247,0.18)',
                  borderRadius:7,
                }}
              >
                <span className="mitre-tag">{t}</span>
                <span style={{ fontSize:12, color:'#c8d8f0' }}>
                  {t} — {TACTIC_MAP[t] || 'Technique'}
                </span>
                <div style={{ marginLeft:'auto' }}>
                  <a href={`https://attack.mitre.org/techniques/${t.replace('.','/')}/`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ fontSize:11, color:'#00e5ff', textDecoration:'none' }}>
                    View →
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ))}

      {techniques.length === 0 && (
        <div style={{ textAlign:'center', padding:'32px 0', color:'#3d5080' }}>
          No MITRE techniques identified for this case
        </div>
      )}
    </div>
  );
}