import React from 'react';

const RELATION_COLOR = {
  'connected_to': '#00e5ff',
  'resolved_to':  '#ff8c00',
  'dropped':      '#ff2d6d',
  'executed':     '#a855f7',
  'created':      '#ffd600',
  'accessed':     '#ff8c00',
  'belongs_to':   '#00ff88',
  'default':      '#243660',
};

export default function GraphEdge({ edge, sourceX, sourceY, targetX, targetY }) {
  const color = RELATION_COLOR[edge.relation] || RELATION_COLOR.default;

  // Midpoint for label
  const mx = (sourceX + targetX) / 2;
  const my = (sourceY + targetY) / 2;

  // Slight curve
  const dx  = targetX - sourceX;
  const dy  = targetY - sourceY;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const cx  = mx - (dy / len) * 30;
  const cy  = my + (dx / len) * 30;

  return (
    <g>
      <path
        d={`M ${sourceX} ${sourceY} Q ${cx} ${cy} ${targetX} ${targetY}`}
        fill="none"
        stroke={color}
        strokeWidth={edge.weight || 1.5}
        strokeOpacity={0.65}
        markerEnd={`url(#arrow-${color.replace('#','')})`}
        style={{ transition: 'stroke-opacity 0.2s' }}
      />
      {/* Relation label */}
      <text
        x={cx} y={cy - 4}
        textAnchor="middle"
        style={{
          fontSize: 9,
          fontFamily: 'JetBrains Mono, monospace',
          fill: color,
          opacity: 0.85,
          pointerEvents: 'none',
        }}
      >
        {edge.relation}
      </text>
    </g>
  );
}