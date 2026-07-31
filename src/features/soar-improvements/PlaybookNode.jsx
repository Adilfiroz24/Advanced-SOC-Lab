import React from 'react';
import {
  Play, Shield, Zap, Globe,
  AlertTriangle, CheckCircle, Clock,
  Lock, MessageSquare, Mail,
} from 'lucide-react';

const NODE_TYPES = {
  trigger:   { icon:Play,           color:'#00e5ff', label:'TRIGGER'   },
  condition: { icon:AlertTriangle,   color:'#ffd600', label:'CONDITION' },
  action:    { icon:Zap,             color:'#00ff88', label:'ACTION'    },
  enrichment:{ icon:Globe,           color:'#ff8c00', label:'ENRICH'    },
  approval:  { icon:CheckCircle,     color:'#a855f7', label:'APPROVAL'  },
  delay:     { icon:Clock,           color:'#6b7fa3', label:'DELAY'     },
  block:     { icon:Lock,            color:'#ff2d6d', label:'BLOCK'     },
  notify:    { icon:MessageSquare,   color:'#ff8c00', label:'NOTIFY'    },
  email:     { icon:Mail,            color:'#00e5ff', label:'EMAIL'     },
  end:       { icon:Shield,          color:'#6b7fa3', label:'END'       },
};

export default function PlaybookNode({ node, isSelected, onClick }) {
  const cfg   = NODE_TYPES[node.type] || NODE_TYPES.action;
  const Icon  = cfg.icon;
  const color = cfg.color;

  return (
    <div
      onClick={() => onClick?.(node)}
      style={{
        display:      'flex',
        alignItems:   'center',
        gap:          10,
        padding:      '10px 14px',
        borderRadius: 9,
        cursor:       'pointer',
        background:   isSelected ? `${color}12` : 'rgba(13,21,48,0.80)',
        border:       `1px solid ${isSelected ? color + '50' : '#1a2744'}`,
        borderLeft:   `3px solid ${color}`,
        transition:   'all 0.15s',
        minWidth:     220,
      }}
      onMouseEnter={e => {
        if (!isSelected) e.currentTarget.style.borderColor = `${color}35`;
      }}
      onMouseLeave={e => {
        if (!isSelected) e.currentTarget.style.borderColor = '#1a2744';
      }}
    >
      <div style={{
        width: 30, height: 30, borderRadius: 7, flexShrink: 0,
        background: `${color}14`,
        border: `1px solid ${color}28`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={13} color={color} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2,
        }}>
          <span style={{
            fontSize: 9, fontWeight: 700, color,
            fontFamily: 'JetBrains Mono, monospace',
            letterSpacing: '0.06em',
          }}>{cfg.label}</span>
          {node.status === 'completed' && (
            <CheckCircle size={11} color="#00ff88" />
          )}
          {node.status === 'pending_approval' && (
            <Clock size={11} color="#ffd600" />
          )}
        </div>
        <div style={{
          fontSize: 12.5, fontWeight: 500, color: '#e8f4ff',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {node.title}
        </div>
        {node.description && (
          <div style={{
            fontSize: 10.5, color: '#6b7fa3', marginTop: 2,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {node.description}
          </div>
        )}
      </div>

      {/* Result indicator */}
      {node.result && (
        <div style={{
          fontSize: 9.5, color: node.result === 'pass' ? '#00ff88' : '#ff2d6d',
          fontFamily: 'JetBrains Mono, monospace',
          flexShrink: 0,
        }}>
          {node.result === 'pass' ? 'PASS' : 'FAIL'}
        </div>
      )}
    </div>
  );
}