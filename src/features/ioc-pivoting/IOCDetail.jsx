import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Copy, ExternalLink, Shield, AlertTriangle,
  Globe, Hash, Link, Search, CheckCircle, X,
} from 'lucide-react';

const TYPE_ICONS = {
  ip: Globe, hash: Hash, url: Link,
  domain: Globe, default: Shield,
};

export default function IOCDetail({ ioc, onClose, onPivot }) {
  const [copied, setCopied] = useState(false);

  if (!ioc) return null;

  const Icon = TYPE_ICONS[ioc.type] || TYPE_ICONS.default;
  const confColor = ioc.confidence >= 90 ? '#ff2d6d'
    : ioc.confidence >= 70 ? '#ff8c00'
    : ioc.confidence >= 50 ? '#ffd600'
    : '#6b7fa3';

  const copy = () => {
    navigator.clipboard?.writeText(ioc.value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const PIVOT_OPTIONS = [
    { label: 'Find related alerts',     action: 'alerts'    },
    { label: 'Find related cases',      action: 'cases'     },
    { label: 'Expand in graph',         action: 'graph'     },
    { label: 'Hunt in Wazuh logs',      action: 'hunt'      },
    { label: 'Submit to MISP',          action: 'misp'      },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'rgba(13,21,48,0.97)',
        border: `1px solid ${confColor}30`,
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '12px 14px',
        borderBottom: '1px solid #1a2744',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'rgba(0,229,255,0.08)',
          border: '1px solid rgba(0,229,255,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={14} color="#00e5ff" />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 12.5, color: '#e8f4ff',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {ioc.value}
          </div>
          <div style={{ fontSize: 10.5, color: '#3d5080', marginTop: 2 }}>
            {ioc.type?.toUpperCase()} · {ioc.threat_type}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button onClick={copy} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: copied ? '#00ff88' : '#3d5080',
          }}>
            {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
          </button>
          {onClose && (
            <button onClick={onClose} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#3d5080',
            }}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Confidence */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid #1a2744' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: '#3d5080' }}>Confidence</span>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 18, fontWeight: 700, color: confColor,
          }}>
            {ioc.confidence}%
          </span>
        </div>
        <div style={{
          height: 4, background: '#1a2744', borderRadius: 999, overflow: 'hidden',
        }}>
          <motion.div
            style={{ height: '100%', background: confColor, borderRadius: 999 }}
            initial={{ width: 0 }}
            animate={{ width: `${ioc.confidence}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>
      </div>

      {/* Details grid */}
      <div style={{
        padding: '12px 14px',
        borderBottom: '1px solid #1a2744',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
      }}>
        {[
          ['Source',    ioc.source],
          ['Country',   ioc.country  || '—'],
          ['ISP',       ioc.isp      || '—'],
          ['Reports',   ioc.reports  ?? '—'],
          ['First Seen',new Date(ioc.first_seen || Date.now()).toLocaleDateString()],
          ['Status',    ioc.blocked ? 'BLOCKED' : 'ACTIVE'],
        ].map(([k, v]) => (
          <div key={k} style={{
            background: 'rgba(0,0,0,0.2)', borderRadius: 6,
            padding: '7px 9px',
          }}>
            <div style={{ fontSize: 9.5, color: '#3d5080', marginBottom: 3 }}>{k}</div>
            <div style={{
              fontSize: 11.5, color: k === 'Status'
                ? (ioc.blocked ? '#00ff88' : '#ff2d6d')
                : '#c8d8f0',
              fontFamily: 'JetBrains Mono, monospace',
            }}>{String(v)}</div>
          </div>
        ))}
      </div>

      {/* MITRE */}
      {ioc.mitre?.length > 0 && (
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #1a2744' }}>
          <div style={{ fontSize: 10.5, color: '#3d5080', marginBottom: 6 }}>MITRE</div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {ioc.mitre.map(t => (
              <span key={t} className="mitre-tag">{t}</span>
            ))}
          </div>
        </div>
      )}

      {/* Pivot actions */}
      <div style={{ padding: '10px 14px' }}>
        <div style={{ fontSize: 10.5, color: '#3d5080', marginBottom: 8 }}>
          Pivot Actions
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {PIVOT_OPTIONS.map(opt => (
            <button key={opt.action}
              onClick={() => onPivot?.(ioc, opt.action)}
              style={{
                background: 'rgba(0,229,255,0.05)',
                border: '1px solid rgba(0,229,255,0.12)',
                borderRadius: 6, padding: '7px 10px',
                cursor: 'pointer', textAlign: 'left',
                color: '#c8d8f0', fontSize: 12,
                transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: 7,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(0,229,255,0.12)';
                e.currentTarget.style.color = '#00e5ff';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(0,229,255,0.05)';
                e.currentTarget.style.color = '#c8d8f0';
              }}
            >
              <Search size={11} />
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}