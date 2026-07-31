import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Download, Eye, Settings,
  CheckCircle, Clock, Shield, Loader,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import ReportTemplate from './ReportTemplate';

const SECTION_OPTIONS = [
  { id: 'executive',       label: 'Executive Summary',    required: true  },
  { id: 'timeline',        label: 'Attack Timeline',      required: false },
  { id: 'mitre',           label: 'MITRE ATT&CK Mapping', required: false },
  { id: 'iocs',            label: 'IOC Listing',          required: false },
  { id: 'recommendations', label: 'Recommendations',      required: false },
];

const CLASSIFICATION_OPTS = ['PUBLIC','INTERNAL','CONFIDENTIAL','SECRET','TOP SECRET'];
const FORMAT_OPTS = [
  { id:'pdf',  label:'PDF Report',    desc:'Print-ready, signed report' },
  { id:'html', label:'HTML Export',   desc:'Interactive web version'    },
  { id:'json', label:'JSON Data',     desc:'Machine-readable'           },
  { id:'stix', label:'STIX 2.1',      desc:'Threat intel sharing'       },
];

export default function ReportGenerator() {
  const previewRef = useRef(null);

  const [config, setConfig] = useState({
    title:          'SOC Incident Report',
    subtitle:       'Advanced Persistent Threat — Credential Dumping & Ransomware Pre-Stage',
    analyst:        'analyst-chen',
    classification: 'CONFIDENTIAL',
    summary:        '',
    sections:       ['executive','timeline','mitre','iocs','recommendations'],
    format:         'pdf',
  });

  const [showPreview, setShowPreview] = useState(false);
  const [generating,  setGenerating]  = useState(false);
  const [generated,   setGenerated]   = useState([]);
  const [showConfig,  setShowConfig]  = useState(true);

  const toggleSection = (id) => {
    setConfig(prev => ({
      ...prev,
      sections: prev.sections.includes(id)
        ? prev.sections.filter(s => s !== id)
        : [...prev.sections, id],
    }));
  };

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      const entry = {
        id:       `RPT-${Date.now()}`,
        title:    config.title,
        format:   config.format,
        ts:       new Date().toLocaleString(),
        sections: config.sections.length,
        analyst:  config.analyst,
      };
      setGenerated(prev => [entry, ...prev]);

      // For HTML/JSON — actually trigger download
      if (config.format === 'html' && previewRef.current) {
        const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
          <title>${config.title}</title>
          <style>body{background:#0a0f1e;color:#c8d8f0;font-family:Inter,sans-serif;}</style>
          </head><body>${previewRef.current.innerHTML}</body></html>`;
        const blob = new Blob([html], { type: 'text/html' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url; a.download = `${entry.id}.html`;
        a.click(); URL.revokeObjectURL(url);
      } else if (config.format === 'json') {
        const data = { report: entry, config, generated: new Date().toISOString() };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url; a.download = `${entry.id}.json`;
        a.click(); URL.revokeObjectURL(url);
      }
    }, 1800);
  };

  return (
    <motion.div
      key="report-generator"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* ── Page header ─────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontSize: 22, fontWeight: 700, color: '#e8f4ff',
          margin: 0, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <FileText size={20} color="#00e5ff" />
          Enterprise Report Generator
        </h1>
        <div style={{ fontSize: 13, color: '#3d5080', marginTop: 4 }}>
          Generate professional incident, compliance, and threat intelligence reports
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 16 }}>

        {/* ── Left: configuration ─────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Report metadata */}
          <div className="glass-card" style={{ padding: '16px 18px' }}>
            <div style={{
              fontSize: 13, fontWeight: 600, color: '#e8f4ff',
              display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14,
              cursor: 'pointer',
            }} onClick={() => setShowConfig(p => !p)}>
              <Settings size={14} color="#00e5ff" />
              Report Configuration
              {showConfig
                ? <ChevronUp size={13} style={{ marginLeft:'auto', color:'#3d5080' }} />
                : <ChevronDown size={13} style={{ marginLeft:'auto', color:'#3d5080' }} />}
            </div>

            <AnimatePresence>
              {showConfig && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {/* Title */}
                    <div>
                      <label style={{ fontSize:11, color:'#3d5080', display:'block', marginBottom:4 }}>
                        Report Title
                      </label>
                      <input className="soc-input"
                        value={config.title}
                        onChange={e => setConfig(p => ({...p, title: e.target.value}))}
                        style={{ fontSize:12.5 }}
                      />
                    </div>

                    {/* Subtitle */}
                    <div>
                      <label style={{ fontSize:11, color:'#3d5080', display:'block', marginBottom:4 }}>
                        Subtitle
                      </label>
                      <input className="soc-input"
                        value={config.subtitle}
                        onChange={e => setConfig(p => ({...p, subtitle: e.target.value}))}
                        style={{ fontSize:12 }}
                      />
                    </div>

                    {/* Analyst */}
                    <div>
                      <label style={{ fontSize:11, color:'#3d5080', display:'block', marginBottom:4 }}>
                        Analyst
                      </label>
                      <input className="soc-input"
                        value={config.analyst}
                        onChange={e => setConfig(p => ({...p, analyst: e.target.value}))}
                        style={{ fontSize:12 }}
                      />
                    </div>

                    {/* Classification */}
                    <div>
                      <label style={{ fontSize:11, color:'#3d5080', display:'block', marginBottom:4 }}>
                        Classification
                      </label>
                      <select value={config.classification}
                        onChange={e => setConfig(p => ({...p, classification: e.target.value}))}
                        style={{
                          width:'100%', background:'rgba(10,15,30,0.85)',
                          border:'1px solid #1a2744', borderRadius:7,
                          color:'#c8d8f0', padding:'7px 10px',
                          fontSize:12.5, outline:'none', cursor:'pointer',
                        }}>
                        {CLASSIFICATION_OPTS.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    {/* Summary override */}
                    <div>
                      <label style={{ fontSize:11, color:'#3d5080', display:'block', marginBottom:4 }}>
                        Custom Summary (optional)
                      </label>
                      <textarea
                        value={config.summary}
                        onChange={e => setConfig(p => ({...p, summary: e.target.value}))}
                        placeholder="Leave blank to auto-generate…"
                        rows={3}
                        style={{
                          width:'100%', background:'rgba(10,15,30,0.85)',
                          border:'1px solid #1a2744', borderRadius:7,
                          color:'#c8d8f0', padding:'8px 10px',
                          fontSize:12, fontFamily:'Inter,sans-serif',
                          resize:'vertical', outline:'none',
                          transition:'border-color 0.18s',
                          boxSizing:'border-box',
                        }}
                        onFocus={e => e.target.style.borderColor='rgba(0,229,255,0.42)'}
                        onBlur={e  => e.target.style.borderColor='#1a2744'}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Section selection */}
          <div className="glass-card" style={{ padding:'16px 18px' }}>
            <div style={{
              fontSize:13, fontWeight:600, color:'#e8f4ff',
              display:'flex', alignItems:'center', gap:7, marginBottom:12,
            }}>
              <CheckCircle size={14} color="#00e5ff" />
              Report Sections
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {SECTION_OPTIONS.map(sec => {
                const isOn = config.sections.includes(sec.id);
                return (
                  <div key={sec.id}
                    onClick={() => !sec.required && toggleSection(sec.id)}
                    style={{
                      display:'flex', alignItems:'center', gap:10,
                      padding:'8px 10px', borderRadius:7, cursor: sec.required ? 'default' : 'pointer',
                      background: isOn ? 'rgba(0,229,255,0.07)' : 'rgba(0,0,0,0.15)',
                      border:`1px solid ${isOn ? 'rgba(0,229,255,0.20)' : '#1a2744'}`,
                      transition:'all 0.15s',
                    }}>
                    <div style={{
                      width:16, height:16, borderRadius:4, flexShrink:0,
                      background: isOn ? '#00e5ff' : 'transparent',
                      border:`2px solid ${isOn ? '#00e5ff' : '#3d5080'}`,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      transition:'all 0.14s',
                    }}>
                      {isOn && (
                        <svg width="10" height="8" viewBox="0 0 10 8">
                          <path d="M1 4L4 7L9 1" stroke="#0a0f1e" strokeWidth="2"
                            fill="none" strokeLinecap="round" />
                        </svg>
                      )}
                    </div>
                    <span style={{ fontSize:13, color: isOn ? '#e8f4ff' : '#6b7fa3' }}>
                      {sec.label}
                    </span>
                    {sec.required && (
                      <span style={{
                        marginLeft:'auto', fontSize:10, color:'#3d5080',
                        fontFamily:'JetBrains Mono,monospace',
                      }}>required</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Format selection */}
          <div className="glass-card" style={{ padding:'16px 18px' }}>
            <div style={{
              fontSize:13, fontWeight:600, color:'#e8f4ff',
              display:'flex', alignItems:'center', gap:7, marginBottom:12,
            }}>
              <Download size={14} color="#00e5ff" />
              Export Format
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:7 }}>
              {FORMAT_OPTS.map(fmt => (
                <div key={fmt.id}
                  onClick={() => setConfig(p => ({...p, format: fmt.id}))}
                  style={{
                    padding:'10px 12px', borderRadius:8, cursor:'pointer',
                    background: config.format===fmt.id
                      ? 'rgba(0,229,255,0.12)' : 'rgba(0,0,0,0.15)',
                    border:`1px solid ${config.format===fmt.id
                      ? 'rgba(0,229,255,0.32)' : '#1a2744'}`,
                    transition:'all 0.14s',
                  }}>
                  <div style={{
                    fontSize:12.5, fontWeight:600,
                    color: config.format===fmt.id ? '#00e5ff' : '#c8d8f0',
                  }}>{fmt.label}</div>
                  <div style={{ fontSize:10.5, color:'#3d5080', marginTop:2 }}>
                    {fmt.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button
            className="btn-cyber btn-primary"
            style={{ padding:'11px 0', fontSize:14, width:'100%',
              justifyContent:'center' }}
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating
              ? <><Loader size={15}
                  style={{ animation:'spin 1s linear infinite' }} />
                  Generating…</>
              : <><FileText size={15} /> Generate Report</>
            }
          </button>

          {/* Preview toggle */}
          <button
            className="btn-cyber btn-ghost"
            style={{ padding:'9px 0', fontSize:13, width:'100%',
              justifyContent:'center' }}
            onClick={() => setShowPreview(p => !p)}>
            <Eye size={14} />
            {showPreview ? 'Hide Preview' : 'Live Preview'}
          </button>

          {/* Generated reports history */}
          {generated.length > 0 && (
            <div className="glass-card" style={{ padding:'14px 16px' }}>
              <div style={{
                fontSize:12, fontWeight:600, color:'#e8f4ff', marginBottom:10,
                display:'flex', alignItems:'center', gap:7,
              }}>
                <Clock size={13} color="#00e5ff" /> Generated Reports
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                {generated.map(r => (
                  <div key={r.id} style={{
                    fontSize:11.5, padding:'8px 10px',
                    background:'rgba(0,229,255,0.04)',
                    border:'1px solid rgba(0,229,255,0.12)',
                    borderRadius:6,
                  }}>
                    <div style={{ color:'#c8d8f0', marginBottom:3 }}>{r.title}</div>
                    <div style={{
                      display:'flex', justifyContent:'space-between',
                      color:'#3d5080', fontFamily:'JetBrains Mono,monospace',
                      fontSize:10.5,
                    }}>
                      <span>{r.id} · {r.format.toUpperCase()}</span>
                      <span>{r.ts}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right: preview ───────────────────────── */}
        <div>
          <AnimatePresence>
            {showPreview ? (
              <motion.div
                key="preview"
                initial={{ opacity:0, scale:0.98 }}
                animate={{ opacity:1, scale:1 }}
                exit={{ opacity:0, scale:0.98 }}
                style={{
                  background:'rgba(5,9,22,0.95)',
                  border:'1px solid #1a2744', borderRadius:12,
                  overflow:'auto', maxHeight:'85vh',
                }}
                ref={previewRef}
              >
                <div style={{
                  padding:'10px 16px',
                  borderBottom:'1px solid #1a2744',
                  display:'flex', alignItems:'center', gap:8,
                  background:'rgba(0,0,0,0.3)',
                }}>
                  <Eye size={13} color="#00e5ff" />
                  <span style={{ fontSize:12.5, color:'#e8f4ff', fontWeight:600 }}>
                    Live Report Preview
                  </span>
                  <span style={{ fontSize:11, color:'#3d5080', marginLeft:6 }}>
                    {config.classification}
                  </span>
                </div>
                <ReportTemplate config={config} />
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity:0 }}
                animate={{ opacity:1 }}
                style={{
                  background:'rgba(13,21,48,0.5)',
                  border:'1px solid #1a2744', borderRadius:12,
                  padding:'64px 32px', textAlign:'center',
                  color:'#3d5080',
                }}
              >
                <FileText size={44} style={{ opacity:0.18, margin:'0 auto 14px' }} />
                <div style={{ fontSize:15, color:'#4a6090', marginBottom:8 }}>
                  Configure and preview your report
                </div>
                <div style={{ fontSize:12.5, lineHeight:1.7 }}>
                  Set the title, sections, and format on the left,<br />
                  then click "Live Preview" to see the rendered output.
                </div>
                <button className="btn-cyber btn-ghost"
                  style={{ marginTop:20, fontSize:13 }}
                  onClick={() => setShowPreview(true)}>
                  <Eye size={14} /> Show Preview
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}