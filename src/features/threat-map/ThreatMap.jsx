import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, ZoomIn, ZoomOut, RefreshCw,
  AlertTriangle, Shield, Activity, Filter,
} from 'lucide-react';
import AnimatedAttackLine from './AnimatedAttackLine';

// ── Attack data ───────────────────────────────────────────
// Each attack maps a real-world origin to the lab target.
// Coordinates are [longitude, latitude].
const ATTACKS = [
  {
    id: 1, src: 'Moscow, Russia',   srcCoord: [37.62, 55.75],
    dst: 'Lab Server',              dstCoord: [-74.00, 40.71],
    type: 'SSH Brute Force', severity: 'high',    count: 47,
    ip: '203.0.113.45',     color: '#ff8c00',
    mitre: 'T1110.001',
  },
  {
    id: 2, src: 'Beijing, China',   srcCoord: [116.40, 39.90],
    dst: 'Lab Server',              dstCoord: [-74.00, 40.71],
    type: 'Log4Shell Exploit', severity: 'critical', count: 3,
    ip: '198.51.100.99',    color: '#ff2d6d',
    mitre: 'T1190',
  },
  {
    id: 3, src: 'São Paulo, Brazil', srcCoord: [-46.63, -23.55],
    dst: 'Lab Server',               dstCoord: [-74.00, 40.71],
    type: 'RDP Brute Force',  severity: 'high',    count: 12,
    ip: '203.0.113.78',     color: '#ff8c00',
    mitre: 'T1110.001',
  },
  {
    id: 4, src: 'Bucharest, Romania', srcCoord: [26.10, 44.43],
    dst: 'Honeypot',                  dstCoord: [-74.00, 40.71],
    type: 'Honeypot SSH',     severity: 'critical', count: 7,
    ip: '198.51.100.23',    color: '#ff2d6d',
    mitre: 'T1133',
  },
  {
    id: 5, src: 'Ashburn, USA',   srcCoord: [-77.49, 39.04],
    dst: 'Web Server',            dstCoord: [-74.00, 40.71],
    type: 'SQL Injection',  severity: 'medium',   count: 15,
    ip: '45.33.32.156',     color: '#ffd600',
    mitre: 'T1190',
  },
  {
    id: 6, src: 'Amsterdam, NL',  srcCoord: [4.89, 52.37],
    dst: 'Lab Server',            dstCoord: [-74.00, 40.71],
    type: 'C2 Beacon',      severity: 'critical', count: 2,
    ip: '5.79.71.225',      color: '#ff2d6d',
    mitre: 'T1071.001',
  },
  {
    id: 7, src: 'Lagos, Nigeria', srcCoord: [3.39, 6.46],
    dst: 'Email Gateway',         dstCoord: [-74.00, 40.71],
    type: 'Phishing',       severity: 'medium',   count: 5,
    ip: '197.210.79.12',    color: '#ffd600',
    mitre: 'T1566',
  },
  {
    id: 8, src: 'Seoul, S. Korea', srcCoord: [126.98, 37.57],
    dst: 'Lab Server',             dstCoord: [-74.00, 40.71],
    type: 'Port Scan',      severity: 'low',      count: 892,
    ip: '1.220.116.33',     color: '#00ff88',
    mitre: 'T1046',
  },
];

// ── Simple equirectangular projection ─────────────────────
// Maps lon/lat to SVG pixel coordinates within a viewBox.
function project(lon, lat, W = 900, H = 440) {
  const x = ((lon + 180) / 360) * W;
  const y = ((90 - lat) / 180) * H;
  return [x, y];
}

// ── World map SVG path (simplified continents) ────────────
// Approximate continent outlines for a clean dark-mode map.
const CONTINENTS = [
  // North America
  'M 95,90 L 120,75 L 175,70 L 200,80 L 210,110 L 190,140 L 165,165 L 135,175 L 110,160 L 85,130 Z',
  // South America
  'M 155,185 L 175,180 L 195,200 L 190,240 L 175,275 L 155,290 L 140,270 L 138,240 L 145,210 Z',
  // Europe
  'M 420,80 L 445,70 L 470,75 L 475,95 L 460,110 L 440,115 L 415,105 Z',
  // Africa
  'M 435,130 L 460,125 L 480,135 L 490,170 L 480,215 L 460,235 L 440,225 L 420,195 L 420,155 Z',
  // Asia
  'M 480,70 L 560,60 L 640,65 L 700,80 L 730,100 L 720,130 L 680,145 L 620,155 L 560,140 L 510,125 L 490,105 Z',
  // Australia
  'M 660,220 L 700,215 L 730,225 L 735,250 L 715,265 L 680,260 L 658,245 Z',
];

const SEV_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
const SEV_COLOR = { critical: '#ff2d6d', high: '#ff8c00', medium: '#ffd600', low: '#00ff88' };

export default function ThreatMap({ attacks = ATTACKS }) {
  const [selected,   setSelected]   = useState(null);
  const [sevFilter,  setSevFilter]  = useState('all');
  const [paused,     setPaused]     = useState(false);
  const W = 900, H = 440;

  const filtered = useMemo(() =>
    attacks.filter(a => sevFilter === 'all' || a.severity === sevFilter),
    [attacks, sevFilter]
  );

  // Lab target pixel position
  const [tx, ty] = project(-74.00, 40.71, W, H);

  // Stats
  const totalEvents   = attacks.reduce((s, a) => s + a.count, 0);
  const criticalCount = attacks.filter(a => a.severity === 'critical').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── Header ──────────────────────────────────── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', gap: 12, flexWrap: 'wrap',
      }}>
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 15, fontWeight: 600, color: '#e8f4ff',
          }}>
            <Globe size={16} color="#00e5ff" />
            Real-time Threat Map
            {!paused && (
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.4, repeat: Infinity }}
                style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: '#ff2d6d',
                  boxShadow: '0 0 8px rgba(255,45,109,0.7)',
                }}
              />
            )}
          </div>
          <div style={{ fontSize: 11.5, color: '#3d5080', marginTop: 3 }}>
            {filtered.length} active attack vectors · {totalEvents.toLocaleString()} total events
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Severity filter */}
          {['all', 'critical', 'high', 'medium', 'low'].map(s => (
            <button key={s} onClick={() => setSevFilter(s)} style={{
              padding: '3px 10px', borderRadius: 9999,
              fontSize: 11, cursor: 'pointer', border: '1px solid',
              background: sevFilter===s
                ? `${SEV_COLOR[s] || '#00e5ff'}18`
                : 'rgba(255,255,255,0.04)',
              color: sevFilter===s
                ? SEV_COLOR[s] || '#00e5ff'
                : '#6b7fa3',
              borderColor: sevFilter===s
                ? `${SEV_COLOR[s] || '#00e5ff'}40`
                : '#1a2744',
            }}>{s}</button>
          ))}
          <button className="btn-cyber btn-ghost"
            style={{ fontSize: 11.5, padding: '5px 10px' }}
            onClick={() => setPaused(p => !p)}>
            {paused ? <Activity size={13} /> : <Shield size={13} />}
            {paused ? 'Resume' : 'Pause'}
          </button>
        </div>
      </div>

      {/* ── Stats row ───────────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8,
      }}>
        {[
          { label: 'Attack Sources',  value: attacks.length,                      color: '#00e5ff' },
          { label: 'Critical Vectors',value: criticalCount,                       color: '#ff2d6d' },
          { label: 'Events (24h)',    value: totalEvents.toLocaleString(),         color: '#ff8c00' },
          { label: 'Techniques',      value: [...new Set(attacks.map(a=>a.mitre))].length, color:'#a855f7' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'rgba(0,0,0,0.2)', border: '1px solid #1a2744',
            borderRadius: 7, padding: '9px 12px', textAlign: 'center',
          }}>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 20, fontWeight: 700, color: s.color,
            }}>{s.value}</div>
            <div style={{ fontSize: 10, color: '#3d5080', marginTop: 2 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Map ─────────────────────────────────────── */}
      <div style={{
        background: 'rgba(5,9,22,0.95)',
        border: '1px solid #1a2744', borderRadius: 12,
        overflow: 'hidden', position: 'relative',
      }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ display: 'block', width: '100%' }}
        >
          {/* Ocean background */}
          <rect width={W} height={H} fill="rgba(5,9,22,0.95)" />

          {/* Graticule (lat/lon grid) */}
          {Array.from({ length: 18 }, (_, i) => (
            <line key={`v${i}`}
              x1={(i+1) * 50} y1={0} x2={(i+1)*50} y2={H}
              stroke="rgba(0,229,255,0.04)" strokeWidth={0.5}
            />
          ))}
          {Array.from({ length: 8 }, (_, i) => (
            <line key={`h${i}`}
              x1={0} y1={(i+1)*55} x2={W} y2={(i+1)*55}
              stroke="rgba(0,229,255,0.04)" strokeWidth={0.5}
            />
          ))}

          {/* Continents */}
          {CONTINENTS.map((d, i) => (
            <path key={i} d={d}
              fill="rgba(26,39,68,0.85)"
              stroke="rgba(36,54,96,0.8)"
              strokeWidth={0.8}
            />
          ))}

          {/* Attack lines */}
          {!paused && filtered.map(attack => {
            const [sx, sy] = project(attack.srcCoord[0], attack.srcCoord[1], W, H);
            return (
              <AnimatedAttackLine
                key={attack.id}
                x1={sx} y1={sy} x2={tx} y2={ty}
                color={attack.color}
                duration={2 + (attack.id % 3) * 0.5}
                active={!paused}
                opacity={selected ? (selected === attack.id ? 1 : 0.25) : 0.75}
              />
            );
          })}

          {/* Source dots */}
          {filtered.map(attack => {
            const [sx, sy] = project(attack.srcCoord[0], attack.srcCoord[1], W, H);
            const isSelected = selected === attack.id;
            return (
              <g key={`dot-${attack.id}`}
                style={{ cursor: 'pointer' }}
                onClick={() => setSelected(isSelected ? null : attack.id)}
              >
                {/* Pulse ring */}
                <circle cx={sx} cy={sy}
                  r={isSelected ? 12 : 8}
                  fill={`${attack.color}18`}
                  stroke={attack.color}
                  strokeWidth={isSelected ? 1.5 : 1}
                  strokeOpacity={0.5}
                >
                  {!paused && (
                    <animate attributeName="r"
                      values="4;12;4"
                      dur={`${2 + (attack.id % 3)}s`}
                      repeatCount="indefinite"
                    />
                  )}
                </circle>
                {/* Core dot */}
                <circle cx={sx} cy={sy} r={4}
                  fill={attack.color}
                  style={{
                    filter: `drop-shadow(0 0 4px ${attack.color})`,
                  }}
                />
                {/* Label */}
                <text x={sx} y={sy - 10}
                  textAnchor="middle"
                  style={{
                    fontSize: isSelected ? 10 : 9,
                    fontFamily: 'JetBrains Mono, monospace',
                    fill: attack.color,
                    opacity: isSelected ? 1 : 0.8,
                  }}
                >
                  {attack.ip}
                </text>
              </g>
            );
          })}

          {/* Target — lab server */}
          <g>
            <circle cx={tx} cy={ty} r={10}
              fill="rgba(0,229,255,0.15)"
              stroke="#00e5ff" strokeWidth={2}
              style={{ filter: 'drop-shadow(0 0 8px #00e5ff)' }}
            />
            <circle cx={tx} cy={ty} r={4}
              fill="#00e5ff"
              style={{ filter: 'drop-shadow(0 0 6px #00e5ff)' }}
            />
            <text x={tx} y={ty + 20}
              textAnchor="middle"
              style={{
                fontSize: 9.5,
                fontFamily: 'JetBrains Mono, monospace',
                fill: '#00e5ff', fontWeight: 700,
              }}
            >
              LAB TARGET
            </text>
          </g>
        </svg>

        {/* ── Selected attack detail popup ─────────── */}
        <AnimatePresence>
          {selected !== null && (() => {
            const attack = attacks.find(a => a.id === selected);
            if (!attack) return null;
            return (
              <motion.div
                key={selected}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                style={{
                  position: 'absolute', bottom: 14, left: 14,
                  background: 'rgba(10,15,30,0.97)',
                  border: `1px solid ${attack.color}40`,
                  borderRadius: 10, padding: '12px 14px',
                  minWidth: 220,
                  boxShadow: `0 4px 20px rgba(0,0,0,0.6)`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: 8 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: attack.color,
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>{attack.severity}</span>
                  <button onClick={() => setSelected(null)} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#3d5080', fontSize: 14, padding: 0,
                  }}>✕</button>
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: '#e8f4ff',
                  marginBottom: 8 }}>{attack.type}</div>
                {[
                  ['Source',  attack.src],
                  ['IP',      attack.ip],
                  ['Events',  attack.count.toLocaleString()],
                  ['MITRE',   attack.mitre],
                ].map(([k,v]) => (
                  <div key={k} style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: 11.5, marginBottom: 5,
                    borderBottom: '1px solid #1a2744', paddingBottom: 5,
                  }}>
                    <span style={{ color: '#3d5080' }}>{k}</span>
                    <span style={{
                      color: k==='MITRE' ? '#a855f7' : '#c8d8f0',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 11,
                    }}>{v}</span>
                  </div>
                ))}
              </motion.div>
            );
          })()}
        </AnimatePresence>

        {/* Legend */}
        <div style={{
          position: 'absolute', bottom: 14, right: 14,
          display: 'flex', flexDirection: 'column', gap: 5,
          background: 'rgba(10,15,30,0.85)',
          border: '1px solid #1a2744', borderRadius: 8,
          padding: '8px 12px',
        }}>
          {Object.entries(SEV_COLOR).map(([sev, color]) => (
            <div key={sev} style={{
              display: 'flex', alignItems: 'center', gap: 7,
              fontSize: 10.5, color: '#6b7fa3',
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: color,
                boxShadow: `0 0 4px ${color}`,
              }} />
              {sev}
            </div>
          ))}
        </div>
      </div>

      {/* ── Attack list ─────────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8,
      }}>
        {filtered.map(attack => (
          <motion.div
            key={attack.id}
            whileHover={{ borderColor: `${attack.color}40` }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
              background: selected===attack.id
                ? `${attack.color}0a`
                : 'rgba(13,21,48,0.65)',
              border: `1px solid ${selected===attack.id
                ? attack.color+'40'
                : '#1a2744'}`,
              transition: 'all 0.15s',
            }}
            onClick={() => setSelected(
              selected===attack.id ? null : attack.id
            )}
          >
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: attack.color, flexShrink: 0,
              boxShadow: `0 0 6px ${attack.color}`,
            }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 12.5, color: '#e8f4ff', fontWeight: 500,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{attack.type}</div>
              <div style={{ fontSize: 11, color: '#3d5080', marginTop: 2 }}>
                {attack.src}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 12, color: attack.color,
              }}>
                {attack.count.toLocaleString()}
              </div>
              <span className="mitre-tag" style={{ fontSize: 9 }}>
                {attack.mitre}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}