import React from 'react';
import { motion } from 'framer-motion';
import { Target } from 'lucide-react';
import MITREHeatmap from '../components/MITREHeatmap';
import { mitreCoverage } from '../data/mockThreatIntel';

export default function MITRE() {
  const covered = mitreCoverage.filter(d => d.covered).length;
  const tested  = mitreCoverage.filter(d => d.tested).length;
  const total   = mitreCoverage.length;

  return (
    <motion.div key="mitre"
      initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
      exit={{ opacity:0 }} transition={{ duration:0.25 }}
    >
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:700, color:'#e8f4ff', margin:0,
          display:'flex', alignItems:'center', gap:10 }}>
          <Target size={20} color="#00e5ff" /> MITRE ATT&CK Coverage
        </h1>
        <div style={{ fontSize:13, color:'#3d5080', marginTop:4 }}>
          Enterprise v14 · {covered}/{total} techniques covered · {tested} tested
        </div>
      </div>

      {/* Summary */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:22 }}>
        {[
          { label:'Techniques Covered', value:`${covered}/${total}`, color:'#00e5ff' },
          { label:'Actively Tested',    value:tested,                color:'#00ff88' },
          { label:'Coverage %',         value:`${Math.round(covered/total*100)}%`, color:'#7b2fff' },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ padding:'16px 18px' }}>
            <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:28,
              fontWeight:700, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:12, color:'#3d5080', marginTop:4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="glass-card" style={{ padding:'20px 22px', marginBottom:16 }}>
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:14.5, fontWeight:600, color:'#e8f4ff' }}>
            ATT&CK Coverage Heatmap
          </div>
          <div style={{ fontSize:11.5, color:'#3d5080', marginTop:3 }}>
            Hover any cell for details · Cyan border = technique has been tested
          </div>
        </div>
        <MITREHeatmap data={mitreCoverage} />
      </div>

      <div className="glass-card" style={{ padding:'18px 20px' }}>
        <div style={{ fontSize:14, fontWeight:600, color:'#e8f4ff', marginBottom:14 }}>
          Coverage by Tactic
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {[...new Set(mitreCoverage.map(d => d.tactic))].map(tactic => {
            const items   = mitreCoverage.filter(d => d.tactic === tactic);
            const covCnt  = items.filter(d => d.covered).length;
            const pct     = Math.round(covCnt / items.length * 100);
            return (
              <div key={tactic}>
                <div style={{ display:'flex', justifyContent:'space-between',
                  marginBottom:5, fontSize:12.5 }}>
                  <span style={{ color:'#c8d8f0' }}>{tactic}</span>
                  <span style={{ fontFamily:'JetBrains Mono,monospace', color:'#00e5ff' }}>
                    {covCnt}/{items.length}
                  </span>
                </div>
                <div className="progress-bar">
                  <motion.div className="progress-fill"
                    style={{ background: pct===100 ? '#00ff88'
                      : pct>=50 ? '#00e5ff' : '#ff8c00' }}
                    initial={{ width:0 }}
                    animate={{ width:`${pct}%` }}
                    transition={{ duration:0.8 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}