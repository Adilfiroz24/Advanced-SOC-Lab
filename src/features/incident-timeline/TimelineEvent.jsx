import React from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle, Shield, Network, User,
  FileText, Zap, Eye, Lock, Terminal,
} from 'lucide-react';

const TYPE_ICONS = {
  alert:      AlertTriangle,
  detection:  Shield,
  network:    Network,
  user:       User,
  file:       FileText,
  automation: Zap,
  recon:      Eye,
  auth:       Lock,
  execution:  Terminal,
};

const SEV_COLOR = {
  critical: '#ff2d6d',
  high:     '#ff8c00',
  medium:   '#ffd600',
  low:      '#00ff88',
  info:     '#00e5ff',
};

export default function TimelineEvent({ event, index, isLast, onClick, isSelected }) {
  const Icon  = TYPE_ICONS[event.type] || Shield;
  const color = SEV_COLOR[event.severity] || '#6b7fa3';

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.04 }}
      style={{ display: 'flex', gap: 0, position: 'relative' }}
    >
      {/* Left column: time + connector */}
      <div style={{
        width: 90, flexShrink: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'flex-end', paddingRight: 16,
        paddingTop: 4,
      }}>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 10.5, color: '#3d5080',
          lineHeight: 1.4, textAlign: 'right',
        }}>
          {new Date(event.timestamp).toLocaleTimeString()}
        </div>
        <div style={{
          fontSize: 9.5, color: '#243660',
          textAlign: 'right',
        }}>
          {new Date(event.timestamp).toLocaleDateString()}
        </div>
      </div>

      {/* Center: dot + vertical line */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', width: 32, flexShrink: 0,
      }}>
        {/* Dot */}
        <motion.div
          whileHover={{ scale: 1.3 }}
          style={{
            width: 30, height: 30,
            borderRadius: '50%',
            background: `${color}18`,
            border: `2px solid ${color}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: isSelected ? `0 0 14px ${color}` : `0 0 6px ${color}50`,
            zIndex: 1, flexShrink: 0,
            transition: 'box-shadow 0.15s',
          }}
          onClick={() => onClick(event)}
        >
          <Icon size={13} color={color} />
        </motion.div>

        {/* Connector line */}
        {!isLast && (
          <div style={{
            width: 2, flex: 1, minHeight: 20,
            background: 'linear-gradient(to bottom, #1a2744, transparent)',
            marginTop: 4,
          }} />
        )}
      </div>

      {/* Right: event card */}
      <div style={{ flex: 1, paddingLeft: 14, paddingBottom: isLast ? 0 : 20 }}>
        <motion.div
          whileHover={{
            borderColor: `${color}40`,
            boxShadow: `0 0 14px ${color}12`,
          }}
          style={{
            background: isSelected
              ? `${color}0a`
              : 'rgba(13,21,48,0.65)',
            border: `1px solid ${isSelected ? color + '40' : '#1a2744'}`,
            borderRadius: 10,
            padding: '10px 14px',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onClick={() => onClick(event)}
        >
          {/* Title row */}
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', gap: 8,
          }}>
            <div style={{
              fontSize: 13, fontWeight: 600, color: '#e8f4ff',
              flex: 1, overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {event.title}
            </div>
            <span style={{
              fontSize: 9.5, fontWeight: 700,
              color, background: `${color}15`,
              border: `1px solid ${color}30`,
              borderRadius: 4, padding: '1px 7px',
              textTransform: 'uppercase', letterSpacing: '0.06em',
              fontFamily: 'JetBrains Mono, monospace',
              flexShrink: 0,
            }}>
              {event.severity}
            </span>
          </div>

          {/* Description */}
          <div style={{
            fontSize: 11.5, color: '#6b7fa3',
            marginTop: 4, lineHeight: 1.5,
          }}>
            {event.description.slice(0, 100)}
            {event.description.length > 100 ? '…' : ''}
          </div>

          {/* Meta row */}
          <div style={{
            display: 'flex', gap: 10, marginTop: 6,
            fontSize: 10.5, color: '#3d5080', flexWrap: 'wrap',
          }}>
            {event.agent && (
              <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                {event.agent}
              </span>
            )}
            {event.src_ip && (
              <><span>·</span>
              <span style={{
                fontFamily: 'JetBrains Mono, monospace', color: '#ff8c00',
              }}>{event.src_ip}</span></>
            )}
            {event.mitre?.length > 0 && (
              <><span>·</span>
              {event.mitre.map(t => (
                <span key={t} className="mitre-tag">{t}</span>
              ))}</>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}