import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, Send } from 'lucide-react';

export default function TeamsIntegration({ config, onChange }) {
  const [testing,   setTesting]   = useState(false);
  const [testResult,setTestResult]= useState(null);

  const cfg = config || {
    enabled:   false,
    webhook:   '',
    channel:   'SOC Alerts',
    minLevel:  12,
    cardStyle: 'adaptive',
  };

  const set = (k,v) => onChange?.({ ...cfg, [k]: v });

  const test = () => {
    if (!cfg.webhook) { setTestResult('error'); return; }
    setTesting(true);
    setTimeout(() => {
      setTesting(false);
      setTestResult(cfg.webhook.includes('webhook') ? 'success' : 'error');
    }, 1400);
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'12px 14px',
        background:cfg.enabled?'rgba(0,255,136,0.06)':'rgba(0,0,0,0.15)',
        border:`1px solid ${cfg.enabled?'rgba(0,255,136,0.20)':'#1a2744'}`,
        borderRadius:8,
      }}>
        <div>
          <div style={{ fontSize:13, fontWeight:600, color:'#e8f4ff' }}>
            Microsoft Teams Notifications
          </div>
          <div style={{ fontSize:11.5, color:'#3d5080', marginTop:2 }}>
            Send Adaptive Cards to Teams channels via incoming webhook
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
          <div>
            <label style={{ fontSize:11, color:'#3d5080', display:'block', marginBottom:5 }}>
              Incoming Webhook URL
            </label>
            <div style={{ display:'flex', gap:8 }}>
              <input className="soc-input" type="password"
                value={cfg.webhook}
                onChange={e => set('webhook', e.target.value)}
                placeholder="https://outlook.office.com/webhook/..."
                style={{ fontSize:12, flex:1 }}
              />
              <button className="btn-cyber btn-ghost"
                style={{ fontSize:12, padding:'7px 12px' }}
                onClick={test} disabled={testing}>
                {testing ? '…' : <Send size={13}/>}
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
                  ? 'Teams webhook test successful'
                  : 'Teams webhook test failed — check URL'}
              </div>
            )}
          </div>

          <div>
            <label style={{ fontSize:11, color:'#3d5080', display:'block', marginBottom:5 }}>
              Card Style
            </label>
            <div style={{ display:'flex', gap:7 }}>
              {['adaptive','simple'].map(s => (
                <button key={s} onClick={() => set('cardStyle', s)} style={{
                  padding:'5px 14px', borderRadius:7, fontSize:12,
                  cursor:'pointer', border:'1px solid',
                  background:cfg.cardStyle===s?'rgba(0,229,255,0.14)':'rgba(255,255,255,0.04)',
                  color:      cfg.cardStyle===s?'#00e5ff':'#6b7fa3',
                  borderColor:cfg.cardStyle===s?'rgba(0,229,255,0.30)':'#1a2744',
                }}>{s === 'adaptive' ? 'Adaptive Card (rich)' : 'Simple text'}</button>
              ))}
            </div>
          </div>

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
          </div>
        </>
      )}
    </div>
  );
}