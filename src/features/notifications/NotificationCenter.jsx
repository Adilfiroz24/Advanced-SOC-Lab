import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, MessageSquare, Mail, CheckCircle,
  Settings, Save, AlertTriangle,
} from 'lucide-react';
import SlackIntegration  from './SlackIntegration';
import TeamsIntegration  from './TeamsIntegration';
import EmailIntegration  from './EmailIntegration';

const CHANNELS = [
  { id:'slack',  label:'Slack',           icon:MessageSquare, color:'#ff8c00' },
  { id:'teams',  label:'Microsoft Teams', icon:MessageSquare, color:'#7b2fff' },
  { id:'email',  label:'Email (SMTP)',    icon:Mail,          color:'#00e5ff' },
];

const DEFAULT_CONFIGS = {
  slack: { enabled:false, webhook:'', channel:'#soc-alerts',
    minLevel:12, mention:'@here', templates:{critical:true,high:true,medium:false,low:false} },
  teams: { enabled:false, webhook:'', channel:'SOC Alerts',
    minLevel:12, cardStyle:'adaptive' },
  email: { enabled:false, smtpHost:'smtp.soc.lab', smtpPort:587,
    username:'soc-alerts@soc.lab', password:'', from:'SOC Alerts <soc-alerts@soc.lab>',
    recipients:['admin-kim@soc.lab'], minLevel:14, digest:false, digestHour:8 },
};

const RECENT_NOTIFICATIONS = [
  { id:1, channel:'slack',  time:'2m ago',  msg:'CRITICAL: LSASS access on win10-victim — rule 100013',  status:'delivered' },
  { id:2, channel:'slack',  time:'8m ago',  msg:'HIGH: SSH brute force from 203.0.113.45 — rule 100001', status:'delivered' },
  { id:3, channel:'email',  time:'15m ago', msg:'P1 Incident CASE-2024-0047 requires immediate attention', status:'delivered' },
  { id:4, channel:'teams',  time:'20m ago', msg:'Auto-block executed: 203.0.113.45 blocked via iptables', status:'delivered' },
  { id:5, channel:'slack',  time:'1h ago',  msg:'Log4Shell attempt on ubuntu-webserver — rule 100019',   status:'failed'    },
];

export default function NotificationCenter() {
  const [activeChannel, setActiveChannel] = useState('slack');
  const [configs,       setConfigs]       = useState(DEFAULT_CONFIGS);
  const [saved,         setSaved]         = useState(false);

  const updateConfig = (channel, cfg) =>
    setConfigs(prev => ({ ...prev, [channel]: cfg }));

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const enabledCount = Object.values(configs).filter(c => c.enabled).length;

  const COMPONENTS = { slack: SlackIntegration, teams: TeamsIntegration, email: EmailIntegration };
  const ActiveComp = COMPONENTS[activeChannel];

  return (
    <motion.div
      key="notifications"
      initial={{ opacity:0, y:10 }}
      animate={{ opacity:1, y:0 }}
      transition={{ duration:0.25 }}
    >
      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <h1 style={{
          fontSize:22, fontWeight:700, color:'#e8f4ff',
          margin:0, display:'flex', alignItems:'center', gap:10,
        }}>
          <Bell size={20} color="#00e5ff" />
          Enterprise Notification Center
        </h1>
        <div style={{ fontSize:13, color:'#3d5080', marginTop:4 }}>
          Slack · Microsoft Teams · Email · {enabledCount}/3 channels active
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:22 }}>
        {[
          { label:'Active Channels', value:enabledCount, color:'#00e5ff' },
          { label:'Sent (24h)',      value:47,           color:'#00ff88' },
          { label:'Failed (24h)',    value:1,            color:'#ff2d6d' },
          { label:'Delivery Rate',   value:'97.9%',      color:'#ffd600' },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ padding:'12px 14px' }}>
            <div style={{ fontFamily:'JetBrains Mono,monospace',
              fontSize:22, fontWeight:700, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11, color:'#3d5080', marginTop:3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', gap:16 }}>

        {/* Channel selector */}
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {CHANNELS.map(ch => {
            const Icon     = ch.icon;
            const isActive = activeChannel === ch.id;
            const isEnabled= configs[ch.id]?.enabled;
            return (
              <div key={ch.id}
                onClick={() => setActiveChannel(ch.id)}
                style={{
                  display:'flex', alignItems:'center', gap:10,
                  padding:'12px 14px', borderRadius:9, cursor:'pointer',
                  background:isActive?`${ch.color}0e`:'rgba(13,21,48,0.65)',
                  border:`1px solid ${isActive?ch.color+'40':'#1a2744'}`,
                  borderLeft:`3px solid ${isEnabled?ch.color:'#1a2744'}`,
                  transition:'all 0.15s',
                }}
              >
                <Icon size={15} color={isActive?ch.color:'#6b7fa3'} />
                <span style={{ flex:1, fontSize:13, fontWeight:500,
                  color:isActive?ch.color:'#c8d8f0' }}>{ch.label}</span>
                {isEnabled && (
                  <CheckCircle size={13} color="#00ff88" />
                )}
              </div>
            );
          })}

          {/* Recent deliveries */}
          <div className="glass-card" style={{ padding:'14px', marginTop:8 }}>
            <div style={{ fontSize:12, fontWeight:600, color:'#e8f4ff', marginBottom:10 }}>
              Recent Deliveries
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {RECENT_NOTIFICATIONS.map(n => (
                <div key={n.id} style={{
                  fontSize:10.5, padding:'6px 8px',
                  background:'rgba(0,0,0,0.2)',
                  border:'1px solid #1a2744', borderRadius:5,
                }}>
                  <div style={{ display:'flex', justifyContent:'space-between',
                    marginBottom:3 }}>
                    <span style={{
                      color:n.channel==='slack'?'#ff8c00'
                        :n.channel==='teams'?'#7b2fff':'#00e5ff',
                      fontFamily:'JetBrains Mono,monospace',
                      fontSize:9.5,
                    }}>{n.channel}</span>
                    <span style={{
                      color:n.status==='delivered'?'#00ff88':'#ff2d6d',
                      fontSize:9.5,
                    }}>
                      {n.status==='delivered'?'✓':'✗'} {n.status}
                    </span>
                  </div>
                  <div style={{ color:'#6b7fa3', lineHeight:1.4 }}>
                    {n.msg.slice(0,55)}{n.msg.length>55?'…':''}
                  </div>
                  <div style={{ color:'#3d5080', marginTop:2 }}>{n.time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Config panel */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div className="glass-card" style={{ padding:'20px 22px', flex:1 }}>
            <AnimatePresence mode="wait">
              <motion.div key={activeChannel}
                initial={{ opacity:0, y:6 }}
                animate={{ opacity:1, y:0 }}
                exit={{ opacity:0, y:-6 }}
                transition={{ duration:0.18 }}
              >
                <ActiveComp
                  config={configs[activeChannel]}
                  onChange={(cfg) => updateConfig(activeChannel, cfg)}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Save */}
          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <button className="btn-cyber btn-primary"
              style={{ fontSize:13, padding:'9px 24px' }}
              onClick={save}>
              {saved ? <><CheckCircle size={14}/> Saved!</> : <><Save size={14}/> Save Settings</>}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}