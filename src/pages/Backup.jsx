import React from 'react';
import { motion } from 'framer-motion';
import { Lock, CheckCircle } from 'lucide-react';

const BACKUPS = [
  { name:'soc_backup_20240115_020000.tar.gz', size:'2.4 GB', age:'1d ago',   status:'ok' },
  { name:'soc_backup_20240114_020000.tar.gz', size:'2.3 GB', age:'2d ago',   status:'ok' },
  { name:'soc_backup_20240113_020000.tar.gz', size:'2.3 GB', age:'3d ago',   status:'ok' },
  { name:'soc_backup_20240107_020000.tar.gz', size:'2.1 GB', age:'9d ago',   status:'ok' },
];

export default function Backup() {
  return (
    <motion.div key="backup"
      initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
      exit={{ opacity:0 }} transition={{ duration:0.25 }}
    >
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:700, color:'#e8f4ff', margin:0,
          display:'flex', alignItems:'center', gap:10 }}>
          <Lock size={20} color="#00e5ff" /> Backup & Recovery
        </h1>
        <div style={{ fontSize:13, color:'#3d5080', marginTop:4 }}>
          backup_script.sh · Daily 02:00 UTC · Retention: 30 days · /opt/soc-backups/
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:22 }}>
        {[
          { label:'Total Backups',   value:BACKUPS.length, color:'#00e5ff' },
          { label:'Retention Days',  value:30,             color:'#00ff88' },
          { label:'Latest Size',     value:'2.4 GB',       color:'#ff8c00' },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ padding:'14px 16px' }}>
            <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:26,
              fontWeight:700, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11.5, color:'#3d5080', marginTop:3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:14, fontWeight:600, color:'#e8f4ff', marginBottom:12 }}>
          What Gets Backed Up
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {['Wazuh config + rules (/var/ossec/etc/)','Elasticsearch snapshot (wazuh-alerts-*)','TheHive cases export (JSON)','Docker volumes (Cassandra, MinIO, MISP)','Custom detection rules (09_Detection_Rules/)','Docker Compose config'].map(item => (
            <div key={item} style={{ display:'flex', gap:8, alignItems:'center',
              fontSize:12.5, color:'#c8d8f0' }}>
              <CheckCircle size={13} color="#00e5ff" /> {item}
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card" style={{ padding:'18px 20px' }}>
        <div style={{ fontSize:14, fontWeight:600, color:'#e8f4ff', marginBottom:12 }}>
          Backup Archives
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {BACKUPS.map(b => (
            <div key={b.name} style={{
              display:'flex', alignItems:'center', gap:12,
              padding:'10px 12px', background:'rgba(0,229,255,0.03)',
              border:'1px solid #1a2744', borderRadius:7,
            }}>
              <CheckCircle size={13} color="#00ff88" />
              <span style={{ fontFamily:'JetBrains Mono,monospace',
                fontSize:11.5, color:'#c8d8f0', flex:1 }}>{b.name}</span>
              <span style={{ fontFamily:'JetBrains Mono,monospace',
                fontSize:11.5, color:'#ff8c00' }}>{b.size}</span>
              <span style={{ fontSize:11.5, color:'#3d5080' }}>{b.age}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}