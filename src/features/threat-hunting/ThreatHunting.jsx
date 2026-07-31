import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Search, Bookmark, TrendingUp } from 'lucide-react';
import HuntQueryBuilder from './HuntQueryBuilder';
import HuntResults      from './HuntResults';
import Bookmarks        from './Bookmarks';
import { mockAlerts }   from '../../data/mockAlerts';

const TABS = [
  { id:'query',     label:'Query Builder', icon:Search    },
  { id:'results',   label:'Results',       icon:TrendingUp},
  { id:'bookmarks', label:'Bookmarks',     icon:Bookmark  },
];

export default function ThreatHunting() {
  const [activeTab,   setActiveTab]   = useState('query');
  const [results,     setResults]     = useState(null);
  const [lastQuery,   setLastQuery]   = useState('');
  const [isRunning,   setIsRunning]   = useState(false);
  const [huntCount,   setHuntCount]   = useState(0);

  const handleRun = ({ conditions, logic, query }) => {
    setLastQuery(query);
    setIsRunning(true);
    setActiveTab('results');

    // Simulate search against mock data
    setTimeout(() => {
      const minLevel = conditions.find(c =>
        c.field === 'rule.level' && (c.operator === '>=' || c.operator === '>'))
        ?.value;
      const filtered = (mockAlerts || []).filter(a => {
        if (minLevel && (a.rule_level || 0) < Number(minLevel)) return false;
        return true;
      });
      setResults(filtered);
      setIsRunning(false);
      setHuntCount(c => c + 1);
    }, 1500);
  };

  const loadBookmark = (query) => {
    setLastQuery(query);
    setActiveTab('query');
  };

  return (
    <motion.div
      key="threat-hunting"
      initial={{ opacity:0, y:10 }}
      animate={{ opacity:1, y:0 }}
      transition={{ duration:0.25 }}
    >
      {/* ── Page header ─────────────────────────────── */}
      <div style={{ marginBottom:24 }}>
        <h1 style={{
          fontSize:22, fontWeight:700, color:'#e8f4ff',
          margin:0, display:'flex', alignItems:'center', gap:10,
        }}>
          <Activity size={20} color="#00e5ff" />
          Threat Hunting
        </h1>
        <div style={{ fontSize:13, color:'#3d5080', marginTop:4 }}>
          Proactive threat detection · Elasticsearch query builder · {huntCount} hunts run this session
        </div>
      </div>

      {/* ── Stats ───────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)',
        gap:10, marginBottom:20 }}>
        {[
          { label:'Hunts Run',    value:huntCount,                               color:'#00e5ff' },
          { label:'Last Hits',    value:results ? results.length : '—',          color:results?.length>0?'#ff2d6d':'#00ff88'},
          { label:'Data Sources', value:4,                                       color:'#ff8c00' },
          { label:'Bookmarks',    value:4,                                       color:'#a855f7' },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ padding:'12px 14px' }}>
            <div style={{ fontFamily:'JetBrains Mono,monospace',
              fontSize:22, fontWeight:700, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11, color:'#3d5080', marginTop:3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Tab bar ─────────────────────────────────── */}
      <div style={{ display:'flex', gap:6, marginBottom:16 }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              display:'flex', alignItems:'center', gap:6,
              padding:'7px 16px', borderRadius:8, border:'1px solid',
              cursor:'pointer', fontSize:12.5, fontWeight:500,
              transition:'all 0.15s',
              background: isActive ? 'rgba(0,229,255,0.12)' : 'rgba(255,255,255,0.04)',
              color:      isActive ? '#00e5ff'               : '#6b7fa3',
              borderColor:isActive ? 'rgba(0,229,255,0.30)'  : '#1a2744',
            }}>
              <Icon size={13} />
              {tab.label}
              {tab.id === 'results' && results && (
                <span style={{
                  fontFamily:'JetBrains Mono,monospace',
                  fontSize:10, color:'#00e5ff',
                  background:'rgba(0,229,255,0.15)',
                  border:'1px solid rgba(0,229,255,0.25)',
                  borderRadius:9999, padding:'0 5px',
                  marginLeft:4,
                }}>{results.length}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tab content ─────────────────────────────── */}
      <div className="glass-card" style={{ padding:'20px 22px' }}>
        {activeTab === 'query' && (
          <HuntQueryBuilder onRun={handleRun} />
        )}
        {activeTab === 'results' && (
          <HuntResults
            results={results}
            query={lastQuery}
            isRunning={isRunning}
          />
        )}
        {activeTab === 'bookmarks' && (
          <Bookmarks onLoad={loadBookmark} />
        )}
      </div>
    </motion.div>
  );
}