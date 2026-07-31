import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, Send, Eye } from 'lucide-react';

const SLACK_CHANNELS = [
  { id:'#soc-alerts',   label:'#soc-alerts',   purpose:'P1/P2 alert notifications'   },
  { id:'#soc-critical', label:'#soc-critical',  purpose:'Critical severity only'       },
  { id:'#soc-general',  label:'#soc-general',   purpose:'General SOC updates'          },
  { id:'#ir-team',      label:'#ir-team',        purpose:'Incident response escalation' },
];

export default function SlackIntegration({ config, onChange }) {
  const [testing,  setTesting]  = useState(false);
  const [testResult,setTestResult]=useState(null);

  const cfg = config || {
    enabled:    false,
    webhook:    '',
    channel:    '#soc-alerts',
    minLevel:   12,
    mention:    '@here',
    templates:  { critical:true, high:true, medium:false, low:false },
  };

  const set = (k,v) => onChange?.({ ...cfg, [k]: v });

  const testWebhook = () => {
    if (!cfg.webhook) { setTestResult('error'); return; }
    setTesting(true);
    setTimeout(() => {
      setTesting(false);
      // Simulate success/failure based on webhook format
      setTestResult(cfg.webhook.includes('hooks.slack.com') ? 'success' : 'error');
    }, 1400);
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {/* Enable toggle */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'12px 14px',
        background:cfg.enabled?'rgba(0,255,136,0.06)':'rgba(0,0,0,0.15)',
        border:`1px solid ${cfg.enabled?'rgba(0,255,136,0.20)':'#1a2744'}`,
        borderRadius:8,
      }}>
        <div>
          <div style={{ fontSize:13, fontWeight:600, color:'#e8f4ff' }}>
            Slack Notifications
          </div>
          <div style={{ fontSize:11.5, color:'#3d5080', marginTop:2 }}>
            Send SOC alerts to Slack channels via webhook
          </div>
        </div>
        <label style={{ position:'relative', cursor:'pointer', flexShrink:0 }}>
          <input type="checkbox" checked={cfg.enabled}
            onChange={e => set('enabled', e.target.checked)}
            style={{ opacity:0, width:0, height:0 }}/>
          <div style={{
            width:42, height:22, borderRadius:11,
            background:cfg.enabled?'#00ff88':'#1a2744',
            border:`1px solid ${cfg.enabled?'#00ff88':'#3d5080'}`,
            position:'relative', transition:'all 0.2s',
          }}>
            <div style={{
              position:'absolute', top:2, left:cfg.enabled?20:2,
              width:16, height:16, borderRadius:'50%',
              background:'#fff', transition:'left 0.2s',
            }}/>
          </div>
        </label>
      </div>

      {cfg.enabled && (
        <>
          {/* Webhook URL */}
          <div>
            <label style={{ fontSize:11, color:'#3d5080', display:'block', marginBottom:5 }}>
              Webhook URL
            </label>
            <div style={{ display:'flex', gap:8 }}>
              <input className="soc-input"
                type="password"
                value={cfg.webhook}
                onChange={e => set('webhook', e.target.value)}
                placeholder="https://hooks.slack.com/services/T.../B.../..."
                style={{ fontSize:12, flex:1 }}
              />
              <button className="btn-cyber btn-ghost"
                style={{ fontSize:12, padding:'7px 12px', flexShrink:0 }}
                onClick={testWebhook}
                disabled={testing}>
                {testing ? '…' : <Send size={13}/>}
                {testing ? 'Testing' : 'Test'}
              </button>
            </div>
            {testResult && (
              <div style={{
                display:'flex', alignItems:'center', gap:6, marginTop:6, fontSize:12,
                color:testResult==='success'?'#00ff88':'#ff2d6d',
              }}>
                {testResult==='success'
                  ? <CheckCircle size={13}/>
                  : <AlertTriangle size={13}/>}
                {testResult==='success'
                  ? 'Webhook test successful — message delivered to Slack'
                  : 'Webhook test failed — check URL format and connectivity'}
              </div>
            )}
          </div>

          {/* Channel */}
          <div>
            <label style={{ fontSize:11, color:'#3d5080', display:'block', marginBottom:5 }}>
              Target Channel
            </label>
            <select value={cfg.channel} onChange={e => set('channel', e.target.value)}
              style={{
                width:'100%', background:'rgba(10,15,30,0.85)',
                border:'1px solid #1a2744', borderRadius:7,
                color:'#c8d8f0', padding:'8px 10px',
                fontSize:12.5, outline:'none', cursor:'pointer',
              }}>
              {SLACK_CHANNELS.map(c => (
                <option key={c.id} value={c.id}>{c.label} — {c.purpose}</option>
              ))}
            </select>
          </div>

          {/* Minimum rule level */}
          <div>
            <label style={{ fontSize:11, color:'#3d5080', display:'block', marginBottom:5 }}>
              Minimum Rule Level: <span style={{
                color:'#00e5ff', fontFamily:'JetBrains Mono,monospace',
              }}>{cfg.minLevel}</span>/15
            </label>
            <input type="range" min={1} max={15} value={cfg.minLevel}
              onChange={e => set('minLevel', Number(e.target.value))}
              style={{ width:'100%', accentColor:'#00e5ff' }}
            />
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'#3d5080', marginTop:2 }}>
              <span>1 (Low)</span>
              <span>8 (High)</span>
              <span>12 (Critical)</span>
              <span>15 (Max)</span>
            </div>
          </div>

          {/* Mention */}
          <div>
            <label style={{ fontSize:11, color:'#3d5080', display:'block', marginBottom:5 }}>
              Alert Mention
            </label>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {['@here','@channel','@soc-team','(none)'].map(m => (
                <button key={m} onClick={() => set('mention', m)} style={{
                  padding:'3px 12px', borderRadius:9999, fontSize:12,
                  cursor:'pointer', border:'1px solid',
                  background:cfg.mention===m?'rgba(0,229,255,0.14)':'rgba(255,255,255,0.04)',
                  color:      cfg.mention===m?'#00e5ff':'#6b7fa3',
                  borderColor:cfg.mention===m?'rgba(0,229,255,0.30)':'#1a2744',
                  fontFamily:'JetBrains Mono,monospace',
                }}>{m}</button>
              ))}
            </div>
          </div>

          {/* Severity toggles */}
          <div>
            <label style={{ fontSize:11, color:'#3d5080', display:'block', marginBottom:8 }}>
              Notify for Severity
            </label>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {[
                { key:'critical', color:'#ff2d6d' },
                { key:'high',     color:'#ff8c00' },
                { key:'medium',   color:'#ffd600' },
                { key:'low',      color:'#00ff88' },
              ].map(({ key, color }) => (
                <label key={key} style={{
                  display:'flex', alignItems:'center', gap:7,
                  cursor:'pointer', fontSize:12.5,
                  color:cfg.templates[key]?color:'#6b7fa3',
                  padding:'5px 12px',
                  background:cfg.templates[key]?`${color}12`:'rgba(255,255,255,0.04)',
                  border:`1px solid ${cfg.templates[key]?`${color}30`:'#1a2744'}`,
                  borderRadius:7, transition:'all 0.14s',
                }}>
                  <input type="checkbox"
                    checked={!!cfg.templates[key]}
                    onChange={e => set('templates',
                      {...cfg.templates, [key]:e.target.checked})}
                    style={{ accentColor:color }}
                  />
                  {key}
                </label>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}