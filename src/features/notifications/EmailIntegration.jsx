import React, { useState } from 'react';
import { Send, Plus, X, CheckCircle, AlertTriangle } from 'lucide-react';

export default function EmailIntegration({ config, onChange }) {
  const [testing,   setTesting]   = useState(false);
  const [testResult,setTestResult]= useState(null);
  const [newEmail,  setNewEmail]  = useState('');

  const cfg = config || {
    enabled:     false,
    smtpHost:    'smtp.soc.lab',
    smtpPort:    587,
    username:    'soc-alerts@soc.lab',
    password:    '',
    from:        'SOC Alerts <soc-alerts@soc.lab>',
    recipients:  ['admin-kim@soc.lab','analyst-chen@soc.lab'],
    minLevel:    14,
    digest:      false,
    digestHour:  8,
  };

  const set = (k,v) => onChange?.({ ...cfg, [k]: v });

  const addRecipient = () => {
    if (!newEmail.includes('@')) return;
    set('recipients', [...cfg.recipients, newEmail.trim()]);
    setNewEmail('');
  };

  const removeRecipient = (email) =>
    set('recipients', cfg.recipients.filter(r => r !== email));

  const test = () => {
    if (!cfg.smtpHost) { setTestResult('error'); return; }
    setTesting(true);
    setTimeout(() => {
      setTesting(false);
      setTestResult('success');
    }, 1600);
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
            Email Notifications
          </div>
          <div style={{ fontSize:11.5, color:'#3d5080', marginTop:2 }}>
            SMTP-based email alerts for critical incidents
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
          {/* SMTP config */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:8 }}>
            <div>
              <label style={{ fontSize:11, color:'#3d5080', display:'block', marginBottom:4 }}>
                SMTP Host
              </label>
              <input className="soc-input" value={cfg.smtpHost}
                onChange={e => set('smtpHost', e.target.value)}
                placeholder="smtp.example.com" style={{ fontSize:12 }}
              />
            </div>
            <div style={{ width:80 }}>
              <label style={{ fontSize:11, color:'#3d5080', display:'block', marginBottom:4 }}>
                Port
              </label>
              <input className="soc-input" type="number"
                value={cfg.smtpPort}
                onChange={e => set('smtpPort', Number(e.target.value))}
                style={{ fontSize:12 }}
              />
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <div>
              <label style={{ fontSize:11, color:'#3d5080', display:'block', marginBottom:4 }}>
                SMTP Username
              </label>
              <input className="soc-input" value={cfg.username}
                onChange={e => set('username', e.target.value)}
                style={{ fontSize:12 }}
              />
            </div>
            <div>
              <label style={{ fontSize:11, color:'#3d5080', display:'block', marginBottom:4 }}>
                SMTP Password
              </label>
              <input className="soc-input" type="password"
                value={cfg.password}
                onChange={e => set('password', e.target.value)}
                placeholder="••••••••" style={{ fontSize:12 }}
              />
            </div>
          </div>

          {/* Recipients */}
          <div>
            <label style={{ fontSize:11, color:'#3d5080', display:'block', marginBottom:6 }}>
              Recipients
            </label>
            <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:8 }}>
              {cfg.recipients.map(email => (
                <div key={email} style={{
                  display:'flex', alignItems:'center', gap:8,
                  padding:'6px 10px', background:'rgba(0,0,0,0.2)',
                  border:'1px solid #1a2744', borderRadius:6,
                }}>
                  <span style={{
                    flex:1, fontSize:12.5, color:'#c8d8f0',
                    fontFamily:'JetBrains Mono,monospace',
                  }}>{email}</span>
                  <button onClick={() => removeRecipient(email)} style={{
                    background:'none', border:'none', cursor:'pointer',
                    color:'#3d5080', padding:2,
                  }}>
                    <X size={12}/>
                  </button>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <input className="soc-input" value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                onKeyDown={e => e.key==='Enter' && addRecipient()}
                placeholder="analyst@soc.lab"
                style={{ flex:1, fontSize:12 }}
              />
              <button className="btn-cyber btn-ghost"
                style={{ fontSize:12, padding:'7px 12px' }}
                onClick={addRecipient}>
                <Plus size={13}/>
              </button>
            </div>
          </div>

          {/* Min level + test */}
          <div style={{ display:'flex', gap:10, alignItems:'flex-end' }}>
            <div style={{ flex:1 }}>
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
            <button className="btn-cyber btn-ghost"
              style={{ fontSize:12, padding:'7px 14px', flexShrink:0 }}
              onClick={test} disabled={testing}>
              <Send size={13}/> {testing?'Sending…':'Send Test'}
            </button>
          </div>

          {testResult && (
            <div style={{
              display:'flex', alignItems:'center', gap:6, fontSize:12,
              color:testResult==='success'?'#00ff88':'#ff2d6d',
            }}>
              {testResult==='success'
                ? <CheckCircle size={13}/>
                : <AlertTriangle size={13}/>}
              {testResult==='success'
                ? 'Test email sent successfully'
                : 'Email delivery failed — check SMTP config'}
            </div>
          )}

          {/* Daily digest */}
          <label style={{
            display:'flex', alignItems:'center', gap:10,
            cursor:'pointer', fontSize:13, color:'#c8d8f0',
          }}>
            <input type="checkbox" checked={cfg.digest}
              onChange={e => set('digest', e.target.checked)}
              style={{ accentColor:'#00e5ff', width:16, height:16 }}
            />
            Send daily digest at{' '}
            <input type="number" min={0} max={23} value={cfg.digestHour}
              onChange={e => set('digestHour', Number(e.target.value))}
              style={{
                width:50, background:'rgba(10,15,30,0.85)',
                border:'1px solid #1a2744', borderRadius:5,
                color:'#c8d8f0', padding:'2px 6px',
                fontSize:12, fontFamily:'JetBrains Mono,monospace',
                outline:'none', textAlign:'center',
              }}
            />:00 UTC
          </label>
        </>
      )}
    </div>
  );
}