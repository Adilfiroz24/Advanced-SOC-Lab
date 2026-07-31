import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Save } from 'lucide-react';

export default function Settings() {
  const [form, setForm] = useState({
    wazuh_host:   'https://192.168.56.10:55000',
    thehive_host: 'http://192.168.56.10:9000',
    misp_host:    'https://192.168.56.10:8443',
    abuseipdb_key:'••••••••••••••••',
    vt_key:       '••••••••••••••••',
    threshold:    50,
    interval:     8000,
    use_mock:     true,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const Field = ({ label, field, type='text', disabled=false }) => (
    <div style={{ marginBottom:14 }}>
      <label style={{ fontSize:12, color:'#6b7fa3', display:'block', marginBottom:5 }}>
        {label}
      </label>
      <input
        className="soc-input"
        type={type}
        value={form[field]}
        disabled={disabled}
        onChange={e => setForm(f => ({...f, [field]: type==='number' ? Number(e.target.value) : e.target.value }))}
        style={{ opacity: disabled ? 0.5 : 1 }}
      />
    </div>
  );

  return (
    <motion.div key="settings"
      initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
      exit={{ opacity:0 }} transition={{ duration:0.25 }}
    >
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:700, color:'#e8f4ff', margin:0,
          display:'flex', alignItems:'center', gap:10 }}>
          <SettingsIcon size={20} color="#00e5ff" /> Settings
        </h1>
        <div style={{ fontSize:13, color:'#3d5080', marginTop:4 }}>
          API endpoints, keys, and dashboard preferences
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <div className="glass-card" style={{ padding:'20px 22px' }}>
          <div style={{ fontSize:14, fontWeight:600, color:'#e8f4ff', marginBottom:16 }}>
            Backend Endpoints
          </div>
          <Field label="Wazuh API Host"  field="wazuh_host"   />
          <Field label="TheHive Host"    field="thehive_host" />
          <Field label="MISP Host"       field="misp_host"    />
        </div>

        <div className="glass-card" style={{ padding:'20px 22px' }}>
          <div style={{ fontSize:14, fontWeight:600, color:'#e8f4ff', marginBottom:16 }}>
            API Keys
          </div>
          <Field label="AbuseIPDB API Key"  field="abuseipdb_key" type="password" />
          <Field label="VirusTotal API Key" field="vt_key"        type="password" />
          <Field label="Malicious IP Threshold (%)" field="threshold" type="number" />
        </div>

        <div className="glass-card" style={{ padding:'20px 22px' }}>
          <div style={{ fontSize:14, fontWeight:600, color:'#e8f4ff', marginBottom:16 }}>
            Dashboard Preferences
          </div>
          <Field label="Live Feed Refresh Interval (ms)" field="interval" type="number" />
          <div style={{ marginTop:12 }}>
            <label style={{ display:'flex', alignItems:'center', gap:10,
              fontSize:13, color:'#c8d8f0', cursor:'pointer' }}>
              <input type="checkbox" checked={form.use_mock}
                onChange={e => setForm(f => ({...f, use_mock: e.target.checked }))}
                style={{ accentColor:'#00e5ff', width:16, height:16 }} />
              Use mock data (offline mode — no backend required)
            </label>
          </div>
        </div>

        <div className="glass-card" style={{ padding:'20px 22px' }}>
          <div style={{ fontSize:14, fontWeight:600, color:'#e8f4ff', marginBottom:16 }}>
            About
          </div>
          {[
            ['Version',     'Advanced SOC Lab v2.0'],
            ['SIEM',        'Wazuh 4.7.4'],
            ['Case Mgmt',   'TheHive 5.2 + Cortex 3.1.7'],
            ['Threat Intel','MISP 2.4.x'],
            ['Network IDS', 'Suricata 7.0'],
            ['Frontend',    'React 18 + Framer Motion + Recharts'],
          ].map(([k,v]) => (
            <div key={k} style={{ display:'flex', justifyContent:'space-between',
              fontSize:12.5, marginBottom:8, paddingBottom:8,
              borderBottom:'1px solid #1a2744' }}>
              <span style={{ color:'#6b7fa3' }}>{k}</span>
              <span style={{ color:'#c8d8f0', fontFamily:'JetBrains Mono,monospace',
                fontSize:11.5 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop:20, display:'flex', justifyContent:'flex-end' }}>
        <button className="btn-cyber btn-primary"
          style={{ padding:'9px 22px', fontSize:13 }}
          onClick={handleSave}>
          <Save size={14} />
          {saved ? '✓ Saved!' : 'Save Settings'}
        </button>
      </div>
    </motion.div>
  );
}