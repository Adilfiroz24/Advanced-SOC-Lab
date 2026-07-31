import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Server, Monitor, Shield, AlertTriangle,
  CheckCircle, ChevronDown, ChevronUp,
  Cpu, HardDrive, Wifi, Clock, Tag,
} from 'lucide-react';

const OS_ICON = {
  windows: Monitor,
  linux:   Server,
  macos:   Monitor,
};

const STATUS_CONFIG = {
  active:       { color:'#00ff88', label:'Active',       dot:true  },
  disconnected: { color:'#ff8c00', label:'Disconnected', dot:false },
  critical:     { color:'#ff2d6d', label:'Critical',     dot:true  },
  pending:      { color:'#ffd600', label:'Pending',      dot:false },
};

export default function EndpointCard({ endpoint }) {
  const [expanded, setExpanded] = useState(false);

  const OsIcon  = OS_ICON[endpoint.os?.toLowerCase()] || Server;
  const status  = STATUS_CONFIG[endpoint.status] || STATUS_CONFIG.pending;
  const criticalityColor = {
    critical:'#ff2d6d', high:'#ff8c00',
    medium:'#ffd600',   low:'#00ff88',
  }[endpoint.criticality] || '#6b7fa3';

  return (
    <motion.div
      className="glass-card"
      style={{
        padding:0, overflow:'hidden',
        borderLeft:`3px solid ${status.color}`,
      }}
      whileHover={{ borderColor: status.color }}
      transition={{ duration:0.15 }}
    >
      {/* ── Main row ────────────────────────────────── */}
      <div
        onClick={() => setExpanded(p => !p)}
        style={{
          padding:'14px 16px', cursor:'pointer',
          display:'flex', alignItems:'flex-start', gap:12,
        }}
      >
        {/* OS icon */}
        <div style={{
          width:38, height:38, borderRadius:9, flexShrink:0,
          background:`${status.color}10`,
          border:`1px solid ${status.color}28`,
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <OsIcon size={17} color={status.color} />
        </div>

        {/* Name + IP */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{
            display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap',
          }}>
            <span style={{ fontSize:14, fontWeight:600, color:'#e8f4ff' }}>
              {endpoint.hostname}
            </span>
            {/* Status */}
            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
              {status.dot && (
                <div style={{
                  width:6, height:6, borderRadius:'50%',
                  background:status.color,
                  boxShadow:`0 0 5px ${status.color}`,
                  animation:'ping 1.5s ease-out infinite',
                }} />
              )}
              <span style={{
                fontSize:10.5, color:status.color,
                fontFamily:'JetBrains Mono,monospace',
                fontWeight:600,
              }}>{status.label}</span>
            </div>

            {/* Criticality badge */}
            <span style={{
              fontSize:9.5, fontWeight:700, color:criticalityColor,
              background:`${criticalityColor}15`,
              border:`1px solid ${criticalityColor}30`,
              borderRadius:4, padding:'1px 7px',
              textTransform:'uppercase', letterSpacing:'0.05em',
              fontFamily:'JetBrains Mono,monospace',
            }}>{endpoint.criticality}</span>

            {/* Wazuh agent badge */}
            {endpoint.wazuhAgent && (
              <span style={{
                fontSize:9.5, color:'#00e5ff',
                background:'rgba(0,229,255,0.08)',
                border:'1px solid rgba(0,229,255,0.20)',
                borderRadius:4, padding:'1px 7px',
                fontFamily:'JetBrains Mono,monospace',
              }}>Wazuh Agent</span>
            )}
          </div>

          <div style={{
            display:'flex', gap:12, fontSize:11.5, color:'#6b7fa3', flexWrap:'wrap',
          }}>
            <span style={{ fontFamily:'JetBrains Mono,monospace', color:'#c8d8f0' }}>
              {endpoint.ip}
            </span>
            <span>{endpoint.os} {endpoint.osVersion}</span>
            <span>·</span>
            <span>{endpoint.department}</span>
            <span>·</span>
            <span>Last seen: {endpoint.lastSeen}</span>
          </div>
        </div>

        {/* Right: alert count + expand */}
        <div style={{
          display:'flex', flexDirection:'column',
          alignItems:'flex-end', gap:8, flexShrink:0,
        }}>
          {endpoint.alertCount > 0 && (
            <div style={{
              fontFamily:'JetBrains Mono,monospace',
              fontSize:16, fontWeight:700,
              color: endpoint.alertCount >= 5 ? '#ff2d6d'
                   : endpoint.alertCount >= 2 ? '#ff8c00'
                   : '#ffd600',
            }}>
              {endpoint.alertCount}
              <span style={{ fontSize:10, color:'#6b7fa3', fontWeight:400 }}>
                {' '}alerts
              </span>
            </div>
          )}
          <div style={{ color:'#3d5080' }}>
            {expanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
          </div>
        </div>
      </div>

      {/* ── Expanded detail ─────────────────────────── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height:0, opacity:0 }}
            animate={{ height:'auto', opacity:1 }}
            exit={{ height:0, opacity:0 }}
            transition={{ duration:0.2 }}
            style={{ overflow:'hidden' }}
          >
            <div style={{
              borderTop:'1px solid #1a2744',
              padding:'14px 16px',
            }}>
              <div style={{
                display:'grid', gridTemplateColumns:'repeat(3,1fr)',
                gap:'10px 20px', marginBottom:12,
              }}>
                {[
                  { icon:Cpu,       label:'CPU',       value:endpoint.cpu       || '—' },
                  { icon:HardDrive, label:'Memory',    value:endpoint.memory    || '—' },
                  { icon:HardDrive, label:'Disk',      value:endpoint.disk      || '—' },
                  { icon:Wifi,      label:'MAC',       value:endpoint.mac       || '—' },
                  { icon:Shield,    label:'Agent ID',  value:endpoint.agentId   || '—' },
                  { icon:Clock,     label:'Enrolled',  value:endpoint.enrolled  || '—' },
                ].map(({ icon: Ic, label, value }) => (
                  <div key={label} style={{
                    background:'rgba(0,0,0,0.2)',
                    border:'1px solid #1a2744', borderRadius:6,
                    padding:'8px 10px',
                    display:'flex', alignItems:'center', gap:7,
                  }}>
                    <Ic size={12} color="#3d5080" />
                    <div>
                      <div style={{ fontSize:9.5, color:'#3d5080', marginBottom:2 }}>
                        {label}
                      </div>
                      <div style={{
                        fontSize:11.5, color:'#c8d8f0',
                        fontFamily:'JetBrains Mono,monospace',
                      }}>{value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tags */}
              {endpoint.tags?.length > 0 && (
                <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:10 }}>
                  <Tag size={11} color="#3d5080" style={{ marginTop:2 }} />
                  {endpoint.tags.map(t => (
                    <span key={t} style={{
                      fontSize:10.5, color:'#6b7fa3',
                      background:'rgba(74,96,144,0.12)',
                      border:'1px solid rgba(74,96,144,0.22)',
                      borderRadius:4, padding:'1px 7px',
                    }}>#{t}</span>
                  ))}
                </div>
              )}

              {/* Vuln + patch status */}
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                {[
                  {
                    label:'Open Vulnerabilities',
                    value:endpoint.vulns ?? 0,
                    color:endpoint.vulns > 0 ? '#ff2d6d' : '#00ff88',
                  },
                  {
                    label:'Patch Status',
                    value:endpoint.patchStatus || 'Unknown',
                    color:endpoint.patchStatus==='Current'
                      ? '#00ff88' : '#ff8c00',
                  },
                  {
                    label:'Compliance',
                    value:endpoint.compliance || '—',
                    color:'#00e5ff',
                  },
                ].map(item => (
                  <div key={item.label} style={{
                    background:'rgba(0,0,0,0.2)',
                    border:'1px solid #1a2744', borderRadius:6,
                    padding:'7px 12px',
                  }}>
                    <div style={{ fontSize:9.5, color:'#3d5080', marginBottom:2 }}>
                      {item.label}
                    </div>
                    <div style={{
                      fontSize:13, fontWeight:600, color:item.color,
                      fontFamily:'JetBrains Mono,monospace',
                    }}>{String(item.value)}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}