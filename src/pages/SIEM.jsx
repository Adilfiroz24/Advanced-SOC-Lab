import React from 'react';
import { motion } from 'framer-motion';
import { Database, CheckCircle, Activity, Server } from 'lucide-react';

const SERVICES = [
  { name:'wazuh-manager',   status:'running', port:'55000', desc:'Rule engine, agent hub'    },
  { name:'wazuh-indexer',   status:'running', port:'9200',  desc:'OpenSearch data store'     },
  { name:'wazuh-dashboard', status:'running', port:'443',   desc:'Kibana-based web UI'       },
  { name:'filebeat',        status:'running', port:'—',     desc:'Alert log shipper'         },
];

const STATS = [
  { label:'Registered Agents',  value:4,      color:'#00e5ff' },
  { label:'Active Agents',      value:4,      color:'#00ff88' },
  { label:'Rules Loaded',       value:3247,   color:'#ff8c00' },
  { label:'Custom Rules',       value:20,     color:'#7b2fff' },
  { label:'Alerts (24h)',       value:12,     color:'#ff2d6d' },
  { label:'Indexer Health',     value:'GREEN',color:'#00ff88' },
];

export default function SIEM() {
  return (
    <motion.div key="siem"
      initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
      exit={{ opacity:0 }} transition={{ duration:0.25 }}
    >
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:700, color:'#e8f4ff', margin:0,
          display:'flex', alignItems:'center', gap:10 }}>
          <Database size={20} color="#00e5ff" /> SIEM — Wazuh 4.7
        </h1>
        <div style={{ fontSize:13, color:'#3d5080', marginTop:4 }}>
          Manager · Indexer · Dashboard · Host: 192.168.56.10
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:22 }}>
        {STATS.map(s => (
          <div key={s.label} className="glass-card" style={{ padding:'14px 16px' }}>
            <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:24,
              fontWeight:700, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11.5, color:'#3d5080', marginTop:3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="glass-card" style={{ padding:'18px 20px', marginBottom:16 }}>
        <div style={{ fontSize:14, fontWeight:600, color:'#e8f4ff', marginBottom:14 }}>
          Service Status
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {SERVICES.map(svc => (
            <div key={svc.name} style={{
              display:'flex', alignItems:'center', gap:14,
              padding:'12px 14px',
              background:'rgba(0,229,255,0.03)',
              border:'1px solid #1a2744', borderRadius:8,
            }}>
              <div style={{ width:8, height:8, borderRadius:'50%',
                background: svc.status==='running' ? '#00ff88' : '#ff2d6d',
                boxShadow:`0 0 8px ${svc.status==='running'?'rgba(0,255,136,0.5)':'rgba(255,45,109,0.5)'}`,
                flexShrink:0,
              }} />
              <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:12.5,
                color:'#00e5ff', width:180, flexShrink:0 }}>{svc.name}</span>
              <span style={{ fontSize:12, color:'#c8d8f0', flex:1 }}>{svc.desc}</span>
              <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11.5,
                color:'#3d5080' }}>:{svc.port}</span>
              <span style={{ fontSize:11, color:'#00ff88',
                background:'rgba(0,255,136,0.08)',
                border:'1px solid rgba(0,255,136,0.22)',
                borderRadius:4, padding:'1px 8px' }}>
                {svc.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card" style={{ padding:'16px 20px' }}>
        <div style={{ fontSize:13, fontWeight:600, color:'#e8f4ff', marginBottom:10 }}>
          Quick Commands
        </div>
        {[
          'curl -sk -u admin:pass https://localhost:9200/_cluster/health | jq',
          'curl -sk -u wazuh-wui:pass -X POST https://localhost:55000/security/user/authenticate | jq',
          'systemctl status wazuh-manager wazuh-indexer wazuh-dashboard',
          'tail -f /var/ossec/logs/alerts/alerts.log',
        ].map(cmd => (
          <div key={cmd} style={{
            fontFamily:'JetBrains Mono,monospace', fontSize:11.5,
            color:'#00e5ff', background:'rgba(0,0,0,0.3)',
            border:'1px solid #1a2744', borderRadius:5,
            padding:'7px 12px', marginBottom:6,
          }}>
            {cmd}
          </div>
        ))}
      </div>
    </motion.div>
  );
}