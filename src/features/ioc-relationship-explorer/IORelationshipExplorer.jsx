import React, { useState, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, Hash, Link, Server, User,
  AlertTriangle, Shield, Search, ZoomIn,
  ZoomOut, Maximize, Info, Copy, X,
  ChevronRight,
} from 'lucide-react';
import { mockThreatIntel } from '../../data/mockThreatIntel';

// ── Node type configuration ───────────────────────────────
const NODE_CFG = {
  ip:      { icon: Globe,         color: '#ff8c00', r: 26 },
  hash:    { icon: Hash,          color: '#a855f7', r: 22 },
  url:     { icon: Link,          color: '#00e5ff', r: 22 },
  domain:  { icon: Globe,         color: '#ffd600', r: 24 },
  host:    { icon: Server,        color: '#00e5ff', r: 26 },
  user:    { icon: User,          color: '#00ff88', r: 22 },
  alert:   { icon: AlertTriangle, color: '#ff2d6d', r: 28 },
  default: { icon: Shield,        color: '#6b7fa3', r: 20 },
};

// ── Build graph from IOC data ─────────────────────────────
function buildGraph(iocs) {
  const nodes = [];
  const edges = [];
  const seen  = new Set();

  // Root node — lab target
  nodes.push({
    id: 'lab-target', type: 'host',
    label: 'Lab Target', detail: '192.168.56.0/24',
    x: 420, y: 240,
  });

  const angles = [];
  const count  = iocs.length;
  iocs.forEach((ioc, i) => {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2;
    const radius = 180 + (i % 3) * 50;
    const x = 420 + radius * Math.cos(angle);
    const y = 240 + radius * Math.sin(angle);

    nodes.push({
      id:       ioc.id,
      type:     ioc.type || 'ip',
      label:    ioc.value,
      detail:   ioc.threat_type,
      score:    ioc.confidence,
      country:  ioc.country,
      blocked:  ioc.blocked,
      mitre:    ioc.mitre || [],
      x, y,
    });

    edges.push({
      id:       `e-${ioc.id}`,
      source:   ioc.id,
      target:   'lab-target',
      relation: ioc.blocked ? 'blocked' : 'targeting',
      weight:   ioc.confidence >= 80 ? 2.5 : 1.5,
    });

    // Add related nodes from mitre
    if (ioc.mitre?.length > 0 && !seen.has(ioc.mitre[0])) {
      seen.add(ioc.mitre[0]);
      const mx = x + 70 * Math.cos(angle + 0.4);
      const my = y + 70 * Math.sin(angle + 0.4);
      nodes.push({
        id: `mitre-${ioc.mitre[0]}`,
        type: 'alert', label: ioc.mitre[0],
        detail: 'ATT&CK Technique',
        x: mx, y: my,
      });
      edges.push({
        id:       `e-mitre-${ioc.id}`,
        source:   ioc.id,
        target:   `mitre-${ioc.mitre[0]}`,
        relation: 'maps_to',
        weight:   1,
      });
    }
  });

  return { nodes, edges };
}

const RELATION_COLOR = {
  targeting: '#ff2d6d',
  blocked:   '#00ff88',
  maps_to:   '#a855f7',
  default:   '#243660',
};

export default function IOCRelationshipExplorer() {
  const svgRef   = useRef(null);
  const W = 840, H = 480;

  const iocs   = (mockThreatIntel || []).slice(0, 8);
  const { nodes: initNodes, edges } = useMemo(() => buildGraph(iocs), [iocs]);

  const [positions, setPositions] = useState(
    Object.fromEntries(initNodes.map(n => [n.id, { x: n.x, y: n.y }]))
  );
  const [nodes]     = useState(initNodes);
  const [selected,  setSelected]  = useState(null);
  const [dragging,  setDragging]  = useState(null);
  const [zoom,      setZoom]      = useState(1);
  const [pan,       setPan]       = useState({ x: 0, y: 0 });
  const [search,    setSearch]    = useState('');
  const [highlight, setHighlight] = useState(null);

  // ── Drag ──────────────────────────────────────────────
  const onNodeMouseDown = useCallback((nodeId, e) => {
    e.stopPropagation();
    setDragging(nodeId);
    setSelected(nodeId);
  }, []);

  const onMouseMove = useCallback((e) => {
    if (!dragging || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x    = (e.clientX - rect.left - pan.x) / zoom;
    const y    = (e.clientY - rect.top  - pan.y) / zoom;
    setPositions(prev => ({ ...prev, [dragging]: { x, y } }));
  }, [dragging, pan, zoom]);

  const onMouseUp = useCallback(() => setDragging(null), []);

  // ── Filter ────────────────────────────────────────────
  const filteredNodeIds = useMemo(() => {
    if (!search.trim()) return new Set(nodes.map(n => n.id));
    const q = search.toLowerCase();
    return new Set(
      nodes
        .filter(n => n.label.toLowerCase().includes(q) || n.detail?.toLowerCase().includes(q))
        .map(n => n.id)
    );
  }, [nodes, search]);

  const selectedNode = selected ? nodes.find(n => n.id === selected) : null;
  const nodeEdges    = selected
    ? edges.filter(e => e.source === selected || e.target === selected)
    : [];

  const copy = (v) => navigator.clipboard?.writeText(v);

  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  return (
    <motion.div
      key="ioc-explorer"
      initial={{ opacity:0, y:10 }}
      animate={{ opacity:1, y:0 }}
      transition={{ duration:0.25 }}
    >
      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <h1 style={{
          fontSize:22, fontWeight:700, color:'#e8f4ff',
          margin:0, display:'flex', alignItems:'center', gap:10,
        }}>
          <Globe size={20} color="#00e5ff" />
          IOC Relationship Explorer
        </h1>
        <div style={{ fontSize:13, color:'#3d5080', marginTop:4 }}>
          Interactive graph of IOC connections · Click any node to explore relationships
        </div>
      </div>

      {/* Controls */}
      <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <Search size={12} color="#4a6090" style={{
            position:'absolute', left:9, top:'50%', transform:'translateY(-50%)',
          }} />
          <input className="soc-input" value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Highlight nodes by IOC value or type…"
            style={{ paddingLeft:28, height:30, fontSize:12 }}
          />
        </div>
        {[
          { icon:ZoomIn,   fn:() => setZoom(z => Math.min(z+0.2, 3)) },
          { icon:ZoomOut,  fn:() => setZoom(z => Math.max(z-0.2, 0.3)) },
          { icon:Maximize, fn:resetView },
        ].map(({ icon:Icon, fn }, i) => (
          <button key={i} onClick={fn} style={{
            background:'rgba(255,255,255,0.04)',
            border:'1px solid #1a2744', borderRadius:6,
            color:'#6b7fa3', cursor:'pointer', padding:'5px 10px',
          }}
            onMouseEnter={e => e.currentTarget.style.color='#00e5ff'}
            onMouseLeave={e => e.currentTarget.style.color='#6b7fa3'}
          >
            <Icon size={13} />
          </button>
        ))}

        {/* Legend */}
        <div style={{ display:'flex', gap:10, marginLeft:'auto', flexWrap:'wrap' }}>
          {Object.entries({ ip:'#ff8c00', hash:'#a855f7', url:'#00e5ff',
            domain:'#ffd600', alert:'#ff2d6d' }).map(([type, color]) => (
            <div key={type} style={{
              display:'flex', alignItems:'center', gap:5,
              fontSize:10.5, color:'#6b7fa3',
            }}>
              <div style={{
                width:8, height:8, borderRadius:'50%',
                background:color, boxShadow:`0 0 4px ${color}`,
              }} />
              {type}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 260px', gap:14 }}>

        {/* Graph */}
        <div style={{
          background:'rgba(5,9,22,0.95)',
          border:'1px solid #1a2744', borderRadius:12,
          overflow:'hidden', position:'relative',
        }}>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            style={{ display:'block', width:'100%', cursor:dragging?'grabbing':'default' }}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          >
            {/* Grid */}
            <pattern id="ioc-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none"
                stroke="rgba(0,229,255,0.03)" strokeWidth="0.5" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#ioc-grid)" />

            {/* Arrow markers */}
            <defs>
              {['ff2d6d','00ff88','a855f7','243660'].map(c => (
                <marker key={c} id={`arr-${c}`}
                  markerWidth="8" markerHeight="8"
                  refX="22" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill={`#${c}`} opacity="0.7" />
                </marker>
              ))}
            </defs>

            <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
              {/* Edges */}
              {edges.map(edge => {
                const sp = positions[edge.source];
                const tp = positions[edge.target];
                if (!sp || !tp) return null;
                const color = RELATION_COLOR[edge.relation] || RELATION_COLOR.default;
                const arrId = { targeting:'ff2d6d', blocked:'00ff88',
                  maps_to:'a855f7' }[edge.relation] || '243660';

                // Midpoint
                const mx = (sp.x + tp.x) / 2;
                const my = (sp.y + tp.y) / 2;

                const isHighlighted = selected===edge.source || selected===edge.target;
                return (
                  <g key={edge.id}>
                    <line
                      x1={sp.x} y1={sp.y} x2={tp.x} y2={tp.y}
                      stroke={color}
                      strokeWidth={isHighlighted ? edge.weight + 1 : edge.weight}
                      strokeOpacity={isHighlighted ? 0.9 : 0.4}
                      markerEnd={`url(#arr-${arrId})`}
                    />
                    <text x={mx} y={my - 5} textAnchor="middle"
                      style={{
                        fontSize:8.5, fill:color, opacity:isHighlighted?0.9:0.5,
                        fontFamily:'JetBrains Mono,monospace',
                      }}>
                      {edge.relation}
                    </text>
                  </g>
                );
              })}

              {/* Nodes */}
              {nodes.map(node => {
                const pos    = positions[node.id];
                if (!pos) return null;
                const cfg    = NODE_CFG[node.type] || NODE_CFG.default;
                const color  = cfg.color;
                const r      = cfg.r;
                const isSelected   = selected === node.id;
                const isHighlighted = filteredNodeIds.has(node.id);
                const isDimmed     = search && !isHighlighted;

                return (
                  <g key={node.id}
                    transform={`translate(${pos.x},${pos.y})`}
                    style={{ cursor:'pointer', opacity:isDimmed?0.25:1 }}
                    onMouseDown={(e) => onNodeMouseDown(node.id, e)}
                    onClick={() => setSelected(selected===node.id ? null : node.id)}
                  >
                    {/* Selection ring */}
                    {isSelected && (
                      <circle r={r+8} fill="none"
                        stroke={color} strokeWidth={1.5} strokeOpacity={0.4}
                        style={{ filter:`drop-shadow(0 0 6px ${color})` }}
                      />
                    )}

                    {/* Node circle */}
                    <circle r={r}
                      fill={`${color}18`}
                      stroke={color}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                      style={{
                        filter:     dragging===node.id
                          ? `drop-shadow(0 0 10px ${color})`
                          : `drop-shadow(0 0 3px ${color}60)`,
                        transition: 'stroke-width 0.15s',
                      }}
                    />

                    {/* Blocked indicator */}
                    {node.blocked && (
                      <circle r={r + 4} fill="none"
                        stroke="#00ff88" strokeWidth={1}
                        strokeDasharray="3 3" strokeOpacity={0.6}
                      />
                    )}

                    {/* Icon */}
                    <foreignObject x={-9} y={-9} width={18} height={18}
                      style={{ overflow:'visible', pointerEvents:'none' }}>
                      <div style={{
                        display:'flex', alignItems:'center', justifyContent:'center',
                        width:18, height:18,
                      }}>
                        {React.createElement(cfg.icon, { size:13, color })}
                      </div>
                    </foreignObject>

                    {/* Label */}
                    <text y={r + 13} textAnchor="middle" style={{
                      fontSize:9.5, fontFamily:'JetBrains Mono,monospace',
                      fill:'#c8d8f0', pointerEvents:'none',
                    }}>
                      {node.label.length > 16
                        ? node.label.slice(0,14) + '…'
                        : node.label}
                    </text>

                    {/* Score badge */}
                    {node.score != null && (
                      <text y={r + 23} textAnchor="middle" style={{
                        fontSize:8.5, fontFamily:'JetBrains Mono,monospace',
                        fill: node.score >= 80 ? '#ff2d6d'
                            : node.score >= 50 ? '#ff8c00'
                            : '#6b7fa3',
                        pointerEvents:'none',
                      }}>
                        {node.score}%
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* Detail panel */}
        <div>
          <AnimatePresence mode="wait">
            {selectedNode ? (
              <motion.div key={selectedNode.id}
                initial={{ opacity:0, x:10 }}
                animate={{ opacity:1, x:0 }}
                exit={{ opacity:0, x:10 }}
                style={{
                  background:'rgba(13,21,48,0.97)',
                  border:'1px solid #243660', borderRadius:10,
                  overflow:'hidden',
                }}
              >
                {/* Node header */}
                <div style={{
                  padding:'12px 14px', borderBottom:'1px solid #1a2744',
                  display:'flex', alignItems:'center', gap:8,
                }}>
                  <div style={{
                    width:28, height:28, borderRadius:7, flexShrink:0,
                    background:`${NODE_CFG[selectedNode.type]?.color||'#6b7fa3'}15`,
                    border:`1px solid ${NODE_CFG[selectedNode.type]?.color||'#6b7fa3'}25`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>
                    {React.createElement(
                      NODE_CFG[selectedNode.type]?.icon || Shield,
                      { size:13, color:NODE_CFG[selectedNode.type]?.color||'#6b7fa3' }
                    )}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{
                      fontFamily:'JetBrains Mono,monospace',
                      fontSize:11.5, color:'#e8f4ff', fontWeight:600,
                      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                    }}>
                      {selectedNode.label}
                    </div>
                    <div style={{ fontSize:10.5, color:'#3d5080', marginTop:1 }}>
                      {selectedNode.type?.toUpperCase()} · {selectedNode.detail}
                    </div>
                  </div>
                  <button onClick={() => copy(selectedNode.label)} style={{
                    background:'none', border:'none', cursor:'pointer',
                    color:'#3d5080', padding:4, flexShrink:0,
                  }}>
                    <Copy size={12} />
                  </button>
                </div>

                {/* Score */}
                {selectedNode.score != null && (
                  <div style={{ padding:'10px 14px', borderBottom:'1px solid #1a2744' }}>
                    <div style={{ display:'flex', justifyContent:'space-between',
                      alignItems:'center', marginBottom:5 }}>
                      <span style={{ fontSize:10.5, color:'#3d5080' }}>Confidence</span>
                      <span style={{
                        fontFamily:'JetBrains Mono,monospace',
                        fontSize:18, fontWeight:700,
                        color:selectedNode.score>=80?'#ff2d6d'
                          :selectedNode.score>=50?'#ff8c00':'#ffd600',
                      }}>{selectedNode.score}%</span>
                    </div>
                    <div style={{ height:4, background:'#1a2744', borderRadius:999 }}>
                      <motion.div
                        style={{
                          height:'100%', borderRadius:999,
                          background:selectedNode.score>=80?'#ff2d6d'
                            :selectedNode.score>=50?'#ff8c00':'#ffd600',
                        }}
                        initial={{ width:0 }}
                        animate={{ width:`${selectedNode.score}%` }}
                        transition={{ duration:0.7 }}
                      />
                    </div>
                  </div>
                )}

                {/* Attributes */}
                <div style={{ padding:'10px 14px', borderBottom:'1px solid #1a2744' }}>
                  {[
                    ['Type',    selectedNode.type],
                    ['Country', selectedNode.country || '—'],
                    ['Status',  selectedNode.blocked ? 'BLOCKED' : 'ACTIVE'],
                  ].map(([k,v]) => (
                    <div key={k} style={{
                      display:'flex', justifyContent:'space-between',
                      fontSize:11.5, marginBottom:5,
                      borderBottom:'1px solid #1a2744', paddingBottom:5,
                    }}>
                      <span style={{ color:'#3d5080' }}>{k}</span>
                      <span style={{
                        color:k==='Status'?(selectedNode.blocked?'#00ff88':'#ff2d6d'):'#c8d8f0',
                        fontFamily:'JetBrains Mono,monospace', fontSize:11,
                      }}>{v}</span>
                    </div>
                  ))}
                </div>

                {/* MITRE */}
                {selectedNode.mitre?.length > 0 && (
                  <div style={{ padding:'10px 14px', borderBottom:'1px solid #1a2744' }}>
                    <div style={{ fontSize:10, color:'#3d5080', marginBottom:6 }}>MITRE</div>
                    <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                      {selectedNode.mitre.map(t => (
                        <span key={t} className="mitre-tag">{t}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Connected edges */}
                <div style={{ padding:'10px 14px' }}>
                  <div style={{ fontSize:10, color:'#3d5080', marginBottom:8,
                    fontWeight:600, textTransform:'uppercase', letterSpacing:'0.07em',
                    fontFamily:'JetBrains Mono,monospace' }}>
                    Connections ({nodeEdges.length})
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                    {nodeEdges.map(edge => {
                      const otherId   = edge.source === selectedNode.id
                        ? edge.target : edge.source;
                      const otherNode = nodes.find(n => n.id === otherId);
                      const color     = RELATION_COLOR[edge.relation] || '#6b7fa3';
                      return (
                        <div key={edge.id}
                          onClick={() => setSelected(otherId)}
                          style={{
                            display:'flex', alignItems:'center', gap:8,
                            padding:'7px 9px', borderRadius:6, cursor:'pointer',
                            background:'rgba(0,0,0,0.2)', border:'1px solid #1a2744',
                            transition:'border-color 0.12s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.borderColor=color}
                          onMouseLeave={e => e.currentTarget.style.borderColor='#1a2744'}
                        >
                          <div style={{
                            width:6, height:6, borderRadius:'50%',
                            background:color, flexShrink:0,
                          }} />
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{
                              fontSize:11, color:'#c8d8f0', fontWeight:500,
                              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                            }}>
                              {otherNode?.label || otherId}
                            </div>
                            <div style={{ fontSize:9.5, color:color }}>
                              {edge.relation}
                            </div>
                          </div>
                          <ChevronRight size={11} color="#3d5080" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="empty"
                initial={{ opacity:0 }} animate={{ opacity:1 }}
                style={{
                  background:'rgba(13,21,48,0.5)',
                  border:'1px solid #1a2744', borderRadius:10,
                  padding:'32px 18px', textAlign:'center', color:'#3d5080',
                }}
              >
                <Globe size={28} style={{ opacity:0.2, margin:'0 auto 10px' }} />
                <div style={{ fontSize:12.5 }}>
                  Click any node<br />to explore its relationships
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}