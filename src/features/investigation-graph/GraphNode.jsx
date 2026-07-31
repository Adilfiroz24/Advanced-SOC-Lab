import React from 'react';
import { motion } from 'framer-motion';
import {
  Globe, Hash, Server, User, FileText,
  Shield, AlertTriangle, Link,
} from 'lucide-react';

const TYPE_CONFIG = {
  ip:      { icon: Globe,         color: '#ff8c00', label: 'IP'      },
  hash:    { icon: Hash,          color: '#a855f7', label: 'Hash'    },
  host:    { icon: Server,        color: '#00e5ff', label: 'Host'    },
  user:    { icon: User,          color: '#00ff88', label: 'User'    },
  file:    { icon: FileText,      color: '#ffd600', label: 'File'    },
  alert:   { icon: AlertTriangle, color: '#ff2d6d', label: 'Alert'   },
  domain:  { icon: Globe,         color: '#ff8c00', label: 'Domain'  },
  url:     { icon: Link,          color: '#00e5ff', label: 'URL'     },
  default: { icon: Shield,        color: '#6b7fa3', label: 'Entity'  },
};

export default function GraphNode({
  node,
  x, y,
  isSelected,
  isDragging,
  onMouseDown,
  onClick,
}) {
  const cfg   = TYPE_CONFIG[node.type] || TYPE_CONFIG.default;
  const Icon  = cfg.icon;
  const color = node.color || cfg.color;
  const r     = node.type === 'alert' ? 32 : 26;

  return (
    <g
      transform={`translate(${x},${y})`}
      style={{ cursor: 'pointer' }}
      onMouseDown={onMouseDown}
      onClick={() => onClick(node)}
    >
      {/* Glow ring when selected */}
      {isSelected && (
        <circle r={r + 8} fill="none"
          stroke={color} strokeWidth={1.5}
          strokeOpacity={0.4}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      )}

      {/* Background circle */}
      <circle
        r={r}
        fill={`${color}18`}
        stroke={color}
        strokeWidth={isSelected ? 2.5 : 1.5}
        style={{
          filter: isDragging ? `drop-shadow(0 0 10px ${color})` : 'none',
          transition: 'stroke-width 0.15s',
        }}
      />

      {/* Icon — rendered as foreignObject for Lucide SVG icons */}
      <foreignObject
        x={-10} y={-10} width={20} height={20}
        style={{ overflow: 'visible', pointerEvents: 'none' }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 20, height: 20,
        }}>
          <Icon size={14} color={color} />
        </div>
      </foreignObject>

      {/* Label */}
      <text
        y={r + 14}
        textAnchor="middle"
        style={{
          fontSize: 10,
          fontFamily: 'JetBrains Mono, monospace',
          fill: '#c8d8f0',
          pointerEvents: 'none',
        }}
      >
        {node.label.length > 18
          ? node.label.slice(0, 16) + '…'
          : node.label}
      </text>

      {/* Type badge */}
      <text
        y={r + 25}
        textAnchor="middle"
        style={{
          fontSize: 8.5,
          fontFamily: 'JetBrains Mono, monospace',
          fill: color,
          pointerEvents: 'none',
          textTransform: 'uppercase',
        }}
      >
        {cfg.label}
      </text>

      {/* Count badge */}
      {node.count > 1 && (
        <g transform={`translate(${r - 6}, ${-r + 6})`}>
          <circle r={9} fill="#ff2d6d" />
          <text
            textAnchor="middle" dominantBaseline="middle"
            style={{ fontSize: 9, fill: '#fff', fontWeight: 700 }}
          >
            {node.count > 99 ? '99+' : node.count}
          </text>
        </g>
      )}
    </g>
  );
}