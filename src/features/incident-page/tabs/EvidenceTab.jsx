import React, { useState } from 'react';
import { Shield, Plus, CheckCircle } from 'lucide-react';

const INITIAL_EVIDENCE = [
  { id:1, type:'IP Address', value:'203.0.113.45', note:'Primary brute force source, AbuseIPDB 94%', confirmed:true },
  { id:2, type:'File Hash',  value:'5f1d8aa80a44…', note:'Mimikatz binary detected in memory', confirmed:true },
  { id:3, type:'Username',   value:'backdooruser', note:'Attacker-created admin account', confirmed:true },
  { id:4, type:'Domain',     value:'evil-c2.xyz',  note:'C2 domain resolved to 198.51.100.99', confirmed:false },
];

export default function EvidenceTab() {
  const [evidence, setEvidence] = useState(INITIAL_EVIDENCE);
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState({ type:'', value:'', note:'' });

  const addEvidence = () => {
    if (!newItem.value) return;
    setEvidence(prev => [...prev, { id: Date.now(), ...newItem, confirmed: false }]);
    setNewItem({ type:'', value:'', note:'' });
    setAdding(false);
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ fontSize:14, fontWeight:600, color:'#e8f4ff', display:'flex',
          alignItems:'center', gap:8 }}>
          <Shield size={15} color="#00e5ff" /> Evidence Chain
        </div>
        <button className="btn-cyber btn-primary"
          style={{ fontSize:12, padding:'5px 12px' }}
          onClick={() => setAdding(p => !p)}>
          <Plus size={13} /> Add Evidence
        </button>
      </div>

      {adding && (
        <div style={{
          background:'rgba(0,229,255,0.05)', border:'1px solid rgba(0,229,255,0.20)',
          borderRadius:8, padding:'14px 16px',
          display:'flex', flexDirection:'column', gap:10,
        }}>
          {[
            ['Type',  'type',  'IP Address / Hash / Domain…'],
            ['Value', 'value', 'Enter IOC value…'],
            ['Note',  'note',  'Investigation note…'],
          ].map(([label, field, ph]) => (
            <div key={field}>
              <div style={{ fontSize:11, color:'#3d5080', marginBottom:5 }}>{label}</div>
              <input className="soc-input" placeholder={ph}
                value={newItem[field]}
                onChange={e => setNewItem(p => ({...p, [field]: e.target.value}))}
              />
            </div>
          ))}
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn-cyber btn-primary"
              style={{ fontSize:12, padding:'5px 14px' }}
              onClick={addEvidence}>Add</button>
            <button className="btn-cyber btn-ghost"
              style={{ fontSize:12, padding:'5px 14px' }}
              onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {evidence.map(e => (
          <div key={e.id} style={{
            display:'flex', alignItems:'flex-start', gap:12,
            padding:'12px 14px', borderRadius:8,
            background: e.confirmed ? 'rgba(0,229,255,0.04)' : 'rgba(255,214,0,0.04)',
            border:`1px solid ${e.confirmed ? 'rgba(0,229,255,0.15)' : 'rgba(255,214,0,0.15)'}`,
          }}>
            <CheckCircle size={14} color={e.confirmed ? '#00ff88' : '#ffd600'}
              style={{ flexShrink:0, marginTop:2 }} />
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:4 }}>
                <span style={{ fontSize:11, color:'#3d5080',
                  background:'rgba(74,96,144,0.14)',
                  border:'1px solid rgba(74,96,144,0.22)',
                  borderRadius:4, padding:'0 6px' }}>{e.type}</span>
                <span style={{ fontFamily:'JetBrains Mono,monospace',
                  fontSize:12.5, color:'#e8f4ff' }}>{e.value}</span>
                <span style={{ marginLeft:'auto', fontSize:10.5,
                  color: e.confirmed ? '#00ff88' : '#ffd600' }}>
                  {e.confirmed ? 'Confirmed' : 'Unconfirmed'}
                </span>
              </div>
              <div style={{ fontSize:12, color:'#6b7fa3' }}>{e.note}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}