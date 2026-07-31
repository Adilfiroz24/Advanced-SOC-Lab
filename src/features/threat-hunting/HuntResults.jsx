import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Download, AlertTriangle,
  Clock, ChevronDown, ChevronRight,
} from 'lucide-react';
import { mockAlerts } from '../../data/mockAlerts';

const SEV_COLOR = {
  critical:'#ff2d6d', high:'#ff8c00', medium:'#ffd600', low:'#00ff88',
};

function ResultRow({ alert, index }) {
  const [expanded, setExpanded] = useState(false);
  const color = SEV_COLOR[alert.severity] || '#6b7fa3';

  return (
    <motion.div
      initial={{ opacity:0, y:4 }}
      animate={{ opacity:1, y:0 }}
      transition={{ duration:0.12, delay:index*0.025 }}
      style={{
        borderBottom:'1px solid #1a2744', cursor:'pointer',
        transition:'background 0.12s',
      }}
    >
      <div onClick={() => setExpanded(p => !p)} style={{
        display:'flex', alignItems:'center', gap:12,
        padding:'10px 14px',
      }}
        onMouseEnter={e => e.currentTarget.style.background='rgba(0,229,255,0.03)'}
        onMouseLeave={e => e.currentTarget.style.background='transparent'}
      >
        <div style={{ color:'#3d5080', flexShrink:0 }}>
          {expanded ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}
        </div>

        <span className={`badge badge-${alert.severity}`}>
          {alert.severity}
        </span>

        <div style={{
          fontFamily:'JetBrains Mono,monospace',
          fontSize:11, color:'#3d5080', flexShrink:0, width:110,
        }}>
          {new Date(alert.timestamp).toLocaleTimeString()}
        </div>

        <div style={{
          flex:1, fontSize:12.5, color:'#c8d8f0',
          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
        }}>
          {alert.description}
        </div>

        <div style={{
          fontFamily:'JetBrains Mono,monospace', fontSize:11.5,
          color:'#6b7fa3', flexShrink:0, width:120,
          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
        }}>
          {alert.agent_name}
        </div>

        <div style={{ flexShrink:0, display:'flex', gap:5 }}>
          {(alert.mitre||[]).slice(0,2).map(t => (
            <span key={t} className="mitre-tag">{t}</span>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height:0, opacity:0 }}
            animate={{ height:'auto', opacity:1 }}
            exit={{ height:0, opacity:0 }}
            transition={{ duration:0.18 }}
            style={{ overflow:'hidden' }}
          >
            <div style={{
              margin:'0 14px 10px 26px',
              padding:'10px 12px',
              background:'rgba(0,0,0,0.25)',
              border:'1px solid #1a2744', borderRadius:7,
              display:'grid', gridTemplateColumns:'1fr 1fr 1fr',
              gap:'6px 16px', fontSize:11.5,
            }}>
              {[
                ['Rule ID',    alert.rule_id     || '—'],
                ['Agent IP',   alert.agent_ip    || '—'],
                ['Source IP',  alert.src_ip      || '—'],
                ['Status',     alert.status      || '—'],
                ['Count',      alert.count ?? 1         ],
                ['MITRE',      (alert.mitre||[]).join(', ')||'—'],
              ].map(([k,v]) => (
                <div key={k}>
                  <div style={{ fontSize:9.5, color:'#3d5080', marginBottom:2 }}>{k}</div>
                  <div style={{
                    color:'#c8d8f0',
                    fontFamily:'JetBrains Mono,monospace',
                  }}>{String(v)}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function HuntResults({ results, query, isRunning }) {
  const [search, setSearch] = useState('');

  const displayResults = results || mockAlerts;

  const filtered = search
    ? displayResults.filter(a =>
        a.description.toLowerCase().includes(search.toLowerCase()) ||
        (a.agent_name||'').toLowerCase().includes(search.toLowerCase()))
    : displayResults;

  const exportResults = () => {
    const blob = new Blob(
      [JSON.stringify(filtered, null, 2)],
      { type:'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href = url; a.download = `hunt_results_${Date.now()}.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  if (isRunning) {
    return (
      <div style={{ textAlign:'center', padding:'48px 0', color:'#3d5080' }}>
        <div style={{
          width:40, height:40, borderRadius:'50%', margin:'0 auto 16px',
          border:'3px solid #1a2744', borderTopColor:'#00e5ff',
          animation:'spin 0.8s linear infinite',
        }} />
        <div style={{ fontSize:14, color:'#4a6090', marginBottom:6 }}>
          Running threat hunt…
        </div>
        <div style={{ fontSize:12 }}>
          Querying Elasticsearch across all indices
        </div>
      </div>
    );
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center',
        justifyContent:'space-between', gap:10, flexWrap:'wrap' }}>
        <div>
          <div style={{ fontSize:14, fontWeight:600, color:'#e8f4ff',
            display:'flex', alignItems:'center', gap:8 }}>
            <AlertTriangle size={15} color="#ff8c00" />
            Hunt Results
            <span style={{
              fontFamily:'JetBrains Mono,monospace', fontSize:12,
              color:'#00e5ff', background:'rgba(0,229,255,0.10)',
              border:'1px solid rgba(0,229,255,0.22)',
              borderRadius:4, padding:'1px 7px',
            }}>
              {filtered.length} matches
            </span>
          </div>
          {query && (
            <div style={{
              fontFamily:'JetBrains Mono,monospace', fontSize:11,
              color:'#6b7fa3', marginTop:4,
              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
              maxWidth:500,
            }}>
              {query}
            </div>
          )}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <div style={{ position:'relative' }}>
            <Search size={12} color="#4a6090" style={{
              position:'absolute', left:9,
              top:'50%', transform:'translateY(-50%)',
            }} />
            <input className="soc-input" value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter results…"
              style={{ paddingLeft:28, height:30, fontSize:12, width:180 }}
            />
          </div>
          <button className="btn-cyber btn-ghost"
            style={{ fontSize:12, padding:'5px 12px' }}
            onClick={exportResults}>
            <Download size={13} /> Export
          </button>
        </div>
      </div>

      {/* Results list */}
      <div className="glass-card" style={{ overflow:'hidden', padding:0 }}>
        {/* Table header */}
        <div style={{
          display:'flex', alignItems:'center', gap:12,
          padding:'8px 14px', background:'rgba(0,0,0,0.3)',
          borderBottom:'1px solid #1a2744',
        }}>
          <div style={{ width:14 }} />
          <div style={{ width:90, ...headerStyle }}>SEVERITY</div>
          <div style={{ width:110, ...headerStyle }}>TIME</div>
          <div style={{ flex:1, ...headerStyle }}>DESCRIPTION</div>
          <div style={{ width:120, ...headerStyle }}>AGENT</div>
          <div style={{ ...headerStyle }}>MITRE</div>
        </div>

        {filtered.map((alert, i) => (
          <ResultRow key={alert.id} alert={alert} index={i} />
        ))}

        {filtered.length === 0 && (
          <div style={{ textAlign:'center', padding:'32px 0', color:'#3d5080' }}>
            <Search size={28} style={{ opacity:0.2, margin:'0 auto 8px' }} />
            <div style={{ fontSize:13 }}>No results match the current hunt query</div>
          </div>
        )}
      </div>
    </div>
  );
}

const headerStyle = {
  fontSize:10.5, color:'#3d5080', fontWeight:700,
  textTransform:'uppercase', letterSpacing:'0.08em',
  fontFamily:'JetBrains Mono,monospace',
};