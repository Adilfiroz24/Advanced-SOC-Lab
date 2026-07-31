import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut, Maximize, RefreshCw, Info } from 'lucide-react';
import GraphNode from './GraphNode';
import GraphEdge from './GraphEdge';

// ── Default graph data ────────────────────────────────────
const DEFAULT_NODES = [
  { id: 'ip1',    type: 'ip',    label: '203.0.113.45',   color: '#ff2d6d', count: 47 },
  { id: 'ip2',    type: 'ip',    label: '198.51.100.99',  color: '#ff8c00', count: 3  },
  { id: 'host1',  type: 'host',  label: 'win10-victim',   color: '#00e5ff', count: 1  },
  { id: 'host2',  type: 'host',  label: 'ubuntu-web',     color: '#00e5ff', count: 1  },
  { id: 'user1',  type: 'user',  label: 'backdooruser',   color: '#ff2d6d', count: 1  },
  { id: 'hash1',  type: 'hash',  label: '5f1d8aa80a44…',  color: '#a855f7', count: 1  },
  { id: 'alert1', type: 'alert', label: 'LSASS Access',   color: '#ff2d6d', count: 1  },
  { id: 'alert2', type: 'alert', label: 'SSH Brute',      color: '#ff8c00', count: 1  },
  { id: 'dom1',   type: 'domain',label: 'evil-c2.xyz',    color: '#ff8c00', count: 2  },
];

const DEFAULT_EDGES = [
  { id: 'e1', source: 'ip1',   target: 'host1', relation: 'connected_to', weight: 2 },
  { id: 'e2', source: 'ip1',   target: 'host2', relation: 'connected_to', weight: 2 },
  { id: 'e3', source: 'ip1',   target: 'alert2',relation: 'triggered',    weight: 1.5 },
  { id: 'e4', source: 'host1', target: 'user1', relation: 'created',      weight: 1.5 },
  { id: 'e5', source: 'host1', target: 'hash1', relation: 'dropped',      weight: 1.5 },
  { id: 'e6', source: 'host1', target: 'alert1',relation: 'triggered',    weight: 2 },
  { id: 'e7', source: 'ip2',   target: 'host2', relation: 'accessed',     weight: 1.5 },
  { id: 'e8', source: 'ip2',   target: 'dom1',  relation: 'resolved_to',  weight: 1 },
];

// ── Simple force layout ───────────────────────────────────
function initLayout(nodes, width, height) {
  const cx = width / 2;
  const cy = height / 2;
  const r  = Math.min(width, height) * 0.32;
  return nodes.map((n, i) => {
    const angle = (2 * Math.PI * i) / nodes.length;
    return {
      ...n,
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  });
}

export default function InvestigationGraph({
  nodes: propNodes = DEFAULT_NODES,
  edges: propEdges = DEFAULT_EDGES,
}) {
  const svgRef     = useRef(null);
  const W = 680, H = 460;

  const [positions, setPositions] = useState(() =>
    initLayout(propNodes, W, H)
  );
  const [selected,  setSelected]  = useState(null);
  const [zoom,      setZoom]      = useState(1);
  const [pan,       setPan]       = useState({ x: 0, y: 0 });
  const [dragging,  setDragging]  = useState(null);
  const [tooltip,   setTooltip]   = useState(null);

  const posMap = Object.fromEntries(positions.map(p => [p.id, p]));

  // ── Drag node ────────────────────────────────────────
  const handleNodeMouseDown = useCallback((nodeId, e) => {
    e.stopPropagation();
    setDragging(nodeId);
    setSelected(nodeId);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!dragging || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top  - pan.y) / zoom;
    setPositions(prev =>
      prev.map(p => p.id === dragging ? { ...p, x, y } : p)
    );
  }, [dragging, pan, zoom]);

  const handleMouseUp = useCallback(() => setDragging(null), []);

  // ── Reset layout ─────────────────────────────────────
  const reset = () => {
    setPositions(initLayout(propNodes, W, H));
    setZoom(1); setPan({ x: 0, y: 0 });
  };

  const nodeById = (id) => propNodes.find(n => n.id === id);
  const selectedNode = selected ? posMap[selected] : null;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#e8f4ff' }}>
          Investigation Graph
        </div>
        {/* Controls */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { icon: ZoomIn,   action: () => setZoom(z => Math.min(z + 0.2, 3))   },
            { icon: ZoomOut,  action: () => setZoom(z => Math.max(z - 0.2, 0.4)) },
            { icon: Maximize, action: reset },
            { icon: RefreshCw,action: reset },
          ].map(({ icon: Icon, action }, i) => (
            <button key={i} onClick={action} style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid #1a2744', borderRadius: 6,
              color: '#6b7fa3', cursor: 'pointer', padding: '5px 8px',
              transition: 'color 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.color = '#00e5ff'}
              onMouseLeave={e => e.currentTarget.style.color = '#6b7fa3'}
            >
              <Icon size={13} />
            </button>
          ))}
        </div>
      </div>

      <div style={{
        background: 'rgba(8,12,28,0.85)',
        border: '1px solid #1a2744', borderRadius: 12,
        overflow: 'hidden', position: 'relative',
      }}>
        <svg
          ref={svgRef}
          width="100%" viewBox={`0 0 ${W} ${H}`}
          style={{ display: 'block', cursor: dragging ? 'grabbing' : 'default' }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Arrow markers */}
          <defs>
            {['ff2d6d','ff8c00','00e5ff','a855f7','ffd600','00ff88','243660'].map(c => (
              <marker key={c} id={`arrow-${c}`}
                markerWidth="8" markerHeight="8"
                refX="20" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill={`#${c}`} opacity={0.7} />
              </marker>
            ))}
          </defs>

          {/* Grid */}
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none"
              stroke="rgba(0,229,255,0.04)" strokeWidth="0.5" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />

          <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
            {/* Edges */}
            {propEdges.map(edge => {
              const src = posMap[edge.source];
              const tgt = posMap[edge.target];
              if (!src || !tgt) return null;
              return (
                <GraphEdge key={edge.id} edge={edge}
                  sourceX={src.x} sourceY={src.y}
                  targetX={tgt.x} targetY={tgt.y}
                />
              );
            })}

            {/* Nodes */}
            {positions.map(pos => (
              <GraphNode
                key={pos.id}
                node={pos}
                x={pos.x} y={pos.y}
                isSelected={selected === pos.id}
                isDragging={dragging === pos.id}
                onMouseDown={(e) => handleNodeMouseDown(pos.id, e)}
                onClick={(node) => setSelected(
                  selected === node.id ? null : node.id
                )}
              />
            ))}
          </g>
        </svg>

        {/* Node detail panel */}
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            style={{
              position: 'absolute', top: 12, right: 12,
              width: 210,
              background: 'rgba(13,21,48,0.97)',
              border: '1px solid #243660', borderRadius: 10,
              padding: '12px 14px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: '#e8f4ff' }}>
                Node Details
              </div>
              <button onClick={() => setSelected(null)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#3d5080', padding: 2,
              }}>✕</button>
            </div>
            {[
              ['Type',  selectedNode.type],
              ['Label', selectedNode.label],
              ['Count', selectedNode.count],
            ].map(([k, v]) => (
              <div key={k} style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: 11.5, marginBottom: 5,
                borderBottom: '1px solid #1a2744', paddingBottom: 5,
              }}>
                <span style={{ color: '#3d5080' }}>{k}</span>
                <span style={{
                  color: '#c8d8f0',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 11,
                }}>{String(v)}</span>
              </div>
            ))}
            <div style={{ fontSize: 10.5, color: '#3d5080', marginTop: 6 }}>
              {propEdges.filter(e =>
                e.source === selectedNode.id || e.target === selectedNode.id
              ).length} connections
            </div>
          </motion.div>
        )}

        {/* Legend */}
        <div style={{
          position: 'absolute', bottom: 10, left: 12,
          display: 'flex', gap: 10, flexWrap: 'wrap',
        }}>
          {Object.entries({
            ip:'#ff8c00', host:'#00e5ff', user:'#00ff88',
            hash:'#a855f7', alert:'#ff2d6d', domain:'#ff8c00',
          }).map(([type, color]) => (
            <div key={type} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 9.5, color: '#6b7fa3',
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                border: `2px solid ${color}`, background: `${color}20`,
              }} />
              {type}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}