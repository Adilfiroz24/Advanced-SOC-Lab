// ============================================================
// Advanced SOC Lab — Dashboard.jsx
// Interactive charts: hover, filters, cross-filtering, fullscreen
// ============================================================

import React, { useState, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, FolderOpen, Clock, Shield,
  Activity, Target, Zap, Globe,
  Maximize2, Minimize2, RefreshCw,
  Filter, Download, TrendingUp,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
  Legend, Brush, ReferenceLine,
} from 'recharts';

import StatsCard    from '../components/StatsCard';
import AlertTable   from '../components/AlertTable';
import MITREHeatmap from '../components/MITREHeatmap';
import LiveFeed     from '../components/LiveFeed';

import { mockAlerts, alertStats }     from '../data/mockAlerts';
import { mitreCoverage, feedSummary } from '../data/mockThreatIntel';

// ── Chart data ────────────────────────────────────────────
const TIMELINE_ALL = [
  { time:'00:00', critical:0, high:2, medium:5  },
  { time:'02:00', critical:1, high:3, medium:4  },
  { time:'04:00', critical:0, high:1, medium:3  },
  { time:'06:00', critical:2, high:4, medium:7  },
  { time:'08:00', critical:3, high:6, medium:12 },
  { time:'10:00', critical:1, high:4, medium:9  },
  { time:'12:00', critical:4, high:8, medium:14 },
  { time:'14:00', critical:2, high:5, medium:8  },
  { time:'16:00', critical:3, high:7, medium:11 },
  { time:'18:00', critical:5, high:9, medium:16 },
  { time:'20:00', critical:2, high:6, medium:9  },
  { time:'22:00', critical:1, high:3, medium:6  },
];

const TACTIC_DATA = [
  { name:'Credential Access', value:34, fill:'#ff2d6d' },
  { name:'Discovery',         value:28, fill:'#ff8c00' },
  { name:'Execution',         value:18, fill:'#ffd600' },
  { name:'Persistence',       value:10, fill:'#00e5ff' },
  { name:'Impact',            value:6,  fill:'#7b2fff' },
  { name:'Other',             value:4,  fill:'#3d5080' },
];

const AGENT_DATA = [
  { agent:'suricata-nsm',    alerts:1243 },
  { agent:'win10-victim',    alerts:47   },
  { agent:'ubuntu-webserver',alerts:24   },
  { agent:'cowrie-honeypot', alerts:7    },
];

// ── Custom tooltip ────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(10,15,30,0.97)',
      border: '1px solid #1a2744',
      borderRadius: 8, padding: '10px 14px',
      fontSize: 12, color: '#c8d8f0',
      boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
    }}>
      <div style={{ marginBottom: 6, color: '#6b7fa3', fontWeight: 600 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{
          display:'flex', alignItems:'center', gap:7, marginBottom:3,
        }}>
          <div style={{
            width:8, height:8, borderRadius:2,
            background:p.color, flexShrink:0,
          }} />
          <span style={{ color:'#c8d8f0' }}>{p.name}:</span>
          <span style={{
            color:p.color,
            fontFamily:'JetBrains Mono,monospace',
            fontWeight:600,
          }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Panel wrapper with fullscreen + download ──────────────
function Panel({ title, subtitle, children, style = {}, initialH }) {
  const [fullscreen, setFullscreen] = useState(false);
  const panelRef = useRef(null);

  const downloadSVG = () => {
    const svg = panelRef.current?.querySelector('svg');
    if (!svg) return;
    const blob = new Blob([svg.outerHTML], { type:'image/svg+xml' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `${title.replace(/\s+/g,'-').toLowerCase()}.svg`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={panelRef}
        layout
        className="glass-card"
        style={{
          padding: '16px 18px',
          ...(fullscreen ? {
            position: 'fixed', inset: 24, zIndex: 200,
            background: 'rgba(8,12,28,0.99)',
            borderRadius: 16,
            overflow: 'auto',
          } : {}),
          ...style,
        }}
        transition={{ layout: { duration: 0.2 } }}
      >
        <div style={{
          display:'flex', justifyContent:'space-between',
          alignItems:'flex-start', marginBottom:14,
        }}>
          <div>
            <div style={{ fontSize:14.5, fontWeight:600, color:'#e8f4ff' }}>
              {title}
            </div>
            {subtitle && (
              <div style={{ fontSize:11.5, color:'#3d5080', marginTop:2 }}>
                {subtitle}
              </div>
            )}
          </div>
          <div style={{ display:'flex', gap:5 }}>
            <button onClick={downloadSVG} title="Download SVG" style={{
              background:'none', border:'none', cursor:'pointer',
              color:'#3d5080', padding:4, borderRadius:5,
            }}>
              <Download size={13}/>
            </button>
            <button
              onClick={() => setFullscreen(p => !p)}
              title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              style={{
                background:'none', border:'none', cursor:'pointer',
                color:'#3d5080', padding:4, borderRadius:5,
                transition:'color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.color='#00e5ff'}
              onMouseLeave={e => e.currentTarget.style.color='#3d5080'}
            >
              {fullscreen ? <Minimize2 size={13}/> : <Maximize2 size={13}/>}
            </button>
          </div>
        </div>
        <div style={fullscreen ? { minHeight:400 } : {}}>
          {children}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Main Dashboard ────────────────────────────────────────
export default function Dashboard() {
  const [activeSeverity, setActiveSeverity] = useState(null);
  const [activeTactic,   setActiveTactic]   = useState(null);
  const [timeRange,      setTimeRange]       = useState('24h');
  const [refreshKey,     setRefreshKey]      = useState(0);

  const today = new Date().toLocaleDateString('en-US', {
    weekday:'long', year:'numeric', month:'long', day:'numeric',
  });

  // Cross-filtered alerts
  const filteredAlerts = useMemo(() => {
    return (mockAlerts || []).filter(a => {
      if (activeSeverity && a.severity !== activeSeverity) return false;
      if (activeTactic && !(a.mitre || []).some(m =>
        m.includes(activeTactic))) return false;
      return true;
    });
  }, [activeSeverity, activeTactic]);

  const displayStats = useMemo(() => ({
    total:    filteredAlerts.length,
    critical: filteredAlerts.filter(a => a.severity === 'critical').length,
    open:     filteredAlerts.filter(a => a.status   === 'open').length,
    mttr:     42,
  }), [filteredAlerts]);

  const clearFilters = () => {
    setActiveSeverity(null);
    setActiveTactic(null);
  };

  const hasFilters = activeSeverity || activeTactic;

  const FilterBanner = () => hasFilters ? (
    <motion.div
      initial={{ height:0, opacity:0 }}
      animate={{ height:'auto', opacity:1 }}
      exit={{ height:0, opacity:0 }}
      style={{
        display:'flex', alignItems:'center', gap:10,
        padding:'8px 14px', marginBottom:14,
        background:'rgba(0,229,255,0.07)',
        border:'1px solid rgba(0,229,255,0.20)',
        borderRadius:8,
      }}
    >
      <Filter size={13} color="#00e5ff" />
      <span style={{ fontSize:12.5, color:'#c8d8f0' }}>
        Cross-filter active:
        {activeSeverity && (
          <strong style={{ color:'#00e5ff', marginLeft:6 }}>
            Severity: {activeSeverity}
          </strong>
        )}
        {activeTactic && (
          <strong style={{ color:'#00e5ff', marginLeft:6 }}>
            Tactic: {activeTactic}
          </strong>
        )}
        <span style={{ color:'#6b7fa3' }}>
          {' '}— {filteredAlerts.length} of {mockAlerts.length} alerts
        </span>
      </span>
      <button onClick={clearFilters} style={{
        marginLeft:'auto', background:'none', border:'none',
        cursor:'pointer', color:'#6b7fa3', fontSize:12,
      }}>
        ✕ Clear
      </button>
    </motion.div>
  ) : null;

  return (
    <motion.div
      key={`dashboard-${refreshKey}`}
      initial={{ opacity:0, y:10 }}
      animate={{ opacity:1, y:0 }}
      exit={{ opacity:0 }}
      transition={{ duration:0.28 }}
    >
      {/* Header */}
      <div style={{ marginBottom:22, display:'flex',
        justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, color:'#e8f4ff', margin:0 }}>
            Security Operations Center
          </h1>
          <div style={{ fontSize:13, color:'#3d5080', marginTop:4 }}>
            Real-time monitoring · Wazuh 4.7 · {today}
          </div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {['6h','24h','7d','30d'].map(r => (
            <button key={r} onClick={() => setTimeRange(r)} style={{
              padding:'4px 10px', borderRadius:7, fontSize:11.5,
              cursor:'pointer', border:'1px solid',
              background:timeRange===r?'rgba(0,229,255,0.14)':'rgba(255,255,255,0.04)',
              color:      timeRange===r?'#00e5ff':'#6b7fa3',
              borderColor:timeRange===r?'rgba(0,229,255,0.30)':'#1a2744',
              fontFamily:'JetBrains Mono,monospace',
            }}>Last {r}</button>
          ))}
          <button className="btn-cyber btn-ghost"
            style={{ padding:'5px 10px', fontSize:12 }}
            onClick={() => setRefreshKey(k => k+1)}>
            <RefreshCw size={13}/> Refresh
          </button>
        </div>
      </div>

      {/* Cross-filter banner */}
      <AnimatePresence>{FilterBanner()}</AnimatePresence>

      {/* Stat cards */}
      <div style={{
        display:'grid', gridTemplateColumns:'repeat(4,1fr)',
        gap:12, marginBottom:14,
      }}>
        <StatsCard
          title="Total Alerts"
          value={displayStats.total}
          icon={Bell}
          color="#00e5ff"
          trend="up" trendValue="+12%"
          delay={0}
          onClick={() => setActiveSeverity(null)}
        />
        <StatsCard
          title="Critical Incidents"
          value={displayStats.critical}
          icon={Shield}
          color="#ff2d6d"
          alert
          delay={0.05}
          onClick={() => setActiveSeverity(
            activeSeverity === 'critical' ? null : 'critical'
          )}
        />
        <StatsCard
          title="Open Cases"
          value={displayStats.open}
          icon={FolderOpen}
          color="#ff8c00"
          delay={0.10}
        />
        <StatsCard
          title="Avg MTTR"
          value={displayStats.mttr}
          suffix="m"
          icon={Clock}
          color="#00ff88"
          trend="down" trendValue="-8m"
          delay={0.15}
        />
      </div>

      {/* Row 2 stat cards */}
      <div style={{
        display:'grid', gridTemplateColumns:'repeat(4,1fr)',
        gap:12, marginBottom:22,
      }}>
        {[
          { title:'Endpoints',   value:5,                   icon:Activity, color:'#7b2fff', delay:0.20 },
          { title:'Rules Firing',value:20,                  icon:Target,   color:'#00e5ff', delay:0.25 },
          { title:'IPs Blocked', value:feedSummary?.blocked || 3, icon:Globe, color:'#ff2d6d', delay:0.30 },
          { title:'SOAR Actions',value:8,                   icon:Zap,      color:'#00ff88', delay:0.35 },
        ].map(s => (
          <StatsCard key={s.title} {...s} />
        ))}
      </div>

      {/* Timeline + Tactic pie */}
      <div style={{
        display:'grid', gridTemplateColumns:'2fr 1fr',
        gap:14, marginBottom:14,
      }}>
        <Panel
          title="Alert Volume — 24h"
          subtitle="Stacked by severity · Drag to zoom · Click severity to cross-filter"
        >
          <div style={{ display:'flex', gap:6, marginBottom:10 }}>
            {['critical','high','medium'].map(sev => {
              const c = { critical:'#ff2d6d', high:'#ff8c00', medium:'#00e5ff' }[sev];
              return (
                <button key={sev} onClick={() =>
                  setActiveSeverity(activeSeverity === sev ? null : sev)} style={{
                  padding:'2px 10px', borderRadius:9999, fontSize:10.5,
                  cursor:'pointer', border:'1px solid',
                  background:activeSeverity===sev?`${c}20`:'rgba(255,255,255,0.04)',
                  color:      activeSeverity===sev?c:'#6b7fa3',
                  borderColor:activeSeverity===sev?`${c}40`:'#1a2744',
                }}>{sev}</button>
              );
            })}
          </div>

          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={TIMELINE_ALL}
              margin={{ top:0, right:0, left:-22, bottom:0 }}>
              <defs>
                {[['gc','#ff2d6d'],['gh','#ff8c00'],['gm','#00e5ff']].map(([id,c]) => (
                  <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={c} stopOpacity={0.40}/>
                    <stop offset="100%" stopColor={c} stopOpacity={0.02}/>
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2744" vertical={false}/>
              <XAxis dataKey="time"
                tick={{ fontSize:10, fill:'#3d5080' }}
                axisLine={false} tickLine={false}/>
              <YAxis
                tick={{ fontSize:10, fill:'#3d5080' }}
                axisLine={false} tickLine={false}/>
              <Tooltip content={<ChartTooltip/>}/>
              <Brush dataKey="time" height={18} stroke="#1a2744"
                fill="rgba(10,15,30,0.8)"
                travellerWidth={6}
                style={{ fontSize:10, fill:'#3d5080' }}
              />
              {(!activeSeverity || activeSeverity==='medium') && (
                <Area type="monotone" dataKey="medium" name="Medium"
                  stroke="#00e5ff" fill="url(#gm)" strokeWidth={1.5}/>
              )}
              {(!activeSeverity || activeSeverity==='high') && (
                <Area type="monotone" dataKey="high" name="High"
                  stroke="#ff8c00" fill="url(#gh)" strokeWidth={1.5}/>
              )}
              {(!activeSeverity || activeSeverity==='critical') && (
                <Area type="monotone" dataKey="critical" name="Critical"
                  stroke="#ff2d6d" fill="url(#gc)" strokeWidth={2}/>
              )}
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="ATT&CK Tactics" subtitle="Click slice to cross-filter">
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={TACTIC_DATA}
                cx="50%" cy="50%"
                innerRadius={40} outerRadius={65}
                paddingAngle={3} dataKey="value"
                onClick={(d) => setActiveTactic(
                  activeTactic === d.name ? null : d.name
                )}
                cursor="pointer"
              >
                {TACTIC_DATA.map((entry, i) => (
                  <Cell key={i} fill={entry.fill}
                    opacity={activeTactic && activeTactic !== entry.name ? 0.3 : 1}
                    stroke={activeTactic === entry.name ? entry.fill : 'none'}
                    strokeWidth={activeTactic === entry.name ? 2 : 0}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(v, n) => [`${v}%`, n]}
                contentStyle={{
                  background:'rgba(10,15,30,0.97)',
                  border:'1px solid #1a2744',
                  borderRadius:8, fontSize:12,
                }}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
            {TACTIC_DATA.slice(0,4).map(t => (
              <div key={t.name}
                onClick={() => setActiveTactic(activeTactic === t.name ? null : t.name)}
                style={{
                  display:'flex', alignItems:'center', gap:7,
                  fontSize:11.5, cursor:'pointer',
                  opacity:activeTactic && activeTactic !== t.name ? 0.35 : 1,
                  transition:'opacity 0.15s',
                }}
              >
                <div style={{ width:8, height:8, borderRadius:2,
                  background:t.fill, flexShrink:0 }}/>
                <span style={{ color:'#6b7fa3', flex:1 }}>{t.name}</span>
                <span style={{
                  color:t.fill, fontFamily:'JetBrains Mono,monospace', fontSize:11,
                }}>{t.value}%</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Agent bar + Live feed */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
        <Panel title="Agent Alert Volume" subtitle="Alerts generated per monitored endpoint">
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={AGENT_DATA} layout="vertical"
              margin={{ left:0, right:10, top:0, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2744" horizontal={false}/>
              <XAxis type="number"
                tick={{ fontSize:10, fill:'#3d5080' }} axisLine={false} tickLine={false}/>
              <YAxis type="category" dataKey="agent" width={116}
                tick={{ fontSize:10.5, fill:'#6b7fa3' }} axisLine={false} tickLine={false}/>
              <Tooltip content={<ChartTooltip/>}/>
              <Bar dataKey="alerts" name="Alerts"
                radius={[0,4,4,0]} cursor="pointer">
                {AGENT_DATA.map((e, i) => (
                  <Cell key={i}
                    fill={e.alerts>500?'#ff2d6d':e.alerts>20?'#ff8c00':'#00e5ff'}
                    fillOpacity={0.75}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Live Alert Feed">
          <LiveFeed alerts={mockAlerts} maxItems={6}/>
        </Panel>
      </div>

      {/* MITRE Heatmap */}
      <Panel title="MITRE ATT&CK Coverage"
        subtitle="Hover cells for details · Coverage by technique and tactic"
        style={{ marginBottom:14 }}>
        <MITREHeatmap data={mitreCoverage}/>
      </Panel>

      {/* Alert table */}
      <Panel
        title="Recent Alerts"
        subtitle={`${filteredAlerts.length} alerts${hasFilters?' (filtered)':''} · Click row to expand`}
        style={{ padding:0, overflow:'hidden' }}
      >
        <div style={{ padding:'14px 18px 10px', borderBottom:'1px solid #1a2744' }} />
        <AlertTable alerts={filteredAlerts} compact/>
      </Panel>
    </motion.div>
  );
}